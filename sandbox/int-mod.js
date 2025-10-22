// Shared interactive module for Noor Community decks

let slideNavigatorFactory;
let slideNavigatorLoaderPromise;
let slideNavigatorLoadLogged = false;

async function resolveSlideNavigatorFactory() {
  if (typeof slideNavigatorFactory === "function") {
    return slideNavigatorFactory;
  }

  if (typeof window !== "undefined" && typeof window.initSlideNavigator === "function") {
    slideNavigatorFactory = window.initSlideNavigator;
    return slideNavigatorFactory;
  }

  if (!slideNavigatorLoaderPromise) {
    slideNavigatorLoaderPromise = import("./slide-nav.js")
      .then((module) => {
        const navigator = module?.initSlideNavigator;
        if (typeof navigator === "function") {
          slideNavigatorFactory = navigator;
          return navigator;
        }
        return null;
      })
      .catch((error) => {
        if (!slideNavigatorLoadLogged) {
          console.warn("Slide navigator module failed to load", error);
          slideNavigatorLoadLogged = true;
        }
        return null;
      });
  }

  const navigator = await slideNavigatorLoaderPromise;

  if (typeof navigator === "function") {
    return navigator;
  }

  if (typeof window !== "undefined" && typeof window.initSlideNavigator === "function") {
    slideNavigatorFactory = window.initSlideNavigator;
    return slideNavigatorFactory;
  }

  return null;
}

export const TEXTBOX_COLOR_OPTIONS = [
  { value: "sage", label: "Sage" },
  { value: "wheat", label: "Wheat" },
  { value: "sky", label: "Sky" },
  { value: "rose", label: "Rose" },
  { value: "slate", label: "Slate" },
];

export const DEFAULT_TEXTBOX_COLOR = TEXTBOX_COLOR_OPTIONS[0].value;

const DEFAULT_TABLE_ROWS = 2;
const DEFAULT_TABLE_COLUMNS = 3;
const TABLE_HEADER_PLACEHOLDER = "Add heading";
const TABLE_CELL_PLACEHOLDER = "Add detail";

export const renderColorSwatchButtons = (options = TEXTBOX_COLOR_OPTIONS) =>
  options
    .map(
      ({ value, label }) => `
<button
  type="button"
  class="textbox-color-swatch"
  data-color="${value}"
  aria-pressed="false"
>
  <span class="sr-only">${label}</span>
</button>
    `,
    )
    .join("");

let stageViewport;
let nextBtn;
let prevBtn;
let counter;
let addSlideBtn;
let saveStateBtn;
let loadStateBtn;
let loadStateInput;
let highlightBtn;
let highlightColorSelect;
let removeHighlightBtn;
let slideNavigatorController;
let activityBuilderBtn;
let builderOverlay;
let builderForm;
let builderAddPromptBtn;
let builderPromptList;
let builderJsonPreview;
let builderCancelBtn;
let builderCloseBtn;
let builderStatusEl;
let builderLayoutInputs;
let builderPreview;
let builderRefreshPreviewBtn;
let builderLastFocus;
let builderFieldId = 0;
let builderImageResults;
let builderImageStatus;
let builderImageSearchBtn;
let builderImageSearchInput;
let moduleOverlay;
let moduleFrame;
let moduleCloseBtn;
let moduleLastFocus;
let moduleTargetCanvas;
let moduleInsertCallback;
let deckToastRoot;
let deckStatusEl;


const MINDMAP_BRANCH_PRESETS = [
  { value: "idea", label: "Idea" },
  { value: "opportunity", label: "Opportunity" },
  { value: "challenge", label: "Challenge" },
  { value: "evidence", label: "Evidence" },
  { value: "question", label: "Question" },
];

const MINDMAP_CATEGORY_COLOR_MAP = {
  idea: "sage",
  opportunity: "wheat",
  challenge: "rose",
  evidence: "sky",
  question: "slate",
};

const BUILDER_STATUS_TIMEOUT = 3200;

const MODULE_TYPE_LABELS = {
  'multiple-choice': 'Multiple choice',
  gapfill: 'Gap fill',
  grouping: 'Grouping',
  'table-completion': 'Table completion',
};

const DECK_TOAST_TIMEOUT = 3600;

const PEXELS_API_KEY = 'ntFmvz0n4RpCRtHtRVV7HhAcbb4VQLwyEenPsqfIGdvpVvkgagK2dQEd';
const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

const DEFAULT_BUILDER_PROMPTS = [
  {
    prompt: "Does the proposal clearly identify the community challenge?",
    success:
      "Learners reference evidence from the brief and explain why the need matters to stakeholders.",
  },
  {
    prompt: "Is the suggested solution realistic for the community context?",
    success:
      "Learners highlight available resources, partnerships, or constraints that influence feasibility.",
  },
  {
    prompt: "How well do learners articulate the positive impact?",
    success:
      "Learners describe tangible benefits for the community and connect them to longer-term outcomes.",
  },
];

const isValidMindmapColor = (color) =>
  typeof color === "string" &&
  TEXTBOX_COLOR_OPTIONS.some((option) => option.value === color);

const getMindmapColorForCategory = (value) => {
  const fallback = TEXTBOX_COLOR_OPTIONS[0]?.value ?? "sage";
  if (typeof value !== "string") {
    return fallback;
  }
  return MINDMAP_CATEGORY_COLOR_MAP[value] ?? fallback;
};

const getMindmapColourLabel = (value) =>
  TEXTBOX_COLOR_OPTIONS.find((option) => option.value === value)?.label ??
  value;

const getMindmapPreset = (value) =>
  MINDMAP_BRANCH_PRESETS.find((preset) => preset.value === value);

const getMindmapLabelForCategory = (value) =>
  getMindmapPreset(value)?.label ?? MINDMAP_BRANCH_PRESETS[0].label;

const getNextBranchCategory = (branchesEl) => {
  const existing = Array.from(
    branchesEl?.querySelectorAll(".mindmap-branch") ?? [],
  ).length;
  const preset =
    MINDMAP_BRANCH_PRESETS[existing % MINDMAP_BRANCH_PRESETS.length];
  return preset?.value ?? MINDMAP_BRANCH_PRESETS[0].value;
};

const REMOTE_IMAGE_SELECTOR = "img[data-remote-src]";
const remoteImageHydrations = new WeakMap();

function getRemoteImageContainer(img) {
  if (!(img instanceof HTMLElement)) {
    return null;
  }
  return (
    img.closest(".bg-media") ??
    img.closest(".context-image") ??
    img.parentElement
  );
}

function applyRemoteImageFallback(img, error) {
  if (error) {
    console.warn(
      `Falling back to a gradient background for remote image: ${img?.dataset?.remoteSrc ?? "unknown"}`,
      error,
    );
  }
  const container = getRemoteImageContainer(img);
  if (container) {
    container.classList.add("remote-image-fallback");
  }
  img.dataset.remoteHydrated = "failed";
}

async function hydrateRemoteImage(img) {
  if (!(img instanceof HTMLImageElement)) {
    return;
  }

  const remoteSrc = img.dataset.remoteSrc;
  if (!remoteSrc) {
    return;
  }

  if (typeof fetch !== "function") {
    applyRemoteImageFallback(img, new Error("Fetch API is unavailable"));
    return;
  }

  const hydrationState = img.dataset.remoteHydrated;
  if (hydrationState === "success" || hydrationState === "failed") {
    return;
  }

  if (remoteImageHydrations.has(img)) {
    return remoteImageHydrations.get(img);
  }

  const hydrationPromise = (async () => {
    try {
      await new Promise((resolve, reject) => {
        function cleanup() {
          img.removeEventListener("load", handleLoad);
          img.removeEventListener("error", handleError);
        }

        function handleLoad() {
          cleanup();
          resolve();
        }

        function handleError(err) {
          cleanup();
          reject(new Error("Image failed to load from src", { cause: err }));
        }

        img.addEventListener("load", handleLoad, { once: true });
        img.addEventListener("error", handleError, { once: true });
        img.removeAttribute("loading");
        img.src = remoteSrc; // The key change is here
      });

      img.dataset.remoteHydrated = "success";
    } catch (error) {
      applyRemoteImageFallback(img, error);
    } finally {
      remoteImageHydrations.delete(img);
    }
  })();

  remoteImageHydrations.set(img, hydrationPromise);
  return hydrationPromise;
}

async function hydrateRemoteImages(root = document) {
  if (!root) {
    return;
  }

  const scope =
    root instanceof Element || root instanceof Document ? root : document;
  const queryFn =
    typeof scope.querySelectorAll === "function"
      ? scope.querySelectorAll.bind(scope)
      : null;
  const remoteImages = queryFn ? Array.from(queryFn(REMOTE_IMAGE_SELECTOR)) : [];

  if (!remoteImages.length) {
    return;
  }

  await Promise.all(
    remoteImages.map((img) => {
      const hydration = hydrateRemoteImage(img);
      if (hydration && typeof hydration.then === "function") {
        return hydration.catch((error) => {
          console.warn("Remote image hydration failed", error);
        });
      }
      return undefined;
    }),
  );
}

function getDeckStatusElement() {
  if (!deckStatusEl || !(deckStatusEl instanceof HTMLElement)) {
    deckStatusEl = document.getElementById('deck-status');
  }
  return deckStatusEl instanceof HTMLElement ? deckStatusEl : null;
}

function announceDeckStatus(message) {
  const statusNode = getDeckStatusElement();
  if (statusNode) {
    statusNode.textContent = message;
  }
}

function getDeckToastRoot() {
  if (!deckToastRoot || !(deckToastRoot instanceof HTMLElement)) {
    deckToastRoot = document.getElementById('deck-toast-root');
  }
  return deckToastRoot instanceof HTMLElement ? deckToastRoot : null;
}

function showDeckToast(message, { icon = 'fa-circle-info', timeout = DECK_TOAST_TIMEOUT } = {}) {
  const root = getDeckToastRoot();
  announceDeckStatus(message);
  if (!root) {
    return null;
  }

  const toast = document.createElement('div');
  toast.className = 'deck-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <i class="fa-solid ${icon}" aria-hidden="true"></i>
    <span>${message}</span>
  `;
  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    toast.addEventListener(
      'transitionend',
      () => {
        toast.remove();
      },
      { once: true }
    );
  }, Math.max(2000, timeout));

  return toast;
}

let slides = [];
let currentSlideIndex = 0;
let mindMapId = 0;

const normaliseWhitespace = (text) =>
  typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";

const normaliseResponseValue = (value) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLowerCase() : "";

const trimText = (value) => (typeof value === "string" ? value.trim() : "");

const escapeHtml = (value = "") =>
  typeof value === "string"
    ? value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
    : "";

const splitMultiline = (value) =>
  trimText(value)
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

const parseRubricLevels = (value) =>
  typeof value === "string"
    ? value
        .split(",")
        .map((level) => level.trim())
        .filter(Boolean)
    : [];

const buildRubricSection = ({
  heading = "Success criteria",
  intro,
  rubric = { criteria: [], levels: [] },
  className = "activity-rubric",
} = {}) => {
  const section = document.createElement("section");
  section.className = className;
  section.dataset.role = "rubric";

  const headingEl = document.createElement("h3");
  const icon = document.createElement("i");
  icon.className = "fa-solid fa-list-check";
  icon.setAttribute("aria-hidden", "true");
  headingEl.appendChild(icon);
  const resolvedHeading = trimText(heading) || "Success criteria";
  headingEl.appendChild(document.createTextNode(` ${resolvedHeading}`));
  section.appendChild(headingEl);

  const resolvedIntro = trimText(intro);
  if (resolvedIntro) {
    const introParagraph = document.createElement("p");
    introParagraph.className = "rubric-intro";
    introParagraph.textContent = resolvedIntro;
    section.appendChild(introParagraph);
  }

  const rubricLevels = Array.isArray(rubric?.levels) ? rubric.levels : [];
  if (rubricLevels.length) {
    const levelsWrap = document.createElement("div");
    levelsWrap.className = "rubric-levels";
    rubricLevels.forEach((level) => {
      const chip = document.createElement("span");
      chip.className = "level-chip";
      chip.textContent = level;
      levelsWrap.appendChild(chip);
    });
    section.appendChild(levelsWrap);
  }

  const criteriaList = document.createElement("div");
  criteriaList.className = "rubric-criteria";
  section.appendChild(criteriaList);

  const rubricCriteria = Array.isArray(rubric?.criteria) ? rubric.criteria : [];
  if (rubricCriteria.length) {
    rubricCriteria.forEach((criterion) => {
      const card = document.createElement("article");
      card.className = "rubric-card";
      const cardTitle = document.createElement("h4");
      cardTitle.textContent = criterion.prompt;
      card.appendChild(cardTitle);
      const successText = trimText(criterion.success);
      if (successText) {
        const cardBody = document.createElement("p");
        cardBody.textContent = successText;
        card.appendChild(cardBody);
      }
      criteriaList.appendChild(card);
    });
  } else {
    const emptyCriteria = document.createElement("p");
    emptyCriteria.className = "activity-empty";
    emptyCriteria.textContent =
      "Add at least one success criterion for learners to reference.";
    criteriaList.appendChild(emptyCriteria);
  }

  return section;
};

const generateBuilderFieldId = (prefix = "builder-field") => {
  builderFieldId += 1;
  return `${prefix}-${builderFieldId}`;
};

function getSlideStageLabel(slide, index) {
  const pillText = normaliseWhitespace(slide?.querySelector?.(".pill")?.textContent);
  if (pillText) {
    const [stage] = pillText.split("·");
    const label = normaliseWhitespace(stage);
    if (label) {
      return label;
    }
  }
  if (slide?.dataset?.type === "blank") {
    return "Blank slide";
  }
  return `Slide ${index + 1}`;
}

function getSlideTitle(slide, index) {
  const heading =
    slide?.querySelector?.("h2") ||
    slide?.querySelector?.("h1") ||
    slide?.querySelector?.("h3");
  const headingText = normaliseWhitespace(heading?.textContent);
  if (headingText) {
    return headingText;
  }
  if (slide?.dataset?.type === "blank") {
    return "Blank workspace";
  }
  return `Slide ${index + 1}`;
}

function buildSlideNavigatorMeta() {
  return slides.map((slide, index) => ({
    stage: getSlideStageLabel(slide, index),
    title: getSlideTitle(slide, index),
  }));
}

function cleanupSlide(slide) {
  if (!(slide instanceof HTMLElement)) {
    return;
  }

  if (typeof slide.__deckBlankCleanup === "function") {
    try {
      slide.__deckBlankCleanup();
    } catch (error) {
      console.warn("Blank slide cleanup threw an error", error);
    }
    delete slide.__deckBlankCleanup;
  }

  if (
    moduleTargetCanvas instanceof HTMLElement &&
    slide.contains(moduleTargetCanvas)
  ) {
    closeModuleOverlay({ focus: false });
  }

  slide.querySelectorAll(".module-embed").forEach((module) => {
    if (!(module instanceof HTMLElement)) {
      return;
    }
    if (typeof module.__deckModuleCleanup === "function") {
      try {
        module.__deckModuleCleanup();
      } catch (error) {
        console.warn("Module embed cleanup failed", error);
      }
      delete module.__deckModuleCleanup;
    }
    const iframe = module.querySelector("iframe");
    if (iframe instanceof HTMLIFrameElement) {
      iframe.src = "about:blank";
    }
  });
}

function refreshSlides() {
  slides = Array.from(stageViewport?.querySelectorAll(".slide-stage") ?? []);
  slideNavigatorController?.updateSlides(buildSlideNavigatorMeta());
}

function updateCounter() {
  if (!counter) return;
  const total = slides.length;
  const current = total ? currentSlideIndex + 1 : 0;
  counter.textContent = `${current} / ${total}`;
}

function showSlide(index) {
  if (!slides.length) return;
  currentSlideIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("hidden", slideIndex !== currentSlideIndex);
  });
  updateCounter();
  slideNavigatorController?.setActive(currentSlideIndex);
}

function focusSlideAtIndex(index) {
  const slide = slides[index];
  if (!(slide instanceof HTMLElement)) {
    return;
  }

  const focusTarget = slide.querySelector(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]',
  );

  if (focusTarget instanceof HTMLElement) {
    focusTarget.focus({ preventScroll: true });
    return;
  }

  const inner = slide.querySelector(".slide-inner");
  if (inner instanceof HTMLElement) {
    const hadTabindex = inner.hasAttribute("tabindex");
    const previousTabindex = inner.getAttribute("tabindex");
    if (!hadTabindex) {
      inner.setAttribute("tabindex", "-1");
    }
    inner.focus({ preventScroll: true });
    if (!hadTabindex) {
      inner.removeAttribute("tabindex");
    } else if (previousTabindex !== null) {
      inner.setAttribute("tabindex", previousTabindex);
    }
    return;
  }

  const hadTabindex = slide.hasAttribute("tabindex");
  const previousTabindex = slide.getAttribute("tabindex");
  if (!hadTabindex) {
    slide.setAttribute("tabindex", "-1");
  }
  slide.focus({ preventScroll: true });
  if (!hadTabindex) {
    slide.removeAttribute("tabindex");
  } else if (previousTabindex !== null) {
    slide.setAttribute("tabindex", previousTabindex);
  }
}

function navigate(direction) {
  showSlide(currentSlideIndex + direction);
}

function setupNavigation() {
  nextBtn?.addEventListener("click", () => navigate(1));
  prevBtn?.addEventListener("click", () => navigate(-1));

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement) {
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigate(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigate(-1);
    }
  });
}

function ensureLegacyNavigationBridge() {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof window.navigateSlides !== "function") {
    window.navigateSlides = () => {};
  }
}

export function addBlankSlide() {
  if (!stageViewport) return;
  const newSlide = createBlankSlide();
  const insertionPoint = prevBtn ?? nextBtn ?? null;
  stageViewport.insertBefore(newSlide, insertionPoint);
  attachBlankSlideEvents(newSlide);
  refreshSlides();
  showSlide(slides.length - 1);
}

export function duplicateSlide(index = currentSlideIndex) {
  if (!(stageViewport instanceof HTMLElement)) {
    showDeckToast("Slides are not ready to duplicate yet.", {
      icon: "fa-triangle-exclamation",
    });
    return null;
  }

  refreshSlides();
  if (!slides.length) {
    showDeckToast("There are no slides to duplicate right now.", {
      icon: "fa-circle-info",
    });
    return null;
  }

  const targetIndex = Number.isInteger(index) ? index : currentSlideIndex;
  const sourceSlide = slides[targetIndex];
  if (!(sourceSlide instanceof HTMLElement)) {
    showDeckToast("We couldn't find that slide to duplicate.", {
      icon: "fa-triangle-exclamation",
    });
    return null;
  }

  const clonedSlide = sourceSlide.cloneNode(true);
  if (!(clonedSlide instanceof HTMLElement)) {
    showDeckToast("Slide duplication is unavailable right now.", {
      icon: "fa-triangle-exclamation",
    });
    return null;
  }

  clonedSlide.classList.add("hidden");
  clonedSlide.classList.remove("is-active");

  clonedSlide
    .querySelectorAll('[data-dragging], [data-resizing], [data-selected]')
    .forEach((el) => {
      if (el instanceof HTMLElement) {
        el.removeAttribute("data-dragging");
        el.removeAttribute("data-resizing");
        el.removeAttribute("data-selected");
      }
    });

  recalibrateMindMapCounter();
  const mindmapInputs = Array.from(
    clonedSlide.querySelectorAll('.mindmap-form input[id^="mindmap-branch-"]'),
  );
  mindmapInputs.forEach((input) => {
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    const previousId = input.id;
    const nextId = `mindmap-branch-${++mindMapId}`;
    input.id = nextId;
    if (input.getAttribute("aria-labelledby") === previousId) {
      input.setAttribute("aria-labelledby", nextId);
    }
    const form = input.closest("form");
    if (form instanceof HTMLElement && previousId) {
      const labelSelector = `[for="${previousId}"]`;
      form.querySelectorAll(labelSelector).forEach((label) => {
        if (label instanceof HTMLLabelElement) {
          label.setAttribute("for", nextId);
        }
      });
    }
  });

  if (clonedSlide.dataset.type === "blank") {
    attachBlankSlideEvents(clonedSlide);
  }

  if (clonedSlide.classList.contains("activity-slide")) {
    initialiseBuilderSlide(clonedSlide);
  }

  initialiseActivities(clonedSlide);

  if (clonedSlide.dataset.type !== "blank") {
    clonedSlide
      .querySelectorAll('.module-embed')
      .forEach((module) => initialiseModuleEmbed(module));
  }

  const referenceNode = sourceSlide.nextSibling;
  stageViewport.insertBefore(clonedSlide, referenceNode ?? null);

  hydrateRemoteImages(clonedSlide).catch((error) => {
    console.warn("Remote image hydration failed after duplicating slide", error);
  });

  refreshSlides();
  recalibrateMindMapCounter();
  const newIndex = slides.indexOf(clonedSlide);
  const resolvedIndex = newIndex >= 0 ? newIndex : slides.length - 1;
  showSlide(resolvedIndex);
  clonedSlide.scrollIntoView({ behavior: "smooth", block: "center" });
  showDeckToast("Slide duplicated.", { icon: "fa-clone" });
  return resolvedIndex;
}

export function deleteSlide(index = currentSlideIndex) {
  if (!(stageViewport instanceof HTMLElement)) {
    showDeckToast("Slides are not ready to delete yet.", {
      icon: "fa-triangle-exclamation",
    });
    return false;
  }

  refreshSlides();
  if (!slides.length) {
    showDeckToast("There are no slides to delete right now.", {
      icon: "fa-circle-info",
    });
    return false;
  }

  const targetIndex = Number.isInteger(index) ? index : currentSlideIndex;
  const slide = slides[targetIndex];
  if (!(slide instanceof HTMLElement)) {
    showDeckToast("We couldn't find that slide to delete.", {
      icon: "fa-triangle-exclamation",
    });
    return false;
  }

  const stageLabel = getSlideStageLabel(slide, targetIndex);
  const slideTitle = getSlideTitle(slide, targetIndex);
  const descriptor = stageLabel && slideTitle && stageLabel !== slideTitle
    ? `${stageLabel} — ${slideTitle}`
    : slideTitle || stageLabel || `Slide ${targetIndex + 1}`;

  const confirmMessage = `Delete this slide?\n\n“${descriptor}” and its content will be removed. This action cannot be undone.`;
  const isConfirmed =
    typeof window !== "undefined" && typeof window.confirm === "function"
      ? window.confirm(confirmMessage)
      : true;

  if (!isConfirmed) {
    return false;
  }

  cleanupSlide(slide);
  slide.remove();
  refreshSlides();
  recalibrateMindMapCounter();

  if (!slides.length) {
    currentSlideIndex = 0;
    updateCounter();
    slideNavigatorController?.setActive(0);
    if (stageViewport instanceof HTMLElement) {
      const hadTabindex = stageViewport.hasAttribute("tabindex");
      const previousTabindex = stageViewport.getAttribute("tabindex");
      if (!hadTabindex) {
        stageViewport.setAttribute("tabindex", "-1");
      }
      stageViewport.focus({ preventScroll: true });
      if (!hadTabindex) {
        stageViewport.removeAttribute("tabindex");
      } else if (previousTabindex !== null) {
        stageViewport.setAttribute("tabindex", previousTabindex);
      }
    }
    showDeckToast(`Deleted “${descriptor}”. Deck is now empty.`, {
      icon: "fa-trash-can",
    });
    return 0;
  }

  const nextIndex = Math.min(targetIndex, slides.length - 1);
  showSlide(nextIndex);
  focusSlideAtIndex(nextIndex);
  showDeckToast(`Deleted “${descriptor}”.`, {
    icon: "fa-trash-can",
  });
  return nextIndex;
}

export function createBlankSlide() {
  const slide = document.createElement("div");
  slide.className = "slide-stage hidden";
  slide.dataset.type = "blank";
  slide.innerHTML = `
    <div class="slide-inner">
<div class="blank-slide">
  <div class="blank-controls">
    <button class="activity-btn" type="button" data-action="add-textbox">
      <i class="fa-solid fa-pen-to-square"></i>
      Add Textbox
    </button>
    <button class="activity-btn" type="button" data-action="add-table">
      <i class="fa-solid fa-table"></i>
      Create Table
    </button>
    <button class="activity-btn secondary" type="button" data-action="add-mindmap">
      <i class="fa-solid fa-diagram-project"></i>
      Add Mind Map
    </button>
    <button class="activity-btn tertiary" type="button" data-action="add-module">
      <i class="fa-solid fa-puzzle-piece"></i>
      Add Module
    </button>
  </div>
  <p class="blank-hint" data-role="hint">Add textboxes, paste images, or build a mind map to capture relationships.</p>
  <div class="blank-canvas" role="region" aria-label="Blank slide workspace"></div>
</div>
    </div>
  `;
  return slide;
}

export function attachBlankSlideEvents(slide) {
  if (!(slide instanceof HTMLElement)) {
    return;
  }

  if (typeof slide.__deckBlankCleanup === "function") {
    try {
      slide.__deckBlankCleanup();
    } catch (error) {
      console.warn("Failed to clear previous blank slide listeners", error);
    }
  }

  const canvas = slide.querySelector(".blank-canvas");
  const hint = slide.querySelector('[data-role="hint"]');
  const addTextboxBtn = slide.querySelector('[data-action="add-textbox"]');
  const addTableBtn = slide.querySelector('[data-action="add-table"]');
  const addMindmapBtn = slide.querySelector('[data-action="add-mindmap"]');
  const addModuleBtn = slide.querySelector('[data-action="add-module"]');

  if (!(canvas instanceof HTMLElement) || !(hint instanceof HTMLElement)) {
    delete slide.__deckBlankCleanup;
    return;
  }

  const cleanupTasks = [];
  const registerCleanup = (callback) => {
    if (typeof callback === "function") {
      cleanupTasks.push(callback);
    }
  };

  const DEFAULT_HINT =
    "Add textboxes, paste images, or build a mind map to capture relationships.";
  const TEXTBOX_HINT =
    "Drag your textboxes into place, double-click to edit, and use the colour dots to organise ideas.";
  const IMAGE_HINT =
    "Paste images to bring ideas to life. Drag to move them and use the corner handle to resize.";
  const MIXED_HINT =
    "Combine textboxes and images to map your ideas visually.";
  const TABLE_HINT =
    "Table ready. Add rows, columns, and colour-code cells to organise information.";
  const TABLE_COMBINATION_HINT =
    "Tables pair well with your notes, visuals, or maps to compare ideas.";
  const MINDMAP_HINT =
    "Mind map ready. Categorise branches, sort ideas, or copy a summary with the toolbar.";
  const MODULE_HINT =
    "Module ready. Facilitate it inside the frame or add another to compare activities.";
  const MODULE_COMBINATION_HINT =
    "Combine modules with your notes, visuals, or maps to scaffold the activity.";

  if (!canvas.hasAttribute("tabindex")) {
    canvas.setAttribute("tabindex", "0");
  }

  function updateHintForCanvas() {
    if (!(hint instanceof HTMLElement)) return;
    const hasMindmap = Boolean(canvas.querySelector(".mindmap"));
    const hasTextbox = Boolean(canvas.querySelector(".textbox"));
    const hasImage = Boolean(canvas.querySelector(".pasted-image"));
    const hasTable = Boolean(canvas.querySelector(".canvas-table"));
    const hasModule = Boolean(canvas.querySelector(".module-embed"));

    if (hasModule && (hasTextbox || hasImage || hasMindmap || hasTable)) {
      hint.textContent = MODULE_COMBINATION_HINT;
    } else if (hasModule) {
      hint.textContent = MODULE_HINT;
    } else if (hasTable && (hasTextbox || hasImage || hasMindmap)) {
      hint.textContent = TABLE_COMBINATION_HINT;
    } else if (hasMindmap) {
      hint.textContent = MINDMAP_HINT;
    } else if (hasTable) {
      hint.textContent = TABLE_HINT;
    } else if (hasTextbox && hasImage) {
      hint.textContent = MIXED_HINT;
    } else if (hasTextbox) {
      hint.textContent = TEXTBOX_HINT;
    } else if (hasImage) {
      hint.textContent = IMAGE_HINT;
    } else {
      hint.textContent = DEFAULT_HINT;
    }
  }

  const handleAddTextbox = () => {
    const textbox = createTextbox({ onRemove: updateHintForCanvas });
    canvas.appendChild(textbox);
    positionTextbox(textbox, canvas);
    updateHintForCanvas();
  };

  if (addTextboxBtn instanceof HTMLElement) {
    addTextboxBtn.addEventListener("click", handleAddTextbox);
    registerCleanup(() => {
      addTextboxBtn.removeEventListener("click", handleAddTextbox);
    });
  }

  const handleAddTable = () => {
    const table = createCanvasTable({ onRemove: updateHintForCanvas });
    canvas.appendChild(table);
    positionCanvasTable(table, canvas);
    updateHintForCanvas();
    table.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const firstEditableCell = table.querySelector("thead th, tbody td");
    if (firstEditableCell instanceof HTMLElement) {
      firstEditableCell.focus({ preventScroll: true });
    }
  };

  if (addTableBtn instanceof HTMLElement) {
    addTableBtn.addEventListener("click", handleAddTable);
    registerCleanup(() => {
      addTableBtn.removeEventListener("click", handleAddTable);
    });
  }

  const handleAddMindmap = () => {
    if (canvas.querySelector(".mindmap")) {
      const existing = canvas.querySelector(".mindmap");
      existing?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const mindmap = createMindMap(() => {
      updateHintForCanvas();
    });
    initialiseMindMap(mindmap, { onRemove: updateHintForCanvas });
    canvas.appendChild(mindmap);
    updateHintForCanvas();
  };

  if (addMindmapBtn instanceof HTMLElement) {
    addMindmapBtn.addEventListener("click", handleAddMindmap);
    registerCleanup(() => {
      addMindmapBtn.removeEventListener("click", handleAddMindmap);
    });
  }

  const handleAddModule = () => {
    moduleInsertCallback = () => {
      updateHintForCanvas();
    };
    const opened = openModuleOverlay({ canvas, trigger: addModuleBtn });
    if (!opened) {
      moduleInsertCallback = null;
    }
  };

  if (addModuleBtn instanceof HTMLElement) {
    addModuleBtn.addEventListener("click", handleAddModule);
    registerCleanup(() => {
      addModuleBtn.removeEventListener("click", handleAddModule);
    });
  }

  canvas
    .querySelectorAll(".textbox")
    .forEach((textbox) =>
      initialiseTextbox(textbox, { onRemove: updateHintForCanvas }),
    );

  canvas
    .querySelectorAll(".canvas-table")
    .forEach((table) =>
      initialiseCanvasTable(table, { onRemove: updateHintForCanvas }),
    );

  canvas
    .querySelectorAll(".mindmap")
    .forEach((mindmap) =>
      initialiseMindMap(mindmap, { onRemove: updateHintForCanvas }),
    );

  canvas
    .querySelectorAll(".pasted-image")
    .forEach((image) => initialisePastedImage(image, { onRemove: updateHintForCanvas }));

  canvas
    .querySelectorAll(".module-embed")
    .forEach((module) => initialiseModuleEmbed(module, { onRemove: updateHintForCanvas }));

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      if (!(file instanceof Blob)) {
        reject(new Error("Invalid clipboard data"));
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        resolve(typeof reader.result === "string" ? reader.result : "");
      });
      reader.addEventListener("error", () => {
        reject(reader.error ?? new Error("Failed to read clipboard image"));
      });
      reader.readAsDataURL(file);
    });

  async function handleCanvasPaste(event) {
    const clipboardData = event.clipboardData;
    if (!clipboardData) {
      return;
    }
    const items = Array.from(clipboardData.items ?? []).filter((item) =>
      typeof item.type === "string" && item.type.startsWith("image/"),
    );
    if (!items.length) {
      return;
    }

    event.preventDefault();

    for (const item of items) {
      const file = item.getAsFile();
      if (!file) {
        continue;
      }
      let dataUrl;
      try {
        dataUrl = await readFileAsDataUrl(file);
      } catch (error) {
        console.warn("Unable to read clipboard image", error);
        continue;
      }
      if (typeof dataUrl !== "string" || !dataUrl) {
        continue;
      }

      const pastedImage = createPastedImage({
        src: dataUrl,
        label: file.name,
        onRemove: updateHintForCanvas,
      });
      canvas.appendChild(pastedImage);
      positionPastedImage(pastedImage, canvas);
      pastedImage.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    updateHintForCanvas();
    canvas.focus({ preventScroll: true });
  }

  const handleCanvasPasteEvent = (event) => {
    handleCanvasPaste(event).catch((error) => {
      console.warn("Image paste failed", error);
    });
  };

  canvas.addEventListener("paste", handleCanvasPasteEvent);
  registerCleanup(() => {
    canvas.removeEventListener("paste", handleCanvasPasteEvent);
  });

  const handleCanvasPointerDown = (event) => {
    if (event.target === canvas) {
      canvas.focus({ preventScroll: true });
    }
  };

  canvas.addEventListener("pointerdown", handleCanvasPointerDown);
  registerCleanup(() => {
    canvas.removeEventListener("pointerdown", handleCanvasPointerDown);
  });

  slide.__deckBlankCleanup = () => {
    cleanupTasks.splice(0).forEach((task) => {
      try {
        task();
      } catch (error) {
        console.warn("Blank slide cleanup failed", error);
      }
    });
  };

  updateHintForCanvas();
}

export function positionTextbox(textbox, canvas) {
  const count = canvas.querySelectorAll(".textbox").length - 1;
  const offset = 24 * count;
  textbox.style.left = `${offset}px`;
  textbox.style.top = `${offset}px`;
}

export function createTextbox({ onRemove } = {}) {
  const textbox = document.createElement("div");
  textbox.className = "textbox";
  textbox.dataset.color = DEFAULT_TEXTBOX_COLOR;
  textbox.innerHTML = `
    <button type="button" class="textbox-remove" aria-label="Remove textbox">
<i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
    <div class="textbox-handle">
<span class="textbox-title">
  <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
  Textbox
</span>
<div class="textbox-color-options" role="group" aria-label="Textbox colours">
${renderColorSwatchButtons()}
</div>
    </div>
    <div class="textbox-body" contenteditable="true" aria-label="Editable textbox">Double-click to start typing...</div>
  `;
  initialiseTextbox(textbox, { onRemove });
  return textbox;
}

export function initialiseTextbox(textbox, { onRemove } = {}) {
  if (!(textbox instanceof HTMLElement)) {
    return textbox;
  }

  textbox.__deckTextboxOnRemove = onRemove;
  if (textbox.__deckTextboxInitialised) {
    if (typeof textbox.__deckTextboxSyncColor === "function") {
      try {
        textbox.__deckTextboxSyncColor();
      } catch (error) {
        console.warn("Failed to resync textbox colour state", error);
      }
    }
    return textbox;
  }
  textbox.__deckTextboxInitialised = true;

  if (!textbox.dataset.color) {
    textbox.dataset.color = DEFAULT_TEXTBOX_COLOR;
  }

  const removeBtn = textbox.querySelector(".textbox-remove");
  removeBtn?.addEventListener("click", () => {
    textbox.remove();
    if (typeof textbox.__deckTextboxOnRemove === "function") {
      textbox.__deckTextboxOnRemove();
    }
  });

  const body = textbox.querySelector(".textbox-body");
  body?.addEventListener("dblclick", () => {
    if (body instanceof HTMLElement) {
      body.focus();
    }
  });

  body?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      body.blur();
    }
  });

  const colorButtons = Array.from(
    textbox.querySelectorAll(".textbox-color-swatch"),
  );

  const syncTextboxColourState = (target = textbox.dataset.color) => {
    const chosen = target && target.trim() ? target : DEFAULT_TEXTBOX_COLOR;
    textbox.dataset.color = chosen;
    colorButtons.forEach((button) => {
      const isActive = button.dataset.color === chosen;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  colorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.dataset.color) return;
      syncTextboxColourState(button.dataset.color);
    });
    button.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
  });

  syncTextboxColourState();
  textbox.__deckTextboxSyncColor = () => syncTextboxColourState();

  makeDraggable(textbox);
  return textbox;
}

function createEditableTableCell({ type = "data" } = {}) {
  const tagName = type === "header" ? "th" : "td";
  const cell = document.createElement(tagName);
  const placeholder =
    type === "header" ? TABLE_HEADER_PLACEHOLDER : TABLE_CELL_PLACEHOLDER;
  cell.dataset.placeholder = placeholder;
  if (!cell.hasAttribute("contenteditable")) {
    cell.setAttribute("contenteditable", "true");
  }
  cell.setAttribute("spellcheck", "true");
  if (tagName === "th") {
    cell.setAttribute("scope", "col");
  }
  cell.dataset.empty = "true";
  return cell;
}

function buildTableHeaderRow(columns = DEFAULT_TABLE_COLUMNS) {
  const row = document.createElement("tr");
  for (let index = 0; index < columns; index += 1) {
    row.appendChild(createEditableTableCell({ type: "header" }));
  }
  return row;
}

function buildTableBodyRow(columns = DEFAULT_TABLE_COLUMNS) {
  const row = document.createElement("tr");
  for (let index = 0; index < columns; index += 1) {
    row.appendChild(createEditableTableCell({ type: "data" }));
  }
  return row;
}

function ensureHeaderRow(thead) {
  if (!(thead instanceof HTMLTableSectionElement)) {
    return null;
  }
  let headerRow = thead.querySelector("tr");
  if (!(headerRow instanceof HTMLTableRowElement)) {
    headerRow = document.createElement("tr");
    thead.appendChild(headerRow);
  }
  return headerRow;
}

function getTableColumnCount(tableElement) {
  if (!(tableElement instanceof HTMLTableElement)) {
    return 0;
  }
  const headerRow = tableElement.tHead?.querySelector("tr");
  if (headerRow instanceof HTMLTableRowElement && headerRow.children.length) {
    return headerRow.children.length;
  }
  const firstBodyRow = tableElement.tBodies?.[0]?.querySelector("tr");
  if (firstBodyRow instanceof HTMLTableRowElement) {
    return firstBodyRow.children.length;
  }
  return 0;
}

function initialiseTableCell(cell) {
  if (!(cell instanceof HTMLElement)) {
    return;
  }
  if (cell.__deckTableCellInitialised) {
    if (!cell.textContent.trim()) {
      cell.textContent = "";
      cell.dataset.empty = "true";
    }
    return;
  }
  cell.__deckTableCellInitialised = true;

  const placeholder =
    cell.dataset.placeholder ||
    (cell.tagName === "TH" ? TABLE_HEADER_PLACEHOLDER : TABLE_CELL_PLACEHOLDER);
  cell.dataset.placeholder = placeholder;
  if (!cell.hasAttribute("contenteditable")) {
    cell.setAttribute("contenteditable", "true");
  }
  cell.setAttribute("spellcheck", "true");

  const syncEmptyState = () => {
    if (cell.textContent.trim()) {
      delete cell.dataset.empty;
    } else {
      cell.textContent = "";
      cell.dataset.empty = "true";
    }
  };

  syncEmptyState();

  cell.addEventListener("input", syncEmptyState);
  cell.addEventListener("blur", syncEmptyState);
  cell.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cell.blur();
    }
  });
}

function prepareTableCells(root) {
  if (!(root instanceof HTMLElement)) {
    return;
  }
  const cells = root.querySelectorAll?.("th, td");
  if (!cells || !cells.length) {
    return;
  }
  cells.forEach((cell) => initialiseTableCell(cell));
}

export function positionCanvasTable(table, canvas) {
  if (!(table instanceof HTMLElement) || !(canvas instanceof HTMLElement)) {
    return;
  }
  const tables = Array.from(canvas.querySelectorAll(".canvas-table"));
  const index = Math.max(0, tables.indexOf(table));
  const offset = 32 * index;
  if (!table.style.left) {
    table.style.left = `${offset}px`;
  }
  if (!table.style.top) {
    table.style.top = `${offset}px`;
  }
  if (!table.style.width) {
    const canvasWidth = canvas.clientWidth || 640;
    const baseWidth = Math.min(640, Math.max(280, canvasWidth * 0.6));
    table.style.width = `${Math.round(baseWidth)}px`;
  }
  if (!table.style.height) {
    const canvasHeight = canvas.clientHeight || 480;
    const baseHeight = Math.min(560, Math.max(220, canvasHeight * 0.55));
    table.style.height = `${Math.round(baseHeight)}px`;
  }
}

export function createCanvasTable({
  columns = DEFAULT_TABLE_COLUMNS,
  rows = DEFAULT_TABLE_ROWS,
  onRemove,
} = {}) {
  const container = document.createElement("div");
  container.className = "canvas-table";
  container.dataset.color = DEFAULT_TEXTBOX_COLOR;
  container.innerHTML = `
    <button type="button" class="textbox-remove canvas-table-remove" aria-label="Remove table">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
    <div class="textbox-handle canvas-table-handle">
      <span class="textbox-title">
        <i class="fa-solid fa-table" aria-hidden="true"></i>
        Table
      </span>
      <div class="canvas-table-toolbar">
        <div class="textbox-color-options canvas-table-colors" role="group" aria-label="Table colours">
          ${renderColorSwatchButtons()}
        </div>
        <div class="canvas-table-actions" role="group" aria-label="Table controls">
          <button type="button" class="canvas-table-action" data-action="add-column">
            <i class="fa-solid fa-table-columns" aria-hidden="true"></i>
            Column
          </button>
          <button type="button" class="canvas-table-action" data-action="add-row">
            <i class="fa-solid fa-table-rows" aria-hidden="true"></i>
            Row
          </button>
        </div>
      </div>
    </div>
    <div class="canvas-table-body" role="region" aria-label="Editable table workspace">
      <table>
        <thead></thead>
        <tbody></tbody>
      </table>
    </div>
    <button type="button" class="canvas-table-resizer" aria-label="Resize table">
      <i class="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true"></i>
    </button>
  `;

  const tableElement = container.querySelector("table");
  const tableHead = tableElement?.querySelector("thead");
  const tableBody = tableElement?.querySelector("tbody");

  if (tableHead instanceof HTMLTableSectionElement) {
    tableHead.appendChild(buildTableHeaderRow(Math.max(1, columns)));
  }

  if (tableBody instanceof HTMLTableSectionElement) {
    const rowCount = Math.max(1, rows);
    const columnCount = Math.max(1, columns);
    for (let index = 0; index < rowCount; index += 1) {
      tableBody.appendChild(buildTableBodyRow(columnCount));
    }
  }

  initialiseCanvasTable(container, { onRemove });
  return container;
}

export function initialiseCanvasTable(table, { onRemove } = {}) {
  if (!(table instanceof HTMLElement)) {
    return table;
  }

  table.__deckTableOnRemove = onRemove;
  if (table.__deckTableInitialised) {
    if (typeof table.__deckTableSyncColor === "function") {
      try {
        table.__deckTableSyncColor();
      } catch (error) {
        console.warn("Failed to resync table colour state", error);
      }
    }
    prepareTableCells(table);
    return table;
  }
  table.__deckTableInitialised = true;

  if (!table.dataset.color) {
    table.dataset.color = DEFAULT_TEXTBOX_COLOR;
  }

  const removeBtn = table.querySelector(".canvas-table-remove");
  removeBtn?.addEventListener("click", () => {
    table.remove();
    if (typeof table.__deckTableOnRemove === "function") {
      table.__deckTableOnRemove();
    }
  });

  const colorButtons = Array.from(
    table.querySelectorAll(".textbox-color-swatch"),
  );

  const syncColorState = (next = table.dataset.color) => {
    const chosen = next && next.trim() ? next : DEFAULT_TEXTBOX_COLOR;
    table.dataset.color = chosen;
    colorButtons.forEach((button) => {
      const isActive = button.dataset.color === chosen;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  colorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.dataset.color) {
        return;
      }
      syncColorState(button.dataset.color);
    });
    button.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
  });

  syncColorState();
  table.__deckTableSyncColor = () => syncColorState();

  const addColumnBtn = table.querySelector('[data-action="add-column"]');
  const addRowBtn = table.querySelector('[data-action="add-row"]');
  const tableElement = table.querySelector("table");
  const tableHead = tableElement?.querySelector("thead");
  const tableBody = tableElement?.querySelector("tbody");
  const bodyWrapper = table.querySelector(".canvas-table-body");

  const addColumn = () => {
    if (!(tableElement instanceof HTMLTableElement)) {
      return;
    }
    const headerRow = ensureHeaderRow(tableHead);
    if (!(headerRow instanceof HTMLTableRowElement)) {
      return;
    }
    headerRow.appendChild(createEditableTableCell({ type: "header" }));
    const columnCount = headerRow.children.length;
    const bodyRows = Array.from(tableBody?.querySelectorAll("tr") ?? []);
    if (!bodyRows.length) {
      if (tableBody instanceof HTMLTableSectionElement) {
        tableBody.appendChild(buildTableBodyRow(columnCount));
      }
    } else {
      bodyRows.forEach((row) => {
        row.appendChild(createEditableTableCell({ type: "data" }));
      });
    }
    prepareTableCells(table);
  };

  const addRow = () => {
    if (!(tableElement instanceof HTMLTableElement)) {
      return;
    }
    const currentColumns = Math.max(1, getTableColumnCount(tableElement));
    if (!(tableBody instanceof HTMLTableSectionElement)) {
      return;
    }
    const newRow = buildTableBodyRow(currentColumns);
    tableBody.appendChild(newRow);
    prepareTableCells(newRow);
    if (bodyWrapper instanceof HTMLElement) {
      bodyWrapper.scrollTo({ top: bodyWrapper.scrollHeight, behavior: "smooth" });
    }
  };

  addColumnBtn?.addEventListener("click", () => {
    addColumn();
    if (bodyWrapper instanceof HTMLElement) {
      bodyWrapper.scrollTo({ left: bodyWrapper.scrollWidth, behavior: "smooth" });
    }
  });
  addRowBtn?.addEventListener("click", addRow);

  [addColumnBtn, addRowBtn].forEach((button) => {
    button?.addEventListener("pointerdown", (event) => event.stopPropagation());
  });

  const resizer = table.querySelector(".canvas-table-resizer");
  resizer?.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  prepareTableCells(table);

  makeDraggable(table);
  makeResizable(table, {
    handleSelector: ".canvas-table-resizer",
    minWidth: 240,
    minHeight: 200,
  });

  return table;
}

function makeResizable(element, { handleSelector = ".resize-handle", minWidth = 96, minHeight = 96 } = {}) {
  if (!(element instanceof HTMLElement)) {
    return;
  }
  if (element.__deckResizableInitialised) {
    return;
  }

  const handle = element.querySelector(handleSelector);
  if (!(handle instanceof HTMLElement)) {
    return;
  }

  element.__deckResizableInitialised = true;

  let pointerId = null;
  let startWidth = 0;
  let startHeight = 0;
  let startX = 0;
  let startY = 0;
  let resizeCanvas = null;

  const finishResize = (event) => {
    if (event.pointerId !== pointerId) {
      return;
    }
    try {
      handle.releasePointerCapture(pointerId);
    } catch (error) {
      // ignore release errors when pointer capture is not active
    }
    pointerId = null;
    resizeCanvas = null;
  };

  handle.addEventListener("pointerdown", (event) => {
    const parent = element.parentElement;
    if (!(parent instanceof HTMLElement)) {
      return;
    }
    resizeCanvas = parent;
    pointerId = event.pointerId;
    startWidth = element.offsetWidth;
    startHeight = element.offsetHeight;
    startX = event.clientX;
    startY = event.clientY;
    try {
      handle.setPointerCapture(pointerId);
    } catch (error) {
      // ignore pointer capture errors
    }
    event.preventDefault();
    event.stopPropagation();
  });

  handle.addEventListener("pointermove", (event) => {
    if (pointerId === null || event.pointerId !== pointerId) {
      return;
    }
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    let nextWidth = startWidth + deltaX;
    let nextHeight = startHeight + deltaY;

    if (resizeCanvas instanceof HTMLElement) {
      const maxWidth = resizeCanvas.scrollWidth - element.offsetLeft;
      const maxHeight = resizeCanvas.scrollHeight - element.offsetTop;
      nextWidth = Math.min(maxWidth, Math.max(minWidth, nextWidth));
      nextHeight = Math.min(maxHeight, Math.max(minHeight, nextHeight));
    } else {
      nextWidth = Math.max(minWidth, nextWidth);
      nextHeight = Math.max(minHeight, nextHeight);
    }

    element.style.width = `${Math.round(nextWidth)}px`;
    element.style.height = `${Math.round(nextHeight)}px`;
  });

  handle.addEventListener("pointerup", finishResize);
  handle.addEventListener("pointercancel", finishResize);
}

export function createPastedImage({ src, label, onRemove } = {}) {
  const image = document.createElement("div");
  image.className = "pasted-image";
  image.innerHTML = `
    <button type="button" class="textbox-remove pasted-image-remove" aria-label="Remove image">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
    <div class="textbox-handle pasted-image-handle">
      <span class="textbox-title">
        <i class="fa-solid fa-image" aria-hidden="true"></i>
        Image
      </span>
    </div>
    <div class="pasted-image-body">
      <img loading="lazy" decoding="async" alt="" />
    </div>
    <button type="button" class="pasted-image-resizer" aria-label="Resize image">
      <i class="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true"></i>
    </button>
  `;

  const img = image.querySelector("img");
  if (img instanceof HTMLImageElement) {
    if (typeof src === "string" && src) {
      img.src = src;
    }
    if (typeof label === "string" && label.trim()) {
      img.alt = `Pasted image (${label.trim()})`;
    } else {
      img.alt = "Pasted image";
    }
    img.draggable = false;
  }

  initialisePastedImage(image, { onRemove });
  return image;
}

export function initialisePastedImage(image, { onRemove } = {}) {
  if (!(image instanceof HTMLElement)) {
    return image;
  }
  image.__deckImageOnRemove = onRemove;
  if (image.__deckImageInitialised) {
    return image;
  }
  image.__deckImageInitialised = true;

  const removeBtn = image.querySelector(".pasted-image-remove");
  removeBtn?.addEventListener("click", () => {
    image.remove();
    if (typeof image.__deckImageOnRemove === "function") {
      image.__deckImageOnRemove();
    }
  });

  const resizer = image.querySelector(".pasted-image-resizer");
  resizer?.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  makeDraggable(image);
  makeResizable(image, {
    handleSelector: ".pasted-image-resizer",
    minWidth: 160,
    minHeight: 120,
  });

  const img = image.querySelector("img");
  if (img instanceof HTMLImageElement) {
    if (!img.alt || !img.alt.trim()) {
      img.alt = "Pasted image";
    }
    img.draggable = false;
  }
  return image;
}

export function positionPastedImage(image, canvas) {
  if (!(image instanceof HTMLElement) || !(canvas instanceof HTMLElement)) {
    return;
  }
  const siblings = Array.from(canvas.querySelectorAll(".pasted-image"));
  const index = Math.max(0, siblings.indexOf(image));
  const offset = 28 * index;
  if (!image.style.left) {
    image.style.left = `${offset}px`;
  }
  if (!image.style.top) {
    image.style.top = `${offset}px`;
  }
  if (!image.style.width) {
    const canvasWidth = canvas.clientWidth || 480;
    const baseWidth = Math.min(480, Math.max(220, canvasWidth * 0.45));
    image.style.width = `${Math.round(baseWidth)}px`;
  }
  if (!image.style.height) {
    const numericWidth = parseFloat(image.style.width);
    const baseHeight = Number.isFinite(numericWidth)
      ? Math.max(180, Math.round(numericWidth * 0.66))
      : 220;
    image.style.height = `${baseHeight}px`;
  }
}

export function createModuleEmbed({ html = "", title, activityType, onRemove } = {}) {
  const module = document.createElement("section");
  module.className = "module-embed";
  if (typeof activityType === "string" && activityType) {
    module.dataset.activityType = activityType;
  }

  const resolvedTitle = trimText(title) || "Interactive module";
  module.dataset.activityTitle = resolvedTitle;
  const typeLabel = MODULE_TYPE_LABELS[activityType] || "Interactive activity";

  module.innerHTML = `
    <div class="module-embed-header">
      <div class="module-embed-meta">
        <span class="module-embed-pill">${escapeHtml(typeLabel)}</span>
        <span class="module-embed-title">${escapeHtml(resolvedTitle)}</span>
      </div>
      <div class="module-embed-actions">
        <button type="button" class="module-embed-remove" data-action="remove-module">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          <span class="sr-only">Remove module</span>
        </button>
      </div>
    </div>
  `;

  const frame = document.createElement("iframe");
  frame.className = "module-embed-frame";
  frame.setAttribute("title", `${resolvedTitle} interactive module`);
  frame.setAttribute("loading", "lazy");
  if (typeof html === "string" && html.trim()) {
    frame.srcdoc = html;
  } else {
    frame.srcdoc = `<!DOCTYPE html><html lang="en"><body style="font-family: sans-serif; padding: 1rem;">No module content yet.</body></html>`;
  }
  module.appendChild(frame);

  initialiseModuleEmbed(module, { onRemove });
  return module;
}

export function initialiseModuleEmbed(module, { onRemove } = {}) {
  if (!(module instanceof HTMLElement)) {
    return module;
  }
  module.__deckModuleOnRemove = onRemove;

  if (typeof module.__deckModuleCleanup === "function") {
    try {
      module.__deckModuleCleanup();
    } catch (error) {
      console.warn("Module embed cleanup failed", error);
    }
  }

  const removeBtn = module.querySelector('[data-action="remove-module"]');

  const handleRemove = () => {
    if (typeof module.__deckModuleCleanup === "function") {
      try {
        module.__deckModuleCleanup();
      } catch (error) {
        console.warn("Module embed cleanup failed", error);
      }
    }
    module.remove();
    if (typeof module.__deckModuleOnRemove === "function") {
      module.__deckModuleOnRemove();
    }
  };

  if (removeBtn instanceof HTMLElement) {
    removeBtn.addEventListener("click", handleRemove);
    module.__deckModuleCleanup = () => {
      removeBtn.removeEventListener("click", handleRemove);
    };
  } else {
    module.__deckModuleCleanup = () => {};
  }

  if (!module.__deckModuleInitialised) {
    module.__deckModuleInitialised = true;
  }

  return module;
}

export function makeDraggable(element) {
  if (!(element instanceof HTMLElement)) return;
  if (element.__deckDraggableInitialised) {
    return;
  }
  element.__deckDraggableInitialised = true;

  const handle = element.querySelector(".textbox-handle") ?? element;
  let pointerId = null;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener("pointerdown", (event) => {
    const canvas = element.parentElement;
    if (!(canvas instanceof HTMLElement)) return;
    pointerId = event.pointerId;
    try {
      element.setPointerCapture(pointerId);
    } catch (error) {
      // ignore when pointer capture is not supported
    }
    const elementRect = element.getBoundingClientRect();
    offsetX = event.clientX - elementRect.left;
    offsetY = event.clientY - elementRect.top;
    element.dataset.dragging = "true";
    event.preventDefault();
  });

  element.addEventListener("pointermove", (event) => {
    if (element.dataset.dragging !== "true" || event.pointerId !== pointerId)
      return;
    const canvas = element.parentElement;
    if (!(canvas instanceof HTMLElement)) return;
    const canvasRect = canvas.getBoundingClientRect();
    const rawX = event.clientX - canvasRect.left + canvas.scrollLeft - offsetX;
    const rawY = event.clientY - canvasRect.top + canvas.scrollTop - offsetY;
    const maxX = Math.max(0, canvas.scrollWidth - element.offsetWidth);
    const maxY = Math.max(0, canvas.scrollHeight - element.offsetHeight);
    const clampedX = Math.min(Math.max(0, rawX), maxX);
    const clampedY = Math.min(Math.max(0, rawY), maxY);
    element.style.left = `${clampedX}px`;
    element.style.top = `${clampedY}px`;
  });

  function clearPointerState(event) {
    if (event.pointerId !== pointerId) return;
    delete element.dataset.dragging;
    if (pointerId !== null) {
      try {
        element.releasePointerCapture(pointerId);
      } catch (error) {
        // ignore release errors when pointer capture is not active
      }
    }
    pointerId = null;
  }

  element.addEventListener("pointerup", clearPointerState);
  element.addEventListener("pointercancel", clearPointerState);
}

export function createMindMap(onRemove) {
  const container = document.createElement("section");
  container.className = "mindmap";
  container.dataset.empty = "true";
  const branchInputId = `mindmap-branch-${++mindMapId}`;
  container.innerHTML = `
    <div class="mindmap-header">
<h3 class="mindmap-title">Mind Map</h3>
<button type="button" class="mindmap-remove">
  <i class="fa-solid fa-trash-can"></i>
  Remove
</button>
    </div>
    <div class="mindmap-center" contenteditable="true" role="textbox" aria-label="Mind map central idea">Central idea</div>
    <div class="mindmap-meta">
<span class="mindmap-count">
  <i class="fa-solid fa-diagram-project" aria-hidden="true"></i>
  <strong data-role="branch-count">0</strong>
  branches
</span>
<div class="mindmap-actions">
  <button type="button" class="mindmap-action" data-action="sort-branches">
    <i class="fa-solid fa-arrow-down-a-z" aria-hidden="true"></i>
    Sort A–Z
  </button>
  <button type="button" class="mindmap-action" data-action="copy-mindmap">
    <i class="fa-solid fa-copy" aria-hidden="true"></i>
    Copy summary
  </button>
</div>
    </div>
    <div class="mindmap-branches" aria-live="polite"></div>
    <p class="mindmap-status" data-role="mindmap-status" role="status" aria-live="polite"></p>
    <form class="mindmap-form">
<label class="sr-only" for="${branchInputId}">New branch label</label>
<input id="${branchInputId}" type="text" placeholder="Add branch idea" autocomplete="off">
<button type="submit">
  <i class="fa-solid fa-plus"></i>
  Add Branch
</button>
    </form>
  `;
  const branches = container.querySelector(".mindmap-branches");
  if (branches && !branches.querySelector(".mindmap-branch")) {
    const defaultCategory = getNextBranchCategory(branches);
    const defaultBranch = createMindMapBranch(
      "Add supporting detail...",
      {
        category: defaultCategory,
        label: getMindmapLabelForCategory(defaultCategory),
        color: getMindmapColorForCategory(defaultCategory),
      },
    );
    branches.appendChild(defaultBranch);
  }

  initialiseMindMap(container, { onRemove });
  return container;
}

export function initialiseMindMap(container, { onRemove } = {}) {
  if (!(container instanceof HTMLElement)) {
    return container;
  }

  const form = container.querySelector(".mindmap-form");
  const input = container.querySelector(".mindmap-form input");
  const branches = container.querySelector(".mindmap-branches");
  const statusEl = container.querySelector('[data-role="mindmap-status"]');
  const countEl = container.querySelector('[data-role="branch-count"]');
  const sortBtn = container.querySelector('[data-action="sort-branches"]');
  const copyBtn = container.querySelector('[data-action="copy-mindmap"]');
  const center = container.querySelector(".mindmap-center");

  container.__deckMindmapOnRemove = onRemove;
  if (!container.__deckMindmapInitialised) {
    container.__deckMindmapInitialised = true;
    const removeBtn = container.querySelector(".mindmap-remove");
    removeBtn?.addEventListener("click", () => {
      container.remove();
      if (typeof container.__deckMindmapOnRemove === "function") {
        container.__deckMindmapOnRemove();
      }
    });
  }

  let statusTimeoutId = null;
  const showStatus = (message, { persist = false } = {}) => {
    if (!(statusEl instanceof HTMLElement)) {
      return;
    }
    if (!message) {
      statusEl.textContent = "";
      statusEl.removeAttribute("data-active");
      if (statusTimeoutId) {
        window.clearTimeout(statusTimeoutId);
        statusTimeoutId = null;
      }
      return;
    }
    statusEl.textContent = message;
    statusEl.dataset.active = "true";
    if (!persist) {
      if (statusTimeoutId) {
        window.clearTimeout(statusTimeoutId);
      }
      statusTimeoutId = window.setTimeout(() => {
        statusEl.textContent = "";
        statusEl.removeAttribute("data-active");
        statusTimeoutId = null;
      }, 4000);
    }
  };

  const getBranchLabelText = (branch) => {
    if (!(branch instanceof HTMLElement)) {
      return getMindmapLabelForCategory();
    }
    const category = branch.dataset.category ?? MINDMAP_BRANCH_PRESETS[0].value;
    const savedLabel = branch.dataset.label?.trim();
    return savedLabel || getMindmapLabelForCategory(category);
  };

  const updateBranchMetrics = () => {
    const branchList = Array.from(
      branches?.querySelectorAll(".mindmap-branch") ?? [],
    );
    const total = branchList.length;
    if (countEl instanceof HTMLElement) {
      countEl.textContent = String(total);
    }
    container.dataset.empty = total === 0 ? "true" : "false";
    branchList.forEach((branch, index) => {
      const indexEl = branch.querySelector(".mindmap-branch-index");
      if (indexEl instanceof HTMLElement) {
        indexEl.textContent = String(index + 1);
      }
      const labelInput = branch.querySelector(".mindmap-branch-select");
      if (labelInput instanceof HTMLInputElement) {
        const category =
          branch.dataset.category ?? MINDMAP_BRANCH_PRESETS[0].value;
        const presetLabel = getMindmapLabelForCategory(category);
        labelInput.placeholder = presetLabel;
        if (branch.dataset.label) {
          labelInput.value = branch.dataset.label;
        } else if (!labelInput.value.trim()) {
          labelInput.value = "";
        }
      }
      const textarea = branch.querySelector("textarea");
      if (textarea instanceof HTMLTextAreaElement) {
        branch.dataset.empty = textarea.value.trim() ? "false" : "true";
      }
    });
  };

  const buildMindmapSummary = () => {
    const central = center?.textContent?.trim() ?? "";
    const branchList = Array.from(
      branches?.querySelectorAll(".mindmap-branch") ?? [],
    );
    const branchLines = branchList
      .map((branch, index) => {
        const text = branch.querySelector("textarea")?.value.trim();
        if (!text) {
          return null;
        }
        const label = getBranchLabelText(branch);
        return `${index + 1}. [${label}] ${text}`;
      })
      .filter(Boolean);
    return [central, ...branchLines].join("\n").trim();
  };

  const handleBranchUpdate = ({ type, value, branch } = {}) => {
    updateBranchMetrics();
    switch (type) {
      case "text":
        showStatus("Branch text updated.");
        break;
      case "label": {
        const label =
          (typeof value === "string" && value.trim()) ||
          getBranchLabelText(branch);
        showStatus(`Branch label updated to "${label}".`);
        break;
      }
      case "color": {
        const label =
          typeof value === "string"
            ? getMindmapColourLabel(value)
            : getMindmapColourLabel(branch?.dataset?.color);
        showStatus(`Branch colour updated to "${label}".`);
        break;
      }
      case "removed":
        showStatus("Branch removed.");
        break;
      case "added":
        showStatus("Branch added.");
        break;
      default:
        showStatus("Branch updated.");
    }
  };

  const branchCallbacks = {
    onRemove: () => handleBranchUpdate({ type: "removed" }),
    onChange: handleBranchUpdate,
  };

  if (form && !form.__deckSubmitInitialised) {
    form.__deckSubmitInitialised = true;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!(branches instanceof HTMLElement) || !(input instanceof HTMLInputElement)) {
        return;
      }
      const value = input.value.trim();
      if (!value) {
        showStatus("Enter a branch idea before adding it.");
        return;
      }
      const category = getNextBranchCategory(branches);
      const newBranch = createMindMapBranch(value, {
        category,
        label: getMindmapLabelForCategory(category),
        color: getMindmapColorForCategory(category),
      });
      branches.appendChild(newBranch);
      initialiseMindMapBranch(newBranch, branchCallbacks);
      handleBranchUpdate({ type: "added" });
      input.value = "";
      const textarea = newBranch.querySelector("textarea");
      textarea?.focus();
    });
  }

  if (center instanceof HTMLElement && !center.__deckMindmapCenterInitialised) {
    center.__deckMindmapCenterInitialised = true;
    let centerDebounceId = null;
    center.addEventListener("input", () => {
      if (centerDebounceId) {
        window.clearTimeout(centerDebounceId);
      }
      centerDebounceId = window.setTimeout(() => {
        updateBranchMetrics();
        showStatus("Central idea updated.");
      }, 400);
    });
  }

  if (sortBtn && !sortBtn.__deckMindmapSortInitialised) {
    sortBtn.__deckMindmapSortInitialised = true;
    sortBtn.addEventListener("click", () => {
      if (!(branches instanceof HTMLElement)) {
        return;
      }
      const branchList = Array.from(
        branches.querySelectorAll(".mindmap-branch"),
      );
      if (branchList.length <= 1) {
        showStatus("Add at least two branches to sort them.");
        return;
      }
      branchList
        .sort((a, b) => {
          const textA =
            a.querySelector("textarea")?.value.trim().toLowerCase() ?? "";
          const textB =
            b.querySelector("textarea")?.value.trim().toLowerCase() ?? "";
          return textA.localeCompare(textB, undefined, {
            sensitivity: "base",
          });
        })
        .forEach((branch) => branches.appendChild(branch));
      updateBranchMetrics();
      showStatus("Branches sorted A to Z.");
    });
  }

  if (copyBtn && !copyBtn.__deckMindmapCopyInitialised) {
    copyBtn.__deckMindmapCopyInitialised = true;
    copyBtn.addEventListener("click", async () => {
      if (!(branches instanceof HTMLElement)) {
        return;
      }
      updateBranchMetrics();
      const summary = buildMindmapSummary();
      if (!summary) {
        showStatus(
          "Add at least one branch or some text before copying a summary.",
          { persist: true },
        );
        return;
      }
      const successMessage = "Mind map summary copied to clipboard.";
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(summary);
          showStatus(successMessage);
          return;
        }
        throw new Error("Clipboard API unavailable");
      } catch (error) {
        try {
          const helper = document.createElement("textarea");
          helper.value = summary;
          helper.setAttribute("readonly", "");
          helper.style.position = "absolute";
          helper.style.left = "-9999px";
          document.body.appendChild(helper);
          helper.select();
          document.execCommand("copy");
          document.body.removeChild(helper);
          showStatus(successMessage);
        } catch (fallbackError) {
          console.error("Failed to copy mind map summary", fallbackError);
          showStatus(
            "Unable to copy automatically. Select the text manually to copy.",
            { persist: true },
          );
        }
      }
    });
  }

  container
    .querySelectorAll(".mindmap-branch")
    .forEach((branch) => initialiseMindMapBranch(branch, branchCallbacks));

  updateBranchMetrics();

  return container;
}

export function createMindMapBranch(text, { category, label, color } = {}) {
  const preset = getMindmapPreset(category) ?? MINDMAP_BRANCH_PRESETS[0];
  const branch = document.createElement("div");
  branch.className = "mindmap-branch";
  branch.dataset.category = preset.value;
  const initialColor = isValidMindmapColor(color)
    ? color
    : getMindmapColorForCategory(preset.value);
  branch.dataset.color = initialColor;
  if (typeof label === "string" && label.trim()) {
    branch.dataset.label = label.trim();
  } else {
    branch.dataset.label = preset.label;
  }

  const header = document.createElement("div");
  header.className = "mindmap-branch-header";

  const indexBadge = document.createElement("span");
  indexBadge.className = "mindmap-branch-index";
  indexBadge.setAttribute("aria-hidden", "true");

  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.className = "mindmap-branch-select";
  labelInput.setAttribute("aria-label", "Branch label");
  labelInput.placeholder = preset.label;
  labelInput.autocomplete = "off";
  labelInput.value = branch.dataset.label ?? "";

  const colorOptions = document.createElement("div");
  colorOptions.className = "mindmap-color-options";
  colorOptions.setAttribute("role", "group");
  colorOptions.setAttribute("aria-label", "Branch colour");
  colorOptions.innerHTML = renderColorSwatchButtons();

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.placeholder = "Add supporting detail...";
  textarea.setAttribute("aria-label", "Mind map branch text");

  const actions = document.createElement("div");
  actions.className = "mindmap-branch-actions";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "branch-remove";
  const removeIcon = document.createElement("i");
  removeIcon.className = "fa-solid fa-circle-xmark";
  removeIcon.setAttribute("aria-hidden", "true");
  const removeLabel = document.createElement("span");
  removeLabel.textContent = "Remove";
  removeBtn.append(removeIcon, removeLabel);
  actions.append(removeBtn);

  header.append(indexBadge, labelInput, colorOptions);
  branch.append(header, textarea, actions);

  return branch;
}

export function initialiseMindMapBranch(branch, { onRemove, onChange } = {}) {
  if (!(branch instanceof HTMLElement)) {
    return branch;
  }

  branch.__deckMindmapBranchOnRemove = onRemove;
  branch.__deckMindmapBranchOnChange = onChange;
  if (branch.__deckMindmapBranchInitialised) {
    if (typeof branch.__deckMindmapBranchSync === "function") {
      try {
        branch.__deckMindmapBranchSync();
      } catch (error) {
        console.warn("Failed to resync mind map branch state", error);
      }
    }
    return branch;
  }
  branch.__deckMindmapBranchInitialised = true;

  if (!branch.dataset.category) {
    const preset = branch.dataset.category ?? MINDMAP_BRANCH_PRESETS[0].value;
    branch.dataset.category = preset;
  }

  const header = branch.querySelector(".mindmap-branch-header");
  const indexEl = branch.querySelector(".mindmap-branch-index");
  const textarea = branch.querySelector("textarea");
  let labelInput = branch.querySelector(".mindmap-branch-select");

  if (labelInput instanceof HTMLSelectElement) {
    const replacement = document.createElement("input");
    replacement.type = "text";
    replacement.className = "mindmap-branch-select";
    replacement.setAttribute("aria-label", "Branch label");
    replacement.autocomplete = "off";
    const legacyValue = labelInput.value || branch.dataset.category;
    const presetLabel = getMindmapLabelForCategory(legacyValue);
    replacement.placeholder = presetLabel;
    const existingLabel = branch.dataset.label?.trim();
    replacement.value = existingLabel || presetLabel;
    labelInput.replaceWith(replacement);
    labelInput = replacement;
  }

  if (!(labelInput instanceof HTMLInputElement)) {
    const replacement = document.createElement("input");
    replacement.type = "text";
    replacement.className = "mindmap-branch-select";
    replacement.setAttribute("aria-label", "Branch label");
    replacement.autocomplete = "off";
    const presetLabel = getMindmapLabelForCategory(branch.dataset.category);
    replacement.placeholder = presetLabel;
    replacement.value = branch.dataset.label?.trim() || presetLabel;
    if (header instanceof HTMLElement) {
      if (indexEl) {
        header.insertBefore(replacement, indexEl.nextSibling);
      } else {
        header.appendChild(replacement);
      }
    }
    labelInput = replacement;
  }

  if (!isValidMindmapColor(branch.dataset.color)) {
    branch.dataset.color = getMindmapColorForCategory(
      branch.dataset.category ?? MINDMAP_BRANCH_PRESETS[0].value,
    );
  }

  let colorOptions = branch.querySelector(".mindmap-color-options");
  if (!(colorOptions instanceof HTMLElement)) {
    colorOptions = document.createElement("div");
    colorOptions.className = "mindmap-color-options";
    colorOptions.setAttribute("role", "group");
    colorOptions.setAttribute("aria-label", "Branch colour");
    colorOptions.innerHTML = renderColorSwatchButtons();
  } else {
    colorOptions.classList.add("mindmap-color-options");
    colorOptions.setAttribute("role", "group");
    colorOptions.setAttribute("aria-label", "Branch colour");
    if (!colorOptions.querySelector(".textbox-color-swatch")) {
      colorOptions.innerHTML = renderColorSwatchButtons();
    }
  }

  if (header instanceof HTMLElement) {
    if (colorOptions.parentElement !== header) {
      if (
        labelInput instanceof HTMLElement &&
        labelInput.parentElement === header
      ) {
        header.insertBefore(colorOptions, labelInput.nextSibling);
      } else if (indexEl instanceof HTMLElement) {
        header.insertBefore(colorOptions, indexEl.nextSibling);
      } else {
        header.appendChild(colorOptions);
      }
    }
  } else if (!colorOptions.parentElement) {
    branch.insertBefore(colorOptions, branch.firstChild);
  }

  const colorButtons = Array.from(
    colorOptions.querySelectorAll(".textbox-color-swatch"),
  );

  const syncColourState = (target = branch.dataset.color) => {
    const chosen = isValidMindmapColor(target)
      ? target
      : getMindmapColorForCategory(
          branch.dataset.category ?? MINDMAP_BRANCH_PRESETS[0].value,
        );
    branch.dataset.color = chosen;
    colorButtons.forEach((button) => {
      const isActive = button.dataset.color === chosen;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const removeBtn = branch.querySelector(".branch-remove");

  const syncBranchState = () => {
    const currentCategory =
      branch.dataset.category ?? MINDMAP_BRANCH_PRESETS[0].value;
    const presetLabel = getMindmapLabelForCategory(currentCategory);
    if (labelInput instanceof HTMLInputElement) {
      labelInput.placeholder = presetLabel;
      const trimmed = labelInput.value.trim();
      if (trimmed) {
        branch.dataset.label = trimmed;
      } else {
        delete branch.dataset.label;
      }
    }
    if (textarea instanceof HTMLTextAreaElement) {
      branch.dataset.empty = textarea.value.trim() ? "false" : "true";
    }
    syncColourState();
  };

  branch.__deckMindmapBranchSync = syncBranchState;
  branch.__deckMindmapBranchSyncColor = () => syncColourState();
  syncBranchState();

  textarea?.addEventListener("input", () => {
    syncBranchState();
  });

  textarea?.addEventListener("blur", () => {
    if (typeof branch.__deckMindmapBranchOnChange === "function") {
      branch.__deckMindmapBranchOnChange({ type: "text", branch });
    }
  });

  labelInput?.addEventListener("input", () => {
    syncBranchState();
  });

  labelInput?.addEventListener("blur", () => {
    if (typeof branch.__deckMindmapBranchOnChange === "function") {
      branch.__deckMindmapBranchOnChange({
        type: "label",
        value: labelInput.value,
        branch,
      });
    }
  });

  removeBtn?.addEventListener("click", () => {
    branch.remove();
    if (typeof branch.__deckMindmapBranchOnRemove === "function") {
      branch.__deckMindmapBranchOnRemove();
    }
  });

  colorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.dataset.color) return;
      const chosen = button.dataset.color;
      syncColourState(chosen);
      if (typeof branch.__deckMindmapBranchOnChange === "function") {
        branch.__deckMindmapBranchOnChange({
          type: "color",
          value: chosen,
          branch,
        });
      }
    });
    button.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
  });

  return branch;
}

function recalibrateMindMapCounter() {
  if (!stageViewport) return;
  const inputs = stageViewport.querySelectorAll(
    '.mindmap-form input[id^="mindmap-branch-"]',
  );
  inputs.forEach((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    const match = input.id.match(/mindmap-branch-(\d+)/);
    if (match) {
      const value = Number.parseInt(match[1], 10);
      if (!Number.isNaN(value)) {
        mindMapId = Math.max(mindMapId, value);
      }
    }
  });
}

function getDeckState() {
  refreshSlides();
  return {
    version: 1,
    currentSlideIndex,
    slides: slides.map((slide) => slide.outerHTML),
  };
}

function downloadDeckState() {
  try {
    const state = getDeckState();
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "deck-state.json";
    anchor.click();
    URL.revokeObjectURL(url);
    showDeckToast("Deck state saved to your device.", {
      icon: "fa-floppy-disk",
    });
  } catch (error) {
    console.error("Failed to save deck state", error);
    showDeckToast(
      "Sorry, we couldn't save the deck right now. Please try again.",
      { icon: "fa-triangle-exclamation" },
    );
  }
}

function parseDeckState(raw) {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.slides)) {
    throw new Error("Invalid deck state structure");
  }
  return parsed;
}

function applyDeckState(state) {
  if (!stageViewport || !state || !Array.isArray(state.slides)) {
    throw new Error("Deck state does not include slides");
  }

  const navButtons = Array.from(stageViewport.querySelectorAll(".slide-nav"));
  const existingSlides = Array.from(
    stageViewport.querySelectorAll(".slide-stage"),
  );
  existingSlides.forEach((slide) => {
    if (slide instanceof HTMLElement) {
      cleanupSlide(slide);
    }
  });
  const fragment = document.createDocumentFragment();

  state.slides.forEach((slideHTML) => {
    if (typeof slideHTML !== "string") {
      return;
    }
    const template = document.createElement("template");
    template.innerHTML = slideHTML.trim();
    const slide = template.content.firstElementChild;
    if (slide instanceof HTMLElement && slide.classList.contains("slide-stage")) {
      fragment.appendChild(slide);
    }
  });

  stageViewport.innerHTML = "";
  stageViewport.appendChild(fragment);
  navButtons.forEach((button) => stageViewport.appendChild(button));

  refreshSlides();
  slides
    .filter((slide) => slide.dataset.type === "blank")
    .forEach((slide) => attachBlankSlideEvents(slide));

  initialiseActivities();
  recalibrateMindMapCounter();

  if (slides.length) {
    const requestedIndex =
      typeof state.currentSlideIndex === "number"
        ? Math.min(Math.max(state.currentSlideIndex, 0), slides.length - 1)
        : 0;
    showSlide(requestedIndex);
  } else {
    updateCounter();
  }

  hydrateRemoteImages(stageViewport).catch((error) => {
    console.warn("Remote image hydration failed after loading state", error);
  });

  showDeckToast("Deck state loaded successfully.", {
    icon: "fa-file-import",
  });
}

function handleStateFileSelection(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.files?.length) {
    return;
  }

  const [file] = input.files;
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const text = typeof reader.result === "string" ? reader.result : "";
      const state = parseDeckState(text);
      applyDeckState(state);
    } catch (error) {
      console.error("Failed to load deck state", error);
      showDeckToast(
        "The selected file couldn't be loaded. Please choose a valid deck state JSON file.",
        { icon: "fa-triangle-exclamation" },
      );
    } finally {
      input.value = "";
    }
  });

  reader.addEventListener("error", () => {
    console.error("Failed to read deck state file", reader.error);
    showDeckToast(
      "We couldn't read that file. Please try again with a different JSON file.",
      { icon: "fa-triangle-exclamation" },
    );
    input.value = "";
  });

  reader.readAsText(file);
}

function findSlideForNode(node) {
  if (!node) return null;
  if (node instanceof HTMLElement) {
    return node.closest(".slide-stage");
  }
  if (node instanceof Text) {
    return node.parentElement?.closest(".slide-stage") ?? null;
  }
  return null;
}

function applyHighlight(color) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    showDeckToast("Select some text in a slide before applying a highlight.", {
      icon: "fa-highlighter",
    });
    return;
  }

  const range = selection.getRangeAt(0);
  const startSlide = findSlideForNode(range.startContainer);
  const endSlide = findSlideForNode(range.endContainer);

  if (!startSlide || !endSlide || startSlide !== endSlide) {
    showDeckToast("Highlights must stay within a single slide.", {
      icon: "fa-highlighter",
    });
    return;
  }

  if (!stageViewport?.contains(startSlide)) {
    showDeckToast("Please highlight text within the slide area.", {
      icon: "fa-highlighter",
    });
    return;
  }

  try {
    const contents = range.extractContents();
    const textSample = contents.textContent?.trim();
    if (!textSample) {
      showDeckToast("Select some text to highlight first.", {
        icon: "fa-highlighter",
      });
      range.insertNode(contents);
      return;
    }

    const highlight = document.createElement("mark");
    highlight.className = "text-highlight";
    highlight.dataset.color = color;
    highlight.style.setProperty("--highlight-color", color);
    highlight.appendChild(contents);
    range.insertNode(highlight);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(highlight);
    selection.addRange(newRange);
  } catch (error) {
    console.error("Failed to apply highlight", error);
    showDeckToast(
      "Sorry, that selection couldn't be highlighted. Try selecting a smaller section of text.",
      { icon: "fa-triangle-exclamation" },
    );
  }
}

function removeHighlight() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    showDeckToast("Place your cursor inside a highlight to clear it.", {
      icon: "fa-highlighter",
    });
    return;
  }

  let container = selection.anchorNode;
  if (container instanceof Text) {
    container = container.parentElement;
  }

  const highlight =
    container instanceof HTMLElement ? container.closest(".text-highlight") : null;

  if (!highlight || !stageViewport?.contains(highlight)) {
    showDeckToast("Place your cursor inside a highlight to clear it.", {
      icon: "fa-highlighter",
    });
    return;
  }

  const parent = highlight.parentNode;
  if (!parent) {
    return;
  }

  while (highlight.firstChild) {
    parent.insertBefore(highlight.firstChild, highlight);
  }
  highlight.remove();
  if (parent instanceof HTMLElement) {
    parent.normalize();
  }
  selection.removeAllRanges();
}

function setupClickPlacement(activityEl) {
  const tokens = Array.from(activityEl.querySelectorAll('.click-token'));
  const dropZones = Array.from(activityEl.querySelectorAll('.drop-zone'));
  const feedback = activityEl.querySelector('.feedback-msg');
  const buttons = Array.from(
    activityEl.querySelectorAll('.activity-actions button'),
  );
  let activeToken = null;

  dropZones.forEach((zone, index) => {
    if (!zone.dataset.zoneId) {
      zone.dataset.zoneId = `${
        activityEl.dataset.activity || 'zone'
      }-${index + 1}-${Math.random().toString(16).slice(2, 6)}`;
    }
    if (!zone.dataset.placeholder) {
      zone.dataset.placeholder = 'Select';
    }
    zone.innerHTML = zone.dataset.placeholder;
    zone.classList.add('placeholder');
    zone.classList.remove('filled');

    zone.addEventListener('click', () => {
      if (activeToken) {
        const previousTokenId = zone.dataset.current;
        if (previousTokenId) {
          const previousToken = tokens.find(
            (token) => token.dataset.tokenId === previousTokenId,
          );
          if (previousToken) {
            previousToken.dataset.assigned = 'false';
            previousToken.dataset.zoneId = '';
            previousToken.classList.remove('used');
          }
        }

        zone.dataset.current = activeToken.dataset.tokenId;
        zone.innerHTML = activeToken.innerHTML;
        zone.classList.remove('placeholder', 'correct', 'incorrect', 'selected');
        zone.classList.add('filled');

        activeToken.dataset.assigned = 'true';
        activeToken.dataset.zoneId = zone.dataset.zoneId;
        activeToken.classList.remove('selected');
        activeToken.classList.add('used');
        activeToken = null;
      } else if (zone.dataset.current) {
        const assignedToken = tokens.find(
          (token) => token.dataset.tokenId === zone.dataset.current,
        );
        if (assignedToken) {
          assignedToken.dataset.assigned = 'false';
          assignedToken.dataset.zoneId = '';
          assignedToken.classList.remove('used');
        }
        zone.dataset.current = '';
        zone.innerHTML = zone.dataset.placeholder;
        zone.classList.remove('filled', 'correct', 'incorrect', 'selected');
        zone.classList.add('placeholder');
      } else {
        zone.classList.add('selected');
        window.setTimeout(() => zone.classList.remove('selected'), 180);
      }
    });
  });

  tokens.forEach((token, index) => {
    if (!token.dataset.tokenId) {
      token.dataset.tokenId = `token-${index}-${Math.random()
        .toString(16)
        .slice(2, 6)}`;
    }

    token.addEventListener('click', () => {
      if (token.dataset.assigned === 'true' && token.dataset.zoneId) {
        const zone = dropZones.find(
          (item) => item.dataset.zoneId === token.dataset.zoneId,
        );
        if (zone) {
          zone.dataset.current = '';
          zone.innerHTML = zone.dataset.placeholder;
          zone.classList.remove('filled', 'correct', 'incorrect', 'selected');
          zone.classList.add('placeholder');
        }
        token.dataset.assigned = 'false';
        token.dataset.zoneId = '';
        token.classList.remove('used');
      }

      if (activeToken === token) {
        token.classList.remove('selected');
        activeToken = null;
      } else {
        tokens.forEach((item) => item.classList.remove('selected'));
        token.classList.add('selected');
        activeToken = token;
      }
    });
  });

  buttons.forEach((btn) => {
    if (btn.dataset.action === 'check') {
      btn.addEventListener('click', () => {
        let correctCount = 0;
        dropZones.forEach((zone) => {
          const tokenId = zone.dataset.current;
          const assignedToken = tokens.find(
            (token) => token.dataset.tokenId === tokenId,
          );
          const selectedValue = assignedToken
            ? assignedToken.dataset.value || assignedToken.textContent.trim()
            : '';
          const isCorrect = Boolean(tokenId) && selectedValue === zone.dataset.answer;

          zone.classList.toggle('correct', isCorrect);
          zone.classList.toggle('incorrect', Boolean(tokenId) && !isCorrect);

          if (!tokenId) {
            zone.classList.remove('correct', 'incorrect');
          }

          if (isCorrect) {
            correctCount += 1;
          }
        });

        if (feedback) {
          if (correctCount === dropZones.length) {
            feedback.textContent = 'Great job! Every space is correct.';
            feedback.className = 'feedback-msg success';
          } else {
            feedback.textContent = `You have ${correctCount} of ${dropZones.length} correct. Try again!`;
            feedback.className = 'feedback-msg error';
          }
        }
      });
    }

    if (btn.dataset.action === 'reset') {
      btn.addEventListener('click', () => {
        dropZones.forEach((zone) => {
          zone.dataset.current = '';
          zone.innerHTML = zone.dataset.placeholder;
          zone.classList.remove('filled', 'correct', 'incorrect', 'selected');
          zone.classList.add('placeholder');
        });

        tokens.forEach((token) => {
          token.dataset.assigned = 'false';
          token.dataset.zoneId = '';
          token.classList.remove('selected', 'used');
        });

        activeToken = null;

        if (feedback) {
          feedback.textContent = '';
          feedback.className = 'feedback-msg';
        }
      });
    }
  });
}

function setupUnscramble(activityEl) {
  const inputs = activityEl.querySelectorAll(".unscramble-input");
  const feedback = activityEl.querySelector(".feedback-msg");
  const checkBtn = activityEl.querySelector('[data-action="check"]');
  const resetBtn = activityEl.querySelector('[data-action="reset"]');

  checkBtn?.addEventListener("click", () => {
    let correctCount = 0;
    inputs.forEach((input) => {
      const answer = input.dataset.answer
        ?.trim()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, " ")
        .toLowerCase();
      const value = input.value
        .trim()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, " ")
        .toLowerCase();
      if (answer && answer === value) {
        input.classList.add("correct");
        input.classList.remove("incorrect");
        correctCount++;
      } else {
        input.classList.add("incorrect");
        input.classList.remove("correct");
      }
    });
    if (feedback) {
      feedback.textContent = `You have ${correctCount} of ${inputs.length} correct.`;
      feedback.className =
        correctCount === inputs.length
          ? "feedback-msg success"
          : "feedback-msg error";
    }
  });

  resetBtn?.addEventListener("click", () => {
    inputs.forEach((input) => {
      input.value = "";
      input.classList.remove("correct", "incorrect");
    });
    if (feedback) {
      feedback.textContent = "";
      feedback.className = "feedback-msg";
    }
  });
}

function syncGapInputWidth(input) {
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  const answerLength = normaliseWhitespace(input.dataset.answer ?? "").length;
  const valueLength = normaliseWhitespace(input.value ?? "").length;
  const charUnits = Math.max(3, answerLength, valueLength);
  input.style.width = `calc(${Math.min(charUnits, 32)}ch + 1.5rem)`;
}

function setupGapFill(activityEl) {
  const inputs = activityEl.querySelectorAll(".gap-input");
  const feedback = activityEl.querySelector(".feedback-msg");
  const checkBtn = activityEl.querySelector('[data-action="check"]');
  const resetBtn = activityEl.querySelector('[data-action="reset"]');

  inputs.forEach((input) => {
    syncGapInputWidth(input);
    input.addEventListener("input", () => {
      syncGapInputWidth(input);
    });
    input.addEventListener("change", () => {
      syncGapInputWidth(input);
    });
  });

  checkBtn?.addEventListener("click", () => {
    let correctCount = 0;
    inputs.forEach((input) => {
      const answer = normaliseResponseValue(input.dataset.answer);
      const value = normaliseResponseValue(input.value);
      if (answer && value && answer === value) {
        input.classList.add("correct");
        input.classList.remove("incorrect");
        correctCount++;
      } else {
        input.classList.add("incorrect");
        input.classList.remove("correct");
      }
    });
    if (feedback) {
      feedback.textContent = `You have ${correctCount} of ${inputs.length} correct.`;
      feedback.className =
        correctCount === inputs.length
          ? "feedback-msg success"
          : "feedback-msg error";
    }
  });

  resetBtn?.addEventListener("click", () => {
    inputs.forEach((input) => {
      input.value = "";
      input.classList.remove("correct", "incorrect");
      syncGapInputWidth(input);
    });
    if (feedback) {
      feedback.textContent = "";
      feedback.className = "feedback-msg";
    }
  });
}

function setupMatching(activityEl) {
  const options = activityEl.querySelectorAll(".matching-option");
  const feedback = activityEl.querySelector(".feedback-msg");
  const checkBtn = activityEl.querySelector('[data-action="check"]');
  const resetBtn = activityEl.querySelector('[data-action="reset"]');

  checkBtn?.addEventListener("click", () => {
    let correctCount = 0;
    options.forEach((option) => {
      const select = option.querySelector("select");
      if (select && select.value === option.dataset.correct) {
        option.style.borderColor = "#2E7D32";
        correctCount++;
      } else {
        option.style.borderColor = "#C62828";
      }
    });
    if (feedback) {
      feedback.textContent = `You have ${correctCount} of ${options.length} correct.`;
      feedback.className =
        correctCount === options.length
          ? "feedback-msg success"
          : "feedback-msg error";
    }
  });

  resetBtn?.addEventListener("click", () => {
    options.forEach((option) => {
      const select = option.querySelector("select");
      if (select) {
        select.selectedIndex = 0;
      }
      option.style.borderColor = "rgba(122,132,113,0.16)";
    });
    if (feedback) {
      feedback.textContent = "";
      feedback.className = "feedback-msg";
    }
  });
}

function setupMatchingConnect(activityEl) {
  const questions = Array.from(activityEl.querySelectorAll('.match-question'));
  const answers = Array.from(activityEl.querySelectorAll('.match-answer'));
  const feedback = activityEl.querySelector('.feedback-msg');
  const checkBtn = activityEl.querySelector('[data-action="check"]');
  const resetBtn = activityEl.querySelector('[data-action="reset"]');
  let activeQuestion = null;

  const findAnswerByValue = (value) =>
    answers.find((answer) => answer.dataset.value === value);

  const findQuestionById = (id) =>
    questions.find((question) => question.dataset.questionId === id);

  const clearAssignment = (question) => {
    if (!question) {
      return;
    }

    const selectedValue = question.dataset.selected;
    if (selectedValue) {
      const answer = findAnswerByValue(selectedValue);
      if (answer) {
        answer.dataset.selected = '';
        answer.classList.remove('paired', 'incorrect', 'active');
      }
    }
    question.dataset.selected = '';
    question.classList.remove('paired', 'incorrect', 'active');
    const label = question.querySelector('.match-assignment');
    if (label) {
      label.textContent = '';
    }
  };

  const assignPair = (question, answer) => {
    if (!question || !answer) {
      return;
    }

    if (question.dataset.selected) {
      clearAssignment(question);
    }

    if (answer.dataset.selected) {
      const previousQuestion = findQuestionById(answer.dataset.selected);
      if (previousQuestion) {
        clearAssignment(previousQuestion);
      }
    }

    question.dataset.selected = answer.dataset.value || '';
    answer.dataset.selected = question.dataset.questionId || '';
    question.classList.add('paired');
    answer.classList.add('paired');
    question.classList.remove('incorrect');
    answer.classList.remove('incorrect');
    const label = question.querySelector('.match-assignment');
    if (label) {
      label.textContent = answer.textContent.trim();
    }
  };

  const setActiveQuestion = (question) => {
    questions.forEach((item) => item.classList.remove('active'));
    if (question) {
      question.classList.add('active');
      activeQuestion = question;
    } else {
      activeQuestion = null;
    }
  };

  questions.forEach((question) => {
    question.addEventListener('click', () => {
      if (activeQuestion === question) {
        if (question.dataset.selected) {
          clearAssignment(question);
        }
        setActiveQuestion(null);
        return;
      }

      if (question.dataset.selected) {
        clearAssignment(question);
      }

      setActiveQuestion(question);
    });
  });

  answers.forEach((answer) => {
    answer.addEventListener('click', () => {
      if (activeQuestion) {
        assignPair(activeQuestion, answer);
        setActiveQuestion(null);
      } else if (answer.dataset.selected) {
        const linkedQuestion = findQuestionById(answer.dataset.selected);
        if (linkedQuestion) {
          setActiveQuestion(linkedQuestion);
        }
      }
    });
  });

  checkBtn?.addEventListener('click', () => {
    let correctCount = 0;

    questions.forEach((question) => {
      const expectedAnswer = question.dataset.answer;
      const selectedValue = question.dataset.selected;
      const assignedAnswer = selectedValue
        ? findAnswerByValue(selectedValue)
        : null;
      const isCorrect = Boolean(selectedValue) && selectedValue === expectedAnswer;

      question.classList.toggle('paired', Boolean(selectedValue));
      question.classList.toggle(
        'incorrect',
        Boolean(selectedValue) && !isCorrect,
      );

      if (assignedAnswer) {
        assignedAnswer.classList.toggle('paired', Boolean(selectedValue));
        assignedAnswer.classList.toggle(
          'incorrect',
          Boolean(selectedValue) && !isCorrect,
        );
      }

      if (isCorrect) {
        correctCount += 1;
      }
    });

    if (feedback) {
      feedback.textContent =
        correctCount === questions.length
          ? 'Excellent! Every match is correct.'
          : `You have ${correctCount} of ${questions.length} correct. Adjust and try again.`;
      feedback.className =
        correctCount === questions.length
          ? 'feedback-msg success'
          : 'feedback-msg error';
    }
  });

  resetBtn?.addEventListener('click', () => {
    questions.forEach((question) => {
      clearAssignment(question);
    });
    answers.forEach((answer) => {
      answer.dataset.selected = '';
      answer.classList.remove('paired', 'incorrect', 'active');
    });
    setActiveQuestion(null);
    if (feedback) {
      feedback.textContent = '';
      feedback.className = 'feedback-msg';
    }
  });
}

function setupMcGrammar(activityEl) {
  const cards = activityEl.querySelectorAll(".quiz-card");
  const feedback = activityEl.querySelector(".feedback-msg");
  const checkBtn = activityEl.querySelector('[data-action="check"]');
  const resetBtn = activityEl.querySelector('[data-action="reset"]');

  checkBtn?.addEventListener("click", () => {
    let correctCount = 0;
    cards.forEach((card) => {
      const select = card.querySelector("select");
      if (select && select.value === card.dataset.answer) {
        card.classList.add("correct");
        card.classList.remove("incorrect");
        correctCount++;
      } else {
        card.classList.add("incorrect");
        card.classList.remove("correct");
      }
    });
    if (feedback) {
      feedback.textContent = `You have ${correctCount} of ${cards.length} correct.`;
      feedback.className =
        correctCount === cards.length
          ? "feedback-msg success"
          : "feedback-msg error";
    }
  });

  resetBtn?.addEventListener("click", () => {
    cards.forEach((card) => {
      const select = card.querySelector("select");
      if (select) {
        select.selectedIndex = 0;
      }
      card.classList.remove("correct", "incorrect");
    });
    if (feedback) {
      feedback.textContent = "";
      feedback.className = "feedback-msg";
    }
  });
}

function setupMcGrammarRadio(container) {
  const questions = container.querySelectorAll(".quiz-card");
  const checkBtn = container.querySelector('[data-action="check"]');
  const resetBtn = container.querySelector('[data-action="reset"]');
  const feedback = container.querySelector(".feedback-msg");

  checkBtn?.addEventListener("click", () => {
    let correctCount = 0;
    questions.forEach((question) => {
      const selected = question.querySelector("input:checked");
      const options = question.querySelectorAll(".quiz-option");
      options.forEach((option) =>
        option.classList.remove("correct", "incorrect"),
      );
      if (selected) {
        const label = selected.closest(".quiz-option");
        const value = label?.textContent?.trim();
        if (value === question.dataset.answer) {
          label?.classList.add("correct");
          correctCount++;
        } else {
          label?.classList.add("incorrect");
        }
      }
    });
    if (feedback) {
      feedback.textContent = `You scored ${correctCount} out of ${questions.length}.`;
      feedback.className =
        correctCount === questions.length
          ? "feedback-msg success"
          : "feedback-msg error";
    }
  });

  resetBtn?.addEventListener("click", () => {
    questions.forEach((question) => {
      question.querySelectorAll("input").forEach((radio) => {
        radio.checked = false;
      });
      question
        .querySelectorAll(".quiz-option")
        .forEach((option) => option.classList.remove("correct", "incorrect"));
    });
    if (feedback) {
      feedback.textContent = "";
      feedback.className = "feedback-msg";
    }
  });
}

function setupCategorization(activityEl) {
  const tokenBank = activityEl.querySelector(".token-bank");
  const tokens = Array.from(activityEl.querySelectorAll(".click-token"));
  const dropZones = Array.from(activityEl.querySelectorAll(".drop-zone"));
  const columns = Array.from(activityEl.querySelectorAll(".category-column"));
  const feedback = activityEl.querySelector(".feedback-msg");
  const checkBtn = activityEl.querySelector('[data-action="check"]');
  const resetBtn = activityEl.querySelector('[data-action="reset"]');
  let selectedToken = null;

  tokens.forEach((token) => {
    token.addEventListener("click", () => {
      if (selectedToken) selectedToken.classList.remove("selected");
      if (selectedToken === token) {
        selectedToken = null;
      } else {
        selectedToken = token;
        selectedToken.classList.add("selected");
      }
    });
  });

  dropZones.forEach((zone) => {
    zone.addEventListener("click", () => {
      if (selectedToken) {
        zone.appendChild(selectedToken);
        selectedToken.classList.remove("selected");
        selectedToken = null;
      }
    });
  });

  checkBtn?.addEventListener("click", () => {
    columns.forEach((col) => col.classList.remove("correct", "incorrect"));
    let correctTotal = 0;
    tokens.forEach((token) => {
      const parentColumn = token.closest(".category-column");
      if (
        parentColumn &&
        token.dataset.category === parentColumn.dataset.category
      ) {
        correctTotal++;
      }
    });
    columns.forEach((column) => {
      const zone = column.querySelector(".drop-zone");
      const hasTokens = zone?.querySelector(".click-token");
      if (hasTokens && column.dataset.category) {
        const allMatch = Array.from(
          zone?.querySelectorAll(".click-token") ?? [],
        ).every(
          (token) => token.dataset.category === column.dataset.category,
        );
        column.classList.add(allMatch ? "correct" : "incorrect");
      } else {
        column.classList.add("incorrect");
      }
    });
    if (feedback) {
      feedback.textContent = `You correctly placed ${correctTotal} out of ${tokens.length} items.`;
      feedback.className =
        correctTotal === tokens.length
          ? "feedback-msg success"
          : "feedback-msg error";
    }
  });

  resetBtn?.addEventListener("click", () => {
    tokens.forEach((token) => {
      tokenBank?.appendChild(token);
      token.classList.remove("selected");
    });
    columns.forEach((column) =>
      column.classList.remove("correct", "incorrect"),
    );
    selectedToken = null;
    if (feedback) {
      feedback.textContent = "";
      feedback.className = "feedback-msg";
    }
  });
}

function setupStressMark(activityEl) {
  const sentences = activityEl.querySelectorAll(".stress-sentence");
  const feedback = activityEl.querySelector(".feedback-msg");
  const checkBtn = activityEl.querySelector('[data-action="check"]');
  const resetBtn = activityEl.querySelector('[data-action="reset"]');

  sentences.forEach((sentence) => {
    const words = sentence.querySelectorAll(".stress-word");
    words.forEach((word) => {
      word.addEventListener("click", () => {
        words.forEach((w) => w.classList.remove("marked"));
        word.classList.add("marked");
      });
    });
  });

  checkBtn?.addEventListener("click", () => {
    let correctCount = 0;
    sentences.forEach((sentence) => {
      const markedWord = sentence.querySelector(".stress-word.marked");
      const correctWordText = sentence.dataset.correct?.trim().toLowerCase();
      sentence
        .querySelectorAll(".stress-word")
        .forEach((word) => word.classList.remove("correct", "incorrect"));
      if (markedWord) {
        const markedText = markedWord.textContent
          ?.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
          .trim()
          .toLowerCase();
        if (markedText && markedText === correctWordText) {
          markedWord.classList.add("correct");
          correctCount++;
        } else {
          markedWord.classList.add("incorrect");
        }
      }
    });
    if (feedback) {
      feedback.textContent = `You have ${correctCount} of ${sentences.length} correct.`;
      feedback.className =
        correctCount === sentences.length
          ? "feedback-msg success"
          : "feedback-msg error";
    }
  });

  resetBtn?.addEventListener("click", () => {
    sentences.forEach((sentence) => {
      sentence.querySelectorAll(".stress-word").forEach((word) => {
        word.classList.remove("marked", "correct", "incorrect");
      });
    });
    if (feedback) {
      feedback.textContent = "";
      feedback.className = "feedback-msg";
    }
  });
}

function initialiseActivities(root = document) {
  if (!root) {
    return;
  }

  const scope =
    root instanceof Element || root instanceof Document ? root : document;

  if (typeof scope.querySelectorAll !== "function") {
    return;
  }

  const queryAll = (selector) => Array.from(scope.querySelectorAll(selector));

  queryAll('[data-activity="unscramble"]').forEach((el) =>
    setupUnscramble(el),
  );
  queryAll('[data-activity="gap-fill"]').forEach((el) => setupGapFill(el));
  queryAll('[data-activity="table-completion"]').forEach((el) =>
    setupClickPlacement(el),
  );
  queryAll('[data-activity="token-drop"]').forEach((el) =>
    setupClickPlacement(el),
  );
  queryAll('[data-activity="matching"]').forEach((el) => setupMatching(el));
  queryAll('[data-activity="matching-connect"]').forEach((el) =>
    setupMatchingConnect(el),
  );
  queryAll('[data-activity="mc-grammar"]').forEach((el) =>
    setupMcGrammar(el),
  );
  queryAll('[data-activity="mc-grammar-radio"]').forEach((el) =>
    setupMcGrammarRadio(el),
  );
  queryAll('[data-activity="categorization"]').forEach((el) =>
    setupCategorization(el),
  );
  queryAll('[data-activity="stress-mark"]').forEach((el) =>
    setupStressMark(el),
  );
}

async function copyTextToClipboard(text) {
  if (typeof text !== "string" || !text) {
    throw new Error("No text provided for clipboard copy");
  }
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  const success = document.execCommand ? document.execCommand("copy") : false;
  document.body.removeChild(textarea);
  if (!success) {
    throw new Error("Legacy clipboard command was unsuccessful");
  }
  return true;
}

function showBuilderStatus(message = "", tone) {
  if (!(builderStatusEl instanceof HTMLElement)) {
    return;
  }
  if (builderStatusEl.__deckStatusTimer) {
    window.clearTimeout(builderStatusEl.__deckStatusTimer);
    builderStatusEl.__deckStatusTimer = undefined;
  }
  builderStatusEl.textContent = message;
  if (tone) {
    builderStatusEl.dataset.tone = tone;
  } else {
    builderStatusEl.removeAttribute("data-tone");
  }
  if (message) {
    builderStatusEl.__deckStatusTimer = window.setTimeout(() => {
      builderStatusEl.textContent = "";
      builderStatusEl.removeAttribute("data-tone");
      builderStatusEl.__deckStatusTimer = undefined;
    }, BUILDER_STATUS_TIMEOUT);
  }
}

function collectRubricCriteria() {
  if (!(builderPromptList instanceof HTMLElement)) {
    return [];
  }
  const items = Array.from(
    builderPromptList.querySelectorAll(".builder-prompt-item"),
  );
  return items
    .map((item) => {
      const promptInput = item.querySelector('input[name="rubricPrompt[]"]');
      const successInput = item.querySelector(
        'textarea[name="rubricSuccess[]"]',
      );
      const prompt = normaliseWhitespace(promptInput?.value ?? "");
      if (!prompt) {
        return null;
      }
      const success = trimText(successInput?.value ?? "");
      return { prompt, success };
    })
    .filter(Boolean);
}

const getSelectedLayout = () => {
  if (!Array.isArray(builderLayoutInputs)) {
    return 'blank-canvas';
  }
  const selected = builderLayoutInputs.find((input) => input.checked);
  return selected?.value || 'blank-canvas';
};

const setSelectedLayout = (layout = 'blank-canvas') => {
  if (!Array.isArray(builderLayoutInputs)) {
    return;
  }
  let matched = false;
  builderLayoutInputs.forEach((input) => {
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    const shouldCheck = input.value === layout;
    input.checked = shouldCheck;
    if (shouldCheck) {
      matched = true;
    }
  });
  if (!matched && builderLayoutInputs[0] instanceof HTMLInputElement) {
    builderLayoutInputs[0].checked = true;
  }
};

function getBuilderFormState() {
  if (!(builderForm instanceof HTMLFormElement)) {
    return null;
  }
  const formData = new FormData(builderForm);
  const layout = (formData.get("slideLayout") || getSelectedLayout() || "blank-canvas").toString();
  const stageLabel = trimText(formData.get("stageLabel"));
  const activityTitle = trimText(formData.get("activityTitle"));
  const duration = trimText(formData.get("activityDuration"));
  const slideTitle = trimText(formData.get("slideTitle"));
  const rubricIntro = trimText(formData.get("slideRubricLead"));
  const overview = trimText(formData.get("activityOverview"));
  const steps = splitMultiline(formData.get("activitySteps"));
  const levels = parseRubricLevels(formData.get("rubricLevels"));
  const criteria = collectRubricCriteria();
  const columnOneHeading = trimText(formData.get("columnOneHeading"));
  const columnOneItems = splitMultiline(formData.get("columnOneItems"));
  const columnTwoHeading = trimText(formData.get("columnTwoHeading"));
  const columnTwoItems = splitMultiline(formData.get("columnTwoItems"));
  const spotlightNarrative = splitMultiline(formData.get("spotlightNarrative"));
  const imageUrl = trimText(formData.get("imageUrl"));
  const imageAlt = trimText(formData.get("imageAlt"));
  const cards = [
    {
      heading: trimText(formData.get("cardOneHeading")),
      body: trimText(formData.get("cardOneBody")),
    },
    {
      heading: trimText(formData.get("cardTwoHeading")),
      body: trimText(formData.get("cardTwoBody")),
    },
    {
      heading: trimText(formData.get("cardThreeHeading")),
      body: trimText(formData.get("cardThreeBody")),
    },
  ].filter((card) => card.heading || card.body);

  return {
    layout,
    stageLabel,
    activityTitle,
    duration,
    slideTitle,
    rubricIntro,
    overview,
    steps,
    levels,
    criteria,
    columnOneHeading,
    columnOneItems,
    columnTwoHeading,
    columnTwoItems,
    spotlightNarrative,
    imageUrl,
    imageAlt,
    cards,
  };
}

function updateBuilderJsonPreview() {
  if (!(builderJsonPreview instanceof HTMLElement)) {
    return;
  }
  const state = getBuilderFormState();
  if (!state) {
    builderJsonPreview.textContent = "{}";
    return;
  }
  if (state.layout === "blank-canvas") {
    builderJsonPreview.textContent = JSON.stringify(
      {
        layout: state.layout,
      },
      null,
      2,
    );
    return;
  }
  const previewData = {
    layout: state.layout,
    stageLabel: state.stageLabel,
    activityTitle: state.activityTitle,
    duration: state.duration,
    slideTitle: state.slideTitle,
    rubricIntro: state.rubricIntro,
    overview: state.overview,
    steps: state.steps,
    rubric: {
      levels: state.levels,
      criteria: state.criteria.map((criterion, index) => ({
        id: `criterion-${index + 1}`,
        prompt: criterion.prompt,
        success: criterion.success,
      })),
    },
    columns:
      state.layout === "rubric-columns"
        ? {
            first: { heading: state.columnOneHeading, items: state.columnOneItems },
            second: { heading: state.columnTwoHeading, items: state.columnTwoItems },
          }
        : undefined,
    spotlight:
      state.layout === "image-spotlight"
        ? {
            narrative: state.spotlightNarrative,
            imageUrl: state.imageUrl,
            imageAlt: state.imageAlt,
          }
        : undefined,
    cards: state.layout === "rubric-cards" ? state.cards : undefined,
  };
  builderJsonPreview.textContent = JSON.stringify(previewData, null, 2);
}

function syncBuilderLayout(layout = getSelectedLayout()) {
  if (!(builderForm instanceof HTMLFormElement)) {
    return;
  }
  const targetLayout = layout || getSelectedLayout() || "blank-canvas";
  setSelectedLayout(targetLayout);
  if (Array.isArray(builderLayoutInputs)) {
    builderLayoutInputs.forEach((input) => {
      if (!(input instanceof HTMLInputElement)) {
        return;
      }
      const parent = input.closest(".layout-option");
      if (parent instanceof HTMLElement) {
        parent.classList.toggle("is-selected", input.checked);
      }
    });
  }
  const blocks = builderForm.querySelectorAll("[data-layouts]");
  blocks.forEach((block) => {
    const layouts = (block.dataset.layouts || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const isVisible = !layouts.length || layouts.includes(targetLayout);
    block.hidden = !isVisible;
    const controls = block.querySelectorAll("input, textarea, select");
    controls.forEach((control) => {
      if (!(control instanceof HTMLElement)) {
        return;
      }
      if (isVisible) {
        control.removeAttribute("disabled");
      } else {
        control.setAttribute("disabled", "disabled");
      }
    });
  });
}

function updateBuilderPreview() {
  if (!(builderPreview instanceof HTMLElement)) {
    return;
  }
  const state = getBuilderFormState();
  builderPreview.classList.remove("has-content");
  builderPreview.innerHTML = "";
  if (!state) {
    return;
  }

  if (state.layout === "blank-canvas") {
    const blankSlide = createBlankSlide();
    if (blankSlide instanceof HTMLElement) {
      const previewSlide = blankSlide.cloneNode(true);
      previewSlide.classList.remove("hidden");
      builderPreview.appendChild(previewSlide);
      builderPreview.classList.add("has-content");
    }
    return;
  }

  const rubricPayload = {
    criteria: state.criteria,
    levels: state.levels,
  };

  let slide = null;
  switch (state.layout) {
    case "rubric-simple":
      slide = createRubricFocusSlide({
        stageLabel: state.stageLabel || "Activity Workshop",
        title: state.slideTitle || state.activityTitle || "Success criteria",
        activityTitle: state.activityTitle,
        duration: state.duration,
        rubric: rubricPayload,
        rubricHeadingText: "Success criteria",
        rubricIntro: state.rubricIntro,
      });
      break;
    case "rubric-columns":
      slide = createRubricColumnSlide({
        stageLabel: state.stageLabel || "Activity Workshop",
        title: state.activityTitle || state.slideTitle || "Discussion + rubric",
        duration: state.duration,
        slideTitle: state.slideTitle,
        rubric: rubricPayload,
        rubricIntro: state.rubricIntro,
        columnOne: {
          heading: state.columnOneHeading,
          items: state.columnOneItems,
        },
        columnTwo: {
          heading: state.columnTwoHeading,
          items: state.columnTwoItems,
        },
      });
      break;
    case "image-spotlight":
      slide = createImageSpotlightSlide({
        stageLabel: state.stageLabel || "Activity Workshop",
        title: state.activityTitle || state.slideTitle || "Spotlight",
        duration: state.duration,
        slideTitle: state.slideTitle,
        rubric: rubricPayload,
        rubricIntro: state.rubricIntro,
        narrative: state.spotlightNarrative,
        imageUrl: state.imageUrl,
        imageAlt: state.imageAlt,
      });
      break;
    case "rubric-cards":
      slide = createRubricCardSlide({
        stageLabel: state.stageLabel || "Activity Workshop",
        title: state.activityTitle || state.slideTitle || "Strategy lab",
        duration: state.duration,
        slideTitle: state.slideTitle,
        rubric: rubricPayload,
        rubricIntro: state.rubricIntro,
        cards: state.cards,
      });
      break;
    default:
      slide = createActivitySlide({
        stageLabel: state.stageLabel || "Activity Workshop",
        title: state.activityTitle || "Activity",
        duration: state.duration,
        overview: state.overview,
        steps: state.steps,
        rubric: rubricPayload,
        instructionsHeading: state.slideTitle,
        rubricHeadingText: "Success criteria",
        rubricIntro: state.rubricIntro,
      });
      break;
  }

  if (slide instanceof HTMLElement) {
    const previewSlide = slide.cloneNode(true);
    previewSlide.classList.remove("hidden");
    builderPreview.appendChild(previewSlide);
    builderPreview.classList.add("has-content");
  }
}

function ensureBuilderPrompts() {
  if (!(builderPromptList instanceof HTMLElement)) {
    return;
  }
  const layout = getSelectedLayout();
  if (layout === "blank-canvas") {
    builderPromptList.innerHTML = "";
    return;
  }
  if (!builderPromptList.querySelector(".builder-prompt-item")) {
    DEFAULT_BUILDER_PROMPTS.forEach((entry) => addPromptItem(entry));
  }
}

function updateImageSearchStatus(message = "", tone = "info") {
  if (!(builderImageStatus instanceof HTMLElement)) {
    return;
  }
  builderImageStatus.textContent = message;
  if (message) {
    builderImageStatus.dataset.tone = tone;
  } else {
    builderImageStatus.removeAttribute("data-tone");
  }
}

function renderImageSearchResults(photos = []) {
  if (!(builderImageResults instanceof HTMLElement)) {
    return;
  }
  builderImageResults.innerHTML = "";
  if (!Array.isArray(photos) || !photos.length) {
    return;
  }
  photos.forEach((photo, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "image-result";
    button.dataset.url = photo.src?.large2x || photo.src?.large || "";
    button.dataset.alt = photo.alt || "";
    button.dataset.id = String(photo.id ?? index);
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", "false");
    const img = document.createElement("img");
    img.src = photo.src?.medium || photo.src?.small || photo.src?.tiny || "";
    img.alt = photo.alt || "Search result";
    img.loading = "lazy";
    img.decoding = "async";
    button.appendChild(img);
    builderImageResults.appendChild(button);
  });
}

function selectImageResult(button) {
  if (!(button instanceof HTMLElement)) {
    return;
  }
  const url = button.dataset.url || "";
  const alt = button.dataset.alt || "";
  if (builderImageResults instanceof HTMLElement) {
    builderImageResults
      .querySelectorAll(".image-result")
      .forEach((item) => {
        item.classList.remove("is-selected");
        item.setAttribute("aria-selected", "false");
      });
  }
  button.classList.add("is-selected");
  button.setAttribute("aria-selected", "true");
  const urlInput = builderForm?.querySelector('input[name="imageUrl"]');
  const altInput = builderForm?.querySelector('input[name="imageAlt"]');
  if (urlInput instanceof HTMLInputElement) {
    urlInput.value = url;
  }
  if (altInput instanceof HTMLInputElement && alt && !altInput.value) {
    altInput.value = alt;
  }
  updateBuilderJsonPreview();
  updateBuilderPreview();
}

async function handleImageSearch() {
  if (!(builderImageSearchInput instanceof HTMLInputElement)) {
    return;
  }
  const query = builderImageSearchInput.value.trim();
  if (!query) {
    updateImageSearchStatus("Type a search term to find images.", "info");
    return;
  }
  updateImageSearchStatus("Searching Pexels...", "info");
  if (!PEXELS_API_KEY) {
    updateImageSearchStatus("Pexels search is unavailable.", "error");
    return;
  }
  try {
    const response = await fetch(
      `${PEXELS_SEARCH_URL}?query=${encodeURIComponent(query)}&per_page=8`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      },
    );
    if (!response.ok) {
      throw new Error(`Pexels request failed with status ${response.status}`);
    }
    const data = await response.json();
    const photos = Array.isArray(data?.photos) ? data.photos : [];
    if (!photos.length) {
      updateImageSearchStatus("No images found. Try another term.", "info");
    } else {
      updateImageSearchStatus(`Found ${photos.length} image${photos.length === 1 ? "" : "s"}.`, "success");
    }
    renderImageSearchResults(photos);
  } catch (error) {
    console.warn("Image search failed", error);
    updateImageSearchStatus("We couldn't fetch images right now.", "error");
  }
}

function addPromptItem({ prompt = "", success = "" } = {}) {
  if (!(builderPromptList instanceof HTMLElement)) {
    return null;
  }

  const item = document.createElement("li");
  item.className = "builder-prompt-item";

  const promptField = document.createElement("div");
  promptField.className = "builder-field";
  const promptLabel = document.createElement("label");
  promptLabel.className = "builder-field-label";
  const promptId = generateBuilderFieldId("builder-prompt");
  promptLabel.setAttribute("for", promptId);
  promptLabel.textContent = "Prompt";
  const promptInput = document.createElement("input");
  promptInput.type = "text";
  promptInput.name = "rubricPrompt[]";
  promptInput.id = promptId;
  promptInput.required = true;
  promptInput.placeholder = "What should learners pay attention to?";
  promptInput.value = prompt;
  promptField.appendChild(promptLabel);
  promptField.appendChild(promptInput);

  const successField = document.createElement("div");
  successField.className = "builder-field";
  const successLabel = document.createElement("label");
  successLabel.className = "builder-field-label";
  const successId = generateBuilderFieldId("builder-success");
  successLabel.setAttribute("for", successId);
  successLabel.textContent = "Success description";
  const successArea = document.createElement("textarea");
  successArea.name = "rubricSuccess[]";
  successArea.id = successId;
  successArea.rows = 2;
  successArea.placeholder = "Describe what strong evidence looks like";
  successArea.value = success;
  successField.appendChild(successLabel);
  successField.appendChild(successArea);

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "builder-remove-prompt";
  removeBtn.setAttribute("aria-label", "Remove criterion");
  const removeIcon = document.createElement("i");
  removeIcon.className = "fa-solid fa-trash";
  removeIcon.setAttribute("aria-hidden", "true");
  removeBtn.appendChild(removeIcon);

  item.appendChild(promptField);
  item.appendChild(successField);
  item.appendChild(removeBtn);
  builderPromptList.appendChild(item);

  const handleFieldInput = () => {
    updateBuilderJsonPreview();
    updateBuilderPreview();
  };

  promptInput.addEventListener("input", handleFieldInput);
  successArea.addEventListener("input", handleFieldInput);

  removeBtn.addEventListener("click", () => {
    item.remove();
    if (
      getSelectedLayout() !== "blank-canvas" &&
      !builderPromptList.querySelector(".builder-prompt-item")
    ) {
      addPromptItem();
    }
    updateBuilderJsonPreview();
    updateBuilderPreview();
  });

  return item;
}

function resetBuilderForm() {
  if (builderForm instanceof HTMLFormElement) {
    builderForm.reset();
  }
  if (builderPromptList instanceof HTMLElement) {
    builderPromptList.innerHTML = "";
  }
  if (builderImageResults instanceof HTMLElement) {
    builderImageResults.innerHTML = "";
  }
  if (builderImageSearchInput instanceof HTMLInputElement) {
    builderImageSearchInput.value = "";
  }
  updateImageSearchStatus("", "info");
  builderFieldId = 0;
  setSelectedLayout("blank-canvas");
  ensureBuilderPrompts();
  updateBuilderJsonPreview();
  syncBuilderLayout("blank-canvas");
  updateBuilderPreview();
  showBuilderStatus("", undefined);
}

function handleBuilderKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeBuilderOverlay({ reset: false, focus: true });
  }
}

function openBuilderOverlay({ layout } = {}) {
  if (!(builderOverlay instanceof HTMLElement)) {
    return;
  }
  builderLastFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (layout) {
    setSelectedLayout(layout);
  }
  ensureBuilderPrompts();
  updateBuilderJsonPreview();
  const activeLayout = getSelectedLayout();
  syncBuilderLayout(activeLayout);
  updateBuilderPreview();
  builderOverlay.hidden = false;
  requestAnimationFrame(() => {
    builderOverlay.classList.add("is-visible");
    builderOverlay.setAttribute("aria-hidden", "false");
    if (builderForm instanceof HTMLFormElement) {
      const focusable = Array.from(
        builderForm.querySelectorAll(
          'input:not([disabled]), textarea:not([disabled]), select:not([disabled])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);
      const focusTarget = focusable[0];
      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus({ preventScroll: true });
      }
    }
  });
  document.addEventListener("keydown", handleBuilderKeydown);
}

function closeBuilderOverlay({ reset = false, focus = true } = {}) {
  if (!(builderOverlay instanceof HTMLElement)) {
    return;
  }
  builderOverlay.classList.remove("is-visible");
  builderOverlay.setAttribute("aria-hidden", "true");
  document.removeEventListener("keydown", handleBuilderKeydown);
  window.setTimeout(() => {
    builderOverlay.hidden = true;
    if (reset) {
      resetBuilderForm();
    }
  }, 200);
  if (focus && builderLastFocus instanceof HTMLElement) {
    builderLastFocus.focus({ preventScroll: true });
  }
}

function handleModuleOverlayKeydown(event) {
  if (event.key === "Escape") {
    closeModuleOverlay({ focus: true });
  }
}

function openModuleOverlay({ canvas, trigger } = {}) {
  if (!(moduleOverlay instanceof HTMLElement)) {
    console.warn("Module builder overlay is unavailable.");
    return false;
  }
  if (!(canvas instanceof HTMLElement)) {
    console.warn("Module builder requires a target canvas element.");
    return false;
  }
  moduleTargetCanvas = canvas;
  moduleLastFocus =
    trigger instanceof HTMLElement
      ? trigger
      : document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  moduleOverlay.hidden = false;
  requestAnimationFrame(() => {
    moduleOverlay.classList.add("is-visible");
    moduleOverlay.setAttribute("aria-hidden", "false");
    if (moduleFrame instanceof HTMLElement) {
      moduleFrame.focus({ preventScroll: true });
    }
  });
  document.addEventListener("keydown", handleModuleOverlayKeydown);
  return true;
}

function closeModuleOverlay({ focus = true, resetTarget = true } = {}) {
  if (!(moduleOverlay instanceof HTMLElement)) {
    return;
  }
  moduleOverlay.classList.remove("is-visible");
  moduleOverlay.setAttribute("aria-hidden", "true");
  document.removeEventListener("keydown", handleModuleOverlayKeydown);
  window.setTimeout(() => {
    moduleOverlay.hidden = true;
  }, 200);
  if (resetTarget) {
    moduleTargetCanvas = null;
    moduleInsertCallback = null;
  }
  if (focus && moduleLastFocus instanceof HTMLElement) {
    moduleLastFocus.focus({ preventScroll: true });
  }
}

function handleModuleBuilderMessage(event) {
  if (!(moduleFrame instanceof HTMLIFrameElement)) {
    return;
  }
  if (event.source !== moduleFrame.contentWindow) {
    return;
  }
  const data = event.data;
  if (!data || data.source !== "noor-activity-builder" || data.type !== "activity-module") {
    return;
  }
  if (!(moduleTargetCanvas instanceof HTMLElement)) {
    closeModuleOverlay({ focus: true });
    return;
  }

  const html = typeof data.html === "string" ? data.html : "";
  const config = data.config ?? {};
  const afterInsert = typeof moduleInsertCallback === "function" ? moduleInsertCallback : null;

  const moduleElement = createModuleEmbed({
    html,
    title: config?.data?.title,
    activityType: config?.type,
    onRemove: () => {
      afterInsert?.();
    },
  });

  moduleTargetCanvas.appendChild(moduleElement);
  moduleElement.scrollIntoView({ behavior: "smooth", block: "center" });
  afterInsert?.();
  moduleInsertCallback = null;

  try {
    event.source?.postMessage({ source: "noor-deck", type: "activity-module", status: "inserted" }, "*");
  } catch (error) {
    console.warn("Unable to confirm module receipt", error);
  }

  closeModuleOverlay({ focus: true });
}

function initialiseModuleBuilderBridge() {
  if (!(moduleOverlay instanceof HTMLElement)) {
    return;
  }
  if (moduleOverlay.__deckModuleInitialised) {
    return;
  }
  moduleOverlay.__deckModuleInitialised = true;

  moduleOverlay.addEventListener("click", (event) => {
    if (event.target === moduleOverlay) {
      closeModuleOverlay({ focus: true });
    }
  });

  moduleCloseBtn?.addEventListener("click", () => {
    closeModuleOverlay({ focus: true });
  });

  window.addEventListener("message", handleModuleBuilderMessage);
}

function createActivitySlide({
  stageLabel = "Activity Workshop",
  title,
  duration,
  overview,
  steps = [],
  rubric = { criteria: [], levels: [] },
  instructionsHeading = "Facilitation steps",
  rubricHeadingText = "Success criteria",
  rubricIntro,
} = {}) {
  const resolvedTitle = trimText(title);
  if (!resolvedTitle) {
    return null;
  }

  const slide = document.createElement("div");
  slide.className = "slide-stage hidden activity-slide";
  slide.dataset.type = "activity";
  slide.dataset.activity = "rubric";

  const inner = document.createElement("div");
  inner.className = "slide-inner activity-builder-slide";
  slide.appendChild(inner);

  const header = document.createElement("header");
  header.className = "activity-slide-header";
  inner.appendChild(header);

  const pill = document.createElement("span");
  pill.className = "pill activity-pill";
  const pillIcon = document.createElement("i");
  pillIcon.className = "fa-solid fa-chalkboard-user";
  pillIcon.setAttribute("aria-hidden", "true");
  pill.appendChild(pillIcon);
  pill.appendChild(document.createTextNode(` ${stageLabel || "Activity"}`));
  header.appendChild(pill);

  const titleGroup = document.createElement("div");
  titleGroup.className = "activity-title-group";
  header.appendChild(titleGroup);

  const heading = document.createElement("h2");
  heading.textContent = resolvedTitle;
  titleGroup.appendChild(heading);

  const resolvedDuration = trimText(duration);
  if (resolvedDuration) {
    const durationBadge = document.createElement("span");
    durationBadge.className = "activity-duration";
    const durationIcon = document.createElement("i");
    durationIcon.className = "fa-solid fa-clock";
    durationIcon.setAttribute("aria-hidden", "true");
    durationBadge.appendChild(durationIcon);
    durationBadge.appendChild(document.createTextNode(` ${resolvedDuration}`));
    titleGroup.appendChild(durationBadge);
  }

  const resolvedOverview = trimText(overview);
  if (resolvedOverview) {
    const overviewEl = document.createElement("p");
    overviewEl.className = "activity-overview";
    overviewEl.textContent = resolvedOverview;
    header.appendChild(overviewEl);
  }

  const bodyGrid = document.createElement("div");
  bodyGrid.className = "activity-body-grid";
  inner.appendChild(bodyGrid);

  const instructionsSection = document.createElement("section");
  instructionsSection.className = "activity-instructions";
  bodyGrid.appendChild(instructionsSection);

  const instructionsHeadingEl = document.createElement("h3");
  const instructionsIcon = document.createElement("i");
  instructionsIcon.className = "fa-solid fa-person-chalkboard";
  instructionsIcon.setAttribute("aria-hidden", "true");
  instructionsHeadingEl.appendChild(instructionsIcon);
  const resolvedInstructionHeading = trimText(instructionsHeading) || "Facilitation steps";
  instructionsHeadingEl.appendChild(document.createTextNode(` ${resolvedInstructionHeading}`));
  instructionsSection.appendChild(instructionsHeadingEl);

  const stepItems = Array.isArray(steps) ? steps.filter(Boolean) : [];
  if (stepItems.length) {
    const stepList = document.createElement("ol");
    stepList.className = "activity-step-list";
    stepItems.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      stepList.appendChild(li);
    });
    instructionsSection.appendChild(stepList);
  } else {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "activity-empty";
    emptyMessage.textContent =
      "Add facilitation notes to guide the activity flow.";
    instructionsSection.appendChild(emptyMessage);
  }

  const rubricSection = buildRubricSection({
    heading: rubricHeadingText,
    intro: rubricIntro,
    rubric,
  });
  bodyGrid.appendChild(rubricSection);

  const rubricCriteria = Array.isArray(rubric?.criteria) ? rubric.criteria : [];

  const footer = document.createElement("div");
  footer.className = "activity-slide-footer";
  inner.appendChild(footer);

  const statusMessage = document.createElement("p");
  statusMessage.className = "activity-status-message";
  statusMessage.dataset.role = "status";
  statusMessage.setAttribute("aria-live", "polite");
  footer.appendChild(statusMessage);

  const actionsWrap = document.createElement("div");
  actionsWrap.className = "activity-actions";
  footer.appendChild(actionsWrap);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "activity-btn";
  copyBtn.dataset.action = "copy-rubric";
  const copyIcon = document.createElement("i");
  copyIcon.className = "fa-solid fa-copy";
  copyIcon.setAttribute("aria-hidden", "true");
  copyBtn.appendChild(copyIcon);
  const copyLabel = document.createElement("span");
  copyLabel.dataset.role = "label";
  copyLabel.textContent = "Copy rubric JSON";
  copyBtn.appendChild(copyLabel);
  actionsWrap.appendChild(copyBtn);

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "activity-btn secondary";
  toggleBtn.dataset.action = "toggle-rubric";
  const toggleIcon = document.createElement("i");
  toggleIcon.className = "fa-solid fa-eye-slash";
  toggleIcon.setAttribute("aria-hidden", "true");
  toggleBtn.appendChild(toggleIcon);
  const toggleLabel = document.createElement("span");
  toggleLabel.dataset.role = "label";
  toggleLabel.textContent = "Hide descriptions";
  toggleBtn.appendChild(toggleLabel);
  actionsWrap.appendChild(toggleBtn);

  try {
    slide.dataset.rubric = JSON.stringify({
      title: resolvedTitle,
      levels: rubricLevels,
      criteria: rubricCriteria.map((criterion, index) => ({
        id: `criterion-${index + 1}`,
        prompt: criterion.prompt,
        success: criterion.success,
      })),
    });
  } catch (error) {
    console.warn("Unable to serialise rubric data", error);
  }
  slide.dataset.activityTitle = resolvedTitle;
  return slide;
}

function createRubricFocusSlide({
  stageLabel = "Activity Workshop",
  title,
  activityTitle,
  duration,
  rubric = { criteria: [], levels: [] },
  rubricHeadingText = "Success criteria",
  rubricIntro,
} = {}) {
  const resolvedHeading = trimText(title) || trimText(activityTitle);
  if (!resolvedHeading) {
    return null;
  }

  const slide = document.createElement("div");
  slide.className = "slide-stage hidden activity-slide activity-slide--simple";
  slide.dataset.type = "activity";
  slide.dataset.activity = "rubric";

  const inner = document.createElement("div");
  inner.className = "slide-inner activity-builder-slide activity-builder-slide--simple";
  slide.appendChild(inner);

  const header = document.createElement("header");
  header.className = "activity-slide-header activity-slide-header--simple";
  inner.appendChild(header);

  const pill = document.createElement("span");
  pill.className = "pill activity-pill";
  const pillIcon = document.createElement("i");
  pillIcon.className = "fa-solid fa-chalkboard-user";
  pillIcon.setAttribute("aria-hidden", "true");
  pill.appendChild(pillIcon);
  pill.appendChild(document.createTextNode(` ${stageLabel || "Activity"}`));
  header.appendChild(pill);

  const headingGroup = document.createElement("div");
  headingGroup.className = "activity-title-group";
  header.appendChild(headingGroup);

  const headingEl = document.createElement("h2");
  headingEl.textContent = resolvedHeading;
  headingGroup.appendChild(headingEl);

  const resolvedDuration = trimText(duration);
  if (resolvedDuration) {
    const durationBadge = document.createElement("span");
    durationBadge.className = "activity-duration";
    const durationIcon = document.createElement("i");
    durationIcon.className = "fa-solid fa-clock";
    durationIcon.setAttribute("aria-hidden", "true");
    durationBadge.appendChild(durationIcon);
    durationBadge.appendChild(document.createTextNode(` ${resolvedDuration}`));
    headingGroup.appendChild(durationBadge);
  }

  const subheading = trimText(activityTitle);
  if (subheading && subheading !== resolvedHeading) {
    const subtitleEl = document.createElement("p");
    subtitleEl.className = "activity-overview activity-overview--subtitle";
    subtitleEl.textContent = subheading;
    header.appendChild(subtitleEl);
  }

  const body = document.createElement("div");
  body.className = "activity-body activity-body--simple";
  inner.appendChild(body);

  const rubricSection = buildRubricSection({
    heading: rubricHeadingText,
    intro: rubricIntro,
    rubric,
    className: "activity-rubric activity-rubric--simple",
  });
  body.appendChild(rubricSection);

  const footer = document.createElement("div");
  footer.className = "activity-slide-footer";
  inner.appendChild(footer);

  const statusMessage = document.createElement("p");
  statusMessage.className = "activity-status-message";
  statusMessage.dataset.role = "status";
  statusMessage.setAttribute("aria-live", "polite");
  footer.appendChild(statusMessage);

  const actionsWrap = document.createElement("div");
  actionsWrap.className = "activity-actions";
  footer.appendChild(actionsWrap);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "activity-btn";
  copyBtn.dataset.action = "copy-rubric";
  const copyIcon = document.createElement("i");
  copyIcon.className = "fa-solid fa-copy";
  copyIcon.setAttribute("aria-hidden", "true");
  copyBtn.appendChild(copyIcon);
  const copyLabel = document.createElement("span");
  copyLabel.dataset.role = "label";
  copyLabel.textContent = "Copy rubric JSON";
  copyBtn.appendChild(copyLabel);
  actionsWrap.appendChild(copyBtn);

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "activity-btn secondary";
  toggleBtn.dataset.action = "toggle-rubric";
  const toggleIcon = document.createElement("i");
  toggleIcon.className = "fa-solid fa-eye-slash";
  toggleIcon.setAttribute("aria-hidden", "true");
  toggleBtn.appendChild(toggleIcon);
  const toggleLabel = document.createElement("span");
  toggleLabel.dataset.role = "label";
  toggleLabel.textContent = "Hide descriptions";
  toggleBtn.appendChild(toggleLabel);
  actionsWrap.appendChild(toggleBtn);

  const rubricCriteria = Array.isArray(rubric?.criteria) ? rubric.criteria : [];
  try {
    slide.dataset.rubric = JSON.stringify({
      title: resolvedHeading,
      levels: Array.isArray(rubric?.levels) ? rubric.levels : [],
      criteria: rubricCriteria.map((criterion, index) => ({
        id: `criterion-${index + 1}`,
        prompt: criterion.prompt,
        success: criterion.success,
      })),
    });
  } catch (error) {
    console.warn("Unable to serialise rubric data", error);
  }

  slide.dataset.activityTitle = resolvedHeading;
  return slide;
}

function createRubricColumnSlide({
  stageLabel = "Activity Workshop",
  title,
  duration,
  slideTitle,
  rubric = { criteria: [], levels: [] },
  rubricIntro,
  columnOne = {},
  columnTwo = {},
} = {}) {
  const resolvedTitle = trimText(title) || "Collaborative discussion";
  const headingTitle = trimText(slideTitle) || "Discussion prompts";
  const firstHeading = trimText(columnOne.heading) || "Team reflections";
  const secondHeading = trimText(columnTwo.heading) || "Evidence to capture";

  const slide = document.createElement("div");
  slide.className = "slide-stage hidden activity-slide activity-slide--columns";
  slide.dataset.type = "activity";
  slide.dataset.activity = "rubric";

  const inner = document.createElement("div");
  inner.className = "slide-inner activity-builder-slide activity-builder-slide--columns";
  slide.appendChild(inner);

  const header = document.createElement("header");
  header.className = "activity-slide-header";
  inner.appendChild(header);

  const pill = document.createElement("span");
  pill.className = "pill activity-pill";
  const pillIcon = document.createElement("i");
  pillIcon.className = "fa-solid fa-chalkboard-user";
  pillIcon.setAttribute("aria-hidden", "true");
  pill.appendChild(pillIcon);
  pill.appendChild(document.createTextNode(` ${stageLabel || "Activity"}`));
  header.appendChild(pill);

  const titleGroup = document.createElement("div");
  titleGroup.className = "activity-title-group";
  header.appendChild(titleGroup);

  const heading = document.createElement("h2");
  heading.textContent = resolvedTitle;
  titleGroup.appendChild(heading);

  const resolvedDuration = trimText(duration);
  if (resolvedDuration) {
    const durationBadge = document.createElement("span");
    durationBadge.className = "activity-duration";
    const durationIcon = document.createElement("i");
    durationIcon.className = "fa-solid fa-clock";
    durationIcon.setAttribute("aria-hidden", "true");
    durationBadge.appendChild(durationIcon);
    durationBadge.appendChild(document.createTextNode(` ${resolvedDuration}`));
    titleGroup.appendChild(durationBadge);
  }

  const layout = document.createElement("div");
  layout.className = "activity-columns-layout";
  inner.appendChild(layout);

  const rubricSection = buildRubricSection({
    heading: "Success criteria",
    intro: rubricIntro,
    rubric,
    className: "activity-rubric activity-rubric--wide",
  });
  layout.appendChild(rubricSection);

  const columnsHeading = document.createElement("h3");
  columnsHeading.className = "activity-columns-heading";
  columnsHeading.textContent = headingTitle;
  layout.appendChild(columnsHeading);

  const columnsWrap = document.createElement("div");
  columnsWrap.className = "activity-columns";
  layout.appendChild(columnsWrap);

  const makeColumn = ({ headingText, items }) => {
    const column = document.createElement("article");
    column.className = "activity-column-card";
    const columnHeading = document.createElement("h4");
    columnHeading.textContent = headingText;
    column.appendChild(columnHeading);
    const listItems = Array.isArray(items) ? items.filter(Boolean) : [];
    if (listItems.length) {
      const list = document.createElement("ul");
      list.className = "activity-column-list";
      listItems.forEach((entry) => {
        const li = document.createElement("li");
        li.textContent = entry;
        list.appendChild(li);
      });
      column.appendChild(list);
    } else {
      const placeholder = document.createElement("p");
      placeholder.className = "activity-empty";
      placeholder.textContent = "Add prompts to guide the conversation.";
      column.appendChild(placeholder);
    }
    return column;
  };

  columnsWrap.appendChild(
    makeColumn({ headingText: firstHeading, items: columnOne.items }),
  );
  columnsWrap.appendChild(
    makeColumn({ headingText: secondHeading, items: columnTwo.items }),
  );

  const footer = document.createElement("div");
  footer.className = "activity-slide-footer";
  inner.appendChild(footer);

  const statusMessage = document.createElement("p");
  statusMessage.className = "activity-status-message";
  statusMessage.dataset.role = "status";
  statusMessage.setAttribute("aria-live", "polite");
  footer.appendChild(statusMessage);

  const actionsWrap = document.createElement("div");
  actionsWrap.className = "activity-actions";
  footer.appendChild(actionsWrap);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "activity-btn";
  copyBtn.dataset.action = "copy-rubric";
  const copyIcon = document.createElement("i");
  copyIcon.className = "fa-solid fa-copy";
  copyIcon.setAttribute("aria-hidden", "true");
  copyBtn.appendChild(copyIcon);
  const copyLabel = document.createElement("span");
  copyLabel.dataset.role = "label";
  copyLabel.textContent = "Copy rubric JSON";
  copyBtn.appendChild(copyLabel);
  actionsWrap.appendChild(copyBtn);

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "activity-btn secondary";
  toggleBtn.dataset.action = "toggle-rubric";
  const toggleIcon = document.createElement("i");
  toggleIcon.className = "fa-solid fa-eye-slash";
  toggleIcon.setAttribute("aria-hidden", "true");
  toggleBtn.appendChild(toggleIcon);
  const toggleLabel = document.createElement("span");
  toggleLabel.dataset.role = "label";
  toggleLabel.textContent = "Hide descriptions";
  toggleBtn.appendChild(toggleLabel);
  actionsWrap.appendChild(toggleBtn);

  const rubricLevels = Array.isArray(rubric?.levels) ? rubric.levels : [];
  const rubricCriteria = Array.isArray(rubric?.criteria) ? rubric.criteria : [];

  try {
    slide.dataset.rubric = JSON.stringify({
      title: resolvedTitle,
      levels: rubricLevels,
      criteria: rubricCriteria.map((criterion, index) => ({
        id: `criterion-${index + 1}`,
        prompt: criterion.prompt,
        success: criterion.success,
      })),
    });
  } catch (error) {
    console.warn("Unable to serialise rubric data", error);
  }

  slide.dataset.activityTitle = resolvedTitle;
  return slide;
}

function createImageSpotlightSlide({
  stageLabel = "Activity Workshop",
  title,
  duration,
  slideTitle,
  rubric = { criteria: [], levels: [] },
  rubricIntro,
  narrative = [],
  imageUrl,
  imageAlt,
} = {}) {
  const resolvedTitle = trimText(title) || "Spotlight reflection";
  const resolvedHeading = trimText(slideTitle) || "Reflection spotlight";

  const slide = document.createElement("div");
  slide.className = "slide-stage hidden activity-slide activity-slide--spotlight";
  slide.dataset.type = "activity";
  slide.dataset.activity = "rubric";

  const inner = document.createElement("div");
  inner.className = "slide-inner activity-builder-slide activity-builder-slide--spotlight";
  slide.appendChild(inner);

  const header = document.createElement("header");
  header.className = "activity-slide-header";
  inner.appendChild(header);

  const pill = document.createElement("span");
  pill.className = "pill activity-pill";
  const pillIcon = document.createElement("i");
  pillIcon.className = "fa-solid fa-chalkboard-user";
  pillIcon.setAttribute("aria-hidden", "true");
  pill.appendChild(pillIcon);
  pill.appendChild(document.createTextNode(` ${stageLabel || "Activity"}`));
  header.appendChild(pill);

  const titleGroup = document.createElement("div");
  titleGroup.className = "activity-title-group";
  header.appendChild(titleGroup);

  const heading = document.createElement("h2");
  heading.textContent = resolvedTitle;
  titleGroup.appendChild(heading);

  const resolvedDuration = trimText(duration);
  if (resolvedDuration) {
    const durationBadge = document.createElement("span");
    durationBadge.className = "activity-duration";
    const durationIcon = document.createElement("i");
    durationIcon.className = "fa-solid fa-clock";
    durationIcon.setAttribute("aria-hidden", "true");
    durationBadge.appendChild(durationIcon);
    durationBadge.appendChild(document.createTextNode(` ${resolvedDuration}`));
    titleGroup.appendChild(durationBadge);
  }

  const spotlightLayout = document.createElement("div");
  spotlightLayout.className = "activity-spotlight-layout";
  inner.appendChild(spotlightLayout);

  const contentRow = document.createElement("div");
  contentRow.className = "activity-spotlight-grid";
  spotlightLayout.appendChild(contentRow);

  const narrativeSection = document.createElement("article");
  narrativeSection.className = "activity-spotlight-content";
  contentRow.appendChild(narrativeSection);

  const narrativeHeading = document.createElement("h3");
  narrativeHeading.textContent = resolvedHeading;
  narrativeSection.appendChild(narrativeHeading);

  const paragraphs = Array.isArray(narrative) ? narrative.filter(Boolean) : [];
  if (paragraphs.length) {
    paragraphs.forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      narrativeSection.appendChild(p);
    });
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "Add context or instructions for learners.";
    narrativeSection.appendChild(placeholder);
  }

  const imageFigure = document.createElement("figure");
  imageFigure.className = "activity-spotlight-figure";
  contentRow.appendChild(imageFigure);

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = imageAlt || "Spotlight illustration";
    img.loading = "lazy";
    img.decoding = "async";
    imageFigure.appendChild(img);
    if (imageAlt) {
      const figCaption = document.createElement("figcaption");
      figCaption.textContent = imageAlt;
      imageFigure.appendChild(figCaption);
    }
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "activity-spotlight-placeholder";
    placeholder.innerHTML = `
      <i class="fa-solid fa-image" aria-hidden="true"></i>
      <p>Add a visual to anchor the discussion.</p>
    `;
    imageFigure.appendChild(placeholder);
  }

  const rubricSection = buildRubricSection({
    heading: "Success criteria",
    intro: rubricIntro,
    rubric,
    className: "activity-rubric activity-rubric--spotlight",
  });
  spotlightLayout.appendChild(rubricSection);

  const footer = document.createElement("div");
  footer.className = "activity-slide-footer";
  inner.appendChild(footer);

  const statusMessage = document.createElement("p");
  statusMessage.className = "activity-status-message";
  statusMessage.dataset.role = "status";
  statusMessage.setAttribute("aria-live", "polite");
  footer.appendChild(statusMessage);

  const actionsWrap = document.createElement("div");
  actionsWrap.className = "activity-actions";
  footer.appendChild(actionsWrap);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "activity-btn";
  copyBtn.dataset.action = "copy-rubric";
  const copyIcon = document.createElement("i");
  copyIcon.className = "fa-solid fa-copy";
  copyIcon.setAttribute("aria-hidden", "true");
  copyBtn.appendChild(copyIcon);
  const copyLabel = document.createElement("span");
  copyLabel.dataset.role = "label";
  copyLabel.textContent = "Copy rubric JSON";
  copyBtn.appendChild(copyLabel);
  actionsWrap.appendChild(copyBtn);

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "activity-btn secondary";
  toggleBtn.dataset.action = "toggle-rubric";
  const toggleIcon = document.createElement("i");
  toggleIcon.className = "fa-solid fa-eye-slash";
  toggleIcon.setAttribute("aria-hidden", "true");
  toggleBtn.appendChild(toggleIcon);
  const toggleLabel = document.createElement("span");
  toggleLabel.dataset.role = "label";
  toggleLabel.textContent = "Hide descriptions";
  toggleBtn.appendChild(toggleLabel);
  actionsWrap.appendChild(toggleBtn);

  const rubricLevels = Array.isArray(rubric?.levels) ? rubric.levels : [];
  const rubricCriteria = Array.isArray(rubric?.criteria) ? rubric.criteria : [];

  try {
    slide.dataset.rubric = JSON.stringify({
      title: resolvedTitle,
      levels: rubricLevels,
      criteria: rubricCriteria.map((criterion, index) => ({
        id: `criterion-${index + 1}`,
        prompt: criterion.prompt,
        success: criterion.success,
      })),
    });
  } catch (error) {
    console.warn("Unable to serialise rubric data", error);
  }

  slide.dataset.activityTitle = resolvedTitle;
  return slide;
}

function createRubricCardSlide({
  stageLabel = "Activity Workshop",
  title,
  duration,
  slideTitle,
  rubric = { criteria: [], levels: [] },
  rubricIntro,
  cards = [],
} = {}) {
  const resolvedTitle = trimText(title) || "Strategy studio";
  const resolvedHeading = trimText(slideTitle) || "Team strategies";

  const slide = document.createElement("div");
  slide.className = "slide-stage hidden activity-slide activity-slide--cards";
  slide.dataset.type = "activity";
  slide.dataset.activity = "rubric";

  const inner = document.createElement("div");
  inner.className = "slide-inner activity-builder-slide activity-builder-slide--cards";
  slide.appendChild(inner);

  const header = document.createElement("header");
  header.className = "activity-slide-header";
  inner.appendChild(header);

  const pill = document.createElement("span");
  pill.className = "pill activity-pill";
  const pillIcon = document.createElement("i");
  pillIcon.className = "fa-solid fa-chalkboard-user";
  pillIcon.setAttribute("aria-hidden", "true");
  pill.appendChild(pillIcon);
  pill.appendChild(document.createTextNode(` ${stageLabel || "Activity"}`));
  header.appendChild(pill);

  const titleGroup = document.createElement("div");
  titleGroup.className = "activity-title-group";
  header.appendChild(titleGroup);

  const heading = document.createElement("h2");
  heading.textContent = resolvedTitle;
  titleGroup.appendChild(heading);

  const resolvedDuration = trimText(duration);
  if (resolvedDuration) {
    const durationBadge = document.createElement("span");
    durationBadge.className = "activity-duration";
    const durationIcon = document.createElement("i");
    durationIcon.className = "fa-solid fa-clock";
    durationIcon.setAttribute("aria-hidden", "true");
    durationBadge.appendChild(durationIcon);
    durationBadge.appendChild(document.createTextNode(` ${resolvedDuration}`));
    titleGroup.appendChild(durationBadge);
  }

  const layout = document.createElement("div");
  layout.className = "activity-card-layout";
  inner.appendChild(layout);

  const rubricSection = buildRubricSection({
    heading: "Success criteria",
    intro: rubricIntro,
    rubric,
  });
  layout.appendChild(rubricSection);

  const cardsHeading = document.createElement("h3");
  cardsHeading.className = "strategy-cards-heading";
  cardsHeading.textContent = resolvedHeading;
  layout.appendChild(cardsHeading);

  const cardsWrap = document.createElement("div");
  cardsWrap.className = "strategy-cards";
  layout.appendChild(cardsWrap);

  const cardEntries = Array.isArray(cards) ? cards.filter((card) => card.heading || card.body) : [];
  if (cardEntries.length) {
    cardEntries.forEach((card, index) => {
      const cardEl = document.createElement("article");
      cardEl.className = "strategy-card";
      const badge = document.createElement("span");
      badge.className = "strategy-card-badge";
      badge.textContent = `Step ${index + 1}`;
      cardEl.appendChild(badge);
      if (card.heading) {
        const cardHeading = document.createElement("h4");
        cardHeading.textContent = card.heading;
        cardEl.appendChild(cardHeading);
      }
      if (card.body) {
        const cardBody = document.createElement("p");
        cardBody.textContent = card.body;
        cardEl.appendChild(cardBody);
      }
      cardsWrap.appendChild(cardEl);
    });
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "Add strategy cards to scaffold the task.";
    cardsWrap.appendChild(placeholder);
  }

  const footer = document.createElement("div");
  footer.className = "activity-slide-footer";
  inner.appendChild(footer);

  const statusMessage = document.createElement("p");
  statusMessage.className = "activity-status-message";
  statusMessage.dataset.role = "status";
  statusMessage.setAttribute("aria-live", "polite");
  footer.appendChild(statusMessage);

  const actionsWrap = document.createElement("div");
  actionsWrap.className = "activity-actions";
  footer.appendChild(actionsWrap);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "activity-btn";
  copyBtn.dataset.action = "copy-rubric";
  const copyIcon = document.createElement("i");
  copyIcon.className = "fa-solid fa-copy";
  copyIcon.setAttribute("aria-hidden", "true");
  copyBtn.appendChild(copyIcon);
  const copyLabel = document.createElement("span");
  copyLabel.dataset.role = "label";
  copyLabel.textContent = "Copy rubric JSON";
  copyBtn.appendChild(copyLabel);
  actionsWrap.appendChild(copyBtn);

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "activity-btn secondary";
  toggleBtn.dataset.action = "toggle-rubric";
  const toggleIcon = document.createElement("i");
  toggleIcon.className = "fa-solid fa-eye-slash";
  toggleIcon.setAttribute("aria-hidden", "true");
  toggleBtn.appendChild(toggleIcon);
  const toggleLabel = document.createElement("span");
  toggleLabel.dataset.role = "label";
  toggleLabel.textContent = "Hide descriptions";
  toggleBtn.appendChild(toggleLabel);
  actionsWrap.appendChild(toggleBtn);

  const rubricLevels = Array.isArray(rubric?.levels) ? rubric.levels : [];
  const rubricCriteria = Array.isArray(rubric?.criteria) ? rubric.criteria : [];

  try {
    slide.dataset.rubric = JSON.stringify({
      title: resolvedTitle,
      levels: rubricLevels,
      criteria: rubricCriteria.map((criterion, index) => ({
        id: `criterion-${index + 1}`,
        prompt: criterion.prompt,
        success: criterion.success,
      })),
    });
  } catch (error) {
    console.warn("Unable to serialise rubric data", error);
  }

  slide.dataset.activityTitle = resolvedTitle;
  return slide;
}

function initialiseBuilderSlide(slide) {
  if (!(slide instanceof HTMLElement)) {
    return slide;
  }
  if (slide.__deckBuilderInitialised) {
    return slide;
  }
  slide.__deckBuilderInitialised = true;

  const statusEl = slide.querySelector('[data-role="status"]');
  const copyBtn = slide.querySelector('[data-action="copy-rubric"]');
  const toggleBtn = slide.querySelector('[data-action="toggle-rubric"]');
  const rubricCriteria = slide.querySelector(".rubric-criteria");

  const showStatus = (message, tone = "info") => {
    if (!(statusEl instanceof HTMLElement)) {
      return;
    }
    statusEl.textContent = message;
    if (tone) {
      statusEl.dataset.tone = tone;
    } else {
      statusEl.removeAttribute("data-tone");
    }
    if (slide.__deckStatusTimer) {
      window.clearTimeout(slide.__deckStatusTimer);
    }
    if (message) {
      slide.__deckStatusTimer = window.setTimeout(() => {
        statusEl.textContent = "";
        statusEl.removeAttribute("data-tone");
        slide.__deckStatusTimer = undefined;
      }, BUILDER_STATUS_TIMEOUT);
    }
  };

  slide.__deckShowStatus = showStatus;

  if (copyBtn instanceof HTMLElement) {
    copyBtn.addEventListener("click", () => {
      const rubricJson = slide.dataset.rubric ?? "";
      if (!rubricJson) {
        showStatus("No rubric data found to copy.", "error");
        return;
      }
      copyTextToClipboard(rubricJson)
        .then(() => {
          showStatus("Rubric JSON copied to clipboard.", "success");
        })
        .catch((error) => {
          console.warn("Copy to clipboard failed", error);
          showStatus("We couldn't copy the rubric right now.", "error");
        });
    });
  }

  if (toggleBtn instanceof HTMLElement && rubricCriteria instanceof HTMLElement) {
    const toggleLabel = toggleBtn.querySelector('[data-role="label"]');
    const toggleIcon = toggleBtn.querySelector("i");
    toggleBtn.addEventListener("click", () => {
      const isCondensed = rubricCriteria.classList.toggle("is-condensed");
      if (toggleLabel instanceof HTMLElement) {
        toggleLabel.textContent = isCondensed
          ? "Show descriptions"
          : "Hide descriptions";
      }
      if (toggleIcon instanceof HTMLElement) {
        toggleIcon.classList.toggle("fa-eye", isCondensed);
        toggleIcon.classList.toggle("fa-eye-slash", !isCondensed);
      }
      showStatus(
        isCondensed
          ? "Rubric descriptions collapsed for quick scanning."
          : "Rubric descriptions expanded.",
        "info",
      );
    });
  }

  return slide;
}

function initialiseGeneratedActivitySlides(root = document) {
  if (!root) {
    return;
  }
  const scope = root instanceof HTMLElement ? root : document;
  const slideList = scope.querySelectorAll?.(".slide-stage.activity-slide");
  if (!slideList || !slideList.length) {
    return;
  }
  slideList.forEach((slide) => initialiseBuilderSlide(slide));
}

function insertActivitySlide(slide) {
  if (!(stageViewport instanceof HTMLElement) || !(slide instanceof HTMLElement)) {
    return;
  }
  const navButton = stageViewport.querySelector(".slide-nav");
  if (navButton instanceof HTMLElement) {
    stageViewport.insertBefore(slide, navButton);
  } else {
    stageViewport.appendChild(slide);
  }
  refreshSlides();
  const newIndex = slides.indexOf(slide);
  if (newIndex >= 0) {
    showSlide(newIndex);
  } else {
    showSlide(slides.length - 1);
  }
  slide.scrollIntoView({ behavior: "smooth", block: "center" });
}

function handleBuilderSubmit(event) {
  event.preventDefault();
  if (!(builderForm instanceof HTMLFormElement)) {
    return;
  }
  const state = getBuilderFormState();
  if (!state) {
    showBuilderStatus("We couldn't read the builder data.", "error");
    return;
  }

  if (state.layout === "blank-canvas") {
    const blankSlide = createBlankSlide();
    if (!(blankSlide instanceof HTMLElement)) {
      showBuilderStatus("We couldn't add a blank slide right now.", "error");
      return;
    }
    attachBlankSlideEvents(blankSlide);
    insertActivitySlide(blankSlide);
    showBuilderStatus("Blank canvas ready for your ideas.", "success");
    closeBuilderOverlay({ reset: true, focus: true });
    return;
  }

  const title = state.activityTitle;
  if (!title) {
    showBuilderStatus("Add a title for your activity before inserting.", "error");
    const titleInput = builderForm.querySelector('[name="activityTitle"]');
    titleInput?.focus({ preventScroll: true });
    return;
  }

  const criteria = state.criteria;
  if (!criteria.length) {
    showBuilderStatus("Add at least one rubric criterion.", "error");
    return;
  }

  const stageLabel = state.stageLabel || "Activity Workshop";
  const duration = state.duration;
  const overview = state.overview;
  const steps = state.steps;
  const levels = state.levels;

  const rubricData = {
    title,
    levels,
    criteria: criteria.map((criterion, index) => ({
      id: `criterion-${index + 1}`,
      prompt: criterion.prompt,
      success: criterion.success,
    })),
  };

  let slide = null;
  switch (state.layout) {
    case "rubric-simple": {
      const resolvedSlideTitle = state.slideTitle || state.activityTitle;
      if (!trimText(resolvedSlideTitle)) {
        showBuilderStatus("Add a slide title before inserting.", "error");
        const slideTitleInput = builderForm.querySelector('[name="slideTitle"]');
        slideTitleInput?.focus({ preventScroll: true });
        return;
      }
      slide = createRubricFocusSlide({
        stageLabel,
        title: resolvedSlideTitle,
        activityTitle: state.activityTitle,
        duration,
        rubric: rubricData,
        rubricHeadingText: "Success criteria",
        rubricIntro: state.rubricIntro,
      });
      break;
    }
    case "rubric-columns": {
      if (!trimText(state.slideTitle || "")) {
        showBuilderStatus("Name the discussion focus before inserting.", "error");
        const slideTitleInput = builderForm.querySelector('[name="slideTitle"]');
        slideTitleInput?.focus({ preventScroll: true });
        return;
      }
      slide = createRubricColumnSlide({
        stageLabel,
        title,
        duration,
        slideTitle: state.slideTitle,
        rubric: rubricData,
        rubricIntro: state.rubricIntro,
        columnOne: {
          heading: state.columnOneHeading,
          items: state.columnOneItems,
        },
        columnTwo: {
          heading: state.columnTwoHeading,
          items: state.columnTwoItems,
        },
      });
      break;
    }
    case "image-spotlight": {
      slide = createImageSpotlightSlide({
        stageLabel,
        title,
        duration,
        slideTitle: state.slideTitle,
        rubric: rubricData,
        rubricIntro: state.rubricIntro,
        narrative: state.spotlightNarrative,
        imageUrl: state.imageUrl,
        imageAlt: state.imageAlt,
      });
      break;
    }
    case "rubric-cards": {
      if (!state.cards.length) {
        showBuilderStatus("Add at least one strategy card.", "error");
        const cardInput = builderForm.querySelector('[name="cardOneHeading"]');
        cardInput?.focus({ preventScroll: true });
        return;
      }
      slide = createRubricCardSlide({
        stageLabel,
        title,
        duration,
        slideTitle: state.slideTitle,
        rubric: rubricData,
        rubricIntro: state.rubricIntro,
        cards: state.cards,
      });
      break;
    }
    default:
      slide = createActivitySlide({
        stageLabel,
        title,
        duration,
        overview,
        steps,
        rubric: rubricData,
        instructionsHeading: state.slideTitle,
        rubricHeadingText: "Success criteria",
        rubricIntro: state.rubricIntro,
      });
      break;
  }

  if (!(slide instanceof HTMLElement)) {
    showBuilderStatus("Unable to build an activity slide right now.", "error");
    return;
  }

  initialiseBuilderSlide(slide);
  insertActivitySlide(slide);
  if (typeof slide.__deckShowStatus === "function") {
    slide.__deckShowStatus("Rubric ready for your learners.", "success");
  }
  closeBuilderOverlay({ reset: true, focus: true });
}

function initialiseActivityBuilderUI() {
  if (!(builderOverlay instanceof HTMLElement)) {
    return;
  }
  if (builderOverlay.__deckBuilderInitialised) {
    initialiseGeneratedActivitySlides();
    updateBuilderJsonPreview();
    return;
  }

  builderOverlay.__deckBuilderInitialised = true;

  resetBuilderForm();

  const openForLayout = (layout) => {
    showBuilderStatus("", undefined);
    openBuilderOverlay({ layout });
  };

  addSlideBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    openForLayout("blank-canvas");
  });

  activityBuilderBtn?.addEventListener("click", () => {
    openForLayout("facilitation");
  });

  builderAddPromptBtn?.addEventListener("click", () => {
    const newItem = addPromptItem();
    const focusTarget = newItem?.querySelector("input, textarea");
    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus({ preventScroll: true });
    }
    showBuilderStatus("Added a new criterion.", "info");
    updateBuilderJsonPreview();
    updateBuilderPreview();
  });

  if (Array.isArray(builderLayoutInputs)) {
    builderLayoutInputs.forEach((input) => {
      input.addEventListener("change", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
          return;
        }
        const layoutValue = target.value || "blank-canvas";
        syncBuilderLayout(layoutValue);
        ensureBuilderPrompts();
        updateBuilderJsonPreview();
        updateBuilderPreview();
        const messages = {
          "blank-canvas": "Blank canvas selected.",
          facilitation: "Workshop facilitation layout selected.",
          "rubric-simple": "Rubric spotlight layout selected.",
          "rubric-columns": "Discussion columns layout selected.",
          "image-spotlight": "Spotlight layout selected.",
          "rubric-cards": "Strategy cards layout selected.",
        };
        showBuilderStatus(messages[layoutValue] || "Layout updated.", "info");
      });
    });
  }

  builderRefreshPreviewBtn?.addEventListener("click", () => {
    updateBuilderPreview();
    showBuilderStatus("Preview refreshed.", "success");
  });

  builderCancelBtn?.addEventListener("click", () => {
    closeBuilderOverlay({ reset: true, focus: true });
  });

  builderCloseBtn?.addEventListener("click", () => {
    closeBuilderOverlay({ reset: false, focus: true });
  });

  builderOverlay.addEventListener("click", (event) => {
    if (event.target === builderOverlay) {
      closeBuilderOverlay({ reset: false, focus: true });
    }
  });

  builderImageSearchBtn?.addEventListener("click", () => {
    handleImageSearch();
  });

  builderImageSearchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleImageSearch();
    }
  });

  builderImageResults?.addEventListener("click", (event) => {
    const button = event.target instanceof HTMLElement ? event.target.closest(".image-result") : null;
    if (button instanceof HTMLElement) {
      selectImageResult(button);
    }
  });

  if (builderForm instanceof HTMLFormElement) {
    builderForm.addEventListener("submit", handleBuilderSubmit);
    builderForm.addEventListener("input", () => {
      updateBuilderJsonPreview();
      updateBuilderPreview();
    });
    builderForm.addEventListener("change", () => {
      updateBuilderJsonPreview();
      updateBuilderPreview();
    });
  }

  initialiseGeneratedActivitySlides();
  updateBuilderJsonPreview();
  updateBuilderPreview();
}

async function initialiseDeck() {
  await hydrateRemoteImages().catch((error) => {
    console.warn(
      "Remote imagery could not be hydrated during initialisation",
      error,
    );
  });

  refreshSlides();
  if (slides.length) {
    showSlide(0);
  }
  setupNavigation();
  ensureLegacyNavigationBridge();
  updateCounter();
  initialiseActivities();
  initialiseGeneratedActivitySlides();
  document
    .querySelectorAll('.slide-stage[data-type="blank"]')
    .forEach((slide) => attachBlankSlideEvents(slide));
  saveStateBtn?.addEventListener("click", downloadDeckState);
  loadStateBtn?.addEventListener("click", () => {
    loadStateInput?.click();
  });
  loadStateInput?.addEventListener("change", handleStateFileSelection);
  highlightBtn?.addEventListener("click", () => {
    const selectedColor = highlightColorSelect?.value || "#F9E27D";
    applyHighlight(selectedColor);
  });
  removeHighlightBtn?.addEventListener("click", () => {
    removeHighlight();
  });
  recalibrateMindMapCounter();
  showDeckToast("Deck ready to explore.", {
    icon: "fa-seedling",
    timeout: 2600,
  });
}


    
export async function setupInteractiveDeck({
  root = document,
  stageViewportSelector = ".stage-viewport",
  nextButtonSelector = ".slide-nav-next",
  prevButtonSelector = ".slide-nav-prev",
  counterSelector = "#slide-counter",
  addSlideButtonSelector = "#add-slide-btn",
  saveStateButtonSelector = "#save-state-btn",
  loadStateButtonSelector = "#load-state-btn",
  loadStateInputSelector = "#load-state-input",
  highlightButtonSelector = "#highlight-btn",
  highlightColorSelectSelector = "#highlight-color",
  removeHighlightButtonSelector = "#remove-highlight-btn",
} = {}) {
  const rootElement =
    typeof root === "string" ? document.querySelector(root) : root ?? document;

  stageViewport =
    rootElement?.querySelector(stageViewportSelector) ??
    document.querySelector(stageViewportSelector);
  nextBtn =
    stageViewport?.querySelector(nextButtonSelector) ??
    rootElement?.querySelector(nextButtonSelector) ??
    document.querySelector(nextButtonSelector);
  prevBtn =
    stageViewport?.querySelector(prevButtonSelector) ??
    rootElement?.querySelector(prevButtonSelector) ??
    document.querySelector(prevButtonSelector);
  counter = rootElement?.querySelector(counterSelector) ?? document.querySelector(counterSelector);
  addSlideBtn =
    rootElement?.querySelector(addSlideButtonSelector) ??
    document.querySelector(addSlideButtonSelector);
  saveStateBtn =
    rootElement?.querySelector(saveStateButtonSelector) ??
    document.querySelector(saveStateButtonSelector);
  loadStateBtn =
    rootElement?.querySelector(loadStateButtonSelector) ??
    document.querySelector(loadStateButtonSelector);
  loadStateInput =
    rootElement?.querySelector(loadStateInputSelector) ??
    document.querySelector(loadStateInputSelector);
  highlightBtn =
    rootElement?.querySelector(highlightButtonSelector) ??
    document.querySelector(highlightButtonSelector);
  highlightColorSelect =
    rootElement?.querySelector(highlightColorSelectSelector) ??
    document.querySelector(highlightColorSelectSelector);
  removeHighlightBtn =
    rootElement?.querySelector(removeHighlightButtonSelector) ??
    document.querySelector(removeHighlightButtonSelector);
  activityBuilderBtn =
    rootElement?.querySelector("#activity-builder-btn") ??
    document.querySelector("#activity-builder-btn");
  builderOverlay =
    rootElement?.querySelector("#activity-builder-overlay") ??
    document.querySelector("#activity-builder-overlay");
  builderForm =
    builderOverlay?.querySelector("#activity-builder-form") ??
    document.querySelector("#activity-builder-form");
  builderAddPromptBtn =
    builderOverlay?.querySelector("#builder-add-prompt") ??
    document.querySelector("#builder-add-prompt");
  builderPromptList =
    builderOverlay?.querySelector("#builder-prompt-list") ??
    document.querySelector("#builder-prompt-list");
  builderJsonPreview =
    builderOverlay?.querySelector("#builder-json-preview") ??
    document.querySelector("#builder-json-preview");
  builderCancelBtn =
    builderOverlay?.querySelector('[data-action="cancel-builder"]') ??
    document.querySelector('[data-action="cancel-builder"]');
  builderCloseBtn =
    builderOverlay?.querySelector(".builder-close") ??
    document.querySelector(".builder-close");
  builderStatusEl =
    builderOverlay?.querySelector("#builder-status") ??
    document.querySelector("#builder-status");
  builderLayoutInputs = Array.from(
    builderOverlay?.querySelectorAll('input[name="slideLayout"]') ??
      document.querySelectorAll('input[name="slideLayout"]'),
  );
  builderPreview =
    builderOverlay?.querySelector("#builder-preview") ??
    document.querySelector("#builder-preview");
  builderRefreshPreviewBtn =
    builderOverlay?.querySelector("#builder-refresh-preview") ??
    document.querySelector("#builder-refresh-preview");
  builderImageResults =
    builderOverlay?.querySelector("#builder-image-results") ??
    document.querySelector("#builder-image-results");
  builderImageStatus =
    builderOverlay?.querySelector("#image-search-status") ??
    document.querySelector("#image-search-status");
  builderImageSearchBtn =
    builderOverlay?.querySelector('[data-action="search-image"]') ??
    document.querySelector('[data-action="search-image"]');
  builderImageSearchInput =
    builderOverlay?.querySelector('input[name="imageSearch"]') ??
    document.querySelector('input[name="imageSearch"]');
  builderLastFocus = null;
  builderFieldId = 0;
  moduleOverlay =
    rootElement?.querySelector("#module-builder-overlay") ??
    document.querySelector("#module-builder-overlay");
  moduleFrame =
    moduleOverlay?.querySelector("#module-builder-frame") ??
    document.querySelector("#module-builder-frame");
  moduleCloseBtn =
    moduleOverlay?.querySelector(".module-builder-close") ??
    document.querySelector(".module-builder-close");
  moduleLastFocus = null;
  moduleTargetCanvas = null;
  moduleInsertCallback = null;

  slides = [];
  currentSlideIndex = 0;
  mindMapId = 0;

  stageViewport
    ?.querySelectorAll(".slide-jump-trigger, .slide-jump-panel")
    .forEach((el) => {
      if (el instanceof HTMLElement && el.classList.contains("slide-jump-panel")) {
        const panel = el;
        const outsideListener = panel.__deckOutsideListener;
        const keyListener = panel.__deckKeyListener;
        if (outsideListener) {
          window.removeEventListener("pointerdown", outsideListener);
          delete panel.__deckOutsideListener;
        }
        if (keyListener) {
          window.removeEventListener("keydown", keyListener);
          delete panel.__deckKeyListener;
        }
      }
      el.remove();
    });
  const navigatorFactory = await resolveSlideNavigatorFactory();
  if (typeof navigatorFactory === "function") {
    try {
      slideNavigatorController =
        navigatorFactory({
          stageViewport,
          onSelectSlide: (index) => showSlide(index),
          onDuplicateSlide: (index) => duplicateSlide(index),
          onDeleteSlide: (index) => deleteSlide(index),
        }) ?? null;
    } catch (error) {
      if (!slideNavigatorLoadLogged) {
        console.warn("Slide navigator initialisation failed", error);
        slideNavigatorLoadLogged = true;
      }
      slideNavigatorController = null;
    }
  } else {
    slideNavigatorController = null;
  }

  initialiseActivityBuilderUI();
  initialiseModuleBuilderBridge();

  try {
    await initialiseDeck();
  } catch (error) {
    console.error("Deck initialisation failed", error);
  }
}

if (typeof window !== "undefined") {
  window.setupInteractiveDeck = setupInteractiveDeck;
}
