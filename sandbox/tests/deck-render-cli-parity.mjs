import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import {
  renderLessonDeckToHtml,
  resolveSandboxAssetHref,
} from '../../automation/render/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const cliPath = path.join(repoRoot, 'sandbox', 'scripts', 'create-deck.mjs');

function buildAssetPaths(outputPath) {
  const assetRoot = path.resolve(repoRoot, 'sandbox');
  return {
    sandboxTheme: resolveSandboxAssetHref(outputPath, './sandbox-theme.css', { assetRoot }),
    sandboxCss: resolveSandboxAssetHref(outputPath, './sandbox-css.css', { assetRoot }),
    activityBuilder: resolveSandboxAssetHref(outputPath, './activity-builder.html', { assetRoot }),
    activityBuilderCss: resolveSandboxAssetHref(outputPath, './activity-builder.css', { assetRoot }),
    activityBuilderJs: resolveSandboxAssetHref(outputPath, './activity-builder.js', { assetRoot }),
    intMod: resolveSandboxAssetHref(outputPath, './int-mod.js', { assetRoot }),
  };
}

const fixtures = [
  {
    label: 'legacy-brief',
    inputPath: path.join(__dirname, 'fixtures', 'legacy-lesson-brief.json'),
  },
  {
    label: 'schema-example-foundations',
    inputPath: path.join(repoRoot, 'automation', 'examples', 'lesson-deck-foundations.json'),
  },
];

const execFileAsync = promisify(execFile);

const tempDir = await mkdtemp(path.join(tmpdir(), 'noor-deck-cli-'));

for (const fixture of fixtures) {
  const payload = JSON.parse(await readFile(fixture.inputPath, 'utf8'));
  const outputPath = path.join(tempDir, `${fixture.label}.html`);
  const expectedHtml = await renderLessonDeckToHtml(payload, {
    assetPaths: buildAssetPaths(outputPath),
    pexelsKey: 'test-key',
  });

  const { stdout, stderr } = await execFileAsync('node', [
    cliPath,
    '--input',
    fixture.inputPath,
    '--output',
    outputPath,
    '--pexels-key',
    'test-key',
  ], { encoding: 'utf8' });

  assert.equal(stderr, '', `CLI should not write to stderr for ${fixture.label}`);
  assert.match(stdout, /Deck written to/, `CLI should report success for ${fixture.label}`);

  const actualHtml = await readFile(outputPath, 'utf8');
  assert.equal(
    actualHtml,
    expectedHtml,
    `CLI output should match shared renderer for ${fixture.label}`,
  );
}

console.log(`Deck CLI parity verified for ${fixtures.length} fixture(s).`);
