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
  return canvas;
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
}

function handleDrag(event, wrapper, slideIndex, activityId) {
  if (event.button !== 0 || event.target.closest(".auth-activity-action")) {
    return;
  }

  const canvas = wrapper.closest("[data-activity-canvas]");
  if (!(canvas instanceof HTMLElement)) {
    return;
  }

  event.preventDefault();
  const pointerId = event.pointerId;
  const initialRect = canvas.getBoundingClientRect();
  const startLeft = parseFloat(wrapper.style.left || "0");
  const startTop = parseFloat(wrapper.style.top || "0");
  const offsetX = event.clientX - initialRect.left - startLeft;
  const offsetY = event.clientY - initialRect.top - startTop;

  function updatePosition(moveEvent) {
    if (moveEvent.pointerId !== pointerId) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
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
    if (wrapper.hasPointerCapture(pointerId)) {
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
  wrapper.setPointerCapture(pointerId);
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
  canvas.appendChild(wrapper);

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
      return existing;
    }
    return { activities: [] };
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
  slides.forEach((slide) => {
    ensureCanvas(slide);
  });
  ensureDeckState();
  injectPalette();
  renderExistingActivities().catch((error) => {
    console.error("Failed to render activities", error);
  });
  refreshSlideNavigatorMeta();
}

if (slides.length) {
  initialiseNavigation();
  initialiseAuthoring();
}

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

    deckAuthoringState.slides = slides.map(() => ({ activities: [] }));

    incomingState.slides.forEach((slideState, slideIndex) => {
      if (!deckAuthoringState.slides[slideIndex]) {
        deckAuthoringState.slides[slideIndex] = { activities: [] };
      }
      const activities = Array.isArray(slideState.activities)
        ? slideState.activities.map((activity) => ({
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
    });

    await renderExistingActivities();
    notifyStateChange();
  },
};
