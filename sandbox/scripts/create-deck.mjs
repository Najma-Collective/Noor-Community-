#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  renderLessonDeckToHtml,
  resolveSandboxAssetHref,
} from '../../automation/render/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printUsage() {
  console.log(`Noor Community deck scaffolder\n\n` +
    `Usage: node sandbox/scripts/create-deck.mjs --input <brief.json> [--output <deck.html>] [--pexels-key <key>]\n` +
    `        npx sandbox-create-deck --input <brief.json> ... (if linked via package script)\n\n` +
    `Options:\n` +
    `  -i, --input        Path to a lesson deck JSON payload that matches automation/schema/lesson-deck.schema.json (required)\n` +
    `  -o, --output       Path to write the generated deck HTML (defaults to <brief-name>.html next to the brief)\n` +
    `  -k, --pexels-key   Pexels API key (falls back to PEXELS_API_KEY env var or brief.pexelsKey)\n` +
    `  -h, --help         Show this message\n\n` +
    `Legacy briefs should be migrated to the schema-aligned archetype format so automation and the CLI stay in sync.\n`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case '--input':
      case '-i':
        args.input = argv[index + 1];
        index += 1;
        break;
      case '--output':
      case '-o':
        args.output = argv[index + 1];
        index += 1;
        break;
      case '--pexels-key':
      case '-k':
        args.pexelsKey = argv[index + 1];
        index += 1;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        if (token.startsWith('-')) {
          throw new Error(`Unknown option: ${token}`);
        }
        args._.push(token);
        break;
    }
  }
  return args;
}

function buildAssetPaths(outputPath) {
  const assetRoot = path.resolve(__dirname, '..');
  return {
    sandboxTheme: resolveSandboxAssetHref(outputPath, './sandbox-theme.css', { assetRoot }),
    sandboxCss: resolveSandboxAssetHref(outputPath, './sandbox-css.css', { assetRoot }),
    activityBuilder: resolveSandboxAssetHref(outputPath, './activity-builder.html', { assetRoot }),
    activityBuilderCss: resolveSandboxAssetHref(outputPath, './activity-builder.css', { assetRoot }),
    activityBuilderJs: resolveSandboxAssetHref(outputPath, './activity-builder.js', { assetRoot }),
    intMod: resolveSandboxAssetHref(outputPath, './int-mod.js', { assetRoot }),
  };
}

async function loadBrief(inputPath) {
  let briefRaw;
  try {
    briefRaw = await readFile(inputPath, 'utf8');
  } catch (error) {
    console.error(`Unable to read brief: ${inputPath}`);
    throw error;
  }
  try {
    return JSON.parse(briefRaw);
  } catch (error) {
    console.error('The brief is not valid JSON.');
    throw error;
  }
}

async function writeOutput(html, outputPath) {
  if (!outputPath) {
    process.stdout.write(html);
    return;
  }
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }
  const inputArg = args.input ?? args._[0];
  if (!inputArg) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const inputPath = path.resolve(process.cwd(), inputArg);
  const brief = await loadBrief(inputPath);

  let outputPath = args.output ? path.resolve(process.cwd(), args.output) : null;
  if (!outputPath) {
    const inferredName = `${path.basename(inputPath, path.extname(inputPath))}.html`;
    outputPath = path.join(path.dirname(inputPath), inferredName);
  }

  const pexelsKey = args.pexelsKey ?? process.env.PEXELS_API_KEY ?? brief.pexelsKey ?? null;
  if (!pexelsKey) {
    console.warn('Warning: No Pexels API key provided. Media placeholders will not be resolved.');
  }

  const html = await renderLessonDeckToHtml(brief, {
    assetPaths: buildAssetPaths(outputPath),
    pexelsKey,
  });

  await writeOutput(html, outputPath);
  console.log(`Deck written to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
