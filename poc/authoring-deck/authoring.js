import { initSlideNavigator } from "../../js/slideNavigator.js";

const stageViewport = document.getElementById("stage-viewport");
const slides = Array.from(stageViewport?.querySelectorAll(".slide-stage") ?? []);
const counter = document.querySelector("[data-slide-counter]");
const nextBtn = document.querySelector('[data-action="next"]');
const prevBtn = document.querySelector('[data-action="prev"]');

const TEMPLATE_CONFIG = {
  multipleChoice: {
    url: new URL("../../Templates/multiple-choice.html", import.meta.url),
    selector: ".mc-section",
  },
  gapFill: {
    url: new URL("../../Templates/gapfill", import.meta.url),
    selector: ".gapfill-container",
  },
  matching: {
    url: new URL("../../Templates/Linking", import.meta.url),
    selector: "#activity-container",
  },
};

const ACTIVITY_WIDTHS = {
  narrow: 320,
  medium: 480,
  wide: 640,
};

const templateCache = new Map();
const activityElements = new Map();
const canvasControllers = new Map();
const canvasElementMap = new Map();

const PEXELS_API_KEY = "ntFmvz0n4RpCRtHtRVV7HhAcbb4VQLwyEenPsqfIGdvpVvkgagK2dQEd";

let activeTextContext = null;
let pendingStateNotification = null;

const deckAuthoringState = {
  slides: [],
};

let slideNavigator = null;

let activeIndex = Math.max(
  0,
  slides.findIndex((slide) => !slide.classList.contains("hidden")),
);
if (!Number.isFinite(activeIndex) || activeIndex < 0) {
  activeIndex = 0;
}

if (!slides.length) {
  if (counter) {
    counter.textContent = "No slides available";
  }
  if (prevBtn) {
    prevBtn.disabled = true;
    prevBtn.setAttribute("aria-disabled", "true");
  }
  if (nextBtn) {
    nextBtn.disabled = true;
    nextBtn.setAttribute("aria-disabled", "true");
  }
}

const getUniqueId = (() => {
  let counterRef = 0;
  return (prefix = "activity") => {
    counterRef += 1;
    return `${prefix}-${Date.now()}-${counterRef}`;
  };
})();

const getInputId = (() => {
  let counterRef = 0;
  return (prefix = "field") => {
    counterRef += 1;
    return `${prefix}-${counterRef}`;
  };
})();

function deepClone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function getSlideTitle(slide, index) {
  if (!(slide instanceof HTMLElement)) {
    return `Slide ${index + 1}`;
  }

  if (slide.dataset.stageTitle) {
    return slide.dataset.stageTitle;
  }

  const heading = slide.querySelector("h1, h2");
  if (heading) {
    return heading.textContent?.trim() || `Slide ${index + 1}`;
  }

  return `Slide ${index + 1}`;
}

function setSlideVisibility(slide, isActive) {
  slide.classList.toggle("hidden", !isActive);
  slide.setAttribute("aria-hidden", isActive ? "false" : "true");
  if (isActive) {
    const inner = slide.querySelector(".slide-inner");
    if (inner instanceof HTMLElement) {
      inner.scrollTop = 0;
    }
  }
}

function updateCounter() {
  if (counter) {
    counter.textContent = `Slide ${activeIndex + 1} of ${slides.length}`;
  }
}

function updateButtons() {
  const atStart = activeIndex <= 0;
  const atEnd = activeIndex >= slides.length - 1;

  if (prevBtn) {
    prevBtn.disabled = atStart;
    prevBtn.setAttribute("aria-disabled", atStart ? "true" : "false");
  }

  if (nextBtn) {
    nextBtn.disabled = atEnd;
    nextBtn.setAttribute("aria-disabled", atEnd ? "true" : "false");
  }
}

function refreshSlideNavigatorMeta() {
  if (!slideNavigator) {
    return;
  }

  slideNavigator.updateSlides(
    slides.map((slide, index) => {
      const activities = deckAuthoringState.slides[index]?.activities?.length ?? 0;
      const baseTitle = getSlideTitle(slide, index);
      const activitySuffix = activities
        ? ` • ${activities} ${activities === 1 ? "activity" : "activities"}`
        : "";
      return {
        stage: `${index + 1}`,
        title: `${baseTitle}${activitySuffix}`,
      };
    }),
  );
  slideNavigator.setActive(activeIndex);
}

function notifyStateChange() {
  refreshSlideNavigatorMeta();
  const detail = { state: getDeckState() };
  window.dispatchEvent(new CustomEvent("authoringDeckStateChange", { detail }));
}

function scheduleDeckStateChange() {
  if (pendingStateNotification) {
    window.clearTimeout(pendingStateNotification);
  }
  pendingStateNotification = window.setTimeout(() => {
    pendingStateNotification = null;
    notifyStateChange();
  }, 150);
}

function getDeckState() {
  return deepClone(deckAuthoringState);
}

function applyLayout(wrapper, layout = {}) {
  const widthKey = layout.width && ACTIVITY_WIDTHS[layout.width] ? layout.width : "medium";
  const width = ACTIVITY_WIDTHS[widthKey];
  wrapper.style.width = `${width}px`;
  wrapper.dataset.layoutWidth = widthKey;
  if (layout.align) {
    wrapper.dataset.layoutAlign = layout.align;
  } else {
    delete wrapper.dataset.layoutAlign;
  }
  if (layout.notes) {
    wrapper.dataset.layoutNotes = layout.notes;
  } else {
    delete wrapper.dataset.layoutNotes;
  }
}

function applyPosition(wrapper, position = {}) {
  const x = Number.isFinite(position.x) ? position.x : 24;
  const y = Number.isFinite(position.y) ? position.y : 24;
  wrapper.style.left = `${x}px`;
  wrapper.style.top = `${y}px`;
}

async function loadTemplateFragment(key) {
  const config = TEMPLATE_CONFIG[key];
  if (!config) {
    throw new Error(`Unknown template key: ${key}`);
  }

  if (templateCache.has(key)) {
    return templateCache.get(key).cloneNode(true);
  }

  const response = await fetch(config.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch template for ${key}`);
  }
  const markup = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(markup, "text/html");
  const fragment = doc.querySelector(config.selector);
  if (!fragment) {
    throw new Error(`Could not locate selector ${config.selector} in ${config.url}`);
  }
  const sanitized = fragment.cloneNode(true);
  sanitized.querySelectorAll("[id]").forEach((el) => {
    el.removeAttribute("id");
  });
  templateCache.set(key, sanitized.cloneNode(true));
  return sanitized.cloneNode(true);
}

function ensureCanvas(slide) {
  if (!(slide instanceof HTMLElement)) {
    return null;
  }

  const inner = slide.querySelector(".slide-inner");
  if (!(inner instanceof HTMLElement)) {
    return null;
  }

  let canvas = inner.querySelector("[data-activity-canvas]");
  if (!(canvas instanceof HTMLElement)) {
    canvas = document.createElement("div");
    canvas.className = "authoring-activity-canvas";
    canvas.dataset.activityCanvas = "true";
    inner.appendChild(canvas);
  }
  if (!canvas.querySelector("[data-canvas-activities]")) {
    const existingChildren = Array.from(canvas.children);

    const controls = document.createElement("div");
    controls.className = "authoring-canvas-controls";
    controls.dataset.canvasControls = "true";

    const addTextBtn = document.createElement("button");
    addTextBtn.type = "button";
    addTextBtn.className = "canvas-control-btn";
    addTextBtn.dataset.canvasAction = "add-text";
    addTextBtn.textContent = "Add text";

    const addImageBtn = document.createElement("button");
    addImageBtn.type = "button";
    addImageBtn.className = "canvas-control-btn";
    addImageBtn.dataset.canvasAction = "add-image";
    addImageBtn.textContent = "Insert image";

    const penBtn = document.createElement("button");
    penBtn.type = "button";
    penBtn.className = "canvas-control-btn";
    penBtn.dataset.canvasAction = "pen";
    penBtn.textContent = "Pen";

    const highlighterBtn = document.createElement("button");
    highlighterBtn.type = "button";
    highlighterBtn.className = "canvas-control-btn";
    highlighterBtn.dataset.canvasAction = "highlighter";
    highlighterBtn.textContent = "Highlighter";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "canvas-control-color";
    colorInput.dataset.canvasAction = "stroke-color";
    colorInput.value = "#1f2933";

    const undoBtn = document.createElement("button");
    undoBtn.type = "button";
    undoBtn.className = "canvas-control-btn ghost";
    undoBtn.dataset.canvasAction = "undo";
    undoBtn.textContent = "Undo";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "canvas-control-btn ghost";
    clearBtn.dataset.canvasAction = "clear";
    clearBtn.textContent = "Clear";

    controls.append(addTextBtn, addImageBtn, penBtn, highlighterBtn, colorInput, undoBtn, clearBtn);

    const hint = document.createElement("p");
    hint.className = "authoring-canvas-hint";
    hint.dataset.canvasHint = "true";
    hint.textContent =
      "Add text, imagery, or draw freehand. Drag elements to reposition them within the slide.";

    const drawingWrapper = document.createElement("div");
    drawingWrapper.className = "authoring-canvas-drawing";
    drawingWrapper.dataset.canvasDrawingLayer = "true";
    const drawingCanvas = document.createElement("canvas");
    drawingCanvas.dataset.canvasBoard = "true";
    drawingWrapper.appendChild(drawingCanvas);

    const elementsLayer = document.createElement("div");
    elementsLayer.className = "authoring-canvas-elements";
    elementsLayer.dataset.canvasElements = "true";

    const activitiesLayer = document.createElement("div");
    activitiesLayer.className = "authoring-canvas-activities";
    activitiesLayer.dataset.canvasActivities = "true";

    const stage = document.createElement("div");
    stage.className = "authoring-canvas-stage";
    stage.append(drawingWrapper, elementsLayer, activitiesLayer);

    canvas.append(controls, hint, stage);

    existingChildren.forEach((child) => {
      if (child instanceof HTMLElement || child instanceof SVGElement) {
        activitiesLayer.appendChild(child);
      }
    });
  }
  return canvas;
}

function getSlideCanvasState(slideIndex) {
  if (!deckAuthoringState.slides[slideIndex]) {
    deckAuthoringState.slides[slideIndex] = { activities: [], canvas: { elements: [], drawing: { strokes: [] } } };
  }
  const slideState = deckAuthoringState.slides[slideIndex];
  if (!slideState.canvas) {
    slideState.canvas = { elements: [], drawing: { strokes: [] } };
  }
  if (!Array.isArray(slideState.canvas.elements)) {
    slideState.canvas.elements = [];
  }
  if (!slideState.canvas.drawing) {
    slideState.canvas.drawing = { strokes: [] };
  }
  if (!Array.isArray(slideState.canvas.drawing.strokes)) {
    slideState.canvas.drawing.strokes = [];
  }
  return slideState.canvas;
}

function updateCanvasHint(slideIndex) {
  const controller = canvasControllers.get(slideIndex);
  if (!controller?.hint) {
    return;
  }
  const slideState = deckAuthoringState.slides[slideIndex];
  const activityCount = slideState?.activities?.length ?? 0;
  const canvasState = getSlideCanvasState(slideIndex);
  const hasElements = canvasState.elements.length > 0;
  const hasDrawing = canvasState.drawing.strokes.length > 0;
  controller.hint.hidden = activityCount + (hasElements ? 1 : 0) + (hasDrawing ? 1 : 0) > 0;
}

function syncDrawingCanvasSize(controller) {
  if (!controller?.drawingCanvas) {
    return;
  }
  const root = controller.stage instanceof HTMLElement ? controller.stage : controller.root;
  const canvasEl = controller.drawingCanvas;
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, root.clientWidth);
  const height = Math.max(1, root.clientHeight);
  const scaledWidth = Math.floor(width * ratio);
  const scaledHeight = Math.floor(height * ratio);
  if (canvasEl.width !== scaledWidth || canvasEl.height !== scaledHeight) {
    canvasEl.width = scaledWidth;
    canvasEl.height = scaledHeight;
    canvasEl.style.width = `${width}px`;
    canvasEl.style.height = `${height}px`;
  }
  if (controller.drawingCtx) {
    if (typeof controller.drawingCtx.resetTransform === "function") {
      controller.drawingCtx.resetTransform();
    }
    controller.drawingCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  renderCanvasDrawing(controller.slideIndex);
}

function ensureCanvasController(slideIndex) {
  if (canvasControllers.has(slideIndex)) {
    return canvasControllers.get(slideIndex);
  }
  const slide = slides[slideIndex];
  const canvas = ensureCanvas(slide);
  if (!canvas) {
    return null;
  }
  const controls = canvas.querySelector("[data-canvas-controls]");
  const hint = canvas.querySelector("[data-canvas-hint]");
  const stage = canvas.querySelector(".authoring-canvas-stage");
  const elementsLayer = canvas.querySelector("[data-canvas-elements]") ?? canvas;
  const activitiesLayer = canvas.querySelector("[data-canvas-activities]") ?? canvas;
  const drawingCanvas = canvas.querySelector("[data-canvas-board]");
  const drawingCtx = drawingCanvas instanceof HTMLCanvasElement ? drawingCanvas.getContext("2d") : null;

  const controller = {
    slideIndex,
    root: canvas,
    stage: stage instanceof HTMLElement ? stage : canvas,
    controls,
    hint,
    elementsLayer,
    activitiesLayer,
    drawingCanvas: drawingCanvas instanceof HTMLCanvasElement ? drawingCanvas : null,
    drawingCtx,
    drawingSettings: {
      tool: "pen",
      color: "#1f2933",
      size: 4,
      highlighterOpacity: 0.35,
    },
    elementInstances: new Map(),
    elementObservers: new Map(),
    currentStroke: null,
    activePointerId: null,
    resizeObserver: null,
  };

  if (controller.drawingCanvas) {
    controller.resizeObserver = new ResizeObserver(() => {
      syncDrawingCanvasSize(controller);
    });
    controller.resizeObserver.observe(controller.stage);
    syncDrawingCanvasSize(controller);
    bindDrawingEvents(controller);
  }

  bindCanvasControls(controller);
  canvasControllers.set(slideIndex, controller);
  return controller;
}

function bindDrawingEvents(controller) {
  if (!controller?.drawingCanvas) {
    return;
  }
  const canvasEl = controller.drawingCanvas;
  if (canvasEl.dataset.drawingBound === "true") {
    return;
  }
  canvasEl.dataset.drawingBound = "true";

  canvasEl.addEventListener("pointerdown", (event) => {
    handleStrokePointerDown(event, controller);
  });
  canvasEl.addEventListener("pointermove", (event) => {
    handleStrokePointerMove(event, controller);
  });
  canvasEl.addEventListener("pointerup", (event) => {
    handleStrokePointerUp(event, controller, false);
  });
  canvasEl.addEventListener("pointercancel", (event) => {
    handleStrokePointerUp(event, controller, true);
  });
  canvasEl.addEventListener("pointerleave", (event) => {
    if (controller.activePointerId === event.pointerId) {
      handleStrokePointerUp(event, controller, false);
    }
  });
}

function bindCanvasControls(controller) {
  if (!controller?.controls) {
    return;
  }
  const controls = controller.controls;
  if (controls.dataset.canvasControlsBound === "true") {
    return;
  }
  controls.dataset.canvasControlsBound = "true";

  controls.addEventListener("click", (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest("[data-canvas-action]") : null;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const action = target.dataset.canvasAction;
    if (!action) {
      return;
    }
    event.preventDefault();
    switch (action) {
      case "add-text":
        addCanvasTextElement(controller.slideIndex);
        break;
      case "add-image":
        addCanvasImageElement(controller.slideIndex).catch((error) => {
          console.error("Failed to insert image", error);
        });
        break;
      case "pen":
        setActiveDrawingTool(controller, "pen");
        break;
      case "highlighter":
        setActiveDrawingTool(controller, "highlighter");
        break;
      case "undo":
        undoCanvasStroke(controller.slideIndex);
        break;
      case "clear":
        clearCanvasDrawing(controller.slideIndex);
        break;
      default:
        break;
    }
  });

  controls.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    if (target.dataset.canvasAction === "stroke-color") {
      controller.drawingSettings.color = target.value || "#1f2933";
    }
  });

  setActiveDrawingTool(controller, controller.drawingSettings.tool);
  const colorInput = controls.querySelector("[data-canvas-action='stroke-color']");
  if (colorInput instanceof HTMLInputElement) {
    colorInput.value = controller.drawingSettings.color;
  }
}

function setActiveDrawingTool(controller, tool) {
  controller.drawingSettings.tool = tool;
  if (!controller?.controls) {
    return;
  }
  const toolButtons = controller.controls.querySelectorAll(
    "button[data-canvas-action='pen'], button[data-canvas-action='highlighter']",
  );
  toolButtons.forEach((button) => {
    if (button instanceof HTMLElement) {
      button.classList.toggle("is-active", button.dataset.canvasAction === tool);
    }
  });
}

function pointFromEvent(event, target) {
  const rect = target.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    pressure: event.pressure ?? 0.5,
  };
}

function handleStrokePointerDown(event, controller) {
  if (!controller?.drawingCanvas || !controller.drawingCtx) {
    return;
  }
  if (event.button !== 0) {
    return;
  }
  controller.drawingCanvas.setPointerCapture?.(event.pointerId);
  controller.activePointerId = event.pointerId;
  const point = pointFromEvent(event, controller.drawingCanvas);
  const stroke = {
    id: getUniqueId("stroke"),
    tool: controller.drawingSettings.tool,
    color: controller.drawingSettings.color,
    size:
      controller.drawingSettings.tool === "highlighter"
        ? controller.drawingSettings.size * 2.2
        : controller.drawingSettings.size,
    opacity:
      controller.drawingSettings.tool === "highlighter"
        ? controller.drawingSettings.highlighterOpacity
        : 1,
    points: [point],
  };
  controller.currentStroke = stroke;
  event.preventDefault();
}

function handleStrokePointerMove(event, controller) {
  if (controller.activePointerId !== event.pointerId) {
    return;
  }
  if (!controller.currentStroke || !controller.drawingCtx || !controller.drawingCanvas) {
    return;
  }
  event.preventDefault();
  const point = pointFromEvent(event, controller.drawingCanvas);
  const lastPoint = controller.currentStroke.points[controller.currentStroke.points.length - 1];
  if (lastPoint && lastPoint.x === point.x && lastPoint.y === point.y) {
    return;
  }
  controller.currentStroke.points.push(point);
  drawStrokeOnContext(controller.drawingCtx, {
    ...controller.currentStroke,
    points: [lastPoint || point, point],
  });
}

function handleStrokePointerUp(event, controller, isCancel) {
  if (controller.activePointerId !== event.pointerId) {
    return;
  }
  if (controller.drawingCanvas?.hasPointerCapture?.(event.pointerId)) {
    controller.drawingCanvas.releasePointerCapture(event.pointerId);
  }
  const stroke = controller.currentStroke;
  controller.currentStroke = null;
  controller.activePointerId = null;
  if (!stroke || isCancel) {
    renderCanvasDrawing(controller.slideIndex);
    return;
  }
  if (stroke.points.length <= 1) {
    stroke.points.push({ ...stroke.points[0] });
  }
  const canvasState = getSlideCanvasState(controller.slideIndex);
  canvasState.drawing.strokes.push(stroke);
  renderCanvasDrawing(controller.slideIndex);
  updateCanvasHint(controller.slideIndex);
  scheduleDeckStateChange();
}

function renderCanvasDrawing(slideIndex) {
  const controller = ensureCanvasController(slideIndex);
  if (!controller?.drawingCtx || !controller.drawingCanvas) {
    return;
  }
  const ctx = controller.drawingCtx;
  if (typeof ctx.save === "function") {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, controller.drawingCanvas.width, controller.drawingCanvas.height);
    ctx.restore();
  }
  const ratio = window.devicePixelRatio || 1;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const canvasState = getSlideCanvasState(slideIndex);
  canvasState.drawing.strokes.forEach((stroke) => {
    drawStrokeOnContext(ctx, stroke);
  });

  if (controller.currentStroke) {
    drawStrokeOnContext(ctx, controller.currentStroke);
  }
}

function drawStrokeOnContext(ctx, stroke) {
  if (!stroke?.points?.length) {
    return;
  }
  const points = stroke.points;
  ctx.save();
  ctx.globalAlpha = Number.isFinite(stroke.opacity) ? stroke.opacity : 1;
  ctx.strokeStyle = stroke.color || "#1f2933";
  ctx.lineWidth = Number.isFinite(stroke.size) ? stroke.size : 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }
  if (points.length === 1) {
    ctx.lineTo(points[0].x + 0.1, points[0].y + 0.1);
  }
  ctx.stroke();
  ctx.restore();
}

function undoCanvasStroke(slideIndex) {
  const canvasState = getSlideCanvasState(slideIndex);
  if (!canvasState.drawing.strokes.length) {
    return;
  }
  canvasState.drawing.strokes.pop();
  renderCanvasDrawing(slideIndex);
  updateCanvasHint(slideIndex);
  scheduleDeckStateChange();
}

function clearCanvasDrawing(slideIndex) {
  const canvasState = getSlideCanvasState(slideIndex);
  if (!canvasState.drawing.strokes.length) {
    return;
  }
  canvasState.drawing.strokes = [];
  renderCanvasDrawing(slideIndex);
  updateCanvasHint(slideIndex);
  scheduleDeckStateChange();
}

function renderAllCanvasElements() {
  slides.forEach((_, index) => {
    renderCanvasElementsForSlide(index);
  });
}

function renderAllCanvasDrawings() {
  slides.forEach((_, index) => {
    renderCanvasDrawing(index);
  });
}

function renderCanvasElementsForSlide(slideIndex) {
  const controller = ensureCanvasController(slideIndex);
  if (!controller) {
    return;
  }
  const canvasState = getSlideCanvasState(slideIndex);
  const seen = new Set();
  canvasState.elements.forEach((elementState) => {
    const element = renderCanvasElement(slideIndex, elementState);
    if (element) {
      seen.add(elementState.id);
    }
  });
  Array.from(controller.elementInstances.keys()).forEach((id) => {
    if (!seen.has(id)) {
      destroyCanvasElement(controller, id);
    }
  });
  updateCanvasHint(slideIndex);
}

function renderCanvasElement(slideIndex, elementState) {
  const controller = ensureCanvasController(slideIndex);
  if (!controller) {
    return null;
  }
  let entry = controller.elementInstances.get(elementState.id);
  if (!entry) {
    entry = createCanvasElementDom(controller, elementState);
    controller.elementInstances.set(elementState.id, entry);
  }
  updateCanvasElementDom(controller, elementState, entry);
  canvasElementMap.set(elementState.id, { slideIndex, element: entry.element });
  return entry.element;
}

function createCanvasElementDom(controller, elementState) {
  const element = document.createElement("div");
  element.className = "canvas-element";
  element.dataset.canvasElementId = elementState.id;
  element.tabIndex = 0;
  element.style.position = "absolute";

  const chrome = document.createElement("div");
  chrome.className = "canvas-element__chrome";
  const label = document.createElement("span");
  label.className = "canvas-element__label";
  chrome.appendChild(label);

  const actions = document.createElement("div");
  actions.className = "canvas-element__actions";
  chrome.appendChild(actions);

  const body = document.createElement("div");
  body.className = "canvas-element__body";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "canvas-element__action danger";
  removeBtn.dataset.elementAction = "remove";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    removeCanvasElement(elementState.id);
  });
  actions.appendChild(removeBtn);

  element.append(chrome, body);
  controller.elementsLayer.appendChild(element);

  element.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }
    if (event.target instanceof HTMLElement && event.target.closest("[data-element-action]")) {
      return;
    }
    handleCanvasElementDrag(event, element, controller.slideIndex, elementState.id);
  });

  const entry = {
    element,
    label,
    actions,
    body,
    removeBtn,
    editBtn: null,
    editable: null,
    image: null,
    observer: null,
  };

  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) {
        return;
      }
      updateCanvasElementSize(controller.slideIndex, elementState.id, rect.width, rect.height);
    });
    observer.observe(element);
    entry.observer = observer;
  }

  return entry;
}

function updateCanvasElementDom(controller, elementState, entry) {
  const { element, body, label } = entry;
  element.dataset.canvasElementType = elementState.type;
  if (!elementState.position) {
    elementState.position = { x: 32, y: 32 };
  }
  element.style.left = `${elementState.position.x ?? 32}px`;
  element.style.top = `${elementState.position.y ?? 32}px`;
  if (elementState.size?.width) {
    element.style.width = `${elementState.size.width}px`;
  } else {
    element.style.removeProperty("width");
  }
  if (elementState.size?.height) {
    element.style.height = `${elementState.size.height}px`;
  } else {
    element.style.removeProperty("height");
  }

  if (elementState.type === "text") {
    element.classList.add("canvas-element--text");
    element.classList.remove("canvas-element--image");
    label.textContent = "Text box";
    if (!entry.editable) {
      const editable = document.createElement("div");
      editable.className = "canvas-textbox";
      editable.contentEditable = "true";
      editable.dataset.role = "body";
      editable.setAttribute("role", "textbox");
      editable.setAttribute("aria-label", "Canvas text");
      editable.spellcheck = true;
      editable.addEventListener("focus", () => {
        activeTextContext = {
          element: editable,
          slideIndex: controller.slideIndex,
          elementId: elementState.id,
        };
        requestToolbarUpdate();
      });
      editable.addEventListener("input", () => {
        persistCanvasTextContent(controller.slideIndex, elementState.id, editable.innerHTML);
        scheduleDeckStateChange();
      });
      editable.addEventListener("blur", () => {
        persistCanvasTextContent(controller.slideIndex, elementState.id, editable.innerHTML);
        window.setTimeout(() => {
          if (activeTextContext?.element === editable) {
            activeTextContext = null;
            hideTextFormattingToolbar();
          }
        }, 50);
      });
      body.replaceChildren(editable);
      entry.editable = editable;
    }
    const editable = entry.editable;
    if (editable && editable.innerHTML !== elementState.html) {
      editable.innerHTML = elementState.html || "<p>Double-click to start typing…</p>";
    }
    if (editable) {
      editable.style.color = elementState.styles?.color || "";
      editable.style.fontSize = elementState.styles?.fontSize || "";
    }
    if (entry.editBtn) {
      entry.editBtn.remove();
      entry.editBtn = null;
    }
    entry.image = null;
  } else if (elementState.type === "image") {
    element.classList.add("canvas-element--image");
    element.classList.remove("canvas-element--text");
    label.textContent = "Image";
    entry.editable = null;
    if (!entry.image) {
      const img = document.createElement("img");
      img.alt = elementState.alt || "";
      img.draggable = false;
      body.replaceChildren(img);
      entry.image = img;
    }
    if (entry.image) {
      entry.image.src = elementState.src;
      entry.image.alt = elementState.alt || "";
    }
    if (!entry.editBtn) {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "canvas-element__action";
      editBtn.dataset.elementAction = "edit";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        editCanvasImageElement(elementState.id, controller.slideIndex).catch((error) => {
          console.error("Failed to edit image", error);
        });
      });
      entry.actions.insertBefore(editBtn, entry.actions.firstChild);
      entry.editBtn = editBtn;
    }
  }
}

function destroyCanvasElement(controller, elementId) {
  const entry = controller.elementInstances.get(elementId);
  if (!entry) {
    return;
  }
  entry.observer?.disconnect();
  entry.element.remove();
  controller.elementInstances.delete(elementId);
  canvasElementMap.delete(elementId);
  if (activeTextContext?.elementId === elementId) {
    activeTextContext = null;
    hideTextFormattingToolbar();
  }
}

function handleCanvasElementDrag(event, wrapper, slideIndex, elementId) {
  if (event.button !== 0) {
    return;
  }
  const canvas = wrapper.closest("[data-activity-canvas]");
  if (!(canvas instanceof HTMLElement)) {
    return;
  }
  const host = wrapper.parentElement instanceof HTMLElement ? wrapper.parentElement : canvas;
  event.preventDefault();
  const pointerId = event.pointerId;
  const initialRect = host.getBoundingClientRect();
  const startLeft = parseFloat(wrapper.style.left || "0");
  const startTop = parseFloat(wrapper.style.top || "0");
  const offsetX = event.clientX - initialRect.left - startLeft;
  const offsetY = event.clientY - initialRect.top - startTop;

  function updatePosition(moveEvent) {
    if (moveEvent.pointerId !== pointerId) {
      return;
    }
    const rect = host.getBoundingClientRect();
    let left = moveEvent.clientX - rect.left - offsetX;
    let top = moveEvent.clientY - rect.top - offsetY;
    const maxLeft = Math.max(0, rect.width - wrapper.offsetWidth);
    const maxTop = Math.max(0, rect.height - wrapper.offsetHeight);
    if (Number.isFinite(maxLeft)) {
      left = Math.min(Math.max(0, left), maxLeft);
    }
    if (Number.isFinite(maxTop)) {
      top = Math.min(Math.max(0, top), maxTop);
    }
    wrapper.style.left = `${left}px`;
    wrapper.style.top = `${top}px`;
  }

  function stopDrag(upEvent) {
    if (upEvent.pointerId !== pointerId) {
      return;
    }
    if (wrapper.hasPointerCapture?.(pointerId)) {
      wrapper.releasePointerCapture(pointerId);
    }
    wrapper.classList.remove("is-dragging");
    wrapper.removeEventListener("pointermove", updatePosition);
    wrapper.removeEventListener("pointerup", stopDrag);
    wrapper.removeEventListener("pointercancel", stopDrag);

    const left = parseFloat(wrapper.style.left || "0");
    const top = parseFloat(wrapper.style.top || "0");
    updateCanvasElementPosition(slideIndex, elementId, left, top);
  }

  wrapper.classList.add("is-dragging");
  wrapper.setPointerCapture?.(pointerId);
  wrapper.addEventListener("pointermove", updatePosition);
  wrapper.addEventListener("pointerup", stopDrag);
  wrapper.addEventListener("pointercancel", stopDrag);
}

function updateCanvasElementPosition(slideIndex, elementId, left, top) {
  const canvasState = getSlideCanvasState(slideIndex);
  const elementState = canvasState.elements.find((item) => item.id === elementId);
  if (!elementState) {
    return;
  }
  elementState.position = { x: Math.round(left), y: Math.round(top) };
  scheduleDeckStateChange();
}

function updateCanvasElementSize(slideIndex, elementId, width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return;
  }
  const canvasState = getSlideCanvasState(slideIndex);
  const elementState = canvasState.elements.find((item) => item.id === elementId);
  if (!elementState) {
    return;
  }
  elementState.size = {
    width: Math.max(48, Math.round(width)),
    height: Math.max(48, Math.round(height)),
  };
  scheduleDeckStateChange();
}

function persistCanvasTextContent(slideIndex, elementId, html) {
  const canvasState = getSlideCanvasState(slideIndex);
  const elementState = canvasState.elements.find((item) => item.id === elementId);
  if (!elementState || elementState.type !== "text") {
    return;
  }
  elementState.html = html;
  const entry = canvasElementMap.get(elementId);
  const editable = entry?.element?.querySelector("[data-role='body']");
  if (editable instanceof HTMLElement) {
    elementState.styles = elementState.styles ?? {};
    elementState.styles.color = editable.style.color || undefined;
    elementState.styles.fontSize = editable.style.fontSize || undefined;
  }
}

function removeCanvasElement(elementId) {
  const record = canvasElementMap.get(elementId);
  if (!record) {
    return;
  }
  const { slideIndex } = record;
  const canvasState = getSlideCanvasState(slideIndex);
  const index = canvasState.elements.findIndex((item) => item.id === elementId);
  if (index >= 0) {
    canvasState.elements.splice(index, 1);
  }
  const controller = canvasControllers.get(slideIndex);
  if (controller) {
    destroyCanvasElement(controller, elementId);
  }
  updateCanvasHint(slideIndex);
  scheduleDeckStateChange();
}

function addCanvasTextElement(slideIndex) {
  const canvasState = getSlideCanvasState(slideIndex);
  const element = {
    id: getUniqueId("textbox"),
    type: "text",
    html: "<p>Double-click to start typing…</p>",
    position: {
      x: 48 + canvasState.elements.length * 16,
      y: 48 + canvasState.elements.length * 16,
    },
    size: { width: 260, height: 140 },
    styles: { color: "#1f2933", fontSize: "1rem" },
  };
  canvasState.elements.push(element);
  const dom = renderCanvasElement(slideIndex, element);
  updateCanvasHint(slideIndex);
  scheduleDeckStateChange();
  const editable = dom?.querySelector("[data-role='body']");
  if (editable instanceof HTMLElement) {
    window.setTimeout(() => {
      editable.focus();
    }, 50);
  }
}

async function addCanvasImageElement(slideIndex) {
  const asset = await openImageAssetModal();
  if (!asset) {
    return;
  }
  const canvasState = getSlideCanvasState(slideIndex);
  const element = {
    id: getUniqueId("image"),
    type: "image",
    src: asset.src,
    alt: asset.alt ?? "",
    position: {
      x: 96,
      y: 96,
    },
    size: {
      width: asset.width ?? 320,
      height: asset.height ?? 240,
    },
  };
  canvasState.elements.push(element);
  renderCanvasElement(slideIndex, element);
  updateCanvasHint(slideIndex);
  scheduleDeckStateChange();
}

async function editCanvasImageElement(elementId, slideIndex) {
  const canvasState = getSlideCanvasState(slideIndex);
  const elementState = canvasState.elements.find((item) => item.id === elementId);
  if (!elementState || elementState.type !== "image") {
    return;
  }
  const asset = await openImageAssetModal({
    src: elementState.src,
    alt: elementState.alt,
    width: elementState.size?.width,
    height: elementState.size?.height,
  });
  if (!asset) {
    return;
  }
  elementState.src = asset.src;
  elementState.alt = asset.alt ?? "";
  if (asset.width && asset.height) {
    elementState.size = { width: asset.width, height: asset.height };
  }
  renderCanvasElement(slideIndex, elementState);
  scheduleDeckStateChange();
}

let textToolbarState = null;
let toolbarUpdateHandle = null;

function getTextToolbar() {
  if (textToolbarState) {
    return textToolbarState;
  }
  const element = document.createElement("div");
  element.className = "authoring-text-toolbar is-hidden";
  element.innerHTML = `
    <div class="text-toolbar__group">
      <button type="button" class="text-toolbar__btn" data-toolbar-action="bold" title="Bold"><span>B</span></button>
      <button type="button" class="text-toolbar__btn" data-toolbar-action="italic" title="Italic"><span><em>I</em></span></button>
      <button type="button" class="text-toolbar__btn" data-toolbar-action="underline" title="Underline"><span><u>U</u></span></button>
    </div>
    <div class="text-toolbar__group">
      <select class="text-toolbar__select" data-toolbar-font-size aria-label="Font size">
        <option value="">Font size</option>
        <option value="0.9rem">Small</option>
        <option value="1rem">Normal</option>
        <option value="1.2rem">Large</option>
        <option value="1.4rem">Extra large</option>
      </select>
      <input type="color" class="text-toolbar__color" data-toolbar-color aria-label="Text colour" value="#1f2933" />
    </div>
  `;
  document.body.appendChild(element);

  element.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  element.addEventListener("click", (event) => {
    const button = event.target instanceof HTMLElement ? event.target.closest("[data-toolbar-action]") : null;
    if (!(button instanceof HTMLElement)) {
      return;
    }
    const action = button.dataset.toolbarAction;
    if (!action) {
      return;
    }
    applyToolbarAction(action);
  });

  const fontSizeSelect = element.querySelector("[data-toolbar-font-size]");
  fontSizeSelect?.addEventListener("change", (event) => {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement)) {
      return;
    }
    const value = select.value;
    applyFontSize(value);
    requestToolbarUpdate();
    window.requestAnimationFrame(() => {
      select.value = "";
    });
  });

  const colorInput = element.querySelector("[data-toolbar-color]");
  colorInput?.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    applyTextColor(input.value);
    requestToolbarUpdate();
  });

  textToolbarState = {
    element,
    fontSizeSelect,
    colorInput,
  };
  hideTextFormattingToolbar();
  return textToolbarState;
}

function showTextFormattingToolbar(rect) {
  const { element } = getTextToolbar();
  element.classList.remove("is-hidden");
  const offset = 12;
  const measuredWidth = element.offsetWidth || 240;
  const measuredHeight = element.offsetHeight || 48;
  const left = Math.max(window.scrollX + rect.left + rect.width / 2 - measuredWidth / 2, window.scrollX + 12);
  const top = Math.max(window.scrollY + rect.top - measuredHeight - offset, window.scrollY + 12);
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
}

function hideTextFormattingToolbar() {
  const state = textToolbarState;
  if (!state) {
    return;
  }
  state.element.classList.add("is-hidden");
  state.element.style.left = "-9999px";
  state.element.style.top = "-9999px";
}

function updateTextFormattingToolbarPosition() {
  if (!activeTextContext?.element || !(activeTextContext.element instanceof HTMLElement)) {
    hideTextFormattingToolbar();
    return;
  }
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    hideTextFormattingToolbar();
    return;
  }
  const range = selection.getRangeAt(0);
  if (!activeTextContext.element.contains(range.commonAncestorContainer)) {
    hideTextFormattingToolbar();
    return;
  }
  const rect = range.getBoundingClientRect();
  const fallback = activeTextContext.element.getBoundingClientRect();
  const targetRect = rect && (rect.width > 0 || rect.height > 0) ? rect : fallback;
  showTextFormattingToolbar(targetRect);
}

function requestToolbarUpdate() {
  if (toolbarUpdateHandle) {
    window.cancelAnimationFrame(toolbarUpdateHandle);
  }
  toolbarUpdateHandle = window.requestAnimationFrame(() => {
    toolbarUpdateHandle = null;
    updateTextFormattingToolbarPosition();
  });
}

function tryExecCommand(command, value) {
  try {
    if (typeof document.execCommand === "function") {
      return document.execCommand(command, false, value);
    }
  } catch (error) {
    console.warn("execCommand failed", error);
  }
  return false;
}

function applyToolbarAction(action) {
  if (!activeTextContext?.element) {
    return;
  }
  let handled = false;
  switch (action) {
    case "bold":
      handled = tryExecCommand("bold");
      if (!handled) {
        handled = wrapSelectionWithElement("strong");
      }
      break;
    case "italic":
      handled = tryExecCommand("italic");
      if (!handled) {
        handled = wrapSelectionWithElement("em");
      }
      break;
    case "underline":
      handled = tryExecCommand("underline");
      if (!handled) {
        handled = wrapSelectionWithElement("span", { style: "text-decoration: underline;" });
      }
      break;
    default:
      break;
  }
  if (handled) {
    syncActiveTextContent();
    requestToolbarUpdate();
  }
}

function wrapSelectionWithElement(tagName, attributes = {}) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return false;
  }
  const range = selection.getRangeAt(0);
  if (!activeTextContext?.element.contains(range.commonAncestorContainer)) {
    return false;
  }
  const wrapper = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    wrapper.setAttribute(key, value);
  });
  wrapper.appendChild(range.extractContents());
  range.insertNode(wrapper);
  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(wrapper);
  newRange.collapse(false);
  selection.addRange(newRange);
  return true;
}

function applySelectionStyle(styleName, value) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return false;
  }
  const range = selection.getRangeAt(0);
  if (!activeTextContext?.element.contains(range.commonAncestorContainer)) {
    return false;
  }
  if (selection.isCollapsed) {
    activeTextContext.element.style[styleName] = value;
    return true;
  }
  const wrapper = document.createElement("span");
  wrapper.style[styleName] = value;
  wrapper.appendChild(range.extractContents());
  range.insertNode(wrapper);
  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(wrapper);
  newRange.collapse(false);
  selection.addRange(newRange);
  return true;
}

function applyFontSize(value) {
  if (!activeTextContext?.element) {
    return;
  }
  if (!value) {
    activeTextContext.element.style.fontSize = "";
    syncActiveTextContent();
    return;
  }
  const applied = applySelectionStyle("fontSize", value);
  if (!applied) {
    activeTextContext.element.style.fontSize = value;
  }
  syncActiveTextContent();
}

function applyTextColor(value) {
  if (!activeTextContext?.element) {
    return;
  }
  const applied = tryExecCommand("foreColor", value);
  if (!applied) {
    applySelectionStyle("color", value);
  }
  if (activeTextContext.element) {
    activeTextContext.element.style.color = value;
  }
  syncActiveTextContent();
}

function syncActiveTextContent() {
  if (!activeTextContext?.element) {
    return;
  }
  persistCanvasTextContent(
    activeTextContext.slideIndex,
    activeTextContext.elementId,
    activeTextContext.element.innerHTML,
  );
  scheduleDeckStateChange();
}

function findActivityRecord(activityId) {
  for (let slideIndex = 0; slideIndex < deckAuthoringState.slides.length; slideIndex += 1) {
    const slideState = deckAuthoringState.slides[slideIndex];
    const activity = slideState.activities.find((item) => item.id === activityId);
    if (activity) {
      return { slideIndex, activity };
    }
  }
  return null;
}

function getActivityElement(activityId) {
  const entry = activityElements.get(activityId);
  return entry?.element ?? null;
}

function setActivityElement(activityId, slideIndex, element) {
  activityElements.set(activityId, { slideIndex, element });
}

function removeActivityElement(activityId) {
  const entry = activityElements.get(activityId);
  if (entry?.element) {
    entry.element.remove();
  }
  activityElements.delete(activityId);
  if (Number.isInteger(entry?.slideIndex)) {
    updateCanvasHint(entry.slideIndex);
  }
}

function handleDrag(event, wrapper, slideIndex, activityId) {
  if (event.button !== 0 || event.target.closest(".auth-activity-action")) {
    return;
  }

  const canvas = wrapper.closest("[data-activity-canvas]");
  if (!(canvas instanceof HTMLElement)) {
    return;
  }
  const host = wrapper.parentElement instanceof HTMLElement ? wrapper.parentElement : canvas;

  event.preventDefault();
  const pointerId = event.pointerId;
  const initialRect = host.getBoundingClientRect();
  const startLeft = parseFloat(wrapper.style.left || "0");
  const startTop = parseFloat(wrapper.style.top || "0");
  const offsetX = event.clientX - initialRect.left - startLeft;
  const offsetY = event.clientY - initialRect.top - startTop;

  function updatePosition(moveEvent) {
    if (moveEvent.pointerId !== pointerId) {
      return;
    }
    const rect = host.getBoundingClientRect();
    let left = moveEvent.clientX - rect.left - offsetX;
    let top = moveEvent.clientY - rect.top - offsetY;
    const maxLeft = Math.max(0, rect.width - wrapper.offsetWidth);
    const maxTop = Math.max(0, rect.height - wrapper.offsetHeight);
    if (Number.isFinite(maxLeft)) {
      left = Math.min(Math.max(0, left), maxLeft);
    }
    if (Number.isFinite(maxTop)) {
      top = Math.min(Math.max(0, top), maxTop);
    }
    wrapper.style.left = `${left}px`;
    wrapper.style.top = `${top}px`;
  }

  function stopDrag(upEvent) {
    if (upEvent.pointerId !== pointerId) {
      return;
    }
    if (wrapper.hasPointerCapture?.(pointerId)) {
      wrapper.releasePointerCapture(pointerId);
    }
    wrapper.classList.remove("is-dragging");
    wrapper.removeEventListener("pointermove", updatePosition);
    wrapper.removeEventListener("pointerup", stopDrag);
    wrapper.removeEventListener("pointercancel", stopDrag);

    const left = parseFloat(wrapper.style.left || "0");
    const top = parseFloat(wrapper.style.top || "0");
    const slideState = deckAuthoringState.slides[slideIndex];
    const activity = slideState.activities.find((item) => item.id === activityId);
    if (activity) {
      activity.position = { x: left, y: top };
      notifyStateChange();
    }
  }

  wrapper.classList.add("is-dragging");
  wrapper.setPointerCapture?.(pointerId);
  wrapper.addEventListener("pointermove", updatePosition);
  wrapper.addEventListener("pointerup", stopDrag);
  wrapper.addEventListener("pointercancel", stopDrag);
}

function createFieldWrapper(labelText, input) {
  const wrapper = document.createElement("div");
  wrapper.className = "config-field";
  const label = document.createElement("label");
  const inputId = getInputId("authoring-field");
  label.className = "config-label";
  label.setAttribute("for", inputId);
  label.textContent = labelText;
  input.id = inputId;
  wrapper.append(label, input);
  return { wrapper, input };
}

function createLayoutFieldset(existingLayout = {}) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "config-fieldset layout";
  const legend = document.createElement("legend");
  legend.textContent = "Layout metadata";
  fieldset.appendChild(legend);

  const widthSelect = document.createElement("select");
  widthSelect.name = "layout-width";
  [
    { value: "narrow", label: "Narrow" },
    { value: "medium", label: "Medium" },
    { value: "wide", label: "Wide" },
  ].forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    if ((existingLayout.width ?? "medium") === value) {
      option.selected = true;
    }
    widthSelect.appendChild(option);
  });
  const { wrapper: widthWrapper } = createFieldWrapper("Preferred width", widthSelect);
  fieldset.appendChild(widthWrapper);

  const alignSelect = document.createElement("select");
  alignSelect.name = "layout-align";
  [
    { value: "", label: "Default" },
    { value: "left", label: "Align left" },
    { value: "center", label: "Align centre" },
    { value: "right", label: "Align right" },
  ].forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    if ((existingLayout.align ?? "") === value) {
      option.selected = true;
    }
    alignSelect.appendChild(option);
  });
  const { wrapper: alignWrapper } = createFieldWrapper("Alignment hint", alignSelect);
  fieldset.appendChild(alignWrapper);

  const notes = document.createElement("textarea");
  notes.name = "layout-notes";
  notes.rows = 3;
  notes.value = existingLayout.notes ?? "";
  notes.placeholder = "Optional notes about placement or responsive variants";
  const { wrapper: notesWrapper } = createFieldWrapper("Designer notes", notes);
  fieldset.appendChild(notesWrapper);

  return { fieldset, controls: { widthSelect, alignSelect, notes } };
}

function createModalShell(title) {
  const modal = document.createElement("div");
  modal.className = "config-modal";
  const titleId = getInputId("modal-title");
  modal.innerHTML = `
    <div class="config-modal__backdrop" data-modal-close></div>
    <div class="config-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
      <header class="config-modal__header">
        <h2 id="${titleId}">${title}</h2>
        <button type="button" class="config-modal__close" data-modal-close aria-label="Close dialog">
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <form class="config-modal__form">
        <div class="config-modal__content"></div>
        <p class="config-modal__error" data-modal-error hidden></p>
        <footer class="config-modal__footer">
          <button type="button" class="config-btn ghost" data-modal-cancel>Cancel</button>
          <button type="submit" class="config-btn">Save</button>
        </footer>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const form = modal.querySelector(".config-modal__form");
  const content = modal.querySelector(".config-modal__content");
  const errorEl = modal.querySelector("[data-modal-error]");
  const closeHandlers = new Set();

  const close = (payload) => {
    if (!modal.isConnected) {
      return;
    }
    modal.remove();
    document.body.classList.remove("config-modal-open");
    closeHandlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error("Modal close handler failed", error);
      }
    });
  };

  const setError = (message = "") => {
    if (!errorEl) return;
    if (message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    } else {
      errorEl.textContent = "";
      errorEl.hidden = true;
    }
  };

  document.body.classList.add("config-modal-open");

  const cancelTriggers = modal.querySelectorAll("[data-modal-close], [data-modal-cancel]");
  cancelTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      close(null);
    });
  });

  const escHandler = (event) => {
    if (event.key === "Escape") {
      close(null);
    }
  };
  window.addEventListener("keydown", escHandler, { once: true });

  closeHandlers.add(() => {
    window.removeEventListener("keydown", escHandler);
  });

  const onClose = (handler) => {
    if (typeof handler === "function") {
      closeHandlers.add(handler);
    }
  };

  return { modal, form, content, close, setError, onClose };
}

function openImageAssetModal(initialAsset = null) {
  return new Promise((resolve) => {
    const { form, content, close, setError, onClose } = createModalShell(
      initialAsset ? "Replace image" : "Insert image",
    );
    let settled = false;
    const settle = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    onClose((payload) => {
      settle(payload ?? null);
    });

    let selectedSource = initialAsset?.src ?? "";
    let selectedWidth = initialAsset?.width ?? null;
    let selectedHeight = initialAsset?.height ?? null;

    const intro = document.createElement("p");
    intro.className = "image-picker-intro";
    intro.textContent = "Choose an image from your device, paste a URL, or search the Pexels library.";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    const { wrapper: fileWrapper } = createFieldWrapper("Upload from your computer", fileInput);

    const urlInput = document.createElement("input");
    urlInput.type = "url";
    urlInput.placeholder = "https://example.com/image.jpg";
    urlInput.value = selectedSource && !selectedSource.startsWith("data:") ? selectedSource : "";
    const { wrapper: urlWrapper } = createFieldWrapper("Image URL", urlInput);

    const altInput = document.createElement("input");
    altInput.type = "text";
    altInput.placeholder = "Describe the image for screen readers";
    altInput.value = initialAsset?.alt ?? "";
    const { wrapper: altWrapper } = createFieldWrapper("Alt text", altInput);

    const preview = document.createElement("figure");
    preview.className = "image-picker-preview";
    const previewCaption = document.createElement("figcaption");
    previewCaption.textContent = "Selected image";
    previewCaption.hidden = true;
    preview.appendChild(previewCaption);

    let previewImg = null;

    function updatePreview(src) {
      if (!src) {
        previewCaption.hidden = true;
        if (previewImg) {
          previewImg.remove();
          previewImg = null;
        }
        return;
      }
    if (!previewImg) {
      previewImg = document.createElement("img");
      previewImg.alt = altInput.value || "Selected image preview";
      previewImg.draggable = false;
      preview.appendChild(previewImg);
      preview.appendChild(previewCaption);
    }
    previewCaption.hidden = false;
    previewImg.src = src;
    previewImg.alt = altInput.value || "Selected image preview";
  }

    function handlePreviewLoad(event) {
      const target = event.target;
      if (target instanceof HTMLImageElement) {
        selectedWidth = target.naturalWidth;
        selectedHeight = target.naturalHeight;
      }
    }

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (typeof reader.result === "string") {
          selectedSource = reader.result;
          selectedWidth = null;
          selectedHeight = null;
          urlInput.value = "";
          updatePreview(selectedSource);
        }
      });
      reader.readAsDataURL(file);
    });

    urlInput.addEventListener("input", () => {
      const value = urlInput.value.trim();
      selectedSource = value;
      if (value) {
        selectedWidth = null;
        selectedHeight = null;
      }
      updatePreview(value);
    });

    altInput.addEventListener("input", () => {
      if (previewImg) {
        previewImg.alt = altInput.value || "Selected image preview";
      }
    });

    const pexelsWrapper = document.createElement("div");
    pexelsWrapper.className = "image-picker-pexels";
    const pexelsLabel = document.createElement("label");
    pexelsLabel.textContent = "Search Pexels";
    pexelsLabel.setAttribute("for", getInputId("pexels-search"));
    const pexelsInput = document.createElement("input");
    pexelsInput.type = "search";
    pexelsInput.id = pexelsLabel.getAttribute("for");
    pexelsInput.placeholder = "e.g. classroom, sunrise";
    const pexelsButton = document.createElement("button");
    pexelsButton.type = "button";
    pexelsButton.className = "config-btn ghost";
    pexelsButton.textContent = "Search";
    const pexelsResults = document.createElement("div");
    pexelsResults.className = "image-picker-results";
    const pexelsStatus = document.createElement("p");
    pexelsStatus.className = "image-picker-status";
    pexelsStatus.hidden = true;

    async function searchPexels() {
      const query = pexelsInput.value.trim();
      if (!query) {
        pexelsStatus.hidden = false;
        pexelsStatus.textContent = "Enter a keyword to search Pexels.";
        return;
      }
      pexelsStatus.hidden = false;
      pexelsStatus.textContent = "Searching...";
      pexelsResults.replaceChildren();
      try {
        const response = await fetch(
          `https://api.pexels.com/v1/search?per_page=8&query=${encodeURIComponent(query)}`,
          {
            headers: {
              Authorization: PEXELS_API_KEY,
            },
          },
        );
        if (!response.ok) {
          throw new Error(`Pexels responded with ${response.status}`);
        }
        const data = await response.json();
        const photos = Array.isArray(data?.photos) ? data.photos : [];
        if (!photos.length) {
          pexelsStatus.textContent = "No results found. Try another search term.";
          return;
        }
        pexelsStatus.hidden = true;
        photos.forEach((photo) => {
          if (!photo?.src) {
            return;
          }
          const option = document.createElement("button");
          option.type = "button";
          option.className = "image-picker-result";
          option.innerHTML = `<img src="${photo.src.small}" alt="${photo.alt ?? ""}" loading="lazy" />`;
          option.addEventListener("click", () => {
            selectedSource = photo.src.large || photo.src.medium || photo.src.original;
            selectedWidth = photo.width ?? null;
            selectedHeight = photo.height ?? null;
            altInput.value = photo.alt ?? altInput.value;
            updatePreview(selectedSource);
            pexelsStatus.hidden = false;
            pexelsStatus.textContent = "Pexels image selected.";
          });
          pexelsResults.appendChild(option);
        });
      } catch (error) {
        console.error("Pexels search failed", error);
        pexelsStatus.hidden = false;
        pexelsStatus.textContent = "Unable to fetch images from Pexels right now.";
      }
    }

    pexelsButton.addEventListener("click", () => {
      searchPexels().catch((error) => {
        console.error("Pexels search error", error);
      });
    });

    pexelsInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        searchPexels().catch((error) => {
          console.error("Pexels search error", error);
        });
      }
    });

    pexelsWrapper.append(pexelsLabel, pexelsInput, pexelsButton, pexelsStatus, pexelsResults);

    preview.addEventListener("load", handlePreviewLoad, true);
    if (selectedSource) {
      updatePreview(selectedSource);
    }

    content.append(intro, fileWrapper, urlWrapper, altWrapper, preview, pexelsWrapper);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      setError("");
      if (!selectedSource) {
        setError("Select an image using any of the options above.");
        return;
      }
      const result = {
        src: selectedSource,
        alt: altInput.value.trim(),
        width: selectedWidth ?? previewImg?.naturalWidth ?? undefined,
        height: selectedHeight ?? previewImg?.naturalHeight ?? undefined,
      };
      close(result);
      settle(result);
    });

    form.querySelector("[data-modal-cancel]")?.addEventListener("click", () => {
      close(null);
    });
  });
}

function openMultipleChoiceModal(existingState, activityLabel) {
  return new Promise((resolve) => {
    const { form, content, close, setError, onClose } = createModalShell(
      existingState ? `Edit ${activityLabel}` : `Add ${activityLabel}`,
    );
    let settled = false;
    const settle = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    onClose((payload) => {
      settle(payload ?? null);
    });

    const data = existingState?.data ?? {
      sectionTitle: "",
      sectionDescription: "",
      stem: "",
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
      ],
      feedback: "",
    };

    const layout = existingState?.layout ?? {};

    const sectionTitleInput = document.createElement("input");
    sectionTitleInput.type = "text";
    sectionTitleInput.name = "section-title";
    sectionTitleInput.value = data.sectionTitle ?? "";
    const { wrapper: sectionTitleWrapper } = createFieldWrapper(
      "Section heading",
      sectionTitleInput,
    );

    const sectionDescInput = document.createElement("textarea");
    sectionDescInput.name = "section-description";
    sectionDescInput.rows = 2;
    sectionDescInput.value = data.sectionDescription ?? "";
    sectionDescInput.placeholder = "Optional description displayed above the question.";
    const { wrapper: sectionDescWrapper } = createFieldWrapper(
      "Section description",
      sectionDescInput,
    );

    const stemInput = document.createElement("textarea");
    stemInput.name = "question-stem";
    stemInput.rows = 3;
    stemInput.required = true;
    stemInput.value = data.stem ?? "";
    const { wrapper: stemWrapper } = createFieldWrapper("Question stem", stemInput);

    const optionsFieldset = document.createElement("fieldset");
    optionsFieldset.className = "config-fieldset";
    const optionsLegend = document.createElement("legend");
    optionsLegend.textContent = "Answer options";
    optionsFieldset.appendChild(optionsLegend);

    const optionsList = document.createElement("div");
    optionsList.className = "config-collection";
    optionsFieldset.appendChild(optionsList);

    const addOptionBtn = document.createElement("button");
    addOptionBtn.type = "button";
    addOptionBtn.className = "config-btn ghost";
    addOptionBtn.textContent = "Add option";
    optionsFieldset.appendChild(addOptionBtn);

    function addOption(optionData = { text: "", isCorrect: false }) {
      const row = document.createElement("div");
      row.className = "config-collection-row";

      const optionInput = document.createElement("input");
      optionInput.type = "text";
      optionInput.required = true;
      optionInput.value = optionData.text ?? "";
      optionInput.placeholder = "Option text";

      const optionLabel = document.createElement("label");
      optionLabel.className = "config-label";
      const optionId = getInputId("option-text");
      optionLabel.setAttribute("for", optionId);
      optionLabel.textContent = "Choice";
      optionInput.id = optionId;

      const optionWrapper = document.createElement("div");
      optionWrapper.className = "config-collection-main";
      optionWrapper.append(optionLabel, optionInput);

      const correctWrapper = document.createElement("label");
      correctWrapper.className = "config-checkbox";
      const correctInput = document.createElement("input");
      correctInput.type = "checkbox";
      correctInput.checked = Boolean(optionData.isCorrect);
      const checkmark = document.createElement("span");
      checkmark.textContent = "Correct answer";
      correctWrapper.append(correctInput, checkmark);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "config-collection-remove";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        row.remove();
      });

      row.append(optionWrapper, correctWrapper, removeBtn);
      optionsList.appendChild(row);
    }

    data.options.forEach((option) => {
      addOption(option);
    });

    addOptionBtn.addEventListener("click", () => {
      addOption();
    });

    const feedbackInput = document.createElement("textarea");
    feedbackInput.name = "question-feedback";
    feedbackInput.rows = 3;
    feedbackInput.value = data.feedback ?? "";
    feedbackInput.placeholder = "Optional explanation or feedback shown after checking.";
    const { wrapper: feedbackWrapper } = createFieldWrapper("Feedback text", feedbackInput);

    const layoutFieldset = createLayoutFieldset(layout);

    content.append(
      sectionTitleWrapper,
      sectionDescWrapper,
      stemWrapper,
      optionsFieldset,
      feedbackWrapper,
      layoutFieldset.fieldset,
    );

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      setError("");

      if (!form.reportValidity()) {
        return;
      }

      const optionRows = optionsList.querySelectorAll(".config-collection-row");
      const options = Array.from(optionRows).map((row) => {
        const textInput = row.querySelector("input[type='text']");
        const checkbox = row.querySelector("input[type='checkbox']");
        return {
          text: textInput?.value?.trim() ?? "",
          isCorrect: checkbox?.checked ?? false,
        };
      });

      const filteredOptions = options.filter((option) => option.text.length);
      const correctCount = filteredOptions.filter((option) => option.isCorrect).length;

      if (filteredOptions.length < 2) {
        setError("Provide at least two answer options.");
        return;
      }

      if (correctCount === 0) {
        setError("Select at least one correct answer.");
        return;
      }

      const result = {
        data: {
          sectionTitle: sectionTitleInput.value.trim(),
          sectionDescription: sectionDescInput.value.trim(),
          stem: stemInput.value.trim(),
          options: filteredOptions,
          feedback: feedbackInput.value.trim(),
        },
        layout: {
          width: layoutFieldset.controls.widthSelect.value,
          align: layoutFieldset.controls.alignSelect.value || undefined,
          notes: layoutFieldset.controls.notes.value.trim() || undefined,
        },
      };

      close(result);
      settle(result);
    });

    form.addEventListener("reset", () => {
      setError("");
    });

    form.querySelector("[data-modal-cancel]")?.addEventListener("click", () => {
      close(null);
    });
  });
}

function openGapFillModal(existingState, activityLabel) {
  return new Promise((resolve) => {
    const { form, content, close, setError, onClose } = createModalShell(
      existingState ? `Edit ${activityLabel}` : `Add ${activityLabel}`,
    );
    let settled = false;
    const settle = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    onClose((payload) => {
      settle(payload ?? null);
    });

    const data = existingState?.data ?? {
      prompt: "",
      blanks: [
        {
          prefix: "",
          answer: "",
          suffix: "",
          feedbackTitle: "",
          feedback: "",
        },
      ],
    };

    const layout = existingState?.layout ?? {};

    const introInput = document.createElement("textarea");
    introInput.name = "gapfill-intro";
    introInput.rows = 2;
    introInput.placeholder = "Optional introduction or instructions.";
    introInput.value = data.prompt ?? "";
    const { wrapper: introWrapper } = createFieldWrapper("Introduction text", introInput);

    const blanksFieldset = document.createElement("fieldset");
    blanksFieldset.className = "config-fieldset";
    const blanksLegend = document.createElement("legend");
    blanksLegend.textContent = "Blanks";
    blanksFieldset.appendChild(blanksLegend);

    const blanksList = document.createElement("div");
    blanksList.className = "config-collection";
    blanksFieldset.appendChild(blanksList);

    const addBlankBtn = document.createElement("button");
    addBlankBtn.type = "button";
    addBlankBtn.className = "config-btn ghost";
    addBlankBtn.textContent = "Add blank";
    blanksFieldset.appendChild(addBlankBtn);

    function addBlank(blankData = {}) {
      const row = document.createElement("div");
      row.className = "config-collection-row stack";

      const prefixInput = document.createElement("textarea");
      prefixInput.rows = 2;
      prefixInput.value = blankData.prefix ?? "";
      const { wrapper: prefixWrapper } = createFieldWrapper(
        "Text before blank",
        prefixInput,
      );

      const answerInput = document.createElement("input");
      answerInput.type = "text";
      answerInput.required = true;
      answerInput.placeholder = "Answer (use commas for synonyms)";
      answerInput.value = blankData.answer ?? "";
      const { wrapper: answerWrapper } = createFieldWrapper("Correct answer(s)", answerInput);

      const suffixInput = document.createElement("textarea");
      suffixInput.rows = 2;
      suffixInput.value = blankData.suffix ?? "";
      const { wrapper: suffixWrapper } = createFieldWrapper("Text after blank", suffixInput);

      const feedbackTitleInput = document.createElement("input");
      feedbackTitleInput.type = "text";
      feedbackTitleInput.placeholder = "Feedback heading";
      feedbackTitleInput.value = blankData.feedbackTitle ?? "";
      const { wrapper: feedbackTitleWrapper } = createFieldWrapper(
        "Feedback title",
        feedbackTitleInput,
      );

      const feedbackInput = document.createElement("textarea");
      feedbackInput.rows = 2;
      feedbackInput.placeholder = "Optional explanation";
      feedbackInput.value = blankData.feedback ?? "";
      const { wrapper: feedbackWrapper } = createFieldWrapper("Feedback detail", feedbackInput);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "config-collection-remove";
      removeBtn.textContent = "Remove blank";
      removeBtn.addEventListener("click", () => {
        row.remove();
      });

      row.append(
        prefixWrapper,
        answerWrapper,
        suffixWrapper,
        feedbackTitleWrapper,
        feedbackWrapper,
        removeBtn,
      );
      blanksList.appendChild(row);
    }

    data.blanks.forEach((blank) => {
      addBlank(blank);
    });

    addBlankBtn.addEventListener("click", () => {
      addBlank();
    });

    const layoutFieldset = createLayoutFieldset(layout);

    content.append(introWrapper, blanksFieldset, layoutFieldset.fieldset);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      setError("");

      if (!form.reportValidity()) {
        return;
      }

      const rows = blanksList.querySelectorAll(".config-collection-row");
      const blanks = Array.from(rows)
        .map((row) => {
          const [prefixArea, answerField, suffixArea, feedbackTitleField, feedbackArea] = row.querySelectorAll(
            "textarea, input[type='text']",
          );
          return {
            prefix: prefixArea?.value?.trim() ?? "",
            answer: answerField?.value?.trim() ?? "",
            suffix: suffixArea?.value?.trim() ?? "",
            feedbackTitle: feedbackTitleField?.value?.trim() ?? "",
            feedback: feedbackArea?.value?.trim() ?? "",
          };
        })
        .filter((blank) => blank.answer.length);

      if (!blanks.length) {
        setError("Add at least one blank with an answer.");
        return;
      }

      const result = {
        data: {
          prompt: introInput.value.trim(),
          blanks,
        },
        layout: {
          width: layoutFieldset.controls.widthSelect.value,
          align: layoutFieldset.controls.alignSelect.value || undefined,
          notes: layoutFieldset.controls.notes.value.trim() || undefined,
        },
      };

      close(result);
      settle(result);
    });

    form.querySelector("[data-modal-cancel]")?.addEventListener("click", () => {
      close(null);
    });
  });
}

function openMatchingModal(existingState, activityLabel) {
  return new Promise((resolve) => {
    const { form, content, close, setError, onClose } = createModalShell(
      existingState ? `Edit ${activityLabel}` : `Add ${activityLabel}`,
    );
    let settled = false;
    const settle = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    onClose((payload) => {
      settle(payload ?? null);
    });

    const data = existingState?.data ?? {
      title: "",
      rubric: "",
      queryTheme: "",
      pairs: [
        {
          left: { text: "", explanation: "" },
          right: { text: "" },
        },
        {
          left: { text: "", explanation: "" },
          right: { text: "" },
        },
      ],
    };
    const layout = existingState?.layout ?? {};

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.required = true;
    titleInput.value = data.title ?? "";
    const { wrapper: titleWrapper } = createFieldWrapper("Activity title", titleInput);

    const rubricInput = document.createElement("textarea");
    rubricInput.rows = 2;
    rubricInput.placeholder = "Instructions or rubric";
    rubricInput.value = data.rubric ?? "";
    const { wrapper: rubricWrapper } = createFieldWrapper("Instructions", rubricInput);

    const themeInput = document.createElement("input");
    themeInput.type = "text";
    themeInput.placeholder = "Comma-separated keywords for decorative imagery";
    themeInput.value = data.queryTheme ?? "";
    const { wrapper: themeWrapper } = createFieldWrapper("Image query theme", themeInput);

    const pairsFieldset = document.createElement("fieldset");
    pairsFieldset.className = "config-fieldset";
    const pairsLegend = document.createElement("legend");
    pairsLegend.textContent = "Pairs";
    pairsFieldset.appendChild(pairsLegend);

    const pairsList = document.createElement("div");
    pairsList.className = "config-collection";
    pairsFieldset.appendChild(pairsList);

    const addPairBtn = document.createElement("button");
    addPairBtn.type = "button";
    addPairBtn.className = "config-btn ghost";
    addPairBtn.textContent = "Add pair";
    pairsFieldset.appendChild(addPairBtn);

    function addPair(pairData = { left: {}, right: {} }) {
      const row = document.createElement("div");
      row.className = "config-collection-row stack";

      const leftText = document.createElement("textarea");
      leftText.rows = 2;
      leftText.required = true;
      leftText.value = pairData.left?.text ?? "";
      const { wrapper: leftTextWrapper } = createFieldWrapper("Left item", leftText);

      const leftExplanation = document.createElement("textarea");
      leftExplanation.rows = 2;
      leftExplanation.placeholder = "Feedback or explanation";
      leftExplanation.value = pairData.left?.explanation ?? "";
      const { wrapper: leftExplanationWrapper } = createFieldWrapper(
        "Left feedback",
        leftExplanation,
      );

      const rightText = document.createElement("textarea");
      rightText.rows = 2;
      rightText.required = true;
      rightText.value = pairData.right?.text ?? "";
      const { wrapper: rightTextWrapper } = createFieldWrapper("Right item", rightText);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "config-collection-remove";
      removeBtn.textContent = "Remove pair";
      removeBtn.addEventListener("click", () => {
        row.remove();
      });

      row.append(leftTextWrapper, leftExplanationWrapper, rightTextWrapper, removeBtn);
      pairsList.appendChild(row);
    }

    data.pairs.forEach((pair) => {
      addPair(pair);
    });

    addPairBtn.addEventListener("click", () => {
      addPair();
    });

    const layoutFieldset = createLayoutFieldset(layout);

    content.append(titleWrapper, rubricWrapper, themeWrapper, pairsFieldset, layoutFieldset.fieldset);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      setError("");

      if (!form.reportValidity()) {
        return;
      }

      const rows = pairsList.querySelectorAll(".config-collection-row");
      const pairs = Array.from(rows)
        .map((row) => {
          const [leftTextField, leftExplainField, rightTextField] = row.querySelectorAll("textarea");
          return {
            left: {
              text: leftTextField?.value?.trim() ?? "",
              explanation: leftExplainField?.value?.trim() ?? "",
            },
            right: {
              text: rightTextField?.value?.trim() ?? "",
            },
          };
        })
        .filter((pair) => pair.left.text && pair.right.text);

      if (!pairs.length) {
        setError("Add at least one matching pair.");
        return;
      }

      const result = {
        data: {
          title: titleInput.value.trim(),
          rubric: rubricInput.value.trim(),
          queryTheme: themeInput.value.trim(),
          pairs,
        },
        layout: {
          width: layoutFieldset.controls.widthSelect.value,
          align: layoutFieldset.controls.alignSelect.value || undefined,
          notes: layoutFieldset.controls.notes.value.trim() || undefined,
        },
      };

      close(result);
      settle(result);
    });

    form.querySelector("[data-modal-cancel]")?.addEventListener("click", () => {
      close(null);
    });
  });
}

async function buildMultipleChoiceContent(activity) {
  const section = await loadTemplateFragment("multipleChoice");
  const sectionHeader = section.querySelector(".mc-section-header h3");
  if (sectionHeader) {
    sectionHeader.textContent = activity.data.sectionTitle || "Multiple choice";
  }
  const sectionIntro = section.querySelector(".mc-section-header p");
  if (sectionIntro) {
    sectionIntro.textContent = activity.data.sectionDescription || "";
  }
  const question = section.querySelector(".mc-question");
  const questionText = question?.querySelector(".mc-question-text");
  if (questionText) {
    questionText.textContent = activity.data.stem || "";
  }

  if (question) {
    const optionTemplate = question.querySelector(".mc-option-item")?.cloneNode(true);
    const optionsContainer = question.querySelector(".mc-options-container");
    optionsContainer?.replaceChildren();
    const correctTotal = activity.data.options.filter((option) => option.isCorrect).length;
    const optionType = correctTotal > 1 ? "checkbox" : "radio";
    const optionName = `${activity.id}-option`;

    activity.data.options.forEach((option, index) => {
      if (!optionsContainer || !optionTemplate) {
        return;
      }
      const optionEl = optionTemplate.cloneNode(true);
      const input = optionEl.querySelector("input");
      const optionText = optionEl.querySelector(".mc-option-text");
      if (input) {
        input.type = optionType;
        input.name = optionType === "radio" ? optionName : `${optionName}-${index}`;
        input.checked = option.isCorrect;
        input.disabled = true;
      }
      if (optionText) {
        optionText.textContent = option.text;
      }
      optionEl.dataset.correct = option.isCorrect ? "true" : "false";
      optionsContainer.appendChild(optionEl);
    });

    const explanation = question.querySelector(".mc-explanation");
    if (explanation) {
      explanation.textContent = activity.data.feedback || "";
    }
  }

  return section;
}

async function buildGapFillContent(activity) {
  const container = await loadTemplateFragment("gapFill");
  container.replaceChildren();

  if (activity.data.prompt) {
    const intro = document.createElement("p");
    intro.className = "gapfill-intro";
    intro.textContent = activity.data.prompt;
    container.appendChild(intro);
  }

  activity.data.blanks.forEach((blank, index) => {
    const paragraph = document.createElement("p");
    if (blank.prefix) {
      paragraph.appendChild(document.createTextNode(blank.prefix));
      paragraph.appendChild(document.createTextNode(" "));
    }
    const gap = document.createElement("span");
    gap.className = "gap-wrapper";
    const answers = blank.answer
      .split(/[,|]/)
      .map((token) => token.trim())
      .filter(Boolean);
    gap.dataset.correctAnswer = answers.join("|");
    if (blank.feedbackTitle) {
      gap.dataset.feedbackTitle = blank.feedbackTitle;
    }
    if (blank.feedback) {
      gap.dataset.explanation = blank.feedback;
    }
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type answer";
    input.setAttribute("aria-label", `Blank ${index + 1}`);
    input.disabled = true;
    gap.appendChild(input);
    paragraph.appendChild(gap);
    if (blank.suffix) {
      paragraph.appendChild(document.createTextNode(" "));
      paragraph.appendChild(document.createTextNode(blank.suffix));
    }
    container.appendChild(paragraph);
  });

  return container;
}

async function buildMatchingContent(activity) {
  const container = await loadTemplateFragment("matching");
  container.classList.add("matching-activity");
  container.removeAttribute("id");

  if (activity.data.queryTheme) {
    container.dataset.queryTheme = activity.data.queryTheme;
  } else {
    delete container.dataset.queryTheme;
  }

  const explicitHeader = container.querySelector(".activity-header");
  let header = null;
  if (explicitHeader instanceof HTMLElement) {
    header = explicitHeader;
  } else if (container.firstElementChild instanceof HTMLElement) {
    header = container.firstElementChild;
  }
  if (header) {
    const titleEl = header.querySelector("h1");
    const rubricEl = header.querySelector(".rubric, h2");
    if (titleEl) {
      titleEl.textContent = activity.data.title || "Matching";
    }
    if (rubricEl) {
      rubricEl.textContent = activity.data.rubric || "";
    }
  }

  const leftColumn = container.querySelector(".link-column.left");
  const rightColumn = container.querySelector(".link-column.right");
  const leftTemplate = leftColumn?.querySelector(".linking-item")?.cloneNode(true) ?? null;
  const rightTemplate = rightColumn?.querySelector(".linking-item")?.cloneNode(true) ?? null;
  leftColumn?.replaceChildren();
  rightColumn?.replaceChildren();

  const answerKey = [];

  activity.data.pairs.forEach((pair, index) => {
    if (!leftColumn || !rightColumn || !leftTemplate || !rightTemplate) {
      return;
    }
    const leftId = `L${index + 1}`;
    const rightId = `R${index + 1}`;
    const leftItem = leftTemplate.cloneNode(true);
    leftItem.dataset.linkId = leftId;
    if (pair.left?.explanation) {
      leftItem.dataset.explanation = pair.left.explanation;
    }
    const leftText = leftItem.querySelector(".linking-item-text");
    if (leftText) {
      leftText.textContent = pair.left?.text || `Left ${index + 1}`;
    }
    const leftConnector = leftItem.querySelector(".linking-item-connector");
    if (leftConnector) {
      leftConnector.setAttribute("aria-label", `Connector for ${pair.left?.text || `left ${index + 1}`}`);
      leftConnector.disabled = true;
    }
    leftColumn.appendChild(leftItem);

    const rightItem = rightTemplate.cloneNode(true);
    rightItem.dataset.linkId = rightId;
    const rightText = rightItem.querySelector(".linking-item-text");
    if (rightText) {
      rightText.textContent = pair.right?.text || `Right ${index + 1}`;
    }
    const rightConnector = rightItem.querySelector(".linking-item-connector");
    if (rightConnector) {
      rightConnector.setAttribute("aria-label", `Connector for ${pair.right?.text || `right ${index + 1}`}`);
      rightConnector.disabled = true;
    }
    rightColumn.appendChild(rightItem);

    answerKey.push({ start: leftId, end: rightId });
  });

  container.dataset.answerKey = JSON.stringify(answerKey);

  return container;
}

async function buildActivityContent(activity) {
  switch (activity.type) {
    case "multipleChoice":
      return buildMultipleChoiceContent(activity);
    case "gapFill":
      return buildGapFillContent(activity);
    case "matching":
      return buildMatchingContent(activity);
    default:
      throw new Error(`Unsupported activity type: ${activity.type}`);
  }
}

async function renderActivity(activity, slideIndex) {
  const slide = slides[slideIndex];
  const canvas = ensureCanvas(slide);
  if (!canvas) {
    return null;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "auth-activity";
  wrapper.dataset.activityId = activity.id;
  wrapper.dataset.activityType = activity.type;
  wrapper.tabIndex = 0;

  const chrome = document.createElement("div");
  chrome.className = "auth-activity-chrome";
  const typeLabel = document.createElement("span");
  typeLabel.className = "auth-activity-type";
  typeLabel.textContent = ACTIVITY_CONFIG[activity.type]?.label ?? "Activity";
  chrome.appendChild(typeLabel);

  const actions = document.createElement("div");
  actions.className = "auth-activity-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "auth-activity-action";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", async (event) => {
    event.stopPropagation();
    await editActivity(activity.id);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "auth-activity-action danger";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    deleteActivity(activity.id);
  });

  actions.append(editBtn, deleteBtn);
  chrome.appendChild(actions);

  const body = document.createElement("div");
  body.className = "auth-activity-body";
  const content = await buildActivityContent(activity);
  body.appendChild(content);

  wrapper.append(chrome, body);
  const controller = ensureCanvasController(slideIndex);
  const host = controller?.activitiesLayer ?? canvas;
  host.appendChild(wrapper);

  wrapper.addEventListener("pointerdown", (event) => {
    handleDrag(event, wrapper, slideIndex, activity.id);
  });

  wrapper.addEventListener("dblclick", async (event) => {
    event.preventDefault();
    await editActivity(activity.id);
  });

  applyLayout(wrapper, activity.layout);
  applyPosition(wrapper, activity.position);

  setActivityElement(activity.id, slideIndex, wrapper);
  updateCanvasHint(slideIndex);
  return wrapper;
}

async function refreshActivityElement(activityId) {
  const record = findActivityRecord(activityId);
  if (!record) {
    return;
  }
  const { activity, slideIndex } = record;
  const element = getActivityElement(activityId);
  if (!element) {
    await renderActivity(activity, slideIndex);
    return;
  }
  const body = element.querySelector(".auth-activity-body");
  if (!body) {
    return;
  }
  body.innerHTML = "";
  const content = await buildActivityContent(activity);
  body.appendChild(content);
  applyLayout(element, activity.layout);
  applyPosition(element, activity.position);
}

async function editActivity(activityId) {
  const record = findActivityRecord(activityId);
  if (!record) {
    return;
  }
  const { activity } = record;
  const config = ACTIVITY_CONFIG[activity.type];
  if (!config) {
    return;
  }
  const result = await config.openModal(activity, config.label);
  if (!result) {
    return;
  }
  activity.data = result.data;
  activity.layout = result.layout;
  await refreshActivityElement(activity.id);
  notifyStateChange();
}

function deleteActivity(activityId) {
  const record = findActivityRecord(activityId);
  if (!record) {
    return;
  }
  const { slideIndex } = record;
  const slideState = deckAuthoringState.slides[slideIndex];
  slideState.activities = slideState.activities.filter((item) => item.id !== activityId);
  removeActivityElement(activityId);
  notifyStateChange();
}

const ACTIVITY_CONFIG = {
  multipleChoice: {
    label: "Multiple choice",
    openModal: openMultipleChoiceModal,
  },
  gapFill: {
    label: "Gap fill",
    openModal: openGapFillModal,
  },
  matching: {
    label: "Matching",
    openModal: openMatchingModal,
  },
};

function ensureDeckState() {
  deckAuthoringState.slides = slides.map((slide, index) => {
    const existing = deckAuthoringState.slides[index];
    if (existing) {
      if (!existing.canvas) {
        existing.canvas = { elements: [], drawing: { strokes: [] } };
      }
      if (!Array.isArray(existing.canvas.elements)) {
        existing.canvas.elements = [];
      }
      if (!existing.canvas.drawing) {
        existing.canvas.drawing = { strokes: [] };
      }
      if (!Array.isArray(existing.canvas.drawing.strokes)) {
        existing.canvas.drawing.strokes = [];
      }
      return existing;
    }
    return { activities: [], canvas: { elements: [], drawing: { strokes: [] } } };
  });
}

async function renderExistingActivities() {
  const renders = [];
  deckAuthoringState.slides.forEach((slideState, slideIndex) => {
    slideState.activities.forEach((activity) => {
      renders.push(renderActivity(activity, slideIndex));
    });
  });
  await Promise.all(renders);
}

async function addActivity(type) {
  const config = ACTIVITY_CONFIG[type];
  if (!config) {
    return;
  }
  const result = await config.openModal(null, config.label);
  if (!result) {
    return;
  }
  const slideState = deckAuthoringState.slides[activeIndex];
  const activityCount = slideState.activities.length;
  const position = {
    x: 32 + activityCount * 24,
    y: 32 + activityCount * 24,
  };
  const activity = {
    id: getUniqueId(type),
    type,
    data: result.data,
    layout: result.layout,
    position,
  };
  slideState.activities.push(activity);
  await renderActivity(activity, activeIndex);
  notifyStateChange();
}

function createPalette() {
  const palette = document.createElement("div");
  palette.className = "authoring-palette";
  palette.setAttribute("aria-label", "Activity palette");

  const heading = document.createElement("h2");
  heading.textContent = "Activities";
  palette.appendChild(heading);

  const description = document.createElement("p");
  description.className = "authoring-palette-description";
  description.textContent = "Add interactive activities to the current slide.";
  palette.appendChild(description);

  const list = document.createElement("div");
  list.className = "authoring-palette-buttons";
  palette.appendChild(list);

  Object.entries(ACTIVITY_CONFIG).forEach(([type, config]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "authoring-palette-btn";
    button.textContent = `Add ${config.label}`;
    button.addEventListener("click", () => {
      addActivity(type).catch((error) => {
        console.error("Failed to add activity", error);
      });
    });
    list.appendChild(button);
  });

  return palette;
}

function injectPalette() {
  const sidebar = document.querySelector(".authoring-sidebar");
  if (sidebar) {
    sidebar.insertAdjacentElement("afterbegin", createPalette());
    return;
  }
  const workspace = document.querySelector(".deck-workspace");
  if (workspace) {
    workspace.insertAdjacentElement("afterbegin", createPalette());
  }
}

function showSlide(index) {
  const target = Number(index);
  if (!Number.isInteger(target) || target < 0 || target >= slides.length) {
    return;
  }

  if (target === activeIndex) {
    return;
  }

  slides.forEach((slide, slideIndex) => {
    setSlideVisibility(slide, slideIndex === target);
  });

  activeIndex = target;
  updateCounter();
  updateButtons();
  slideNavigator?.setActive(activeIndex);
  const controller = canvasControllers.get(activeIndex);
  if (controller) {
    syncDrawingCanvasSize(controller);
  }
  if (activeTextContext) {
    activeTextContext = null;
    hideTextFormattingToolbar();
  }
}

function initialiseNavigation() {
  slides.forEach((slide, index) => {
    setSlideVisibility(slide, index === activeIndex);
  });
  updateCounter();
  updateButtons();

  slideNavigator = initSlideNavigator({
    stageViewport,
    onSelectSlide: (index) => {
      showSlide(index);
    },
  });

  refreshSlideNavigatorMeta();

  prevBtn?.addEventListener("click", () => {
    if (activeIndex > 0) {
      showSlide(activeIndex - 1);
    }
  });

  nextBtn?.addEventListener("click", () => {
    if (activeIndex < slides.length - 1) {
      showSlide(activeIndex + 1);
    }
  });
}

function initialiseAuthoring() {
  if (!slides.length) {
    return;
  }
  ensureDeckState();
  slides.forEach((slide, index) => {
    ensureCanvas(slide);
    ensureCanvasController(index);
  });
  injectPalette();
  renderAllCanvasElements();
  renderAllCanvasDrawings();
  renderExistingActivities()
    .then(() => {
      slides.forEach((_, index) => {
        updateCanvasHint(index);
      });
    })
    .catch((error) => {
      console.error("Failed to render activities", error);
    });
  slides.forEach((_, index) => {
    updateCanvasHint(index);
  });
  refreshSlideNavigatorMeta();
}

if (slides.length) {
  initialiseNavigation();
  initialiseAuthoring();
}

document.addEventListener("selectionchange", () => {
  if (activeTextContext?.element) {
    requestToolbarUpdate();
  }
});

window.addEventListener(
  "scroll",
  () => {
    if (activeTextContext?.element) {
      requestToolbarUpdate();
    }
  },
  true,
);

window.addEventListener("resize", () => {
  if (activeTextContext?.element) {
    requestToolbarUpdate();
  }
});

window.authoringDeck = {
  getState: getDeckState,
  loadState: async (incomingState) => {
    if (!incomingState || !Array.isArray(incomingState.slides)) {
      console.warn("Invalid state supplied to loadState", incomingState);
      return;
    }

    activityElements.forEach(({ element }) => {
      element.remove();
    });
    activityElements.clear();
    canvasControllers.forEach((controller) => {
      Array.from(controller.elementInstances.keys()).forEach((elementId) => {
        destroyCanvasElement(controller, elementId);
      });
      if (controller.drawingCtx && controller.drawingCanvas) {
        const ctx = controller.drawingCtx;
        if (typeof ctx.save === "function") {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, controller.drawingCanvas.width, controller.drawingCanvas.height);
          ctx.restore();
        } else {
          ctx.clearRect(0, 0, controller.drawingCanvas.width, controller.drawingCanvas.height);
        }
      }
      controller.elementInstances.clear();
    });
    canvasElementMap.clear();

    deckAuthoringState.slides = slides.map(() => ({
      activities: [],
      canvas: { elements: [], drawing: { strokes: [] } },
    }));

    incomingState.slides.forEach((slideState, slideIndex) => {
      if (!deckAuthoringState.slides[slideIndex]) {
        deckAuthoringState.slides[slideIndex] = { activities: [], canvas: { elements: [], drawing: { strokes: [] } } };
      }
      const activities = Array.isArray(slideState.activities)
        ? slideState.activities
            .map((activity) => {
              if (!activity || !activity.type || !ACTIVITY_CONFIG[activity.type]) {
                return null;
              }
              return {
                id: activity.id || getUniqueId(activity.type ?? "activity"),
                type: activity.type,
                data: activity.data,
                layout: activity.layout,
                position: activity.position,
              };
            })
            .filter(Boolean)
        : [];
      deckAuthoringState.slides[slideIndex].activities = activities;

      const incomingCanvas = slideState.canvas ?? {};
      const elements = Array.isArray(incomingCanvas.elements)
        ? incomingCanvas.elements
            .map((element) => {
              if (!element || !element.type) {
                return null;
              }
              if (element.type === "image") {
                if (!element.src) {
                  return null;
                }
                return {
                  id: element.id || getUniqueId("image"),
                  type: "image",
                  src: element.src,
                  alt: element.alt ?? "",
                  position: element.position ?? { x: 96, y: 96 },
                  size: element.size ?? { width: 320, height: 240 },
                };
              }
              return {
                id: element.id || getUniqueId("textbox"),
                type: "text",
                html: element.html ?? "<p>Double-click to start typing…</p>",
                position: element.position ?? { x: 48, y: 48 },
                size: element.size ?? { width: 260, height: 140 },
                styles: element.styles ?? {},
              };
            })
            .filter(Boolean)
        : [];

      const strokes = Array.isArray(incomingCanvas?.drawing?.strokes)
        ? incomingCanvas.drawing.strokes
            .map((stroke) => {
              if (!stroke?.points?.length) {
                return null;
              }
              const points = stroke.points
                .map((point) => ({
                  x: Number.isFinite(point?.x) ? point.x : Number(point?.x) || 0,
                  y: Number.isFinite(point?.y) ? point.y : Number(point?.y) || 0,
                  pressure: Number.isFinite(point?.pressure) ? point.pressure : 0.5,
                }))
                .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
              if (!points.length) {
                return null;
              }
              const tool = stroke.tool === "highlighter" ? "highlighter" : "pen";
              const opacity = Number.isFinite(stroke.opacity)
                ? stroke.opacity
                : tool === "highlighter"
                ? 0.35
                : 1;
              const size = Number.isFinite(stroke.size) ? stroke.size : tool === "highlighter" ? 8 : 4;
              return {
                id: stroke.id || getUniqueId("stroke"),
                tool,
                color: stroke.color || "#1f2933",
                size,
                opacity,
                points,
              };
            })
            .filter(Boolean)
        : [];

      deckAuthoringState.slides[slideIndex].canvas = {
        elements,
        drawing: { strokes },
      };
    });

    await renderExistingActivities();
    renderAllCanvasElements();
    renderAllCanvasDrawings();
    slides.forEach((_, index) => {
      updateCanvasHint(index);
    });
    notifyStateChange();
  },
};
