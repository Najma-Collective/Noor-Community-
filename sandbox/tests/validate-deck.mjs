#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { JSDOM } from 'jsdom';

import archetypes from '../config/archetypes.json' with { type: 'json' };
import {
  createLessonSlideFromState,
  SUPPORTED_LESSON_LAYOUTS,
} from '../int-mod.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sandboxRoot = path.resolve(__dirname, '..');
const fixturesRoot = path.join(__dirname, 'fixtures', 'briefs');

const CSS_FILES = ['sandbox-css.css', 'sandbox-theme.css'];
const cssAssets = await Promise.all(
  CSS_FILES.map(async (filename) => {
    const fullPath = path.join(sandboxRoot, filename);
    const css = await readFile(fullPath, 'utf8');
    return { filename, css };
  }),
);

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

function createDeckShell(document, brief) {
  const body = document.body;

  const status = document.createElement('div');
  status.id = 'deck-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  body.appendChild(status);

  const toastRoot = document.createElement('div');
  toastRoot.id = 'deck-toast-root';
  body.appendChild(toastRoot);

  const deckApp = document.createElement('div');
  deckApp.className = 'deck-app';
  body.appendChild(deckApp);

  const toolbar = document.createElement('header');
  toolbar.className = 'deck-toolbar';
  deckApp.appendChild(toolbar);

  const brand = document.createElement('div');
  brand.className = 'toolbar-brand';
  const brandText = document.createElement('span');
  brandText.textContent = brief?.title ?? 'Sandbox deck';
  brand.appendChild(brandText);
  toolbar.appendChild(brand);

  const slideCounter = document.createElement('div');
  slideCounter.id = 'slide-counter';
  slideCounter.className = 'slide-counter';
  slideCounter.textContent = '0 / 0';
  toolbar.appendChild(slideCounter);

  const actions = document.createElement('div');
  actions.className = 'toolbar-actions';
  toolbar.appendChild(actions);

  const makeButton = (id, label) => {
    const button = document.createElement('button');
    button.id = id;
    button.type = 'button';
    button.textContent = label;
    return button;
  };

  actions.appendChild(makeButton('add-slide-btn', 'Add Blank Slide'));
  actions.appendChild(makeButton('activity-builder-btn', 'Open Builder'));
  actions.appendChild(makeButton('save-state-btn', 'Save'));
  actions.appendChild(makeButton('load-state-btn', 'Load'));

  const loadInput = document.createElement('input');
  loadInput.id = 'load-state-input';
  loadInput.type = 'file';
  actions.appendChild(loadInput);

  const canvasToolsMenu = document.createElement('div');
  canvasToolsMenu.className = 'toolbar-menu';
  canvasToolsMenu.dataset.role = 'canvas-tools';

  const canvasToggle = document.createElement('button');
  canvasToggle.id = 'canvas-tools-toggle';
  canvasToggle.className = 'toolbar-btn has-caret';
  canvasToggle.type = 'button';
  canvasToggle.setAttribute('aria-haspopup', 'true');
  canvasToggle.setAttribute('aria-expanded', 'false');
  canvasToggle.setAttribute('aria-controls', 'canvas-tools-menu');
  canvasToggle.disabled = true;
  canvasToggle.append('Canvas Tools');
  const caret = document.createElement('span');
  caret.className = 'toolbar-caret';
  caret.setAttribute('aria-hidden', 'true');
  canvasToggle.appendChild(caret);

  const canvasDropdown = document.createElement('div');
  canvasDropdown.id = 'canvas-tools-menu';
  canvasDropdown.className = 'toolbar-dropdown';
  canvasDropdown.setAttribute('role', 'menu');
  canvasDropdown.setAttribute('aria-label', 'Canvas tools');
  canvasDropdown.hidden = true;

  const canvasDropdownInner = document.createElement('div');
  canvasDropdownInner.className = 'toolbar-dropdown-inner';
  canvasDropdownInner.dataset.role = 'canvas-tools-options';
  canvasDropdown.appendChild(canvasDropdownInner);

  canvasToolsMenu.appendChild(canvasToggle);
  canvasToolsMenu.appendChild(canvasDropdown);
  actions.appendChild(canvasToolsMenu);

  const workspace = document.createElement('main');
  workspace.id = 'lesson-stage';
  workspace.className = 'deck-workspace';
  deckApp.appendChild(workspace);

  const stageViewport = document.createElement('div');
  stageViewport.className = 'stage-viewport';
  workspace.appendChild(stageViewport);

  return { deckApp, slideCounter, stageViewport };
}

function buildDeckFromBrief(brief) {
  const { dom, previousGlobals } = ensureDomEnvironment();
  const { document } = dom.window;

  cssAssets.forEach(({ filename, css }) => {
    const style = document.createElement('style');
    style.dataset.source = filename;
    style.textContent = css;
    document.head.appendChild(style);
  });

  const slides = Array.isArray(brief?.slides) ? [...brief.slides] : [];
  if (slides.length === 0) {
    throw new Error('Deck briefs must include at least one slide.');
  }

  const { stageViewport, slideCounter } = createDeckShell(document, brief);

  const createdSlides = [];
  slides.forEach((definition, index) => {
    const layout = definition?.layout;
    if (!layout) {
      throw new Error('Each slide requires a "layout" property.');
    }
    if (!SUPPORTED_LESSON_LAYOUTS.includes(layout)) {
      throw new Error(`Unsupported layout in brief: ${layout}`);
    }

    const slide = createLessonSlideFromState({
      layout,
      data: definition?.data ?? {},
    });

    if (!(slide instanceof dom.window.HTMLElement)) {
      throw new Error(`Layout ${layout} did not return a slide element.`);
    }

    if (index === 0) {
      slide.classList.remove('hidden');
    }

    createdSlides.push(slide);
    stageViewport.appendChild(slide);
  });

  const prevBtn = document.createElement('button');
  prevBtn.className = 'slide-nav slide-nav-prev';
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', 'Previous slide');
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>';
  stageViewport.appendChild(prevBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'slide-nav slide-nav-next';
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', 'Next slide');
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>';
  stageViewport.appendChild(nextBtn);

  slideCounter.textContent = `1 / ${createdSlides.length}`;

  return {
    dom,
    previousGlobals,
    stageViewport,
    slideCounter,
    slides: createdSlides,
  };
}

function recordFailure(failures, scope, message, detail) {
  failures.push({ scope, message, detail });
}

function textContent(element) {
  return (element?.textContent ?? '').trim();
}

function checkDeckShell(document, stageViewport, slideCounter, failures, expectedSlideCount) {
  const status = document.getElementById('deck-status');
  if (!status) {
    recordFailure(failures, 'shell', 'Missing deck status region', '#deck-status not found');
  } else {
    if (status.getAttribute('role') !== 'status') {
      recordFailure(failures, 'shell', 'Deck status region should expose role="status"', `role=${status.getAttribute('role')}`);
    }
    if (status.getAttribute('aria-live') !== 'polite') {
      recordFailure(
        failures,
        'shell',
        'Deck status region should announce updates politely',
        `aria-live=${status.getAttribute('aria-live')}`,
      );
    }
  }

  if (!document.getElementById('deck-toast-root')) {
    recordFailure(failures, 'shell', 'Missing toast mount', '#deck-toast-root not found');
  }

  const toolbar = document.querySelector('.deck-toolbar');
  if (!toolbar) {
    recordFailure(failures, 'shell', 'Missing deck toolbar', '.deck-toolbar not found');
  } else {
    const requiredButtons = [
      '#add-slide-btn',
      '#activity-builder-btn',
      '#save-state-btn',
      '#load-state-btn',
      '#canvas-tools-toggle',
    ];
    requiredButtons.forEach((selector) => {
      if (!toolbar.querySelector(selector)) {
        recordFailure(failures, 'shell', 'Missing toolbar control', `${selector} not found`);
      }
    });
  }

  const workspace = document.querySelector('main#lesson-stage.deck-workspace');
  if (!workspace) {
    recordFailure(
      failures,
      'shell',
      'Workspace container should mount inside <main id="lesson-stage" class="deck-workspace">',
      'workspace selector not found',
    );
  }

  const navButtons = Array.from(stageViewport.querySelectorAll('.slide-nav'));
  if (navButtons.length !== 2) {
    recordFailure(
      failures,
      'shell',
      'Deck should render two navigation buttons',
      `found ${navButtons.length} buttons`,
    );
  } else {
    navButtons.forEach((btn) => {
      if (!btn.getAttribute('aria-label')) {
        recordFailure(
          failures,
          'shell',
          'Slide navigation buttons must expose aria-labels',
          `.slide-nav without aria-label (${btn.className})`,
        );
      }
    });
  }

  const slides = Array.from(stageViewport.querySelectorAll('.slide-stage'));
  if (slides.length !== expectedSlideCount) {
    recordFailure(
      failures,
      'shell',
      'Stage should contain one .slide-stage per brief slide',
      `expected ${expectedSlideCount}, found ${slides.length}`,
    );
  }

  if (slides[0] && slides[0].classList.contains('hidden')) {
    recordFailure(failures, 'shell', 'First slide should be visible', 'first slide retains .hidden');
  }

  const counterValue = textContent(slideCounter);
  const expectedCounter = `1 / ${expectedSlideCount}`;
  if (counterValue !== expectedCounter) {
    recordFailure(
      failures,
      'shell',
      'Slide counter should track the visible index',
      `expected "${expectedCounter}" got "${counterValue}"`,
    );
  }
}

function checkBlankCanvas(slide, scope, failures) {
  if (slide.dataset.type !== 'blank') {
    recordFailure(failures, scope, 'Blank canvas slides require data-type="blank"', `data-type=${slide.dataset.type}`);
  }
  if (!slide.querySelector('.blank-slide')) {
    recordFailure(failures, scope, 'Blank canvas should expose .blank-slide wrapper', 'selector .blank-slide not found');
  }
  if (!slide.querySelector('.blank-controls-home[data-role="blank-controls-home"]')) {
    recordFailure(
      failures,
      scope,
      'Blank canvas should expose builder controls host',
      '.blank-controls-home[data-role="blank-controls-home"] not found',
    );
  }
  const workspaceRegion = slide.querySelector('.blank-canvas');
  if (!workspaceRegion) {
    recordFailure(failures, scope, 'Blank canvas should expose editable workspace region', '.blank-canvas not found');
  } else {
    const role = workspaceRegion.getAttribute('role');
    const label = workspaceRegion.getAttribute('aria-label');
    if (role !== 'region' || !label) {
      recordFailure(
        failures,
        scope,
        'Blank workspace should be labelled for assistive tech',
        `role=${role} aria-label=${label}`,
      );
    }
  }
}

function checkLearningObjectives(slide, scope, failures, data) {
  if (!slide.classList.contains('lesson-slide') || !slide.classList.contains('lesson-slide--learning-objectives')) {
    recordFailure(
      failures,
      scope,
      'Learning objectives slides require lesson-slide modifiers',
      `class="${slide.className}"`,
    );
  }
  if (slide.dataset.layout !== 'learning-objectives') {
    recordFailure(
      failures,
      scope,
      'Learning objectives slides should expose data-layout="learning-objectives"',
      `data-layout=${slide.dataset.layout}`,
    );
  }
  const header = slide.querySelector('.lesson-header');
  if (!header) {
    recordFailure(failures, scope, 'Learning objectives slides require .lesson-header', '.lesson-header not found');
  } else if (data?.communicativeGoal) {
    const communicative = header.querySelector('.lesson-communicative');
    if (!communicative) {
      recordFailure(
        failures,
        scope,
        'Communicative goal should render when provided',
        '.lesson-communicative not found',
      );
    } else if (!/So you can/i.test(textContent(communicative))) {
      recordFailure(
        failures,
        scope,
        'Communicative goal line should include "So you can" label',
        communicative.textContent,
      );
    }
  }

  const goalsCard = slide.querySelector('.lesson-body .lesson-goals-card');
  if (!goalsCard) {
    recordFailure(
      failures,
      scope,
      'Learning objectives require the goals card in the body',
      '.lesson-body .lesson-goals-card not found',
    );
  } else {
    const goalItems = Array.from(goalsCard.querySelectorAll('.lesson-goals li'));
    const expectedGoals = Array.isArray(data?.goals) ? data.goals.length : 0;
    if (expectedGoals && goalItems.length !== expectedGoals) {
      recordFailure(
        failures,
        scope,
        'Goal list should render an item per configured goal',
        `expected ${expectedGoals}, found ${goalItems.length}`,
      );
    }
    goalItems.forEach((item, index) => {
      if (!item.querySelector('.lesson-goal-icon')) {
        recordFailure(
          failures,
          scope,
          'Goal items should display the icon wrapper',
          `goal index ${index} missing .lesson-goal-icon`,
        );
      }
      if (!textContent(item.querySelector('p'))) {
        recordFailure(
          failures,
          scope,
          'Goal items should include visible goal text',
          `goal index ${index} missing text`,
        );
      }
    });
  }
}

function checkModelDialogue(slide, scope, failures, data) {
  if (!slide.classList.contains('lesson-slide') || !slide.classList.contains('lesson-slide--model-dialogue')) {
    recordFailure(failures, scope, 'Model dialogue slides should include lesson-slide modifiers', slide.className);
  }
  if (slide.dataset.layout !== 'model-dialogue') {
    recordFailure(
      failures,
      scope,
      'Model dialogue slides should expose data-layout="model-dialogue"',
      `data-layout=${slide.dataset.layout}`,
    );
  }

  const header = slide.querySelector('.lesson-header');
  if (!header) {
    recordFailure(failures, scope, 'Model dialogue slides require .lesson-header', '.lesson-header not found');
  } else if (data?.instructions) {
    if (!header.querySelector('.lesson-instructions')) {
      recordFailure(
        failures,
        scope,
        'Instructions should render inside the header when provided',
        '.lesson-instructions not found',
      );
    }
  }

  const dialogueText = slide.querySelector('.lesson-dialogue-text');
  if (!dialogueText) {
    recordFailure(failures, scope, 'Dialogue text wrapper missing', '.lesson-dialogue-text not found');
  } else {
    const turns = Array.from(dialogueText.querySelectorAll('.dialogue-turn'));
    const expectedTurns = Array.isArray(data?.turns) ? data.turns.length : 0;
    if (expectedTurns && turns.length !== expectedTurns) {
      recordFailure(
        failures,
        scope,
        'Dialogue should render one turn per speaker line',
        `expected ${expectedTurns}, found ${turns.length}`,
      );
    }
    turns.forEach((turn, index) => {
      if (!turn.querySelector('.dialogue-speaker')) {
        recordFailure(
          failures,
          scope,
          'Dialogue turns must include speaker labels',
          `turn index ${index} missing .dialogue-speaker`,
        );
      }
      if (!turn.querySelector('.dialogue-line')) {
        recordFailure(
          failures,
          scope,
          'Dialogue turns must include the spoken line',
          `turn index ${index} missing .dialogue-line`,
        );
      }
    });
  }
}

function checkInteractivePractice(slide, scope, failures, data) {
  if (!slide.classList.contains('interactive-practice-slide')) {
    recordFailure(
      failures,
      scope,
      'Interactive practice slides should include .interactive-practice-slide class',
      slide.className,
    );
  }
  if (data?.activityType && slide.dataset.activityType !== data.activityType) {
    recordFailure(
      failures,
      scope,
      'Interactive practice slides should expose the configured activity type',
      `expected ${data.activityType}, found ${slide.dataset.activityType}`,
    );
  }

  const header = slide.querySelector('.practice-header');
  if (!header) {
    recordFailure(failures, scope, 'Interactive practice requires .practice-header', '.practice-header not found');
  } else {
    if (!header.querySelector('h2')) {
      recordFailure(failures, scope, 'Practice header should include a title', 'h2 not found inside .practice-header');
    }
    if (!header.querySelector('.practice-type')) {
      recordFailure(failures, scope, 'Practice header should expose the activity type label', '.practice-type not found');
    }
  }

  const body = slide.querySelector('.practice-body');
  if (!body) {
    recordFailure(failures, scope, 'Interactive practice slides require .practice-body', '.practice-body not found');
    return;
  }

  if (!body.querySelector('.practice-instructions')) {
    recordFailure(
      failures,
      scope,
      'Practice body should render instructions container',
      '.practice-instructions not found',
    );
  }

  const questions = Array.from(body.querySelectorAll('.practice-questions .practice-question'));
  const expectedQuestions = Array.isArray(data?.questions) ? data.questions.length : 0;
  if (expectedQuestions && questions.length !== expectedQuestions) {
    recordFailure(
      failures,
      scope,
      'Practice questions list should render every configured prompt',
      `expected ${expectedQuestions}, found ${questions.length}`,
    );
  }

  const moduleArea = slide.querySelector('.practice-module[data-role="practice-module-area"]');
  if (!moduleArea) {
    recordFailure(
      failures,
      scope,
      'Interactive practice slides should expose the interactive module host',
      '.practice-module[data-role="practice-module-area"] not found',
    );
  } else {
    if (!moduleArea.querySelector('[data-role="practice-module-host"]')) {
      recordFailure(
        failures,
        scope,
        'Interactive module host should surface data-role="practice-module-host"',
        'host selector not found',
      );
    }
    if (!moduleArea.querySelector('.activity-btn[data-action="add-module"]')) {
      recordFailure(
        failures,
        scope,
        'Interactive module area should expose an add button',
        '.activity-btn[data-action="add-module"] not found',
      );
    }
  }
}

function validateSlides(brief, slides, failures) {
  const archetypeLayouts = { ...archetypes };
  delete archetypeLayouts._meta;

  brief.slides.forEach((definition, index) => {
    const slide = slides[index];
    const layout = definition.layout;
    const scope = `slide ${index + 1} (${layout})`;
    if (!slide) {
      recordFailure(failures, scope, 'Slide missing from rendered deck', 'no slide element created');
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(archetypeLayouts, layout)) {
      recordFailure(
        failures,
        scope,
        'Layout missing from archetype registry',
        `${layout} not found in config/archetypes.json`,
      );
    }

    if (!slide.classList.contains('slide-stage')) {
      recordFailure(
        failures,
        scope,
        'Slide should be wrapped in .slide-stage',
        `class="${slide.className}"`,
      );
    }

    switch (layout) {
      case 'blank-canvas':
        checkBlankCanvas(slide, scope, failures);
        break;
      case 'learning-objectives':
        checkLearningObjectives(slide, scope, failures, definition.data);
        break;
      case 'model-dialogue':
        checkModelDialogue(slide, scope, failures, definition.data);
        break;
      case 'interactive-practice':
        checkInteractivePractice(slide, scope, failures, definition.data);
        break;
      default:
        break;
    }
  });
}

async function loadBriefs() {
  const entries = await readdir(fixturesRoot, { withFileTypes: true });
  const briefs = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort();

  const results = [];
  for (const filename of briefs) {
    const fullPath = path.join(fixturesRoot, filename);
    const raw = await readFile(fullPath, 'utf8');
    const data = JSON.parse(raw);
    results.push({ name: filename, brief: data });
  }
  return results;
}

async function validateBrief(name, brief) {
  const failures = [];
  let deck;
  try {
    deck = buildDeckFromBrief(brief);
  } catch (error) {
    recordFailure(failures, 'initialisation', error.message || String(error));
    return { name, failures };
  }

  const { dom, previousGlobals, stageViewport, slideCounter, slides } = deck;
  try {
    checkDeckShell(dom.window.document, stageViewport, slideCounter, failures, slides.length);
    validateSlides(brief, slides, failures);
  } finally {
    restoreDomEnvironment(dom, previousGlobals);
  }

  return { name, failures };
}

async function main() {
  const briefs = await loadBriefs();
  if (briefs.length === 0) {
    console.warn('No deck briefs found. Skipping compliance checks.');
    return;
  }

  const reports = [];
  for (const { name, brief } of briefs) {
    const result = await validateBrief(name, brief);
    if (result.failures.length > 0) {
      reports.push(result);
    }
  }

  if (reports.length > 0) {
    console.error('Deck compliance issues detected:');
    reports.forEach(({ name, failures }) => {
      console.error(`- ${name}`);
      failures.forEach((failure) => {
        const detail = failure.detail ? ` (${failure.detail})` : '';
        console.error(`  • [${failure.scope}] ${failure.message}${detail}`);
      });
    });
    process.exitCode = 1;
    return;
  }

  console.log('Deck compliance checks passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
