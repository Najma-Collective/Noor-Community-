import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { DEFAULT_STATES, Generators } from '../activity-builder.js';
import { SUPPORTED_LESSON_LAYOUTS, createLessonSlideFromState } from '../int-mod.js';
import { renderLessonDeckToHtml } from '../../automation/render/index.mjs';
import {
  collectInlineStyleViolations,
  collectUnknownClasses,
  extractClassesFromCss,
  loadSandboxClassAllowlist,
} from './helpers/css-allowlist.mjs';
import { captureConsole, validateDeckDocument } from './helpers/deck-validation.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const examplesDir = path.join(repoRoot, 'automation', 'examples');

const ModuleGenerators = Generators;

const dom = new JSDOM(
  '<!doctype html><html><body><div class="deck-workspace"><div class="stage-viewport"></div></div></body></html>',
  {
    url: 'https://example.com/sandbox/',
    pretendToBeVisual: true,
  },
);

const { window } = dom;
const { document } = window;

Object.assign(globalThis, {
  window,
  document,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
  Element: window.Element,
  Node: window.Node,
  CustomEvent: window.CustomEvent,
  Event: window.Event,
  MutationObserver: window.MutationObserver,
  DOMParser: window.DOMParser,
  getComputedStyle: window.getComputedStyle.bind(window),
});

if (typeof window.requestAnimationFrame !== 'function') {
  window.requestAnimationFrame = (callback) => window.setTimeout(callback, 16);
}
if (typeof window.cancelAnimationFrame !== 'function') {
  window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);
}

const stageViewport = document.querySelector('.stage-viewport');

const { isAllowed: isAllowedSandboxClass } = await loadSandboxClassAllowlist();

const failures = [];

function addFailure(message) {
  failures.push(message);
}

const reportInlineStyleViolations = (root, context) => {
  const violations = collectInlineStyleViolations(root);
  if (!violations.length) {
    return;
  }
  violations.forEach(({ property, value, type }) =>
    addFailure(
      `${context} includes disallowed inline style (${property}: ${value}) [${type}]`,
    ),
  );
};

const assertNoUnknownClasses = (root, context, isAllowed = isAllowedSandboxClass) => {
  const violations = collectUnknownClasses(root, isAllowed);
  const unknownClasses = Array.from(violations.keys());
  if (unknownClasses.length) {
    addFailure(`${context} included non-sandbox classes: ${unknownClasses.join(', ')}`);
  }
};

for (const layout of SUPPORTED_LESSON_LAYOUTS) {
  const { errors, warnings } = await captureConsole(() => {
    const slide = createLessonSlideFromState({ layout });
    assert.ok(slide instanceof window.HTMLElement, `Layout "${layout}" should create an element`);
    stageViewport.appendChild(slide);
    assertNoUnknownClasses(slide, `Layout ${layout}`);
    reportInlineStyleViolations(slide, `Layout ${layout}`);
    slide.remove();
  });
  if (errors.length) {
    addFailure(`Layout "${layout}" emitted console errors: ${errors.map((entry) => entry.join(' ')).join(' | ')}`);
  }
  if (warnings.length) {
    addFailure(`Layout "${layout}" emitted console warnings: ${warnings
      .map((entry) => entry.join(' '))
      .join(' | ')}`);
  }
}

const moduleParser = new window.DOMParser();

for (const [type, factory] of Object.entries(DEFAULT_STATES)) {
  const generator = ModuleGenerators[type];
  if (typeof generator !== 'function') {
    continue;
  }
  const config = typeof factory === 'function' ? factory() : {};
  const { result: html, errors, warnings } = await captureConsole(() => generator(config));
  if (errors.length) {
    addFailure(`Module "${type}" emitted console errors: ${errors.map((entry) => entry.join(' ')).join(' | ')}`);
  }
  if (warnings.length) {
    addFailure(`Module "${type}" emitted console warnings: ${warnings
      .map((entry) => entry.join(' '))
      .join(' | ')}`);
  }
  const moduleDoc = moduleParser.parseFromString(html, 'text/html');
  const styleBlocks = Array.from(moduleDoc.querySelectorAll('style'));
  const localClassAllowlist = new Set();
  styleBlocks.forEach((block) => {
    extractClassesFromCss(block.textContent || '').forEach((className) =>
      localClassAllowlist.add(className),
    );
  });
  const moduleClassAllowlistChecker = (className = '') =>
    isAllowedSandboxClass(className) || localClassAllowlist.has(className);
  const moduleRoot = moduleDoc.documentElement;
  assertNoUnknownClasses(moduleRoot, `Module ${type}`, moduleClassAllowlistChecker);
  reportInlineStyleViolations(moduleRoot, `Module ${type}`);
  const externalScripts = moduleDoc.querySelectorAll('script[src]');
  if (externalScripts.length) {
    addFailure(`Module "${type}" should not reference external scripts.`);
  }
}

const exampleEntries = await readdir(examplesDir, { withFileTypes: true });
const exampleFiles = exampleEntries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
  .map((entry) => entry.name)
  .sort();

if (!exampleFiles.length) {
  addFailure('No lesson deck automation examples found to lint.');
}

for (const file of exampleFiles) {
  const filePath = path.join(examplesDir, file);
  const payload = JSON.parse(await readFile(filePath, 'utf8'));
  const { result: html, errors, warnings } = await captureConsole(() =>
    renderLessonDeckToHtml(payload, { pexelsKey: 'test-key' }),
  );
  if (errors.length) {
    addFailure(
      `Deck example "${file}" emitted console errors: ${errors
        .map((entry) => entry.join(' '))
        .join(' | ')}`,
    );
  }
  if (warnings.length) {
    addFailure(
      `Deck example "${file}" emitted console warnings: ${warnings
        .map((entry) => entry.join(' '))
        .join(' | ')}`,
    );
  }

  const deckDom = new JSDOM(html, {
    url: 'https://example.com/sandbox/',
    pretendToBeVisual: true,
  });
  const deckDocument = deckDom.window.document;
  const deckIssues = validateDeckDocument(deckDocument, payload, {
    isAllowedClass: isAllowedSandboxClass,
  });
  reportInlineStyleViolations(deckDocument, file);
  deckDom.window.close?.();

  if (deckIssues.length) {
    deckIssues.forEach((issue) => addFailure(`${file}: ${issue}`));
  }
}

if (failures.length) {
  failures.forEach((message) => console.error(message));
  process.exitCode = 1;
} else {
  console.log('Static sandbox lint checks passed');
}
