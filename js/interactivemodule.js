import { initSlideNavigator } from "./slideNavigator.js";

// Shared interactive module for Noor Community decks

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
let addTextboxBtn;
let addImageBtn;
let addImageInput;
let addActivitySelect;

const TEMPLATE_BASE_URL = "https://najma-collective.github.io/Noor-Community-/Templates/";


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

export async function hydrateRemoteImages(root = document) {
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

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!(file instanceof Blob)) {
      reject(new Error("Invalid image data"));
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Failed to read image data"));
    });
    reader.readAsDataURL(file);
  });

let slides = [];
let currentSlideIndex = 0;
let mindMapId = 0;

const normaliseWhitespace = (text) =>
  typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";

const normaliseResponseValue = (value) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLowerCase() : "";

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
  <p class="blank-hint" data-role="hint">Add textboxes, paste images, or build a mind map to capture relationships.</p>
  <div class="blank-canvas" role="region" aria-label="Blank slide workspace"></div>
</div>
    </div>
  `;
  return slide;
}

export function attachBlankSlideEvents(slide) {
  const canvas = slide.querySelector(".blank-canvas");
  const hint = slide.querySelector('[data-role="hint"]');
  const addTextboxBtn = slide.querySelector('[data-action="add-textbox"]');
  const addMindmapBtn = slide.querySelector('[data-action="add-mindmap"]');

  if (!(canvas instanceof HTMLElement) || !(hint instanceof HTMLElement)) {
    return;
  }

  const DEFAULT_HINT =
    "Add textboxes, paste images, or build a mind map to capture relationships.";
  const TEXTBOX_HINT =
    "Drag your textboxes into place, double-click to edit, and use the colour dots to organise ideas.";
  const IMAGE_HINT =
    "Paste images to bring ideas to life. Drag to move them and use the corner handle to resize.";
  const MIXED_HINT =
    "Combine textboxes and images to map your ideas visually.";
  const MINDMAP_HINT =
    "Mind map ready. Categorise branches, sort ideas, or copy a summary with the toolbar.";

  if (!canvas.hasAttribute("tabindex")) {
    canvas.setAttribute("tabindex", "0");
  }

  function updateHintForCanvas() {
    if (!(hint instanceof HTMLElement)) return;
    const hasMindmap = Boolean(canvas.querySelector(".mindmap"));
    const hasTextbox = Boolean(canvas.querySelector(".textbox"));
    const hasImage = Boolean(canvas.querySelector(".pasted-image"));

    if (hasMindmap) {
      hint.textContent = MINDMAP_HINT;
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

  canvas.addEventListener("paste", (event) => {
    handleCanvasPaste(event).catch((error) => {
      console.warn("Image paste failed", error);
    });
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (event.target === canvas) {
      canvas.focus({ preventScroll: true });
    }
  });

  canvas.__deckUpdateHintForCanvas = updateHintForCanvas;
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
    <div class="textbox-handle" data-drag-handle>
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
    <div class="textbox-handle pasted-image-handle" data-drag-handle>
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

function getActiveSlideElement() {
  if (!Array.isArray(slides) || !slides.length) {
    return null;
  }
  const index = Math.min(Math.max(0, currentSlideIndex), slides.length - 1);
  const slide = slides[index];
  return slide instanceof HTMLElement ? slide : null;
}

function getActiveSlideCanvas(slide = getActiveSlideElement()) {
  if (!(slide instanceof HTMLElement)) {
    return null;
  }
  const blankCanvas = slide.querySelector(".blank-canvas");
  if (blankCanvas instanceof HTMLElement) {
    return blankCanvas;
  }
  const inner = slide.querySelector(".slide-inner");
  return inner instanceof HTMLElement ? inner : null;
}

function getCanvasHintUpdater(canvas) {
  if (canvas && typeof canvas.__deckUpdateHintForCanvas === "function") {
    return canvas.__deckUpdateHintForCanvas;
  }
  return null;
}

function notifyCanvasContentChanged(canvas) {
  const updateHint = getCanvasHintUpdater(canvas);
  if (typeof updateHint === "function") {
    try {
      updateHint();
    } catch (error) {
      console.warn("Failed to refresh blank slide hint", error);
    }
  }
}

let moduleEditorModal = null;
let moduleEditorFieldIdCounter = 0;
let activityEditorListenerAttached = false;

function getActivityTypeLabel(type) {
  const labels = {
    "gap-fill": "Gap Fill",
    "matching-connect": "Matching Connections",
  };
  return labels[type] ?? "Activity";
}

function getNextModuleEditorFieldId() {
  moduleEditorFieldIdCounter += 1;
  return `module-editor-field-${moduleEditorFieldIdCounter}`;
}

function ensureModuleEditorModal() {
  if (moduleEditorModal) {
    return moduleEditorModal;
  }

  if (typeof document === "undefined") {
    return null;
  }

  const overlay = document.createElement("div");
  overlay.className = "module-editor-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(15, 23, 42, 0.62)",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    zIndex: "2147483647",
  });

  const dialog = document.createElement("div");
  dialog.className = "module-editor-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.tabIndex = -1;
  Object.assign(dialog.style, {
    background: "#FFFFFF",
    borderRadius: "16px",
    boxShadow: "0 24px 48px rgba(15, 23, 42, 0.2)",
    width: "min(680px, 100%)",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    padding: "1.5rem",
    gap: "1rem",
  });

  const header = document.createElement("div");
  Object.assign(header.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  });

  const title = document.createElement("h2");
  title.className = "module-editor-title";
  Object.assign(title.style, {
    fontSize: "1.25rem",
    margin: 0,
    fontWeight: "600",
    color: "#1F2937",
  });

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close editor");
  closeBtn.innerHTML = "&times;";
  Object.assign(closeBtn.style, {
    border: "none",
    background: "none",
    color: "#6B7280",
    fontSize: "1.75rem",
    lineHeight: "1",
    cursor: "pointer",
  });

  header.append(title, closeBtn);

  const form = document.createElement("form");
  form.noValidate = true;
  Object.assign(form.style, {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    overflow: "hidden",
    flexGrow: "1",
  });

  const body = document.createElement("div");
  body.className = "module-editor-body";
  Object.assign(body.style, {
    display: "grid",
    gap: "1rem",
    overflowY: "auto",
  });

  const footer = document.createElement("div");
  Object.assign(footer.style, {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    paddingTop: "0.5rem",
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "activity-btn secondary";
  cancelBtn.textContent = "Cancel";

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.className = "activity-btn";
  saveBtn.textContent = "Save";

  footer.append(cancelBtn, saveBtn);
  form.append(body, footer);
  dialog.append(header, form);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const state = {
    overlay,
    dialog,
    form,
    body,
    title,
    saveBtn,
    cancelBtn,
    closeBtn,
    isOpen: false,
    currentSubmitHandler: null,
    close() {
      if (!state.isOpen) {
        return;
      }
      state.isOpen = false;
      overlay.style.display = "none";
      overlay.setAttribute("aria-hidden", "true");
      state.body.innerHTML = "";
      if (state.currentSubmitHandler) {
        state.form.removeEventListener("submit", state.currentSubmitHandler);
        state.currentSubmitHandler = null;
      }
      state.form.reset();
      state.activeActivity = null;
    },
  };

  function handleOverlayClick(event) {
    if (event.target === overlay) {
      state.close();
    }
  }

  overlay.addEventListener("click", handleOverlayClick);
  cancelBtn.addEventListener("click", () => state.close());
  closeBtn.addEventListener("click", () => state.close());
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      state.close();
    }
  });

  moduleEditorModal = state;
  return moduleEditorModal;
}

function createModuleEditorField({
  label,
  name,
  value = "",
  multiline = false,
  description = "",
  rows = 3,
}) {
  if (!name) {
    return null;
  }
  const wrapper = document.createElement("div");
  Object.assign(wrapper.style, {
    display: "grid",
    gap: "0.35rem",
  });

  const fieldId = getNextModuleEditorFieldId();
  const labelEl = document.createElement("label");
  labelEl.setAttribute("for", fieldId);
  labelEl.textContent = label ?? name;
  Object.assign(labelEl.style, {
    fontWeight: "600",
    fontSize: "0.95rem",
    color: "#111827",
  });

  let input;
  if (multiline) {
    input = document.createElement("textarea");
    input.rows = rows;
  } else {
    input = document.createElement("input");
    input.type = "text";
  }
  input.id = fieldId;
  input.name = name;
  input.value = typeof value === "string" ? value : "";
  Object.assign(input.style, {
    width: "100%",
    padding: "0.6rem 0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(100, 116, 139, 0.4)",
    fontSize: "0.95rem",
    lineHeight: "1.4",
    resize: multiline ? "vertical" : "none",
  });

  wrapper.append(labelEl, input);

  if (description) {
    const hint = document.createElement("p");
    hint.textContent = description;
    Object.assign(hint.style, {
      margin: 0,
      fontSize: "0.85rem",
      color: "#4B5563",
    });
    wrapper.appendChild(hint);
  }

  return wrapper;
}

function updateDataAttribute(element, attribute, value) {
  if (!(element instanceof HTMLElement)) {
    return;
  }
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (trimmed) {
    element.setAttribute(attribute, trimmed);
  } else {
    element.removeAttribute(attribute);
  }
}

function buildGapFillEditorFields(activityEl) {
  const fields = [];
  const inputs = Array.from(activityEl.querySelectorAll(".gap-input"));
  inputs.forEach((input, index) => {
    const label = `Gap ${index + 1} answer`;
    fields.push({
      label,
      name: `gap-${index}-answer`,
      value: input.dataset.answer ?? "",
      multiline: false,
      apply(root, newValue) {
        const clones = Array.from(root.querySelectorAll(".gap-input"));
        const target = clones[index];
        if (target instanceof HTMLElement) {
          updateDataAttribute(target, "data-answer", newValue);
        }
      },
    });
  });
  return { fields, type: "gap-fill" };
}

function buildMatchingConnectEditorFields(activityEl) {
  const fields = [];
  const questions = Array.from(
    activityEl.querySelectorAll(".match-question"),
  );
  const answers = Array.from(activityEl.querySelectorAll(".match-answer"));

  questions.forEach((question, index) => {
    const text = question.querySelector(".match-text")?.textContent?.trim() ?? "";
    const idValue = question.dataset.questionId ?? "";
    const expected = question.dataset.answer ?? "";

    fields.push({
      label: `Question ${index + 1} text`,
      name: `question-${index}-text`,
      value: text,
      multiline: true,
      rows: 2,
      apply(root, newValue) {
        const clones = Array.from(
          root.querySelectorAll(".match-question"),
        );
        const target = clones[index];
        const textEl = target?.querySelector?.(".match-text");
        if (textEl) {
          textEl.textContent = typeof newValue === "string" ? newValue : "";
        }
      },
    });

    fields.push({
      label: `Question ${index + 1} expected answer`,
      name: `question-${index}-answer`,
      value: expected,
      apply(root, newValue) {
        const clones = Array.from(
          root.querySelectorAll(".match-question"),
        );
        const target = clones[index];
        if (target instanceof HTMLElement) {
          updateDataAttribute(target, "data-answer", newValue);
        }
      },
    });

    fields.push({
      label: `Question ${index + 1} ID`,
      name: `question-${index}-id`,
      value: idValue,
      apply(root, newValue) {
        const clones = Array.from(
          root.querySelectorAll(".match-question"),
        );
        const target = clones[index];
        if (target instanceof HTMLElement) {
          updateDataAttribute(target, "data-question-id", newValue);
        }
      },
    });
  });

  answers.forEach((answer, index) => {
    const text = answer.querySelector(".match-text")?.textContent?.trim() ?? "";
    const value = answer.dataset.value ?? "";

    fields.push({
      label: `Answer ${index + 1} text`,
      name: `answer-${index}-text`,
      value: text,
      multiline: true,
      rows: 2,
      apply(root, newValue) {
        const clones = Array.from(root.querySelectorAll(".match-answer"));
        const target = clones[index];
        const textEl = target?.querySelector?.(".match-text");
        if (textEl) {
          textEl.textContent = typeof newValue === "string" ? newValue : "";
        }
      },
    });

    fields.push({
      label: `Answer ${index + 1} value`,
      name: `answer-${index}-value`,
      value,
      apply(root, newValue) {
        const clones = Array.from(root.querySelectorAll(".match-answer"));
        const target = clones[index];
        if (target instanceof HTMLElement) {
          updateDataAttribute(target, "data-value", newValue);
        }
      },
    });
  });

  return { fields, type: "matching-connect" };
}

function buildActivityEditorSchema(activityEl) {
  const type = activityEl?.dataset?.activity ?? "";
  if (type === "gap-fill") {
    return buildGapFillEditorFields(activityEl);
  }
  if (type === "matching-connect") {
    return buildMatchingConnectEditorFields(activityEl);
  }
  if (activityEl?.querySelector?.(".gap-input")) {
    return buildGapFillEditorFields(activityEl);
  }
  if (activityEl?.querySelector?.(".match-question")) {
    return buildMatchingConnectEditorFields(activityEl);
  }
  return { fields: [], type };
}

function resetActivityRuntimeState(activityEl, type) {
  if (!(activityEl instanceof HTMLElement)) {
    return;
  }
  const effectiveType = type || activityEl.dataset.activity;
  if (effectiveType === "gap-fill") {
    activityEl.querySelectorAll(".gap-input").forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.value = "";
        input.classList.remove("correct", "incorrect");
      }
    });
    const feedback = activityEl.querySelector(".feedback-msg");
    if (feedback instanceof HTMLElement) {
      feedback.textContent = "";
      feedback.className = "feedback-msg";
    }
    return;
  }
  if (effectiveType === "matching-connect") {
    activityEl.querySelectorAll(".match-question").forEach((question) => {
      if (question instanceof HTMLElement) {
        question.classList.remove("paired", "incorrect", "active");
        question.dataset.selected = "";
        const label = question.querySelector(".match-assignment");
        if (label) {
          label.textContent = "";
        }
      }
    });
    activityEl.querySelectorAll(".match-answer").forEach((answer) => {
      if (answer instanceof HTMLElement) {
        answer.classList.remove("paired", "incorrect", "active");
        answer.dataset.selected = "";
      }
    });
    const feedback = activityEl.querySelector(".feedback-msg");
    if (feedback instanceof HTMLElement) {
      feedback.textContent = "";
      feedback.className = "feedback-msg";
    }
  }
}

function openModuleEditor(activityElement) {
  if (!(activityElement instanceof HTMLElement)) {
    return;
  }
  const modal = ensureModuleEditorModal();
  if (!modal) {
    return;
  }

  const { fields, type: detectedType } = buildActivityEditorSchema(activityElement);
  const typeLabel = getActivityTypeLabel(detectedType || activityElement.dataset.activity || "");

  modal.title.textContent = `Edit ${typeLabel}`;
  modal.body.innerHTML = "";
  modal.activeActivity = activityElement;

  const hasFields = Array.isArray(fields) && fields.length > 0;
  modal.saveBtn.disabled = !hasFields;

  if (hasFields) {
    fields.forEach((fieldDef) => {
      const field = createModuleEditorField(fieldDef);
      if (field) {
        modal.body.appendChild(field);
      }
    });
  } else {
    const message = document.createElement("p");
    message.textContent =
      "Editing isn't available for this activity yet. Try selecting a gap-fill or matching connect activity.";
    Object.assign(message.style, {
      margin: 0,
      fontSize: "0.95rem",
      color: "#4B5563",
    });
    modal.body.appendChild(message);
  }

  if (modal.currentSubmitHandler) {
    modal.form.removeEventListener("submit", modal.currentSubmitHandler);
    modal.currentSubmitHandler = null;
  }

  if (hasFields) {
    const submitHandler = (event) => {
      event.preventDefault();
      const formData = new FormData(modal.form);
      const clone = activityElement.cloneNode(true);

      fields.forEach((field) => {
        if (typeof field.apply !== "function") {
          return;
        }
        const rawValue = formData.get(field.name);
        const value = typeof rawValue === "string" ? rawValue : "";
        try {
          field.apply(clone, value);
        } catch (error) {
          console.warn("Failed to apply editor field update", error);
        }
      });

      resetActivityRuntimeState(clone, detectedType);
      activityElement.replaceWith(clone);
      applyActivitySetup(clone);
      const canvas = clone.closest?.(".blank-canvas");
      if (canvas instanceof HTMLElement) {
        notifyCanvasContentChanged(canvas);
      }
      modal.close();
    };

    modal.currentSubmitHandler = submitHandler;
    modal.form.addEventListener("submit", submitHandler);
  }

  modal.overlay.style.display = "flex";
  modal.overlay.setAttribute("aria-hidden", "false");
  modal.isOpen = true;
  requestAnimationFrame(() => {
    modal.dialog.focus();
  });
}

function ensureActivityEditorListener() {
  if (activityEditorListenerAttached || typeof document === "undefined") {
    return;
  }
  const handler = (event) => {
    if (!(event.target instanceof Node)) {
      return;
    }
    const modal = moduleEditorModal;
    if (modal?.isOpen && modal.overlay.contains(event.target)) {
      return;
    }
    const element =
      event.target instanceof Element
        ? event.target.closest("[data-activity]")
        : null;
    if (!element) {
      return;
    }
    openModuleEditor(element);
  };
  document.addEventListener("dblclick", handler);
  activityEditorListenerAttached = true;
}

function positionDeckActivity(activity, canvas) {
  if (!(activity instanceof HTMLElement) || !(canvas instanceof HTMLElement)) {
    return;
  }
  const siblings = Array.from(canvas.querySelectorAll(".deck-activity"));
  const index = Math.max(0, siblings.indexOf(activity));
  const offset = 28 * index;
  if (!activity.style.left) {
    activity.style.left = `${offset}px`;
  }
  if (!activity.style.top) {
    activity.style.top = `${offset}px`;
  }
  if (!activity.style.width) {
    const canvasWidth = canvas.clientWidth || 640;
    const baseWidth = Math.min(Math.max(320, Math.round(canvasWidth * 0.65)), canvasWidth);
    activity.style.width = `${baseWidth}px`;
  }
  if (!activity.style.height) {
    const numericWidth = parseFloat(activity.style.width);
    const baseHeight = Number.isFinite(numericWidth)
      ? Math.max(260, Math.round(numericWidth * 0.62))
      : 320;
    activity.style.height = `${baseHeight}px`;
  }
}

function createDeckActivityWrapper({
  content,
  label,
  onRemove,
  templateValue,
  icon = "fa-puzzle-piece",
} = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = "deck-activity";
  if (typeof templateValue === "string" && templateValue) {
    wrapper.dataset.template = templateValue;
  }

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "textbox-remove deck-activity-remove";
  removeBtn.setAttribute("aria-label", "Remove activity");
  removeBtn.innerHTML =
    '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';

  const handle = document.createElement("div");
  handle.className = "textbox-handle";
  handle.dataset.dragHandle = "";

  const title = document.createElement("span");
  title.className = "textbox-title";
  const iconEl = document.createElement("i");
  iconEl.className = `fa-solid ${icon}`;
  iconEl.setAttribute("aria-hidden", "true");
  const textNode = document.createElement("span");
  textNode.textContent = ` ${
    typeof label === "string" && label.trim() ? label.trim() : "Activity"
  }`;
  title.append(iconEl, textNode);
  handle.appendChild(title);

  const body = document.createElement("div");
  body.className = "deck-activity-body";
  if (content instanceof HTMLElement || content instanceof DocumentFragment) {
    body.appendChild(content);
  } else if (content) {
    body.append(content);
  }

  const resizer = document.createElement("button");
  resizer.type = "button";
  resizer.className = "deck-activity-resizer resize-handle";
  resizer.setAttribute("aria-label", "Resize activity");
  resizer.innerHTML =
    '<i class="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true"></i>';

  wrapper.append(removeBtn, handle, body, resizer);

  const activityRoot = body.querySelector("[data-activity]");
  if (activityRoot instanceof HTMLElement && activityRoot.dataset.activity) {
    wrapper.dataset.activity = activityRoot.dataset.activity;
  }

  removeBtn.addEventListener("click", () => {
    wrapper.remove();
    if (typeof onRemove === "function") {
      onRemove();
    }
  });

  resizer.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  makeDraggable(wrapper);
  makeResizable(wrapper, {
    handleSelector: ".deck-activity-resizer",
    minWidth: 280,
    minHeight: 220,
  });

  return wrapper;
}

export function makeDraggable(element) {
  if (!(element instanceof HTMLElement)) return;
  if (element.__deckDraggableInitialised) {
    return;
  }
  element.__deckDraggableInitialised = true;

  const dragHandleCandidate = element.querySelector("[data-drag-handle]");
  const handle =
    dragHandleCandidate instanceof HTMLElement ? dragHandleCandidate : element;
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
    const maxX = Math.max(0, canvas.clientWidth - element.offsetWidth);
    const maxY = Math.max(0, canvas.clientHeight - element.offsetHeight);
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

function createDragHandle() {
  const handle = document.createElement("div");
  handle.className = "textbox-handle";
  handle.dataset.dragHandle = "";
  handle.innerHTML = `
    <i class="fa-solid fa-up-down-left-right" aria-hidden="true"></i>
    <span class="sr-only">Move text</span>
  `;
  handle.setAttribute("contenteditable", "false");
  return handle;
}

function createResizeHandle() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pasted-image-resizer resize-handle";
  button.innerHTML = `
    <i class="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true"></i>
    <span class="sr-only">Resize text</span>
  `;
  button.setAttribute("contenteditable", "false");
  return button;
}

function ensureEditableWrapper(element) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  if (element.closest(".editable-wrapper")) {
    const wrapper = element.closest(".editable-wrapper");
    if (wrapper instanceof HTMLElement) {
      return wrapper;
    }
  }

  const parent = element.parentElement;
  if (!parent) {
    return null;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "editable-wrapper";
  parent.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  return wrapper;
}

function getRelativeRect(element) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  const parent = element.parentElement;
  if (!(parent instanceof HTMLElement)) {
    return null;
  }

  const elementRect = element.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  const parentStyle = window.getComputedStyle(parent);
  const parse = (value) => Number.parseFloat(value) || 0;

  const borderLeft = parse(parentStyle.borderLeftWidth);
  const borderTop = parse(parentStyle.borderTopWidth);
  const paddingLeft = parse(parentStyle.paddingLeft);
  const paddingTop = parse(parentStyle.paddingTop);

  return {
    left:
      elementRect.left -
      parentRect.left -
      borderLeft -
      paddingLeft +
      parent.scrollLeft,
    top:
      elementRect.top -
      parentRect.top -
      borderTop -
      paddingTop +
      parent.scrollTop,
    width: elementRect.width,
    height: elementRect.height,
  };
}

function ensureEditableControls(wrapper, target, initialRect) {
  if (!(wrapper instanceof HTMLElement)) {
    return;
  }

  const hasInitialised = wrapper.dataset.deckEditableControls === "true";

  wrapper.classList.add("editable-wrapper");

  const parent = wrapper.parentElement;
  if (parent instanceof HTMLElement) {
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.position === "static") {
      parent.dataset.deckEditableParentPosition = parentStyle.position;
      parent.style.position = "relative";
    }
  }

  if (!wrapper.style.position || wrapper.style.position === "static") {
    wrapper.style.position = "absolute";
  }

  if (!wrapper.style.zIndex) {
    wrapper.style.zIndex = "5";
  }

  const geometry = initialRect ?? null;
  if (geometry) {
    if (Number.isFinite(geometry.left)) {
      wrapper.style.left = `${Math.max(0, geometry.left)}px`;
    }
    if (Number.isFinite(geometry.top)) {
      wrapper.style.top = `${Math.max(0, geometry.top)}px`;
    }
    if (Number.isFinite(geometry.width) && geometry.width > 0) {
      wrapper.style.width = `${geometry.width}px`;
    }
    if (Number.isFinite(geometry.height) && geometry.height > 0) {
      wrapper.style.minHeight = `${geometry.height}px`;
    }
  } else if (!hasInitialised) {
    if (!wrapper.style.left) {
      wrapper.style.left = "0px";
    }
    if (!wrapper.style.top) {
      wrapper.style.top = "0px";
    }
  }

  let dragHandle = wrapper.querySelector(":scope > .textbox-handle");
  if (!(dragHandle instanceof HTMLElement)) {
    dragHandle = createDragHandle();
    if (target instanceof HTMLElement && target.parentElement === wrapper) {
      wrapper.insertBefore(dragHandle, target);
    } else {
      wrapper.insertBefore(dragHandle, wrapper.firstChild);
    }
  }
  if (dragHandle instanceof HTMLElement) {
    dragHandle.dataset.dragHandle = "";
  }

  let resizeHandle = wrapper.querySelector(":scope > .resize-handle");
  if (!(resizeHandle instanceof HTMLElement)) {
    resizeHandle = createResizeHandle();
    wrapper.appendChild(resizeHandle);
  }

  if (!hasInitialised) {
    makeDraggable(wrapper);
    makeResizable(wrapper);
  }

  wrapper.dataset.deckEditableControls = "true";
}

function makeSlideEditable(slideElement) {
  if (!(slideElement instanceof HTMLElement)) {
    return;
  }

  const textSelectors = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "ul",
    "ol",
    ".deck-subtitle",
  ].join(", ");

  const textNodes = Array.from(slideElement.querySelectorAll(textSelectors));
  textNodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    if (node.dataset.deckEditableInitialised === "true") {
      return;
    }
    const rect = getRelativeRect(node);
    node.dataset.deckEditableInitialised = "true";
    node.contentEditable = "true";
    node.classList.add("editable-text");
    const wrapper = ensureEditableWrapper(node);
    ensureEditableControls(wrapper, node, rect);
  });

  const activityNodes = Array.from(
    slideElement.querySelectorAll("[data-activity]"),
  );

  activityNodes.forEach((activity) => {
    if (!(activity instanceof HTMLElement)) {
      return;
    }
    const existingWrapper = activity.closest(
      ".deck-activity, .editable-wrapper, .pasted-image",
    );
    if (existingWrapper instanceof HTMLElement) {
      ensureEditableControls(existingWrapper, activity);
      return;
    }
    const rect = getRelativeRect(activity);
    const wrapper = ensureEditableWrapper(activity);
    ensureEditableControls(wrapper ?? activity, activity, rect);
  });
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

const ACTIVITY_SETUP_HANDLERS = {
  unscramble: setupUnscramble,
  "gap-fill": setupGapFill,
  "table-completion": setupClickPlacement,
  "token-drop": setupClickPlacement,
  matching: setupMatching,
  "matching-connect": setupMatchingConnect,
  "mc-grammar": setupMcGrammar,
  "mc-grammar-radio": setupMcGrammarRadio,
  categorization: setupCategorization,
  "stress-mark": setupStressMark,
};

function getActivitySetupHandler(type) {
  if (typeof type !== "string" || !type) {
    return null;
  }
  return ACTIVITY_SETUP_HANDLERS[type] ?? null;
}

function normaliseTemplateKey(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function extractTemplateText(node) {
  if (!(node instanceof Node)) {
    return "";
  }
  return normaliseWhitespace(node.textContent ?? "");
}

function appendTemplateInstructions(container, source) {
  if (!(container instanceof HTMLElement) || !(source instanceof HTMLElement)) {
    return;
  }

  const heading = source.querySelector("#activity-titles h1, h1, h2");
  if (heading instanceof HTMLElement) {
    const clone = heading.cloneNode(true);
    clone.removeAttribute("id");
    container.appendChild(clone);
  }

  const rubric = source.querySelector(".rubric");
  const rubricText = extractTemplateText(rubric);
  if (rubricText) {
    const instructions = document.createElement("p");
    instructions.textContent = rubricText;
    container.appendChild(instructions);
  }
}

function createActivityActions({
  checkLabel = "Check Answers",
  resetLabel = "Reset",
  includeReset = true,
} = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = "activity-actions";

  const checkBtn = document.createElement("button");
  checkBtn.type = "button";
  checkBtn.className = "activity-btn";
  checkBtn.dataset.action = "check";
  checkBtn.textContent = checkLabel;
  wrapper.appendChild(checkBtn);

  if (includeReset) {
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "activity-btn secondary";
    resetBtn.dataset.action = "reset";
    resetBtn.textContent = resetLabel;
    wrapper.appendChild(resetBtn);
  }

  return wrapper;
}

function createFeedbackElement() {
  const feedback = document.createElement("div");
  feedback.className = "feedback-msg";
  feedback.setAttribute("aria-live", "polite");
  return feedback;
}

function transformGapFillTemplate(source, { activityType } = {}) {
  if (!(source instanceof HTMLElement)) {
    return null;
  }

  const activity = document.createElement("div");
  activity.className = "card";
  activity.dataset.activity = activityType ?? "gap-fill";
  appendTemplateInstructions(activity, source);

  const gapSource =
    source.querySelector(".gapfill-container") ??
    source.querySelector("main") ??
    source.querySelector("section") ??
    source;

  const content = gapSource.cloneNode(true);
  content.querySelectorAll("script").forEach((node) => node.remove());
  content.querySelectorAll(".activity-controls").forEach((node) => node.remove());

  let gapIndex = 0;
  content.querySelectorAll(".gap-wrapper").forEach((wrapper) => {
    if (!(wrapper instanceof HTMLElement)) {
      return;
    }
    gapIndex += 1;
    const answers = (wrapper.dataset.correctAnswer || wrapper.dataset.correctAnswers || "")
      .split("|")
      .map((answer) => normaliseWhitespace(answer))
      .filter(Boolean);
    const placeholderSource =
      wrapper.querySelector("input[placeholder]") ?? wrapper.querySelector("select");
    const placeholder = placeholderSource?.getAttribute("placeholder");
    const ariaLabel =
      wrapper.getAttribute("aria-label") ?? placeholderSource?.getAttribute("aria-label");

    const input = document.createElement("input");
    input.type = "text";
    input.className = "gap-input";
    input.dataset.answer = answers[0] ?? "";
    if (answers.length > 1) {
      input.dataset.altAnswers = JSON.stringify(answers.slice(1));
    }
    if (wrapper.dataset.feedbackTitle) {
      input.dataset.feedbackTitle = wrapper.dataset.feedbackTitle;
    }
    if (wrapper.dataset.explanation) {
      input.dataset.explanation = wrapper.dataset.explanation;
    }
    input.setAttribute("aria-label", ariaLabel || `Gap ${gapIndex}`);
    input.placeholder = placeholder || "Type answer";

    const optionValues = Array.from(
      wrapper.querySelectorAll("option"),
      (option) => normaliseWhitespace(option.textContent || option.value || ""),
    ).filter(Boolean);
    if (optionValues.length) {
      try {
        input.dataset.options = JSON.stringify(optionValues);
      } catch (error) {
        // Ignore JSON issues and fall back to joined string
        input.dataset.options = optionValues.join("|");
      }
    }

    wrapper.replaceWith(input);
  });

  activity.appendChild(content);
  activity.appendChild(createActivityActions());
  activity.appendChild(createFeedbackElement());
  return activity;
}

function transformGroupingTemplate(source, { activityType } = {}) {
  if (!(source instanceof HTMLElement)) {
    return null;
  }

  const activity = document.createElement("div");
  activity.className = "card";
  activity.dataset.activity = activityType ?? "categorization";
  appendTemplateInstructions(activity, source);

  const description = source.querySelector(".dnd-main-container > p");
  if (description instanceof HTMLElement) {
    activity.appendChild(description.cloneNode(true));
  }

  const items = Array.from(source.querySelectorAll(".dnd-item"));
  const categoryZones = Array.from(source.querySelectorAll(".dnd-category-zone"));
  const categoryLabels = new Map(
    categoryZones.map((zone) => [
      zone.id,
      extractTemplateText(zone.querySelector("h3")) || normaliseWhitespace(zone.id),
    ]),
  );

  const tokenBank = document.createElement("div");
  tokenBank.className = "token-bank";

  items.forEach((item, index) => {
    if (!(item instanceof HTMLElement)) {
      return;
    }
    const token = document.createElement("button");
    token.type = "button";
    token.className = "click-token";
    const categoryKey = item.dataset.correctCategory ?? "";
    const categoryLabel =
      categoryLabels.get(categoryKey) ?? normaliseWhitespace(categoryKey) || `Category ${index + 1}`;
    token.dataset.category = categoryLabel;
    const tokenText = extractTemplateText(item) || `Item ${index + 1}`;
    token.dataset.value = tokenText;
    token.textContent = tokenText;
    if (item.dataset.explanation) {
      token.dataset.explanation = item.dataset.explanation;
    }
    tokenBank.appendChild(token);
  });

  const dropWrapper = document.createElement("div");
  dropWrapper.className = "drop-categorization";

  categoryZones.forEach((zone, index) => {
    if (!(zone instanceof HTMLElement)) {
      return;
    }
    const column = document.createElement("div");
    column.className = "category-column";
    const label = categoryLabels.get(zone.id) ?? `Category ${index + 1}`;
    column.dataset.category = label;

    const heading = document.createElement("h3");
    heading.textContent = label;

    const dropZone = document.createElement("div");
    dropZone.className = "drop-zone";

    column.append(heading, dropZone);
    dropWrapper.appendChild(column);
  });

  activity.append(tokenBank, dropWrapper, createActivityActions(), createFeedbackElement());
  return activity;
}

function transformLinkingTemplate(source, { activityType } = {}) {
  if (!(source instanceof HTMLElement)) {
    return null;
  }

  const activity = document.createElement("div");
  activity.className = "card";
  activity.dataset.activity = activityType ?? "matching-connect";
  appendTemplateInstructions(activity, source);

  const leftItems = Array.from(source.querySelectorAll(".link-column.left .linking-item"));
  const rightItems = Array.from(source.querySelectorAll(".link-column.right .linking-item"));
  const rightTextMap = new Map();
  rightItems.forEach((item, index) => {
    if (!(item instanceof HTMLElement)) {
      return;
    }
    const id = item.dataset.linkId || `R${index + 1}`;
    const text = extractTemplateText(item.querySelector(".linking-item-text") ?? item);
    rightTextMap.set(id, text || `Answer ${index + 1}`);
  });

  const answerKeyAttr = source.querySelector("#activity-container")?.dataset.answerKey;
  let pairs = [];
  if (answerKeyAttr) {
    try {
      const parsed = JSON.parse(answerKeyAttr);
      if (Array.isArray(parsed)) {
        pairs = parsed
          .map((entry) => ({
            start: typeof entry?.start === "string" ? entry.start : null,
            end: typeof entry?.end === "string" ? entry.end : null,
          }))
          .filter((entry) => entry.start && entry.end);
      }
    } catch (error) {
      console.warn("Unable to parse linking answer key", error);
    }
  }
  if (!pairs.length) {
    pairs = leftItems.map((item, index) => ({
      start: item?.dataset?.linkId || `L${index + 1}`,
      end: rightItems[index]?.dataset?.linkId || null,
    }));
  }

  const grid = document.createElement("div");
  grid.className = "matching-connect-grid";
  grid.setAttribute("role", "group");
  grid.setAttribute("aria-label", "Connect the related items");

  const questionColumn = document.createElement("div");
  questionColumn.className = "match-column";
  questionColumn.setAttribute("aria-label", "Column A");

  const answerColumn = document.createElement("div");
  answerColumn.className = "match-column";
  answerColumn.setAttribute("aria-label", "Column B");

  leftItems.forEach((item, index) => {
    if (!(item instanceof HTMLElement)) {
      return;
    }
    const questionId = item.dataset.linkId || `L${index + 1}`;
    const questionText =
      extractTemplateText(item.querySelector(".linking-item-text") ?? item) || `Prompt ${index + 1}`;
    const pair = pairs.find((entry) => entry.start === questionId);
    const expectedAnswerId = pair?.end ?? null;
    const expectedText = expectedAnswerId ? rightTextMap.get(expectedAnswerId) : null;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "match-item match-question";
    button.dataset.questionId = questionId;
    if (expectedText) {
      button.dataset.answer = expectedText;
    }

    const textSpan = document.createElement("span");
    textSpan.className = "match-text";
    textSpan.textContent = questionText;

    const assignment = document.createElement("span");
    assignment.className = "match-assignment";
    assignment.setAttribute("aria-live", "polite");

    button.append(textSpan, assignment);
    questionColumn.appendChild(button);
  });

  rightItems.forEach((item, index) => {
    if (!(item instanceof HTMLElement)) {
      return;
    }
    const answerId = item.dataset.linkId || `R${index + 1}`;
    const answerText = rightTextMap.get(answerId) ?? `Answer ${index + 1}`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "match-item match-answer";
    button.dataset.value = answerText;

    const textSpan = document.createElement("span");
    textSpan.className = "match-text";
    textSpan.textContent = answerText;

    button.appendChild(textSpan);
    answerColumn.appendChild(button);
  });

  grid.append(questionColumn, answerColumn);
  activity.append(grid, createActivityActions(), createFeedbackElement());
  return activity;
}

function transformRankingTemplate(source, { activityType } = {}) {
  if (!(source instanceof HTMLElement)) {
    return null;
  }

  const activity = document.createElement("div");
  activity.className = "card";
  activity.dataset.activity = activityType ?? "token-drop";
  appendTemplateInstructions(activity, source);

  const description = source.querySelector(".dnd-main-container > p");
  if (description instanceof HTMLElement) {
    activity.appendChild(description.cloneNode(true));
  }

  const items = Array.from(source.querySelectorAll("#items-pool .dnd-item"));
  if (!items.length) {
    activity.appendChild(createActivityActions());
    activity.appendChild(createFeedbackElement());
    return activity;
  }

  const tokenBank = document.createElement("div");
  tokenBank.className = "token-bank";
  items.forEach((item, index) => {
    if (!(item instanceof HTMLElement)) {
      return;
    }
    const tokenText = extractTemplateText(item) || `Item ${index + 1}`;
    const token = document.createElement("button");
    token.type = "button";
    token.className = "click-token";
    token.dataset.value = tokenText;
    token.textContent = tokenText;
    if (item.dataset.explanation) {
      token.dataset.explanation = item.dataset.explanation;
    }
    tokenBank.appendChild(token);
  });

  const orderedItems = items
    .map((item, index) => ({
      rank: Number.parseInt(item.dataset.correctRank ?? "", 10) || index + 1,
      text: extractTemplateText(item) || `Item ${index + 1}`,
    }))
    .filter((entry) => entry.text)
    .sort((a, b) => a.rank - b.rank || a.text.localeCompare(b.text));

  const list = document.createElement("ol");
  list.className = "ranking-drop-zones";

  orderedItems.forEach((entry, index) => {
    const listItem = document.createElement("li");
    listItem.className = "ranking-slot";

    const label = document.createElement("span");
    label.className = "ranking-label";
    label.textContent = `${index + 1}.`;

    const dropZone = document.createElement("button");
    dropZone.type = "button";
    dropZone.className = "drop-zone placeholder";
    dropZone.dataset.answer = entry.text;
    dropZone.dataset.placeholder = "Select";
    dropZone.setAttribute("aria-label", `Rank ${index + 1}`);

    listItem.append(label, dropZone);
    list.appendChild(listItem);
  });

  activity.append(tokenBank, list, createActivityActions(), createFeedbackElement());
  return activity;
}

const TEMPLATE_ACTIVITY_MAP = {
  gapfill: { activity: "gap-fill", transform: transformGapFillTemplate },
  "dropdown.html": { activity: "gap-fill", transform: transformGapFillTemplate },
  grouping: { activity: "categorization", transform: transformGroupingTemplate },
  linking: { activity: "matching-connect", transform: transformLinkingTemplate },
  "ranking.html": { activity: "token-drop", transform: transformRankingTemplate },
};

function applyActivitySetup(root) {
  if (!(root instanceof HTMLElement)) {
    return;
  }
  const targets = new Set();
  if (root.dataset.activity) {
    targets.add(root);
  }
  const nestedActivities =
    typeof root.querySelectorAll === "function"
      ? Array.from(root.querySelectorAll("[data-activity]"))
      : [];
  nestedActivities.forEach((el) => {
    if (el instanceof HTMLElement) {
      targets.add(el);
    }
  });

  targets.forEach((target) => {
    if (!target.dataset.activity) {
      const templateSource =
        target.dataset.templateSource ??
        target.dataset.template ??
        target.closest?.(".deck-activity")?.dataset?.template;
      const fallbackType = TEMPLATE_ACTIVITY_MAP[
        normaliseTemplateKey(templateSource)
      ]?.activity;
      if (fallbackType) {
        target.dataset.activity = fallbackType;
      }
    }
    const handler = getActivitySetupHandler(target.dataset.activity);
    if (typeof handler === "function") {
      handler(target);
    }
  });
}

async function fetchActivityTemplateContent(templateValue) {
  const value = typeof templateValue === "string" ? templateValue.trim() : "";
  if (!value) {
    throw new Error("Template value is required");
  }
  if (typeof fetch !== "function") {
    throw new Error("Fetch API is unavailable");
  }
  let templateUrl;
  try {
    templateUrl = new URL(value, TEMPLATE_BASE_URL).toString();
  } catch (error) {
    throw new Error(`Invalid template path: ${value}`, { cause: error });
  }

  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Template request failed with status ${response.status}`);
  }
  const html = await response.text();
  const temp = document.createElement("div");
  temp.innerHTML = html;

  let activityRoot =
    temp.querySelector("[data-activity]") ??
    temp.querySelector("main") ??
    temp.querySelector("body") ??
    temp.querySelector("section") ??
    temp.firstElementChild;

  if (activityRoot instanceof HTMLHtmlElement) {
    const bodyCandidate = activityRoot.querySelector("body");
    activityRoot = bodyCandidate || activityRoot.firstElementChild;
  }
  if (activityRoot instanceof HTMLBodyElement && activityRoot.children.length === 1) {
    activityRoot = activityRoot.firstElementChild;
  }

  if (!(activityRoot instanceof HTMLElement)) {
    throw new Error("Template does not include an activity element");
  }

  const clone = activityRoot.cloneNode(true);
  clone.querySelectorAll("script").forEach((script) => script.remove());

  const templateKey = normaliseTemplateKey(value);
  const templateConfig = TEMPLATE_ACTIVITY_MAP[templateKey] ?? null;
  const context = {
    activityType: templateConfig?.activity,
    templateKey,
    templateValue: value,
  };

  let transformed = clone;
  if (typeof templateConfig?.transform === "function") {
    try {
      const result = templateConfig.transform(clone, context);
      if (result instanceof HTMLElement || result instanceof DocumentFragment) {
        transformed = result;
      }
    } catch (error) {
      console.warn(`Template transform failed for "${value}"`, error);
      transformed = clone;
    }
  }

  let resolved;
  if (transformed instanceof DocumentFragment) {
    const wrapper = document.createElement("div");
    wrapper.appendChild(transformed);
    resolved = wrapper;
  } else if (transformed instanceof HTMLElement) {
    resolved = transformed;
  }

  if (!(resolved instanceof HTMLElement)) {
    resolved = clone;
  }

  if (templateConfig?.activity && !resolved.dataset.activity) {
    resolved.dataset.activity = templateConfig.activity;
  }
  resolved.dataset.templateSource = value;
  return resolved;
}

function handleAddTextboxClick() {
  const canvas = getActiveSlideCanvas();
  if (!(canvas instanceof HTMLElement)) {
    console.warn("No active slide is available to add a textbox.");
    return;
  }
  const textbox = createTextbox({
    onRemove: () => notifyCanvasContentChanged(canvas),
  });
  canvas.appendChild(textbox);
  positionTextbox(textbox, canvas);
  notifyCanvasContentChanged(canvas);
  textbox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function handleAddImageClick() {
  addImageInput?.click();
}

async function handleImageInputChange(event) {
  const input = event.currentTarget;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  const files = Array.from(input.files ?? []);
  if (!files.length) {
    return;
  }
  const canvas = getActiveSlideCanvas();
  if (!(canvas instanceof HTMLElement)) {
    console.warn("No active slide is available to add images.");
    input.value = "";
    return;
  }

  for (const file of files) {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!dataUrl) {
        continue;
      }
      const pastedImage = createPastedImage({
        src: dataUrl,
        label: file?.name,
        onRemove: () => notifyCanvasContentChanged(canvas),
      });
      canvas.appendChild(pastedImage);
      positionPastedImage(pastedImage, canvas);
      pastedImage.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) {
      console.warn("Unable to read selected image", error);
    }
  }

  notifyCanvasContentChanged(canvas);
  input.value = "";
}

async function handleAddActivityChange(event) {
  const select = event.currentTarget;
  if (!(select instanceof HTMLSelectElement)) {
    return;
  }
  const value = select.value;
  if (!value) {
    return;
  }

  const canvas = getActiveSlideCanvas();
  if (!(canvas instanceof HTMLElement)) {
    console.warn("No active slide is available to add an activity.");
    select.value = "";
    return;
  }

  const selectedOption = select.options[select.selectedIndex];
  const label = selectedOption?.textContent?.trim() || value;

  select.disabled = true;
  try {
    const activityContent = await fetchActivityTemplateContent(value);
    const activityWrapper = createDeckActivityWrapper({
      content: activityContent,
      label,
      templateValue: value,
      onRemove: () => notifyCanvasContentChanged(canvas),
    });
    canvas.appendChild(activityWrapper);
    positionDeckActivity(activityWrapper, canvas);
    applyActivitySetup(activityWrapper);
    await hydrateRemoteImages(activityWrapper).catch((error) => {
      console.warn("Activity image hydration failed", error);
    });
    notifyCanvasContentChanged(canvas);
    activityWrapper.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    console.error(`Unable to add activity template "${value}"`, error);
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert("Sorry, we couldn't add that activity. Please try again.");
    }
  } finally {
    select.disabled = false;
    select.value = "";
  }
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

  ensureActivityEditorListener();
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
  updateCounter();
  initialiseActivities();
  document
    .querySelectorAll('.slide-stage[data-type="blank"]')
    .forEach((slide) => attachBlankSlideEvents(slide));
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
  if (addTextboxBtn && !addTextboxBtn.__deckControlInitialised) {
    addTextboxBtn.addEventListener("click", handleAddTextboxClick);
    addTextboxBtn.__deckControlInitialised = true;
  }
  if (addImageBtn && !addImageBtn.__deckControlInitialised) {
    addImageBtn.addEventListener("click", handleAddImageClick);
    addImageBtn.__deckControlInitialised = true;
  }
  if (addImageInput && !addImageInput.__deckControlInitialised) {
    addImageInput.addEventListener("change", (event) => {
      handleImageInputChange(event).catch((error) => {
        console.warn("Image upload failed", error);
      });
    });
    addImageInput.__deckControlInitialised = true;
  }
  if (addActivitySelect && !addActivitySelect.__deckControlInitialised) {
    addActivitySelect.addEventListener("change", (event) => {
      handleAddActivityChange(event).catch((error) => {
        console.error("Activity insertion failed", error);
      });
    });
    addActivitySelect.__deckControlInitialised = true;
  }
  document
    .querySelectorAll('.slide-stage:not([data-type="blank"])')
    .forEach((slide) => makeSlideEditable(slide));
  recalibrateMindMapCounter();
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
  addTextboxButtonSelector = "#add-textbox-btn",
  addImageButtonSelector = "#add-image-btn",
  addImageInputSelector = "#add-image-input",
  addActivitySelectSelector = "#add-activity-select",
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
  addTextboxBtn =
    rootElement?.querySelector(addTextboxButtonSelector) ??
    document.querySelector(addTextboxButtonSelector);
  addImageBtn =
    rootElement?.querySelector(addImageButtonSelector) ??
    document.querySelector(addImageButtonSelector);
  addImageInput =
    rootElement?.querySelector(addImageInputSelector) ??
    document.querySelector(addImageInputSelector);
  addActivitySelect =
    rootElement?.querySelector(addActivitySelectSelector) ??
    document.querySelector(addActivitySelectSelector);

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
  slideNavigatorController =
    initSlideNavigator({
      stageViewport,
      onSelectSlide: (index) => showSlide(index),
    }) ?? null;

  try {
    await initialiseDeck();
  } catch (error) {
    console.error("Deck initialisation failed", error);
  }
}

if (typeof window !== "undefined") {
  window.setupInteractiveDeck = setupInteractiveDeck;
}
