#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';

import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const schemaUrl = new URL('../config/deck-schema.json', import.meta.url);

let cachedValidator;
let cachedSchema;
let cachedAjv;

function pointerToPath(pointer = '') {
  if (!pointer) {
    return '(root)';
  }
  return pointer
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
    .map((segment) => (segment.match(/^[a-zA-Z_$][\w-$]*$/) ? segment : `[${JSON.stringify(segment)}]`))
    .join('.')
    .replace(/\.\[/g, '[');
}

export function formatValidationErrors(errors = []) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return '';
  }
  return errors
    .map((error) => {
      const location = pointerToPath(error.instancePath);
      let message = error.message || error.keyword;
      if (error.keyword === 'additionalProperties' && error.params?.additionalProperty) {
        message = `${message}: ${error.params.additionalProperty}`;
      } else if (error.keyword === 'required' && error.params?.missingProperty) {
        message = `${message}: ${error.params.missingProperty}`;
      }
      return `- ${location} ${message}`.trim();
    })
    .join('\n');
}

export async function getDeckSchemaValidator({ ajvOptions } = {}) {
  if (!cachedValidator) {
    const schemaRaw = await readFile(schemaUrl, 'utf8');
    cachedSchema = JSON.parse(schemaRaw);
    cachedAjv = new Ajv({
      allErrors: true,
      strict: false,
      allowUnionTypes: true,
      ...ajvOptions,
    });
    addFormats(cachedAjv);
    cachedValidator = cachedAjv.compile(cachedSchema);
  }
  return {
    validate: cachedValidator,
    schema: cachedSchema,
    ajv: cachedAjv,
  };
}

export async function validateBriefAgainstSchema(brief, options) {
  const { validate } = await getDeckSchemaValidator(options);
  const valid = Boolean(validate(brief));
  return {
    valid,
    errors: validate.errors ?? [],
  };
}

async function runCli(args = process.argv.slice(2)) {
  if (!args.length) {
    console.error('Usage: validate-brief-schema.mjs <brief.json> [...moreBriefs]');
    process.exitCode = 1;
    return;
  }

  const { validate } = await getDeckSchemaValidator();
  let hasErrors = false;

  for (const pathArg of args) {
    const absolute = resolve(pathArg);
    let brief;
    try {
      const raw = await readFile(absolute, 'utf8');
      brief = JSON.parse(raw);
    } catch (error) {
      hasErrors = true;
      console.error(`✖ ${pathArg} could not be read: ${error.message}`);
      continue;
    }

    const valid = Boolean(validate(brief));
    if (valid) {
      console.log(`✔ ${pathArg} matches the deck schema`);
    } else {
      hasErrors = true;
      const formatted = formatValidationErrors(validate.errors);
      const errorBlock = formatted ? `\n${formatted}` : '';
      console.error(`✖ ${pathArg} failed deck schema validation${errorBlock}`);
    }
  }

  if (hasErrors) {
    process.exitCode = 1;
  }
}

const cliInvocationUrl =
  process.argv[1] && pathToFileURL(resolve(process.argv[1])).href;

if (cliInvocationUrl === import.meta.url) {
  runCli();
}
