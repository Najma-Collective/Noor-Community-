import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { JSDOM } from '../../sandbox/node_modules/jsdom/lib/api.js';
import { renderLessonDeckToHtml } from '../render/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXAMPLES_DIR = path.resolve(__dirname, 'examples');
const HTML_OUTPUT_DIR = path.resolve(__dirname, 'html');

const BASE_DECK_TEMPLATE = {
  id: 'ARCHETYPE.CANON',
  slug: 'archetype-reference',
  title: 'Archetype reference deck',
  language: 'en',
  version: '1.0.0',
  level: 'B2',
  assets: {
    cover_image: {
      type: 'image',
      src: 'https://placehold.co/1600x900/14532d/f1f5f9?text=Archetype+Reference',
      alt: 'Abstract shapes forming a collaborative circle',
    },
  },
  contributors: [{ name: 'Automation Toolkit', role: 'Generator' }],
};

const DEFAULT_PEXELS_KEY = 'ntFmvz0n4RpCRtHtRVV7HhAcbb4VQLwyEenPsqfIGdvpVvkgagK2dQEd';

function normalizeSlug(value) {
  return value.replace(/[^a-z0-9-]+/g, '-');
}

function clone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

async function* readSnippetFiles() {
  const entries = await fs.readdir(EXAMPLES_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
  for (const name of files) {
    yield path.resolve(EXAMPLES_DIR, name);
  }
}

function createDeckPayloadFromSnippet(snippet, index) {
  const slug = typeof snippet.slug === 'string' ? snippet.slug : `archetype-${index + 1}`;
  const deckId = `ARCHETYPE.${slug.replace(/[^A-Z0-9]+/gi, '_').toUpperCase()}`;
  const deckSlug = `archetype-${normalizeSlug(slug)}`;
  const deckTitle = snippet?.title?.text
    ? `${snippet.title.text} reference`
    : `${snippet.archetype} reference`;
  return {
    ...BASE_DECK_TEMPLATE,
    id: deckId,
    slug: deckSlug,
    title: deckTitle,
    slides: [clone(snippet)],
  };
}

async function ensureOutputDirectory() {
  await fs.mkdir(HTML_OUTPUT_DIR, { recursive: true });
}

async function renderSnippet(snippetPath, index, options) {
  const fileContents = await fs.readFile(snippetPath, 'utf8');
  const snippet = JSON.parse(fileContents);
  const deck = createDeckPayloadFromSnippet(snippet, index);
  const htmlDocument = await renderLessonDeckToHtml(deck, options);
  const dom = new JSDOM(htmlDocument);
  const stage = dom.window.document.querySelector('.slide-stage');
  if (!stage) {
    throw new Error(`Slide stage not found when rendering ${path.basename(snippetPath)}`);
  }
  stage.classList.remove('hidden');
  // Remove navigation controls that are injected after slides.
  const navControls = stage.querySelectorAll('.slide-nav-prev, .slide-nav-next');
  navControls.forEach((node) => node.remove());
  const sanitized = `${stage.outerHTML.trim()}\n`;
  const outputFile = path.resolve(
    HTML_OUTPUT_DIR,
    `${path.basename(snippetPath, '.json')}.html`,
  );
  await fs.writeFile(outputFile, sanitized, 'utf8');
  return { snippetPath, outputFile };
}

async function main() {
  await ensureOutputDirectory();
  const pexelsKey =
    process.env.PEXELS_API_KEY || process.env.PEXELS_KEY || process.env.PEXELS_TOKEN || DEFAULT_PEXELS_KEY;
  const renderOptions = { pexelsKey };
  const results = [];
  let index = 0;
  for await (const snippetPath of readSnippetFiles()) {
    const result = await renderSnippet(snippetPath, index, renderOptions);
    results.push(result);
    index += 1;
  }
  return results;
}

if (import.meta.url === `file://${__filename}`) {
  main()
    .then((results) => {
      for (const { snippetPath, outputFile } of results) {
        console.log(`Rendered ${path.basename(snippetPath)} -> ${path.relative(__dirname, outputFile)}`);
      }
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

export default main;
