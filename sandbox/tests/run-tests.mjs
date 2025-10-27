import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { DEFAULT_STATES as MODULE_DEFAULTS, Generators as ModuleGenerators } from '../activity-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturePath = join(__dirname, 'fixtures', 'minimal-deck.html');
const html = await readFile(fixturePath, 'utf8');
const css = await readFile(join(__dirname, '../sandbox-css.css'), 'utf8');

const dom = new JSDOM(html, {
  url: 'https://example.com/sandbox/',
  pretendToBeVisual: true,
});

const { window } = dom;
const { document } = window;

const escapeForRegExp = (value) =>
  value.replace(/[-/\^$*+?.()|[\]{}]/g, '\$&');
const selectorsToInclude = [
  ':root',
  '.deck-workspace.is-blank-active',
  '.deck-workspace.is-blank-active .stage-viewport',
  '.deck-workspace.is-blank-active .slide-stage[data-type="blank"]',
  '.deck-workspace.is-blank-active .slide-stage[data-type="blank"] > .slide-inner',
  '.deck-workspace.is-blank-active .slide-stage[data-type="blank"] .blank-slide',
  '.deck-workspace.is-blank-active .blank-slide > .blank-controls-home',
  '.blank-slide',
  '.blank-controls-home',
  '.blank-canvas',
];
const importantCss = selectorsToInclude
  .map((selector) => {
    const pattern = new RegExp(`${escapeForRegExp(selector)}\\s*{[\\s\\S]*?}`, 'g');
    const matches = css.match(pattern);
    return matches ? matches.join('\n') : '';
  })
  .filter(Boolean)
  .join('\n');
const styleEl = document.createElement('style');
styleEl.textContent = importantCss;
document.head?.append(styleEl);

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

const MODULE_TYPES = ['multiple-choice', 'gapfill', 'grouping', 'table-completion', 'quiz-show'];
const moduleFixtures = MODULE_TYPES.reduce((acc, type) => {
  const config = MODULE_DEFAULTS[type]();
  acc[type] = {
    config,
    html: ModuleGenerators[type](config),
  };
  return acc;
}, {});

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

const deckWorkspace = document.querySelector('.deck-workspace');
assert.ok(deckWorkspace, 'deck workspace should be present');
assert.ok(
  !deckWorkspace.classList.contains('is-blank-active'),
  'workspace should not start in the blank-active state',
);

const counterEl = document.getElementById('slide-counter');
assert.ok(counterEl, 'slide counter should render');

const addSlideBtn = document.getElementById('add-slide-btn');
assert.ok(addSlideBtn, 'add slide button should exist');

const builderOverlay = document.getElementById('activity-builder-overlay');
const builderForm = document.getElementById('activity-builder-form');
const builderPreview = document.getElementById('builder-preview');
assert.ok(builderOverlay instanceof window.HTMLElement, 'builder overlay should mount');
assert.ok(builderForm instanceof window.HTMLFormElement, 'builder form should be available');
assert.ok(builderPreview instanceof window.HTMLElement, 'builder preview container should exist');

const layoutPickerFieldset = builderOverlay.querySelector('.layout-picker');
assert.ok(
  layoutPickerFieldset instanceof window.HTMLElement,
  'layout picker fieldset should exist in the builder',
);
assert.equal(
  layoutPickerFieldset.dataset.layouts,
  'blank-canvas,interactive-practice',
  'layout picker should offer blank and interactive practice layouts',
);

const imageSearchSection = builderOverlay
  .querySelector('.image-search')
  ?.closest('[data-layouts]');
assert.ok(
  imageSearchSection instanceof window.HTMLElement,
  'image search section should be present in the builder',
);
assert.equal(
  imageSearchSection.dataset.layouts,
  'blank-canvas,interactive-practice',
  'image search tools should remain available to blank and interactive practice layouts',
);

addSlideBtn.click();
await flushTimers();
await nextFrame();
assert.ok(builderOverlay.classList.contains('is-visible'), 'builder overlay should open when adding a slide');
assert.ok(
  builderPreview.classList.contains('builder-preview--blank'),
  'blank layout should mark the builder preview as blank',
);

const expectedLayouts = ['blank-canvas', 'interactive-practice'];

expectedLayouts.forEach((value) => {
  const option = builderOverlay.querySelector(`input[name="slideLayout"][value="${value}"]`);
  assert.ok(option instanceof window.HTMLInputElement, `${value} layout option should exist`);
});

const blankLayoutRadio = builderOverlay.querySelector('input[name="slideLayout"][value="blank-canvas"]');
assert.ok(blankLayoutRadio?.checked, 'blank layout should be selected by default');

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
assert.equal(
  imageResults[0].getAttribute('aria-selected'),
  'true',
  'selecting an image should mark the result as selected',
);
assert.ok(
  imageResults[0].classList.contains('is-selected'),
  'selected image should receive the is-selected class',
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

assert.ok(
  deckWorkspace.classList.contains('is-blank-active'),
  'workspace should reflect blank slide activation',
);

const blankCanvas = blankSlide.querySelector('.blank-canvas');
assert.ok(blankCanvas instanceof window.HTMLElement, 'blank canvas should be available');

const moduleOverlay = document.getElementById('module-builder-overlay');
const moduleCloseBtn = moduleOverlay.querySelector('.module-builder-close');

const legacyActionsCluster = blankSlide.querySelector('[data-role="blank-actions"]');
assert.ok(!legacyActionsCluster, 'blank slide should not render the legacy actions cluster');

const canvasToolsToggle = document.getElementById('canvas-tools-toggle');
const canvasToolsMenu = document.getElementById('canvas-tools-menu');
assert.ok(canvasToolsToggle instanceof window.HTMLButtonElement, 'canvas tools toggle should render in the toolbar');
assert.ok(canvasToolsMenu instanceof window.HTMLElement, 'canvas tools menu container should be present');
assert.equal(
  canvasToolsToggle.disabled,
  false,
  'canvas tools toggle should be enabled when a blank slide is active',
);

const ensureCanvasMenuOpen = () => {
  if (canvasToolsMenu.hidden || !canvasToolsMenu.classList.contains('is-open')) {
    canvasToolsToggle.click();
  }
};

assert.ok(canvasToolsMenu.hidden, 'canvas tools menu should be hidden by default');
ensureCanvasMenuOpen();
assert.ok(
  !canvasToolsMenu.hidden && canvasToolsMenu.classList.contains('is-open'),
  'canvas tools menu should open from the toolbar',
);

const selectInsertOption = (action) => {
  ensureCanvasMenuOpen();
  const option = canvasToolsMenu.querySelector(`[data-action="${action}"]`);
  assert.ok(option instanceof window.HTMLButtonElement, `canvas tools menu should list the ${action} option`);
  option.click();
};

selectInsertOption('add-textbox');
await flushTimers();
let textboxes = Array.from(blankCanvas.querySelectorAll('.textbox'));
assert.equal(textboxes.length, 1, 'canvas insert overlay should add a textbox to the blank slide');

selectInsertOption('add-table');
await flushTimers();
assert.equal(
  blankCanvas.querySelectorAll('.canvas-table').length,
  1,
  'canvas insert overlay should add a table to the blank slide',
);

selectInsertOption('add-mindmap');
await flushTimers();
assert.equal(
  blankCanvas.querySelectorAll('.mindmap').length,
  1,
  'canvas insert overlay should add a mind map to the blank slide',
);

selectInsertOption('add-module');
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
      html: moduleFixtures['multiple-choice'].html,
      config: {
        type: 'multiple-choice',
        data: JSON.parse(JSON.stringify(moduleFixtures['multiple-choice'].config)),
      },
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

const blankCanvasStyles = window.getComputedStyle(blankCanvas);
assert.equal(
  blankCanvasStyles.getPropertyValue('overflow').trim(),
  'hidden auto',
  'blank canvas should only surface vertical scrollbars while keeping the horizontal axis hidden',
);
assert.equal(
  parseFloat(blankCanvasStyles.minHeight),
  0,
  'blank canvas flex minimum should allow it to stretch with the viewport',
);
assert.equal(blankCanvasStyles.flexGrow, '1', 'blank canvas should flex to fill the blank slide');
const canvasMinBlockSize = blankCanvasStyles.getPropertyValue('min-block-size').trim();
assert.ok(canvasMinBlockSize.length > 0, 'blank canvas should expose a viewport-aware sizing token');
assert.match(
  canvasMinBlockSize,
  /(dvh|min\(|calc\()/i,
  'blank canvas sizing token should reference the viewport height',
);
const workspaceViewportSizing = window
  .getComputedStyle(deckWorkspace)
  .getPropertyValue('--blank-layout-height')
  .trim();
assert.ok(
  workspaceViewportSizing.includes('100dvh'),
  'blank workspace should track viewport height while the blank layout is active',
);

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

addSlideBtn.click();
await flushTimers();
await nextFrame();

assert.ok(
  builderOverlay.classList.contains('is-visible'),
  'builder overlay should reopen for additional layout selections',
);

const interactivePracticeRadio = builderOverlay.querySelector(
  'input[name="slideLayout"][value="interactive-practice"]',
);
assert.ok(
  interactivePracticeRadio instanceof window.HTMLInputElement,
  'interactive practice layout option should be available',
);
interactivePracticeRadio.checked = true;
interactivePracticeRadio.dispatchEvent(new window.Event('change', { bubbles: true }));
await flushTimers();
await nextFrame();
assert.ok(
  !builderPreview.classList.contains('builder-preview--blank'),
  'non-blank layouts should clear the blank preview modifier',
);

const practiceTitleInput = builderOverlay.querySelector('input[name="practiceTitle"]');
const practiceInstructionsInput = builderOverlay.querySelector(
  'textarea[name="practiceInstructions"]',
);
const practiceTypeInput = builderOverlay.querySelector('select[name="practiceActivityType"]');
assert.ok(
  practiceTitleInput instanceof window.HTMLInputElement,
  'interactive practice title field should exist',
);
assert.ok(
  practiceInstructionsInput instanceof window.HTMLTextAreaElement,
  'interactive practice instructions field should exist',
);
assert.ok(
  practiceTypeInput instanceof window.HTMLSelectElement,
  'interactive practice activity type selector should exist',
);
practiceTitleInput.value = 'Check understanding';
practiceInstructionsInput.value = 'Select the best response for each prompt.';
practiceTypeInput.value = 'multiple-choice';
practiceTypeInput.dispatchEvent(new window.Event('change', { bubbles: true }));

const addPracticeBtn = builderOverlay.querySelector('#builder-add-practice');
assert.ok(
  addPracticeBtn instanceof window.HTMLButtonElement,
  'interactive practice add prompt button should exist',
);
addPracticeBtn.click();
await flushTimers();

const practiceItem = builderOverlay.querySelector('.builder-practice-item');
assert.ok(
  practiceItem instanceof window.HTMLElement,
  'interactive practice prompt item should render after adding',
);
const practicePromptInput = practiceItem.querySelector('input[name="practicePrompt"]');
const practiceOptionsTextarea = practiceItem.querySelector('textarea[name="practiceOptions"]');
const practiceAnswerInput = practiceItem.querySelector('input[name="practiceAnswer"]');
assert.ok(
  practicePromptInput instanceof window.HTMLInputElement,
  'interactive practice prompt field should exist',
);
assert.ok(
  practiceOptionsTextarea instanceof window.HTMLTextAreaElement,
  'interactive practice options field should exist',
);
assert.ok(
  practiceAnswerInput instanceof window.HTMLInputElement,
  'interactive practice answer field should exist',
);
practicePromptInput.value = 'What does Noor mean?';
practiceOptionsTextarea.value = 'Light\nCommunity\nJourney';
practiceAnswerInput.value = 'Light';

builderForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await flushTimers();
await nextFrame();
await window.Promise.resolve();
await new Promise((resolve) => window.setTimeout(resolve, 240));

assert.ok(
  !builderOverlay.classList.contains('is-visible'),
  'builder overlay should close after inserting an interactive practice slide',
);

const practiceSlides = Array.from(
  stageViewport.querySelectorAll('.slide-stage[data-type="interactive-practice"]'),
);
assert.ok(
  practiceSlides.length >= 1,
  'interactive practice submission should add a practice slide to the deck',
);
const practiceSlide = practiceSlides[practiceSlides.length - 1];
assert.ok(practiceSlide instanceof window.HTMLElement, 'interactive practice slide should be present');
assert.ok(!practiceSlide.classList.contains('hidden'), 'interactive practice slide should become the active slide');

assert.ok(
  !deckWorkspace.classList.contains('is-blank-active'),
  'workspace should clear blank state after leaving the blank slide',
);
const workspaceViewportSizingAfterPractice = window
  .getComputedStyle(deckWorkspace)
  .getPropertyValue('--blank-layout-height')
  .trim();
assert.equal(
  workspaceViewportSizingAfterPractice,
  '',
  'blank workspace should clear viewport sizing tokens when the blank layout is inactive',
);

const practiceModuleHost = practiceSlide.querySelector('[data-role="practice-module-host"]');
const practiceAddModuleBtn = practiceSlide.querySelector('[data-action="add-module"]');
assert.ok(
  practiceModuleHost instanceof window.HTMLElement,
  'practice slide should provide a module host container',
);
assert.ok(
  practiceAddModuleBtn instanceof window.HTMLButtonElement,
  'practice slide should provide an Add interactive module button',
);

practiceAddModuleBtn.click();
await flushTimers();
await nextFrame();
assert.ok(
  moduleOverlay.classList.contains('is-visible'),
  'Add interactive module button should launch the module overlay from practice slides',
);
moduleCloseBtn.click();
await flushTimers();
assert.ok(
  !moduleOverlay.classList.contains('is-visible'),
  'module overlay should close after returning from practice slide',
);

addSlideBtn.click();
await flushTimers();
await nextFrame();

assert.ok(
  builderOverlay.classList.contains('is-visible'),
  'builder overlay should reopen when adding another slide for hint assertions',
);

blankLayoutRadio.checked = true;
blankLayoutRadio.dispatchEvent(new window.Event('change', { bubbles: true }));
await flushTimers();

builderForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await flushTimers();
await nextFrame();
await window.Promise.resolve();
await new Promise((resolve) => window.setTimeout(resolve, 240));

const blankSlides = Array.from(stageViewport.querySelectorAll('.slide-stage[data-type="blank"]'));
const moduleOnlyBlankSlide = blankSlides.find((slide) => {
  if (!(slide instanceof window.HTMLElement)) {
    return false;
  }
  const canvas = slide.querySelector('.blank-canvas');
  if (!(canvas instanceof window.HTMLElement)) {
    return false;
  }
  return (
    !canvas.querySelector('.textbox') &&
    !canvas.querySelector('.pasted-image') &&
    !canvas.querySelector('.canvas-table') &&
    !canvas.querySelector('.mindmap') &&
    !canvas.querySelector('.module-embed')
  );
});

assert.ok(moduleOnlyBlankSlide, 'submitting the builder should insert another blank slide for module hint regression tests');
assert.ok(
  !moduleOnlyBlankSlide.classList.contains('hidden'),
  'newly added blank slide should become the active slide for module-only hint checks',
);

const moduleOnlyCanvas = moduleOnlyBlankSlide.querySelector('.blank-canvas');
assert.ok(moduleOnlyCanvas instanceof window.HTMLElement, 'module-only blank slide should provide a canvas');
const moduleOnlyCanvasStyles = window.getComputedStyle(moduleOnlyCanvas);
const toggledCanvasMinBlock = moduleOnlyCanvasStyles
  .getPropertyValue('min-block-size')
  .trim();
assert.ok(
  toggledCanvasMinBlock.length > 0 && /(dvh|min\(|calc\()/i.test(toggledCanvasMinBlock),
  'blank canvas should restore its viewport-aware sizing token after toggling back to the blank layout',
);
assert.equal(
  moduleOnlyCanvasStyles.getPropertyValue('overflow').trim(),
  'hidden auto',
  'module-only blank canvas should continue to avoid stray scrollbars after toggling layouts',
);
const workspaceViewportSizingAfterReturn = window
  .getComputedStyle(deckWorkspace)
  .getPropertyValue('--blank-layout-height')
  .trim();
assert.ok(
  workspaceViewportSizingAfterReturn.includes('100dvh'),
  'blank workspace should resume tracking the viewport height after returning to a blank slide',
);

selectInsertOption('add-module');
await flushTimers();
await nextFrame();
assert.ok(moduleOverlay.classList.contains('is-visible'), 'module overlay should open when adding a module to an otherwise empty blank slide');

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
      html: moduleFixtures.gapfill.html,
      config: {
        type: 'gapfill',
        data: JSON.parse(JSON.stringify(moduleFixtures.gapfill.config)),
      },
    },
    source: moduleFrame.contentWindow,
  }),
);
await flushTimers();

assert.equal(
  moduleOnlyBlankSlide.querySelector('[data-role="hint"], .blank-hint'),
  null,
  'module-only blank slide should not render a hint element',
);

assert.equal(
  moduleOnlyCanvas.querySelectorAll('.module-embed').length,
  1,
  'module overlay should insert a module into the module-only blank slide',
);
assert.ok(
  !moduleOverlay.classList.contains('is-visible'),
  'module overlay should close after inserting a module onto the new blank slide',
);

selectInsertOption('add-textbox');
await flushTimers();

assert.equal(
  moduleOnlyCanvas.querySelectorAll('.textbox').length,
  1,
  'module slide should still accept additional canvas content like textboxes',
);
assert.equal(
  moduleOnlyBlankSlide.querySelector('[data-role="hint"], .blank-hint'),
  null,
  'module blank slide should continue to omit hint elements after adding other content',
);

const toolbarHost = document.querySelector('[data-role="blank-toolbar-host"]');
const toolbar = toolbarHost?.querySelector('[data-role="blank-toolbar"]');
const toolbarToggle = toolbar?.querySelector('.blank-toolbar-toggle');
assert.ok(toolbarHost instanceof window.HTMLElement, 'blank toolbar host should be present');
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

if (toolbarToggle.getAttribute('aria-expanded') !== 'true') {
  toolbarToggle.click();
  await flushTimers();
  await nextFrame();
  await flushTimers();
  await nextFrame();
}
toolbarToggle.click();
await flushTimers();
await nextFrame();
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

const toastRoot = document.getElementById('deck-toast-root');
assert.ok(toastRoot instanceof window.HTMLElement, 'deck toast root should exist for fallback assertions');

const detachedBuilderOverlay = document.getElementById('activity-builder-overlay');
detachedBuilderOverlay?.remove();
assert.equal(
  document.getElementById('activity-builder-overlay'),
  null,
  'builder overlay should be removable for fallback scenarios',
);
assert.equal(
  document.getElementById('activity-builder-form'),
  null,
  'builder form should be absent once the overlay markup is removed',
);

const originalAddSlideButton = document.getElementById('add-slide-btn');
const fallbackAddSlideBtn = originalAddSlideButton.cloneNode(true);
originalAddSlideButton.replaceWith(fallbackAddSlideBtn);

await setupInteractiveDeck();
await flushTimers();
await nextFrame();

const slideCountBeforeFallback = stageViewport.querySelectorAll('.slide-stage').length;
fallbackAddSlideBtn.click();
await flushTimers();
await nextFrame();

let slideCountAfterFallback = stageViewport.querySelectorAll('.slide-stage').length;
assert.equal(
  slideCountAfterFallback,
  slideCountBeforeFallback + 1,
  'fallback add slide button should insert a blank slide when the builder overlay is absent',
);

let fallbackToast = toastRoot.lastElementChild;
assert.ok(fallbackToast instanceof window.HTMLElement, 'fallback add slide should create a toast notification');
assert.match(
  fallbackToast.textContent ?? '',
  /Added a blank slide/i,
  'fallback add slide toast should describe the inserted slide',
);

await setupInteractiveDeck();
await flushTimers();
await nextFrame();

const slideCountBeforeRepeat = stageViewport.querySelectorAll('.slide-stage').length;
fallbackAddSlideBtn.click();
await flushTimers();
await nextFrame();

slideCountAfterFallback = stageViewport.querySelectorAll('.slide-stage').length;
assert.equal(
  slideCountAfterFallback,
  slideCountBeforeRepeat + 1,
  'reinitialising without the overlay should not duplicate the fallback add slide listener',
);

fallbackToast = toastRoot.lastElementChild;
assert.ok(
  fallbackToast instanceof window.HTMLElement,
  'fallback add slide should continue to emit toast notifications after reinitialisation',
);
assert.match(
  fallbackToast.textContent ?? '',
  /Added a blank slide/i,
  'fallback toast should remain consistent across reinitialisations',
);

const moduleParser = new window.DOMParser();

MODULE_TYPES.forEach((type) => {
  const { config, html } = moduleFixtures[type];
  const moduleDoc = moduleParser.parseFromString(html, 'text/html');
  const shell = moduleDoc.querySelector('.activity-shell');
  assert.ok(shell instanceof window.HTMLElement, `${type} module should render the activity shell container`);

  const inlineStyles = Array.from(moduleDoc.querySelectorAll('[style]'));
  assert.equal(inlineStyles.length, 0, `${type} module should avoid inline style attributes`);

  switch (type) {
    case 'multiple-choice': {
      const questions = moduleDoc.querySelectorAll('.mc-question');
      assert.equal(
        questions.length,
        config.questions.length,
        'multiple-choice module should output a question section for each prompt',
      );
      const optionCount = Array.from(moduleDoc.querySelectorAll('.mc-option')).length;
      const expectedOptions = config.questions.reduce((sum, question) => sum + question.options.length, 0);
      assert.equal(optionCount, expectedOptions, 'multiple-choice module should list every configured option');
      break;
    }
    case 'gapfill': {
      const gapInputs = moduleDoc.querySelectorAll('.gapfill-text input');
      const expectedGaps = (config.passage.match(/\[\[/g) || []).length;
      assert.equal(gapInputs.length, expectedGaps, 'gapfill module should render an input for each blank');
      break;
    }
    case 'grouping': {
      const items = moduleDoc.querySelectorAll('.group-item');
      const expectedItems = config.categories.reduce((sum, category) => sum + category.items.length, 0);
      assert.equal(items.length, expectedItems, 'grouping module should create a draggable card per item');
      const targets = moduleDoc.querySelectorAll('.group-target');
      assert.equal(targets.length, config.categories.length, 'grouping module should render a target column for each category');
      break;
    }
    case 'table-completion': {
      const table = moduleDoc.querySelector('.table-activity table');
      assert.ok(table instanceof window.HTMLTableElement, 'table-completion module should render a comparison table');
      const headerCells = table?.querySelectorAll('thead th') ?? [];
      assert.equal(headerCells.length, config.columnHeaders.length, 'table-completion module should include header cells for each column');
      const inputs = table?.querySelectorAll('tbody input') ?? [];
      const expectedInputs = config.rows.reduce((sum, row) => sum + row.answers.length, 0);
      assert.equal(inputs.length, expectedInputs, 'table-completion module should expose inputs for all answers');
      break;
    }
    case 'quiz-show': {
      const quizShell = moduleDoc.querySelector('.quiz-show');
      assert.ok(quizShell instanceof window.HTMLElement, 'quiz-show module should include the quiz show wrapper');
      const slides = quizShell?.querySelectorAll('.quiz-slide') ?? [];
      assert.equal(slides.length, config.questions.length, 'quiz-show module should create a slide per question');
      const pillCount = quizShell?.querySelectorAll('.quiz-pill') ?? [];
      assert.equal(pillCount.length, config.questions.length, 'quiz-show module should render a header pill for each slide');
      const teams = moduleDoc.querySelectorAll('.team-card');
      assert.equal(teams.length, config.teams.length, 'quiz-show module should display scoreboard cards for all teams');
      break;
    }
    default:
      break;
  }
});

console.log('All tests passed');
process.exit(0);
