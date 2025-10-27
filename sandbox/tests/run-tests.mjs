import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

import {
  createLessonSlideFromState,
  SUPPORTED_LESSON_LAYOUTS,
} from '../int-mod.js';
import { BUILDER_LAYOUT_DEFAULTS } from '../slide-templates.js';
import {
  collectUnknownClasses,
  loadSandboxClassAllowlist,
} from './helpers/css-allowlist.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const css = await readFile(join(__dirname, '../sandbox-css.css'), 'utf8');
const { isAllowed: isAllowedClass } = await loadSandboxClassAllowlist();

const dom = new JSDOM('<!doctype html><html lang="en"><head></head><body></body></html>', {
  pretendToBeVisual: true,
});

const { window } = dom;
const { document } = window;

Object.assign(globalThis, {
  window,
  document,
  HTMLElement: window.HTMLElement,
  Element: window.Element,
  Node: window.Node,
  navigator: window.navigator,
  getComputedStyle: window.getComputedStyle.bind(window),
});

global.window = window;
global.document = document;

document.head.appendChild(document.createElement('style')).textContent = css;

const assertNoUnknownClasses = (root, context) => {
  const violations = collectUnknownClasses(root, isAllowedClass);
  const classes = Array.from(violations.keys());
  assert.equal(classes.length, 0, `${context} should only include sandbox classes. Found: ${classes.join(', ')}`);
};

const expectedLayouts = [
  'blank-canvas',
  'hero-pill',
  'icon-instruction-list',
  'emoji-gallery',
  'note-grid',
  'quiz-card',
];

assert.deepEqual(
  Array.from(SUPPORTED_LESSON_LAYOUTS).sort(),
  [...expectedLayouts].sort(),
  'Supported layouts should match the new canonical set.',
);

typeof BUILDER_LAYOUT_DEFAULTS['hero-pill'] === 'function' ||
  assert.fail('Builder defaults should provide a hero-pill preset.');

const render = (layout, overrides = {}) => {
  const defaults = BUILDER_LAYOUT_DEFAULTS[layout]?.() ?? {};
  const slide = createLessonSlideFromState({ layout, data: { ...defaults, ...overrides } });
  assert.ok(slide instanceof window.HTMLElement, `${layout} renderer should return an element.`);
  if (layout !== 'blank-canvas') {
    assert.equal(slide.dataset.layout, layout, `${layout} slide should label its layout.`);
  }
  assertNoUnknownClasses(slide, `${layout} slide`);
  return slide;
};

const heroSlide = render('hero-pill');
const heroPill = heroSlide.querySelector('.pill');
assert.ok(heroPill, 'hero-pill slide should render a pill badge.');
assert.ok(heroPill?.textContent?.trim().length > 0, 'hero-pill should include pill text.');
assert.ok(
  heroSlide.querySelector('h1'),
  'hero-pill slide should include an H1 heading for the hero title.',
);
assert.ok(
  heroSlide.querySelector('.deck-subtitle'),
  'hero-pill slide should provide a subtitle styled with deck-subtitle.',
);
assert.ok(
  heroSlide.querySelectorAll('p').length >= 2,
  'hero-pill slide should include descriptive paragraphs.',
);

const instructionSlide = render('icon-instruction-list');
const instructionList = instructionSlide.querySelector('.instruction-list');
assert.ok(instructionList, 'instruction-list layout should render an instruction list.');
assert.ok(
  instructionList?.querySelectorAll('li').length >= 3,
  'instruction-list layout should include default instruction items.',
);
assert.ok(
  Array.from(instructionList?.querySelectorAll('i') ?? []).every((icon) => icon.className.includes('fa-')),
  'instruction-list items should include icon glyphs.',
);

const gallerySlide = render('emoji-gallery');
const galleryGrid = gallerySlide.querySelector('.gallery-grid');
assert.ok(galleryGrid, 'emoji-gallery layout should render a gallery grid.');
assert.ok(
  galleryGrid?.querySelectorAll('.gallery-card').length >= 3,
  'emoji-gallery layout should include default gallery cards.',
);
assert.ok(
  gallerySlide.querySelector('.feedback-msg'),
  'emoji-gallery layout should include a feedback message using the feedback-msg class.',
);

const noteSlide = render('note-grid');
const splitGrid = noteSlide.querySelector('.split-grid');
assert.ok(splitGrid, 'note-grid layout should render a split-grid container.');
assert.ok(
  splitGrid?.querySelectorAll('.note-card').length >= 3,
  'note-grid layout should provide editable note-card tiles.',
);
const tipsGrid = noteSlide.querySelector('.tips-grid');
assert.ok(tipsGrid, 'note-grid layout should render a tips-grid.');
assert.ok(
  tipsGrid?.querySelectorAll('.tip-card').length >= 3,
  'note-grid layout should include tip-card entries.',
);

const quizSlide = render('quiz-card');
const quizCard = quizSlide.querySelector('.quiz-card');
assert.ok(quizCard, 'quiz-card layout should render a quiz-card container.');
const quizOptions = quizCard?.querySelectorAll('.quiz-option');
assert.ok(quizOptions?.length >= 3, 'quiz-card layout should list multiple quiz options.');
const quizContainer = quizCard?.querySelector('.quiz-options');
assert.ok(quizContainer?.dataset.quizId, 'quiz-card layout should set a quiz identifier.');
const feedback = quizCard?.querySelector('.feedback-msg.success');
assert.ok(feedback, 'quiz-card layout should include a success feedback message.');
assert.ok(feedback?.hasAttribute('hidden'), 'quiz-card feedback should be hidden by default.');

const blankSlide = render('blank-canvas');
assert.ok(
  blankSlide.querySelector('.blank-canvas'),
  'blank-canvas layout should still expose the editable blank canvas region.',
);

console.log('All sandbox layout tests passed.');
