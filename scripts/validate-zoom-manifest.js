#!/usr/bin/env node

require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");

const {
  ZOOM_ACCOUNT_ID,
  ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET,
} = process.env;

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function requireEnv(name, value) {
  if (!value) {
    fail(`Missing required environment variable: ${name}`);
  }
}

function getManifestPath() {
  const blueprintName = process.argv[2];

  if (!blueprintName) {
    fail(`
Blueprint name is required.

Usage:
  npm run validate-zoom-manifest -- <blueprint-name>

Example:
  npm run validate-zoom-manifest -- human-in-the-loop
`);
  }

  if (
    blueprintName.includes("..") ||
    blueprintName.includes("/") ||
    blueprintName.includes("\\")
  ) {
    fail(
      "Blueprint name must be a directory name only, for example: human-in-the-loop"
    );
  }

  return path.join(
    "blueprints",
    blueprintName,
    "manifest.json"
  );
}

function loadManifest(manifestPath) {
  const resolvedPath = path.resolve(
    process.cwd(),
    manifestPath
  );

  if (!fs.existsSync(resolvedPath)) {
    fail(`
Blueprint manifest not found.

Expected:
  ${manifestPath}
`);
  }

  let rawManifest;

  try {
    rawManifest = fs.readFileSync(
      resolvedPath,
      "utf8"
    );
  } catch (error) {
    fail(
      `Unable to read manifest file: ${error.message}`
    );
  }

  try {
<<<<<<< HEAD
    const manifestFile = JSON.parse(rawManifest);

    if (
      !manifestFile ||
      typeof manifestFile !== "object" ||
      Array.isArray(manifestFile) ||
      Object.keys(manifestFile).length === 0
=======
    const manifest = JSON.parse(rawManifest);

    if (
      !manifest ||
      typeof manifest !== "object" ||
      Array.isArray(manifest) ||
      Object.keys(manifest).length === 0
>>>>>>> eea6493 (Added Zoom  manifest vaildation script and CLI command)
    ) {
      fail(
        "Manifest file parsed successfully but contains no manifest data."
      );
    }

    console.log(
      `✓ JSON parsed successfully: ${manifestPath}`
    );

<<<<<<< HEAD
    return manifestFile;
=======
    return manifest;
>>>>>>> eea6493 (Added Zoom  manifest vaildation script and CLI command)
  } catch (error) {
    fail(
      `Manifest contains invalid JSON: ${error.message}`
    );
  }
}

<<<<<<< HEAD
function normalizeManifestPayload(manifestFile) {
  if (
    manifestFile.manifest &&
    typeof manifestFile.manifest === "object" &&
    !Array.isArray(manifestFile.manifest)
  ) {
    console.log(
      "✓ Manifest already contains top-level manifest wrapper"
    );

    return manifestFile;
  }

  console.log(
    "✓ Adding top-level manifest wrapper for validation"
  );

  return {
    manifest: manifestFile,
  };
}

=======
>>>>>>> eea6493 (Added Zoom  manifest vaildation script and CLI command)
async function getZoomAccessToken() {
  requireEnv(
    "ZOOM_ACCOUNT_ID",
    ZOOM_ACCOUNT_ID
  );

  requireEnv(
    "ZOOM_CLIENT_ID",
    ZOOM_CLIENT_ID
  );

  requireEnv(
    "ZOOM_CLIENT_SECRET",
    ZOOM_CLIENT_SECRET
  );

  const credentials = Buffer.from(
    `${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const tokenUrl = new URL(
    "https://zoom.us/oauth/token"
  );

  tokenUrl.searchParams.set(
    "grant_type",
    "account_credentials"
  );

  tokenUrl.searchParams.set(
    "account_id",
    ZOOM_ACCOUNT_ID
  );

  console.log(
    "→ Requesting Zoom access token..."
  );

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  let data;

  try {
    data = await response.json();
  } catch {
    fail(
      `Zoom OAuth returned an unreadable response (HTTP ${response.status})`
    );
  }

  if (!response.ok) {
<<<<<<< HEAD
    console.error(
      JSON.stringify(data, null, 2)
    );
=======
    console.error(data);
>>>>>>> eea6493 (Added Zoom  manifest vaildation script and CLI command)

    fail(
      `Unable to obtain Zoom access token (HTTP ${response.status})`
    );
  }

  if (!data.access_token) {
    fail(
      "Zoom OAuth response did not contain an access_token"
    );
  }

  console.log(
    "✓ Zoom access token acquired"
  );

  return data.access_token;
}

async function validateManifest(
  accessToken,
<<<<<<< HEAD
  manifestFile
) {
  const requestBody =
    normalizeManifestPayload(manifestFile);
=======
  manifest
) {
  const requestBody = {
    manifest,
  };
>>>>>>> eea6493 (Added Zoom  manifest vaildation script and CLI command)

  console.log(
    "→ Sending manifest to Zoom validation API..."
  );

  const response = await fetch(
    "https://api.zoom.us/v2/marketplace/apps/manifest/validate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  let result;

  try {
    result = await response.json();
  } catch {
    fail(
      `Zoom Manifest API returned an unreadable response (HTTP ${response.status})`
    );
  }

  if (!response.ok) {
    console.error(
      JSON.stringify(result, null, 2)
    );

    fail(
      `Zoom Manifest API request failed (HTTP ${response.status})`
    );
  }

  return result;
}

function printValidationErrors(result) {
  console.error(
    "\n❌ Zoom manifest validation failed\n"
  );

  if (result.error) {
    console.error(
      `Error: ${result.error}\n`
    );
  }

  if (
    Array.isArray(result.errors) &&
    result.errors.length > 0
  ) {
    result.errors.forEach(
      (error, index) => {
        console.error(
          `${index + 1}. ${
            error.message ||
            "Unknown validation error"
          }`
        );

        if (error.setting) {
          console.error(
            `   Setting: ${error.setting}`
          );
        }

        console.error("");
      }
    );
  } else {
    console.error(
      JSON.stringify(result, null, 2)
    );
  }
}

async function main() {
  console.log(
    "\nZoom Manifest Validator"
  );

  console.log(
    "-----------------------"
  );

<<<<<<< HEAD
  const blueprintName =
    process.argv[2];

  const manifestPath =
    getManifestPath();

=======
  const manifestPath =
    getManifestPath();

  const blueprintName =
    process.argv[2];

>>>>>>> eea6493 (Added Zoom  manifest vaildation script and CLI command)
  console.log(
    `Blueprint: ${blueprintName}`
  );

  console.log(
    `Manifest: ${manifestPath}\n`
  );

<<<<<<< HEAD
  const manifestFile =
=======
  const manifest =
>>>>>>> eea6493 (Added Zoom  manifest vaildation script and CLI command)
    loadManifest(manifestPath);

  const accessToken =
    await getZoomAccessToken();

  const result =
    await validateManifest(
      accessToken,
<<<<<<< HEAD
      manifestFile
=======
      manifest
>>>>>>> eea6493 (Added Zoom  manifest vaildation script and CLI command)
    );

  if (result.ok !== true) {
    printValidationErrors(result);

    process.exit(1);
  }

  console.log(
    "\n✅ Zoom manifest is valid.\n"
  );
}

main().catch((error) => {
  console.error(
    "\nUnexpected validation error:"
  );

  console.error(error);

  process.exit(1);
});