import { createEditorCore } from "../interactive-editor/editorCore.js";
import { initSlideNavigator } from "../js/slideNavigator.js";
import { hydrateRemoteImages } from "../js/interactivemodule.js";

const STORAGE_KEY = "authoring-workspace-state";
const TEMPLATE_MANIFEST = [
  { id: "dropdown", label: "Dropdown Quiz", path: "../Templates/dropdown.html" },
  { id: "gapfill", label: "Gap Fill", path: "../Templates/gapfill" },
  { id: "grouping", label: "Grouping Activity", path: "../Templates/grouping" },
  { id: "linking", label: "Linking Activity", path: "../Templates/Linking" },
  { id: "multiple-choice", label: "Multiple Choice", path: "../Templates/multiple-choice.html" },
  { id: "multiple-choice-grid", label: "Multiple Choice Grid", path: "../Templates/multiple-choice-grid.html" },
  { id: "pelmanism", label: "Pelmanism", path: "../Templates/pelmanism.html" },
  { id: "ranking", label: "Ranking Ladder", path: "../Templates/ranking.html" },
];

const stageViewport = document.querySelector(".stage-viewport");
const canvas = document.getElementById("editor-canvas");
const placeholder = canvas?.querySelector(".canvas__placeholder") ?? null;
const toolbar = document.querySelector(".toolbar");
const nextButton = stageViewport?.querySelector(".slide-nav-next") ?? null;
const prevButton = stageViewport?.querySelector(".slide-nav-prev") ?? null;
const slideCounter = document.getElementById("slide-counter");
const templateSelect = document.getElementById("template-select");
const importInput = document.getElementById("import-state-input");
const statusBanner = document.getElementById("workspace-status");

const slides = Array.from(stageViewport?.querySelectorAll(".slide-stage") ?? []);
const slideStates = new Map();
let activeSlideIndex = 0;

const editor = createEditorCore({
  canvas,
  placeholder,
  storageKey: null,
  interactInstance: window.interact,
  onStateChange: (state) => {
    const slide = slides[activeSlideIndex];
    if (!slide) return;
    slideStates.set(getSlideId(slide, activeSlideIndex), state);
  },
});

const {
  createTextBlock,
  createImageBlock,
  createModuleBlock,
  addBlockToCanvas,
  scheduleSave,
  showBlockMessage,
  updatePlaceholderVisibility,
  registerBlockInteractions,
  serializeBlocks,
  loadState,
  clearBlocks,
  sanitizeHTML,
} = editor;

registerBlockInteractions();
populateTemplateOptions();
initialiseSlideNavigator();
attachToolbarHandlers();
attachImportHandler();
attachNavigationHandlers();

const restoredFromStorage = restoreFromLocalStorage();

if (!restoredFromStorage && slides.length) {
  showSlide(0, { skipSnapshot: true });
} else if (!slides.length) {
  updateSlideNavigatorMeta();
}

function populateTemplateOptions() {
  if (!(templateSelect instanceof HTMLSelectElement)) {
    return;
  }
  TEMPLATE_MANIFEST.forEach(({ id, label }) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = label;
    templateSelect.appendChild(option);
  });
}

function initialiseSlideNavigator() {
  if (!(stageViewport instanceof HTMLElement)) {
    return;
  }
  const controller = initSlideNavigator({
    stageViewport,
    onSelectSlide: (index) => showSlide(index),
  });
  if (controller) {
    initialiseSlideNavigator.controller = controller;
  }
}

function updateSlideNavigatorMeta() {
  const controller = initialiseSlideNavigator.controller;
  if (!controller) return;
  controller.updateSlides(
    slides.map((slide, index) => ({
      stage: slide.dataset.stage || `Stage ${index + 1}`,
      title: slide.dataset.title || getSlideHeading(slide) || `Slide ${index + 1}`,
    }))
  );
  controller.setActive(activeSlideIndex);
}

function getSlideHeading(slide) {
  const heading = slide.querySelector("h1, h2, h3, h4");
  return heading?.textContent?.trim() ?? "";
}

function attachToolbarHandlers() {
  toolbar?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    switch (action) {
      case "add-text":
        addBlockToCanvas(createTextBlock());
        break;
      case "add-image":
        addBlockToCanvas(createImageBlock());
        break;
      case "add-module":
        addBlockToCanvas(createModuleBlock());
        break;
      case "save-local":
        persistActiveSlideState();
        saveWorkspaceToLocalStorage();
        setStatusMessage("Workspace saved to your browser.", "success");
        break;
      case "load-local":
        loadWorkspaceFromLocalStorage();
        break;
      case "export-json":
        persistActiveSlideState();
        exportWorkspaceState();
        break;
      case "import-json":
        importInput?.click();
        break;
      case "insert-template":
        insertSelectedTemplate();
        break;
      default:
        break;
    }
  });
}

function attachImportHandler() {
  if (!(importInput instanceof HTMLInputElement)) {
    return;
  }
  importInput.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files?.length) {
      return;
    }
    const [file] = input.files;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const text = typeof reader.result === "string" ? reader.result : "";
        const state = parseWorkspaceState(text);
        applyWorkspaceState(state);
        setStatusMessage("Workspace imported successfully.", "success");
      } catch (error) {
        console.error("Failed to import workspace", error);
        setStatusMessage("The selected file could not be imported.", "error");
      } finally {
        input.value = "";
      }
    });
    reader.addEventListener("error", () => {
      console.error("Failed to read workspace file", reader.error);
      setStatusMessage("We couldn't read that file. Try another JSON export.", "error");
      input.value = "";
    });
    reader.readAsText(file);
  });
}

function attachNavigationHandlers() {
  nextButton?.addEventListener("click", () => showSlide(activeSlideIndex + 1));
  prevButton?.addEventListener("click", () => showSlide(activeSlideIndex - 1));
}

function showSlide(index, { skipSnapshot = false } = {}) {
  if (!slides.length) {
    return;
  }

  if (!skipSnapshot) {
    persistActiveSlideState();
  }

  const total = slides.length;
  activeSlideIndex = ((index % total) + total) % total;

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === activeSlideIndex;
    slide.classList.toggle("hidden", !isActive);
    slide.classList.toggle("is-active", isActive);
  });

  const activeSlide = slides[activeSlideIndex];
  if (activeSlide) {
    const mountTarget = activeSlide.querySelector(".slide-inner") ?? activeSlide;
    if (!mountTarget.contains(canvas)) {
      mountTarget.appendChild(canvas);
    }
    loadStateForSlide(getSlideId(activeSlide, activeSlideIndex));
    hydrateRemoteImages(activeSlide).catch((error) => {
      console.warn("Remote image hydration failed in the authoring workspace", error);
    });
  }

  updatePlaceholderVisibility();
  updateCounter();
  updateSlideNavigatorMeta();
}

function updateCounter() {
  if (!slideCounter) return;
  const total = slides.length;
  const current = total ? activeSlideIndex + 1 : 0;
  slideCounter.textContent = `${current} / ${total}`;
}

function getSlideId(slide, indexFallback) {
  if (slide && typeof slide === "object") {
    const datasetId = slide.dataset?.slideId;
    if (datasetId) {
      return datasetId;
    }
    if (typeof slide.id === "string" && slide.id.trim()) {
      return slide.id;
    }
  }
  if (typeof indexFallback === "number") {
    return `slide-${indexFallback + 1}`;
  }
  return "slide";
}

function persistActiveSlideState() {
  const slide = slides[activeSlideIndex];
  if (!slide) return;
  slideStates.set(getSlideId(slide, activeSlideIndex), serializeBlocks());
}

function loadStateForSlide(slideId) {
  const state = slideStates.get(slideId);
  if (state) {
    loadState(state, { replaceExisting: true, skipPersist: true });
  } else {
    clearBlocks();
    updatePlaceholderVisibility();
  }
}

function saveWorkspaceToLocalStorage() {
  if (!window.localStorage) return;
  try {
    const payload = buildWorkspacePayload();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to save workspace to localStorage", error);
    setStatusMessage("Saving to browser storage failed. Check available space and try again.", "error");
  }
}

function loadWorkspaceFromLocalStorage() {
  if (!window.localStorage) {
    setStatusMessage("Local storage is unavailable in this browser.", "error");
    return;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setStatusMessage("No saved workspace found in this browser.", "error");
      return;
    }
    const state = parseWorkspaceState(stored);
    applyWorkspaceState(state);
    setStatusMessage("Loaded workspace from browser storage.", "success");
  } catch (error) {
    console.error("Failed to load workspace from localStorage", error);
    setStatusMessage("We couldn't load your saved workspace.", "error");
  }
}

function restoreFromLocalStorage() {
  if (!window.localStorage) return false;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return false;
    }
    const state = parseWorkspaceState(stored);
    applyWorkspaceState(state, { silent: true });
    setStatusMessage("Restored your last saved workspace.", "success");
    return true;
  } catch (error) {
    console.warn("No restorable workspace state found", error);
    return false;
  }
}

function parseWorkspaceState(json) {
  const parsed = typeof json === "string" ? JSON.parse(json) : json;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Workspace state must be an object.");
  }
  return parsed;
}

function buildWorkspacePayload() {
  persistActiveSlideState();
  const payload = { slides: {}, activeSlideId: null };
  slides.forEach((slide, index) => {
    const id = getSlideId(slide, index);
    const state = slideStates.get(id) ?? { blocks: [] };
    payload.slides[id] = state;
    if (index === activeSlideIndex) {
      payload.activeSlideId = id;
    }
  });
  if (!payload.activeSlideId && slides.length) {
    payload.activeSlideId = getSlideId(slides[0], 0);
  }
  return payload;
}

function applyWorkspaceState(state, { silent = false } = {}) {
  if (!state || typeof state !== "object") {
    throw new Error("Workspace state is malformed.");
  }

  slideStates.clear();
  if (state.slides && typeof state.slides === "object") {
    Object.entries(state.slides).forEach(([id, value]) => {
      if (value && typeof value === "object") {
        slideStates.set(id, value);
      }
    });
  }

  const targetId = state.activeSlideId && slideStates.has(state.activeSlideId)
    ? state.activeSlideId
    : getSlideId(slides[0] ?? {}, 0);
  const targetIndex = slides.findIndex((slide, index) => getSlideId(slide, index) === targetId);

  if (targetIndex >= 0) {
    showSlide(targetIndex, { skipSnapshot: true });
  } else if (slides.length) {
    showSlide(0, { skipSnapshot: true });
  }

  if (!silent) {
    setStatusMessage("Workspace state applied.", "success");
  }
}

function exportWorkspaceState() {
  try {
    const payload = buildWorkspacePayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "noor-community-workspace.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatusMessage("Download started. Check your downloads folder for the JSON export.", "success");
  } catch (error) {
    console.error("Failed to export workspace", error);
    setStatusMessage("We couldn't export the workspace. Try again.", "error");
  }
}

async function insertSelectedTemplate() {
  if (!(templateSelect instanceof HTMLSelectElement)) {
    return;
  }
  const templateId = templateSelect.value;
  if (!templateId) {
    setStatusMessage("Choose a template before inserting it into a module block.", "error");
    return;
  }

  const manifestEntry = TEMPLATE_MANIFEST.find((entry) => entry.id === templateId);
  if (!manifestEntry) {
    setStatusMessage("That template is unavailable.", "error");
    return;
  }

  const activeBlock = canvas?.querySelector(".block.is-active");
  if (!(activeBlock instanceof HTMLElement) || activeBlock.dataset.type !== "module") {
    setStatusMessage("Select a module block first, then try inserting the template again.", "error");
    return;
  }

  const moduleContent = activeBlock.querySelector(".module-content");
  if (!(moduleContent instanceof HTMLElement)) {
    setStatusMessage("The selected block doesn't support templates.", "error");
    return;
  }

  setStatusMessage(`Loading the ${manifestEntry.label} template…`);

  try {
    const response = await fetch(manifestEntry.path);
    if (!response.ok) {
      throw new Error(`Template request failed with status ${response.status}`);
    }
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const html = doc.body ? doc.body.innerHTML : text;

    moduleContent.innerHTML = sanitizeHTML(html);
    scheduleSave();
    await hydrateRemoteImages(activeBlock);
    showBlockMessage(activeBlock, `${manifestEntry.label} template inserted.`, {
      duration: 3200,
    });
    setStatusMessage(`${manifestEntry.label} template inserted.`, "success");
  } catch (error) {
    console.error("Failed to insert template", error);
    setStatusMessage("We couldn't insert that template. Check the console for details.", "error");
  }
}

function setStatusMessage(message, tone = "info") {
  if (!(statusBanner instanceof HTMLElement)) {
    return;
  }
  statusBanner.textContent = message;
  statusBanner.dataset.tone = tone;
}

canvas?.addEventListener("click", (event) => {
  const actionButton = event.target.closest(".block__action");
  if (!actionButton) return;

  const block = actionButton.closest(".block");
  if (!block) return;

  const action = actionButton.dataset.action;
  if (action === "remove") {
    block.remove();
    updatePlaceholderVisibility();
    scheduleSave();
    setStatusMessage("Block removed from the slide.", "success");
    return;
  }

  if (action === "rename" && block.dataset.type === "text") {
    const currentName = block.dataset.name || "Text block";
    const response = window.prompt("Rename text block", currentName);
    if (response === null) return;

    const trimmed = response.trim();
    if (!trimmed) {
      showBlockMessage(block, "Name must contain at least one character.", {
        tone: "error",
        duration: 4000,
      });
      return;
    }

    if (trimmed.length > 60) {
      showBlockMessage(block, "Name must be 60 characters or fewer.", {
        tone: "error",
        duration: 4000,
      });
      return;
    }

    block.dataset.name = trimmed;
    const title = block.querySelector(".block__title");
    if (title) {
      title.textContent = trimmed;
    }
    showBlockMessage(block, `Renamed to “${trimmed}”.`);
    scheduleSave();
  }
});

canvas?.addEventListener("dblclick", (event) => {
  if (event.target === canvas) {
    addBlockToCanvas(createTextBlock());
  }
});
