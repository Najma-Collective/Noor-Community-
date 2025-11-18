import { initSlideNavigator } from "./slideNavigator.js";

// Shared interactive module for Noor Community decks

const DECK_MODE_STORAGE_KEY = "noor.deckMode";
const DECK_MODES = ["teacher", "student", "revision"];
const READ_ONLY_MODES = new Set(["student", "revision"]);

let deckMode = "teacher";

const getModeStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage ?? null;
  } catch (error) {
    console.warn("Unable to access localStorage for deck mode", error);
    return null;
  }
};

const isValidDeckMode = (value) =>
  typeof value === "string" && DECK_MODES.includes(value);

const resolveDeckMode = (requestedMode) => {
  if (isValidDeckMode(requestedMode)) {
    return requestedMode;
  }
  const storage = getModeStorage();
  if (storage) {
    const stored = storage.getItem(DECK_MODE_STORAGE_KEY);
    if (isValidDeckMode(stored)) {
      return stored;
    }
  }
  return "teacher";
};

const persistDeckMode = (mode) => {
  const storage = getModeStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(DECK_MODE_STORAGE_KEY, mode);
  } catch (error) {
    console.warn("Unable to persist deck mode", error);
  }
};

const isReadOnlyMode = () => READ_ONLY_MODES.has(deckMode);
const isTeacherMode = () => deckMode === "teacher";

export const TEXTBOX_COLOR_OPTIONS = [
  { value: "sage", label: "Sage" },
  { value: "wheat", label: "Wheat" },
  { value: "sky", label: "Sky" },
  { value: "rose", label: "Rose" },
  { value: "slate", label: "Slate" },
];

export const DEFAULT_TEXTBOX_COLOR = TEXTBOX_COLOR_OPTIONS[0].value;

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
let builderLastFocus;
let builderFieldId = 0;

let modeSwitcherSelect;
let progressTrackerEl;
let markCompleteBtn;
let progressStorageKey = "";
let completedSlides = new Set();
let deckRootElement = null;


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

let slides = [];
let currentSlideIndex = 0;
let mindMapId = 0;

const normaliseWhitespace = (text) =>
  typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";

const normaliseResponseValue = (value) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLowerCase() : "";

const trimText = (value) => (typeof value === "string" ? value.trim() : "");

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
  updateProgressTracker();
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

const getDeckIdentifier = () => {
  if (typeof window === "undefined") {
    return "";
  }
  const { pathname = "" } = window.location ?? {};
  return pathname || "deck";
};

const getProgressStorage = () => {
  const storage = getModeStorage();
  if (!storage) {
    return null;
  }
  try {
    return storage;
  } catch (error) {
    console.warn("Unable to access storage for deck progress", error);
    return null;
  }
};

const loadCompletedSlidesFromStorage = () => {
  const storage = getProgressStorage();
  if (!storage || !progressStorageKey) {
    return new Set();
  }
  try {
    const raw = storage.getItem(progressStorageKey);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.map((value) => Number.parseInt(value, 10)).filter((value) => Number.isInteger(value)));
  } catch (error) {
    console.warn("Unable to load deck progress", error);
    return new Set();
  }
};

const persistCompletedSlides = () => {
  const storage = getProgressStorage();
  if (!storage || !progressStorageKey) {
    return;
  }
  try {
    storage.setItem(
      progressStorageKey,
      JSON.stringify(Array.from(completedSlides.values()).sort((a, b) => a - b)),
    );
  } catch (error) {
    console.warn("Unable to persist deck progress", error);
  }
};

const formatModeLabel = (mode) => {
  switch (mode) {
    case "student":
      return "Student";
    case "revision":
      return "Revision";
    case "teacher":
    default:
      return "Teacher";
  }
};

function initialiseModeSwitcher(root = document) {
  const scope = root instanceof HTMLElement ? root : document;
  const actions = scope.querySelector?.(".toolbar-actions") ?? document.querySelector(".toolbar-actions");
  if (!(actions instanceof HTMLElement)) {
    return;
  }

  let container = actions.querySelector('[data-role="deck-mode-switcher"]');
  if (!(container instanceof HTMLElement)) {
    container = document.createElement("label");
    container.dataset.role = "deck-mode-switcher";
    container.className = "mode-switcher";
    container.innerHTML = `
      <span class="mode-switcher-label">Mode</span>
    `;
    const select = document.createElement("select");
    select.className = "mode-switcher-select";
    select.setAttribute("aria-label", "Deck mode");
    DECK_MODES.forEach((mode) => {
      const option = document.createElement("option");
      option.value = mode;
      option.textContent = `${formatModeLabel(mode)} mode`;
      select.appendChild(option);
    });
    container.appendChild(select);
    actions.appendChild(container);
    modeSwitcherSelect = select;
  } else {
    const select = container.querySelector("select");
    if (select instanceof HTMLSelectElement) {
      modeSwitcherSelect = select;
    }
  }

  if (!(modeSwitcherSelect instanceof HTMLSelectElement)) {
    return;
  }

  modeSwitcherSelect.value = deckMode;
  if (modeSwitcherSelect.dataset.modeInitialised === "true") {
    return;
  }
  modeSwitcherSelect.dataset.modeInitialised = "true";
  modeSwitcherSelect.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }
    const nextMode = event.target.value;
    if (!isValidDeckMode(nextMode) || nextMode === deckMode) {
      event.target.value = deckMode;
      return;
    }
    persistDeckMode(nextMode);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  });
}

const setControlDisabledState = (control, disabled) => {
  if (!(control instanceof HTMLElement)) {
    return;
  }
  if ("disabled" in control) {
    control.disabled = disabled;
  }
  control.classList.toggle("is-disabled", disabled);
  if (disabled) {
    control.setAttribute("aria-disabled", "true");
  } else {
    control.removeAttribute("aria-disabled");
  }
};

const ensureModeStyles = () => {
  if (typeof document === "undefined") {
    return;
  }
  if (document.head?.querySelector('[data-role="deck-mode-styles"]')) {
    return;
  }
  const style = document.createElement("style");
  style.dataset.role = "deck-mode-styles";
  style.textContent = `
    .mode-switcher {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .mode-switcher-label {
      text-transform: uppercase;
      font-size: 0.75rem;
      color: var(--ink-muted, #6b7465);
    }
    .mode-switcher-select {
      border-radius: 999px;
      border: 1px solid var(--border-sage, rgba(98,112,92,0.35));
      padding: 0.35rem 0.9rem;
      background: var(--soft-white, #fdfbf5);
      font-weight: 600;
      cursor: pointer;
    }
    .read-only-tools {
      display: inline-flex;
      align-items: center;
      gap: 0.8rem;
      margin-inline-end: 1rem;
    }
    .read-only-progress {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--ink-muted, #6b7465);
    }
    .read-only-progress-bar {
      width: 92px;
      height: 6px;
      border-radius: 999px;
      background: rgba(98,112,92,0.18);
      overflow: hidden;
    }
    .read-only-progress-fill {
      height: 100%;
      width: 0;
      background: var(--primary-sage, #8aa870);
      transition: width 220ms ease-in-out;
    }
    .mark-complete-btn {
      border-radius: 999px;
      border: 1px solid var(--border-sage, rgba(98,112,92,0.35));
      background: transparent;
      color: var(--primary-sage, #8aa870);
      font-weight: 600;
    }
    .mark-complete-btn.is-active {
      background: var(--primary-sage, #8aa870);
      color: var(--soft-white, #fdfbf5);
      border-color: transparent;
    }
    .toolbar-actions .is-hidden {
      display: none !important;
    }
    .is-disabled {
      pointer-events: none !important;
      opacity: 0.55;
    }
  `;
  document.head.appendChild(style);
};

const hideElement = (element, shouldHide) => {
  if (!(element instanceof HTMLElement)) {
    return;
  }
  element.classList.toggle("is-hidden", shouldHide);
  if (shouldHide) {
    element.setAttribute("hidden", "hidden");
  } else {
    element.removeAttribute("hidden");
  }
};

function disableActivityBuilderUI() {
  setControlDisabledState(activityBuilderBtn, true);
  hideElement(activityBuilderBtn, true);
  if (builderOverlay instanceof HTMLElement) {
    builderOverlay.setAttribute("aria-hidden", "true");
    builderOverlay.classList.add("is-disabled");
  }
}

function applyToolbarStateForMode() {
  if (isTeacherMode()) {
    setControlDisabledState(addSlideBtn, false);
    setControlDisabledState(saveStateBtn, false);
    setControlDisabledState(loadStateBtn, false);
    setControlDisabledState(highlightBtn, false);
    setControlDisabledState(removeHighlightBtn, false);
    if (highlightColorSelect instanceof HTMLSelectElement) {
      highlightColorSelect.disabled = false;
    }
    hideElement(activityBuilderBtn, false);
    hideElement(addSlideBtn, false);
    hideElement(saveStateBtn, false);
    hideElement(loadStateBtn, false);
    const highlightControls = highlightBtn?.closest?.(".highlight-controls");
    hideElement(highlightControls, false);
    if (builderOverlay instanceof HTMLElement) {
      builderOverlay.removeAttribute("aria-hidden");
      builderOverlay.classList.remove("is-disabled");
    }
    return;
  }

  setControlDisabledState(addSlideBtn, true);
  setControlDisabledState(saveStateBtn, true);
  setControlDisabledState(loadStateBtn, true);
  setControlDisabledState(highlightBtn, true);
  setControlDisabledState(removeHighlightBtn, true);
  if (highlightColorSelect instanceof HTMLSelectElement) {
    highlightColorSelect.disabled = true;
  }
  hideElement(addSlideBtn, true);
  hideElement(saveStateBtn, true);
  hideElement(loadStateBtn, true);
  const highlightControls = highlightBtn?.closest?.(".highlight-controls");
  hideElement(highlightControls, true);
  disableActivityBuilderUI();
}

const getProgressAssistContainer = () => {
  const scope = deckRootElement instanceof HTMLElement ? deckRootElement : document;
  const actions = scope.querySelector?.(".toolbar-actions") ?? document.querySelector(".toolbar-actions");
  if (!(actions instanceof HTMLElement)) {
    return null;
  }
  let container = actions.querySelector('[data-role="read-only-tools"]');
  if (!(container instanceof HTMLElement)) {
    container = document.createElement("div");
    container.dataset.role = "read-only-tools";
    container.className = "read-only-tools";
    container.innerHTML = `
      <div class="read-only-progress">
        <span class="read-only-progress-label" data-role="progress-label"></span>
        <div class="read-only-progress-bar" role="presentation">
          <div class="read-only-progress-fill" data-role="progress-fill"></div>
        </div>
      </div>
    `;
    actions.prepend(container);
  }
  return container;
};

const clampCompletedSlides = () => {
  const clamped = new Set();
  completedSlides.forEach((index) => {
    if (typeof index === "number" && index >= 0 && index < slides.length) {
      clamped.add(index);
    }
  });
  completedSlides = clamped;
};

function updateProgressTracker() {
  if (!isReadOnlyMode()) {
    return;
  }
  clampCompletedSlides();
  const completedCount = completedSlides.size;
  const totalSlides = slides.length;
  const progressPercent = totalSlides ? Math.round((completedCount / totalSlides) * 100) : 0;
  if (progressTrackerEl instanceof HTMLElement) {
    const label = progressTrackerEl.querySelector('[data-role="progress-label"]');
    if (label instanceof HTMLElement) {
      label.textContent = `${completedCount} of ${totalSlides} complete`;
    }
    const fill = progressTrackerEl.querySelector('[data-role="progress-fill"]');
    if (fill instanceof HTMLElement) {
      fill.style.width = `${progressPercent}%`;
    }
  }
  if (markCompleteBtn instanceof HTMLElement) {
    const isComplete = completedSlides.has(currentSlideIndex);
    markCompleteBtn.classList.toggle("is-active", isComplete);
    markCompleteBtn.setAttribute(
      "aria-pressed",
      isComplete ? "true" : "false",
    );
    markCompleteBtn.textContent = isComplete ? "Completed" : "Mark complete";
  }
}

const toggleSlideCompletion = () => {
  if (!isReadOnlyMode() || !slides.length) {
    return;
  }
  if (completedSlides.has(currentSlideIndex)) {
    completedSlides.delete(currentSlideIndex);
  } else {
    completedSlides.add(currentSlideIndex);
  }
  persistCompletedSlides();
  updateProgressTracker();
};

function ensureMarkCompleteButton() {
  if (!isReadOnlyMode()) {
    return;
  }
  if (markCompleteBtn instanceof HTMLElement) {
    return;
  }
  const scope = deckRootElement instanceof HTMLElement ? deckRootElement : document;
  const actions = scope.querySelector?.(".toolbar-actions") ?? document.querySelector(".toolbar-actions");
  if (!(actions instanceof HTMLElement)) {
    return;
  }
  markCompleteBtn = document.createElement("button");
  markCompleteBtn.type = "button";
  markCompleteBtn.className = "toolbar-btn mark-complete-btn";
  markCompleteBtn.setAttribute("aria-pressed", "false");
  markCompleteBtn.textContent = "Mark complete";
  markCompleteBtn.addEventListener("click", () => {
    toggleSlideCompletion();
  });
  actions.prepend(markCompleteBtn);
}

function initialiseReadOnlyAssistUI() {
  if (!isReadOnlyMode()) {
    return;
  }
  const identifier = getDeckIdentifier();
  progressStorageKey = `${identifier}::progress::${deckMode}`;
  completedSlides = loadCompletedSlidesFromStorage();
  const container = getProgressAssistContainer();
  if (container instanceof HTMLElement) {
    progressTrackerEl = container.querySelector(".read-only-progress");
  }
  ensureMarkCompleteButton();
  updateProgressTracker();
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
    <button class="activity-btn secondary" type="button" data-action="add-mindmap">
      <i class="fa-solid fa-diagram-project"></i>
      Add Mind Map
    </button>
  </div>
  <div class="blank-canvas" role="region" aria-label="Blank slide workspace"></div>
</div>
    </div>
  `;
  return slide;
}

export function attachBlankSlideEvents(slide) {
  const canvas = slide.querySelector(".blank-canvas");
  const addTextboxBtn = slide.querySelector('[data-action="add-textbox"]');
  const addMindmapBtn = slide.querySelector('[data-action="add-mindmap"]');
  const readOnly = isReadOnlyMode();

  slide
    .querySelectorAll('[data-role="hint"], .blank-hint')
    .forEach((existingHint) => {
      if (existingHint instanceof HTMLElement) {
        existingHint.remove();
      }
    });

  if (!(canvas instanceof HTMLElement)) {
    return;
  }

  if (!canvas.hasAttribute("tabindex")) {
    canvas.setAttribute("tabindex", "0");
  }

  function updateHintForCanvas() {
    slide
      .querySelectorAll('[data-role="hint"], .blank-hint')
      .forEach((existingHint) => {
        if (existingHint instanceof HTMLElement) {
          existingHint.remove();
        }
      });
  }

  if (readOnly) {
    if (addTextboxBtn instanceof HTMLButtonElement) {
      setControlDisabledState(addTextboxBtn, true);
      addTextboxBtn.classList.add("is-hidden");
    }
    if (addMindmapBtn instanceof HTMLButtonElement) {
      setControlDisabledState(addMindmapBtn, true);
      addMindmapBtn.classList.add("is-hidden");
    }
  } else {
    addTextboxBtn?.addEventListener("click", () => {
      const textbox = createTextbox({ onRemove: updateHintForCanvas });
      canvas.appendChild(textbox);
      positionTextbox(textbox, canvas);
      updateHintForCanvas();
    });

    addMindmapBtn?.addEventListener("click", () => {
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
    });
  }

  canvas
    .querySelectorAll(".textbox")
    .forEach((textbox) =>
      initialiseTextbox(textbox, { onRemove: updateHintForCanvas }),
    );

  canvas
    .querySelectorAll(".mindmap")
    .forEach((mindmap) =>
      initialiseMindMap(mindmap, { onRemove: updateHintForCanvas }),
    );

  canvas
    .querySelectorAll(".pasted-image")
    .forEach((image) => initialisePastedImage(image, { onRemove: updateHintForCanvas }));

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

  if (!readOnly) {
    canvas.addEventListener("paste", (event) => {
      handleCanvasPaste(event).catch((error) => {
        console.warn("Image paste failed", error);
      });
    });
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (event.target === canvas) {
      canvas.focus({ preventScroll: true });
    }
  });

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
  const body = textbox.querySelector(".textbox-body");
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

  syncTextboxColourState();
  textbox.__deckTextboxSyncColor = () => syncTextboxColourState();

  if (isReadOnlyMode()) {
    textbox.classList.add("is-readonly");
    if (removeBtn instanceof HTMLButtonElement) {
      setControlDisabledState(removeBtn, true);
      removeBtn.classList.add("is-hidden");
    }
    if (body instanceof HTMLElement) {
      body.setAttribute("contenteditable", "false");
      body.setAttribute("tabindex", "0");
      body.classList.add("is-readonly");
    }
    colorButtons.forEach((button) => {
      setControlDisabledState(button, true);
    });
    return textbox;
  }

  colorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.dataset.color) return;
      syncTextboxColourState(button.dataset.color);
    });
    button.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
  });

  removeBtn?.addEventListener("click", () => {
    textbox.remove();
    if (typeof textbox.__deckTextboxOnRemove === "function") {
      textbox.__deckTextboxOnRemove();
    }
  });

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

  makeDraggable(textbox);
  return textbox;
}

function makeResizable(element, { handleSelector = ".resize-handle", minWidth = 96, minHeight = 96 } = {}) {
  if (!(element instanceof HTMLElement)) {
    return;
  }
  if (element.__deckResizableInitialised) {
    return;
  }
  if (isReadOnlyMode()) {
    element.classList.add("is-readonly");
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

export function makeDraggable(element) {
  if (!(element instanceof HTMLElement)) return;
  if (element.__deckDraggableInitialised) {
    return;
  }
  if (isReadOnlyMode()) {
    element.classList.add("is-readonly");
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
  const removeBtn = container.querySelector(".mindmap-remove");
  const readOnly = isReadOnlyMode();

  container.__deckMindmapOnRemove = onRemove;
  if (!container.__deckMindmapInitialised) {
    container.__deckMindmapInitialised = true;
    if (!readOnly) {
      removeBtn?.addEventListener("click", () => {
        container.remove();
        if (typeof container.__deckMindmapOnRemove === "function") {
          container.__deckMindmapOnRemove();
        }
      });
    }
  }

  if (readOnly) {
    container.classList.add("is-readonly");
    if (removeBtn instanceof HTMLButtonElement) {
      setControlDisabledState(removeBtn, true);
      removeBtn.classList.add("is-hidden");
    }
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

  if (form) {
    if (readOnly) {
      form.classList.add("is-disabled");
      form.setAttribute("aria-disabled", "true");
      const submitBtn = form.querySelector('button[type="submit"]');
      setControlDisabledState(submitBtn, true);
      if (input instanceof HTMLInputElement) {
        input.disabled = true;
      }
    } else if (!form.__deckSubmitInitialised) {
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
  }

  if (center instanceof HTMLElement) {
    if (readOnly) {
      center.setAttribute("contenteditable", "false");
      center.setAttribute("tabindex", "0");
    } else if (!center.__deckMindmapCenterInitialised) {
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
  }

  if (sortBtn) {
    if (readOnly) {
      setControlDisabledState(sortBtn, true);
    } else if (!sortBtn.__deckMindmapSortInitialised) {
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
  const readOnly = isReadOnlyMode();

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

  if (readOnly) {
    branch.classList.add("is-readonly");
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.setAttribute("readonly", "true");
      textarea.setAttribute("tabindex", "0");
    }
    if (labelInput instanceof HTMLInputElement) {
      labelInput.setAttribute("readonly", "true");
      labelInput.setAttribute("tabindex", "0");
    }
    if (removeBtn instanceof HTMLButtonElement) {
      setControlDisabledState(removeBtn, true);
      removeBtn.classList.add("is-hidden");
    }
    colorButtons.forEach((button) => {
      setControlDisabledState(button, true);
    });
    return branch;
  }

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
  if (isReadOnlyMode()) {
    if (typeof window !== "undefined") {
      window.alert("Saving is disabled while viewing in read-only mode.");
    }
    return;
  }
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
  } catch (error) {
    console.error("Failed to save deck state", error);
    window.alert(
      "Sorry, we couldn't save the deck right now. Please try again.",
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

  slideNavigatorController =
    initSlideNavigator({
      stageViewport,
      onSelectSlide: (index) => showSlide(index),
    }) ?? null;

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
      window.alert(
        "The selected file couldn't be loaded. Please choose a valid deck state JSON file.",
      );
    } finally {
      input.value = "";
    }
  });

  reader.addEventListener("error", () => {
    console.error("Failed to read deck state file", reader.error);
    window.alert(
      "We couldn't read that file. Please try again with a different JSON file.",
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
    window.alert("Select some text in a slide before applying a highlight.");
    return;
  }

  const range = selection.getRangeAt(0);
  const startSlide = findSlideForNode(range.startContainer);
  const endSlide = findSlideForNode(range.endContainer);

  if (!startSlide || !endSlide || startSlide !== endSlide) {
    window.alert("Highlights must stay within a single slide.");
    return;
  }

  if (!stageViewport?.contains(startSlide)) {
    window.alert("Please highlight text within the slide area.");
    return;
  }

  try {
    const contents = range.extractContents();
    const textSample = contents.textContent?.trim();
    if (!textSample) {
      window.alert("Select some text to highlight first.");
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
    window.alert(
      "Sorry, that selection couldn't be highlighted. Try selecting a smaller section of text.",
    );
  }
}

function removeHighlight() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    window.alert("Place your cursor inside a highlight to clear it.");
    return;
  }

  let container = selection.anchorNode;
  if (container instanceof Text) {
    container = container.parentElement;
  }

  const highlight =
    container instanceof HTMLElement ? container.closest(".text-highlight") : null;

  if (!highlight || !stageViewport?.contains(highlight)) {
    window.alert("Place your cursor inside a highlight to clear it.");
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

function setupSingleSelectQuiz(root = document) {
  const quizGroups = Array.from(
    root?.querySelectorAll?.(".quiz-options[data-quiz-id]") ?? [],
  );

  quizGroups.forEach((group) => {
    const options = Array.from(group.querySelectorAll(".quiz-option"));
    if (!options.length) {
      return;
    }

    const quizContainer = group.closest(".quiz-container");
    const feedback = quizContainer?.querySelector(".quiz-feedback");

    const setFeedbackVisible = (isVisible) => {
      if (!feedback) {
        return;
      }
      feedback.classList.toggle("visible", Boolean(isVisible));
      if (isVisible) {
        feedback.removeAttribute("aria-hidden");
      } else {
        feedback.setAttribute("aria-hidden", "true");
      }
    };

    const handleSelect = (option) => {
      options.forEach((opt) => {
        opt.classList.remove("correct", "incorrect");
        opt.setAttribute("aria-pressed", "false");
      });

      const isCorrect = option.dataset.correct === "true";
      option.classList.add(isCorrect ? "correct" : "incorrect");
      option.setAttribute("aria-pressed", "true");

      setFeedbackVisible(isCorrect);
    };

    setFeedbackVisible(false);

    options.forEach((option) => {
      if (option.dataset.quizBound === "true") {
        return;
      }
      option.dataset.quizBound = "true";
      option.setAttribute("role", "button");
      if (!option.hasAttribute("tabindex")) {
        option.setAttribute("tabindex", "0");
      }
      option.setAttribute("aria-pressed", "false");

      option.addEventListener("click", () => handleSelect(option));
      option.addEventListener("keydown", (event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          handleSelect(option);
        }
      });
    });
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

function initialiseActivities() {
  document
    .querySelectorAll('[data-activity="unscramble"]')
    .forEach((el) => setupUnscramble(el));
  document
    .querySelectorAll('[data-activity="gap-fill"]')
    .forEach((el) => setupGapFill(el));
  document
    .querySelectorAll('[data-activity="table-completion"]')
    .forEach((el) => setupClickPlacement(el));
  document
    .querySelectorAll('[data-activity="token-drop"]')
    .forEach((el) => setupClickPlacement(el));
  document
    .querySelectorAll('[data-activity="matching"]')
    .forEach((el) => setupMatching(el));
  document
    .querySelectorAll('[data-activity="matching-connect"]')
    .forEach((el) => setupMatchingConnect(el));
  document
    .querySelectorAll('[data-activity="mc-grammar"]')
    .forEach((el) => setupMcGrammar(el));
  document
    .querySelectorAll('[data-activity="mc-grammar-radio"]')
    .forEach((el) => setupMcGrammarRadio(el));
  document
    .querySelectorAll('[data-activity="categorization"]')
    .forEach((el) => setupCategorization(el));
  document
    .querySelectorAll('[data-activity="stress-mark"]')
    .forEach((el) => setupStressMark(el));
  setupSingleSelectQuiz();
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

function updateBuilderJsonPreview() {
  if (!(builderJsonPreview instanceof HTMLElement)) {
    return;
  }
  const formData = builderForm instanceof HTMLFormElement
    ? new FormData(builderForm)
    : null;
  const title = trimText(formData?.get("activityTitle"));
  const levels = parseRubricLevels(formData?.get("rubricLevels"));
  const criteria = collectRubricCriteria();
  const previewData = {
    title,
    levels,
    criteria: criteria.map((criterion, index) => ({
      id: `criterion-${index + 1}`,
      prompt: criterion.prompt,
      success: criterion.success,
    })),
  };
  builderJsonPreview.textContent = JSON.stringify(previewData, null, 2);
}

function ensureBuilderPrompts() {
  if (!(builderPromptList instanceof HTMLElement)) {
    return;
  }
  if (!builderPromptList.querySelector(".builder-prompt-item")) {
    DEFAULT_BUILDER_PROMPTS.forEach((entry) => addPromptItem(entry));
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
  };

  promptInput.addEventListener("input", handleFieldInput);
  successArea.addEventListener("input", handleFieldInput);

  removeBtn.addEventListener("click", () => {
    item.remove();
    if (!builderPromptList.querySelector(".builder-prompt-item")) {
      addPromptItem();
    }
    updateBuilderJsonPreview();
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
  builderFieldId = 0;
  ensureBuilderPrompts();
  updateBuilderJsonPreview();
  showBuilderStatus("", undefined);
}

function handleBuilderKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeBuilderOverlay({ reset: false, focus: true });
  }
}

function openBuilderOverlay() {
  if (!(builderOverlay instanceof HTMLElement)) {
    return;
  }
  builderLastFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  ensureBuilderPrompts();
  updateBuilderJsonPreview();
  builderOverlay.hidden = false;
  requestAnimationFrame(() => {
    builderOverlay.classList.add("is-visible");
    builderOverlay.setAttribute("aria-hidden", "false");
    const focusTarget = builderForm?.querySelector("input, textarea, select");
    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus({ preventScroll: true });
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

function createActivitySlide({
  stageLabel = "Activity Workshop",
  title,
  duration,
  overview,
  steps = [],
  rubric = { criteria: [], levels: [] },
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

  const instructionsHeading = document.createElement("h3");
  const instructionsIcon = document.createElement("i");
  instructionsIcon.className = "fa-solid fa-person-chalkboard";
  instructionsIcon.setAttribute("aria-hidden", "true");
  instructionsHeading.appendChild(instructionsIcon);
  instructionsHeading.appendChild(document.createTextNode(" Facilitation steps"));
  instructionsSection.appendChild(instructionsHeading);

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

  const rubricSection = document.createElement("section");
  rubricSection.className = "activity-rubric";
  rubricSection.dataset.role = "rubric";
  bodyGrid.appendChild(rubricSection);

  const rubricHeading = document.createElement("h3");
  const rubricIcon = document.createElement("i");
  rubricIcon.className = "fa-solid fa-list-check";
  rubricIcon.setAttribute("aria-hidden", "true");
  rubricHeading.appendChild(rubricIcon);
  rubricHeading.appendChild(document.createTextNode(" Success criteria"));
  rubricSection.appendChild(rubricHeading);

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
    rubricSection.appendChild(levelsWrap);
  }

  const criteriaList = document.createElement("div");
  criteriaList.className = "rubric-criteria";
  rubricSection.appendChild(criteriaList);

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
  const formData = new FormData(builderForm);
  const title = trimText(formData.get("activityTitle"));
  if (!title) {
    showBuilderStatus("Add a title for your activity before inserting.", "error");
    const titleInput = builderForm.querySelector('[name="activityTitle"]');
    titleInput?.focus({ preventScroll: true });
    return;
  }

  const criteria = collectRubricCriteria();
  if (!criteria.length) {
    showBuilderStatus("Add at least one rubric criterion.", "error");
    return;
  }

  const stageLabel = trimText(formData.get("stageLabel")) || "Activity Workshop";
  const duration = trimText(formData.get("activityDuration"));
  const overview = trimText(formData.get("activityOverview"));
  const steps = splitMultiline(formData.get("activitySteps"));
  const levels = parseRubricLevels(formData.get("rubricLevels"));

  const rubricData = {
    title,
    levels,
    criteria: criteria.map((criterion, index) => ({
      id: `criterion-${index + 1}`,
      prompt: criterion.prompt,
      success: criterion.success,
    })),
  };

  const slide = createActivitySlide({
    stageLabel,
    title,
    duration,
    overview,
    steps,
    rubric: rubricData,
  });

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
  if (!(activityBuilderBtn instanceof HTMLElement)) {
    return;
  }
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

  activityBuilderBtn.addEventListener("click", () => {
    showBuilderStatus("", undefined);
    openBuilderOverlay();
  });

  builderAddPromptBtn?.addEventListener("click", () => {
    const newItem = addPromptItem();
    const focusTarget = newItem?.querySelector("input, textarea");
    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus({ preventScroll: true });
    }
    showBuilderStatus("Added a new criterion.", "info");
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

  if (builderForm instanceof HTMLFormElement) {
    builderForm.addEventListener("submit", handleBuilderSubmit);
    builderForm.addEventListener("input", () => {
      updateBuilderJsonPreview();
    });
    builderForm.addEventListener("change", () => {
      updateBuilderJsonPreview();
    });
  }

  initialiseGeneratedActivitySlides();
  updateBuilderJsonPreview();
}

async function initialiseDeck() {
  await hydrateRemoteImages().catch((error) => {
    console.warn(
      "Remote imagery could not be hydrated during initialisation",
      error,
    );
  });

  refreshSlides();
  if (isReadOnlyMode()) {
    initialiseReadOnlyAssistUI();
  } else {
    progressStorageKey = "";
    completedSlides = new Set();
    if (markCompleteBtn instanceof HTMLElement) {
      markCompleteBtn.remove();
    }
    const assist = deckRootElement?.querySelector?.('[data-role="read-only-tools"]');
    if (assist instanceof HTMLElement) {
      assist.remove();
    }
    progressTrackerEl = null;
    markCompleteBtn = undefined;
  }
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

  if (isTeacherMode()) {
    addSlideBtn?.addEventListener("click", addBlankSlide);
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
  }
  recalibrateMindMapCounter();
}


function changeRound(targetId, direction = 1) {
  if (typeof document === "undefined") {
    return;
  }

  let container = null;
  if (targetId instanceof HTMLElement) {
    container = targetId;
  } else if (typeof targetId === "string" && targetId) {
    container = document.getElementById(targetId);
    if (!container && typeof CSS !== "undefined" && CSS.escape) {
      container = document.querySelector(`#${CSS.escape(targetId)}`);
    }
  }

  if (!container) {
    return;
  }

  const rounds = Array.from(container.querySelectorAll(".round"));
  if (!rounds.length) {
    return;
  }

  const currentIndex = rounds.findIndex((round) =>
    round.classList.contains("active"),
  );
  const step = Number.isFinite(Number(direction)) ? Number(direction) : 1;
  const nextIndex =
    currentIndex === -1
      ? 0
      : (currentIndex + step + rounds.length) % rounds.length;

  rounds.forEach((round, index) => {
    round.classList.toggle("active", index === nextIndex);
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
  mode,
} = {}) {
  const rootElement =
    typeof root === "string" ? document.querySelector(root) : root ?? document;

  deckRootElement = rootElement instanceof HTMLElement ? rootElement : document;
  deckMode = resolveDeckMode(mode);
  persistDeckMode(deckMode);
  ensureModeStyles();

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
  builderLastFocus = null;
  builderFieldId = 0;

  slides = [];
  currentSlideIndex = 0;
  mindMapId = 0;

  initialiseModeSwitcher(deckRootElement);
  applyToolbarStateForMode();

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
  slideNavigatorController =
    initSlideNavigator({
      stageViewport,
      onSelectSlide: (index) => showSlide(index),
    }) ?? null;

  if (isTeacherMode()) {
    initialiseActivityBuilderUI();
  }

  try {
    await initialiseDeck();
  } catch (error) {
    console.error("Deck initialisation failed", error);
  }
}

if (typeof window !== "undefined") {
  window.setupInteractiveDeck = setupInteractiveDeck;
  window.changeRound = changeRound;
}
