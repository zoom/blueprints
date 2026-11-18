---
title: "Build a secure scheduling and invite system"
slug: "videosdk-scheduling-and-invite"
description: >-
    Schedule Video SDK sessions and share secure invite links using the Video SDK REST APIs.
    Covers password and session storage, JWT signing, and host and guest access control.
products: ["video-sdk"]
verticals: ["apps"]
solution_types: ["security-encryption"]
author: "Ticorrian Heard"
status: "published"
hero_image: "images/hero.png"
updated: 2026-11-16
github_repo: "https://github.com/zoom/videosdk-scheduling-and-invite"
demo_url: "https://youtu.be/69n5W_BOX4U"
tags: ["scheduling", "security"]
seo_title: "Build a secure scheduling and invite system"
seo_keywords: ["zoom video sdk scheduling", "video sdk invite link", "video sdk rest api"]
license_required: false
stack: "Node · Express · React · TypeScript · Postgres"
deploy:
  - { label: "Render", url: "https://render.com/deploy?repo=https://github.com/zoom/videosdk-scheduling-and-invite" }
---

Video SDK sessions don't come with a built-in scheduler or invite flow. This blueprint
shows how to build one yourself: a signed-in host schedules a session through the
Video SDK REST API, shares a link, and guests join without ever seeing your credentials
or the session password.

<YouTube id="69n5W_BOX4U"/>

**What you'll need:**
- A Zoom Video SDK account with two sets of credentials ([Get credentials](https://developers.zoom.us/docs/video-sdk/get-credentials/)):
  - Video SDK credentials (SDK key and secret) for signing the JWT that joins a session
  - Video SDK REST API credentials (API key and secret) for creating and managing sessions
- Cloud recording added to your Video SDK account, if you use the auto-recording option
- A Postgres database and its connection string (the sample uses Neon; any Postgres works)
- Node.js 20 or later

## Features
- Email and password accounts with hashed passwords and hashed session tokens
- Scheduled sessions created through the Video SDK REST API
- Opaque invite links for hosts and guests
- Optional session password, waiting room (hold), and cloud recording per session

<Image src="images/scheduler.png" alt="Schedule a Zoom Session form with session name, password, agenda, date, time, timezone, duration, and recording and hold options" />

## Architecture

The React frontend never talks to Zoom directly. Every request goes through the Express
backend, which checks the user's login, reads and writes Neon, calls the Zoom REST API, and
signs the JWT the frontend needs to join.

```mermaid
flowchart TB
    A[React Frontend]
    B[Backend - Node/Express]
    C[(Neon Postgres)]
    D[Zoom Cloud - Video SDK REST API]
    E[Zoom Video SDK Session]

    A -- 1. Sign in / schedule --> B
    B -- 2. Users, sessions, invite IDs --> C
    B -- 3. Create / get / delete session --> D
    B -- 4. Invite link --> A
    A -- 5. Open invite link, request token --> B
    B -- 6. Signed JWT --> A
    A -- 7. client.join --> E
```

## Implementation Guide

### Backend Server Configuration - Database Security
HTTP is stateless: every request arrives with no memory of the previous one. If you sign in
on request 1, the server has no idea who you are on request 2. Browser sessions solve this:

1. You prove who you are (email and password).
2. The server gives you a ticket: a long random string.
3. Your browser shows the ticket on every later request.
4. The server looks the ticket up to see whose it is.

Both the password and the ticket are secrets, so neither is stored as-is. The sample uses
three tables: `users`, `auth_sessions`, and `meetings`.

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name     TEXT NOT NULL,
  user_email    TEXT NOT NULL,
  password_hash TEXT NOT NULL            -- salt:hash
);
CREATE UNIQUE INDEX users_email_key ON users (lower(user_email));

CREATE TABLE auth_sessions (
  token_hash TEXT PRIMARY KEY,           -- hash of the cookie, never the cookie
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE meetings (
  meeting_id       TEXT PRIMARY KEY,     -- session_id returned by the Video SDK REST API
  invite_id        TEXT NOT NULL UNIQUE, -- random ID used in invite links
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meeting_name     TEXT NOT NULL,        -- the Video SDK session name (tpc)
  meeting_password TEXT NOT NULL DEFAULT '',
  date_time        TIMESTAMPTZ NOT NULL,
  timezone         TEXT NOT NULL DEFAULT 'UTC',
  agenda           TEXT NOT NULL DEFAULT '',
  duration         INTEGER NOT NULL DEFAULT 30,
  auto_recording   BOOLEAN NOT NULL DEFAULT false,
  hold             INTEGER NOT NULL DEFAULT 0
);
```

The table is named `meetings` in the sample; each row is one scheduled Video SDK session. The schedule details (date, time, timezone, agenda, duration) and the invite ID are kept here. The sample creates all three tables on startup.

Keep `DATABASE_URL` on the server only, and always use parameterized queries (`$1`, `$2`) so user input is never concatenated into SQL.

### Storing Passwords
Don't store passwords as plaintext. If the database leaks, every user is exposed.

- Use a one-way hash. `scrypt` is deliberately slow, which makes password guessing expensive.
- Salt it: mix in 16 random bytes so identical passwords produce different hashes.
- Store `salt:hash` in the row tied to the user's email.

```js
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}
```

To verify, look up the stored `salt:hash` by email, hash the submitted password with that
same salt, and compare. If they match, the password is correct. Use `timingSafeEqual` for the comparison.

```js
async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}
```

### Storing Login Session Tokens
The login cookie gets the same treatment as a password: the server never keeps the raw value.

1. `randomBytes(32)` creates an unguessable 256-bit token.
2. The server stores the **hash** of the token in `auth_sessions`, with the user id and an expiry (7 days).
3. The raw token goes to the browser as a cookie.

```js
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

async function startSession(res, userId) {
  const token = randomBytes(32).toString('hex');
  await query('INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1,$2,$3)',
    [hashToken(token), userId, new Date(Date.now() + SESSION_MS)]);
  res.cookie('session_token', token, {
    httpOnly: true, sameSite: 'lax', maxAge: SESSION_MS, path: '/',
    secure: process.env.NODE_ENV === 'production',   // always true behind HTTPS
  });
}
```

On each request the browser sends the raw cookie. The server hashes it and looks for a
matching, unexpired row in `auth_sessions`. No row means `undefined` and a `401`. A match
returns the user, sets `req.user`, calls `next()`, and the route runs.

```js
export async function requireAuth(req, _res, next) {
  const user = await userFromRequest(req);   // hash cookie -> join users -> expires_at > now()
  if (!user) return next(new HttpError(401, 'Not signed in'));
  req.user = user;
  next();
}
```

### API Usage

#### Secure Server
All Zoom calls (REST API and JWT generation) happen on the backend. The frontend only receives the result.

#### Using Keystores in Production
Set credentials as variables in your host's secret store rather than files on disk. Examples:
Vercel Environment Variables, AWS Secrets Manager or SSM, GCP Secret Manager, Azure Key Vault,
or HashiCorp Vault. You get encryption at rest, access control, audit logs, and easy rotation.

For local development with a `.env` file:
- Restrict permissions with `chmod 600 .env`.
- Keep it out of Docker images. Add `.env` to `.dockerignore` and pass values at runtime.
- Never commit it to git.

#### Bearer Token Generation
The Video SDK REST API accepts a JWT as a bearer token. Generate it on the server for each request (or cache it until **shortly before** it expires).

- **Scope:** give your API credentials only the least privilege your requests need.
- **Frontend:** never bundle credentials into frontend code. Anything with a prefix like `VITE_` is shipped to the browser.
- **Logs:** never log your credentials or generated JWTs.

```js
function generateAPIJWT() {
  const iat = Math.round(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { iss: process.env.ZOOM_API_KEY, iat, exp };
  return KJUR.jws.JWS.sign('HS256', JSON.stringify(header), JSON.stringify(payload), process.env.ZOOM_API_SECRET);
}

const res = await fetch('https://api.zoom.us/v2/videosdk/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${generateAPIJWT()}` },
  body: JSON.stringify({ session_name, session_password, settings }),
});
```

#### JWT Generation
Use the [Video SDK key and secret](https://developers.zoom.us/docs/video-sdk/get-credentials/) only in the server runtime. The JWT the client uses to join a session uses the following claims (see [Authorize](https://developers.zoom.us/docs/video-sdk/auth/)):

| Claim       | Value                                                            |
| ----------- | ---------------------------------------------------------------- |
| `app_key`   | Your Zoom Video SDK key                                          |
| `tpc`       | The session name, matching the one passed to the SDK join function |
| `role_type` | Server-derived `1` for host or `0` for participant               |
| `version`   | `1`                                                              |
| `iat`       | Current server time with a small clock-skew allowance            |
| `exp`       | No more than two hours after issue in this architecture          |
| `hold`      | Optional. `0` no waiting room, `1` participants wait until a host admits them, `2` supported but off until a host turns it on. Taken from the session's stored setting |

This JWT is generated with a function similar to the one below:
```ts
function generateSignature(sessionName: string, role: number, hold = 0, expiresInHours = 2): string {
  const iat = Math.round(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * expiresInHours;
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    app_key: sdkKey,
    tpc: sessionName,
    role_type: role,
    hold,
    version: 1,
    iat,
    exp,
  };
  return KJUR.jws.JWS.sign('HS256', JSON.stringify(header), JSON.stringify(payload), sdkSecret);
}
```
**Do not expose your credentials to the client. When using the Video SDK in production, use a backend service to sign tokens. Do not store credentials in plain text.**

### Scheduling Sessions
A signed-in host fills out the scheduler (name, password, agenda, date, time, timezone, duration, waiting room, auto-recording). The server validates the input, creates the session with `POST /videosdk/sessions`, and saves the returned `session_id` in the database alongside the host's user id.

```js
router.post('/create-session', requireAuth, async (req, res) => {
  // ...validate sessionName (printable characters, max 200), agenda, hold (0, 1 or 2),
  //    startTime, and password (printable characters, max 10)
  const created = await createVideoSession(sessionName, password, {
    auto_recording: body.auto_recording ? 'cloud' : 'none',
    hold,
  });
  const record = { sessionId: created.session_id, inviteId: randomBytes(16).toString('base64url'), /* ... */ };
  await addSession(req.user.id, record);
  res.status(201).json(record);
});
```

#### Fetching Session Info
The session list combines your database records with session data from `GET /videosdk/sessions/{sessionId}?type=scheduled`. A session ID that contains `/` must be double URL-encoded in the path.

<Image src="images/meetinglist.png" alt="Scheduled Sessions list showing two sessions, each with a Join button and a delete button" />

- **Paginate** in the UI and API once a host has more than a handful of sessions, rather than fetching every session on each load.
- **Cache on the server.** Zoom rate-limits the REST API, so hold responses briefly (for example 30-60 seconds) and invalidate on create or delete. 
- Scope every query by `req.user.id` so hosts only ever see their own sessions.

#### Link Creation
The invite link is what you hand to people, so treat it as untrusted input when it comes back.

- **Domain ownership:** build links from your own domain (an `ENDPOINT_URL` setting) and serve it over HTTPS only.
- **Opaque invite ID:** use a unique, random invite ID mapped to the `sessionName` in your database. Don't put `sessionName`, password, or role in the link.
- **Query parameters:** keep them out of the link wherever possible. Anything in a URL ends up in browser history, logs, and referrers.
- **Role and session access:** the link identifies *which* session. The server decides *what access* the caller gets.
- **Rate limit** token generation per IP and per invite ID to stop invite-ID guessing.
- **Set `Cache-Control: no-store`** on any response that carries a token.

```js
export const buildGuestLink = (base, inviteId) => `${base}/s/${encodeURIComponent(inviteId)}`;
export const buildHostLink  = (base, inviteId) => `${buildGuestLink(base, inviteId)}/host`;

// 128 bits of randomness, URL safe
const inviteId = randomBytes(16).toString('base64url');
```

### Structuring Invitations
Give each session two links built from the same invite ID: a guest link (`/s/:inviteId`) and a host link (`/s/:inviteId/host`). The invite message shows only the guest link and details. The host link stays in the host's own scheduler view.

<Image src="images/invite.png" alt="Host link and invite text with the session name, date, time, timezone, password, and join link, each with a Copy button" />

Send the password through a different channel than the link. Whoever has only the link still needs the password.

### Securing Sessions

#### Secure Joining
The browser opens a link, posts the invite ID and a requested role to the server, and the server decides.

```js
router.post('/token', async (req, res) => {
  const inviteId = req.body?.inviteId;
  if (typeof inviteId !== 'string' || inviteId.length === 0 || inviteId.length > 128) {
    throw new HttpError(404, 'Invite not found');
  }
  const role = validateRole(req.body?.role);                  // must be exactly 0 or 1
  const invite = await findInvite(inviteId);
  if (!invite) throw new HttpError(404, 'Invite not found');  // unknown invite
  const token = generateSignature(invite.sessionName, role, invite.hold);

  if (role === 1) {                                           // host
    const user = await userFromRequest(req);
    if (!user) throw new HttpError(401, 'Sign in to join as host');
    if (user.user_email.toLowerCase() !== invite.ownerEmail.toLowerCase()) {
      throw new HttpError(403, 'This host link does not belong to your account');
    }
    return res.json({ token, sessionName: invite.sessionName, password: invite.password });
  }
  res.json({ token, sessionName: invite.sessionName, passwordRequired: invite.password !== '' });
});
```

- **Hosts** can only start a session as a signed-in user who owns it. That's also the only way to retrieve the host token and the password from the server.
- **Guests** get a `role_type: 0` token. If the session has a password, they're prompted for it at join, and Zoom checks it. The password is never included in the invite link or the guest response.

#### Secure Fetching of Session Data
- Put `requireAuth` on every route that lists, reads, or deletes sessions.
- Filter by the signed-in user's id, and return `404` (not `403`) for sessions they don't own, so IDs can't be probed.
- Return only what the UI needs. Never send `password_hash`, token hashes, or API credentials.
- Treat a Zoom `404` as "this session no longer exists" and clean up the matching row.

### Run the Sample

```bash
git clone https://github.com/zoom/videosdk-scheduling-and-invite
cd videosdk-scheduling-and-invite
npm install
cp .env.example .env
npm run dev
```

Set these values in `.env` before starting:

| Variable | Description |
|---|---|
| `ZOOM_VSDK_KEY` / `ZOOM_VSDK_SECRET` | Video SDK credentials used to sign the join JWT |
| `ZOOM_API_KEY` / `ZOOM_API_SECRET` | Video SDK REST API credentials used to create, read, and delete sessions |
| `ENDPOINT_URL` | Public base URL of your app, used to build invite links (`http://localhost:3000` locally; HTTPS in production) |
| `DATABASE_URL` | Postgres connection string |
| `PORT` | Optional; defaults to `3000` |

Open `http://localhost:3000`, create an account, and schedule a session on the **Schedule and Invite** tab. Copy the invite text for guests and keep the host link for yourself. On the **Scheduled Sessions** tab, choose **Join** to start a session as the host. In a second browser, open the guest link and enter the password if prompted.

## App Manifest

Video SDK apps are not configured through a Marketplace app manifest, so this blueprint has no `manifest.json`. The app authenticates with your Video SDK key and secret instead.

## Acceptance Criteria

**General**
- Credentials and JWTs are never logged or exposed to the frontend.
- `.env` is git-ignored, `chmod 600`, and excluded from Docker images; production uses a keystore.
- Properly implement the [Video SDK Session Lifecycle](https://developers.zoom.us/docs/video-sdk/web/sessions/).

**Server-side**
- Passwords are stored as salted `scrypt` hashes (`salt:hash`).
- Login tokens are stored as hashes with a 7-day expiry; cookie is `httpOnly`, `secure`, `sameSite`.
- Invite links use a random invite ID with no session name, password, or role.
- Host tokens require a signed-in owner; guest tokens never include the password.
- Token responses send `Cache-Control: no-store` and token routes are rate limited.
- Zoom responses are cached and session lists are paginated.

**Client-side**
- Guests are prompted for the password at join when the session requires one.
- No Zoom credentials appear in the client bundle (no `VITE_` secrets).

## Related Resources
- [Sample repository](https://github.com/zoom/videosdk-scheduling-and-invite)
- [Video SDK REST API](https://developers.zoom.us/docs/api/video-sdk/)
- [Video SDK authorization](https://developers.zoom.us/docs/video-sdk/auth/)
- [Zoom Video SDK for Web](https://developers.zoom.us/docs/video-sdk/web/)
- [Video SDK Session Lifecycle](https://developers.zoom.us/docs/video-sdk/web/sessions/)
- [Zoom Video SDK Agent Skills](https://github.com/zoom/skills/tree/main/skills/video-sdk)
- [Zoom Developer Forum](https://devforum.zoom.us/)
