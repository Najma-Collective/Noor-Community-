import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

import { renderLessonDeckToHtml } from '../../automation/render/index.mjs';
import { loadSandboxClassAllowlist } from './helpers/css-allowlist.mjs';
import { captureConsole, validateDeckDocument } from './helpers/deck-validation.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const examplesDir = path.join(repoRoot, 'automation', 'examples');

const entries = await readdir(examplesDir, { withFileTypes: true });
const exampleFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
  .map((entry) => entry.name)
  .sort();

assert.ok(exampleFiles.length > 0, 'No automation lesson deck examples were found.');

const { isAllowed: isAllowedSandboxClass } = await loadSandboxClassAllowlist();

let passed = 0;

for (const file of exampleFiles) {
  const filePath = path.join(examplesDir, file);
  const payload = JSON.parse(await readFile(filePath, 'utf8'));
  const expectedSlides = Array.isArray(payload.slides) ? payload.slides.length : 0;

  const { result: html, errors, warnings } = await captureConsole(() =>
    renderLessonDeckToHtml(payload, { pexelsKey: 'test-key' }),
  );

  assert.equal(errors.length, 0, `Renderer should not emit console errors for ${file}.`);
  assert.equal(warnings.length, 0, `Renderer should not emit console warnings for ${file}.`);

  const dom = new JSDOM(html, { url: 'https://example.com/sandbox/', pretendToBeVisual: true });
  try {
    const issues = validateDeckDocument(dom.window.document, payload, {
      isAllowedClass: isAllowedSandboxClass,
    });
    assert.equal(
      issues.length,
      0,
      `Deck ${file} failed structural validation:\n${issues.map((issue) => `- ${issue}`).join('\n')}`,
    );

    const slides = dom.window.document.querySelectorAll('.slide-stage');
    assert.equal(
      slides.length,
      expectedSlides,
      `Deck ${file} should render ${expectedSlides} slide(s).`,
    );
  } finally {
    dom.window.close?.();
  }

  passed += 1;
  console.log(`Rendered deck example "${file}" with ${expectedSlides} slide(s).`);
}

console.log(`Rendered and validated ${passed} automation deck example(s).`);
