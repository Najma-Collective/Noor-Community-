import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020 from '../../sandbox/node_modules/ajv/dist/2020.js';
import addFormats from '../../sandbox/node_modules/ajv-formats/dist/index.js';
import { JSDOM } from '../../sandbox/node_modules/jsdom/lib/api.js';

import schemaJson from '../schema/lesson-deck.schema.json' with { type: 'json' };
import { createLessonSlideFromState } from '../../sandbox/int-mod.js';
import { BUILDER_LAYOUT_DEFAULTS } from '../../sandbox/slide-templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_LANGUAGE = 'en';
const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

const ajv = new Ajv2020({
  strict: false,
  allErrors: true,
  allowUnionTypes: true,
  $data: true,
});
addFormats(ajv);
const validateLessonDeck = ajv.compile(schemaJson);

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

export function resolveSandboxAssetHref(outputPath, assetRelativePath, { assetRoot } = {}) {
  const resolvedRoot = assetRoot ?? path.resolve(__dirname, '..', '..', 'sandbox');
  const absoluteAssetPath = path.resolve(resolvedRoot, assetRelativePath);
  if (!outputPath) {
    return toPosixPath(absoluteAssetPath);
  }
  let relativeHref = path.relative(path.dirname(outputPath), absoluteAssetPath);
  if (!relativeHref) {
    relativeHref = path.basename(absoluteAssetPath);
  }
  let normalizedHref = toPosixPath(relativeHref);
  if (!normalizedHref.startsWith('.') && !normalizedHref.startsWith('/')) {
    normalizedHref = `./${normalizedHref}`;
  }
  return normalizedHref;
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

function escapeAttribute(value) {
  if (value == null) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

function createDeckShell(document, brief, slideCount, assetPaths = {}) {
  document.documentElement.lang = brief.language || brief.lang || DEFAULT_LANGUAGE;
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

  const sandboxThemeHref = assetPaths.sandboxTheme ?? './sandbox-theme.css';
  const sandboxTheme = document.createElement('link');
  sandboxTheme.rel = 'stylesheet';
  sandboxTheme.href = sandboxThemeHref;
  head.appendChild(sandboxTheme);

  const sandboxCustomHref = assetPaths.sandboxCss ?? './sandbox-css.css';
  const sandboxCustom = document.createElement('link');
  sandboxCustom.rel = 'stylesheet';
  sandboxCustom.href = sandboxCustomHref;
  head.appendChild(sandboxCustom);

  const activityBuilderHref = assetPaths.activityBuilder ?? './activity-builder.html';
  const activityBuilderCssHref = assetPaths.activityBuilderCss ?? './activity-builder.css';
  const activityBuilderJsHref = assetPaths.activityBuilderJs ?? './activity-builder.js';

  const builderPrefetch = document.createElement('link');
  builderPrefetch.rel = 'prefetch';
  builderPrefetch.href = activityBuilderHref;
  builderPrefetch.setAttribute('as', 'document');
  builderPrefetch.setAttribute('type', 'text/html');
  head.appendChild(builderPrefetch);

  const builderCssPrefetch = document.createElement('link');
  builderCssPrefetch.rel = 'prefetch';
  builderCssPrefetch.href = activityBuilderCssHref;
  builderCssPrefetch.setAttribute('as', 'style');
  head.appendChild(builderCssPrefetch);

  const builderJsPreload = document.createElement('link');
  builderJsPreload.rel = 'modulepreload';
  builderJsPreload.href = activityBuilderJsHref;
  head.appendChild(builderJsPreload);

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

  const logos = Array.isArray(brief.brand?.logos)
    ? brief.brand.logos.filter((logo) => logo && typeof logo.src === 'string')
    : [
        { src: '../assets/noor_logo.webp', alt: '' },
        { src: '../assets/almanar_logo.png', alt: '' },
      ];

  logos.forEach((logo) => {
    const img = document.createElement('img');
    img.src = logo.src;
    img.alt = logo.alt ?? '';
    brand.appendChild(img);
  });

  const actions = document.createElement('div');
  actions.className = 'toolbar-actions';
  header.appendChild(actions);

  const createToolbarButton = ({ id, className, icon, label, disabled }) => {
    const button = document.createElement('button');
    button.type = 'button';
    if (id) {
      button.id = id;
    }
    button.className = className;
    if (disabled) {
      button.disabled = true;
    }
    if (icon) {
      const iconEl = document.createElement('i');
      iconEl.className = icon;
      iconEl.setAttribute('aria-hidden', 'true');
      button.appendChild(iconEl);
    }
    if (icon && label) {
      button.appendChild(document.createTextNode(' '));
    }
    if (label) {
      button.appendChild(document.createTextNode(label));
    }
    return button;
  };

  const downloadButton = createToolbarButton({
    id: 'download-deck-btn',
    className: 'toolbar-btn secondary',
    icon: 'fa-solid fa-download',
    label: 'Download Deck',
  });
  actions.appendChild(downloadButton);

  const loadButton = createToolbarButton({
    id: 'load-deck-btn',
    className: 'toolbar-btn secondary',
    icon: 'fa-solid fa-file-import',
    label: 'Load Deck',
  });
  actions.appendChild(loadButton);

  const loadInput = document.createElement('input');
  loadInput.id = 'load-state-input';
  loadInput.type = 'file';
  loadInput.accept = 'application/json';
  loadInput.className = 'sr-only';
  loadInput.hidden = true;
  actions.appendChild(loadInput);

  const addSlideButton = createToolbarButton({
    id: 'add-slide-btn',
    className: 'toolbar-btn',
    icon: 'fa-solid fa-plus',
    label: 'Add Blank Slide',
  });
  actions.appendChild(addSlideButton);

  const builderToggle = createToolbarButton({
    id: 'activity-builder-btn',
    className: 'toolbar-btn secondary',
    icon: 'fa-solid fa-border-all',
    label: 'Open Builder',
  });
  actions.appendChild(builderToggle);

  const toolbarMenu = document.createElement('div');
  toolbarMenu.className = 'toolbar-menu';
  toolbarMenu.dataset.role = 'canvas-tools';
  actions.appendChild(toolbarMenu);

  const canvasToggle = createToolbarButton({
    id: 'canvas-tools-toggle',
    className: 'toolbar-btn tertiary has-caret',
    icon: 'fa-solid fa-wand-magic-sparkles',
    label: 'Canvas Tools',
    disabled: true,
  });
  canvasToggle.setAttribute('aria-haspopup', 'true');
  canvasToggle.setAttribute('aria-expanded', 'false');
  canvasToggle.setAttribute('aria-controls', 'canvas-tools-menu');
  toolbarMenu.appendChild(canvasToggle);

  const caret = document.createElement('span');
  caret.className = 'toolbar-caret';
  caret.setAttribute('aria-hidden', 'true');
  canvasToggle.appendChild(caret);

  const canvasMenu = document.createElement('div');
  canvasMenu.id = 'canvas-tools-menu';
  canvasMenu.className = 'toolbar-dropdown';
  canvasMenu.setAttribute('role', 'menu');
  canvasMenu.setAttribute('aria-label', 'Canvas tools');
  canvasMenu.hidden = true;
  toolbarMenu.appendChild(canvasMenu);

  const canvasMenuInner = document.createElement('div');
  canvasMenuInner.className = 'toolbar-dropdown-inner';
  canvasMenuInner.dataset.role = 'canvas-tools-options';
  canvasMenu.appendChild(canvasMenuInner);

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

  const intModHref = assetPaths.intMod ?? './int-mod.js';
  const ViewHTMLElement = document.defaultView?.HTMLElement ?? globalThis.HTMLElement;
  const ViewHTMLIFrameElement = document.defaultView?.HTMLIFrameElement ?? globalThis.HTMLIFrameElement;

  const builderOverlayTemplate = document.createElement('template');
  builderOverlayTemplate.innerHTML = `
    <div id="activity-builder-overlay" class="builder-overlay" aria-hidden="true" hidden>
      <div class="builder-dialog" role="dialog" aria-modal="true" aria-labelledby="builder-title">
        <header class="builder-header">
          <div>
            <p class="builder-eyebrow">Slide library</p>
            <h2 id="builder-title">Create a lesson slide</h2>
            <p class="builder-subtitle">
              Start from a blank canvas while the curated lesson layouts are rebuilt.
            </p>
          </div>
          <button type="button" class="builder-close" aria-label="Close slide builder">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </header>
        <form id="activity-builder-form" class="builder-form">
          <div class="builder-grid">
            <fieldset class="builder-field builder-field--full layout-picker" data-layouts="blank-canvas">
              <legend class="builder-field-label">Choose a layout</legend>
              <div class="layout-picker-grid">
                <label class="layout-option" title="Start with an empty slide and build everything yourself.">
                  <input type="radio" name="slideLayout" value="blank-canvas" checked />
                  <span class="layout-option-body">
                    <span class="layout-option-icon" aria-hidden="true">
                      <i class="fa-solid fa-border-all"></i>
                    </span>
                    <span class="layout-option-copy">
                      <span class="layout-option-title">Blank canvas</span>
                      <span class="layout-option-desc">Add your own text boxes, drawings, and pasted media.</span>
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

            <section class="builder-section" data-layouts="blank-canvas">
              <header class="builder-section-header">
                <div>
                  <h3>Blank canvas</h3>
                  <p>Use the stage toolbar to insert text boxes, drawings, and modules.</p>
                </div>
              </header>
              <p class="builder-hint">There are no additional form fields for this layout.</p>
            </section>

            <section class="builder-section builder-preview-section">
              <header class="builder-section-header">
                <div>
                  <h3>Slide preview</h3>
                  <p>Updates automatically as you edit the fields.</p>
                </div>
                <button type="button" class="ghost-btn" id="builder-refresh-preview">
                  <i class="fa-solid fa-arrows-rotate"></i>
                  Refresh preview
                </button>
              </header>
              <div id="builder-preview" class="builder-preview" aria-live="polite"></div>
            </section>

            <section class="builder-section">
              <header class="builder-section-header">
                <div>
                  <h3>Builder JSON</h3>
                  <p>Preview the data that will generate the slide.</p>
                </div>
              </header>
              <pre id="builder-json-preview" class="builder-json-preview" aria-live="polite">{}</pre>
            </section>

            <footer class="builder-footer">
              <p id="builder-status" class="builder-status" aria-live="polite"></p>
              <div class="builder-actions">
                <button type="button" class="toolbar-btn ghost" data-action="cancel-builder">
                  Cancel
                </button>
                <button type="submit" class="toolbar-btn">
                  <i class="fa-solid fa-square-plus"></i>
                  Insert slide
                </button>
              </div>
            </footer>
          </div>
        </form>
      </div>
    </div>
  `;

  const builderOverlay = builderOverlayTemplate.content.firstElementChild;
  if (ViewHTMLElement && builderOverlay instanceof ViewHTMLElement) {
    builderOverlay.setAttribute('data-builder-css', activityBuilderCssHref);
    builderOverlay.setAttribute('data-builder-js', activityBuilderJsHref);
    body.appendChild(builderOverlay);
  }

  const moduleOverlayTemplate = document.createElement('template');
  moduleOverlayTemplate.innerHTML = `
    <div id="module-builder-overlay" class="builder-overlay module-builder-overlay" aria-hidden="true" hidden>
      <div class="builder-dialog module-builder-dialog" role="dialog" aria-modal="true" aria-labelledby="module-builder-title">
        <header class="builder-header module-builder-header">
          <div>
            <p class="builder-eyebrow">Sandbox tools</p>
            <h2 id="module-builder-title">Interactive Activity Modules</h2>
            <p class="builder-subtitle">
              Configure Noor templates and drop the activity onto your blank slide.
            </p>
          </div>
          <button type="button" class="builder-close module-builder-close" aria-label="Close module builder">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </header>
        <div class="module-builder-body">
          <iframe
            id="module-builder-frame"
            title="Activity module builder"
            src="about:blank"
            data-builder-src="${escapeAttribute(activityBuilderHref)}"
            loading="lazy"
            tabindex="-1"
          ></iframe>
        </div>
      </div>
    </div>
  `;

  const moduleOverlay = moduleOverlayTemplate.content.firstElementChild;
  if (ViewHTMLElement && moduleOverlay instanceof ViewHTMLElement) {
    body.appendChild(moduleOverlay);
    const moduleFrame = moduleOverlay.querySelector('#module-builder-frame');
    if (ViewHTMLIFrameElement && moduleFrame instanceof ViewHTMLIFrameElement) {
      moduleFrame.setAttribute('data-builder-src', activityBuilderHref);
      moduleFrame.setAttribute('src', 'about:blank');
    }
  }

  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = `import { setupInteractiveDeck } from '${intModHref}';\nsetupInteractiveDeck({ root: document });`;
  body.appendChild(script);

  return { deckApp, stageViewport };
}

function normaliseText(value) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (isPlainObject(value) && typeof value.text === 'string') {
    return value.text.trim();
  }
  return '';
}

function normaliseRichText(value) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (isPlainObject(value) && typeof value.content === 'string') {
    return value.content.trim();
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normaliseRichText(entry)).filter(Boolean).join('\n\n');
  }
  return '';
}

function normaliseRichTextArray(value) {
  if (!Array.isArray(value)) {
    const single = normaliseRichText(value);
    return single ? [single] : [];
  }
  return value
    .map((entry) => normaliseRichText(entry))
    .filter((entry) => entry && entry.length);
}

function normaliseMediaAsset(value) {
  if (!value || typeof value !== 'object') {
    return { url: '', alt: '', credit: '', creditUrl: '' };
  }
  if (typeof value.src === 'string') {
    return {
      url: value.src,
      alt: value.alt ?? '',
      credit: value.credit ?? '',
      creditUrl: value.creditUrl ?? value.creditURL ?? '',
    };
  }
  if (typeof value.url === 'string') {
    return {
      url: value.url,
      alt: value.alt ?? '',
      credit: value.credit ?? '',
      creditUrl: value.creditUrl ?? value.creditURL ?? '',
    };
  }
  return { url: '', alt: '', credit: '', creditUrl: '' };
}

function buildColumnItemsFromRichTextList(entries) {
  return normaliseRichTextArray(entries).map((text, index) => ({
    title: '',
    label: '',
    detail: text,
    description: text,
    note: text,
    index,
  }));
}

const ARCHETYPE_TO_LAYOUT = {
  'hero.overlay': (slide) => {
    const data = slide.data ?? {};
    const background = normaliseMediaAsset(data.background_media);
    return {
      layout: 'hero-overlay',
      data: {
        pill: normaliseText(data.pill_label),
        pillIcon: data.pill_icon,
        headline: normaliseRichText(data.headline),
        subtitle: normaliseRichText(data.subhead),
        image: background.url,
        alt: background.alt,
        credit: background.credit,
        creditUrl: background.creditUrl,
      },
    };
  },
  'centered.callout': (slide) => {
    const data = slide.data ?? {};
    const supporting = buildColumnItemsFromRichTextList(data.supporting_text);
    const illustration = normaliseMediaAsset(data.illustration);
    if (illustration.url) {
      supporting.unshift({
        title: '',
        detail: illustration.alt || 'Illustration',
        media: illustration.url,
      });
    }
    return {
      layout: 'split-grid',
      data: {
        pill: normaliseText(data.accent_pill),
        title: normaliseRichText(data.headline),
        description: '',
        columns: [
          {
            title: '',
            items: supporting.map((item, index) => ({
              title: item.title || (index === 0 && illustration.url ? 'Illustration' : ''),
              detail: item.detail ?? item.description ?? '',
            })),
          },
        ],
      },
    };
  },
  'centered.dialogue': (slide) => {
    const data = slide.data ?? {};
    const lines = Array.isArray(data.dialogue_box?.lines) ? data.dialogue_box.lines : [];
    const items = lines.map((line, index) => ({
      title: line?.speaker ? `${line.speaker}` : `Line ${index + 1}`,
      detail: normaliseRichText(line?.text) || '',
    }));
    const stageDirection = normaliseRichText(data.dialogue_box?.stage_direction);
    return {
      layout: 'split-grid',
      data: {
        pill: normaliseText(data.dialogue_box?.pill_label),
        title: normaliseRichText(data.headline),
        description: stageDirection,
        columns: [
          {
            title: '',
            items,
          },
        ],
      },
    };
  },
  'pill.card-stack': (slide) => {
    const data = slide.data ?? {};
    const cards = buildColumnItemsFromRichTextList(data.card_body).map((entry, index) => ({
      title: entry.detail ? `Card ${index + 1}` : '',
      description: entry.detail,
    }));
    return {
      layout: 'reflection-board',
      data: {
        pill: normaliseText(data.pill_label),
        title: normaliseRichText(data.headline),
        columns: [
          {
            title: '',
            cards,
          },
        ],
        boardNote: normaliseRichText(data.footnote),
      },
    };
  },
  'pill.simple': (slide) => {
    const data = slide.data ?? {};
    const cards = buildColumnItemsFromRichTextList(data.body_copy).map((entry) => ({
      title: '',
      description: entry.detail ?? entry.description ?? entry.note ?? entry,
    }));
    return {
      layout: 'reflection-board',
      data: {
        pill: normaliseText(data.pill_label),
        title: '',
        columns: [
          {
            title: '',
            cards,
          },
        ],
      },
    };
  },
  'card.stack': (slide) => {
    const data = slide.data ?? {};
    const cards = buildColumnItemsFromRichTextList(data.card_body).map((entry) => ({
      title: '',
      description: entry.detail ?? entry.description ?? entry.note ?? entry,
    }));
    const media = normaliseMediaAsset(data.media);
    return {
      layout: 'reflection-board',
      data: {
        title: normaliseRichText(data.headline),
        columns: [
          {
            title: '',
            cards,
          },
        ],
        boardNote: media.url ? media.alt || media.url : '',
      },
    };
  },
  'grid.workspace': (slide) => {
    const data = slide.data ?? {};
    const slots = Array.isArray(data.grid_slots) ? data.grid_slots : [];
    return {
      layout: 'split-grid',
      data: {
        title: normaliseText(slide.title),
        columns: slots.map((slot) => ({
          title: normaliseText(slot.title) || slot.id || '',
          description: normaliseRichText(slot.instructions ?? slot.support),
          items: [
            {
              title: '',
              detail: normaliseRichText(slot.body),
            },
          ],
        })),
      },
    };
  },
  'content.wrapper': (slide) => {
    const data = slide.data ?? {};
    const blocks = Array.isArray(data.content_blocks) ? data.content_blocks : [];
    const cards = blocks.map((block, index) => {
      switch (block?.type) {
        case 'list': {
          const items = normaliseRichTextArray(block.items);
          return {
            title: block.title ? normaliseText(block.title) : `List ${index + 1}`,
            description: items.join('\n'),
          };
        }
        case 'quote': {
          const quote = normaliseRichText(block.text ?? block.quote ?? block.content);
          const attribution = normaliseRichText(block.attribution);
          return {
            title: 'Quote',
            description: attribution ? `${quote}\n— ${attribution}` : quote,
          };
        }
        default: {
          return {
            title: block?.title ? normaliseText(block.title) : '',
            description: normaliseRichText(block?.text ?? block?.content ?? block),
          };
        }
      }
    });
    return {
      layout: 'reflection-board',
      data: {
        columns: [
          {
            title: '',
            cards,
          },
        ],
      },
    };
  },
  'interactive.activity-card': (slide) => ({
    layout: 'blank-canvas',
    data: {},
    afterRender(slideEl) {
      const canvas = slideEl.querySelector('.blank-canvas');
      if (!(canvas instanceof HTMLElement)) {
        return;
      }
      const card = document.createElement('section');
      card.className = 'activity-card';
      const pill = normaliseText(slide.data?.pill_label);
      if (pill) {
        const pillEl = document.createElement('span');
        pillEl.className = 'pill';
        pillEl.textContent = pill;
        card.appendChild(pillEl);
      }
      const instructions = normaliseRichTextArray(slide.data?.instructions);
      instructions.forEach((text) => {
        const p = document.createElement('p');
        p.textContent = text;
        card.appendChild(p);
      });
      const actions = slide.data?.action_bar && typeof slide.data.action_bar === 'object'
        ? slide.data.action_bar
        : {};
      const actionBar = document.createElement('div');
      actionBar.className = 'action-bar';
      ['primary', 'secondary', 'tertiary'].forEach((key) => {
        const label = normaliseText(actions[key]);
        if (label) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = label;
          actionBar.appendChild(button);
        }
      });
      if (actionBar.childNodes.length) {
        card.appendChild(actionBar);
      }
      canvas.appendChild(card);
    },
  }),
  'interactive.token-board': (slide) => ({
    layout: 'blank-canvas',
    data: {},
    afterRender(slideEl) {
      const canvas = slideEl.querySelector('.blank-canvas');
      if (!(canvas instanceof HTMLElement)) {
        return;
      }
      const wrapper = document.createElement('div');
      wrapper.className = 'token-board-summary';
      const heading = document.createElement('h2');
      heading.textContent = 'Token board';
      wrapper.appendChild(heading);
      const tokens = Array.isArray(slide.data?.token_bank) ? slide.data.token_bank : [];
      const tokenList = document.createElement('ul');
      tokenList.className = 'token-summary';
      tokens.forEach((token) => {
        const li = document.createElement('li');
        li.textContent = normaliseText(token?.label) || token?.id || 'Token';
        tokenList.appendChild(li);
      });
      wrapper.appendChild(tokenList);
      canvas.appendChild(wrapper);
    },
  }),
  'interactive.token-table': (slide) => ({
    layout: 'blank-canvas',
    data: {},
    afterRender(slideEl) {
      const canvas = slideEl.querySelector('.blank-canvas');
      if (!(canvas instanceof HTMLElement)) {
        return;
      }
      const wrapper = document.createElement('div');
      wrapper.className = 'token-table-summary';
      const heading = document.createElement('h2');
      heading.textContent = 'Token table';
      wrapper.appendChild(heading);
      const summary = document.createElement('p');
      const tokens = Array.isArray(slide.data?.token_bank) ? slide.data.token_bank : [];
      summary.textContent = `Tokens: ${tokens.length}`;
      wrapper.appendChild(summary);
      canvas.appendChild(wrapper);
    },
  }),
  'interactive.token-quiz': (slide) => ({
    layout: 'blank-canvas',
    data: {},
    afterRender(slideEl) {
      const canvas = slideEl.querySelector('.blank-canvas');
      if (!(canvas instanceof HTMLElement)) {
        return;
      }
      const wrapper = document.createElement('div');
      wrapper.className = 'token-quiz-summary';
      const heading = document.createElement('h2');
      heading.textContent = 'Token quiz';
      wrapper.appendChild(heading);
      const count = Array.isArray(slide.data?.quiz_prompts) ? slide.data.quiz_prompts.length : 0;
      const summary = document.createElement('p');
      summary.textContent = `Includes ${count} prompt${count === 1 ? '' : 's'}.`;
      wrapper.appendChild(summary);
      canvas.appendChild(wrapper);
    },
  }),
  'interactive.quiz-feedback': (slide) => ({
    layout: 'blank-canvas',
    data: {},
    afterRender(slideEl) {
      const canvas = slideEl.querySelector('.blank-canvas');
      if (!(canvas instanceof HTMLElement)) {
        return;
      }
      const wrapper = document.createElement('div');
      wrapper.className = 'quiz-feedback-summary';
      const heading = document.createElement('h2');
      heading.textContent = 'Quiz feedback';
      wrapper.appendChild(heading);
      const items = Array.isArray(slide.data?.quiz_items) ? slide.data.quiz_items : [];
      const list = document.createElement('ul');
      items.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = normaliseRichText(item?.prompt) || `Question ${index + 1}`;
        list.appendChild(li);
      });
      wrapper.appendChild(list);
      canvas.appendChild(wrapper);
    },
  }),
  'interactive.audio-dialogue': (slide) => ({
    layout: 'blank-canvas',
    data: {},
    afterRender(slideEl) {
      const canvas = slideEl.querySelector('.blank-canvas');
      if (!(canvas instanceof HTMLElement)) {
        return;
      }
      const wrapper = document.createElement('div');
      wrapper.className = 'audio-dialogue-summary';
      const heading = document.createElement('h2');
      heading.textContent = normaliseText(slide.data?.prompt_card?.title) || 'Audio dialogue';
      wrapper.appendChild(heading);
      const description = normaliseRichText(slide.data?.prompt_card?.instructions);
      if (description) {
        const p = document.createElement('p');
        p.textContent = description;
        wrapper.appendChild(p);
      }
      canvas.appendChild(wrapper);
    },
  }),
  'dialogue.grid': (slide) => {
    const data = slide.data ?? {};
    const cards = Array.isArray(data.prompt_cards) ? data.prompt_cards : [];
    return {
      layout: 'split-grid',
      data: {
        pill: normaliseText(data.pill_label),
        columns: cards.map((card) => ({
          title: normaliseText(card?.title),
          items: [
            {
              title: '',
              detail: normaliseRichText(card?.prompt),
            },
          ],
        })),
      },
    };
  },
  'dialogue.stack': (slide) => {
    const data = slide.data ?? {};
    const lines = Array.isArray(data.dialogue_box?.lines) ? data.dialogue_box.lines : [];
    const cards = lines.map((line, index) => ({
      title: line?.speaker ? `${line.speaker}` : `Line ${index + 1}`,
      description: normaliseRichText(line?.text),
    }));
    const cta = data.dialogue_box?.cta;
    const footer = cta ? normaliseText(cta.label) : '';
    return {
      layout: 'reflection-board',
      data: {
        title: normaliseText(data.dialogue_box?.title),
        columns: [
          {
            title: '',
            cards,
          },
        ],
        boardNote: footer,
      },
    };
  },
};

function resolveArchetypeLayout(slide) {
  const handler = ARCHETYPE_TO_LAYOUT[slide.archetype];
  if (typeof handler !== 'function') {
    throw new Error(`Unsupported slide archetype: ${slide.archetype}`);
  }
  return handler(slide);
}

export async function renderLessonDeckToHtml(payload, options = {}) {
  const ok = validateLessonDeck(payload);
  if (!ok) {
    const message = ajv.errorsText(validateLessonDeck.errors, { separator: '\n' });
    throw new Error(`Lesson deck payload failed validation:\n${message}`);
  }

  const slides = Array.isArray(payload.slides) ? payload.slides : [];
  if (!slides.length) {
    throw new Error('The lesson deck must include at least one slide.');
  }

  const { dom, previousGlobals } = ensureDomEnvironment();
  try {
    const document = dom.window.document;
    const assetPaths = options.assetPaths ?? {};
    const { stageViewport } = createDeckShell(document, payload, slides.length, assetPaths);

    for (const slide of slides) {
      const { layout, data, afterRender } = resolveArchetypeLayout(slide);
      const defaultFactory = BUILDER_LAYOUT_DEFAULTS?.[layout];
      const defaults = typeof defaultFactory === 'function' ? defaultFactory() : {};
      const mergedData = mergeDefaults(defaults, data ?? {});
      const resolvedData = await resolveMediaPlaceholders(mergedData, {
        pexelsKey: options.pexelsKey,
      });
      const slideEl = createLessonSlideFromState({ layout, data: resolvedData });
      if (!(slideEl instanceof dom.window.HTMLElement)) {
        throw new Error(`Layout ${layout} did not return a slide element.`);
      }
      if (typeof afterRender === 'function') {
        afterRender(slideEl, { document });
      }
      if (!stageViewport.querySelector('.slide-nav-prev')) {
        stageViewport.appendChild(slideEl);
      } else {
        stageViewport.insertBefore(slideEl, stageViewport.querySelector('.slide-nav-prev'));
      }
    }

    const slidesInDom = Array.from(stageViewport.querySelectorAll('.slide-stage'));
    slidesInDom.forEach((slideEl, index) => {
      if (slideEl instanceof dom.window.HTMLElement && index === 0) {
        slideEl.classList.remove('hidden');
      }
    });

    return dom.serialize();
  } finally {
    restoreDomEnvironment(dom, previousGlobals);
  }
}

export default renderLessonDeckToHtml;
