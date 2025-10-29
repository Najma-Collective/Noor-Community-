import { SUPPORTED_LESSON_LAYOUTS } from '../../int-mod.js';
import { collectUnknownClasses } from './css-allowlist.mjs';

const LAYOUT_INVARIANTS = new Map([
  [
    'hero-overlay',
    ['.bg-media', '.img-overlay', '.overlay-card'],
  ],
  [
    'reflection-board',
    ['.reflection-board-grid'],
  ],
  [
    'split-grid',
    ['.split-grid-columns'],
  ],
  [
    'blank-canvas',
    ['.blank-canvas'],
  ],
]);

const ARCHETYPE_INVARIANTS = new Map([
  ['interactive.activity-card', ['.activity-card']],
  ['interactive.token-board', ['.token-board-summary', '.token-summary']],
  ['interactive.token-table', ['.token-table-summary']],
  ['interactive.token-quiz', ['.token-quiz-summary']],
  ['interactive.quiz-feedback', ['.quiz-feedback-summary']],
  ['interactive.audio-dialogue', ['.audio-dialogue-summary']],
]);

export async function captureConsole(fn) {
  const errors = [];
  const warnings = [];
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = (...args) => {
    errors.push(args);
    if (typeof originalError === 'function') {
      originalError(...args);
    }
  };
  console.warn = (...args) => {
    warnings.push(args);
    if (typeof originalWarn === 'function') {
      originalWarn(...args);
    }
  };
  try {
    return { result: await fn(), errors, warnings };
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
}

function ensureElement(node, { context, issues, document }) {
  const view = document?.defaultView ?? globalThis;
  const ElementCtor = view?.HTMLElement ?? globalThis.HTMLElement;
  if (!node || typeof ElementCtor !== 'function' || !(node instanceof ElementCtor)) {
    issues.push(`${context} should be an HTMLElement.`);
    return false;
  }
  return true;
}

export function validateDeckDocument(document, payload = {}, { isAllowedClass = () => true } = {}) {
  const issues = [];
  if (!document) {
    return ['Document was not provided for validation.'];
  }

  const payloadSlides = Array.isArray(payload?.slides) ? payload.slides : [];

  const skipLink = document.querySelector('a.skip-link[href="#lesson-stage"]');
  if (!skipLink) {
    issues.push('Deck should include a skip link targeting #lesson-stage.');
  }

  const statusRegion = document.getElementById('deck-status');
  if (!statusRegion) {
    issues.push('Deck should include a #deck-status region.');
  } else {
    if (statusRegion.getAttribute('role') !== 'status') {
      issues.push('#deck-status should have role="status".');
    }
    if (statusRegion.getAttribute('aria-live') !== 'polite') {
      issues.push('#deck-status should have aria-live="polite".');
    }
    if (statusRegion.getAttribute('aria-atomic') !== 'true') {
      issues.push('#deck-status should have aria-atomic="true".');
    }
  }

  const toastRoot = document.getElementById('deck-toast-root');
  if (!toastRoot) {
    issues.push('Deck should include a #deck-toast-root container.');
  } else if (!toastRoot.classList.contains('deck-toast-container')) {
    issues.push('#deck-toast-root should have the deck-toast-container class.');
  }

  const toolbar = document.querySelector('.deck-toolbar');
  if (!toolbar) {
    issues.push('Deck toolbar (.deck-toolbar) is missing.');
  } else if (!toolbar.querySelector('.toolbar-actions')) {
    issues.push('Deck toolbar should include a .toolbar-actions container.');
  }

  const workspace = document.querySelector('main#lesson-stage.deck-workspace');
  if (!workspace) {
    issues.push('Deck workspace main#lesson-stage.deck-workspace is missing.');
  }

  const stageViewport = document.querySelector('.stage-viewport');
  if (!stageViewport) {
    issues.push('Deck should include a .stage-viewport container.');
  }

  const navPrev = stageViewport?.querySelector('.slide-nav-prev') ?? null;
  const navNext = stageViewport?.querySelector('.slide-nav-next') ?? null;
  const navButtons = stageViewport
    ? Array.from(stageViewport.querySelectorAll('.slide-nav'))
    : [];
  if (navButtons.length !== 2) {
    issues.push('Stage viewport should include exactly two navigation buttons.');
  }
  if (navPrev && !ensureElement(navPrev, { context: 'Previous slide control', issues, document })) {
    // ensureElement already recorded an issue.
  } else if (navPrev && navPrev.getAttribute('aria-label') !== 'Previous slide') {
    issues.push('Previous slide control should have aria-label="Previous slide".');
  }
  if (navNext && !ensureElement(navNext, { context: 'Next slide control', issues, document })) {
    // ensureElement already recorded an issue.
  } else if (navNext && navNext.getAttribute('aria-label') !== 'Next slide') {
    issues.push('Next slide control should have aria-label="Next slide".');
  }

  const slideEls = stageViewport
    ? Array.from(stageViewport.querySelectorAll('.slide-stage'))
    : [];
  if (slideEls.length !== payloadSlides.length) {
    issues.push(
      `Rendered slide count (${slideEls.length}) did not match payload slides (${payloadSlides.length}).`,
    );
  }
  if (stageViewport && slideEls.length && navPrev && navPrev.previousElementSibling !== slideEls.at(-1)) {
    issues.push('Navigation controls should appear after the rendered slides.');
  }
  if (stageViewport && navPrev && navNext && navPrev.nextElementSibling !== navNext) {
    issues.push('Previous slide control should precede the next slide control.');
  }

  const slideViolationClasses = new Set();

  slideEls.forEach((slideEl, index) => {
    if (!ensureElement(slideEl, { context: `Slide ${index + 1}`, issues, document })) {
      return;
    }

    const slideType = slideEl.dataset.type ?? '';
    const layout = slideEl.dataset.layout ?? '';
    const isBlankSlide = slideType === 'blank' || (!slideType && !layout);
    const isLessonSlide = !isBlankSlide;

    if (isLessonSlide) {
      if (!layout) {
        issues.push(`Slide ${index + 1} is missing a data-layout attribute.`);
      } else if (!SUPPORTED_LESSON_LAYOUTS.includes(layout)) {
        issues.push(`Slide ${index + 1} uses unsupported layout "${layout}".`);
      }

      if (slideType && slideType !== 'lesson') {
        issues.push(`Slide ${index + 1} should declare data-type="lesson" (received "${slideType}").`);
      }

      if (!slideEl.classList.contains('lesson-slide')) {
        issues.push(`Slide ${index + 1} should include the lesson-slide class.`);
      }
      if (layout && !slideEl.classList.contains(`lesson-slide--${layout}`)) {
        issues.push(`Slide ${index + 1} should include the lesson-slide--${layout} modifier class.`);
      }
    }

    const innerSelector = isLessonSlide ? '.lesson-slide-inner' : '.slide-inner';
    const inner = slideEl.querySelector(innerSelector);
    if (!inner) {
      issues.push(
        `Slide ${index + 1} is missing its ${isLessonSlide ? '.lesson-slide-inner' : '.slide-inner'} container.`,
      );
    }

    if (isBlankSlide) {
      if (!slideEl.querySelector('.blank-canvas')) {
        issues.push(`Slide ${index + 1} should include a .blank-canvas region.`);
      }
      if (!slideEl.querySelector('.blank-controls-home')) {
        issues.push(`Slide ${index + 1} should include blank slide controls.`);
      }
    }

    if (index === 0) {
      if (slideEl.classList.contains('hidden')) {
        issues.push('The first slide should be visible (not have the hidden class).');
      }
    } else if (!slideEl.classList.contains('hidden')) {
      issues.push(`Slide ${index + 1} should start hidden to preserve navigation state.`);
    }

    if (isLessonSlide && layout) {
      const layoutSelectors = LAYOUT_INVARIANTS.get(layout) ?? [];
      layoutSelectors.forEach((selector) => {
        if (!slideEl.querySelector(selector)) {
          issues.push(`Slide ${index + 1} (${layout}) is missing required selector ${selector}.`);
        }
      });
    }

    const archetype = payloadSlides[index]?.archetype ?? '';
    if (archetype) {
      const archetypeSelectors = ARCHETYPE_INVARIANTS.get(archetype) ?? [];
      archetypeSelectors.forEach((selector) => {
        if (!slideEl.querySelector(selector)) {
          issues.push(`Slide ${index + 1} (${archetype}) is missing required selector ${selector}.`);
        }
      });
    }

    const violations = collectUnknownClasses(slideEl, isAllowedClass);
    if (violations.size) {
      const classNames = Array.from(violations.keys());
      classNames.forEach((className) => slideViolationClasses.add(className));
      issues.push(
        `Slide ${index + 1} included non-sandbox classes: ${classNames.join(', ')}.`,
      );
    }
  });

  const documentViolations = collectUnknownClasses(document.body ?? document.documentElement, isAllowedClass);
  if (documentViolations.size) {
    const docSpecific = Array.from(documentViolations.keys()).filter(
      (className) => !slideViolationClasses.has(className),
    );
    if (docSpecific.length) {
      issues.push(
        `Deck document included non-sandbox classes outside slides: ${docSpecific.join(', ')}.`,
      );
    }
  }

  return issues;
}
