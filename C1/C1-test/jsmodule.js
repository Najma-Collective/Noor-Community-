const stageViewport = document.querySelector(".stage-viewport");
const nextBtn = stageViewport?.querySelector(".slide-nav-next");
const prevBtn = stageViewport?.querySelector(".slide-nav-prev");
const counter = document.getElementById("slide-counter");
const addSlideBtn = document.getElementById("add-slide-btn");
const exportPdfBtn = document.getElementById("export-pdf-btn");

let exportToolsPromise;
const exportScriptPromises = new Map();

const HTML2CANVAS_URL =
  "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
const JSPDF_URL =
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";

const REMOTE_IMAGE_SELECTOR = "img[data-remote-src]";
const remoteImageHydrations = new WeakMap();

function getRemoteImageContainer(img) {
  if (!(img instanceof HTMLElement)) {
    return null;
  }
  return img.closest(".bg-media") ?? img.closest(".context-image") ?? img.parentElement;
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
      const response = await fetch(remoteSrc, { mode: "cors" });
      if (!response.ok) {
        throw new Error(`Remote image request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

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

          function handleError() {
            cleanup();
            reject(new Error("Image failed to load"));
          }

          img.addEventListener("load", handleLoad, { once: true });
          img.addEventListener("error", handleError, { once: true });
          img.removeAttribute("loading");
          img.src = objectUrl;
        });

        img.dataset.remoteHydrated = "success";
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
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

  const scope = root instanceof Element || root instanceof Document ? root : document;
  const queryFn = typeof scope.querySelectorAll === "function" ? scope.querySelectorAll.bind(scope) : null;
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

function loadExternalScript(url, { module = false } = {}) {
  if (exportScriptPromises.has(url)) {
    return exportScriptPromises.get(url);
  }

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = url;
    script.crossOrigin = "anonymous";
    if (module) {
      script.type = "module";
    }

    script.addEventListener(
      "load",
      () => {
        resolve();
      },
      { once: true },
    );

    script.addEventListener(
      "error",
      () => {
        exportScriptPromises.delete(url);
        script.remove();
        reject(new Error(`Failed to load script: ${url}`));
      },
      { once: true },
    );

    document.head.appendChild(script);
  });

  exportScriptPromises.set(url, promise);
  return promise;
}

async function loadExternalTool({ url, resolveValue }) {
  const existing = resolveValue();
  if (existing) {
    return existing;
  }

  await loadExternalScript(url);

  const loaded = resolveValue();
  if (!loaded) {
    throw new Error(`Tool did not register after loading: ${url}`);
  }
  return loaded;
}

async function ensureExportTools() {
  if (exportToolsPromise) {
    return exportToolsPromise;
  }

  exportToolsPromise = (async () => {
    const html2canvasFn = await loadExternalTool({
      url: HTML2CANVAS_URL,
      resolveValue: () =>
        typeof window.html2canvas === "function" ? window.html2canvas : undefined,
    });

    const jsPDFConstructor = await loadExternalTool({
      url: JSPDF_URL,
      resolveValue: () => {
        if (typeof window.jspdf?.jsPDF === "function") {
          return window.jspdf.jsPDF;
        }
        if (typeof window.jsPDF === "function") {
          return window.jsPDF;
        }
        return undefined;
      },
    });

    if (!window.html2canvas) {
      window.html2canvas = html2canvasFn;
    }

    if (!window.jspdf?.jsPDF && typeof jsPDFConstructor === "function") {
      window.jspdf = window.jspdf || {};
      window.jspdf.jsPDF = jsPDFConstructor;
    }

    return { html2canvas: html2canvasFn, jsPDFConstructor };
  })();

  try {
    return await exportToolsPromise;
  } catch (error) {
    exportToolsPromise = undefined;
    throw error;
  }
}

let slides = [];
let currentSlideIndex = 0;
let mindMapId = 0;

function refreshSlides() {
  slides = Array.from(stageViewport?.querySelectorAll(".slide-stage") ?? []);
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

function addBlankSlide() {
  if (!stageViewport) return;
  const newSlide = createBlankSlide();
  const insertionPoint = prevBtn ?? nextBtn ?? null;
  stageViewport.insertBefore(newSlide, insertionPoint);
  attachBlankSlideEvents(newSlide);
  refreshSlides();
  showSlide(slides.length - 1);
}

function createBlankSlide() {
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
        <p class="blank-hint" data-role="hint">Add textboxes for free typing or build a mind map to capture relationships.</p>
        <div class="blank-canvas" role="region" aria-label="Blank slide workspace"></div>
      </div>
    </div>
  `;
  return slide;
}

function attachBlankSlideEvents(slide) {
  const canvas = slide.querySelector(".blank-canvas");
  const hint = slide.querySelector('[data-role="hint"]');
  const addTextboxBtn = slide.querySelector('[data-action="add-textbox"]');
  const addMindmapBtn = slide.querySelector('[data-action="add-mindmap"]');

  if (!(canvas instanceof HTMLElement) || !(hint instanceof HTMLElement)) {
    return;
  }

  addTextboxBtn?.addEventListener("click", () => {
    const textbox = createTextbox();
    canvas.appendChild(textbox);
    positionTextbox(textbox, canvas);
    hint.textContent =
      "Drag your textboxes into place and double-click to edit the content.";
  });

  addMindmapBtn?.addEventListener("click", () => {
    if (canvas.querySelector(".mindmap")) {
      const existing = canvas.querySelector(".mindmap");
      existing?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const mindmap = createMindMap(() => {
      if (
        !canvas.querySelector(".textbox") &&
        !canvas.querySelector(".mindmap")
      ) {
        hint.textContent =
          "Add textboxes for free typing or build a mind map to capture relationships.";
      }
    });
    canvas.appendChild(mindmap);
    hint.textContent =
      "Mind map ready. Add branches to capture ideas and connections.";
  });
}

function positionTextbox(textbox, canvas) {
  const count = canvas.querySelectorAll(".textbox").length - 1;
  const offset = 24 * count;
  textbox.style.left = `${offset}px`;
  textbox.style.top = `${offset}px`;
}

function createTextbox() {
  const textbox = document.createElement("div");
  textbox.className = "textbox";
  textbox.innerHTML = `
    <button type="button" class="textbox-remove" aria-label="Remove textbox">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <div class="textbox-handle">Textbox</div>
    <div class="textbox-body" contenteditable="true" aria-label="Editable textbox">Double-click to start typing...</div>
  `;

  const removeBtn = textbox.querySelector(".textbox-remove");
  removeBtn?.addEventListener("click", () => {
    const canvas = textbox.parentElement;
    textbox.remove();
    if (canvas) {
      const slide = canvas.closest(".slide-stage");
      const hint = slide?.querySelector('[data-role="hint"]');
      if (
        hint instanceof HTMLElement &&
        !canvas.querySelector(".textbox") &&
        !canvas.querySelector(".mindmap")
      ) {
        hint.textContent =
          "Add textboxes for free typing or build a mind map to capture relationships.";
      }
    }
  });

  const body = textbox.querySelector(".textbox-body");
  body?.addEventListener("dblclick", () => {
    if (body instanceof HTMLElement) {
      body.focus();
    }
  });

  makeDraggable(textbox);
  return textbox;
}

function makeDraggable(element) {
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

function createMindMap(onRemove) {
  const container = document.createElement("section");
  container.className = "mindmap";
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
    <div class="mindmap-branches" aria-live="polite"></div>
    <form class="mindmap-form">
      <label class="sr-only" for="${branchInputId}">New branch label</label>
      <input id="${branchInputId}" type="text" placeholder="Add branch idea" autocomplete="off">
      <button type="submit">
        <i class="fa-solid fa-plus"></i>
        Add Branch
      </button>
    </form>
  `;

  const removeBtn = container.querySelector(".mindmap-remove");
  removeBtn?.addEventListener("click", () => {
    container.remove();
    onRemove?.();
  });

  const form = container.querySelector(".mindmap-form");
  const input = container.querySelector("input");
  const branches = container.querySelector(".mindmap-branches");

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!branches || !input) return;
    const value = input.value.trim();
    if (!value) return;
    branches.appendChild(createMindMapBranch(value));
    input.value = "";
    input.focus();
  });

  if (branches) {
    branches.appendChild(createMindMapBranch("Add supporting detail..."));
  }

  return container;
}

function createMindMapBranch(text) {
  const branch = document.createElement("div");
  branch.className = "mindmap-branch";
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("aria-label", "Mind map branch");
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "branch-remove";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", () => {
    branch.remove();
  });
  branch.append(textarea, removeBtn);
  return branch;
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
        ).every((token) => token.dataset.category === column.dataset.category);
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
    .querySelectorAll('[data-activity="matching"]')
    .forEach((el) => setupMatching(el));
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
}

async function initialiseDeck() {
  await hydrateRemoteImages().catch((error) => {
    console.warn("Remote imagery could not be hydrated during initialisation", error);
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
  exportPdfBtn?.addEventListener("click", () => {
    exportDeckToPdf();
  });
}

initialiseDeck().catch((error) => {
  console.error("Deck initialisation failed", error);
});

async function exportDeckToPdf() {
  await hydrateRemoteImages(stageViewport).catch((error) => {
    console.warn("Continuing export without hydrated imagery", error);
  });

  refreshSlides();
  if (!slides.length || !stageViewport) return;

  let html2canvas;
  let jsPDFConstructor;

  try {
    ({ html2canvas, jsPDFConstructor } = await ensureExportTools());
  } catch (error) {
    console.error("Failed to load export tools", error);
    window.alert("Export tools failed to load. Please check your connection and try again.");
    return;
  }

  const button = exportPdfBtn;
  const originalLabel = button?.innerHTML ?? "";
  if (button) {
    button.disabled = true;
    button.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Exporting...';
  }

  const originalIndex = currentSlideIndex;
  let pdf = null;

  const fonts = document.fonts;
  if (fonts?.ready instanceof Promise) {
    try {
      await fonts.ready;
    } catch (error) {
      console.warn("Font loading check failed", error);
    }
  }

  try {
    for (let index = 0; index < slides.length; index++) {
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("hidden", slideIndex !== index);
      });

      await new Promise((resolve) => window.requestAnimationFrame(resolve));

      const slide = slides[index];
      if (!(slide instanceof HTMLElement)) {
        // Skip non-HTML elements just in case
        continue;
      }

      const previousScrollTop = slide.scrollTop;
      const previousScrollLeft = slide.scrollLeft;
      slide.scrollTop = 0;
      slide.scrollLeft = 0;

      const computedBackground = window.getComputedStyle(slide).backgroundColor;
      const isTransparent =
        !computedBackground ||
        computedBackground === "transparent" ||
        computedBackground === "rgba(0, 0, 0, 0)";
      const backgroundFallback = window.getComputedStyle(document.body).backgroundColor || "#ffffff";

      await waitForImages(slide);

      const canvas = await html2canvas(slide, {
        scale: Math.max(2, window.devicePixelRatio || 1),
        useCORS: true,
        backgroundColor: isTransparent ? backgroundFallback : computedBackground,
      });

      slide.scrollTop = previousScrollTop;
      slide.scrollLeft = previousScrollLeft;

      const imageData = canvas.toDataURL("image/png");
      const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";

      if (!pdf) {
        pdf = new jsPDFConstructor({
          orientation,
          unit: "px",
          format: [canvas.width, canvas.height],
        });
      } else {
        pdf.addPage([canvas.width, canvas.height], orientation);
      }

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight);
    }

    if (pdf) {
      pdf.save("C1-lesson-slides.pdf");
    }
  } catch (error) {
    console.error("Export failed:", error);
    window.alert("Sorry, something went wrong while creating the PDF. Please try again.");
  } finally {
    showSlide(originalIndex);
    if (button) {
      button.disabled = false;
      button.innerHTML = originalLabel;
    }
  }
}

async function waitForImages(root) {
  if (!(root instanceof HTMLElement)) {
    return;
  }

  const images = Array.from(root.querySelectorAll("img"));
  if (!images.length) {
    return;
  }

  await Promise.all(
    images.map(async (img) => {
      if (img.dataset.remoteSrc) {
        await hydrateRemoteImage(img);
        if (img.dataset.remoteHydrated === "failed") {
          return;
        }
      }

      if (img.complete && img.naturalWidth !== 0) {
        return;
      }

      await new Promise((resolve) => {
        function cleanup() {
          img.removeEventListener("load", handleLoad);
          img.removeEventListener("error", handleError);
        }

        function handleLoad() {
          cleanup();
          resolve();
        }

        function handleError() {
          cleanup();
          resolve();
        }

        img.addEventListener("load", handleLoad, { once: true });
        img.addEventListener("error", handleError, { once: true });
      });
    }),
  );
}
