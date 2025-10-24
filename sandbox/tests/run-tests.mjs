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
  url: 'https://example.com/',
  pretendToBeVisual: true,
});

const { window } = dom;
const { document } = window;

global.window = window;
global.document = document;
global.HTMLElement = window.HTMLElement;
global.Element = window.Element;
global.Document = window.Document;
global.HTMLButtonElement = window.HTMLButtonElement;
global.HTMLInputElement = window.HTMLInputElement;
global.HTMLTextAreaElement = window.HTMLTextAreaElement;
global.HTMLIFrameElement = window.HTMLIFrameElement;
global.HTMLImageElement = window.HTMLImageElement;
global.HTMLFormElement = window.HTMLFormElement;
global.HTMLSelectElement = window.HTMLSelectElement;
global.RadioNodeList = window.RadioNodeList;
global.FormData = window.FormData;
global.HTMLTableElement = window.HTMLTableElement;
global.HTMLTableSectionElement = window.HTMLTableSectionElement;
global.HTMLTableRowElement = window.HTMLTableRowElement;
global.HTMLTableCellElement = window.HTMLTableCellElement;
global.MutationObserver = window.MutationObserver;
global.HTMLScriptElement = window.HTMLScriptElement;
global.Node = window.Node;
global.CustomEvent = window.CustomEvent;
global.DOMParser = window.DOMParser;
global.getComputedStyle = window.getComputedStyle.bind(window);
global.navigator = window.navigator;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
window.navigator.clipboard = {
  writeText: async () => {},
};
if (!window.crypto?.randomUUID) {
  window.crypto = window.crypto || {};
  window.crypto.randomUUID = () => '00000000-0000-4000-8000-000000000000';
}
global.requestAnimationFrame = window.requestAnimationFrame.bind(window);
global.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
if (!window.HTMLMediaElement.prototype.play) {
  window.HTMLMediaElement.prototype.play = async () => {};
}
window.HTMLMediaElement.prototype.play = async () => {};
window.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
global.IntersectionObserver = window.IntersectionObserver;
document.execCommand = () => true;
global.fetch = async () => ({
  ok: true,
  status: 200,
  headers: new window.Headers(),
  text: async () => '',
  json: async () => ({}),
});

const moduleFrame = document.getElementById('module-builder-frame');
Object.defineProperty(moduleFrame, 'contentWindow', {
  value: {
    postMessage: () => {},
  },
});

const moduleOverlay = document.getElementById('module-builder-overlay');
const moduleCloseBtn = moduleOverlay.querySelector('.module-builder-close');

const {
  setupInteractiveDeck,
  addBlankSlide,
  createBlankSlide,
  attachBlankSlideEvents,
  createTextbox,
} = await import(
  pathToFileURL(join(__dirname, '../int-mod.js')).href
);

await setupInteractiveDeck();

const stageViewport = document.querySelector('.stage-viewport');
assert.ok(stageViewport, 'stage viewport should exist');

const blankSlide = createBlankSlide();
attachBlankSlideEvents(blankSlide);
stageViewport.appendChild(blankSlide);

const canvas = blankSlide.querySelector('.blank-canvas');
assert.ok(canvas, 'blank canvas should exist');

const addTextboxBtn = blankSlide.querySelector('[data-action="add-textbox"]');
addTextboxBtn.click();
assert.equal(
  canvas.querySelectorAll('.textbox').length,
  1,
  'textbox should be added to canvas',
);

const addTableBtn = blankSlide.querySelector('[data-action="add-table"]');
addTableBtn.click();
assert.equal(
  canvas.querySelectorAll('.canvas-table').length,
  1,
  'table should be added to canvas',
);

const addMindmapBtn = blankSlide.querySelector('[data-action="add-mindmap"]');
addMindmapBtn.click();
assert.equal(
  canvas.querySelectorAll('.mindmap').length,
  1,
  'mind map should be added to canvas',
);

const addModuleBtn = blankSlide.querySelector('[data-action="add-module"]');
addModuleBtn.click();
await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
assert.ok(
  moduleOverlay.classList.contains('is-visible'),
  'module overlay should open after clicking add module',
);

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
      config: { type: 'multiple-choice', data: { title: 'Quick Knowledge Check' } },
    },
    source: moduleFrame.contentWindow,
  }),
);
assert.equal(
  canvas.querySelectorAll('.module-embed').length,
  1,
  'module embed should be inserted into canvas',
);
assert.ok(
  !moduleOverlay.classList.contains('is-visible'),
  'module overlay should close after module insertion',
);

const legacySlide = document.createElement('div');
legacySlide.className = 'slide-stage hidden';
legacySlide.dataset.type = 'blank';
legacySlide.innerHTML = `
  <div class="slide-inner">
    <div class="blank-slide">
      <div class="blank-controls">
        <button class="activity-btn" type="button" data-action="add-textbox">
          <i class="fa-solid fa-pen-to-square"></i>
          Add Textbox
        </button>
        <button class="activity-btn secondary" type="button" data-action="add-mindmap">
          <i class="fa-solid fa-diagram-project"></i>
          Add Mind Map
        </button>
      </div>
      <p class="blank-hint" data-role="hint">Legacy hint text.</p>
      <div class="blank-canvas" role="region" aria-label="Blank slide workspace"></div>
    </div>
  </div>
`;

const legacyCanvas = legacySlide.querySelector('.blank-canvas');
assert.ok(legacyCanvas, 'legacy blank canvas should exist');

const legacyTextbox = createTextbox();
legacyTextbox.id = 'legacy-textbox';
legacyCanvas.appendChild(legacyTextbox);

stageViewport.appendChild(legacySlide);
attachBlankSlideEvents(legacySlide);

assert.ok(
  legacySlide.querySelector('[data-role="blank-controls-home"]'),
  'legacy slide should be upgraded with controls home region',
);
assert.ok(
  legacySlide.querySelector('[data-role="blank-toolbar"]'),
  'legacy slide should gain toolbar host',
);

const legacyAddTextboxBtn = legacySlide.querySelector('[data-action="add-textbox"]');
const legacyAddTableBtn = legacySlide.querySelector('[data-action="add-table"]');
const legacyAddMindmapBtn = legacySlide.querySelector('[data-action="add-mindmap"]');
const legacyAddModuleBtn = legacySlide.querySelector('[data-action="add-module"]');

assert.ok(legacyAddTextboxBtn, 'legacy slide should still offer textbox control');
assert.ok(legacyAddTableBtn, 'legacy slide should expose table control');
assert.ok(legacyAddMindmapBtn, 'legacy slide should offer mind map control');
assert.ok(legacyAddModuleBtn, 'legacy slide should expose module control');

legacyAddTextboxBtn.click();
assert.equal(
  legacyCanvas.querySelectorAll('.textbox').length,
  2,
  'legacy slide should support adding a textbox',
);

legacyAddTableBtn.click();
assert.equal(
  legacyCanvas.querySelectorAll('.canvas-table').length,
  1,
  'legacy slide should support adding a table',
);

legacyAddMindmapBtn.click();
assert.equal(
  legacyCanvas.querySelectorAll('.mindmap').length,
  1,
  'legacy slide should support adding a mind map',
);

legacyAddModuleBtn.click();
await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
assert.ok(
  moduleOverlay.classList.contains('is-visible'),
  'module overlay should open for legacy slide',
);

window.dispatchEvent(
  new window.MessageEvent('message', {
    data: {
      source: 'noor-activity-builder',
      type: 'activity-module',
      html: '<div class="module-body">Legacy Module</div>',
      config: { type: 'grouping', data: { title: 'Legacy Activity' } },
    },
    source: moduleFrame.contentWindow,
  }),
);
assert.equal(
  legacyCanvas.querySelectorAll('.module-embed').length,
  1,
  'legacy slide should insert a module',
);
assert.ok(
  !moduleOverlay.classList.contains('is-visible'),
  'module overlay should close after inserting into legacy slide',
);

const legacyTextboxPersisted = legacySlide.querySelector('#legacy-textbox');
assert.ok(legacyTextboxPersisted, 'existing legacy textbox should persist after upgrade');

addBlankSlide();
await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
const managedBlankSlides = stageViewport.querySelectorAll('.slide-stage[data-type="blank"]');
const managedBlankSlide = managedBlankSlides[managedBlankSlides.length - 1];
const managedCanvas = managedBlankSlide.querySelector('.blank-canvas');
const blankControlsTrigger = document.querySelector('.blank-controls-trigger');
assert.ok(blankControlsTrigger, 'blank controls trigger should exist for managed blank slide');
blankControlsTrigger.click();
await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
const blankControlsPanel = document.querySelector('.blank-controls-flyout');
assert.ok(
  blankControlsPanel?.classList.contains('is-visible'),
  'blank controls panel should be visible after toggling trigger',
);
blankControlsPanel.querySelector('[data-action="add-textbox"]').click();
assert.equal(
  managedCanvas.querySelectorAll('.textbox').length,
  1,
  'blank controls panel should add a textbox to the managed canvas',
);
blankControlsPanel.querySelector('[data-action="add-table"]').click();
assert.equal(
  managedCanvas.querySelectorAll('.canvas-table').length,
  1,
  'blank controls panel should add a table to the managed canvas',
);
blankControlsPanel.querySelector('[data-action="add-mindmap"]').click();
assert.equal(
  managedCanvas.querySelectorAll('.mindmap').length,
  1,
  'blank controls panel should add a mind map to the managed canvas',
);
blankControlsPanel.querySelector('[data-action="add-module"]').click();
await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
assert.ok(
  moduleOverlay.classList.contains('is-visible'),
  'blank controls panel should open module overlay when adding a module',
);
moduleCloseBtn.click();

const builderOverlay = document.getElementById('activity-builder-overlay');
const addSlideBtn = document.getElementById('add-slide-btn');
addSlideBtn.click();
await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
assert.ok(builderOverlay.classList.contains('is-visible'), 'builder overlay should open');

const facilitationRadio = builderOverlay.querySelector('input[value="facilitation"]');
facilitationRadio.checked = true;
facilitationRadio.dispatchEvent(new window.Event('change', { bubbles: true }));

const builderForm = document.getElementById('activity-builder-form');
builderForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));

const activitySlides = stageViewport.querySelectorAll('.slide-stage.activity-slide');
assert.equal(activitySlides.length, 1, 'activity slide should be added to the deck');
const insertedSlide = activitySlides[0];
assert.equal(insertedSlide.dataset.activity, 'rubric', 'inserted slide should include rubric metadata');

console.log('All tests passed');
