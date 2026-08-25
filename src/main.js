import { Buffer } from 'buffer';
import { marked } from 'marked';
import mermaid from 'mermaid';
import './styles.css';

globalThis.Buffer = Buffer;

const { default: matter } = await import('gray-matter');

const markdownModules = import.meta.glob(
  ['../README.md', '../CONTRIBUTING.md', '../PROJECT.md', '../blueprints/**/*.md', '../.github/**/*.md'],
  { query: '?raw', import: 'default', eager: true }
);

const documents = Object.entries(markdownModules)
  .map(([path, content]) => {
    const parsed = matter(content);
    return {
      path: path.replace(/^\.\//, ''),
      title: parsed.data.title || humanizePath(path),
      description: parsed.data.description || '',
      frontmatter: parsed.data,
      content: parsed.content,
    };
  })
  .sort((left, right) => left.path.localeCompare(right.path));

const app = document.querySelector('#app');

if (!app) {
  throw new Error('App container not found.');
}

marked.setOptions({
  breaks: true,
  gfm: true,
});

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'neutral',
});

const state = {
  activePath: documents[0]?.path ?? '',
};

app.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <p class="eyebrow">Blueprint Preview</p>
        <h1>Markdown viewer</h1>
        <p class="lede">
          Browse repository markdown files locally and render Mermaid diagrams in the browser.
        </p>
      </div>
      <input id="search" class="search" type="search" placeholder="Filter files" />
      <nav id="file-list" class="file-list" aria-label="Markdown files"></nav>
    </aside>
    <main class="workspace">
      <header class="doc-header">
        <div>
          <p id="doc-path" class="doc-path"></p>
          <h2 id="doc-title"></h2>
          <p id="doc-description" class="doc-description"></p>
        </div>
        <div id="doc-meta" class="doc-meta"></div>
      </header>
      <article id="content" class="content"></article>
    </main>
  </div>
`;

const fileList = document.querySelector('#file-list');
const searchInput = document.querySelector('#search');
const docPath = document.querySelector('#doc-path');
const docTitle = document.querySelector('#doc-title');
const docDescription = document.querySelector('#doc-description');
const docMeta = document.querySelector('#doc-meta');
const content = document.querySelector('#content');

function humanizePath(path) {
  return path
    .replace(/^\.\//, '')
    .replace(/\.md$/, '')
    .split('/')
    .pop()
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function renderFileList(filterText = '') {
  const normalizedFilter = filterText.trim().toLowerCase();
  const visibleDocuments = documents.filter((document) => {
    if (!normalizedFilter) {
      return true;
    }

    return [document.path, document.title, document.description]
      .join(' ')
      .toLowerCase()
      .includes(normalizedFilter);
  });

  fileList.innerHTML = visibleDocuments
    .map(
      (document) => `
        <button class="file-link${document.path === state.activePath ? ' active' : ''}" data-path="${escapeHtml(document.path)}">
          <span class="file-name">${escapeHtml(document.title)}</span>
          <span class="file-path">${escapeHtml(document.path)}</span>
        </button>
      `,
    )
    .join('');

  fileList.querySelectorAll('[data-path]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextPath = button.getAttribute('data-path');
      if (nextPath) {
        state.activePath = nextPath;
        window.location.hash = encodeURIComponent(nextPath);
        renderFileList(searchInput.value);
        renderDocument();
      }
    });
  });
}

async function renderDocument() {
  const documentData = documents.find((entry) => entry.path === state.activePath) ?? documents[0];

  if (!documentData) {
    content.innerHTML = '<p class="empty">No markdown files found.</p>';
    return;
  }

  state.activePath = documentData.path;

  docPath.textContent = documentData.path;
  docTitle.textContent = documentData.title;
  docDescription.textContent = documentData.description || 'No description available.';
  docMeta.innerHTML = renderMeta(documentData.frontmatter);

  content.innerHTML = marked.parse(documentData.content);
  transformMermaidBlocks(content);
  await mermaid.run({ nodes: content.querySelectorAll('.mermaid') });
}

function renderMeta(frontmatter) {
  const entries = [
    frontmatter.status && { label: 'Status', value: frontmatter.status },
    frontmatter.updated && { label: 'Updated', value: frontmatter.updated },
    frontmatter.difficulty && { label: 'Difficulty', value: frontmatter.difficulty },
    frontmatter.estimated_time && { label: 'Time', value: frontmatter.estimated_time },
  ].filter(Boolean);

  return entries
    .map(
      (entry) => `
        <div class="meta-chip">
          <span>${escapeHtml(entry.label)}</span>
          <strong>${escapeHtml(String(entry.value))}</strong>
        </div>
      `,
    )
    .join('');
}

function transformMermaidBlocks(container) {
  container.querySelectorAll('pre > code.language-mermaid').forEach((codeBlock) => {
    const pre = codeBlock.parentElement;
    if (!pre) {
      return;
    }

    const mermaidBlock = document.createElement('div');
    mermaidBlock.className = 'mermaid';
    mermaidBlock.textContent = codeBlock.textContent ?? '';
    pre.replaceWith(mermaidBlock);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

searchInput.addEventListener('input', () => {
  renderFileList(searchInput.value);
});

window.addEventListener('hashchange', () => {
  const nextPath = decodeURIComponent(window.location.hash.slice(1));
  if (nextPath) {
    state.activePath = nextPath;
    renderFileList(searchInput.value);
    renderDocument();
  }
});

const initialPath = decodeURIComponent(window.location.hash.slice(1));
if (initialPath) {
  state.activePath = initialPath;
}

renderFileList();
await renderDocument();
