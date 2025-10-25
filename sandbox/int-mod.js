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
let builderDialogueList;
let builderAddDialogueBtn;
let builderPracticeList;
let builderAddPracticeBtn;
let moduleOverlay;
let moduleFrame;
let moduleCloseBtn;
let moduleLastFocus;
let moduleTargetCanvas;
let moduleInsertCallback;
let moduleEditTarget;
let modulePendingConfig;
let moduleBuilderReady = false;
let moduleBuilderUrl;
let moduleBuilderUrlPromise;
let deckToastRoot;
let deckStatusEl;
let stageUtilityCluster;
let blankToolbarHost;
let canvasInsertOverlay;

const EDITABLE_INLINE_TAGS = new Set([
  "A",
  "ABBR",
  "B",
  "BDO",
  "BDI",
  "BR",
  "CITE",
  "CODE",
  "DATA",
  "DFN",
  "EM",
  "I",
  "KBD",
  "MARK",
  "Q",
  "S",
  "SAMP",
  "SMALL",
  "SPAN",
  "STRONG",
  "SUB",
  "SUP",
  "TIME",
  "U",
  "VAR",
  "WBR",
  "SVG",
  "USE",
  "PATH",
]);

const EDITABLE_EXCLUDED_TAGS = new Set([
  "BUTTON",
  "INPUT",
  "SELECT",
  "OPTION",
  "TEXTAREA",
  "SCRIPT",
  "STYLE",
  "IMG",
  "VIDEO",
  "AUDIO",
  "CANVAS",
  "IFRAME",
  "OBJECT",
  "EMBED",
]);

const editableElements = new Set();
const editableMutationObservers = new WeakMap();
const editableListenerMap = new WeakMap();
let editableResizeObserver = null;
let editableResizeHandlerAttached = false;

function getEditableResizeObserverCtor() {
  if (typeof window !== "undefined" && typeof window.ResizeObserver === "function") {
    return window.ResizeObserver;
  }
  return null;
}

function isEditableInlineElement(element) {
  return element instanceof HTMLElement && EDITABLE_INLINE_TAGS.has(element.tagName);
}

function hasOnlyEditableInlineChildren(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  return Array.from(element.children).every((child) =>
    isEditableInlineElement(child) ||
    child.matches?.("[data-editable-ignore], [contenteditable='false']"),
  );
}

function shouldMakeElementEditable(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  if (!element.closest(".slide-stage")) {
    return false;
  }
  if (element.closest("[data-editable-ignore]")) {
    return false;
  }
  if (element.dataset.editableProcessed === "true") {
    return false;
  }
  if (EDITABLE_EXCLUDED_TAGS.has(element.tagName)) {
    return false;
  }
  if (
    element.matches(
      "button, [role='button'], select, option, textarea, input, a[href]",
    )
  ) {
    return false;
  }
  if (element.closest("button, [role='button'], select, option, textarea, input")) {
    return false;
  }
  if (!element.textContent || !element.textContent.trim()) {
    return false;
  }
  if (element.classList.contains("sr-only")) {
    return false;
  }
  if (element.childElementCount > 0 && !hasOnlyEditableInlineChildren(element)) {
    return false;
  }
  return true;
}

function storeEditableMetrics(element, force = false) {
  if (!(element instanceof HTMLElement)) {
    return;
  }
  const style = window.getComputedStyle(element);
  const baseFont = parseFloat(style.fontSize) || 16;
  if (force || !element.dataset.baseFontSize) {
    element.dataset.baseFontSize = baseFont;
    element.dataset.minFontSize = Math.max(8, Math.round(baseFont * 0.5));
  }

  const rect = element.getBoundingClientRect();
  if (
    (force || !element.dataset.maxWidth || !element.dataset.maxHeight) &&
    rect.width > 0 &&
    rect.height > 0
  ) {
    element.dataset.maxWidth = rect.width;
    element.dataset.maxHeight = rect.height;
  }
}

function autoFitEditableElement(element) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  storeEditableMetrics(element);

  const base =
    parseFloat(element.dataset.baseFontSize) ||
    parseFloat(window.getComputedStyle(element).fontSize) ||
    16;
  const min = parseFloat(element.dataset.minFontSize) || Math.max(8, Math.round(base * 0.5));
  let width = parseFloat(element.dataset.maxWidth) || 0;
  let height = parseFloat(element.dataset.maxHeight) || 0;

  if ((!width || !height) && element.offsetParent) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      width = rect.width;
      height = rect.height;
      element.dataset.maxWidth = width;
      element.dataset.maxHeight = height;
    }
  }

  element.style.fontSize = `${base}px`;
  element.style.overflow = "hidden";

  if (!width || !height || width < 4 || height < 4) {
    return;
  }

  const tolerance = 1;
  let fontSize = base;
  let iterations = 0;
  let overflow =
    element.scrollHeight > height + tolerance || element.scrollWidth > width + tolerance;

  while (overflow && fontSize > min && iterations < 200) {
    fontSize -= 0.5;
    element.style.fontSize = `${fontSize}px`;
    iterations += 1;
    overflow =
      element.scrollHeight > height + tolerance || element.scrollWidth > width + tolerance;
  }

  if (overflow) {
    element.dataset.overflow = "true";
    element.title = "Text truncated to preserve layout.";
  } else {
    delete element.dataset.overflow;
    if (element.title === "Text truncated to preserve layout.") {
      element.removeAttribute("title");
    }
  }
}

function cleanupEditableElement(element) {
  if (!(element instanceof HTMLElement)) {
    return;
  }
  const observer = editableMutationObservers.get(element);
  if (observer) {
    try {
      observer.disconnect();
    } catch (error) {
      console.warn("Failed to disconnect editable text observer", error);
    }
    editableMutationObservers.delete(element);
  }

  const listeners = editableListenerMap.get(element);
  if (listeners) {
    element.removeEventListener("focus", listeners.focus);
    element.removeEventListener("input", listeners.input);
    element.removeEventListener("blur", listeners.blur);
    editableListenerMap.delete(element);
  }

  const ResizeObserverCtor = getEditableResizeObserverCtor();
  if (
    editableResizeObserver &&
    ResizeObserverCtor &&
    editableResizeObserver instanceof ResizeObserverCtor
  ) {
    try {
      editableResizeObserver.unobserve(element);
    } catch (error) {
      console.warn("Failed to unobserve editable text element", error);
    }
  }

  editableElements.delete(element);
}

function refreshEditableMetrics(scope = document) {
  const targets = new Set();
  if (scope instanceof HTMLElement) {
    if (scope.classList.contains("editable-text")) {
      targets.add(scope);
    }
    scope.querySelectorAll?.(".editable-text").forEach((element) => targets.add(element));
  } else if (scope instanceof DocumentFragment) {
    scope.querySelectorAll?.(".editable-text").forEach((element) => targets.add(element));
  } else if (scope instanceof Document) {
    scope.querySelectorAll(".editable-text").forEach((element) => targets.add(element));
  }

  targets.forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    if (!document.contains(element)) {
      cleanupEditableElement(element);
      return;
    }
    storeEditableMetrics(element, true);
    autoFitEditableElement(element);
  });
}

function handleEditableWindowResize() {
  refreshEditableMetrics(document);
}

function registerEditableElement(element) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  if (editableElements.has(element)) {
    storeEditableMetrics(element, true);
    autoFitEditableElement(element);
    return;
  }

  element.dataset.editableProcessed = "true";
  element.classList.add("editable-text");
  element.setAttribute("contenteditable", "true");
  element.setAttribute("spellcheck", "false");
  if (!element.hasAttribute("tabindex")) {
    element.setAttribute("tabindex", "0");
  }
  element.style.overflow = "hidden";

  const handleFocus = () => {
    storeEditableMetrics(element, true);
    autoFitEditableElement(element);
  };
  const handleInput = () => {
    autoFitEditableElement(element);
  };
  const handleBlur = () => {
    autoFitEditableElement(element);
  };

  element.addEventListener("focus", handleFocus);
  element.addEventListener("input", handleInput);
  element.addEventListener("blur", handleBlur);
  editableListenerMap.set(element, {
    focus: handleFocus,
    input: handleInput,
    blur: handleBlur,
  });

  const observer = new MutationObserver(() => {
    autoFitEditableElement(element);
  });
  observer.observe(element, {
    characterData: true,
    childList: true,
    subtree: true,
  });
  editableMutationObservers.set(element, observer);

  const ResizeObserverCtor = getEditableResizeObserverCtor();
  if (
    ResizeObserverCtor &&
    !(editableResizeObserver instanceof ResizeObserverCtor)
  ) {
    editableResizeObserver = new ResizeObserverCtor((entries) => {
      entries.forEach((entry) => {
        const target = entry.target;
        if (!editableElements.has(target)) {
          return;
        }
        storeEditableMetrics(target, true);
        autoFitEditableElement(target);
      });
    });
  }

  if (
    editableResizeObserver &&
    ResizeObserverCtor &&
    editableResizeObserver instanceof ResizeObserverCtor
  ) {
    editableResizeObserver.observe(element);
  } else if (
    !editableResizeHandlerAttached &&
    typeof window !== "undefined" &&
    typeof window.addEventListener === "function"
  ) {
    window.addEventListener("resize", handleEditableWindowResize);
    editableResizeHandlerAttached = true;
  }

  editableElements.add(element);
  storeEditableMetrics(element, true);
  autoFitEditableElement(element);
}

function prepareEditableIcons(scope = document) {
  const selector = ".slide-stage i, .slide-stage .fa";
  let icons = [];
  if (scope instanceof HTMLElement || scope instanceof DocumentFragment) {
    icons = Array.from(scope.querySelectorAll?.(selector) ?? []);
    if (scope instanceof HTMLElement && scope.matches(selector)) {
      icons.unshift(scope);
    }
  } else if (scope instanceof Document) {
    icons = Array.from(scope.querySelectorAll(selector));
  }

  icons.forEach((icon) => {
    if (!(icon instanceof HTMLElement)) {
      return;
    }
    icon.setAttribute("contenteditable", "false");
    icon.setAttribute("data-editable-ignore", "true");
  });
}

function cleanupDetachedEditableElements() {
  editableElements.forEach((element) => {
    if (!(element instanceof HTMLElement) || !document.contains(element)) {
      cleanupEditableElement(element);
    }
  });
}

function initialiseEditableText(scope = stageViewport ?? document) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const searchRoots = new Set();
  if (scope instanceof HTMLElement || scope instanceof DocumentFragment) {
    searchRoots.add(scope);
  } else if (scope instanceof Document) {
    searchRoots.add(scope);
  } else if (stageViewport instanceof HTMLElement) {
    searchRoots.add(stageViewport);
  } else {
    searchRoots.add(document);
  }

  searchRoots.forEach((rootNode) => {
    prepareEditableIcons(rootNode instanceof Document ? stageViewport ?? document : rootNode);

    const candidates = new Set();
    if (rootNode instanceof HTMLElement && rootNode.classList.contains("slide-stage")) {
      rootNode.querySelectorAll("*").forEach((element) => candidates.add(element));
      candidates.add(rootNode);
    } else if (rootNode instanceof HTMLElement || rootNode instanceof DocumentFragment) {
      rootNode.querySelectorAll?.(".slide-stage *").forEach((element) => candidates.add(element));
    } else if (rootNode instanceof Document) {
      rootNode.querySelectorAll(".slide-stage *").forEach((element) => candidates.add(element));
    }

    candidates.forEach((element) => {
      if (shouldMakeElementEditable(element)) {
        registerEditableElement(element);
      }
    });
  });

  cleanupDetachedEditableElements();

  const refreshTarget =
    scope instanceof HTMLElement || scope instanceof DocumentFragment ? scope : document;

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      refreshEditableMetrics(refreshTarget);
    });
  } else {
    refreshEditableMetrics(refreshTarget);
  }
}


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
  matching: 'Matching',
  'error-correction': 'Error correction',
};

const DECK_TOAST_TIMEOUT = 3600;

const MODULE_CONFIG_SCRIPT_SELECTOR =
  'script[type="application/json"].module-embed-config';
const MODULE_EMPTY_HTML =
  "<!DOCTYPE html><html lang=\"en\"><body style=\"font-family: sans-serif; padding: 1rem;\">No module content yet.</body></html>";

const PEXELS_API_KEY = 'ntFmvz0n4RpCRtHtRVV7HhAcbb4VQLwyEenPsqfIGdvpVvkgagK2dQEd';
const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

function ensureStageUtilityCluster() {
  if (!(stageViewport instanceof HTMLElement)) {
    return null;
  }
  if (stageUtilityCluster instanceof HTMLElement && stageViewport.contains(stageUtilityCluster)) {
    return stageUtilityCluster;
  }
  const existing = stageViewport.querySelector('[data-role="stage-utilities"]');
  if (existing instanceof HTMLElement) {
    stageUtilityCluster = existing;
    return stageUtilityCluster;
  }
  const cluster = document.createElement('div');
  cluster.className = 'stage-utility-cluster';
  cluster.dataset.role = 'stage-utilities';
  stageViewport.appendChild(cluster);
  stageUtilityCluster = cluster;
  return stageUtilityCluster;
}

function ensureBlankToolbarHost() {
  if (!(stageViewport instanceof HTMLElement)) {
    return null;
  }
  if (blankToolbarHost instanceof HTMLElement && blankToolbarHost.isConnected) {
    return blankToolbarHost;
  }
  const existing = stageViewport.querySelector('[data-role="blank-toolbar-host"]');
  if (existing instanceof HTMLElement) {
    blankToolbarHost = existing;
    return blankToolbarHost;
  }
  const host = document.createElement('div');
  host.className = 'blank-toolbar-host';
  host.dataset.role = 'blank-toolbar-host';
  const utilities = stageViewport.querySelector('[data-role="stage-utilities"]');
  if (utilities instanceof HTMLElement) {
    stageViewport.insertBefore(host, utilities);
  } else {
    stageViewport.insertBefore(host, stageViewport.firstChild ?? null);
  }
  blankToolbarHost = host;
  return blankToolbarHost;
}

function syncBlankToolbarVisibility() {
  const host =
    blankToolbarHost instanceof HTMLElement
      ? blankToolbarHost
      : stageViewport?.querySelector?.('[data-role="blank-toolbar-host"]') ?? null;

  if (!(host instanceof HTMLElement)) {
    return;
  }

  const activeSlide = slides?.[currentSlideIndex];
  const isBlankSlide =
    activeSlide instanceof HTMLElement && activeSlide.dataset.type === 'blank';

  host.hidden = !isBlankSlide;

  const toolbar = host.querySelector('[data-role="blank-toolbar"]');
  if (toolbar instanceof HTMLElement) {
    toolbar.hidden = !isBlankSlide;
    if (isBlankSlide) {
      toolbar.removeAttribute('aria-hidden');
    } else {
      toolbar.setAttribute('aria-hidden', 'true');
      toolbar.__deckSetExpanded?.(false);
    }
  }
}

const INSERT_MENU_OPTIONS = [
  {
    action: 'add-textbox',
    icon: 'fa-solid fa-pen-to-square',
    label: 'Add textbox',
    description: 'Insert a textbox onto the canvas.',
  },
  {
    action: 'add-table',
    icon: 'fa-solid fa-table',
    label: 'Create table',
    description: 'Insert a table onto the canvas.',
  },
  {
    action: 'add-mindmap',
    icon: 'fa-solid fa-diagram-project',
    label: 'Add mind map',
    description: 'Insert a mind map onto the canvas.',
  },
  {
    action: 'add-module',
    icon: 'fa-solid fa-puzzle-piece',
    label: 'Add module',
    description: 'Insert an activity module onto the canvas.',
  },
];

function getActiveBlankSlide() {
  const activeSlide = slides?.[currentSlideIndex];
  if (activeSlide instanceof HTMLElement && activeSlide.dataset.type === 'blank') {
    return activeSlide;
  }
  return null;
}

class CanvasInsertController {
  constructor(slide, canvas) {
    this.slide = slide;
    this.canvas = canvas;
    this.handlers = new Map();
    this.triggerListeners = new Map();
  }

  registerAction(action, handler) {
    if (typeof action !== 'string' || typeof handler !== 'function') {
      return;
    }
    this.handlers.set(action, handler);
  }

  registerTrigger(element, action) {
    if (!(element instanceof HTMLElement) || typeof action !== 'string') {
      return;
    }
    const listener = (event) => {
      event.preventDefault();
      this.invoke(action, { source: element, originalEvent: event });
    };
    element.addEventListener('click', listener);
    this.triggerListeners.set(element, listener);
  }

  unregisterTrigger(element) {
    const listener = this.triggerListeners.get(element);
    if (listener) {
      element.removeEventListener('click', listener);
      this.triggerListeners.delete(element);
    }
  }

  invoke(action, context = {}) {
    const handler = this.handlers.get(action);
    if (typeof handler !== 'function') {
      return false;
    }
    return handler(context) !== false;
  }

  isAvailable() {
    return (
      this.slide instanceof HTMLElement &&
      this.slide.isConnected &&
      this.slide.dataset.type === 'blank'
    );
  }

  destroy() {
    for (const [element, listener] of this.triggerListeners.entries()) {
      element.removeEventListener('click', listener);
    }
    this.triggerListeners.clear();
    this.handlers.clear();
  }
}

class CanvasInsertOverlay {
  constructor(stage) {
    this.stage = stage;
    this.cluster = ensureStageUtilityCluster();
    this.activeController = null;
    this.panelId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `canvas-insert-${crypto.randomUUID()}`
        : `canvas-insert-${Math.random().toString(16).slice(2, 8)}`;
    this.activeIndex = -1;
    this.isOpen = false;
    this.createTrigger();
    this.createPanel();
    this.syncAvailability();
    this.handleDocumentPointerDown = this.handleDocumentPointerDown.bind(this);
    this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
    document.addEventListener('pointerdown', this.handleDocumentPointerDown);
    document.addEventListener('keydown', this.handleDocumentKeydown);
  }

  createTrigger() {
    if (!this.cluster) {
      return;
    }
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'stage-utility-btn canvas-insert-trigger';
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = `
      <i class="fa-solid fa-plus" aria-hidden="true"></i>
      <span class="sr-only">Insert canvas item</span>
    `;
    trigger.title = 'Insert canvas item';
    trigger.addEventListener('click', () => {
      this.toggle();
    });
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.open();
      } else if (event.key === 'Escape') {
        this.close({ focusTrigger: true });
      }
    });
    this.cluster.appendChild(trigger);
    this.trigger = trigger;
  }

  createPanel() {
    if (!this.cluster) {
      return;
    }
    const panel = document.createElement('div');
    panel.className = 'canvas-insert-panel';
    panel.id = this.panelId;
    panel.setAttribute('role', 'menu');
    panel.setAttribute('aria-label', 'Insert canvas items');
    panel.hidden = true;
    const list = document.createElement('div');
    list.className = 'canvas-insert-options';
    panel.appendChild(list);
    this.options = [];
    INSERT_MENU_OPTIONS.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'canvas-insert-option';
      button.dataset.action = option.action;
      button.setAttribute('role', 'menuitem');
      button.tabIndex = -1;
      button.innerHTML = `
        <span class="canvas-insert-option-icon" aria-hidden="true">
          <i class="${option.icon}"></i>
        </span>
        <span class="canvas-insert-option-content">
          <span class="canvas-insert-option-label">${option.label}</span>
          <span class="canvas-insert-option-description">${option.description}</span>
        </span>
      `;
      button.addEventListener('click', () => {
        this.handleOptionSelect(option.action, button);
      });
      this.options.push(button);
      list.appendChild(button);
    });
    panel.addEventListener('keydown', (event) => {
      this.handlePanelKeydown(event);
    });
    this.cluster.appendChild(panel);
    if (this.trigger instanceof HTMLElement) {
      this.trigger.setAttribute('aria-controls', panel.id);
    }
    this.panel = panel;
  }

  handleOptionSelect(action, button) {
    if (!this.activeController) {
      return;
    }
    const handled = this.activeController.invoke(action, { source: button });
    if (handled !== false) {
      this.close({ focusTrigger: false });
    }
  }

  handlePanelKeydown(event) {
    if (!this.isOpen || !this.options.length) {
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight': {
        event.preventDefault();
        this.focusOption((this.activeIndex + 1) % this.options.length);
        break;
      }
      case 'ArrowUp':
      case 'ArrowLeft': {
        event.preventDefault();
        this.focusOption(
          this.activeIndex > 0 ? this.activeIndex - 1 : this.options.length - 1,
        );
        break;
      }
      case 'Home': {
        event.preventDefault();
        this.focusOption(0);
        break;
      }
      case 'End': {
        event.preventDefault();
        this.focusOption(this.options.length - 1);
        break;
      }
      case 'Escape': {
        event.preventDefault();
        this.close({ focusTrigger: true });
        break;
      }
      case 'Tab': {
        this.close({ focusTrigger: false });
        break;
      }
      default:
        break;
    }
  }

  handleDocumentPointerDown(event) {
    if (!this.isOpen) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (this.panel?.contains(target) || this.trigger?.contains(target)) {
      return;
    }
    this.close({ focusTrigger: false });
  }

  handleDocumentKeydown(event) {
    if (!this.isOpen) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close({ focusTrigger: true });
    }
  }

  focusOption(index) {
    if (!Array.isArray(this.options) || !this.options.length) {
      return;
    }
    const clamped = Math.max(0, Math.min(index, this.options.length - 1));
    const target = this.options[clamped];
    if (target instanceof HTMLElement) {
      this.activeIndex = clamped;
      target.focus({ preventScroll: true });
    }
  }

  open() {
    if (!this.activeController || !this.activeController.isAvailable()) {
      return;
    }
    if (this.isOpen) {
      return;
    }
    this.isOpen = true;
    this.syncVisibility();
    requestAnimationFrame(() => {
      this.focusOption(0);
    });
  }

  close({ focusTrigger = false } = {}) {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    this.activeIndex = -1;
    this.syncVisibility();
    if (focusTrigger && this.trigger instanceof HTMLElement) {
      this.trigger.focus({ preventScroll: true });
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close({ focusTrigger: false });
    } else {
      this.open();
    }
  }

  syncVisibility() {
    if (!(this.panel instanceof HTMLElement)) {
      return;
    }
    this.panel.hidden = !this.isOpen;
    this.panel.classList.toggle('is-visible', this.isOpen);
    if (this.trigger instanceof HTMLElement) {
      this.trigger.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false');
    }
  }

  syncAvailability() {
    const available = Boolean(this.activeController?.isAvailable?.());
    if (this.trigger instanceof HTMLButtonElement) {
      this.trigger.hidden = !available;
      this.trigger.disabled = !available;
      this.trigger.setAttribute('aria-disabled', available ? 'false' : 'true');
    }
    if (!available) {
      this.close({ focusTrigger: false });
    }
  }

  setActiveController(controller) {
    this.activeController = controller ?? null;
    this.syncAvailability();
  }
}

function ensureCanvasInsertOverlay() {
  if (!(stageViewport instanceof HTMLElement)) {
    return null;
  }
  if (!(canvasInsertOverlay instanceof CanvasInsertOverlay)) {
    canvasInsertOverlay = new CanvasInsertOverlay(stageViewport);
  }
  return canvasInsertOverlay;
}

function updateCanvasInsertOverlay() {
  const overlay = ensureCanvasInsertOverlay();
  if (!overlay) {
    return;
  }
  const activeSlide = slides?.[currentSlideIndex];
  const controller =
    activeSlide instanceof HTMLElement && activeSlide.dataset.type === 'blank'
      ? activeSlide.__deckCanvasInsertController ?? null
      : null;
  overlay.setActiveController(controller);
}

const BUILDER_LAYOUT_DEFAULTS = {
  "blank-canvas": () => ({}),
  "learning-objectives": () => ({
    title: "Learning Outcomes",
    goals: [
      "Learn vocabulary for jobs and places in a city.",
      "Practise asking and answering questions with 'do'.",
      "Focus on blending the /st/ sound.",
    ],
    communicativeGoal: "get to know a new person.",
    imageUrl: "",
  }),
  "model-dialogue": () => ({
    title: "Get to know people",
    instructions: "In pairs, identify the two main questions and how the speakers answer them.",
    imageUrl: "",
    audioUrl: "",
    turns: [
      { speaker: "Amina", line: "Hi! I'm Amina. Nice to meet you." },
      { speaker: "Sara", line: "Hi Amina! I'm Sara. Where are you from?" },
    ],
  }),
  "interactive-practice": () => ({
    activityType: "Gap Fill",
    title: "Practice",
    instructions: "Complete each sentence with the best option.",
    questions: [
      {
        prompt: "I live ____ a flat ___ Ramallah.",
        options: ["in / on", "in / in", "on / in"],
        answer: "in / in",
      },
    ],
  }),
  "communicative-task": () => ({
    title: "Language exchange introductions",
    imageUrl: "",
    preparation:
      "You are at a language exchange event. Decide who you will meet and note two follow-up questions you want to ask.",
    performance:
      "Move to breakout rooms. Take turns introducing yourselves and asking the follow-up questions you prepared.",
    scaffolding: [
      "A: Where do you live, ____?",
      "B: I live in ____. What do you do?",
      "A: I work as a ____ because ____.",
    ],
  }),
  "pronunciation-focus": () => ({
    title: "What does /st/ sound like?",
    target: "/st/ sound",
    words: ["student", "study"],
    sentences: ["Are you a student? ↗", "We start at six o'clock. ↘"],
    practice: "Invite 3-4 learners to say the sentences, then personalise with their own ideas.",
    imageUrl: "",
  }),
  reflection: () => ({
    title: "Reflection",
    prompts: ["A classmate’s name", "A place in Palestine", "A job"],
    imageUrl: "",
  }),
};


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

const formatVocabularyItems = (items = []) =>
  items
    .map((item) => {
      const term = trimText(item?.term);
      const definition = trimText(item?.definition);
      const example = trimText(item?.example);
      return [term, definition, example].filter(Boolean).join(" | ");
    })
    .filter(Boolean)
    .join("\n");

const parseVocabularyItems = (value) =>
  splitMultiline(value)
    .map((line) => {
      const [term = "", definition = "", example = ""] = line
        .split("|")
        .map((part) => part.trim());
      return {
        term,
        definition,
        example,
      };
    })
    .filter((entry) => entry.term || entry.definition || entry.example);

const formatQuestionAnswerPairs = (entries = []) =>
  entries
    .map((entry) => {
      const question = trimText(entry?.question ?? entry?.prompt);
      const answer = trimText(entry?.answer);
      return [question, answer].filter(Boolean).join(" | ");
    })
    .filter(Boolean)
    .join("\n");

const parseQuestionAnswerPairs = (value) =>
  splitMultiline(value)
    .map((line) => {
      const [question = "", answer = ""] = line
        .split("|")
        .map((part) => part.trim());
      return { question, answer };
    })
    .filter((entry) => entry.question || entry.answer);

const formatMinimalPairs = (entries = []) =>
  entries
    .map((entry) => {
      const first = trimText(entry?.first ?? entry?.a);
      const second = trimText(entry?.second ?? entry?.b);
      const tip = trimText(entry?.tip);
      return [first && second ? `${first} / ${second}` : first || second, tip]
        .filter(Boolean)
        .join(" | ");
    })
    .filter(Boolean)
    .join("\n");

const parseMinimalPairs = (value) =>
  splitMultiline(value)
    .map((line) => {
      const [pair = "", tip = ""] = line
        .split("|")
        .map((part) => part.trim());
      const [first = "", second = ""] = pair.split("/").map((part) => part.trim());
      return { first, second, tip };
    })
    .filter((entry) => entry.first || entry.second || entry.tip);

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

function getSlideThumbnailDescriptor(slide) {
  if (!(slide instanceof HTMLElement)) {
    return null;
  }

  const { dataset = {} } = slide;
  const htmlDescriptor = typeof dataset.thumbnailHtml === "string" ? dataset.thumbnailHtml.trim() : "";
  if (htmlDescriptor) {
    return { html: htmlDescriptor };
  }

  const urlDescriptor =
    typeof dataset.thumbnailUrl === "string"
      ? dataset.thumbnailUrl.trim()
      : typeof dataset.thumbnail === "string"
      ? dataset.thumbnail.trim()
      : "";
  if (urlDescriptor) {
    return { url: urlDescriptor };
  }

  const template = slide.querySelector?.("[data-slide-thumbnail-html]");
  if (template instanceof HTMLElement) {
    const markup = template.innerHTML.trim();
    if (markup) {
      return { html: markup };
    }
  }

  const imageSelectors = ["[data-slide-thumbnail] img", "[data-role=\"slide-thumbnail\"] img", "img"];
  for (const selector of imageSelectors) {
    const candidate = slide.querySelector?.(selector);
    if (candidate instanceof HTMLImageElement) {
      const source = candidate.currentSrc || candidate.src;
      if (source) {
        return { url: source };
      }
    }
  }

  return null;
}

function buildSlideNavigatorMeta() {
  return slides.map((slide, index) => ({
    stage: getSlideStageLabel(slide, index),
    title: getSlideTitle(slide, index),
    thumbnail: getSlideThumbnailDescriptor(slide),
    originalIndex: index,
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

  slide.querySelectorAll(".editable-text").forEach((element) => {
    cleanupEditableElement(element);
  });
}

function refreshSlides() {
  slides = Array.from(stageViewport?.querySelectorAll(".slide-stage") ?? []);
  slideNavigatorController?.updateSlides(buildSlideNavigatorMeta());
  updateCanvasInsertOverlay();
  initialiseEditableText(stageViewport);
  syncBlankToolbarVisibility();
}

function updateCounter() {
  if (!counter) return;
  const total = slides.length;
  const current = total ? currentSlideIndex + 1 : 0;
  counter.textContent = `${current} / ${total}`;
}

function showSlide(index) {
  if (!slides.length) return;
  const previousSlide = slides[currentSlideIndex];
  currentSlideIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("hidden", slideIndex !== currentSlideIndex);
  });
  updateCounter();
  slideNavigatorController?.setActive(currentSlideIndex);
  updateCanvasInsertOverlay();
  const activeSlide = slides[currentSlideIndex];
  if (activeSlide instanceof HTMLElement) {
    initialiseEditableText(activeSlide);
    refreshEditableMetrics(activeSlide);
  }
  syncBlankToolbarVisibility();
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
  initialiseEditableText(newSlide);
  refreshSlides();
  showSlide(slides.length - 1);
  syncBlankToolbarVisibility();
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

  if (clonedSlide.hasAttribute("data-editable-processed")) {
    clonedSlide.removeAttribute("data-editable-processed");
  }
  clonedSlide
    .querySelectorAll('[data-editable-processed]')
    .forEach((element) => {
      if (element instanceof HTMLElement) {
        element.removeAttribute("data-editable-processed");
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

  initialiseEditableText(clonedSlide);

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
  syncBlankToolbarVisibility();
  return resolvedIndex;
}

function moveSlide(fromIndex, toIndex) {
  if (!(stageViewport instanceof HTMLElement)) {
    showDeckToast("Slides are not ready to move yet.", {
      icon: "fa-triangle-exclamation",
    });
    return null;
  }

  refreshSlides();

  const total = slides.length;
  if (!total) {
    showDeckToast("There are no slides to move right now.", {
      icon: "fa-circle-info",
    });
    return null;
  }

  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) {
    showDeckToast("We couldn't understand which slide to move.", {
      icon: "fa-triangle-exclamation",
    });
    return null;
  }

  const clampedFrom = Math.min(Math.max(fromIndex, 0), total - 1);
  const clampedTo = Math.min(Math.max(toIndex, 0), total - 1);

  if (clampedFrom === clampedTo) {
    showDeckToast("Slide is already in that position.", {
      icon: "fa-circle-info",
    });
    return clampedFrom;
  }

  const slide = slides[clampedFrom];
  if (!(slide instanceof HTMLElement)) {
    showDeckToast("We couldn't find that slide to move.", {
      icon: "fa-triangle-exclamation",
    });
    return null;
  }

  const movingDown = clampedTo > clampedFrom;
  const referenceIndex = movingDown ? clampedTo + 1 : clampedTo;
  const referenceNode = slides[referenceIndex] ?? null;

  stageViewport.insertBefore(slide, referenceNode);

  refreshSlides();

  const newIndex = slides.indexOf(slide);
  const targetIndex = newIndex >= 0 ? newIndex : clampedTo;

  showSlide(targetIndex);
  focusSlideAtIndex(targetIndex);
  recalibrateMindMapCounter();
  syncBlankToolbarVisibility();

  const descriptor = getSlideTitle(slide, targetIndex);
  const humanIndex = targetIndex + 1;
  showDeckToast(`Moved “${descriptor}” to position ${humanIndex}.`, {
    icon: "fa-up-down-left-right",
  });

  return targetIndex;
}

export function moveSlidesToSection(indices, targetSection) {
  if (!(stageViewport instanceof HTMLElement)) {
    showDeckToast("Slides are not ready to move yet.", {
      icon: "fa-triangle-exclamation",
    });
    return false;
  }

  const sectionLabel = typeof targetSection === "string" ? targetSection.trim() : "";
  if (!sectionLabel) {
    showDeckToast("Choose a section before moving slides.", {
      icon: "fa-circle-info",
    });
    return false;
  }

  const normalisedIndices = Array.isArray(indices) ? indices : [indices];
  const uniqueIndices = Array.from(new Set(normalisedIndices.filter((value) => Number.isInteger(value)))).sort(
    (a, b) => a - b,
  );
  const indexSet = new Set(uniqueIndices);
  if (!uniqueIndices.length) {
    showDeckToast("Select at least one slide to move.", {
      icon: "fa-circle-info",
    });
    return false;
  }

  refreshSlides();

  if (!slides.length) {
    showDeckToast("There are no slides to move right now.", {
      icon: "fa-circle-info",
    });
    return false;
  }

  const sectionIndices = slides.reduce((accumulator, slide, index) => {
    if (getSlideStageLabel(slide, index) === sectionLabel) {
      accumulator.push(index);
    }
    return accumulator;
  }, []);

  if (!sectionIndices.length) {
    showDeckToast(`We couldn't find the “${sectionLabel}” section.`, {
      icon: "fa-triangle-exclamation",
    });
    return false;
  }

  const nodesToMove = uniqueIndices
    .map((index) => ({ index, node: slides[index] }))
    .filter(({ node }) => node instanceof HTMLElement);

  if (!nodesToMove.length) {
    showDeckToast("We couldn't locate those slides to move.", {
      icon: "fa-triangle-exclamation",
    });
    return false;
  }

  const firstSectionIndex = sectionIndices[0];
  let referenceIndex = firstSectionIndex;
  while (referenceIndex < slides.length && indexSet.has(referenceIndex)) {
    referenceIndex += 1;
  }

  const fragment = document.createDocumentFragment();
  nodesToMove.sort((a, b) => a.index - b.index).forEach(({ node }) => {
    fragment.appendChild(node);
  });

  const referenceNode = slides[referenceIndex] ?? null;
  stageViewport.insertBefore(fragment, referenceNode);

  const movedNodes = nodesToMove.map(({ node }) => node);

  refreshSlides();

  recalibrateMindMapCounter();

  const firstMovedNode = movedNodes.find((node) => slides.includes(node));
  const nextIndex = firstMovedNode ? slides.indexOf(firstMovedNode) : -1;
  if (nextIndex >= 0) {
    currentSlideIndex = nextIndex;
    showSlide(nextIndex);
    focusSlideAtIndex(nextIndex);
  } else if (slides.length) {
    showSlide(currentSlideIndex);
  }
  syncBlankToolbarVisibility();

  const movedCount = movedNodes.length;
  const plural = movedCount === 1 ? "slide" : "slides";
  showDeckToast(`Moved ${plural} to ${sectionLabel}.`, {
    icon: "fa-arrow-turn-down",
  });

  return true;
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
    syncBlankToolbarVisibility();
    return 0;
  }

  const nextIndex = Math.min(targetIndex, slides.length - 1);
  showSlide(nextIndex);
  focusSlideAtIndex(nextIndex);
  syncBlankToolbarVisibility();
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
      <div class="blank-slide" data-blank-version="2">
        <div class="blank-controls-home" data-role="blank-controls-home"></div>
        <div class="blank-canvas" role="region" aria-label="Blank slide workspace"></div>
      </div>
    </div>
  `;
  return slide;
}

function upgradeLegacyBlankSlide(slide) {
  if (!(slide instanceof HTMLElement)) {
    return;
  }

  const blank = slide.querySelector(".blank-slide");
  if (!(blank instanceof HTMLElement)) {
    return;
  }

  if (blank.querySelector('[data-role="blank-controls-home"]')) {
    return;
  }

  const templateSlide = createBlankSlide();
  const templateBlank = templateSlide?.querySelector?.(".blank-slide") ?? null;
  if (!(templateBlank instanceof HTMLElement)) {
    return;
  }

  const legacyCanvas = blank.querySelector(".blank-canvas");
  const newCanvas = templateBlank.querySelector(".blank-canvas");
  if (legacyCanvas instanceof HTMLElement && newCanvas instanceof HTMLElement) {
    newCanvas.replaceWith(legacyCanvas);
  }

  blank.replaceWith(templateBlank);
}

export function attachBlankSlideEvents(slide) {
  if (!(slide instanceof HTMLElement)) {
    return;
  }

  upgradeLegacyBlankSlide(slide);

  if (typeof slide.__deckBlankCleanup === "function") {
    try {
      slide.__deckBlankCleanup();
    } catch (error) {
      console.warn("Failed to clear previous blank slide listeners", error);
    }
  }

  const blank = slide.querySelector(".blank-slide");
  if (!(blank instanceof HTMLElement)) {
    delete slide.__deckBlankCleanup;
    return;
  }

  const ensureToolbar = () => {
    let controlsHome = blank.querySelector('[data-role="blank-controls-home"]');
    if (!(controlsHome instanceof HTMLElement)) {
      controlsHome = document.createElement("div");
      controlsHome.className = "blank-controls-home";
      controlsHome.dataset.role = "blank-controls-home";
      blank.insertBefore(controlsHome, blank.firstChild ?? null);
    }

    const toolbarHost = ensureBlankToolbarHost();
    const legacyToolbar =
      controlsHome.querySelector('[data-role="blank-toolbar"]') ??
      blank.querySelector('[data-role="blank-toolbar"]');
    let toolbar =
      toolbarHost?.querySelector('[data-role="blank-toolbar"]') ?? legacyToolbar;

    if (!(toolbar instanceof HTMLElement)) {
      const target = toolbarHost ?? controlsHome;
      if (!(target instanceof HTMLElement)) {
        return null;
      }
      target.insertAdjacentHTML(
        "beforeend",
        `
          <div class="blank-toolbar" data-role="blank-toolbar" data-toolbar-version="3">
            <button
              class="blank-toolbar-toggle"
              type="button"
              data-action="toggle-toolbar"
              aria-expanded="false"
            >
              <span class="blank-toolbar-toggle-icon" aria-hidden="true">
                <i class="fa-solid fa-sliders"></i>
              </span>
              <span class="blank-toolbar-toggle-label">Canvas tools</span>
              <span class="blank-toolbar-toggle-caret" aria-hidden="true">
                <i class="fa-solid fa-chevron-down"></i>
              </span>
            </button>
            <div class="blank-toolbar-panel" data-role="toolbar-panel" hidden>
              <p class="blank-toolbar-empty" data-role="toolbar-empty">
                Select a canvas item to edit its appearance. Choose a tool icon to continue.
              </p>
              <p class="blank-toolbar-selection" data-role="toolbar-selection" hidden>
                <span class="blank-toolbar-selection-summary" data-role="selection-summary"></span>
                <span class="blank-toolbar-selection-detail" data-role="selection-meta"></span>
              </p>
              <div
                class="blank-toolbar-tabs"
                data-role="toolbar-tabs"
                role="tablist"
                hidden
              ></div>
              <section class="blank-toolbar-section" data-tools-for="textbox" hidden>
                <h3 class="blank-toolbar-heading">Textbox style</h3>
                <div
                  class="blank-toolbar-actions blank-toolbar-actions--tight"
                  data-role="textbox-formatting"
                  role="toolbar"
                  aria-label="Textbox formatting"
                ></div>
                <div
                  class="blank-toolbar-swatches textbox-color-options"
                  data-role="toolbar-color-options"
                  data-tools-for="textbox"
                ></div>
                <label class="blank-toolbar-checkbox">
                  <input type="checkbox" data-role="textbox-shadow" />
                  <span>Add drop shadow</span>
                </label>
              </section>
              <section class="blank-toolbar-section" data-tools-for="table" hidden>
                <h3 class="blank-toolbar-heading">Table style</h3>
                <div
                  class="blank-toolbar-actions"
                  data-role="table-structure"
                  role="group"
                  aria-label="Table structure"
                >
                  <button type="button" class="blank-toolbar-action" data-action="table-add-column">
                    <i class="fa-solid fa-table-columns" aria-hidden="true"></i>
                    <span>Add column</span>
                  </button>
                  <button type="button" class="blank-toolbar-action" data-action="table-add-row">
                    <i class="fa-solid fa-table-rows" aria-hidden="true"></i>
                    <span>Add row</span>
                  </button>
                </div>
                <div
                  class="blank-toolbar-swatches textbox-color-options"
                  data-role="toolbar-color-options"
                  data-tools-for="table"
                ></div>
                <label class="blank-toolbar-checkbox">
                  <input type="checkbox" data-role="table-shadow" />
                  <span>Add drop shadow</span>
                </label>
              </section>
              <section class="blank-toolbar-section" data-tools-for="mindmap" hidden>
                <h3 class="blank-toolbar-heading">Branch colour</h3>
                <p class="blank-toolbar-help">
                  Changes the colour for the selected branch.
                </p>
                <div
                  class="blank-toolbar-swatches textbox-color-options"
                  data-role="toolbar-color-options"
                  data-tools-for="mindmap"
                ></div>
                <label class="blank-toolbar-checkbox">
                  <input type="checkbox" data-role="mindmap-shadow" />
                  <span>Emphasise branch</span>
                </label>
              </section>
              <section class="blank-toolbar-section" data-tools-for="image" hidden>
                <h3 class="blank-toolbar-heading">Image adjustments</h3>
                <label class="blank-toolbar-range">
                  <span>Resize</span>
                  <input
                    type="range"
                    min="60"
                    max="160"
                    step="10"
                    value="100"
                    data-role="image-size"
                  />
                  <span class="blank-toolbar-range-value" data-role="image-size-value">
                    100%
                  </span>
                </label>
                <label class="blank-toolbar-checkbox">
                  <input type="checkbox" data-role="image-shadow" />
                  <span>Add drop shadow</span>
                </label>
              </section>
            </div>
          </div>
        `.trim(),
      );
      toolbar =
        (toolbarHost ?? controlsHome)?.querySelector?.('[data-role="blank-toolbar"]') ?? null;
    }

    if (
      toolbarHost instanceof HTMLElement &&
      toolbar instanceof HTMLElement &&
      toolbar.parentElement !== toolbarHost
    ) {
      toolbarHost.appendChild(toolbar);
    }

    return toolbar instanceof HTMLElement ? toolbar : null;
  };

  const toolbar = ensureToolbar();

  blank
    .querySelectorAll('[data-role="hint"], .blank-hint')
    .forEach((existingHint) => {
      if (existingHint instanceof HTMLElement) {
        existingHint.remove();
      }
    });

  const canvas = blank.querySelector(".blank-canvas");
  if (!(canvas instanceof HTMLElement)) {
    delete slide.__deckBlankCleanup;
    return;
  }

  const insertController = new CanvasInsertController(slide, canvas);
  slide.__deckCanvasInsertController = insertController;

  const cleanupTasks = [];
  const registerCleanup = (callback) => {
    if (typeof callback === "function") {
      cleanupTasks.push(callback);
    }
  };

  registerCleanup(() => {
    insertController.destroy();
    if (slide.__deckCanvasInsertController === insertController) {
      delete slide.__deckCanvasInsertController;
    }
    updateCanvasInsertOverlay();
  });

  const toolbarToggle = toolbar?.querySelector('[data-action="toggle-toolbar"]');
  const toolbarPanel = toolbar?.querySelector('[data-role="toolbar-panel"]');
  const toolbarEmpty = toolbarPanel?.querySelector('[data-role="toolbar-empty"]');
  const toolbarSelectionLabel = toolbarPanel?.querySelector(
    '[data-role="toolbar-selection"]',
  );
  const toolbarSelectionSummary = toolbarSelectionLabel?.querySelector(
    '[data-role="selection-summary"]',
  );
  const toolbarSelectionDetail = toolbarSelectionLabel?.querySelector(
    '[data-role="selection-meta"]',
  );
  const toolbarTabs = toolbarPanel?.querySelector('[data-role="toolbar-tabs"]');
  const toolbarSections = Array.from(
    toolbarPanel?.querySelectorAll?.('.blank-toolbar-section[data-tools-for]') ?? [],
  );
  const colorContainers = Array.from(
    toolbarPanel?.querySelectorAll?.('[data-role="toolbar-color-options"]') ?? [],
  );
  const textboxFormattingContainer = toolbarPanel?.querySelector(
    '[data-role="textbox-formatting"]',
  );
  const tableStructureContainer = toolbarPanel?.querySelector('[data-role="table-structure"]');
  const textboxShadowToggle = toolbarPanel?.querySelector('[data-role="textbox-shadow"]');
  const tableShadowToggle = toolbarPanel?.querySelector('[data-role="table-shadow"]');
  const mindmapShadowToggle = toolbarPanel?.querySelector('[data-role="mindmap-shadow"]');
  const imageShadowToggle = toolbarPanel?.querySelector('[data-role="image-shadow"]');
  const imageSizeInput = toolbarPanel?.querySelector('[data-role="image-size"]');
  const imageSizeValue = toolbarPanel?.querySelector('[data-role="image-size-value"]');

  const TOOLBAR_TAB_DETAILS = new Map([
    ["textbox", { icon: "fa-solid fa-pen-to-square", label: "Textbox tools" }],
    ["table", { icon: "fa-solid fa-table", label: "Table tools" }],
    [
      "mindmap",
      { icon: "fa-solid fa-diagram-project", label: "Mind map tools" },
    ],
    ["image", { icon: "fa-solid fa-image", label: "Image tools" }],
  ]);

  const toolbarInstanceId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `toolbar-${Math.random().toString(36).slice(2, 11)}`;

  toolbarSections.forEach((section, index) => {
    if (!(section instanceof HTMLElement)) {
      return;
    }
    const targetType = section.dataset.toolsFor ?? `section-${index}`;
    if (!section.id) {
      section.id = `blank-tools-${targetType}-${toolbarInstanceId}`;
    }
    section.setAttribute("role", "tabpanel");
    section.setAttribute("tabindex", "-1");
    section.setAttribute("aria-hidden", "true");
  });

  if (toolbarTabs instanceof HTMLElement) {
    toolbarTabs.innerHTML = "";
    toolbarTabs.setAttribute("aria-label", "Canvas item tools");
    const created = new Set();
    toolbarSections.forEach((section, index) => {
      if (!(section instanceof HTMLElement)) {
        return;
      }
      const type = section.dataset.toolsFor;
      if (!type || created.has(type) || !TOOLBAR_TAB_DETAILS.has(type)) {
        return;
      }
      created.add(type);
      const details = TOOLBAR_TAB_DETAILS.get(type);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "blank-toolbar-tab";
      button.dataset.toolsTarget = type;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", "false");
      if (section.id) {
        button.setAttribute("aria-controls", section.id);
        const tabId = `${section.id}-tab`;
        button.id = tabId;
        section.setAttribute("aria-labelledby", tabId);
      }
      if (details?.label) {
        button.title = details.label;
      }
      const iconSpan = document.createElement("span");
      iconSpan.className = "blank-toolbar-tab-icon";
      iconSpan.setAttribute("aria-hidden", "true");
      iconSpan.innerHTML = `<i class="${details?.icon ?? ""}"></i>`;
      button.appendChild(iconSpan);
      const labelSpan = document.createElement("span");
      labelSpan.className = "sr-only";
      labelSpan.textContent = details?.label ?? type;
      button.appendChild(labelSpan);
      toolbarTabs.appendChild(button);
    });
    if (!toolbarTabs.children.length) {
      toolbarTabs.hidden = true;
    }
  }

  const SELECTED_CLASS = "blank-toolbar-selected";
  const CANVAS_ITEM_CLASS = "blank-toolbar-item";

  const TOOLBAR_EMPTY_PROMPTS = {
    default:
      "Select a canvas item to edit its appearance. Choose a tool icon to continue.",
    textbox: "Choose a tool icon to style this textbox.",
    table: "Choose a tool icon to format this table.",
    mindmap: "Choose a tool icon to colour this branch.",
    image: "Choose a tool icon to adjust this image.",
  };

  const selection = {
    element: null,
    type: null,
    summary: "",
    detail: "",
  };
  let activeToolsType = null;
  let imageSizeReference = null;
  let storedTextboxRange = null;

  const normaliseText = (value) =>
    typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

  const truncateText = (value, maxLength = 64) => {
    const text = normaliseText(value);
    if (!text) {
      return "";
    }
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, Math.max(0, maxLength - 1))}\u2026`;
  };

  const getTextboxColorLabel = (value) => {
    const fallback = TEXTBOX_COLOR_OPTIONS[0]?.label ?? "";
    if (typeof value !== "string" || !value) {
      return fallback;
    }
    return TEXTBOX_COLOR_OPTIONS.find((option) => option.value === value)?.label ?? fallback;
  };

  const getSelectedElement = () =>
    selection.element instanceof HTMLElement ? selection.element : null;

  const describeSelection = (type, element) => {
    if (!(element instanceof HTMLElement) || typeof type !== "string") {
      return { summary: "", detail: "" };
    }

    switch (type) {
      case "textbox": {
        const body = element.querySelector(".textbox-body");
        const preview = truncateText(body?.textContent ?? "");
        const colorLabel = getTextboxColorLabel(element.dataset.color);
        const detailParts = [];
        if (colorLabel) {
          detailParts.push(`${colorLabel} style`);
        }
        if (preview) {
          detailParts.push(`“${preview}”`);
        }
        return {
          summary: "Textbox",
          detail: detailParts.join(" • "),
        };
      }
      case "table": {
        const bodyRows = element.querySelectorAll("tbody tr").length;
        const headRows = element.querySelectorAll("thead tr").length;
        const totalRows = bodyRows + headRows;
        const firstRow =
          element.querySelector("tbody tr") ?? element.querySelector("thead tr");
        const columnCount = firstRow?.children?.length ?? 0;
        const sizeLabel =
          totalRows > 0 && columnCount > 0
            ? `${totalRows} × ${columnCount} grid`
            : "";
        const colorLabel = getTextboxColorLabel(element.dataset.color);
        const detailParts = [];
        if (sizeLabel) {
          detailParts.push(sizeLabel);
        }
        if (colorLabel) {
          detailParts.push(`${colorLabel} theme`);
        }
        return {
          summary: "Table",
          detail: detailParts.join(" • "),
        };
      }
      case "mindmap": {
        const label = normaliseText(element.dataset.label);
        const colorLabel = getMindmapColourLabel(element.dataset.color);
        const notesField = element.querySelector("textarea");
        const notesPreview = truncateText(
          notesField instanceof HTMLTextAreaElement ? notesField.value : notesField?.textContent ?? "",
          56,
        );
        const detailParts = [];
        if (label) {
          detailParts.push(label);
        }
        if (colorLabel) {
          detailParts.push(colorLabel);
        }
        if (notesPreview) {
          detailParts.push(`“${notesPreview}”`);
        }
        return {
          summary: "Mind map branch",
          detail: detailParts.join(" • "),
        };
      }
      case "image": {
        const name = normaliseText(element.dataset.imageName ?? "");
        const width = Math.round(
          element.offsetWidth || Number.parseFloat(element.dataset.baseWidth) || 0,
        );
        const height = Math.round(
          element.offsetHeight || Number.parseFloat(element.dataset.baseHeight) || 0,
        );
        const dimensionLabel = width > 0 && height > 0 ? `${width} × ${height}px` : "";
        const detailParts = [];
        if (name) {
          detailParts.push(name);
        }
        if (dimensionLabel) {
          detailParts.push(dimensionLabel);
        }
        return {
          summary: "Image",
          detail: detailParts.join(" • "),
        };
      }
      default:
        return { summary: "", detail: "" };
    }
  };

  const updateSelectionMetadata = () => {
    const element = getSelectedElement();
    if (!element || !selection.type) {
      selection.summary = "";
      selection.detail = "";
      return;
    }
    const { summary, detail } = describeSelection(selection.type, element);
    selection.summary = summary;
    selection.detail = detail;
  };

  let toolbarExpanded = false;
  if (toolbarToggle instanceof HTMLElement) {
    toolbarExpanded = toolbarToggle.getAttribute("aria-expanded") === "true";
  } else if (toolbar instanceof HTMLElement) {
    toolbarExpanded = toolbar.classList.contains("is-expanded");
  }

  const setToolbarExpanded = (expanded) => {
    if (!(toolbar instanceof HTMLElement) || !(toolbarToggle instanceof HTMLElement)) {
      return;
    }
    toolbarExpanded = Boolean(expanded);
    toolbar.classList.toggle("is-expanded", toolbarExpanded);
    toolbarToggle.setAttribute("aria-expanded", toolbarExpanded ? "true" : "false");
    if (toolbarPanel instanceof HTMLElement) {
      toolbarPanel.hidden = !toolbarExpanded;
    }
  };

  if (toolbar instanceof HTMLElement) {
    toolbar.__deckSetExpanded = (expanded) => {
      setToolbarExpanded(expanded);
    };
    registerCleanup(() => {
      delete toolbar.__deckSetExpanded;
    });
  }

  const setActiveToolsType = (type, { force = false } = {}) => {
    if (typeof type !== "string" || !type.trim()) {
      activeToolsType = null;
      return;
    }
    const targetType = type.trim();
    if (!force && activeToolsType === targetType) {
      return;
    }
    activeToolsType = targetType;
  };

  const updateToolbarTabs = () => {
    if (!(toolbarTabs instanceof HTMLElement)) {
      return;
    }
    const buttons = Array.from(
      toolbarTabs.querySelectorAll?.('button[data-tools-target]') ?? [],
    );
    if (!buttons.length) {
      toolbarTabs.hidden = true;
      return;
    }
    const hasSelection = Boolean(selection.type);
    let visibleCount = 0;
    buttons.forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }
      const targetType = button.dataset.toolsTarget ?? "";
      const isRelevant = hasSelection && targetType === selection.type;
      const isActive = isRelevant && activeToolsType === targetType;
      button.disabled = !isRelevant;
      button.tabIndex = isRelevant ? 0 : -1;
      button.setAttribute("aria-disabled", isRelevant ? "false" : "true");
      button.setAttribute("aria-selected", isActive ? "true" : "false");
      button.classList.toggle("is-active", isActive);
      button.hidden = !hasSelection;
      if (isRelevant) {
        visibleCount += 1;
      }
    });
    toolbarTabs.hidden = !hasSelection || visibleCount === 0;
  };

  setToolbarExpanded(toolbarExpanded);

  const getToolbarPrompt = () => {
    if (!selection.type) {
      return TOOLBAR_EMPTY_PROMPTS.default;
    }
    return (
      TOOLBAR_EMPTY_PROMPTS[selection.type] ??
      `Choose a tool icon to adjust this ${selection.type}.`
    );
  };

  const syncColorControls = () => {
    const activeElement = getSelectedElement();
    colorContainers.forEach((container) => {
      if (!(container instanceof HTMLElement)) {
        return;
      }
      const targetType = container.dataset.toolsFor;
      const buttons = Array.from(
        container.querySelectorAll?.(".textbox-color-swatch") ?? [],
      );
      buttons.forEach((button) => {
        if (!(button instanceof HTMLElement)) {
          return;
        }
        const colorValue = button.dataset.color ?? "";
        const isActive =
          targetType === selection.type &&
          activeElement instanceof HTMLElement &&
          colorValue === activeElement.dataset.color;
        button.classList.toggle("is-active", Boolean(isActive));
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    });
  };

  const syncEffectControls = () => {
    const activeElement = getSelectedElement();
    const effect = activeElement instanceof HTMLElement ? activeElement.dataset.effect ?? "" : "";
    const isShadow = effect === "shadow";
    if (textboxShadowToggle instanceof HTMLInputElement) {
      textboxShadowToggle.checked = Boolean(selection.type === "textbox" && isShadow);
      textboxShadowToggle.disabled = selection.type !== "textbox" || !activeElement;
    }
    if (tableShadowToggle instanceof HTMLInputElement) {
      tableShadowToggle.checked = Boolean(selection.type === "table" && isShadow);
      tableShadowToggle.disabled = selection.type !== "table" || !activeElement;
    }
    if (mindmapShadowToggle instanceof HTMLInputElement) {
      mindmapShadowToggle.checked = Boolean(selection.type === "mindmap" && isShadow);
      mindmapShadowToggle.disabled = selection.type !== "mindmap" || !activeElement;
    }
    if (imageShadowToggle instanceof HTMLInputElement) {
      imageShadowToggle.checked = Boolean(selection.type === "image" && isShadow);
      imageShadowToggle.disabled = selection.type !== "image" || !activeElement;
    }
  };

  const syncImageSizeControls = () => {
    if (!(imageSizeInput instanceof HTMLInputElement) || !(imageSizeValue instanceof HTMLElement)) {
      return;
    }
    const activeElement = getSelectedElement();
    if (selection.type !== "image" || !(activeElement instanceof HTMLElement)) {
      imageSizeInput.disabled = true;
      imageSizeInput.value = "100";
      imageSizeValue.textContent = "100%";
      return;
    }
    imageSizeInput.disabled = false;
    const baseWidth = imageSizeReference?.width || activeElement.offsetWidth || 1;
    const currentWidth = activeElement.offsetWidth || baseWidth;
    const percent = Math.max(
      60,
      Math.min(160, Math.round((currentWidth / baseWidth) * 100) || 100),
    );
    imageSizeInput.value = String(percent);
    imageSizeValue.textContent = `${percent}%`;
  };

  const getActiveTextboxBody = () => {
    const activeElement = getSelectedElement();
    if (selection.type !== "textbox" || !(activeElement instanceof HTMLElement)) {
      return null;
    }
    const body = activeElement.querySelector(".textbox-body");
    return body instanceof HTMLElement ? body : null;
  };

  const saveTextboxSelection = () => {
    const body = getActiveTextboxBody();
    if (!(body instanceof HTMLElement)) {
      storedTextboxRange = null;
      return;
    }
    const context = getSelectionContextWithin(body);
    if (context) {
      storedTextboxRange = context.range.cloneRange();
    }
  };

  const restoreTextboxSelection = () => {
    if (!storedTextboxRange) {
      return;
    }
    const selection = window.getSelection?.();
    if (!selection) {
      return;
    }
    selection.removeAllRanges();
    selection.addRange(storedTextboxRange.cloneRange());
  };

  const syncTextboxFormattingControls = () => {
    if (!(textboxFormattingContainer instanceof HTMLElement)) {
      return;
    }
    const buttons = Array.from(
      textboxFormattingContainer.querySelectorAll?.("button[data-command]") ?? [],
    );
    if (!buttons.length) {
      return;
    }
    const body = getActiveTextboxBody();
    const enabled = body instanceof HTMLElement;
    buttons.forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }
      if (enabled) {
        button.removeAttribute("disabled");
      } else {
        button.setAttribute("disabled", "disabled");
      }
    });
    if (enabled) {
      updateToolbarState(textboxFormattingContainer, body);
    } else {
      buttons.forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) {
          return;
        }
        button.setAttribute("aria-pressed", "false");
        button.classList.remove("is-active");
      });
    }
  };

  const syncTableStructureControls = () => {
    if (!(tableStructureContainer instanceof HTMLElement)) {
      return;
    }
    const buttons = Array.from(
      tableStructureContainer.querySelectorAll?.("button[data-action]") ?? [],
    );
    const enabled = selection.type === "table" && getSelectedElement() instanceof HTMLElement;
    buttons.forEach((button) => {
      if (button instanceof HTMLButtonElement) {
        button.disabled = !enabled;
      }
    });
  };

  const updateToolbar = () => {
    if (!(toolbar instanceof HTMLElement)) {
      return;
    }
    updateSelectionMetadata();
    const activeElement = getSelectedElement();
    const hasSelection = Boolean(selection.type && activeElement);
    const hasActiveSection = hasSelection && Boolean(activeToolsType === selection.type);
    toolbar.classList.toggle("has-selection", hasSelection);
    if (toolbarEmpty instanceof HTMLElement) {
      if (!hasSelection) {
        toolbarEmpty.hidden = false;
        toolbarEmpty.textContent = TOOLBAR_EMPTY_PROMPTS.default;
      } else if (!hasActiveSection) {
        toolbarEmpty.hidden = false;
        toolbarEmpty.textContent = getToolbarPrompt();
      } else {
        toolbarEmpty.hidden = true;
      }
    }
    if (toolbarSelectionLabel instanceof HTMLElement) {
      if (hasSelection) {
        toolbarSelectionLabel.hidden = false;
        if (toolbarSelectionSummary instanceof HTMLElement) {
          toolbarSelectionSummary.textContent = selection.summary || "Selected item";
        } else {
          toolbarSelectionLabel.textContent = selection.summary || "Selected item";
        }
        if (toolbarSelectionDetail instanceof HTMLElement) {
          if (selection.detail) {
            toolbarSelectionDetail.hidden = false;
            toolbarSelectionDetail.textContent = selection.detail;
          } else {
            toolbarSelectionDetail.hidden = true;
            toolbarSelectionDetail.textContent = "";
          }
        }
      } else {
        toolbarSelectionLabel.hidden = true;
        if (toolbarSelectionSummary instanceof HTMLElement) {
          toolbarSelectionSummary.textContent = "";
        } else {
          toolbarSelectionLabel.textContent = "";
        }
        if (toolbarSelectionDetail instanceof HTMLElement) {
          toolbarSelectionDetail.textContent = "";
          toolbarSelectionDetail.hidden = true;
        }
      }
    }
    toolbarSections.forEach((section) => {
      if (!(section instanceof HTMLElement)) {
        return;
      }
      const targetType = section.dataset.toolsFor;
      const isRelevant = hasSelection && targetType === selection.type;
      const isActive = Boolean(isRelevant && activeToolsType === targetType);
      section.hidden = !isActive;
      section.setAttribute("data-active", isActive ? "true" : "false");
      section.setAttribute("aria-hidden", isActive ? "false" : "true");
    });
    updateToolbarTabs();
    syncColorControls();
    syncEffectControls();
    syncImageSizeControls();
    syncTextboxFormattingControls();
    syncTableStructureControls();
  };

  const clearSelection = () => {
    const activeElement = getSelectedElement();
    if (activeElement) {
      activeElement.classList.remove(SELECTED_CLASS);
    }
    selection.element = null;
    selection.type = null;
    selection.summary = "";
    selection.detail = "";
    setActiveToolsType(null);
    imageSizeReference = null;
    storedTextboxRange = null;
    updateToolbar();
  };

  const setSelection = (element, type) => {
    if (!(element instanceof HTMLElement) || !type) {
      clearSelection();
      return;
    }
    if (selection.element === element && selection.type === type) {
      if (activeToolsType !== type) {
        setActiveToolsType(type, { force: true });
      }
      updateToolbar();
      return;
    }
    const previousElement = getSelectedElement();
    if (previousElement) {
      previousElement.classList.remove(SELECTED_CLASS);
    }
    selection.element = element;
    selection.type = type;
    setActiveToolsType(type, { force: true });
    element.classList.add(SELECTED_CLASS);
    if (type === "image") {
      const width = Math.max(1, element.offsetWidth || 1);
      const height = Math.max(1, element.offsetHeight || 1);
      imageSizeReference = { width, height };
      element.dataset.baseWidth = String(width);
      element.dataset.baseHeight = String(height);
    } else {
      imageSizeReference = null;
    }
    if (type !== "textbox") {
      storedTextboxRange = null;
    } else {
      saveTextboxSelection();
    }
    updateToolbar();
  };

  const stampCanvasItem = (element, { type, source } = {}) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    if (typeof type === "string" && type) {
      element.dataset.canvasItemType = element.dataset.canvasItemType || type;
    }
    if (typeof source === "string" && source) {
      element.dataset.canvasItemSource = source;
    }
    if (!element.dataset.canvasItemCreatedAt) {
      element.dataset.canvasItemCreatedAt = String(Date.now());
    }
    element.dataset.canvasItemVersion = "2";
  };

  const registerCanvasItem = (element, type, { source } = {}) => {
    if (!(element instanceof HTMLElement) || element.__deckCanvasSelectable) {
      return;
    }
    stampCanvasItem(element, { type, source });
    element.__deckCanvasSelectable = true;
    element.classList.add(CANVAS_ITEM_CLASS);
    const pointerHandler = (event) => {
      if (event.button !== undefined && event.button !== 0) {
        return;
      }
      setSelection(element, type);
    };
    const focusHandler = () => setSelection(element, type);
    element.addEventListener("pointerdown", pointerHandler);
    element.addEventListener("focusin", focusHandler);
    registerCleanup(() => {
      element.removeEventListener("pointerdown", pointerHandler);
      element.removeEventListener("focusin", focusHandler);
      element.classList.remove(CANVAS_ITEM_CLASS);
      delete element.__deckCanvasSelectable;
    });
  };

  const applyColor = (value, targetType = selection.type) => {
    const activeElement = getSelectedElement();
    if (!value || !(activeElement instanceof HTMLElement)) {
      return;
    }
    switch (targetType) {
      case "textbox":
        if (typeof activeElement.__deckTextboxSetColor === "function") {
          activeElement.__deckTextboxSetColor(value);
        } else {
          activeElement.dataset.color = value;
        }
        break;
      case "table":
        if (typeof activeElement.__deckTableSetColor === "function") {
          activeElement.__deckTableSetColor(value);
        } else {
          activeElement.dataset.color = value;
        }
        break;
      case "mindmap":
        if (typeof activeElement.__deckMindmapBranchSetColor === "function") {
          activeElement.__deckMindmapBranchSetColor(value);
        } else {
          activeElement.dataset.color = value;
        }
        break;
      default:
        break;
    }
    updateToolbar();
  };

  const prepareTextbox = (textbox, { source } = {}) => {
    if (!(textbox instanceof HTMLElement)) {
      return;
    }
    initialiseTextbox(textbox, {
      onRemove: () => {
        if (selection.element === textbox) {
          clearSelection();
        }
        updateHintForCanvas();
      },
    });
    registerCanvasItem(textbox, "textbox", { source });
  };

  const prepareTable = (table, { source } = {}) => {
    if (!(table instanceof HTMLElement)) {
      return;
    }
    initialiseCanvasTable(table, {
      onRemove: () => {
        if (selection.element === table) {
          clearSelection();
        }
        updateHintForCanvas();
      },
    });
    registerCanvasItem(table, "table", { source });
  };

  const applyImageMetadata = (image, metadata = {}) => {
    if (!(image instanceof HTMLElement)) {
      return;
    }
    const { source, name, type, size, naturalWidth, naturalHeight } = metadata;
    stampCanvasItem(image, { type: "image", source });
    if (!image.dataset.imageIngestedAt) {
      image.dataset.imageIngestedAt = String(Date.now());
    }
    if (typeof name === "string" && name.trim()) {
      image.dataset.imageName = name.trim();
    }
    if (typeof type === "string" && type.trim()) {
      image.dataset.imageType = type.trim();
    }
    if (Number.isFinite(size)) {
      image.dataset.imageSize = String(Math.max(0, Math.round(size)));
    }
    if (Number.isFinite(naturalWidth) && naturalWidth > 0) {
      image.dataset.imageNaturalWidth = String(Math.round(naturalWidth));
    }
    if (Number.isFinite(naturalHeight) && naturalHeight > 0) {
      image.dataset.imageNaturalHeight = String(Math.round(naturalHeight));
    }
  };

  const registerCanvasImage = (image, metadata = {}) => {
    if (!(image instanceof HTMLElement)) {
      return;
    }
    applyImageMetadata(image, metadata);
    initialisePastedImage(image, {
      onRemove: () => {
        if (selection.element === image) {
          clearSelection();
        }
        updateHintForCanvas();
      },
    });
    registerCanvasItem(image, "image", { source: metadata?.source });
  };

  const registerMindmapBranch = (branch, { source } = {}) => {
    if (!(branch instanceof HTMLElement)) {
      return;
    }
    registerCanvasItem(branch, "mindmap", { source });
    const originalChange = branch.__deckMindmapBranchOnChange;
    branch.__deckMindmapBranchOnChange = (payload) => {
      if (typeof originalChange === "function") {
        originalChange(payload);
      }
      if (selection.element === branch) {
        updateToolbar();
      }
    };
    const originalRemove = branch.__deckMindmapBranchOnRemove;
    branch.__deckMindmapBranchOnRemove = () => {
      if (selection.element === branch) {
        clearSelection();
      }
      if (typeof originalRemove === "function") {
        originalRemove();
      }
    };
  };

  const prepareMindmap = (mindmap, { source } = {}) => {
    if (!(mindmap instanceof HTMLElement)) {
      return;
    }
    initialiseMindMap(mindmap, {
      onRemove: () => {
        if (
          selection.element instanceof HTMLElement &&
          mindmap.contains(selection.element)
        ) {
          clearSelection();
        }
        updateHintForCanvas();
      },
    });
    const branches = Array.from(
      mindmap.querySelectorAll?.(".mindmap-branch") ?? [],
    );
    branches.forEach((branch) => registerMindmapBranch(branch, { source }));
    const branchContainer = mindmap.querySelector(".mindmap-branches");
    if (branchContainer instanceof HTMLElement && !branchContainer.__deckMindmapObserver) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.classList.contains("mindmap-branch")) {
              registerMindmapBranch(node, { source });
            }
          });
          mutation.removedNodes.forEach((node) => {
            if (
              node instanceof HTMLElement &&
              node.classList.contains("mindmap-branch") &&
              node === selection.element
            ) {
              clearSelection();
            }
          });
        });
      });
      observer.observe(branchContainer, { childList: true });
      branchContainer.__deckMindmapObserver = observer;
      registerCleanup(() => {
        observer.disconnect();
        delete branchContainer.__deckMindmapObserver;
      });
    }
  };

  if (textboxFormattingContainer instanceof HTMLElement) {
    textboxFormattingContainer.innerHTML = "";
    TEXTBOX_TOOLBAR_CONFIG.forEach((config) => {
      const button = createToolbarButton(config);
      if (button instanceof HTMLButtonElement) {
        button.classList.add("blank-toolbar-action", "blank-toolbar-action--icon");
        textboxFormattingContainer.appendChild(button);
      }
    });
    const handleTextboxToolbarPointerDown = (event) => {
      const target =
        event.target instanceof HTMLElement
          ? event.target.closest("button[data-command]")
          : null;
      if (!target) {
        return;
      }
      event.preventDefault();
    };
    const handleTextboxToolbarClick = (event) => {
      const button =
        event.target instanceof HTMLElement
          ? event.target.closest("button[data-command]")
          : null;
      if (!(button instanceof HTMLButtonElement) || !button.dataset.command) {
        return;
      }
      if (selection.type !== "textbox" || !(getSelectedElement() instanceof HTMLElement)) {
        return;
      }
      event.preventDefault();
      restoreTextboxSelection();
      const body = getActiveTextboxBody();
      if (!(body instanceof HTMLElement)) {
        return;
      }
      body.focus({ preventScroll: true });
      const command = button.dataset.command;
      switch (command) {
        case "bold":
          toggleInlineFormat(body, "STRONG");
          break;
        case "italic":
          toggleInlineFormat(body, "EM");
          break;
        case "underline":
          toggleInlineFormat(body, "U");
          break;
        case "highlight":
          toggleInlineFormat(body, "MARK", { className: "textbox-highlight" });
          break;
        case "bullet-list":
          createListFromRange(body, "UL");
          break;
        case "numbered-list":
          createListFromRange(body, "OL");
          break;
        case "audio-link":
          insertAudioLink(body);
          break;
        default:
          break;
      }
      saveTextboxSelection();
      syncTextboxFormattingControls();
    };
    textboxFormattingContainer.addEventListener(
      "pointerdown",
      handleTextboxToolbarPointerDown,
    );
    textboxFormattingContainer.addEventListener("click", handleTextboxToolbarClick);
    registerCleanup(() => {
      textboxFormattingContainer.removeEventListener(
        "pointerdown",
        handleTextboxToolbarPointerDown,
      );
      textboxFormattingContainer.removeEventListener("click", handleTextboxToolbarClick);
    });
  }

  if (tableStructureContainer instanceof HTMLElement) {
    const handleTableStructureClick = (event) => {
      const button =
        event.target instanceof HTMLElement
          ? event.target.closest("button[data-action]")
          : null;
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }
      const activeElement = getSelectedElement();
      if (selection.type !== "table" || !(activeElement instanceof HTMLElement)) {
        return;
      }
      event.preventDefault();
      const action = button.dataset.action;
      if (
        action === "table-add-column" &&
        typeof activeElement.__deckTableAddColumn === "function"
      ) {
        activeElement.__deckTableAddColumn();
      } else if (
        action === "table-add-row" &&
        typeof activeElement.__deckTableAddRow === "function"
      ) {
        activeElement.__deckTableAddRow();
      }
      updateToolbar();
    };
    tableStructureContainer.addEventListener("click", handleTableStructureClick);
    registerCleanup(() => {
      tableStructureContainer.removeEventListener("click", handleTableStructureClick);
    });
  }

  const handleDocumentSelectionChange = () => {
    if (selection.type !== "textbox") {
      return;
    }
    const body = getActiveTextboxBody();
    if (!(body instanceof HTMLElement)) {
      return;
    }
    const context = getSelectionContextWithin(body);
    if (!context) {
      return;
    }
    storedTextboxRange = context.range.cloneRange();
    syncTextboxFormattingControls();
  };

  document.addEventListener("selectionchange", handleDocumentSelectionChange);
  registerCleanup(() => {
    document.removeEventListener("selectionchange", handleDocumentSelectionChange);
  });

  colorContainers.forEach((container) => {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    container.innerHTML = renderColorSwatchButtons();
    const handleColorClick = (event) => {
      const button =
        event.target instanceof HTMLElement
          ? event.target.closest(".textbox-color-swatch")
          : null;
      if (!(button instanceof HTMLElement) || !button.dataset.color) {
        return;
      }
      const targetType = container.dataset.toolsFor;
      if (targetType && selection.type === targetType) {
        applyColor(button.dataset.color, targetType);
      }
    };
    container.addEventListener("click", handleColorClick);
    registerCleanup(() => {
      container.removeEventListener("click", handleColorClick);
    });
  });

  if (textboxShadowToggle instanceof HTMLInputElement) {
    const handleTextboxEffect = () => {
      const activeElement = getSelectedElement();
      if (selection.type !== "textbox" || !(activeElement instanceof HTMLElement)) {
        return;
      }
      if (textboxShadowToggle.checked) {
        activeElement.dataset.effect = "shadow";
      } else {
        delete activeElement.dataset.effect;
      }
      updateToolbar();
    };
    textboxShadowToggle.addEventListener("change", handleTextboxEffect);
    registerCleanup(() => {
      textboxShadowToggle.removeEventListener("change", handleTextboxEffect);
    });
  }

  if (tableShadowToggle instanceof HTMLInputElement) {
    const handleTableEffect = () => {
      const activeElement = getSelectedElement();
      if (selection.type !== "table" || !(activeElement instanceof HTMLElement)) {
        return;
      }
      if (tableShadowToggle.checked) {
        activeElement.dataset.effect = "shadow";
      } else {
        delete activeElement.dataset.effect;
      }
      updateToolbar();
    };
    tableShadowToggle.addEventListener("change", handleTableEffect);
    registerCleanup(() => {
      tableShadowToggle.removeEventListener("change", handleTableEffect);
    });
  }

  if (mindmapShadowToggle instanceof HTMLInputElement) {
    const handleMindmapEffect = () => {
      const activeElement = getSelectedElement();
      if (selection.type !== "mindmap" || !(activeElement instanceof HTMLElement)) {
        return;
      }
      if (mindmapShadowToggle.checked) {
        activeElement.dataset.effect = "shadow";
      } else {
        delete activeElement.dataset.effect;
      }
      updateToolbar();
    };
    mindmapShadowToggle.addEventListener("change", handleMindmapEffect);
    registerCleanup(() => {
      mindmapShadowToggle.removeEventListener("change", handleMindmapEffect);
    });
  }

  if (imageShadowToggle instanceof HTMLInputElement) {
    const handleImageEffect = () => {
      const activeElement = getSelectedElement();
      if (selection.type !== "image" || !(activeElement instanceof HTMLElement)) {
        return;
      }
      if (imageShadowToggle.checked) {
        activeElement.dataset.effect = "shadow";
      } else {
        delete activeElement.dataset.effect;
      }
      updateToolbar();
    };
    imageShadowToggle.addEventListener("change", handleImageEffect);
    registerCleanup(() => {
      imageShadowToggle.removeEventListener("change", handleImageEffect);
    });
  }

  if (imageSizeInput instanceof HTMLInputElement) {
    const handleImageScale = () => {
      const activeElement = getSelectedElement();
      if (selection.type !== "image" || !(activeElement instanceof HTMLElement)) {
        return;
      }
      const baseWidth = imageSizeReference?.width || activeElement.offsetWidth || 1;
      const baseHeight = imageSizeReference?.height || activeElement.offsetHeight || 1;
      const scale = Number.parseFloat(imageSizeInput.value);
      const factor = Number.isFinite(scale) ? scale / 100 : 1;
      const nextWidth = Math.max(120, Math.round(baseWidth * factor));
      const nextHeight = Math.max(90, Math.round(baseHeight * factor));
      activeElement.style.width = `${nextWidth}px`;
      activeElement.style.height = `${nextHeight}px`;
      if (imageSizeValue instanceof HTMLElement) {
        imageSizeValue.textContent = `${Math.round(factor * 100)}%`;
      }
      updateToolbar();
    };
    imageSizeInput.addEventListener("input", handleImageScale);
    registerCleanup(() => {
      imageSizeInput.removeEventListener("input", handleImageScale);
    });
  }

  if (toolbarTabs instanceof HTMLElement) {
    const handleToolbarTabClick = (event) => {
      const button =
        event.target instanceof HTMLElement
          ? event.target.closest('button[data-tools-target]')
          : null;
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }
      const targetType = button.dataset.toolsTarget;
      if (!targetType || targetType !== selection.type) {
        return;
      }
      setActiveToolsType(targetType);
      updateToolbar();
    };
    toolbarTabs.addEventListener("click", handleToolbarTabClick);
    registerCleanup(() => {
      toolbarTabs.removeEventListener("click", handleToolbarTabClick);
    });
  }

  if (toolbarToggle instanceof HTMLElement) {
    const toggleHandler = () => {
      setToolbarExpanded(!toolbarExpanded);
    };
    toolbarToggle.addEventListener("click", toggleHandler);
    registerCleanup(() => {
      toolbarToggle.removeEventListener("click", toggleHandler);
    });
  }

  if (!canvas.hasAttribute("tabindex")) {
    canvas.setAttribute("tabindex", "0");
  }

  function updateHintForCanvas() {
    blank
      .querySelectorAll('[data-role="hint"], .blank-hint')
      .forEach((existingHint) => {
        if (existingHint instanceof HTMLElement) {
          existingHint.remove();
        }
      });
  }

  const resolveCreationSource = (trigger) => {
    if (!(trigger instanceof HTMLElement)) {
      return "programmatic";
    }
    if (typeof trigger.dataset.canvasSource === "string") {
      return trigger.dataset.canvasSource;
    }
    if (trigger.closest?.('[data-role="blank-actions"]')) {
      return "blank-actions";
    }
    if (trigger.closest?.('.canvas-insert-panel')) {
      return "insert-overlay";
    }
    return "direct";
  };

  const runAfterFrame = (callback) => {
    if (typeof callback !== "function") {
      return;
    }
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        callback();
      });
      return;
    }
    setTimeout(() => {
      callback();
    }, 16);
  };

  const registerCreationAction = (action, handler) => {
    insertController.registerAction(action, (context = {}) => {
      const trigger = context.source instanceof HTMLElement ? context.source : null;
      const origin = resolveCreationSource(trigger);
      let handled = true;
      try {
        const result = handler({ trigger, origin });
        if (result === false) {
          handled = false;
        } else if (result && typeof result.then === "function") {
          result.catch((error) => {
            console.warn(`Canvas creation for ${action} failed`, error);
          });
        }
      } catch (error) {
        console.warn(`Canvas creation for ${action} failed`, error);
        handled = false;
      }
      return handled;
    });
  };

  registerCreationAction("add-textbox", ({ origin }) => {
    const textbox = createTextbox();
    canvas.appendChild(textbox);
    prepareTextbox(textbox, { source: origin });
    positionTextbox(textbox, canvas);
    setSelection(textbox, "textbox");
    runAfterFrame(() => {
      textbox.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      const body = textbox.querySelector(".textbox-body");
      if (body instanceof HTMLElement) {
        body.focus({ preventScroll: true });
      }
    });
    updateHintForCanvas();
    updateCanvasInsertOverlay();
  });

  registerCreationAction("add-table", ({ origin }) => {
    const table = createCanvasTable();
    canvas.appendChild(table);
    prepareTable(table, { source: origin });
    positionCanvasTable(table, canvas);
    setSelection(table, "table");
    updateHintForCanvas();
    runAfterFrame(() => {
      table.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const firstEditableCell = table.querySelector("thead th, tbody td");
      if (firstEditableCell instanceof HTMLElement) {
        firstEditableCell.focus({ preventScroll: true });
      }
    });
    updateCanvasInsertOverlay();
  });

  registerCreationAction("add-mindmap", ({ origin }) => {
    if (canvas.querySelector(".mindmap")) {
      const existing = canvas.querySelector(".mindmap");
      existing?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const mindmap = createMindMap(() => {
      updateHintForCanvas();
    });
    canvas.appendChild(mindmap);
    prepareMindmap(mindmap, { source: origin });
    const firstBranch = mindmap.querySelector(".mindmap-branch");
    if (firstBranch instanceof HTMLElement) {
      setSelection(firstBranch, "mindmap");
      runAfterFrame(() => {
        firstBranch.scrollIntoView({ behavior: "smooth", block: "nearest" });
        firstBranch.focus({ preventScroll: true });
      });
    }
    updateHintForCanvas();
    updateCanvasInsertOverlay();
  });

  registerCreationAction("add-module", ({ trigger, origin }) => {
    openModuleOverlay({
      canvas,
      trigger,
      onInsert: () => {
        updateHintForCanvas();
        updateCanvasInsertOverlay();
      },
      source: origin,
    });
  });

  canvas.querySelectorAll(".textbox").forEach((textbox) => prepareTextbox(textbox));

  canvas.querySelectorAll(".canvas-table").forEach((table) => prepareTable(table));

  canvas.querySelectorAll(".mindmap").forEach((mindmap) => prepareMindmap(mindmap));

  canvas
    .querySelectorAll(".module-embed")
    .forEach((module) => initialiseModuleEmbed(module, { onRemove: updateHintForCanvas }));

  canvas
    .querySelectorAll(".pasted-image")
    .forEach((image) => registerCanvasImage(image));

  const readBlobAsDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      if (!(blob instanceof Blob)) {
        reject(new Error("Invalid image payload"));
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        resolve(typeof reader.result === "string" ? reader.result : "");
      });
      reader.addEventListener("error", () => {
        reject(reader.error ?? new Error("Failed to read image"));
      });
      reader.readAsDataURL(blob);
    });

  const loadImageDimensions = (src) =>
    new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.addEventListener("load", () => {
        resolve({
          width: Math.max(0, image.naturalWidth || 0),
          height: Math.max(0, image.naturalHeight || 0),
        });
      });
      image.addEventListener("error", () => {
        resolve({ width: 0, height: 0 });
      });
      image.src = src;
    });

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const computeInitialImageDimensions = ({ naturalWidth, naturalHeight, canvasElement }) => {
    const canvasWidth = canvasElement instanceof HTMLElement ? canvasElement.clientWidth || 0 : 0;
    const canvasHeight = canvasElement instanceof HTMLElement ? canvasElement.clientHeight || 0 : 0;
    const fallbackWidth = canvasWidth > 0 ? canvasWidth * 0.6 : 320;
    const fallbackHeight = canvasHeight > 0 ? canvasHeight * 0.6 : fallbackWidth * 0.75;
    let width = naturalWidth > 0 ? naturalWidth : fallbackWidth;
    let height = naturalHeight > 0 ? naturalHeight : fallbackHeight;
    if (!(width > 0 && height > 0)) {
      width = fallbackWidth;
      height = fallbackHeight;
    }
    const minWidth = 160;
    const minHeight = 120;
    const maxWidth = clamp(canvasWidth * 0.8 || width, 240, 720);
    const maxHeight = clamp(canvasHeight * 0.8 || height, 180, 540);
    const downScale = Math.min(maxWidth / width, maxHeight / height, 1);
    width *= downScale;
    height *= downScale;
    const upScale = Math.max(minWidth / width, minHeight / height, 1);
    width *= upScale;
    height *= upScale;
    width = clamp(width, minWidth, maxWidth);
    height = clamp(height, minHeight, maxHeight);
    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  };

  const applyInitialImageSizing = (image, { width, height } = {}) => {
    if (!(image instanceof HTMLElement)) {
      return;
    }
    if (Number.isFinite(width) && width > 0) {
      const roundedWidth = Math.round(width);
      image.style.width = `${roundedWidth}px`;
      image.dataset.baseWidth = String(roundedWidth);
    }
    if (Number.isFinite(height) && height > 0) {
      const roundedHeight = Math.round(height);
      image.style.height = `${roundedHeight}px`;
      image.dataset.baseHeight = String(roundedHeight);
    }
  };

  const insertCanvasImage = async ({ dataUrl, metadata }) => {
    if (typeof dataUrl !== "string" || !dataUrl) {
      return null;
    }
    const { name, type, size, source } = metadata ?? {};
    let { naturalWidth = 0, naturalHeight = 0 } = metadata ?? {};
    if (!(naturalWidth > 0 && naturalHeight > 0)) {
      try {
        const dims = await loadImageDimensions(dataUrl);
        naturalWidth = dims.width;
        naturalHeight = dims.height;
      } catch (error) {
        naturalWidth = 0;
        naturalHeight = 0;
      }
    }
    const pastedImage = createPastedImage({
      src: dataUrl,
      label: name,
    });
    canvas.appendChild(pastedImage);
    registerCanvasImage(pastedImage, {
      source,
      name,
      type,
      size,
      naturalWidth,
      naturalHeight,
    });
    const initialSize = computeInitialImageDimensions({
      naturalWidth,
      naturalHeight,
      canvasElement: canvas,
    });
    applyInitialImageSizing(pastedImage, initialSize);
    positionPastedImage(pastedImage, canvas);
    setSelection(pastedImage, "image");
    runAfterFrame(() => {
      pastedImage.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    updateHintForCanvas();
    updateCanvasInsertOverlay();
    canvas.focus({ preventScroll: true });
    return pastedImage;
  };

  const ingestImageFromFile = async (file, { source } = {}) => {
    if (!(file instanceof Blob)) {
      return null;
    }
    const dataUrl = await readBlobAsDataUrl(file);
    if (!dataUrl) {
      return null;
    }
    return insertCanvasImage({
      dataUrl,
      metadata: {
        name: file.name,
        type: file.type,
        size: file.size,
        source: source ?? "file",
      },
    });
  };

  const ingestImageFromDataUrl = async (dataUrl, metadata = {}) =>
    insertCanvasImage({
      dataUrl,
      metadata,
    });

  const handleCanvasPaste = async (event) => {
    const clipboardData = event.clipboardData;
    if (!clipboardData) {
      return;
    }
    const files = Array.from(clipboardData.items ?? [])
      .filter((item) => typeof item.type === "string" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file) => file instanceof Blob);
    if (!files.length) {
      return;
    }
    event.preventDefault();
    for (const file of files) {
      try {
        await ingestImageFromFile(file, { source: "clipboard" });
      } catch (error) {
        console.warn("Unable to ingest clipboard image", error);
      }
    }
  };

  const handleCanvasPasteEvent = (event) => {
    handleCanvasPaste(event).catch((error) => {
      console.warn("Image ingestion failed", error);
    });
  };

  canvas.addEventListener("paste", handleCanvasPasteEvent);
  registerCleanup(() => {
    canvas.removeEventListener("paste", handleCanvasPasteEvent);
  });

  const imageIngestor = {
    ingestFile: (file, options = {}) =>
      ingestImageFromFile(file, options).catch((error) => {
        console.warn("Image ingestion via API failed", error);
        return null;
      }),
    ingestDataUrl: (dataUrl, metadata = {}) =>
      ingestImageFromDataUrl(dataUrl, metadata).catch((error) => {
        console.warn("Image ingestion via API failed", error);
        return null;
      }),
  };

  canvas.__deckImageIngestor = imageIngestor;
  registerCleanup(() => {
    if (canvas.__deckImageIngestor === imageIngestor) {
      delete canvas.__deckImageIngestor;
    }
  });

  const handleCanvasPointerDown = (event) => {
    if (event.target === canvas) {
      clearSelection();
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

  updateToolbar();
  updateHintForCanvas();
  updateCanvasInsertOverlay();
}

export function positionTextbox(textbox, canvas) {
  const count = canvas.querySelectorAll(".textbox").length - 1;
  const offset = 24 * count;
  textbox.style.left = `${offset}px`;
  textbox.style.top = `${offset}px`;
}

const TEXTBOX_TOOLBAR_CONFIG = [
  { command: "bold", icon: "fa-bold", label: "Bold" },
  { command: "italic", icon: "fa-italic", label: "Italic" },
  { command: "underline", icon: "fa-underline", label: "Underline" },
  { command: "bullet-list", icon: "fa-list-ul", label: "Bullet list" },
  { command: "numbered-list", icon: "fa-list-ol", label: "Numbered list" },
  { command: "highlight", icon: "fa-highlighter", label: "Highlight" },
  { command: "audio-link", icon: "fa-headphones", label: "Insert audio link" },
];

const TEXTBOX_CONTENT_ALLOWED_TAGS = new Set([
  "DIV",
  "P",
  "BR",
  "STRONG",
  "EM",
  "U",
  "MARK",
  "UL",
  "OL",
  "LI",
  "A",
  "SPAN",
]);

const TEXTBOX_ATTRIBUTE_ALLOWLIST = {
  MARK: new Set(["class"]),
  A: new Set(["href", "target", "rel", "class"]),
};

const TEXTBOX_ALLOWED_CLASSNAMES = new Set([
  "textbox-highlight",
  "textbox-audio-link",
]);

function createToolbarButton({ command, icon, label }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "textbox-toolbar-btn";
  button.dataset.command = command;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-pressed", "false");
  button.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i>`;
  return button;
}

function findAncestor(node, predicate, boundary) {
  let current =
    node instanceof Node && node.nodeType === Node.TEXT_NODE
      ? node.parentElement
      : node instanceof Element
        ? node
        : null;
  while (current instanceof HTMLElement && current !== boundary) {
    if (predicate(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function getSelectionContextWithin(element) {
  const selection = window.getSelection?.();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0);
  const startContainer =
    range.startContainer instanceof HTMLElement
      ? range.startContainer
      : range.startContainer?.parentElement ?? null;
  const endContainer =
    range.endContainer instanceof HTMLElement
      ? range.endContainer
      : range.endContainer?.parentElement ?? null;
  if (!startContainer || !endContainer) {
    return null;
  }
  if (!element.contains(startContainer) || !element.contains(endContainer)) {
    return null;
  }
  return { selection, range };
}

function unwrapElement(element, { preserveSelection = true } = {}) {
  if (!(element instanceof HTMLElement) || !element.parentNode) {
    return;
  }
  const selection = window.getSelection?.();
  const parent = element.parentNode;
  const fragment = document.createDocumentFragment();
  let firstInserted = null;
  let lastInserted = null;
  while (element.firstChild) {
    const child = element.firstChild;
    element.removeChild(child);
    fragment.appendChild(child);
    if (!firstInserted) {
      firstInserted = child;
    }
    lastInserted = child;
  }
  parent.insertBefore(fragment, element);
  parent.removeChild(element);

  if (preserveSelection && selection && firstInserted && lastInserted) {
    selection.removeAllRanges();
    const range = document.createRange();
    range.setStartBefore(firstInserted);
    range.setEndAfter(lastInserted);
    selection.addRange(range);
  }
}

function wrapRange(range, element) {
  if (!(range instanceof Range) || !(element instanceof HTMLElement)) {
    return null;
  }
  const contents = range.extractContents();
  if (!contents.childNodes.length) {
    contents.appendChild(document.createTextNode("\u200B"));
  }
  element.appendChild(contents);
  range.insertNode(element);
  return element;
}

function ensureRange(range) {
  if (!(range instanceof Range)) {
    return null;
  }
  if (range.collapsed) {
    const placeholder = document.createTextNode("\u200B");
    range.insertNode(placeholder);
    range.selectNode(placeholder);
  }
  return range;
}

function toggleInlineFormat(body, tagName, { className } = {}) {
  const context = getSelectionContextWithin(body);
  if (!context) {
    return;
  }
  const { selection } = context;
  let { range } = context;
  const predicate = (node) =>
    node.tagName === tagName && (!className || node.classList.contains(className));
  const startElement = findAncestor(range.startContainer, predicate, body);
  const endElement = findAncestor(range.endContainer, predicate, body);

  if (startElement && startElement === endElement) {
    unwrapElement(startElement);
    return;
  }

  range = ensureRange(range);
  const wrapper = document.createElement(tagName.toLowerCase());
  if (className) {
    wrapper.classList.add(className);
  }
  const inserted = wrapRange(range, wrapper);
  if (inserted && selection) {
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(inserted);
    selection.addRange(newRange);
  }
}

function createListFromRange(body, listTag) {
  const context = getSelectionContextWithin(body);
  if (!context) {
    return;
  }
  const { selection } = context;
  let { range } = context;

  const predicate = (node) => node.tagName === listTag;
  const startList = findAncestor(range.startContainer, predicate, body);
  const endList = findAncestor(range.endContainer, predicate, body);
  if (startList && startList === endList) {
    unwrapList(startList);
    return;
  }

  if (range.collapsed) {
    const list = document.createElement(listTag.toLowerCase());
    const item = document.createElement("li");
    item.appendChild(document.createElement("br"));
    list.appendChild(item);
    range.insertNode(list);
    if (selection) {
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(item);
      newRange.collapse(true);
      selection.addRange(newRange);
    }
    return;
  }

  range = ensureRange(range);
  const fragment = range.extractContents();
  const list = document.createElement(listTag.toLowerCase());

  let currentItem = document.createElement("li");
  const pushCurrentItem = () => {
    if (!currentItem.hasChildNodes()) {
      currentItem.appendChild(document.createElement("br"));
    }
    list.appendChild(currentItem);
    currentItem = document.createElement("li");
  };

  const consumeChildren = (element) => {
    while (element.firstChild) {
      const child = element.firstChild;
      element.removeChild(child);
      currentItem.appendChild(child);
    }
    pushCurrentItem();
  };

  Array.from(fragment.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      const parts = text.split(/\n/);
      parts.forEach((part, index) => {
        if (part.length) {
          currentItem.appendChild(document.createTextNode(part));
        }
        if (index < parts.length - 1) {
          pushCurrentItem();
        }
      });
      return;
    }
    if (node.nodeName === "BR") {
      pushCurrentItem();
      return;
    }
    if (node instanceof HTMLElement && (node.tagName === "DIV" || node.tagName === "P")) {
      consumeChildren(node);
      return;
    }
    if (node instanceof HTMLElement && node.tagName === listTag) {
      Array.from(node.children).forEach((child) => {
        if (!(child instanceof HTMLElement)) {
          return;
        }
        if (child.tagName !== "LI") {
          currentItem.appendChild(child);
          pushCurrentItem();
          return;
        }
        const li = document.createElement("li");
        while (child.firstChild) {
          li.appendChild(child.firstChild);
        }
        list.appendChild(li);
      });
      currentItem = document.createElement("li");
      return;
    }
    currentItem.appendChild(node);
  });

  if (currentItem.hasChildNodes()) {
    pushCurrentItem();
  }

  if (!list.childElementCount) {
    const item = document.createElement("li");
    item.appendChild(document.createElement("br"));
    list.appendChild(item);
  }

  range.insertNode(list);
  if (selection) {
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(list);
    selection.addRange(newRange);
  }
}

function unwrapList(list) {
  if (!(list instanceof HTMLElement) || !list.parentNode) {
    return;
  }
  const selection = window.getSelection?.();
  const parent = list.parentNode;
  const fragment = document.createDocumentFragment();
  let first = null;
  let last = null;
  Array.from(list.children).forEach((item, index, array) => {
    if (!(item instanceof HTMLElement)) {
      return;
    }
    while (item.firstChild) {
      const child = item.firstChild;
      item.removeChild(child);
      fragment.appendChild(child);
      if (!first) {
        first = child;
      }
      last = child;
    }
    if (index < array.length - 1) {
      const br = document.createElement("br");
      fragment.appendChild(br);
      last = br;
      if (!first) {
        first = br;
      }
    }
  });
  parent.insertBefore(fragment, list);
  parent.removeChild(list);

  if (selection && first && last) {
    selection.removeAllRanges();
    const range = document.createRange();
    range.setStartBefore(first);
    range.setEndAfter(last);
    selection.addRange(range);
  }
}

function insertAudioLink(body) {
  const context = getSelectionContextWithin(body);
  if (!context) {
    return;
  }
  const { selection, range } = context;

  const input = window.prompt?.("Paste the audio URL (https://…)");
  if (!input) {
    return;
  }
  let safeURL;
  try {
    const parsed = new URL(input, window.location.href);
    if (!/^https?:$/i.test(parsed.protocol)) {
      throw new Error("Unsupported protocol");
    }
    safeURL = parsed.href;
  } catch (error) {
    console.warn("Invalid audio URL", error);
    showDeckToast?.("Please enter a valid audio URL (starting with http/https).", {
      icon: "fa-triangle-exclamation",
    });
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = safeURL;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.classList.add("textbox-audio-link");
  if (range.collapsed) {
    anchor.textContent = "Audio link";
    range.insertNode(anchor);
  } else {
    const fragment = range.extractContents();
    anchor.appendChild(fragment);
    range.insertNode(anchor);
  }
  if (selection) {
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNode(anchor);
    selection.addRange(newRange);
  }
}

function updateToolbarState(toolbar, body) {
  if (!(toolbar instanceof HTMLElement)) {
    return;
  }
  const buttons = Array.from(toolbar.querySelectorAll("button[data-command]"));
  if (!buttons.length) {
    return;
  }
  const context = getSelectionContextWithin(body);
  buttons.forEach((button) => {
    const command = button.dataset.command;
    let active = false;
    if (!context) {
      button.setAttribute("aria-pressed", "false");
      button.classList.toggle("is-active", false);
      return;
    }
    const { range } = context;
    switch (command) {
      case "bold":
        active = Boolean(
          findAncestor(range.startContainer, (node) => node.tagName === "STRONG", body),
        );
        break;
      case "italic":
        active = Boolean(
          findAncestor(range.startContainer, (node) => node.tagName === "EM", body),
        );
        break;
      case "underline":
        active = Boolean(
          findAncestor(range.startContainer, (node) => node.tagName === "U", body),
        );
        break;
      case "highlight":
        active = Boolean(
          findAncestor(
            range.startContainer,
            (node) => node.tagName === "MARK" && node.classList.contains("textbox-highlight"),
            body,
          ),
        );
        break;
      case "bullet-list":
        active = Boolean(
          findAncestor(range.startContainer, (node) => node.tagName === "UL", body),
        );
        break;
      case "numbered-list":
        active = Boolean(
          findAncestor(range.startContainer, (node) => node.tagName === "OL", body),
        );
        break;
      case "audio-link":
        active = Boolean(
          findAncestor(
            range.startContainer,
            (node) => node.tagName === "A" && node.classList.contains("textbox-audio-link"),
            body,
          ),
        );
        break;
      default:
        active = false;
    }
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.classList.toggle("is-active", active);
  });
}

function sanitizeTextboxNode(node) {
  if (!(node instanceof Node)) {
    return;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node;
    const tagName = element.tagName.toUpperCase();
    if (!TEXTBOX_CONTENT_ALLOWED_TAGS.has(tagName)) {
      const parent = element.parentNode;
      if (parent) {
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
      }
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        return;
      }
      const allowedForTag = TEXTBOX_ATTRIBUTE_ALLOWLIST[tagName];
      const allowed = allowedForTag?.has(attribute.name) ?? false;
      if (!allowed && attribute.name !== "class") {
        element.removeAttribute(attribute.name);
      }
    });

    if (element.classList.length) {
      const filtered = Array.from(element.classList).filter((className) =>
        TEXTBOX_ALLOWED_CLASSNAMES.has(className),
      );
      if (filtered.length) {
        element.className = filtered.join(" ");
      } else {
        element.removeAttribute("class");
      }
    }

    if (tagName === "MARK") {
      element.classList.add("textbox-highlight");
    }

    if (tagName === "A") {
      const href = element.getAttribute("href") ?? "";
      let safeHref = null;
      try {
        const parsed = new URL(href, window.location.href);
        if (/^https?:$/i.test(parsed.protocol)) {
          safeHref = parsed.href;
        }
      } catch (error) {
        safeHref = null;
      }
      if (!safeHref) {
        const parent = element.parentNode;
        if (parent) {
          while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
          }
          parent.removeChild(element);
        }
        return;
      }
      element.setAttribute("href", safeHref);
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
      element.classList.add("textbox-audio-link");
    }
  }

  Array.from(node.childNodes).forEach((child) => sanitizeTextboxNode(child));
}

function sanitizeTextboxHTML(html) {
  const template = document.createElement("template");
  template.innerHTML = html ?? "";
  Array.from(template.content.childNodes).forEach((child) => sanitizeTextboxNode(child));
  return template.innerHTML;
}

function sanitiseTextboxElement(element) {
  if (!(element instanceof HTMLElement)) {
    return element;
  }
  element.innerHTML = sanitizeTextboxHTML(element.innerHTML);
  return element;
}

function serialiseSlide(slide) {
  if (!(slide instanceof HTMLElement)) {
    return "";
  }
  const clone = slide.cloneNode(true);
  const textboxes = clone.querySelectorAll(".textbox-body");
  textboxes.forEach((body) => {
    if (body instanceof HTMLElement) {
      sanitiseTextboxElement(body);
    }
  });
  return clone.outerHTML;
}

function sanitiseTextboxesIn(root) {
  if (!(root instanceof HTMLElement) && !(root instanceof DocumentFragment)) {
    return;
  }
  const scope = root;
  const bodies = scope.querySelectorAll?.(".textbox-body") ?? [];
  bodies.forEach((body) => {
    if (body instanceof HTMLElement) {
      sanitiseTextboxElement(body);
    }
  });
}

export function createTextbox({ onRemove } = {}) {
  const textbox = document.createElement("div");
  textbox.className = "textbox";
  textbox.dataset.color = DEFAULT_TEXTBOX_COLOR;
  textbox.innerHTML = `
    <button type="button" class="textbox-remove" aria-label="Remove textbox">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
    <div class="textbox-handle textbox-handle--floating">
      <span class="sr-only">Drag textbox</span>
      <i class="fa-solid fa-hand-pointer" aria-hidden="true"></i>
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
  if (body instanceof HTMLElement) {
    sanitiseTextboxElement(body);
  }
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

  const syncTextboxColourState = (target = textbox.dataset.color) => {
    const chosen = target && target.trim() ? target : DEFAULT_TEXTBOX_COLOR;
    textbox.dataset.color = chosen;
    return chosen;
  };

  syncTextboxColourState();
  textbox.__deckTextboxSyncColor = () => syncTextboxColourState();
  textbox.__deckTextboxSetColor = (value) => syncTextboxColourState(value);

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

  const syncColorState = (next = table.dataset.color) => {
    const chosen = next && next.trim() ? next : DEFAULT_TEXTBOX_COLOR;
    table.dataset.color = chosen;
    return chosen;
  };

  syncColorState();
  table.__deckTableSyncColor = () => syncColorState();
  table.__deckTableSetColor = (value) => syncColorState(value);

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

  table.__deckTableAddColumn = () => {
    addColumn();
    if (bodyWrapper instanceof HTMLElement) {
      bodyWrapper.scrollTo({ left: bodyWrapper.scrollWidth, behavior: "smooth" });
    }
  };

  table.__deckTableAddRow = () => {
    addRow();
    if (bodyWrapper instanceof HTMLElement) {
      bodyWrapper.scrollTo({ top: bodyWrapper.scrollHeight, behavior: "smooth" });
    }
  };

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
    <div class="textbox-handle textbox-handle--floating pasted-image-handle">
      <span class="sr-only">Drag image</span>
      <i class="fa-solid fa-hand-pointer" aria-hidden="true"></i>
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

function serialiseModuleConfig(config) {
  if (!config || typeof config !== "object") {
    return null;
  }
  try {
    return JSON.stringify(config);
  } catch (error) {
    console.warn("Unable to serialise module config", error);
    return null;
  }
}

function setModuleConfigOnElement(module, config) {
  if (!(module instanceof HTMLElement)) {
    return;
  }

  const serialised = serialiseModuleConfig(config);

  if (serialised) {
    module.dataset.moduleConfig = serialised;
    let script = module.querySelector(MODULE_CONFIG_SCRIPT_SELECTOR);
    if (!(script instanceof HTMLScriptElement)) {
      script = document.createElement("script");
      script.type = "application/json";
      script.className = "module-embed-config";
    }
    script.textContent = serialised;
    const frame = module.querySelector(".module-embed-frame");
    if (frame instanceof HTMLElement && frame.parentNode === module) {
      module.insertBefore(script, frame);
    } else if (!script.parentNode) {
      module.appendChild(script);
    }
    try {
      module.__deckModuleConfig = JSON.parse(serialised);
    } catch (error) {
      module.__deckModuleConfig = null;
    }
  } else {
    delete module.dataset.moduleConfig;
    const script = module.querySelector(MODULE_CONFIG_SCRIPT_SELECTOR);
    if (script instanceof HTMLScriptElement) {
      script.remove();
    }
    module.__deckModuleConfig = null;
  }
}

function getModuleConfigFromElement(module) {
  if (!(module instanceof HTMLElement)) {
    return null;
  }

  const existing = module.__deckModuleConfig;
  if (existing && typeof existing === "object") {
    return existing;
  }

  let raw = module.dataset.moduleConfig;
  if (!raw) {
    const script = module.querySelector(MODULE_CONFIG_SCRIPT_SELECTOR);
    raw = script?.textContent ?? "";
  }

  if (!raw) {
    module.__deckModuleConfig = null;
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    module.__deckModuleConfig = parsed;
    return parsed;
  } catch (error) {
    console.warn("Unable to parse stored module config", error);
    module.__deckModuleConfig = null;
    return null;
  }
}

function resolveModuleTitle({ title, config, fallback } = {}) {
  return (
    trimText(title) ||
    trimText(config?.data?.title) ||
    trimText(fallback) ||
    "Interactive module"
  );
}

function resolveModuleType({ activityType, config } = {}) {
  if (typeof activityType === "string" && activityType.trim()) {
    return activityType.trim();
  }
  const fromConfig = config?.type;
  return typeof fromConfig === "string" && fromConfig ? fromConfig : "";
}

function updateModuleEmbedContent(
  module,
  { html, title, activityType, config } = {},
) {
  if (!(module instanceof HTMLElement)) {
    return module;
  }

  if (config && typeof config === "object") {
    setModuleConfigOnElement(module, config);
  } else if (!module.dataset.moduleConfig) {
    getModuleConfigFromElement(module);
  }

  const storedConfig = getModuleConfigFromElement(module);
  const resolvedTitle = resolveModuleTitle({
    title,
    config: storedConfig,
    fallback: module.dataset.activityTitle,
  });
  const resolvedType = resolveModuleType({
    activityType,
    config: storedConfig,
  });

  if (resolvedType) {
    module.dataset.activityType = resolvedType;
  } else {
    delete module.dataset.activityType;
  }
  module.dataset.activityTitle = resolvedTitle;

  const pill = module.querySelector(".module-embed-pill");
  if (pill instanceof HTMLElement) {
    pill.textContent = MODULE_TYPE_LABELS[resolvedType] || "Interactive activity";
  }

  const titleEl = module.querySelector(".module-embed-title");
  if (titleEl instanceof HTMLElement) {
    titleEl.textContent = resolvedTitle;
  }

  let frame = module.querySelector(".module-embed-frame");
  if (!(frame instanceof HTMLIFrameElement)) {
    frame = document.createElement("iframe");
    frame.className = "module-embed-frame";
    frame.setAttribute("loading", "lazy");
    module.appendChild(frame);
  }

  frame.setAttribute("title", `${resolvedTitle} interactive module`);

  if (typeof html === "string") {
    frame.srcdoc = html.trim() ? html : MODULE_EMPTY_HTML;
  } else if (!frame.srcdoc || !frame.srcdoc.trim()) {
    frame.srcdoc = MODULE_EMPTY_HTML;
  }

  return module;
}

export function createModuleEmbed({
  html = "",
  title,
  activityType,
  config,
  onRemove,
} = {}) {
  const module = document.createElement("section");
  module.className = "module-embed";

  const resolvedType = resolveModuleType({ activityType, config });
  const resolvedTitle = resolveModuleTitle({ title, config });

  if (resolvedType) {
    module.dataset.activityType = resolvedType;
  }
  module.dataset.activityTitle = resolvedTitle;

  const typeLabel = MODULE_TYPE_LABELS[resolvedType] || "Interactive activity";

  module.innerHTML = `
    <div class="module-embed-header">
      <div class="module-embed-meta">
        <span class="module-embed-pill">${escapeHtml(typeLabel)}</span>
        <span class="module-embed-title">${escapeHtml(resolvedTitle)}</span>
      </div>
      <div class="module-embed-actions">
        <button type="button" class="module-embed-action module-embed-edit" data-action="edit-module">
          <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
          <span class="sr-only">Edit module</span>
        </button>
        <button type="button" class="module-embed-action module-embed-remove" data-action="remove-module">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          <span class="sr-only">Remove module</span>
        </button>
      </div>
    </div>
  `;

  updateModuleEmbedContent(module, {
    html,
    config,
    title: resolvedTitle,
    activityType: resolvedType,
  });

  initialiseModuleEmbed(module, { onRemove });
  return module;
}

export function initialiseModuleEmbed(module, { onRemove } = {}) {
  if (!(module instanceof HTMLElement)) {
    return module;
  }
  module.__deckModuleOnRemove = onRemove ?? module.__deckModuleOnRemove ?? null;

  if (typeof module.__deckModuleCleanup === "function") {
    try {
      module.__deckModuleCleanup();
    } catch (error) {
      console.warn("Module embed cleanup failed", error);
    }
  }

  const cleanupTasks = [];
  const registerCleanup = (callback) => {
    if (typeof callback === "function") {
      cleanupTasks.push(callback);
    }
  };

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
    registerCleanup(() => {
      removeBtn.removeEventListener("click", handleRemove);
    });
  }

  const editBtn = module.querySelector('[data-action="edit-module"]');
  if (editBtn instanceof HTMLElement) {
    const handleEdit = () => {
      const canvas =
        module.closest(".blank-canvas") ??
        (module.parentElement instanceof HTMLElement ? module.parentElement : null);
      const onInsertCallback =
        typeof module.__deckModuleOnRemove === "function"
          ? () => module.__deckModuleOnRemove()
          : null;
      openModuleOverlay({
        canvas,
        trigger: editBtn,
        module,
        onInsert: onInsertCallback,
      });
    };
    editBtn.addEventListener("click", handleEdit);
    registerCleanup(() => {
      editBtn.removeEventListener("click", handleEdit);
    });
  }

  module.__deckModuleCleanup = () => {
    cleanupTasks.forEach((task) => {
      try {
        task();
      } catch (error) {
        console.warn("Module embed cleanup task failed", error);
      }
    });
  };

  getModuleConfigFromElement(module);

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

  header.append(indexBadge, labelInput);
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

  const syncColourState = (target = branch.dataset.color) => {
    const chosen = isValidMindmapColor(target)
      ? target
      : getMindmapColorForCategory(
          branch.dataset.category ?? MINDMAP_BRANCH_PRESETS[0].value,
        );
    branch.dataset.color = chosen;
    return chosen;
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
  branch.__deckMindmapBranchSetColor = (value) => {
    const chosen = syncColourState(value);
    if (typeof branch.__deckMindmapBranchOnChange === "function") {
      branch.__deckMindmapBranchOnChange({
        type: "color",
        value: chosen,
        branch,
      });
    }
  };
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
  const modules = [];
  slides.forEach((slide, slideIndex) => {
    if (!(slide instanceof HTMLElement)) {
      return;
    }
    const moduleNodes = Array.from(slide.querySelectorAll(".module-embed"));
    moduleNodes.forEach((module, moduleIndex) => {
      if (!(module instanceof HTMLElement)) {
        return;
      }
      const storedConfig = getModuleConfigFromElement(module);
      const clonedConfig = cloneModuleConfig(storedConfig);
      if (!clonedConfig) {
        return;
      }
      modules.push({
        slideIndex,
        moduleIndex,
        title: module.dataset.activityTitle ?? null,
        activityType: module.dataset.activityType ?? null,
        config: clonedConfig,
      });
    });
  });
  return {
    version: 2,
    currentSlideIndex,
    slides: slides.map((slide) => serialiseSlide(slide)),
    modules,
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
      sanitiseTextboxesIn(slide);
      fragment.appendChild(slide);
    }
  });

  stageViewport.innerHTML = "";
  stageViewport.appendChild(fragment);
  sanitiseTextboxesIn(stageViewport);
  stageViewport
    .querySelectorAll('[data-editable-processed]')
    .forEach((element) => {
      if (element instanceof HTMLElement) {
        element.removeAttribute("data-editable-processed");
      }
    });
  navButtons.forEach((button) => stageViewport.appendChild(button));

  refreshSlides();
  if (Array.isArray(state.modules)) {
    state.modules.forEach((entry) => {
      if (!entry || typeof entry !== "object") {
        return;
      }
      const { slideIndex, moduleIndex, config, title, activityType } = entry;
      if (!Number.isInteger(slideIndex) || !Number.isInteger(moduleIndex)) {
        return;
      }
      const slide = slides[slideIndex];
      if (!(slide instanceof HTMLElement)) {
        return;
      }
      const moduleNodes = Array.from(slide.querySelectorAll(".module-embed"));
      const targetModule = moduleNodes[moduleIndex];
      if (!(targetModule instanceof HTMLElement)) {
        return;
      }
      updateModuleEmbedContent(targetModule, {
        config,
        title,
        activityType,
      });
    });
  }
  slides
    .filter((slide) => slide.dataset.type === "blank")
    .forEach((slide) => attachBlankSlideEvents(slide));

  initialiseActivities();
  stageViewport
    ?.querySelectorAll(".module-embed")
    .forEach((module) => initialiseModuleEmbed(module));
  initialiseEditableText(stageViewport);
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


const getBuilderLayoutDefaults = (layout = 'blank-canvas') => {
  const factory = BUILDER_LAYOUT_DEFAULTS[layout] || BUILDER_LAYOUT_DEFAULTS['blank-canvas'];
  if (typeof factory === 'function') {
    try {
      return factory();
    } catch (error) {
      console.warn('Unable to generate builder defaults for layout', layout, error);
    }
  }
  return null;
};

function createDialogueItem({ speaker = '', line = '' } = {}) {
  builderFieldId += 1;
  const item = document.createElement('li');
  item.className = 'builder-dynamic-item builder-dialogue-item';
  const safeSpeaker = escapeHtml(speaker ?? '');
  const safeLine = escapeHtml(line ?? '');
  item.innerHTML = `
    <div class="builder-dynamic-fields">
      <label class="builder-field">
        <span class="builder-field-label">Speaker</span>
        <input type="text" name="dialogueSpeaker" placeholder="Speaker name" value="${safeSpeaker}" />
      </label>
      <label class="builder-field builder-field--full">
        <span class="builder-field-label">Dialogue</span>
        <textarea name="dialogueLine" rows="2" placeholder="What does the speaker say?">${safeLine}</textarea>
      </label>
      <button type="button" class="builder-remove-btn" data-action="remove-dialogue">
        <span class="sr-only">Remove dialogue turn</span>
        <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
      </button>
    </div>
  `;
  item.querySelectorAll('input, textarea').forEach((element) => {
    element.addEventListener('input', () => {
      updateBuilderJsonPreview();
      updateBuilderPreview();
    });
  });
  const removeBtn = item.querySelector('[data-action="remove-dialogue"]');
  if (removeBtn instanceof HTMLButtonElement) {
    removeBtn.addEventListener('click', () => {
      item.remove();
      if (builderDialogueList instanceof HTMLElement && builderDialogueList.children.length === 0) {
        addDialogueItem();
      }
      updateBuilderJsonPreview();
      updateBuilderPreview();
    });
  }
  return item;
}

function addDialogueItem(initial = {}) {
  if (!(builderDialogueList instanceof HTMLElement)) {
    return null;
  }
  const item = createDialogueItem(initial);
  builderDialogueList.appendChild(item);
  return item;
}

function resetDialogueList(turns = []) {
  if (!(builderDialogueList instanceof HTMLElement)) {
    return;
  }
  builderDialogueList.innerHTML = '';
  const entries = Array.isArray(turns) && turns.length ? turns : [{}, {}];
  entries.forEach((turn) => addDialogueItem(turn));
}


function createPracticeItem({ prompt = '', options = [], answer = '' } = {}) {
  builderFieldId += 1;
  const item = document.createElement('li');
  item.className = 'builder-dynamic-item builder-practice-item';
  const normalisedOptions = Array.isArray(options) ? options : splitMultiline(options);
  const optionsValue = Array.isArray(normalisedOptions) ? normalisedOptions.join('\n') : '';
  item.innerHTML = `
    <div class="builder-dynamic-fields">
      <label class="builder-field builder-field--full">
        <span class="builder-field-label">Question or prompt</span>
        <input type="text" name="practicePrompt" placeholder="What should learners do?" value="${escapeHtml(prompt ?? '')}" />
      </label>
      <label class="builder-field builder-field--full">
        <span class="builder-field-label">Answer options (one per line)</span>
        <textarea name="practiceOptions" rows="3" placeholder="Option A">${escapeHtml(optionsValue)}</textarea>
      </label>
      <label class="builder-field">
        <span class="builder-field-label">Correct answer</span>
        <input type="text" name="practiceAnswer" placeholder="Correct answer" value="${escapeHtml(answer ?? '')}" />
      </label>
      <button type="button" class="builder-remove-btn" data-action="remove-practice">
        <span class="sr-only">Remove practice item</span>
        <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
      </button>
    </div>
  `;
  item.querySelectorAll('input, textarea').forEach((element) => {
    element.addEventListener('input', () => {
      updateBuilderJsonPreview();
      updateBuilderPreview();
    });
  });
  const removeBtn = item.querySelector('[data-action="remove-practice"]');
  if (removeBtn instanceof HTMLButtonElement) {
    removeBtn.addEventListener('click', () => {
      item.remove();
      if (builderPracticeList instanceof HTMLElement && builderPracticeList.children.length === 0) {
        addPracticeItem();
      }
      updateBuilderJsonPreview();
      updateBuilderPreview();
    });
  }
  return item;
}
function addPracticeItem(initial = {}) {
  if (!(builderPracticeList instanceof HTMLElement)) {
    return null;
  }
  const item = createPracticeItem(initial);
  builderPracticeList.appendChild(item);
  return item;
}

function resetPracticeList(questions = []) {
  if (!(builderPracticeList instanceof HTMLElement)) {
    return;
  }
  builderPracticeList.innerHTML = '';
  const entries = Array.isArray(questions) && questions.length ? questions : [{}];
  entries.forEach((question) => addPracticeItem(question));
}

function applyBuilderLayoutDefaults(layout, { updatePreview = false } = {}) {
  if (!(builderForm instanceof HTMLFormElement)) {
    return;
  }

  const defaults = getBuilderLayoutDefaults(layout);
  if (!defaults) {
    return;
  }

  const setFieldValue = (name, value = '') => {
    const field = builderForm.elements.namedItem?.(name);
    if (!field) {
      return;
    }
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
      field.value = value ?? '';
    }
  };

  const clearFields = () => {
    [
      'learningTitle',
      'learningGoalOne',
      'learningGoalTwo',
      'learningGoalThree',
      'learningCommunicativeGoal',
      'learningImageUrl',
      'dialogueTitle',
      'dialogueInstructions',
      'dialogueImageUrl',
      'dialogueAudioUrl',
      'practiceTitle',
      'practiceInstructions',
      'practiceActivityType',
      'taskTitle',
      'taskImageUrl',
      'taskPreparation',
      'taskPerformance',
      'taskScaffolding',
      'pronunciationTitle',
      'pronunciationTarget',
      'pronunciationWordOne',
      'pronunciationWordTwo',
      'pronunciationSentenceOne',
      'pronunciationSentenceTwo',
      'pronunciationPractice',
      'pronunciationImageUrl',
      'reflectionTitle',
      'reflectionPromptOne',
      'reflectionPromptTwo',
      'reflectionPromptThree',
      'reflectionImageUrl',
    ].forEach((name) => setFieldValue(name, ''));
    resetDialogueList([]);
    resetPracticeList([]);
  };

  clearFields();

  switch (layout) {
    case 'learning-objectives': {
      const goals = Array.isArray(defaults.goals) ? defaults.goals : [];
      setFieldValue('learningTitle', defaults.title ?? '');
      setFieldValue('learningGoalOne', goals[0] ?? '');
      setFieldValue('learningGoalTwo', goals[1] ?? '');
      setFieldValue('learningGoalThree', goals[2] ?? '');
      setFieldValue('learningCommunicativeGoal', defaults.communicativeGoal ?? '');
      setFieldValue('learningImageUrl', defaults.imageUrl ?? '');
      break;
    }
    case 'model-dialogue': {
      setFieldValue('dialogueTitle', defaults.title ?? '');
      setFieldValue('dialogueInstructions', defaults.instructions ?? '');
      setFieldValue('dialogueImageUrl', defaults.imageUrl ?? '');
      setFieldValue('dialogueAudioUrl', defaults.audioUrl ?? '');
      resetDialogueList(defaults.turns);
      break;
    }
    case 'interactive-practice': {
      setFieldValue('practiceTitle', defaults.title ?? '');
      setFieldValue('practiceInstructions', defaults.instructions ?? '');
      setFieldValue('practiceActivityType', defaults.activityType ?? '');
      resetPracticeList(defaults.questions);
      break;
    }
    case 'communicative-task': {
      setFieldValue('taskTitle', defaults.title ?? '');
      setFieldValue('taskImageUrl', defaults.imageUrl ?? '');
      setFieldValue('taskPreparation', defaults.preparation ?? '');
      setFieldValue('taskPerformance', defaults.performance ?? '');
      setFieldValue(
        'taskScaffolding',
        Array.isArray(defaults.scaffolding)
          ? defaults.scaffolding.join('\n')
          : defaults.scaffolding ?? '',
      );
      break;
    }
    case 'pronunciation-focus': {
      setFieldValue('pronunciationTitle', defaults.title ?? '');
      setFieldValue('pronunciationTarget', defaults.target ?? '');
      const words = Array.isArray(defaults.words) ? defaults.words : [];
      setFieldValue('pronunciationWordOne', words[0] ?? '');
      setFieldValue('pronunciationWordTwo', words[1] ?? '');
      const sentences = Array.isArray(defaults.sentences) ? defaults.sentences : [];
      setFieldValue('pronunciationSentenceOne', sentences[0] ?? '');
      setFieldValue('pronunciationSentenceTwo', sentences[1] ?? '');
      setFieldValue('pronunciationPractice', defaults.practice ?? '');
      setFieldValue('pronunciationImageUrl', defaults.imageUrl ?? '');
      break;
    }
    case 'reflection': {
      setFieldValue('reflectionTitle', defaults.title ?? '');
      const prompts = Array.isArray(defaults.prompts) ? defaults.prompts : [];
      setFieldValue('reflectionPromptOne', prompts[0] ?? '');
      setFieldValue('reflectionPromptTwo', prompts[1] ?? '');
      setFieldValue('reflectionPromptThree', prompts[2] ?? '');
      setFieldValue('reflectionImageUrl', defaults.imageUrl ?? '');
      break;
    }
    default:
      break;
  }

  if (updatePreview) {
    updateBuilderJsonPreview();
    updateBuilderPreview();
  }
}

function getBuilderFormState() {
  if (!(builderForm instanceof HTMLFormElement)) {
    return null;
  }
  const formData = new FormData(builderForm);
  const layout = (formData.get('slideLayout') || getSelectedLayout() || 'blank-canvas').toString();
  const state = { layout };
  switch (layout) {
    case 'learning-objectives': {
      const goals = [
        trimText(formData.get('learningGoalOne')),
        trimText(formData.get('learningGoalTwo')),
        trimText(formData.get('learningGoalThree')),
      ].filter(Boolean);
      state.data = {
        title: trimText(formData.get('learningTitle')) || 'Learning Outcomes',
        goals,
        communicativeGoal: trimText(formData.get('learningCommunicativeGoal')),
        imageUrl: trimText(formData.get('learningImageUrl')),
      };
      break;
    }
    case 'model-dialogue': {
      const speakers = formData.getAll('dialogueSpeaker').map((value) => trimText(value));
      const lines = formData.getAll('dialogueLine').map((value) => trimText(value));
      const turns = [];
      const count = Math.max(speakers.length, lines.length);
      for (let index = 0; index < count; index += 1) {
        const speaker = speakers[index] || '';
        const line = lines[index] || '';
        if (speaker || line) {
          turns.push({ speaker, line });
        }
      }
      state.data = {
        title: trimText(formData.get('dialogueTitle')) || 'Model dialogue',
        instructions: trimText(formData.get('dialogueInstructions')),
        imageUrl: trimText(formData.get('dialogueImageUrl')),
        audioUrl: trimText(formData.get('dialogueAudioUrl')),
        turns,
      };
      break;
    }
    case 'interactive-practice': {
      const prompts = formData.getAll('practicePrompt').map((value) => trimText(value));
      const optionsList = formData.getAll('practiceOptions');
      const answers = formData.getAll('practiceAnswer').map((value) => trimText(value));
      const count = Math.max(prompts.length, optionsList.length, answers.length);
      const questions = [];
      for (let index = 0; index < count; index += 1) {
        const prompt = prompts[index] || '';
        const options = splitMultiline(optionsList[index]);
        const answer = answers[index] || '';
        if (prompt || options.length || answer) {
          questions.push({ prompt, options, answer });
        }
      }
      state.data = {
        activityType: trimText(formData.get('practiceActivityType')),
        title: trimText(formData.get('practiceTitle')) || 'Practice',
        instructions: trimText(formData.get('practiceInstructions')),
        questions,
      };
      break;
    }
    case 'communicative-task': {
      state.data = {
        title: trimText(formData.get('taskTitle')) || 'Communicative task',
        imageUrl: trimText(formData.get('taskImageUrl')),
        preparation: trimText(formData.get('taskPreparation')),
        performance: trimText(formData.get('taskPerformance')),
        scaffolding: splitMultiline(formData.get('taskScaffolding')),
      };
      break;
    }
    case 'pronunciation-focus': {
      const words = [
        trimText(formData.get('pronunciationWordOne')),
        trimText(formData.get('pronunciationWordTwo')),
      ].filter(Boolean);
      const sentences = [
        trimText(formData.get('pronunciationSentenceOne')),
        trimText(formData.get('pronunciationSentenceTwo')),
      ].filter(Boolean);
      state.data = {
        title: trimText(formData.get('pronunciationTitle')) || 'Pronunciation focus',
        target: trimText(formData.get('pronunciationTarget')),
        words,
        sentences,
        practice: trimText(formData.get('pronunciationPractice')),
        imageUrl: trimText(formData.get('pronunciationImageUrl')),
      };
      break;
    }
    case 'reflection': {
      const prompts = [
        trimText(formData.get('reflectionPromptOne')),
        trimText(formData.get('reflectionPromptTwo')),
        trimText(formData.get('reflectionPromptThree')),
      ].filter(Boolean);
      state.data = {
        title: trimText(formData.get('reflectionTitle')) || 'Reflection',
        prompts,
        imageUrl: trimText(formData.get('reflectionImageUrl')),
      };
      break;
    }
    default:
      break;
  }
  return state;
}

function updateBuilderJsonPreview() {
  if (!(builderJsonPreview instanceof HTMLElement)) {
    return;
  }
  const state = getBuilderFormState();
  if (!state) {
    builderJsonPreview.textContent = '{}';
    return;
  }
  builderJsonPreview.textContent = JSON.stringify(state, null, 2);
}

function syncBuilderLayout(layout = getSelectedLayout()) {
  if (!(builderForm instanceof HTMLFormElement)) {
    return;
  }
  const targetLayout = layout || getSelectedLayout() || 'blank-canvas';
  setSelectedLayout(targetLayout);
  if (Array.isArray(builderLayoutInputs)) {
    builderLayoutInputs.forEach((input) => {
      if (!(input instanceof HTMLInputElement)) {
        return;
      }
      const parent = input.closest('.layout-option');
      if (parent instanceof HTMLElement) {
        parent.classList.toggle('is-selected', input.checked);
      }
    });
  }
  const blocks = builderForm.querySelectorAll('[data-layouts]');
  blocks.forEach((block) => {
    const layouts = (block.dataset.layouts || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const isVisible = !layouts.length || layouts.includes(targetLayout);
    block.hidden = !isVisible;
    const controls = block.querySelectorAll('input, textarea, select');
    controls.forEach((control) => {
      if (!(control instanceof HTMLElement)) {
        return;
      }
      if (isVisible) {
        control.removeAttribute('disabled');
      } else {
        control.setAttribute('disabled', 'disabled');
      }
    });
  });
}

function updateBuilderPreview() {
  if (!(builderPreview instanceof HTMLElement)) {
    return;
  }
  const state = getBuilderFormState();
  builderPreview.classList.remove('has-content');
  builderPreview.innerHTML = '';
  if (!state) {
    return;
  }
  if (state.layout === 'blank-canvas') {
    const blankSlide = createBlankSlide();
    if (blankSlide instanceof HTMLElement) {
      const previewSlide = blankSlide.cloneNode(true);
      previewSlide.classList.remove('hidden');
      builderPreview.appendChild(previewSlide);
      builderPreview.classList.add('has-content');
    }
    return;
  }
  let slide = null;
  switch (state.layout) {
    case 'learning-objectives':
      slide = createLearningObjectivesSlide(state.data);
      break;
    case 'model-dialogue':
      slide = createModelDialogueSlide(state.data);
      break;
    case 'interactive-practice':
      slide = createInteractivePracticeSlide(state.data);
      break;
    case 'communicative-task':
      slide = createCommunicativeTaskSlide(state.data);
      break;
    case 'pronunciation-focus':
      slide = createPronunciationFocusSlide(state.data);
      break;
    case 'reflection':
      slide = createReflectionSlide(state.data);
      break;
    default:
      break;
  }
  if (slide instanceof HTMLElement) {
    const previewSlide = slide.cloneNode(true);
    previewSlide.classList.remove('hidden');
    builderPreview.appendChild(previewSlide);
    builderPreview.classList.add('has-content');
  }
}

function updateImageSearchStatus(message = '', tone = 'info') {
  if (!(builderImageStatus instanceof HTMLElement)) {
    return;
  }
  builderImageStatus.textContent = message;
  if (message) {
    builderImageStatus.dataset.tone = tone;
  } else {
    builderImageStatus.removeAttribute('data-tone');
  }
}

function renderImageSearchResults(photos = []) {
  if (!(builderImageResults instanceof HTMLElement)) {
    return;
  }
  builderImageResults.innerHTML = '';
  if (!Array.isArray(photos) || !photos.length) {
    return;
  }
  photos.forEach((photo, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'image-result';
    button.dataset.url = photo.src?.large2x || photo.src?.large || '';
    button.dataset.alt = photo.alt || '';
    button.dataset.id = String(photo.id ?? index);
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', 'false');
    const img = document.createElement('img');
    img.src = photo.src?.medium || photo.src?.small || photo.src?.tiny || '';
    img.alt = photo.alt || 'Search result';
    img.loading = 'lazy';
    img.decoding = 'async';
    button.appendChild(img);
    builderImageResults.appendChild(button);
  });
}

function selectImageResult(button) {
  if (!(button instanceof HTMLElement)) {
    return;
  }
  const url = button.dataset.url || '';
  if (builderImageResults instanceof HTMLElement) {
    builderImageResults
      .querySelectorAll('.image-result')
      .forEach((item) => {
        item.classList.remove('is-selected');
        item.setAttribute('aria-selected', 'false');
      });
  }
  button.classList.add('is-selected');
  button.setAttribute('aria-selected', 'true');
  const layout = getSelectedLayout();
  const fieldMap = {
    'learning-objectives': 'learningImageUrl',
    'model-dialogue': 'dialogueImageUrl',
    'interactive-practice': null,
    'communicative-task': 'taskImageUrl',
    'pronunciation-focus': 'pronunciationImageUrl',
    reflection: 'reflectionImageUrl',
  };
  const targetName = fieldMap[layout];
  if (targetName) {
    const targetField = builderForm?.elements.namedItem?.(targetName);
    if (targetField instanceof HTMLInputElement) {
      targetField.value = url;
      targetField.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}

function handleImageSearch() {
  const query = trimText(builderImageSearchInput?.value ?? '');
  searchPexelsImages(query);
}

async function searchPexelsImages(query) {
  if (!query) {
    updateImageSearchStatus('Enter a keyword to search for lesson visuals.', 'info');
    renderImageSearchResults([]);
    return;
  }
  updateImageSearchStatus('Searching Pexels...', 'info');
  if (!PEXELS_API_KEY) {
    updateImageSearchStatus('Pexels search is unavailable.', 'error');
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
      updateImageSearchStatus('No images found. Try another term.', 'info');
    } else {
      updateImageSearchStatus(`Found ${photos.length} image${photos.length === 1 ? '' : 's'}.`, 'success');
    }
    renderImageSearchResults(photos);
  } catch (error) {
    console.warn('Image search failed', error);
    updateImageSearchStatus("We couldn't fetch images right now.", 'error');
  }
}

function resetBuilderForm() {
  if (builderForm instanceof HTMLFormElement) {
    builderForm.reset();
  }
  resetDialogueList([]);
  resetPracticeList([]);
  if (builderImageResults instanceof HTMLElement) {
    builderImageResults.innerHTML = '';
  }
  if (builderImageSearchInput instanceof HTMLInputElement) {
    builderImageSearchInput.value = '';
  }
  updateImageSearchStatus('', 'info');
  setSelectedLayout('blank-canvas');
  syncBuilderLayout('blank-canvas');
  applyBuilderLayoutDefaults('blank-canvas', { updatePreview: true });
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
  const activeLayout = getSelectedLayout();
  applyBuilderLayoutDefaults(activeLayout, { updatePreview: false });
  syncBuilderLayout(activeLayout);
  updateBuilderJsonPreview();
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

function handleBuilderKeydown(event) {
  if (event.key === 'Escape') {
    closeBuilderOverlay({ reset: false, focus: true });
  }
}

function handleModuleOverlayKeydown(event) {
  if (event.key === "Escape") {
    closeModuleOverlay({ focus: true });
  }
}

function cloneModuleConfig(config) {
  const serialised = serialiseModuleConfig(config);
  if (!serialised) {
    return null;
  }
  try {
    return JSON.parse(serialised);
  } catch (error) {
    console.warn("Unable to clone module config", error);
    return null;
  }
}

function sendModuleConfigToBuilder(config) {
  if (!(moduleFrame instanceof HTMLIFrameElement)) {
    return;
  }
  if (!config || typeof config !== "object") {
    return;
  }
  try {
    moduleFrame.contentWindow?.postMessage(
      { source: "noor-deck", type: "activity-module-load", config },
      "*",
    );
  } catch (error) {
    console.warn("Unable to deliver module config to builder", error);
  }
}

function openModuleOverlay({ canvas, trigger, module, onInsert } = {}) {
  if (!(moduleOverlay instanceof HTMLElement)) {
    console.warn("Module builder overlay is unavailable.");
    return false;
  }
  if (!(moduleFrame instanceof HTMLIFrameElement)) {
    console.warn("Module builder frame is unavailable.");
    return false;
  }

  const targetCanvas =
    module instanceof HTMLElement
      ? module.closest(".blank-canvas") ??
        (module.parentElement instanceof HTMLElement ? module.parentElement : null)
      : canvas;

  if (!(targetCanvas instanceof HTMLElement)) {
    console.warn("Module builder requires a target canvas element.");
    return false;
  }

  moduleTargetCanvas = targetCanvas;
  moduleInsertCallback = typeof onInsert === "function" ? onInsert : null;
  moduleEditTarget = module instanceof HTMLElement ? module : null;
  modulePendingConfig = moduleEditTarget
    ? cloneModuleConfig(getModuleConfigFromElement(moduleEditTarget))
    : null;
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

  if (moduleEditTarget && moduleBuilderReady && modulePendingConfig) {
    sendModuleConfigToBuilder(modulePendingConfig);
  }

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
    moduleEditTarget = null;
    modulePendingConfig = null;
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
  if (data.status === "ready") {
    moduleBuilderReady = true;
    if (modulePendingConfig) {
      sendModuleConfigToBuilder(modulePendingConfig);
    }
    return;
  }

  if (data.status === "loaded") {
    modulePendingConfig = null;
    return;
  }

  if (!(moduleTargetCanvas instanceof HTMLElement)) {
    closeModuleOverlay({ focus: true });
    return;
  }

  const html = typeof data.html === "string" ? data.html : "";
  const config =
    data.config && typeof data.config === "object" ? data.config : null;
  const afterInsert = typeof moduleInsertCallback === "function" ? moduleInsertCallback : null;

  if (
    moduleEditTarget instanceof HTMLElement &&
    moduleTargetCanvas.contains(moduleEditTarget)
  ) {
    updateModuleEmbedContent(moduleEditTarget, {
      html,
      config,
      title: config?.data?.title,
      activityType: config?.type,
    });
    moduleEditTarget.scrollIntoView({ behavior: "smooth", block: "center" });
    afterInsert?.();
    moduleInsertCallback = null;
    modulePendingConfig = null;
    moduleEditTarget = null;
    try {
      event.source?.postMessage(
        { source: "noor-deck", type: "activity-module", status: "updated" },
        "*",
      );
    } catch (error) {
      console.warn("Unable to confirm module update", error);
    }
    closeModuleOverlay({ focus: true });
    return;
  }

  const moduleElement = createModuleEmbed({
    html,
    title: config?.data?.title,
    activityType: config?.type,
    config,
    onRemove: () => {
      afterInsert?.();
    },
  });

  moduleTargetCanvas.appendChild(moduleElement);
  moduleElement.scrollIntoView({ behavior: "smooth", block: "center" });
  afterInsert?.();
  moduleInsertCallback = null;
  modulePendingConfig = null;
  moduleEditTarget = null;

  try {
    event.source?.postMessage({ source: "noor-deck", type: "activity-module", status: "inserted" }, "*");
  } catch (error) {
    console.warn("Unable to confirm module receipt", error);
  }

  closeModuleOverlay({ focus: true });
}

async function resolveModuleBuilderUrl() {
  if (moduleBuilderUrl) {
    return moduleBuilderUrl;
  }

  if (moduleBuilderUrlPromise) {
    try {
      moduleBuilderUrl = await moduleBuilderUrlPromise;
      return moduleBuilderUrl;
    } catch (error) {
      console.warn("Module builder URL resolution failed", error);
      moduleBuilderUrlPromise = null;
    }
  }

  const gatherCandidates = () => {
    const seen = new Set();
    const candidates = [];
    const addCandidate = (value) => {
      if (typeof value !== "string") {
        return;
      }
      const trimmed = value.trim();
      if (!trimmed || trimmed === "about:blank" || seen.has(trimmed)) {
        return;
      }
      seen.add(trimmed);
      candidates.push(trimmed);
    };

    if (moduleFrame instanceof HTMLIFrameElement) {
      addCandidate(moduleFrame.dataset?.builderSrc);
      addCandidate(moduleFrame.getAttribute("data-builder-src"));
      addCandidate(moduleFrame.getAttribute("src"));
    }

    addCandidate("./activity-builder.html");

    return candidates;
  };

  const resolveAgainstBases = (value) => {
    const resolved = [];
    const addResolved = (url) => {
      if (typeof url !== "string") {
        return;
      }
      const trimmed = url.trim();
      if (trimmed && !resolved.includes(trimmed)) {
        resolved.push(trimmed);
      }
    };

    if (!value) {
      return resolved;
    }

    const bases = [];
    try {
      if (typeof import.meta.url === "string") {
        bases.push(import.meta.url);
      }
    } catch (error) {
      /* noop */
    }

    if (typeof document !== "undefined" && typeof document.baseURI === "string") {
      bases.push(document.baseURI);
    }

    if (
      typeof window !== "undefined" &&
      window.location &&
      typeof window.location.href === "string"
    ) {
      bases.push(window.location.href);
    }

    if (bases.length === 0) {
      addResolved(value);
      return resolved;
    }

    bases.forEach((base) => {
      try {
        addResolved(new URL(value, base).href);
      } catch (error) {
        /* noop */
      }
    });

    return resolved;
  };

  moduleBuilderUrlPromise = (async () => {
    const candidates = gatherCandidates();
    const absoluteCandidates = candidates
      .map((candidate) => resolveAgainstBases(candidate))
      .reduce((acc, urls) => acc.concat(urls), []);

    const uniqueAbsoluteCandidates = absoluteCandidates.filter(
      (url, index, list) => list.indexOf(url) === index,
    );

    if (typeof fetch === "function") {
      for (const url of uniqueAbsoluteCandidates) {
        try {
          const response = await fetch(url, { method: "HEAD" });
          if (response.ok) {
            moduleBuilderUrl = url;
            return url;
          }
        } catch (error) {
          console.warn(`Module builder probe failed for ${url}`, error);
        }
      }
    }

    const fallback = uniqueAbsoluteCandidates[0] ?? candidates[0] ?? "./activity-builder.html";
    moduleBuilderUrl = fallback;
    return fallback;
  })();

  try {
    moduleBuilderUrl = await moduleBuilderUrlPromise;
    return moduleBuilderUrl;
  } catch (error) {
    console.warn("Module builder URL probe failed", error);
    moduleBuilderUrl = "./activity-builder.html";
    return moduleBuilderUrl;
  } finally {
    moduleBuilderUrlPromise = null;
  }
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

  if (moduleFrame instanceof HTMLIFrameElement) {
    moduleFrame.addEventListener("load", () => {
      moduleBuilderReady = false;
      if (moduleEditTarget instanceof HTMLElement) {
        modulePendingConfig = cloneModuleConfig(
          getModuleConfigFromElement(moduleEditTarget),
        );
      }
    });
  }

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
  rubricEnabled = true,
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
  if (!rubricEnabled) {
    bodyGrid.classList.add("activity-body-grid--single");
  }
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

  if (rubricEnabled) {
    const rubricSection = buildRubricSection({
      heading: rubricHeadingText,
      intro: rubricIntro,
      rubric,
    });
    bodyGrid.appendChild(rubricSection);
  }

  const rubricLevels = Array.isArray(rubric?.levels) ? rubric.levels : [];
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

  if (!rubricEnabled) {
    copyBtn.hidden = true;
    toggleBtn.hidden = true;
    delete slide.dataset.rubric;
  } else {
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
  rubricEnabled = true,
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

  if (rubricEnabled) {
    const rubricSection = buildRubricSection({
      heading: rubricHeadingText,
      intro: rubricIntro,
      rubric,
      className: "activity-rubric activity-rubric--simple",
    });
    body.appendChild(rubricSection);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "Success criteria are hidden for this layout.";
    body.appendChild(placeholder);
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

  const rubricCriteria = Array.isArray(rubric?.criteria) ? rubric.criteria : [];

  if (!rubricEnabled) {
    copyBtn.hidden = true;
    toggleBtn.hidden = true;
    delete slide.dataset.rubric;
  } else {
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
  rubricEnabled = true,
} = {}) {
  const resolvedTitle = trimText(title) || "Collaborative discussion";
  const headingTitle = trimText(slideTitle) || "Discussion prompts";
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
  if (!rubricEnabled) {
    layout.classList.add("activity-columns-layout--no-rubric");
  }
  inner.appendChild(layout);

  if (rubricEnabled) {
    const rubricSection = buildRubricSection({
      heading: "Success criteria",
      intro: rubricIntro,
      rubric,
      className: "activity-rubric activity-rubric--wide",
    });
    layout.appendChild(rubricSection);
  }

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

  if (!rubricEnabled) {
    copyBtn.hidden = true;
    toggleBtn.hidden = true;
    delete slide.dataset.rubric;
  } else {
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
  rubricEnabled = true,
} = {}) {
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
  if (!rubricEnabled) {
    spotlightLayout.classList.add("activity-spotlight-layout--no-rubric");
  }
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

  if (rubricEnabled) {
    const rubricSection = buildRubricSection({
      heading: "Success criteria",
      intro: rubricIntro,
      rubric,
      className: "activity-rubric activity-rubric--spotlight",
    });
    spotlightLayout.appendChild(rubricSection);
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

  if (!rubricEnabled) {
    copyBtn.hidden = true;
    toggleBtn.hidden = true;
    delete slide.dataset.rubric;
  } else {
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
  rubricEnabled = true,
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
  if (!rubricEnabled) {
    layout.classList.add("activity-card-layout--no-rubric");
  }
  inner.appendChild(layout);

  if (rubricEnabled) {
    const rubricSection = buildRubricSection({
      heading: "Success criteria",
      intro: rubricIntro,
      rubric,
    });
    layout.appendChild(rubricSection);
  }

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

  if (!rubricEnabled) {
    copyBtn.hidden = true;
    toggleBtn.hidden = true;
    delete slide.dataset.rubric;
  } else {
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
  }

  slide.dataset.activityTitle = resolvedTitle;
  return slide;
}

function createVocabularyGridSlide({
  stageLabel = "Language lab",
  title,
  duration,
  rubric = { criteria: [], levels: [] },
  rubricIntro,
  vocabulary = {},
  rubricEnabled = true,
} = {}) {
  const resolvedTitle = trimText(title) || "Vocabulary grid";

  const slide = document.createElement("div");
  slide.className = "slide-stage hidden activity-slide activity-slide--vocabulary";
  slide.dataset.type = "activity";
  slide.dataset.activity = "rubric";

  const inner = document.createElement("div");
  inner.className = "slide-inner activity-builder-slide activity-builder-slide--vocabulary";
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
  layout.className = "activity-vocab-layout";
  if (!rubricEnabled) {
    layout.classList.add("activity-vocab-layout--no-rubric");
  }
  inner.appendChild(layout);

  const content = document.createElement("div");
  content.className = "activity-vocab-content";
  layout.appendChild(content);

  const focusSection = document.createElement("section");
  focusSection.className = "activity-vocab-focus";
  content.appendChild(focusSection);

  const focusHeading = document.createElement("h3");
  const focusIcon = document.createElement("i");
  focusIcon.className = "fa-solid fa-language";
  focusIcon.setAttribute("aria-hidden", "true");
  focusHeading.appendChild(focusIcon);
  focusHeading.appendChild(document.createTextNode(" Target language focus"));
  focusSection.appendChild(focusHeading);

  const targetLanguage = trimText(vocabulary?.targetLanguage);
  if (targetLanguage) {
    const targetParagraph = document.createElement("p");
    targetParagraph.className = "vocab-target";
    targetParagraph.textContent = targetLanguage;
    focusSection.appendChild(targetParagraph);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "Describe the target language outcome for learners.";
    focusSection.appendChild(placeholder);
  }

  const detailsList = document.createElement("ul");
  detailsList.className = "vocab-detail-list";
  const skillsFocus = trimText(vocabulary?.skillsFocus);
  if (skillsFocus) {
    const item = document.createElement("li");
    const label = document.createElement("strong");
    label.textContent = "Skills focus:";
    item.appendChild(label);
    item.appendChild(document.createTextNode(` ${skillsFocus}`));
    detailsList.appendChild(item);
  }
  const cefr = trimText(vocabulary?.cefr);
  if (cefr) {
    const item = document.createElement("li");
    const label = document.createElement("strong");
    label.textContent = "CEFR target:";
    item.appendChild(label);
    item.appendChild(document.createTextNode(` ${cefr}`));
    detailsList.appendChild(item);
  }
  if (detailsList.childElementCount) {
    focusSection.appendChild(detailsList);
  }

  const practiceIdeas = Array.isArray(vocabulary?.practiceIdeas)
    ? vocabulary.practiceIdeas.filter(Boolean)
    : [];
  const practiceSection = document.createElement("div");
  practiceSection.className = "vocab-practice";
  const practiceHeading = document.createElement("h4");
  const practiceIcon = document.createElement("i");
  practiceIcon.className = "fa-solid fa-person-chalkboard";
  practiceIcon.setAttribute("aria-hidden", "true");
  practiceHeading.appendChild(practiceIcon);
  practiceHeading.appendChild(document.createTextNode(" Practice ideas"));
  practiceSection.appendChild(practiceHeading);
  if (practiceIdeas.length) {
    const practiceList = document.createElement("ul");
    practiceList.className = "vocab-practice-list";
    practiceIdeas.forEach((idea) => {
      const li = document.createElement("li");
      li.textContent = idea;
      practiceList.appendChild(li);
    });
    practiceSection.appendChild(practiceList);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "Add prompts learners can use to recycle the vocabulary.";
    practiceSection.appendChild(placeholder);
  }
  focusSection.appendChild(practiceSection);

  const bankSection = document.createElement("section");
  bankSection.className = "activity-vocab-bank";
  content.appendChild(bankSection);

  const bankHeading = document.createElement("h3");
  const bankIcon = document.createElement("i");
  bankIcon.className = "fa-solid fa-table-cells-large";
  bankIcon.setAttribute("aria-hidden", "true");
  bankHeading.appendChild(bankIcon);
  bankHeading.appendChild(document.createTextNode(" Vocabulary bank"));
  bankSection.appendChild(bankHeading);

  const vocabItems = Array.isArray(vocabulary?.items)
    ? vocabulary.items.filter((item) => item.term || item.definition || item.example)
    : [];
  const grid = document.createElement("div");
  grid.className = "vocab-grid";
  bankSection.appendChild(grid);

  if (vocabItems.length) {
    vocabItems.forEach((item) => {
      const card = document.createElement("article");
      card.className = "vocab-card";
      if (item.term) {
        const termHeading = document.createElement("h4");
        termHeading.textContent = item.term;
        card.appendChild(termHeading);
      }
      if (item.definition) {
        const definitionParagraph = document.createElement("p");
        definitionParagraph.className = "vocab-definition";
        definitionParagraph.textContent = item.definition;
        card.appendChild(definitionParagraph);
      }
      if (item.example) {
        const exampleParagraph = document.createElement("p");
        exampleParagraph.className = "vocab-example";
        exampleParagraph.textContent = item.example;
        card.appendChild(exampleParagraph);
      }
      grid.appendChild(card);
    });
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "Add vocabulary entries with definitions and model sentences.";
    grid.appendChild(placeholder);
  }

  if (rubricEnabled) {
    const rubricSection = buildRubricSection({
      heading: "Success criteria",
      intro: rubricIntro,
      rubric,
    });
    layout.appendChild(rubricSection);
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

  if (!rubricEnabled) {
    copyBtn.hidden = true;
    toggleBtn.hidden = true;
    delete slide.dataset.rubric;
  } else {
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
  }

  slide.dataset.activityTitle = resolvedTitle;
  return slide;
}

function createReadingComprehensionSlide({
  stageLabel = "Reading workshop",
  title,
  duration,
  rubric = { criteria: [], levels: [] },
  rubricIntro,
  reading = {},
  rubricEnabled = true,
} = {}) {
  const resolvedTitle = trimText(title) || "Reading comprehension";

  const slide = document.createElement("div");
  slide.className = "slide-stage hidden activity-slide activity-slide--reading";
  slide.dataset.type = "activity";
  slide.dataset.activity = "rubric";

  const inner = document.createElement("div");
  inner.className = "slide-inner activity-builder-slide activity-builder-slide--reading";
  slide.appendChild(inner);

  const header = document.createElement("header");
  header.className = "activity-slide-header";
  inner.appendChild(header);

  const pill = document.createElement("span");
  pill.className = "pill activity-pill";
  const pillIcon = document.createElement("i");
  pillIcon.className = "fa-solid fa-book-open";
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
  layout.className = "activity-reading-layout";
  if (!rubricEnabled) {
    layout.classList.add("activity-reading-layout--no-rubric");
  }
  inner.appendChild(layout);

  const body = document.createElement("div");
  body.className = "reading-body";
  layout.appendChild(body);

  const excerptSection = document.createElement("article");
  excerptSection.className = "reading-excerpt";
  body.appendChild(excerptSection);

  const excerptHeading = document.createElement("h3");
  const excerptIcon = document.createElement("i");
  excerptIcon.className = "fa-solid fa-newspaper";
  excerptIcon.setAttribute("aria-hidden", "true");
  excerptHeading.appendChild(excerptIcon);
  const readingTitle = trimText(reading?.textTitle) || "Reading excerpt";
  excerptHeading.appendChild(document.createTextNode(` ${readingTitle}`));
  excerptSection.appendChild(excerptHeading);

  const source = trimText(reading?.textSource);
  if (source) {
    const sourceBadge = document.createElement("p");
    sourceBadge.className = "reading-source";
    sourceBadge.textContent = source;
    excerptSection.appendChild(sourceBadge);
  }

  const excerptText = trimText(reading?.excerpt);
  if (excerptText) {
    const paragraph = document.createElement("p");
    paragraph.className = "reading-excerpt-body";
    paragraph.textContent = excerptText;
    excerptSection.appendChild(paragraph);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "Paste a short excerpt that learners will read.";
    excerptSection.appendChild(placeholder);
  }

  const preTasks = Array.isArray(reading?.preTasks)
    ? reading.preTasks.filter(Boolean)
    : [];
  const preSection = document.createElement("section");
  preSection.className = "reading-pretasks";
  const preHeading = document.createElement("h4");
  const preIcon = document.createElement("i");
  preIcon.className = "fa-solid fa-compass";
  preIcon.setAttribute("aria-hidden", "true");
  preHeading.appendChild(preIcon);
  preHeading.appendChild(document.createTextNode(" Pre-reading focus"));
  preSection.appendChild(preHeading);
  if (preTasks.length) {
    const list = document.createElement("ul");
    list.className = "reading-pretask-list";
    preTasks.forEach((task) => {
      const li = document.createElement("li");
      li.textContent = task;
      list.appendChild(li);
    });
    preSection.appendChild(list);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "Add a prediction or gist-reading task.";
    preSection.appendChild(placeholder);
  }
  excerptSection.appendChild(preSection);

  const questionsSection = document.createElement("section");
  questionsSection.className = "reading-questions";
  body.appendChild(questionsSection);

  const questionsHeading = document.createElement("h3");
  const questionIcon = document.createElement("i");
  questionIcon.className = "fa-solid fa-circle-question";
  questionIcon.setAttribute("aria-hidden", "true");
  questionsHeading.appendChild(questionIcon);
  questionsHeading.appendChild(document.createTextNode(" Comprehension questions"));
  questionsSection.appendChild(questionsHeading);

  const questionEntries = Array.isArray(reading?.questions)
    ? reading.questions.filter((question) => question.question || question.answer)
    : [];

  if (questionEntries.length) {
    const list = document.createElement("ol");
    list.className = "reading-question-list";
    questionEntries.forEach((entry, index) => {
      const item = document.createElement("li");
      item.className = "reading-question-item";
      const prompt = document.createElement("p");
      prompt.className = "reading-question-prompt";
      prompt.textContent = entry.question || `Question ${index + 1}`;
      item.appendChild(prompt);
      if (entry.answer) {
        const answer = document.createElement("p");
        answer.className = "reading-question-answer";
        const answerLabel = document.createElement("strong");
        answerLabel.textContent = "Answer:";
        answer.appendChild(answerLabel);
        answer.appendChild(document.createTextNode(` ${entry.answer}`));
        item.appendChild(answer);
      }
      list.appendChild(item);
    });
    questionsSection.appendChild(list);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "Add comprehension questions with answer keys.";
    questionsSection.appendChild(placeholder);
  }

  const postTask = trimText(reading?.postTask);
  const postTaskEl = document.createElement("p");
  postTaskEl.className = "reading-post-task";
  if (postTask) {
    const icon = document.createElement("i");
    icon.className = "fa-solid fa-arrow-up-right-dots";
    icon.setAttribute("aria-hidden", "true");
    postTaskEl.appendChild(icon);
    postTaskEl.appendChild(document.createTextNode(` ${postTask}`));
  } else {
    postTaskEl.textContent = "Add a post-reading production task.";
    postTaskEl.classList.add("activity-empty");
  }
  questionsSection.appendChild(postTaskEl);

  if (rubricEnabled) {
    const rubricSection = buildRubricSection({
      heading: "Success criteria",
      intro: rubricIntro,
      rubric,
    });
    layout.appendChild(rubricSection);
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

  if (!rubricEnabled) {
    copyBtn.hidden = true;
    toggleBtn.hidden = true;
    delete slide.dataset.rubric;
  } else {
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
  }

  slide.dataset.activityTitle = resolvedTitle;
  return slide;
}

function createPronunciationDrillSlide({
  stageLabel = "Sound clinic",
  title,
  duration,
  rubric = { criteria: [], levels: [] },
  rubricIntro,
  pronunciation = {},
  rubricEnabled = true,
} = {}) {
  const resolvedTitle = trimText(title) || "Pronunciation clinic";

  const slide = document.createElement("div");
  slide.className = "slide-stage hidden activity-slide activity-slide--pronunciation";
  slide.dataset.type = "activity";
  slide.dataset.activity = "rubric";

  const inner = document.createElement("div");
  inner.className = "slide-inner activity-builder-slide activity-builder-slide--pronunciation";
  slide.appendChild(inner);

  const header = document.createElement("header");
  header.className = "activity-slide-header";
  inner.appendChild(header);

  const pill = document.createElement("span");
  pill.className = "pill activity-pill";
  const pillIcon = document.createElement("i");
  pillIcon.className = "fa-solid fa-microphone-lines";
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
  layout.className = "activity-pronunciation-layout";
  if (!rubricEnabled) {
    layout.classList.add("activity-pronunciation-layout--no-rubric");
  }
  inner.appendChild(layout);

  const content = document.createElement("div");
  content.className = "pronunciation-body";
  layout.appendChild(content);

  const focusSection = document.createElement("section");
  focusSection.className = "pronunciation-focus";
  content.appendChild(focusSection);

  const focusHeading = document.createElement("h3");
  const focusIcon = document.createElement("i");
  focusIcon.className = "fa-solid fa-wave-square";
  focusIcon.setAttribute("aria-hidden", "true");
  focusHeading.appendChild(focusIcon);
  focusHeading.appendChild(document.createTextNode(" Sound focus"));
  focusSection.appendChild(focusHeading);

  const focusText = trimText(pronunciation?.focus);
  if (focusText) {
    const focusParagraph = document.createElement("p");
    focusParagraph.textContent = focusText;
    focusSection.appendChild(focusParagraph);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "Describe the pronunciation feature learners will practise.";
    focusSection.appendChild(placeholder);
  }

  const drillSteps = Array.isArray(pronunciation?.drillSteps)
    ? pronunciation.drillSteps.filter(Boolean)
    : [];
  const drillHeading = document.createElement("h4");
  const drillIcon = document.createElement("i");
  drillIcon.className = "fa-solid fa-list-ol";
  drillIcon.setAttribute("aria-hidden", "true");
  drillHeading.appendChild(drillIcon);
  drillHeading.appendChild(document.createTextNode(" Drill sequence"));
  focusSection.appendChild(drillHeading);
  if (drillSteps.length) {
    const list = document.createElement("ol");
    list.className = "pronunciation-steps";
    drillSteps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      list.appendChild(li);
    });
    focusSection.appendChild(list);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "Outline the steps for the drill.";
    focusSection.appendChild(placeholder);
  }

  const choralPrompt = trimText(pronunciation?.choralPrompt);
  if (choralPrompt) {
    const promptCallout = document.createElement("blockquote");
    promptCallout.className = "pronunciation-choral";
    const icon = document.createElement("i");
    icon.className = "fa-solid fa-quote-left";
    icon.setAttribute("aria-hidden", "true");
    promptCallout.appendChild(icon);
    promptCallout.appendChild(document.createTextNode(` ${choralPrompt}`));
    focusSection.appendChild(promptCallout);
  }

  const pairsSection = document.createElement("section");
  pairsSection.className = "pronunciation-pairs";
  content.appendChild(pairsSection);

  const pairsHeading = document.createElement("h3");
  const pairsIcon = document.createElement("i");
  pairsIcon.className = "fa-solid fa-arrows-left-right";
  pairsIcon.setAttribute("aria-hidden", "true");
  pairsHeading.appendChild(pairsIcon);
  pairsHeading.appendChild(document.createTextNode(" Minimal pairs"));
  pairsSection.appendChild(pairsHeading);

  const pairEntries = Array.isArray(pronunciation?.minimalPairs)
    ? pronunciation.minimalPairs.filter((pair) => pair.first || pair.second || pair.tip)
    : [];

  if (pairEntries.length) {
    const table = document.createElement("table");
    table.className = "minimal-pair-table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Word A", "Word B", "Coaching tip"].forEach((headingText) => {
      const th = document.createElement("th");
      th.textContent = headingText;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    pairEntries.forEach((pair) => {
      const row = document.createElement("tr");
      const firstCell = document.createElement("td");
      firstCell.textContent = pair.first || "—";
      row.appendChild(firstCell);
      const secondCell = document.createElement("td");
      secondCell.textContent = pair.second || "—";
      row.appendChild(secondCell);
      const tipCell = document.createElement("td");
      tipCell.textContent = pair.tip || "";
      row.appendChild(tipCell);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    pairsSection.appendChild(table);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "List minimal pairs for learners to contrast.";
    pairsSection.appendChild(placeholder);
  }

  const feedbackTips = Array.isArray(pronunciation?.feedbackTips)
    ? pronunciation.feedbackTips.filter(Boolean)
    : [];
  if (feedbackTips.length) {
    const feedbackHeading = document.createElement("h4");
    const feedbackIcon = document.createElement("i");
    feedbackIcon.className = "fa-solid fa-hands";
    feedbackIcon.setAttribute("aria-hidden", "true");
    feedbackHeading.appendChild(feedbackIcon);
    feedbackHeading.appendChild(document.createTextNode(" Coaching moves"));
    const feedbackList = document.createElement("ul");
    feedbackList.className = "pronunciation-feedback";
    feedbackTips.forEach((tip) => {
      const li = document.createElement("li");
      li.textContent = tip;
      feedbackList.appendChild(li);
    });
    pairsSection.appendChild(feedbackHeading);
    pairsSection.appendChild(feedbackList);
  }

  if (rubricEnabled) {
    const rubricSection = buildRubricSection({
      heading: "Success criteria",
      intro: rubricIntro,
      rubric,
    });
    layout.appendChild(rubricSection);
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

  if (!rubricEnabled) {
    copyBtn.hidden = true;
    toggleBtn.hidden = true;
    delete slide.dataset.rubric;
  } else {
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
  }

  slide.dataset.activityTitle = resolvedTitle;
  return slide;
}

function createHomeworkRecapSlide({
  stageLabel = "Homework debrief",
  title,
  duration,
  rubric = { criteria: [], levels: [] },
  rubricIntro,
  homework = {},
  rubricEnabled = true,
} = {}) {
  const resolvedTitle = trimText(title) || "Homework recap";

  const slide = document.createElement("div");
  slide.className = "slide-stage hidden activity-slide activity-slide--homework";
  slide.dataset.type = "activity";
  slide.dataset.activity = "rubric";

  const inner = document.createElement("div");
  inner.className = "slide-inner activity-builder-slide activity-builder-slide--homework";
  slide.appendChild(inner);

  const header = document.createElement("header");
  header.className = "activity-slide-header";
  inner.appendChild(header);

  const pill = document.createElement("span");
  pill.className = "pill activity-pill";
  const pillIcon = document.createElement("i");
  pillIcon.className = "fa-solid fa-house-circle-check";
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
  layout.className = "activity-homework-layout";
  if (!rubricEnabled) {
    layout.classList.add("activity-homework-layout--no-rubric");
  }
  inner.appendChild(layout);

  const recapSection = document.createElement("section");
  recapSection.className = "homework-summary";
  layout.appendChild(recapSection);

  const recapHeading = document.createElement("h3");
  const recapIcon = document.createElement("i");
  recapIcon.className = "fa-solid fa-book";
  recapIcon.setAttribute("aria-hidden", "true");
  recapHeading.appendChild(recapIcon);
  recapHeading.appendChild(document.createTextNode(" Homework focus"));
  recapSection.appendChild(recapHeading);

  const summaryText = trimText(homework?.summary);
  if (summaryText) {
    const summaryParagraph = document.createElement("p");
    summaryParagraph.textContent = summaryText;
    recapSection.appendChild(summaryParagraph);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "Summarise the homework task learners completed.";
    recapSection.appendChild(placeholder);
  }

  const sharePrompts = Array.isArray(homework?.sharePrompts)
    ? homework.sharePrompts.filter(Boolean)
    : [];
  const shareSection = document.createElement("section");
  shareSection.className = "homework-share";
  layout.appendChild(shareSection);

  const shareHeading = document.createElement("h3");
  const shareIcon = document.createElement("i");
  shareIcon.className = "fa-solid fa-comments";
  shareIcon.setAttribute("aria-hidden", "true");
  shareHeading.appendChild(shareIcon);
  shareHeading.appendChild(document.createTextNode(" Share-out prompts"));
  shareSection.appendChild(shareHeading);

  if (sharePrompts.length) {
    const list = document.createElement("ul");
    list.className = "homework-share-list";
    sharePrompts.forEach((prompt) => {
      const li = document.createElement("li");
      li.textContent = prompt;
      list.appendChild(li);
    });
    shareSection.appendChild(list);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "Add speaking prompts for learners to discuss their homework.";
    shareSection.appendChild(placeholder);
  }

  const actionSection = document.createElement("section");
  actionSection.className = "homework-actions";
  layout.appendChild(actionSection);

  const nextHeading = document.createElement("h3");
  const nextIcon = document.createElement("i");
  nextIcon.className = "fa-solid fa-forward-step";
  nextIcon.setAttribute("aria-hidden", "true");
  nextHeading.appendChild(nextIcon);
  nextHeading.appendChild(document.createTextNode(" Next steps"));
  actionSection.appendChild(nextHeading);

  const nextSteps = Array.isArray(homework?.nextSteps)
    ? homework.nextSteps.filter(Boolean)
    : [];
  if (nextSteps.length) {
    const list = document.createElement("ul");
    list.className = "homework-next-list";
    nextSteps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      list.appendChild(li);
    });
    actionSection.appendChild(list);
  }

  const evidenceChecklist = Array.isArray(homework?.evidenceChecklist)
    ? homework.evidenceChecklist.filter(Boolean)
    : [];
  const checklistHeading = document.createElement("h4");
  const checklistIcon = document.createElement("i");
  checklistIcon.className = "fa-solid fa-list-check";
  checklistIcon.setAttribute("aria-hidden", "true");
  checklistHeading.appendChild(checklistIcon);
  checklistHeading.appendChild(document.createTextNode(" Evidence to capture"));
  actionSection.appendChild(checklistHeading);
  if (evidenceChecklist.length) {
    const list = document.createElement("ul");
    list.className = "homework-evidence-list";
    evidenceChecklist.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
    actionSection.appendChild(list);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "activity-empty";
    placeholder.textContent = "List what evidence you\'ll collect during the share-out.";
    actionSection.appendChild(placeholder);
  }

  if (rubricEnabled) {
    const rubricSection = buildRubricSection({
      heading: "Success criteria",
      intro: rubricIntro,
      rubric,
    });
    layout.appendChild(rubricSection);
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

  if (!rubricEnabled) {
    copyBtn.hidden = true;
    toggleBtn.hidden = true;
    delete slide.dataset.rubric;
  } else {
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
  }

  slide.dataset.activityTitle = resolvedTitle;
  return slide;
}




function createLearningObjectivesSlide({ title = 'Learning Outcomes', goals = [], communicativeGoal = '', imageUrl = '' } = {}) {
  const slide = document.createElement('div');
  slide.className = 'slide-stage hidden lesson-slide';
  slide.dataset.type = 'lesson';
  const resolvedImage = trimText(imageUrl);
  if (resolvedImage) {
    slide.classList.add('lesson-slide--has-image');
    slide.style.setProperty('--lesson-bg-image', `url("${resolvedImage}")`);
  }
  const inner = document.createElement('div');
  inner.className = 'slide-inner lesson-slide-inner';
  slide.appendChild(inner);

  const header = document.createElement('header');
  header.className = 'lesson-header';
  inner.appendChild(header);

  const heading = document.createElement('h2');
  heading.textContent = trimText(title) || 'Learning Outcomes';
  header.appendChild(heading);

  const goalText = trimText(communicativeGoal);
  if (goalText) {
    const goalElement = document.createElement('p');
    goalElement.className = 'lesson-communicative';
    const lead = document.createElement('strong');
    lead.textContent = 'So you can';
    goalElement.appendChild(lead);
    goalElement.appendChild(document.createTextNode(` ${goalText}`));
    header.appendChild(goalElement);
  }

  const body = document.createElement('div');
  body.className = 'lesson-body';
  inner.appendChild(body);

  const cleanedGoals = Array.isArray(goals) ? goals.map((goal) => trimText(goal)).filter(Boolean) : [];
  if (cleanedGoals.length) {
    const list = document.createElement('ul');
    list.className = 'lesson-goals';
    cleanedGoals.forEach((goal, index) => {
      const item = document.createElement('li');
      const icon = document.createElement('span');
      icon.className = 'lesson-goal-icon';
      icon.textContent = `Goal ${index + 1}`;
      const text = document.createElement('p');
      text.textContent = goal;
      item.appendChild(icon);
      item.appendChild(text);
      list.appendChild(item);
    });
    body.appendChild(list);
  } else {
    const placeholder = document.createElement('p');
    placeholder.className = 'lesson-empty';
    placeholder.textContent = 'List the lesson goals to orient learners.';
    body.appendChild(placeholder);
  }

  return slide;
}

function createModelDialogueSlide({ title = 'Model dialogue', instructions = '', imageUrl = '', audioUrl = '', turns = [] } = {}) {
  const slide = document.createElement('div');
  slide.className = 'slide-stage hidden lesson-slide';
  slide.dataset.type = 'lesson';
  const resolvedImage = trimText(imageUrl);
  if (resolvedImage) {
    slide.classList.add('lesson-slide--has-image');
    slide.style.setProperty('--lesson-bg-image', `url("${resolvedImage}")`);
  }

  const inner = document.createElement('div');
  inner.className = 'slide-inner lesson-slide-inner';
  slide.appendChild(inner);

  const header = document.createElement('header');
  header.className = 'lesson-header';
  inner.appendChild(header);

  const heading = document.createElement('h2');
  heading.textContent = trimText(title) || 'Model dialogue';
  header.appendChild(heading);

  const instructionText = trimText(instructions);
  if (instructionText) {
    const instructionEl = document.createElement('p');
    instructionEl.className = 'lesson-instructions';
    instructionEl.textContent = instructionText;
    header.appendChild(instructionEl);
  }

  const body = document.createElement('div');
  body.className = 'lesson-dialogue';
  inner.appendChild(body);

  const dialogueWrap = document.createElement('div');
  dialogueWrap.className = 'lesson-dialogue-text';
  body.appendChild(dialogueWrap);

  const cleanedTurns = Array.isArray(turns)
    ? turns
        .map((turn) => ({ speaker: trimText(turn?.speaker), line: trimText(turn?.line) }))
        .filter((turn) => turn.speaker || turn.line)
    : [];

  if (cleanedTurns.length) {
    cleanedTurns.forEach((turn) => {
      const block = document.createElement('div');
      block.className = 'dialogue-turn';
      const speaker = document.createElement('span');
      speaker.className = 'dialogue-speaker';
      speaker.textContent = turn.speaker || 'Speaker';
      const line = document.createElement('p');
      line.className = 'dialogue-line';
      line.textContent = turn.line || '';
      block.appendChild(speaker);
      block.appendChild(line);
      dialogueWrap.appendChild(block);
    });
  } else {
    const placeholder = document.createElement('p');
    placeholder.className = 'lesson-empty';
    placeholder.textContent = 'Add dialogue turns so learners can analyse the model.';
    dialogueWrap.appendChild(placeholder);
  }

  if (resolvedImage) {
    const visual = document.createElement('div');
    visual.className = 'lesson-dialogue-visual';
    const img = document.createElement('img');
    img.src = resolvedImage;
    img.alt = trimText(title) || 'Dialogue context';
    img.loading = 'lazy';
    img.decoding = 'async';
    visual.appendChild(img);
    body.appendChild(visual);
  }

  const audioSource = trimText(audioUrl);
  if (audioSource) {
    const audioWrap = document.createElement('div');
    audioWrap.className = 'lesson-audio';
    const audioEl = document.createElement('audio');
    audioEl.controls = true;
    audioEl.src = audioSource;
    audioWrap.appendChild(audioEl);
    inner.appendChild(audioWrap);
  }

  return slide;
}

function createCommunicativeTaskSlide({ title = 'Communicative task', imageUrl = '', preparation = '', performance = '', scaffolding = [] } = {}) {
  const slide = document.createElement('div');
  slide.className = 'slide-stage hidden lesson-slide';
  slide.dataset.type = 'communicative-task';
  const resolvedImage = trimText(imageUrl);
  if (resolvedImage) {
    slide.classList.add('lesson-slide--has-image');
    slide.style.setProperty('--lesson-bg-image', `url("${resolvedImage}")`);
  }

  const inner = document.createElement('div');
  inner.className = 'slide-inner lesson-slide-inner';
  slide.appendChild(inner);

  const header = document.createElement('header');
  header.className = 'lesson-header';
  inner.appendChild(header);

  const heading = document.createElement('h2');
  heading.textContent = trimText(title) || 'Communicative task';
  header.appendChild(heading);

  const body = document.createElement('div');
  body.className = 'task-body';
  inner.appendChild(body);

  const prepSection = document.createElement('section');
  prepSection.className = 'task-phase';
  const prepHeading = document.createElement('h3');
  prepHeading.textContent = 'Preparation';
  const prepText = document.createElement('p');
  prepText.textContent = trimText(preparation) || 'Describe the scenario learners should prepare for.';
  prepSection.appendChild(prepHeading);
  prepSection.appendChild(prepText);
  body.appendChild(prepSection);

  const performanceSection = document.createElement('section');
  performanceSection.className = 'task-phase';
  const perfHeading = document.createElement('h3');
  perfHeading.textContent = 'Performance';
  const perfText = document.createElement('p');
  perfText.textContent = trimText(performance) || 'Explain how learners will carry out the task.';
  performanceSection.appendChild(perfHeading);
  performanceSection.appendChild(perfText);
  body.appendChild(performanceSection);

  const scaffoldingItems = Array.isArray(scaffolding)
    ? scaffolding.map((item) => trimText(item)).filter(Boolean)
    : [];
  if (scaffoldingItems.length) {
    const scaffoldSection = document.createElement('section');
    scaffoldSection.className = 'task-scaffolding';
    const scaffoldHeading = document.createElement('h4');
    scaffoldHeading.textContent = 'Language support';
    scaffoldSection.appendChild(scaffoldHeading);
    const list = document.createElement('ul');
    list.className = 'task-scaffolding-list';
    scaffoldingItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
    scaffoldSection.appendChild(list);
    body.appendChild(scaffoldSection);
  }

  return slide;
}

function createPronunciationFocusSlide({
  title = 'Pronunciation focus',
  target = '',
  words = [],
  sentences = [],
  practice = '',
  imageUrl = '',
} = {}) {
  const slide = document.createElement('div');
  slide.className = 'slide-stage hidden lesson-slide';
  slide.dataset.type = 'pronunciation';
  const resolvedImage = trimText(imageUrl);
  if (resolvedImage) {
    slide.classList.add('lesson-slide--has-image');
    slide.style.setProperty('--lesson-bg-image', `url("${resolvedImage}")`);
  }

  const inner = document.createElement('div');
  inner.className = 'slide-inner lesson-slide-inner';
  slide.appendChild(inner);

  const header = document.createElement('header');
  header.className = 'lesson-header';
  inner.appendChild(header);

  const heading = document.createElement('h2');
  heading.textContent = trimText(title) || 'Pronunciation focus';
  header.appendChild(heading);

  const targetText = trimText(target);
  if (targetText) {
    const targetEl = document.createElement('p');
    targetEl.className = 'pronunciation-target';
    targetEl.textContent = targetText;
    header.appendChild(targetEl);
  }

  const card = document.createElement('div');
  card.className = 'pronunciation-focus-card';
  inner.appendChild(card);

  const wordList = Array.isArray(words) ? words.map((word) => trimText(word)).filter(Boolean) : [];
  if (wordList.length) {
    const wordsEl = document.createElement('div');
    wordsEl.className = 'pronunciation-words';
    wordList.forEach((word) => {
      const span = document.createElement('span');
      span.textContent = word;
      wordsEl.appendChild(span);
    });
    card.appendChild(wordsEl);
  }

  const sentenceList = Array.isArray(sentences)
    ? sentences.map((sentence) => trimText(sentence)).filter(Boolean)
    : [];
  if (sentenceList.length) {
    const sentenceEl = document.createElement('div');
    sentenceEl.className = 'pronunciation-examples';
    sentenceList.forEach((sentence) => {
      const example = document.createElement('span');
      example.textContent = sentence;
      sentenceEl.appendChild(example);
    });
    card.appendChild(sentenceEl);
  }

  const practiceText = trimText(practice);
  const practiceEl = document.createElement('div');
  practiceEl.className = 'pronunciation-practice';
  practiceEl.textContent = practiceText || 'Describe how learners should practise the target sound.';
  card.appendChild(practiceEl);

  return slide;
}

function createReflectionSlide({ title = 'Reflection', prompts = [], imageUrl = '' } = {}) {
  const slide = document.createElement('div');
  slide.className = 'slide-stage hidden lesson-slide';
  slide.dataset.type = 'reflection';
  const resolvedImage = trimText(imageUrl);
  if (resolvedImage) {
    slide.classList.add('lesson-slide--has-image');
    slide.style.setProperty('--lesson-bg-image', `url("${resolvedImage}")`);
  }

  const inner = document.createElement('div');
  inner.className = 'slide-inner lesson-slide-inner';
  slide.appendChild(inner);

  const header = document.createElement('header');
  header.className = 'lesson-header';
  inner.appendChild(header);

  const heading = document.createElement('h2');
  heading.textContent = trimText(title) || 'Reflection';
  header.appendChild(heading);

  const body = document.createElement('div');
  body.className = 'reflection-body';
  inner.appendChild(body);

  const promptList = Array.isArray(prompts) ? prompts.map((prompt) => trimText(prompt)).filter(Boolean) : [];
  if (promptList.length) {
    const list = document.createElement('ul');
    list.className = 'reflection-prompts';
    promptList.forEach((prompt) => {
      const li = document.createElement('li');
      li.textContent = prompt;
      list.appendChild(li);
    });
    body.appendChild(list);
  } else {
    const placeholder = document.createElement('p');
    placeholder.className = 'lesson-empty';
    placeholder.textContent = 'Add reflection prompts to guide learners.';
    body.appendChild(placeholder);
  }

  return slide;
}

function createInteractivePracticeSlide({
  title,
  instructions,
  activityType,
  questions = [],
} = {}) {
  const resolvedTitle = trimText(title) || "Practice";
  const resolvedInstructions = trimText(instructions);
  const resolvedType = trimText(activityType) || "multiple-choice";
  const resolvedQuestions = Array.isArray(questions)
    ? questions.filter((q) => q && (q.prompt || q.options?.length))
    : [];

  const slide = document.createElement("div");
  slide.className = "slide-stage hidden interactive-practice-slide";
  slide.dataset.type = "interactive-practice";
  slide.dataset.activityType = resolvedType;

  const inner = document.createElement("div");
  inner.className = "slide-inner interactive-practice-inner";
  slide.appendChild(inner);

  const header = document.createElement("header");
  header.className = "practice-header";
  inner.appendChild(header);

  const heading = document.createElement("h2");
  heading.textContent = resolvedTitle;
  header.appendChild(heading);

  const typeBadge = document.createElement("span");
  typeBadge.className = "practice-type";
  typeBadge.textContent = MODULE_TYPE_LABELS[resolvedType] || resolvedType;
  header.appendChild(typeBadge);

  const body = document.createElement("div");
  body.className = "practice-body";
  inner.appendChild(body);

  const instructionSection = document.createElement("section");
  instructionSection.className = "practice-instructions";
  if (resolvedInstructions) {
    const paragraph = document.createElement("p");
    paragraph.textContent = resolvedInstructions;
    instructionSection.appendChild(paragraph);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "lesson-empty";
    placeholder.textContent = "Describe how learners should complete the activity.";
    instructionSection.appendChild(placeholder);
  }
  body.appendChild(instructionSection);

  const questionSection = document.createElement("section");
  questionSection.className = "practice-questions";
  body.appendChild(questionSection);

  if (resolvedQuestions.length) {
    const list = document.createElement("ol");
    resolvedQuestions.forEach(({ prompt, options = [], answer }, index) => {
      const item = document.createElement("li");
      item.className = "practice-question";
      const promptEl = document.createElement("p");
      promptEl.className = "practice-question-text";
      promptEl.textContent = prompt || `Question ${index + 1}`;
      item.appendChild(promptEl);
      const optionList = Array.isArray(options) ? options.filter(Boolean) : [];
      if (optionList.length) {
        const optionsEl = document.createElement("ul");
        optionsEl.className = "practice-options";
        optionList.forEach((opt) => {
          const optLi = document.createElement("li");
          optLi.textContent = opt;
          optionsEl.appendChild(optLi);
        });
        item.appendChild(optionsEl);
      }
      const answerText = trimText(answer);
      if (answerText) {
        const answerEl = document.createElement("p");
        answerEl.className = "practice-answer";
        answerEl.textContent = `Correct: ${answerText}`;
        item.appendChild(answerEl);
      }
      list.appendChild(item);
    });
    questionSection.appendChild(list);
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "lesson-empty";
    placeholder.textContent = "List the prompts or stems learners will respond to.";
    questionSection.appendChild(placeholder);
  }

  const moduleArea = document.createElement("div");
  moduleArea.className = "practice-module";
  moduleArea.dataset.role = "practice-module-area";
  inner.appendChild(moduleArea);

  const moduleHost = document.createElement("div");
  moduleHost.className = "practice-module-host";
  moduleHost.dataset.role = "practice-module-host";
  moduleArea.appendChild(moduleHost);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "activity-btn";
  addBtn.dataset.action = "add-module";
  addBtn.innerHTML = '<i class="fa-solid fa-puzzle-piece" aria-hidden="true"></i><span>Add interactive module</span>';
  moduleArea.appendChild(addBtn);

  return slide;
}





function ensureInteractivePracticeModuleControls(slide) {
  if (!(slide instanceof HTMLElement)) {
    return {
      moduleArea: null,
      host: null,
      addBtn: null,
    };
  }

  const inner =
    slide.querySelector('.interactive-practice-inner') ??
    slide.querySelector('.slide-inner');

  if (!(inner instanceof HTMLElement)) {
    return {
      moduleArea: null,
      host: null,
      addBtn: null,
    };
  }

  let moduleArea = slide.querySelector('[data-role="practice-module-area"]');
  if (!(moduleArea instanceof HTMLElement)) {
    moduleArea = document.createElement('div');
    moduleArea.className = 'practice-module';
    moduleArea.dataset.role = 'practice-module-area';
    inner.appendChild(moduleArea);
  } else {
    moduleArea.classList.add('practice-module');
    moduleArea.dataset.role = 'practice-module-area';
  }

  moduleArea
    .querySelectorAll('[data-role="practice-module-hint"], .practice-module-hint')
    .forEach((existingHint) => {
      if (existingHint instanceof HTMLElement) {
        existingHint.remove();
      }
    });

  let host = moduleArea.querySelector('[data-role="practice-module-host"]');
  if (!(host instanceof HTMLElement)) {
    host = document.createElement('div');
    host.className = 'practice-module-host';
    host.dataset.role = 'practice-module-host';
    moduleArea.appendChild(host);
  } else {
    host.classList.add('practice-module-host');
    host.dataset.role = 'practice-module-host';
  }

  let addBtn = moduleArea.querySelector('[data-action="add-module"]');
  if (!(addBtn instanceof HTMLButtonElement)) {
    addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'activity-btn';
    addBtn.dataset.action = 'add-module';
    addBtn.innerHTML =
      '<i class="fa-solid fa-puzzle-piece" aria-hidden="true"></i><span>Add interactive module</span>';
    moduleArea.appendChild(addBtn);
  } else {
    addBtn.classList.add('activity-btn');
    addBtn.dataset.action = 'add-module';
    if (!addBtn.innerHTML.trim()) {
      addBtn.innerHTML =
        '<i class="fa-solid fa-puzzle-piece" aria-hidden="true"></i><span>Add interactive module</span>';
    }
  }

  return { moduleArea, host, addBtn };
}

function refreshInteractivePracticeModuleState(slide) {
  const { host, addBtn } = ensureInteractivePracticeModuleControls(slide);
  if (!(host instanceof HTMLElement)) {
    return;
  }
  const hasModule = host.querySelector('.module-embed');
  if (addBtn instanceof HTMLElement) {
    addBtn.hidden = Boolean(hasModule);
  }
}

function initialiseInteractivePracticeSlide(slide) {
  if (!(slide instanceof HTMLElement)) {
    return slide;
  }
  if (slide.__deckPracticeInitialised) {
    refreshInteractivePracticeModuleState(slide);
    return slide;
  }
  slide.__deckPracticeInitialised = true;

  const { host, addBtn } = ensureInteractivePracticeModuleControls(slide);

  const updateState = () => refreshInteractivePracticeModuleState(slide);

  if (host instanceof HTMLElement) {
    const existingModules = host.querySelectorAll?.('.module-embed') ?? [];
    existingModules.forEach((module) => initialiseModuleEmbed(module, { onRemove: updateState }));
  }

  if (addBtn instanceof HTMLButtonElement && host instanceof HTMLElement) {
    addBtn.addEventListener('click', () => {
      openModuleOverlay({
        canvas: host,
        trigger: addBtn,
        onInsert: () => {
          const module = host.querySelector('.module-embed');
          if (module instanceof HTMLElement) {
            initialiseModuleEmbed(module, { onRemove: updateState });
          }
          updateState();
        },
      });
    });
  }

  updateState();
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
  if (slideList && slideList.length) {
    slideList.forEach((slide) => initialiseBuilderSlide(slide));
  }
  const practiceSlides = scope.querySelectorAll?.(".interactive-practice-slide");
  if (practiceSlides && practiceSlides.length) {
    practiceSlides.forEach((slide) => initialiseInteractivePracticeSlide(slide));
  }
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

  let slide = null;

  switch (state.layout) {
    case 'blank-canvas': {
      slide = createBlankSlide();
      if (slide instanceof HTMLElement) {
        attachBlankSlideEvents(slide);
      }
      break;
    }
    case 'learning-objectives':
      slide = createLearningObjectivesSlide(state.data);
      break;
    case 'model-dialogue':
      slide = createModelDialogueSlide(state.data);
      break;
    case 'interactive-practice':
      slide = createInteractivePracticeSlide(state.data);
      break;
    case 'communicative-task':
      slide = createCommunicativeTaskSlide(state.data);
      break;
    case 'pronunciation-focus':
      slide = createPronunciationFocusSlide(state.data);
      break;
    case 'reflection':
      slide = createReflectionSlide(state.data);
      break;
    default:
      showBuilderStatus('Choose a slide layout to continue.', 'error');
      return;
  }

  if (!(slide instanceof HTMLElement)) {
    showBuilderStatus("We couldn't build that slide right now.", "error");
    return;
  }

  if (state.layout === 'interactive-practice') {
    initialiseInteractivePracticeSlide(slide);
  }

  insertActivitySlide(slide);
  showBuilderStatus('Slide added to your deck.', 'success');
  closeBuilderOverlay({ reset: true, focus: true });
}
function initialiseActivityBuilderUI() {
  if (!(builderOverlay instanceof HTMLElement) || !(builderForm instanceof HTMLFormElement)) {
    return;
  }
  if (builderOverlay.__deckBuilderInitialised) {
    updateBuilderJsonPreview();
    updateBuilderPreview();
    return;
  }

  builderOverlay.__deckBuilderInitialised = true;

  const openForLayout = (layout) => {
    showBuilderStatus('', undefined);
    openBuilderOverlay({ layout });
  };

  addSlideBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    openForLayout('blank-canvas');
  });

  activityBuilderBtn?.addEventListener('click', () => {
    openForLayout('learning-objectives');
  });

  if (builderAddDialogueBtn instanceof HTMLButtonElement) {
    builderAddDialogueBtn.addEventListener('click', () => {
      const newItem = addDialogueItem();
      const focusTarget = newItem?.querySelector('input, textarea');
      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus({ preventScroll: true });
      }
      showBuilderStatus('Added a dialogue turn.', 'info');
      updateBuilderJsonPreview();
      updateBuilderPreview();
    });
  }

  if (builderAddPracticeBtn instanceof HTMLButtonElement) {
    builderAddPracticeBtn.addEventListener('click', () => {
      const newItem = addPracticeItem();
      const focusTarget = newItem?.querySelector('input, textarea');
      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus({ preventScroll: true });
      }
      showBuilderStatus('Added a practice prompt.', 'info');
      updateBuilderJsonPreview();
      updateBuilderPreview();
    });
  }

  if (Array.isArray(builderLayoutInputs)) {
    const messages = {
      'blank-canvas': 'Blank canvas selected.',
      'learning-objectives': 'Learning objectives layout selected.',
      'model-dialogue': 'Model dialogue layout selected.',
      'interactive-practice': 'Interactive practice layout selected.',
      'communicative-task': 'Communicative task layout selected.',
      'pronunciation-focus': 'Pronunciation focus layout selected.',
      reflection: 'Reflection layout selected.',
    };
    builderLayoutInputs.forEach((input) => {
      input.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
          return;
        }
        const layoutValue = target.value || 'blank-canvas';
        syncBuilderLayout(layoutValue);
        applyBuilderLayoutDefaults(layoutValue);
        updateBuilderJsonPreview();
        updateBuilderPreview();
        showBuilderStatus(messages[layoutValue] || 'Layout updated.', 'info');
      });
    });
  }

  builderRefreshPreviewBtn?.addEventListener('click', () => {
    updateBuilderPreview();
    showBuilderStatus('Preview refreshed.', 'success');
  });

  builderCancelBtn?.addEventListener('click', () => {
    closeBuilderOverlay({ reset: true, focus: true });
  });

  builderCloseBtn?.addEventListener('click', () => {
    closeBuilderOverlay({ reset: false, focus: true });
  });

  builderOverlay.addEventListener('click', (event) => {
    if (event.target === builderOverlay) {
      closeBuilderOverlay({ reset: false, focus: true });
    }
  });

  builderImageSearchBtn?.addEventListener('click', () => {
    handleImageSearch();
  });

  builderImageSearchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleImageSearch();
    }
  });

  builderImageResults?.addEventListener('click', (event) => {
    const button = event.target instanceof HTMLElement ? event.target.closest('.image-result') : null;
    if (button instanceof HTMLElement) {
      selectImageResult(button);
    }
  });

  if (builderForm instanceof HTMLFormElement) {
    builderForm.addEventListener('submit', handleBuilderSubmit);
    builderForm.addEventListener('input', () => {
      updateBuilderJsonPreview();
      updateBuilderPreview();
    });
    builderForm.addEventListener('change', () => {
      updateBuilderJsonPreview();
      updateBuilderPreview();
    });
  }

  resetBuilderForm();
  updateBuilderJsonPreview();
  updateBuilderPreview();
}
async function initialiseDeck() {
  hydrateRemoteImages().catch((error) => {
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
  initialiseEditableText(stageViewport);
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
  ensureCanvasInsertOverlay();
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
  builderDialogueList =
    builderOverlay?.querySelector("#builder-dialogue-list") ??
    document.querySelector("#builder-dialogue-list");
  builderAddDialogueBtn =
    builderOverlay?.querySelector("#builder-add-dialogue") ??
    document.querySelector("#builder-add-dialogue");
  builderPracticeList =
    builderOverlay?.querySelector("#builder-practice-list") ??
    document.querySelector("#builder-practice-list");
  builderAddPracticeBtn =
    builderOverlay?.querySelector("#builder-add-practice") ??
    document.querySelector("#builder-add-practice");
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

  if (moduleFrame instanceof HTMLIFrameElement) {
    try {
      const builderUrl = await resolveModuleBuilderUrl();
      if (builderUrl && moduleFrame.src !== builderUrl) {
        moduleFrame.src = builderUrl;
      }
      if (builderUrl) {
        moduleFrame.dataset.builderResolved = builderUrl;
      }
    } catch (error) {
      console.warn("Unable to resolve activity builder source", error);
    }
  }

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
          onMoveSlide: (fromIndex, toIndex) => moveSlide(fromIndex, toIndex),
          onMoveSlidesToSection: (selectedIndices, sectionLabel) =>
            moveSlidesToSection(selectedIndices, sectionLabel),
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
