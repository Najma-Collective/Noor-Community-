#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { JSDOM } from 'jsdom';

import {
  createLessonSlideFromState,
  SUPPORTED_LESSON_LAYOUTS,
} from '../int-mod.js';
import { BUILDER_LAYOUT_DEFAULTS } from '../slide-templates.js';

const DEFAULT_LANGUAGE = 'en';
const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

function printUsage() {
  console.log(`Noor Community deck scaffolder\n\n` +
    `Usage: node sandbox/scripts/create-deck.mjs --input <brief.json> [--output <deck.html>] [--pexels-key <key>]\n` +
    `        npx sandbox-create-deck --input <brief.json> ... (if linked via package script)\n\n` +
    `Options:\n` +
    `  -i, --input        Path to the deck brief JSON file (required)\n` +
    `  -o, --output       Path to write the generated deck HTML (defaults to <brief-name>.html next to the brief)\n` +
    `  -k, --pexels-key   Pexels API key (falls back to PEXELS_API_KEY env var or brief.pexelsKey)\n` +
    `  -h, --help         Show this message\n`);
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

function ensureDomEnvironment() {
  const dom = new JSDOM('<!doctype html><html lang="en"><head></head><body></body></html>', {
    pretendToBeVisual: true,
  });
  const previousGlobals = {
    window: global.window,
    document: global.document,
    HTMLElement: global.HTMLElement,
    Node: global.Node,
    navigator: global.navigator,
    getComputedStyle: global.getComputedStyle,
  };
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.navigator = dom.window.navigator;
  global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  return { dom, previousGlobals };
}

function restoreDomEnvironment(dom, previous) {
  if (previous) {
    global.window = previous.window;
    global.document = previous.document;
    global.HTMLElement = previous.HTMLElement;
    global.Node = previous.Node;
    global.navigator = previous.navigator;
    global.getComputedStyle = previous.getComputedStyle;
  }
  if (dom) {
    dom.window.close();
  }
}

function clone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value.constructor === Object || Object.getPrototypeOf(value) === null)
  );
}

function mergeDefaults(defaultValue, overrides) {
  if (overrides === undefined) {
    return clone(defaultValue);
  }
  if (isPlainObject(defaultValue) && isPlainObject(overrides)) {
    const merged = { ...clone(defaultValue) };
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) {
        continue;
      }
      if (isPlainObject(value) && isPlainObject(merged[key])) {
        merged[key] = mergeDefaults(merged[key], value);
      } else if (Array.isArray(value)) {
        merged[key] = value.map((item) => clone(item));
      } else {
        merged[key] = clone(value);
      }
    }
    return merged;
  }
  if (Array.isArray(overrides)) {
    return overrides.map((item) => clone(item));
  }
  return clone(overrides);
}

async function fetchPexelsImage(query, apiKey, options = {}) {
  if (!apiKey) {
    throw new Error('A Pexels API key is required to fetch imagery.');
  }
  const url = new URL(PEXELS_SEARCH_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', String(options.perPage ?? 1));
  if (options.orientation) {
    url.searchParams.set('orientation', options.orientation);
  }
  if (options.size) {
    url.searchParams.set('size', options.size);
  }
  if (options.color) {
    url.searchParams.set('color', options.color);
  }
  if (options.locale) {
    url.searchParams.set('locale', options.locale);
  }
  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
  });
  if (!response.ok) {
    throw new Error(`Pexels API responded with status ${response.status}`);
  }
  const data = await response.json();
  const photos = Array.isArray(data?.photos) ? data.photos : [];
  const selected = photos[0];
  if (!selected) {
    return null;
  }
  const src = selected.src ?? {};
  const preferredOrder = [
    options.variant,
    'landscape',
    'large2x',
    'large',
    'original',
    'portrait',
    'medium',
    'small',
    'tiny',
  ].filter(Boolean);
  let chosenUrl = null;
  for (const key of preferredOrder) {
    if (key && src[key]) {
      chosenUrl = src[key];
      break;
    }
  }
  if (!chosenUrl) {
    chosenUrl =
      src.landscape || src.large2x || src.large || src.original || src.medium || src.small || src.tiny || null;
  }
  if (!chosenUrl) {
    return null;
  }
  return {
    url: chosenUrl,
    alt: selected.alt || query,
    photographer: selected.photographer,
    photographerUrl: selected.photographer_url,
  };
}

async function resolveMediaPlaceholders(subject, context) {
  if (Array.isArray(subject)) {
    for (let index = 0; index < subject.length; index += 1) {
      subject[index] = await resolveMediaPlaceholders(subject[index], context);
    }
    return subject;
  }
  if (!isPlainObject(subject)) {
    return subject;
  }
  for (const [key, value] of Object.entries(subject)) {
    if (Array.isArray(value)) {
      subject[key] = await Promise.all(
        value.map((entry) => resolveMediaPlaceholders(entry, context)),
      );
      continue;
    }
    if (isPlainObject(value) && typeof value.pexelsQuery === 'string') {
      const query = value.pexelsQuery;
      let asset = null;
      try {
        asset = await fetchPexelsImage(query, context.pexelsKey, value);
      } catch (error) {
        if (value.fallback) {
          asset = { url: value.fallback, alt: value.alt ?? '' };
        } else {
          console.warn(
            `Pexels lookup failed for "${query}" (${error?.message ?? error}). Continuing without media.`,
          );
          subject[key] = '';
          continue;
        }
      }
      if (!asset) {
        if (value.fallback) {
          subject[key] = value.fallback;
          if (typeof value.alt === 'string') {
            subject.alt = subject.alt ?? value.alt;
          }
        } else {
          console.warn(
            `No imagery returned for "${query}". Provide a fallback URL or adjust the search term.`,
          );
          subject[key] = '';
        }
        continue;
      }
      subject[key] = asset.url;
      const hasValue = (input) => {
        if (input === null || input === undefined) {
          return false;
        }
        if (typeof input === 'string') {
          return input.trim().length > 0;
        }
        return true;
      };
      if (typeof subject.alt === 'string' && !subject.alt.trim()) {
        subject.alt = asset.alt;
      } else if (!('alt' in subject) && typeof value.alt === 'string') {
        subject.alt = value.alt;
      } else if (!('alt' in subject) && asset.alt && key === 'image') {
        subject.alt = asset.alt;
      }
      const creditEnabled = value.includeCredit !== false;
      if (creditEnabled && asset.photographer) {
        const prefix = typeof value.creditPrefix === 'string' ? value.creditPrefix : 'Photo';
        const customCredit = typeof value.credit === 'string' ? value.credit : null;
        if (!hasValue(subject.credit)) {
          subject.credit = hasValue(customCredit)
            ? customCredit
            : `${prefix}: ${asset.photographer}`;
        }
        if (asset.photographerUrl && !hasValue(subject.creditUrl)) {
          subject.creditUrl = asset.photographerUrl;
        } else if (typeof value.creditUrl === 'string' && !hasValue(subject.creditUrl)) {
          subject.creditUrl = value.creditUrl;
        }
      } else if (typeof value.credit === 'string' && !hasValue(subject.credit)) {
        subject.credit = value.credit;
      }
      continue;
    }
    subject[key] = await resolveMediaPlaceholders(value, context);
  }
  return subject;
}

function createDeckShell(document, brief, slideCount) {
  document.documentElement.lang = brief.lang || DEFAULT_LANGUAGE;
  const head = document.head;
  head.innerHTML = '';

  const metaCharset = document.createElement('meta');
  metaCharset.setAttribute('charset', 'utf-8');
  head.appendChild(metaCharset);

  const metaViewport = document.createElement('meta');
  metaViewport.name = 'viewport';
  metaViewport.content = 'width=device-width, initial-scale=1.0';
  head.appendChild(metaViewport);

  const title = document.createElement('title');
  title.textContent = brief.title || 'Noor Community Deck';
  head.appendChild(title);

  const preconnectFonts = document.createElement('link');
  preconnectFonts.rel = 'preconnect';
  preconnectFonts.href = 'https://fonts.googleapis.com';
  head.appendChild(preconnectFonts);

  const preconnectGstatic = document.createElement('link');
  preconnectGstatic.rel = 'preconnect';
  preconnectGstatic.href = 'https://fonts.gstatic.com';
  preconnectGstatic.setAttribute('crossorigin', '');
  head.appendChild(preconnectGstatic);

  const fontSheet = document.createElement('link');
  fontSheet.rel = 'stylesheet';
  fontSheet.href =
    'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Questrial&display=swap';
  head.appendChild(fontSheet);

  const fontAwesome = document.createElement('link');
  fontAwesome.rel = 'stylesheet';
  fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
  head.appendChild(fontAwesome);

  const coreStyles = document.createElement('link');
  coreStyles.rel = 'stylesheet';
  coreStyles.href = '../CSS-slides.css';
  head.appendChild(coreStyles);

  const sandboxTheme = document.createElement('link');
  sandboxTheme.rel = 'stylesheet';
  sandboxTheme.href = './sandbox-theme.css';
  head.appendChild(sandboxTheme);

  const sandboxCustom = document.createElement('link');
  sandboxCustom.rel = 'stylesheet';
  sandboxCustom.href = './sandbox-css.css';
  head.appendChild(sandboxCustom);

  const body = document.body;
  body.innerHTML = '';

  const skipLink = document.createElement('a');
  skipLink.className = 'skip-link';
  skipLink.href = '#lesson-stage';
  skipLink.textContent = 'Skip to lesson workspace';
  body.appendChild(skipLink);

  const status = document.createElement('div');
  status.id = 'deck-status';
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  body.appendChild(status);

  const toastRoot = document.createElement('div');
  toastRoot.id = 'deck-toast-root';
  toastRoot.className = 'deck-toast-container';
  toastRoot.setAttribute('aria-live', 'polite');
  toastRoot.setAttribute('aria-atomic', 'true');
  body.appendChild(toastRoot);

  const deckApp = document.createElement('div');
  deckApp.className = 'deck-app';
  body.appendChild(deckApp);

  const header = document.createElement('header');
  header.className = 'deck-toolbar';
  deckApp.appendChild(header);

  const brand = document.createElement('div');
  brand.className = 'toolbar-brand';
  header.appendChild(brand);

  const brandLabel = document.createElement('span');
  brandLabel.textContent = brief.brand?.label || 'Noor Community';
  brand.appendChild(brandLabel);

  const counter = document.createElement('div');
  counter.id = 'slide-counter';
  counter.className = 'slide-counter';
  counter.textContent = `1 / ${Math.max(slideCount, 1)}`;
  header.appendChild(counter);

  const actions = document.createElement('div');
  actions.className = 'toolbar-actions';
  header.appendChild(actions);

  const saveButton = document.createElement('button');
  saveButton.id = 'save-state-btn';
  saveButton.className = 'toolbar-btn';
  saveButton.type = 'button';
  saveButton.textContent = 'Save Deck';
  actions.appendChild(saveButton);

  const loadButton = document.createElement('button');
  loadButton.id = 'load-state-btn';
  loadButton.className = 'toolbar-btn secondary';
  loadButton.type = 'button';
  loadButton.textContent = 'Load Deck';
  actions.appendChild(loadButton);

  const loadInput = document.createElement('input');
  loadInput.id = 'load-state-input';
  loadInput.type = 'file';
  loadInput.accept = 'application/json';
  loadInput.hidden = true;
  actions.appendChild(loadInput);

  const main = document.createElement('main');
  main.id = 'lesson-stage';
  main.className = 'deck-workspace';
  deckApp.appendChild(main);

  const stageViewport = document.createElement('div');
  stageViewport.className = 'stage-viewport';
  main.appendChild(stageViewport);

  const prevButton = document.createElement('button');
  prevButton.className = 'slide-nav slide-nav-prev';
  prevButton.type = 'button';
  prevButton.setAttribute('aria-label', 'Previous slide');
  prevButton.innerHTML = '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>';
  stageViewport.appendChild(prevButton);

  const nextButton = document.createElement('button');
  nextButton.className = 'slide-nav slide-nav-next';
  nextButton.type = 'button';
  nextButton.setAttribute('aria-label', 'Next slide');
  nextButton.innerHTML = '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>';
  stageViewport.appendChild(nextButton);

  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = `import { setupInteractiveDeck } from './int-mod.js';\nsetupInteractiveDeck({ root: document });`;
  body.appendChild(script);

  return { deckApp, stageViewport };
}

async function buildDeck(brief, options) {
  const { dom, previousGlobals } = ensureDomEnvironment();
  try {
    const document = dom.window.document;
    const slides = Array.isArray(brief.slides) ? brief.slides : [];
    if (!slides.length) {
      throw new Error('The brief must define at least one slide.');
    }
    const { stageViewport } = createDeckShell(document, brief, slides.length);
    const stageSlides = [];
    for (const slideDefinition of slides) {
      const layout = slideDefinition?.layout;
      if (!layout) {
        throw new Error('Each slide must include a "layout" property.');
      }
      if (!SUPPORTED_LESSON_LAYOUTS.includes(layout)) {
        throw new Error(`Unsupported layout in brief: ${layout}`);
      }
      const defaultFactory = BUILDER_LAYOUT_DEFAULTS?.[layout];
      const defaults = typeof defaultFactory === 'function' ? defaultFactory() : {};
      const overrides = slideDefinition.data ? clone(slideDefinition.data) : undefined;
      const merged = mergeDefaults(defaults, overrides ?? {});
      const resolvedData = await resolveMediaPlaceholders(merged, {
        pexelsKey: options.pexelsKey,
      });
      const slide = createLessonSlideFromState({ layout, data: resolvedData });
      if (!(slide instanceof dom.window.HTMLElement)) {
        throw new Error(`Layout ${layout} did not return a slide element.`);
      }
      stageSlides.push(slide);
    }
    stageSlides.forEach((slide, index) => {
      if (index === 0) {
        slide.classList.remove('hidden');
      }
      stageViewport.insertBefore(slide, stageViewport.querySelector('.slide-nav-prev'));
    });
    return dom.serialize();
  } finally {
    restoreDomEnvironment(dom, previousGlobals);
  }
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
  let briefRaw;
  try {
    briefRaw = await readFile(inputPath, 'utf8');
  } catch (error) {
    console.error(`Unable to read brief: ${inputPath}`);
    throw error;
  }
  let brief;
  try {
    brief = JSON.parse(briefRaw);
  } catch (error) {
    console.error('The brief is not valid JSON.');
    throw error;
  }

  const pexelsKey = args.pexelsKey || process.env.PEXELS_API_KEY || brief.pexelsKey || '';
  const requiresMedia = JSON.stringify(brief).includes('pexelsQuery');
  if (requiresMedia && !pexelsKey) {
    throw new Error(
      'The brief requests Pexels imagery but no API key was provided. Pass --pexels-key or set PEXELS_API_KEY.',
    );
  }

  const html = await buildDeck(brief, { pexelsKey });
  const outputPath = path.resolve(
    process.cwd(),
    args.output || path.join(path.dirname(inputPath), `${path.parse(inputPath).name}.html`),
  );
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, 'utf8');

  const relativeOutput = path.relative(process.cwd(), outputPath) || outputPath;
  console.log(`Deck generated: ${relativeOutput}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
