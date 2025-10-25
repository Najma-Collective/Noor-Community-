import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturePath = join(__dirname, 'fixtures', 'minimal-deck.html');
const html = await readFile(fixturePath, 'utf8');

const dom = new JSDOM(html, {
  url: 'https://example.com/sandbox/',
  pretendToBeVisual: true,
});

const { window } = dom;
const { document } = window;

const noop = () => {};
const nextFrame = () =>
  new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
const flushTimers = () =>
  new Promise((resolve) => window.setTimeout(resolve, 0));

if (typeof window.requestAnimationFrame !== 'function') {
  window.requestAnimationFrame = (callback) => window.setTimeout(callback, 16);
}
if (typeof window.cancelAnimationFrame !== 'function') {
  window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);
}

class ResizeObserver {
  constructor(callback = noop) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!window.ResizeObserver) {
  window.ResizeObserver = ResizeObserver;
}

if (!window.PointerEvent) {
  class PointerEvent extends window.Event {
    constructor(type, options = {}) {
      super(type, options);
      this.button = options.button ?? 0;
    }
  }
  window.PointerEvent = PointerEvent;
}

if (!window.crypto?.randomUUID) {
  window.crypto = window.crypto || {};
  window.crypto.randomUUID = () => '00000000-0000-4000-8000-000000000000';
}

Object.assign(globalThis, {
  window,
  document,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
  Element: window.Element,
  Document: window.Document,
  HTMLButtonElement: window.HTMLButtonElement,
  HTMLInputElement: window.HTMLInputElement,
  HTMLTextAreaElement: window.HTMLTextAreaElement,
  HTMLIFrameElement: window.HTMLIFrameElement,
  HTMLImageElement: window.HTMLImageElement,
  HTMLFormElement: window.HTMLFormElement,
  HTMLSelectElement: window.HTMLSelectElement,
  RadioNodeList: window.RadioNodeList,
  FormData: window.FormData,
  HTMLTableElement: window.HTMLTableElement,
  HTMLTableSectionElement: window.HTMLTableSectionElement,
  HTMLTableRowElement: window.HTMLTableRowElement,
  HTMLTableCellElement: window.HTMLTableCellElement,
  MutationObserver: window.MutationObserver,
  HTMLScriptElement: window.HTMLScriptElement,
  Node: window.Node,
  CustomEvent: window.CustomEvent,
  Event: window.Event,
  MouseEvent: window.MouseEvent,
  KeyboardEvent: window.KeyboardEvent,
  FocusEvent: window.FocusEvent,
  Range: window.Range,
  Selection: window.Selection,
  DOMParser: window.DOMParser,
  getComputedStyle: window.getComputedStyle.bind(window),
  ResizeObserver: window.ResizeObserver,
  Headers: window.Headers,
  Blob: window.Blob,
  File: window.File,
});

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

window.navigator.clipboard = {
  writeText: async () => {},
};

window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
window.scrollTo = noop;
window.prompt = () => '';
window.requestAnimationFrame = window.requestAnimationFrame.bind(window);
window.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);

global.requestAnimationFrame = window.requestAnimationFrame;
global.cancelAnimationFrame = window.cancelAnimationFrame;

global.fetchCalls = [];
const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';
const samplePhotos = [
  {
    id: 101,
    alt: 'Students collaborating at a table',
    src: {
      large2x: 'https://images.example.com/classroom-large2x.jpg',
      medium: 'https://images.example.com/classroom-medium.jpg',
    },
  },
  {
    id: 202,
    alt: 'Teacher leading discussion',
    src: {
      large: 'https://images.example.com/discussion-large.jpg',
      small: 'https://images.example.com/discussion-small.jpg',
    },
  },
];

global.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url ?? '';
  fetchCalls.push({ url, init });
  if (url.startsWith(PEXELS_SEARCH_URL)) {
    return {
      ok: true,
      status: 200,
      headers: new window.Headers(),
      json: async () => ({ photos: samplePhotos }),
      text: async () => JSON.stringify({ photos: samplePhotos }),
    };
  }
  return {
    ok: true,
    status: 200,
    headers: new window.Headers(),
    json: async () => ({}),
    text: async () => '',
  };
};

const moduleFrame = document.getElementById('module-builder-frame');
Object.defineProperty(moduleFrame, 'contentWindow', {
  value: {
    postMessage: () => {},
  },
});

const {
  setupInteractiveDeck,
} = await import(pathToFileURL(join(__dirname, '../int-mod.js')).href);

await setupInteractiveDeck();
await flushTimers();
await nextFrame();

const stageViewport = document.querySelector('.stage-viewport');
assert.ok(stageViewport, 'stage viewport should be present');

const counterEl = document.getElementById('slide-counter');
assert.ok(counterEl, 'slide counter should render');

const addSlideBtn = document.getElementById('add-slide-btn');
assert.ok(addSlideBtn, 'add slide button should exist');

const builderOverlay = document.getElementById('activity-builder-overlay');
const builderForm = document.getElementById('activity-builder-form');
assert.ok(builderOverlay instanceof window.HTMLElement, 'builder overlay should mount');
assert.ok(builderForm instanceof window.HTMLFormElement, 'builder form should be available');

addSlideBtn.click();
await flushTimers();
await nextFrame();
assert.ok(builderOverlay.classList.contains('is-visible'), 'builder overlay should open when adding a slide');

const blankLayoutRadio = builderOverlay.querySelector('input[name="slideLayout"][value="blank-canvas"]');
assert.ok(blankLayoutRadio?.checked, 'blank layout should be selected by default');

const communicativeRadio = builderOverlay.querySelector('input[name="slideLayout"][value="communicative-task"]');
assert.ok(communicativeRadio, 'communicative task layout option should exist');
communicativeRadio.checked = true;
communicativeRadio.dispatchEvent(new window.Event('change', { bubbles: true }));
await flushTimers();

const builderStatus = document.getElementById('builder-status');
assert.ok(builderStatus, 'builder status region should exist');

const builderImageSearchInput = builderOverlay.querySelector('input[name="imageSearch"]');
const builderImageSearchBtn = builderOverlay.querySelector('[data-action="search-image"]');
assert.ok(builderImageSearchInput instanceof window.HTMLInputElement, 'image search input should exist');
assert.ok(builderImageSearchBtn instanceof window.HTMLButtonElement, 'image search button should exist');

builderImageSearchInput.value = 'classroom discussion';
builderImageSearchBtn.click();
await flushTimers();
await nextFrame();

const imageResults = Array.from(builderOverlay.querySelectorAll('.image-result'));
assert.equal(imageResults.length, samplePhotos.length, 'pexels results should render in the builder');

const imageStatus = document.getElementById('image-search-status');
assert.match(imageStatus.textContent ?? '', /Found 2 image/, 'image search status should announce the number of results');

imageResults[0].click();
const taskImageField = builderOverlay.querySelector('input[name="taskImageUrl"]');
assert.equal(
  taskImageField?.value,
  samplePhotos[0].src.large2x,
  'selecting an image should populate the communicative task image field',
);

blankLayoutRadio.checked = true;
blankLayoutRadio.dispatchEvent(new window.Event('change', { bubbles: true }));
await flushTimers();

builderForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await flushTimers();
await nextFrame();
await window.Promise.resolve();
await new Promise((resolve) => window.setTimeout(resolve, 240));

assert.ok(!builderOverlay.classList.contains('is-visible'), 'builder overlay should close after submitting');

const slides = Array.from(stageViewport.querySelectorAll('.slide-stage'));
assert.equal(slides.length, 3, 'builder submission should add a new slide to the deck');

const blankSlide = slides.find((slide) => slide.dataset.type === 'blank');
assert.ok(blankSlide instanceof window.HTMLElement, 'blank slide should be inserted into the deck');
assert.ok(!blankSlide.classList.contains('hidden'), 'blank slide should become the active slide');

const blankCanvas = blankSlide.querySelector('.blank-canvas');
assert.ok(blankCanvas instanceof window.HTMLElement, 'blank canvas should be available');

const blankActions = blankSlide.querySelector('[data-role="blank-actions"]');
assert.ok(blankActions, 'blank slide actions cluster should exist');

const clickBlankAction = (action) => {
  const button = blankActions.querySelector(`[data-action="${action}"]`);
  assert.ok(button instanceof window.HTMLButtonElement, `blank slide should expose the ${action} action`);
  button.click();
};

clickBlankAction('add-textbox');
await flushTimers();
let textboxes = Array.from(blankCanvas.querySelectorAll('.textbox'));
assert.equal(textboxes.length, 1, 'blank slide should add a textbox from the primary controls');

clickBlankAction('add-table');
await flushTimers();
assert.equal(
  blankCanvas.querySelectorAll('.canvas-table').length,
  1,
  'blank slide should add a table from the primary controls',
);

clickBlankAction('add-mindmap');
await flushTimers();
assert.equal(
  blankCanvas.querySelectorAll('.mindmap').length,
  1,
  'blank slide should add a mind map from the primary controls',
);

const moduleOverlay = document.getElementById('module-builder-overlay');
const moduleCloseBtn = moduleOverlay.querySelector('.module-builder-close');

clickBlankAction('add-module');
await flushTimers();
await nextFrame();
assert.ok(moduleOverlay.classList.contains('is-visible'), 'module overlay should open when adding a module');

window.dispatchEvent(
  new window.MessageEvent('message', {
    data: { source: 'noor-activity-builder', type: 'activity-module', status: 'ready' },
    source: moduleFrame.contentWindow,
  }),
);

window.dispatchEvent(
  new window.MessageEvent('message', {
    data: {
      source: 'noor-activity-builder',
      type: 'activity-module',
      html: '<div class="module-body">Module Content</div>',
      config: { type: 'multiple-choice', data: { title: 'Quick check' } },
    },
    source: moduleFrame.contentWindow,
  }),
);
await flushTimers();

assert.equal(
  blankCanvas.querySelectorAll('.module-embed').length,
  1,
  'module embed should be inserted onto the canvas',
);
assert.ok(!moduleOverlay.classList.contains('is-visible'), 'module overlay should close after inserting a module');

const canvasInsertTrigger = stageViewport.querySelector('.canvas-insert-trigger');
const canvasInsertPanel = stageViewport.querySelector('.canvas-insert-panel');
assert.ok(canvasInsertTrigger instanceof window.HTMLButtonElement, 'canvas insert trigger should render near the stage');
assert.ok(canvasInsertPanel instanceof window.HTMLElement, 'canvas insert panel should be created');

const ensureInsertPanelOpen = () => {
  if (!canvasInsertPanel.classList.contains('is-visible')) {
    canvasInsertTrigger.click();
  }
};

ensureInsertPanelOpen();
assert.ok(canvasInsertPanel.classList.contains('is-visible'), 'canvas insert panel should toggle into view');

const selectInsertOption = (action) => {
  ensureInsertPanelOpen();
  const option = canvasInsertPanel.querySelector(`[data-action="${action}"]`);
  assert.ok(option instanceof window.HTMLButtonElement, `insert panel should list the ${action} option`);
  option.click();
};

const initialTextboxCount = textboxes.length;
selectInsertOption('add-textbox');
await flushTimers();
textboxes = Array.from(blankCanvas.querySelectorAll('.textbox'));
assert.equal(
  textboxes.length,
  initialTextboxCount + 1,
  'canvas insert overlay should add another textbox',
);

selectInsertOption('add-table');
await flushTimers();
assert.equal(
  blankCanvas.querySelectorAll('.canvas-table').length,
  2,
  'canvas insert overlay should add another table',
);

selectInsertOption('add-mindmap');
await flushTimers();
assert.equal(
  blankCanvas.querySelectorAll('.mindmap').length,
  1,
  'canvas insert overlay should not duplicate mind maps when one exists',
);

selectInsertOption('add-module');
await flushTimers();
await nextFrame();
assert.ok(moduleOverlay.classList.contains('is-visible'), 'insert panel should be able to launch the module overlay');
moduleCloseBtn.click();
await flushTimers();
assert.ok(!moduleOverlay.classList.contains('is-visible'), 'module overlay should close when dismissed');

const toolbar = blankSlide.querySelector('[data-role="blank-toolbar"]');
const toolbarToggle = toolbar?.querySelector('.blank-toolbar-toggle');
assert.ok(toolbar instanceof window.HTMLElement, 'blank toolbar container should be present');
assert.ok(toolbarToggle instanceof window.HTMLButtonElement, 'blank toolbar toggle should exist');

toolbarToggle.click();
await flushTimers();
await nextFrame();

const primaryTextbox = textboxes[0];
assert.ok(primaryTextbox instanceof window.HTMLElement, 'a textbox should be available for formatting tests');
primaryTextbox.dispatchEvent(new window.Event('pointerdown', { bubbles: true }));

const textboxBody = primaryTextbox.querySelector('.textbox-body');
assert.ok(textboxBody instanceof window.HTMLElement, 'textbox body should exist');
textboxBody.textContent = 'Format me nicely';
textboxBody.focus();

const textboxTab = toolbar.querySelector('[data-tools-target="textbox"]');
assert.ok(textboxTab instanceof window.HTMLButtonElement, 'textbox tools tab should exist');
textboxTab.click();
await flushTimers();

const activeTextboxSection = toolbar.querySelector('.blank-toolbar-section[data-tools-for="textbox"][data-active="true"]');
assert.ok(activeTextboxSection instanceof window.HTMLElement, 'textbox tools section should be active');

const range = document.createRange();
range.selectNodeContents(textboxBody);
const selection = window.getSelection();
selection.removeAllRanges();
selection.addRange(range);
document.dispatchEvent(new window.Event('selectionchange'));

const boldButton = activeTextboxSection.querySelector('button[data-command="bold"]');
assert.ok(boldButton instanceof window.HTMLButtonElement, 'bold formatting control should exist');
boldButton.click();
assert.match(
  textboxBody.innerHTML,
  /<strong>Format me nicely<\/strong>/i,
  'bold command should wrap the selected text',
);

selection.removeAllRanges();
const highlightRange = document.createRange();
highlightRange.selectNodeContents(textboxBody);
selection.addRange(highlightRange);
document.dispatchEvent(new window.Event('selectionchange'));

const highlightButton = activeTextboxSection.querySelector('button[data-command="highlight"]');
assert.ok(highlightButton instanceof window.HTMLButtonElement, 'highlight control should exist');
highlightButton.click();
assert.ok(
  textboxBody.querySelector('mark.textbox-highlight'),
  'highlight command should add a highlight wrapper',
);

const colorSwatch = activeTextboxSection.querySelector('.textbox-color-swatch[data-color="wheat"]');
assert.ok(colorSwatch instanceof window.HTMLElement, 'textbox colour swatch should exist');
colorSwatch.click();
assert.equal(primaryTextbox.dataset.color, 'wheat', 'colour swatch should update the textbox colour');

const textboxShadowToggle = activeTextboxSection.querySelector('[data-role="textbox-shadow"]');
assert.ok(textboxShadowToggle instanceof window.HTMLInputElement, 'textbox shadow toggle should exist');
textboxShadowToggle.checked = true;
textboxShadowToggle.dispatchEvent(new window.Event('change', { bubbles: true }));
assert.equal(primaryTextbox.dataset.effect, 'shadow', 'textbox shadow toggle should mark the textbox with a shadow effect');

toolbarToggle.click();
await flushTimers();
await nextFrame();
assert.equal(toolbarToggle.getAttribute('aria-expanded'), 'false', 'toolbar should collapse when toggled closed');

primaryTextbox.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true }));
assert.equal(
  toolbarToggle.getAttribute('aria-expanded'),
  'false',
  'selecting a textbox should not expand the toolbar automatically',
);

const canvasTable = blankCanvas.querySelector('.canvas-table');
assert.ok(canvasTable instanceof window.HTMLElement, 'a table should be present for toolbar regressions');
canvasTable.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true }));
assert.equal(
  toolbarToggle.getAttribute('aria-expanded'),
  'false',
  'selecting a table should not expand the toolbar automatically',
);

const mindmapBranch = blankCanvas.querySelector('.mindmap-branch');
assert.ok(mindmapBranch instanceof window.HTMLElement, 'a mind map branch should be present for toolbar regressions');
mindmapBranch.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true }));
assert.equal(
  toolbarToggle.getAttribute('aria-expanded'),
  'false',
  'selecting a mind map branch should not expand the toolbar automatically',
);

toolbarToggle.click();
await flushTimers();
await nextFrame();
assert.equal(toolbarToggle.getAttribute('aria-expanded'), 'true', 'toolbar should reopen when toggled again');

const imageIngestor = blankCanvas.__deckImageIngestor;
assert.ok(imageIngestor, 'blank canvas should expose an image ingestion helper');

const imageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQI12P4//8/AwAI/AL+XafqGAAAAABJRU5ErkJggg==';
const ingestedImage = await imageIngestor.ingestDataUrl(imageDataUrl, {
  name: 'Pixel',
  naturalWidth: 400,
  naturalHeight: 300,
  source: 'test-suite',
});
await flushTimers();
await nextFrame();

assert.ok(ingestedImage instanceof window.HTMLElement, 'image ingestion should return the inserted element');
assert.ok(
  blankCanvas.contains(ingestedImage),
  'ingested image should reside within the canvas',
);

const imageTab = toolbar.querySelector('[data-tools-target="image"]');
assert.ok(imageTab instanceof window.HTMLButtonElement, 'image tools tab should exist');
imageTab.click();
await flushTimers();

const imageTools = toolbar.querySelector('.blank-toolbar-section[data-tools-for="image"][data-active="true"]');
assert.ok(imageTools instanceof window.HTMLElement, 'image tools section should activate for selected images');

const imageShadowToggle = imageTools.querySelector('[data-role="image-shadow"]');
const imageSizeInput = imageTools.querySelector('[data-role="image-size"]');
assert.ok(imageShadowToggle instanceof window.HTMLInputElement, 'image shadow toggle should be available');
assert.ok(imageSizeInput instanceof window.HTMLInputElement, 'image size slider should be rendered');

const initialWidth = parseInt(ingestedImage.style.width || ingestedImage.dataset.baseWidth || '0', 10) || 0;
imageSizeInput.value = '150';
imageSizeInput.dispatchEvent(new window.Event('input', { bubbles: true }));
const scaledWidth = parseInt(ingestedImage.style.width || '0', 10);
assert.notEqual(scaledWidth, initialWidth, 'image size control should update the rendered width');

imageShadowToggle.checked = true;
imageShadowToggle.dispatchEvent(new window.Event('change', { bubbles: true }));
assert.equal(ingestedImage.dataset.effect, 'shadow', 'image shadow toggle should annotate the image with a shadow effect');

console.log('All tests passed');
process.exit(0);
