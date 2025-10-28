import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..', '..');
const schemaPath = join(repoRoot, 'automation', 'schema', 'lesson-deck.schema.json');
const examplesDir = join(repoRoot, 'automation', 'examples');

const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
const ajv = new Ajv2020({
  strict: false,
  allErrors: true,
  allowUnionTypes: true,
  $data: true,
});
addFormats(ajv);
const validate = ajv.compile(schema);

const entries = await readdir(examplesDir, { withFileTypes: true });
const exampleFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
  .map((entry) => entry.name)
  .sort();

if (exampleFiles.length === 0) {
  throw new Error('No example lesson decks found in automation/examples.');
}

const results = [];

for (const file of exampleFiles) {
  const filePath = join(examplesDir, file);
  const payload = JSON.parse(await readFile(filePath, 'utf8'));
  const ok = validate(payload);
  if (!ok) {
    const message = ajv.errorsText(validate.errors, { separator: '\n' });
    throw new Error(`Example ${file} failed validation:\n${message}`);
  }
  results.push(file);
}

console.log(`Validated ${results.length} lesson deck example(s):\n- ${results.join('\n- ')}`);
