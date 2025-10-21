const overlay = document.getElementById("activity-builder");
const openBtn = document.getElementById("open-activity-builder");

if (overlay && openBtn) {
  const panel = overlay.querySelector(".activity-builder-panel");
  const form = overlay.querySelector("#activity-builder-form");
  const closeBtn = overlay.querySelector("[data-action=\"close-builder\"]");
  const clearBtn = overlay.querySelector("[data-action=\"clear-builder\"]");
  const questionContainer = overlay.querySelector("[data-role=\"question-container\"]");
  const statusEl = overlay.querySelector("[data-role=\"builder-status\"]");
  const jsonOutput = overlay.querySelector("#builder-json-output");
  const countInput = overlay.querySelector("#builder-count");
  const typeSelect = overlay.querySelector("#builder-type");
  const titleInput = overlay.querySelector("#builder-title");
  const DEFAULT_QUESTION_COUNT = Number(countInput?.value ?? 3) || 3;

  function setStatus(message = "", type = "") {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove("success", "error");
    if (type) {
      statusEl.classList.add(type);
    }
  }

  function openBuilder() {
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("builder-open");
    const firstField = titleInput ?? panel?.querySelector("input, textarea, select");
    if (firstField instanceof HTMLElement) {
      requestAnimationFrame(() => {
        firstField.focus();
      });
    }
  }

  function closeBuilder() {
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("builder-open");
  }

  function createQuestionField(index) {
    const wrapper = document.createElement("div");
    wrapper.className = "builder-question";
    wrapper.dataset.index = String(index);

    const heading = document.createElement("h3");
    heading.textContent = `Question ${index}`;
    wrapper.appendChild(heading);

    const promptGroup = document.createElement("div");
    promptGroup.className = "builder-subfield";
    const promptLabel = document.createElement("label");
    const promptId = `builder-question-${index}`;
    promptLabel.setAttribute("for", promptId);
    promptLabel.textContent = "Prompt";
    const promptField = document.createElement("textarea");
    promptField.id = promptId;
    promptField.name = `question-${index}`;
    promptField.rows = 2;
    promptField.required = true;
    promptField.placeholder = "What is the main strength of the proposal?";
    promptField.dataset.role = "prompt";
    promptGroup.appendChild(promptLabel);
    promptGroup.appendChild(promptField);
    wrapper.appendChild(promptGroup);

    const answerGroup = document.createElement("div");
    answerGroup.className = "builder-subfield";
    const answerLabel = document.createElement("label");
    const answerId = `builder-answer-${index}`;
    answerLabel.setAttribute("for", answerId);
    answerLabel.textContent = "Expected answer";
    const answerField = document.createElement("input");
    answerField.type = "text";
    answerField.id = answerId;
    answerField.name = `answer-${index}`;
    answerField.required = true;
    answerField.placeholder = "e.g. It demonstrates strong community buy-in.";
    answerField.dataset.role = "answer";
    answerGroup.appendChild(answerLabel);
    answerGroup.appendChild(answerField);
    wrapper.appendChild(answerGroup);

    const feedbackGroup = document.createElement("div");
    feedbackGroup.className = "builder-subfield";
    const feedbackLabel = document.createElement("label");
    const feedbackId = `builder-feedback-${index}`;
    feedbackLabel.setAttribute("for", feedbackId);
    feedbackLabel.textContent = "Feedback when correct";
    const feedbackField = document.createElement("textarea");
    feedbackField.id = feedbackId;
    feedbackField.name = `feedback-${index}`;
    feedbackField.rows = 2;
    feedbackField.required = true;
    feedbackField.placeholder = "Affirm the key idea or extend the learning.";
    feedbackField.dataset.role = "feedback";
    feedbackGroup.appendChild(feedbackLabel);
    feedbackGroup.appendChild(feedbackField);
    wrapper.appendChild(feedbackGroup);

    return wrapper;
  }

  function ensureQuestionFields(count) {
    if (!questionContainer) return;
    const parsed = Number(count) || 0;
    const target = Math.min(Math.max(parsed, 1), 6);
    const current = questionContainer.querySelectorAll(".builder-question").length;

    if (target > current) {
      for (let i = current + 1; i <= target; i += 1) {
        questionContainer.appendChild(createQuestionField(i));
      }
    } else if (target < current) {
      while (questionContainer.querySelectorAll(".builder-question").length > target) {
        const lastChild = questionContainer.lastElementChild;
        if (lastChild) {
          questionContainer.removeChild(lastChild);
        } else {
          break;
        }
      }
    }
  }

  function normaliseResponse(value) {
    return typeof value === "string"
      ? value.trim().replace(/\s+/g, " ").toLowerCase()
      : "";
  }

  function getIntroText(type) {
    switch (type) {
      case "Peer Feedback":
        return "Offer thoughtful feedback. Use the prompt to highlight impact and next steps.";
      case "Exit Ticket":
        return "Before you leave, capture one key takeaway and a question you still have.";
      default:
        return "Respond to each prompt below. Check your answers to reveal tailored feedback.";
    }
  }

  function buildActivityData() {
    const type = (typeSelect?.value ?? "Short Response").trim() || "Short Response";
    const title = (titleInput?.value ?? "").trim() || `${type} Activity`;
    const questions = [];

    questionContainer?.querySelectorAll(".builder-question").forEach((questionEl, index) => {
      const promptField = questionEl.querySelector('[data-role="prompt"]');
      const answerField = questionEl.querySelector('[data-role="answer"]');
      const feedbackField = questionEl.querySelector('[data-role="feedback"]');

      const prompt = promptField?.value?.trim() ?? "";
      const answer = answerField?.value?.trim() ?? "";
      const feedback = feedbackField?.value?.trim() ?? "";

      if (prompt && answer && feedback) {
        questions.push({
          order: index + 1,
          prompt,
          answer,
          feedback,
        });
      }
    });

    return {
      id: `activity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      type,
      intro: getIntroText(type),
      createdAt: new Date().toISOString(),
      questions,
    };
  }

  function createIcon(className) {
    const icon = document.createElement("i");
    icon.className = className;
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function buildActivitySlide(activity) {
    const slide = document.createElement("div");
    slide.className = "slide-stage hidden";
    slide.dataset.type = "activity";
    slide.dataset.activityId = activity.id;

    const inner = document.createElement("div");
    inner.className = "slide-inner";
    slide.appendChild(inner);

    const pill = document.createElement("span");
    pill.className = "pill";
    const pillIcon = createIcon("fa-solid fa-star");
    pill.appendChild(pillIcon);
    pill.appendChild(document.createTextNode(` ${activity.type}`));
    inner.appendChild(pill);

    const heading = document.createElement("h2");
    heading.textContent = activity.title || "Custom Activity";
    inner.appendChild(heading);

    const card = document.createElement("div");
    card.className = "card activity-module";
    card.dataset.moduleType = activity.type;
    inner.appendChild(card);

    const intro = document.createElement("p");
    intro.className = "activity-intro";
    intro.textContent = activity.intro;
    card.appendChild(intro);

    const questionGrid = document.createElement("div");
    questionGrid.className = "activity-question-grid";
    card.appendChild(questionGrid);

    activity.questions.forEach((question) => {
      const questionCard = document.createElement("div");
      questionCard.className = "activity-question-card";
      questionCard.dataset.answer = normaliseResponse(question.answer);
      questionCard.dataset.feedback = question.feedback;

      const questionHeading = document.createElement("h3");
      questionHeading.textContent = `Question ${question.order}`;
      questionCard.appendChild(questionHeading);

      const prompt = document.createElement("p");
      prompt.textContent = question.prompt;
      questionCard.appendChild(prompt);

      const label = document.createElement("label");
      const inputId = `${activity.id}-response-${question.order}`;
      label.setAttribute("for", inputId);
      label.textContent = "Your response";
      questionCard.appendChild(label);

      const input = document.createElement("input");
      input.type = "text";
      input.id = inputId;
      input.className = "activity-response";
      input.setAttribute("data-question", String(question.order));
      input.setAttribute("aria-describedby", `${activity.id}-feedback-${question.order}`);
      questionCard.appendChild(input);

      const feedback = document.createElement("div");
      feedback.className = "question-feedback";
      feedback.id = `${activity.id}-feedback-${question.order}`;
      feedback.setAttribute("aria-live", "polite");
      questionCard.appendChild(feedback);

      questionGrid.appendChild(questionCard);
    });

    const actions = document.createElement("div");
    actions.className = "activity-actions";

    const checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "activity-btn";
    checkBtn.dataset.action = "check";
    checkBtn.appendChild(createIcon("fa-solid fa-circle-check"));
    checkBtn.appendChild(document.createTextNode(" Check Answers"));
    actions.appendChild(checkBtn);

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "activity-btn secondary";
    resetBtn.dataset.action = "reset";
    resetBtn.appendChild(createIcon("fa-solid fa-rotate-left"));
    resetBtn.appendChild(document.createTextNode(" Reset"));
    actions.appendChild(resetBtn);

    card.appendChild(actions);

    const summary = document.createElement("div");
    summary.className = "activity-summary";
    summary.setAttribute("aria-live", "polite");
    card.appendChild(summary);

    return slide;
  }

  function attachActivityHandlers(slide) {
    const module = slide.querySelector(".activity-module");
    if (!module) return;

    const questionCards = module.querySelectorAll(".activity-question-card");
    const checkBtn = module.querySelector('[data-action="check"]');
    const resetBtn = module.querySelector('[data-action="reset"]');
    const summary = module.querySelector(".activity-summary");

    const handleCheck = () => {
      let correct = 0;
      let unanswered = 0;
      questionCards.forEach((card) => {
        const input = card.querySelector(".activity-response");
        const feedback = card.querySelector(".question-feedback");
        const expected = card.dataset.answer ?? "";
        const teacherFeedback = card.dataset.feedback ?? "";

        if (!(input instanceof HTMLInputElement) || !(feedback instanceof HTMLElement)) {
          return;
        }

        const response = normaliseResponse(input.value);
        feedback.classList.remove("success", "error");

        if (!response) {
          feedback.textContent = "Add a response before checking.";
          feedback.classList.add("error");
          unanswered += 1;
          return;
        }

        if (response === expected) {
          feedback.textContent = teacherFeedback || "Great job!";
          feedback.classList.add("success");
          correct += 1;
        } else {
          feedback.textContent = teacherFeedback
            ? `Try again. ${teacherFeedback}`
            : "Try again and look back at your notes.";
          feedback.classList.add("error");
        }
      });

      if (summary instanceof HTMLElement) {
        summary.classList.remove("success", "error");
        const total = questionCards.length;
        if (unanswered === 0 && correct === total) {
          summary.textContent = "Perfect! Every response matches the rubric.";
          summary.classList.add("success");
        } else if (unanswered > 0) {
          summary.textContent = "Answer each prompt before checking your work.";
          summary.classList.add("error");
        } else {
          summary.textContent = `You matched ${correct} of ${total} responses. Review the feedback and try again.`;
          summary.classList.add("error");
        }
      }
    };

    const handleReset = () => {
      questionCards.forEach((card) => {
        const input = card.querySelector(".activity-response");
        const feedback = card.querySelector(".question-feedback");
        if (input instanceof HTMLInputElement) {
          input.value = "";
        }
        if (feedback instanceof HTMLElement) {
          feedback.textContent = "";
          feedback.classList.remove("success", "error");
        }
      });
      if (summary instanceof HTMLElement) {
        summary.textContent = "";
        summary.classList.remove("success", "error");
      }
    };

    checkBtn?.addEventListener("click", handleCheck);
    resetBtn?.addEventListener("click", handleReset);
  }

  async function insertSlideIntoDeck(slide) {
    const stage = document.querySelector(".stage-viewport");
    if (!stage) {
      throw new Error("Stage viewport not found");
    }
    const slideNavButtons = stage.querySelectorAll(".slide-nav");
    const referenceNode = slideNavButtons.length
      ? slideNavButtons[0]
      : null;
    stage.insertBefore(slide, referenceNode);

    attachActivityHandlers(slide);

    if (typeof window.setupInteractiveDeck === "function") {
      const selectorsToReset = [
        "#add-slide-btn",
        "#save-state-btn",
        "#load-state-btn",
        "#highlight-btn",
        "#remove-highlight-btn",
        "#load-state-input",
        ".slide-nav-next",
        ".slide-nav-prev",
      ];

      selectorsToReset.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          const clone = element.cloneNode(true);
          element.parentElement?.replaceChild(clone, element);
        });
      });

      const originalAddEventListener = document.addEventListener.bind(document);
      document.addEventListener = function patchedAddEventListener(type, listener, options) {
        if (type === "keydown") {
          return;
        }
        return originalAddEventListener(type, listener, options);
      };

      try {
        await window.setupInteractiveDeck();
      } finally {
        document.addEventListener = originalAddEventListener;
      }

      const refreshedStage = document.querySelector(".stage-viewport");
      const slidesAfter = refreshedStage
        ? Array.from(refreshedStage.querySelectorAll(".slide-stage"))
        : [];
      const targetIndex = slidesAfter.length - 1;
      const nextBtn = refreshedStage?.querySelector(".slide-nav-next");
      if (nextBtn instanceof HTMLElement) {
        for (let i = 0; i < targetIndex; i += 1) {
          nextBtn.click();
        }
      }
    }
  }

  function resetForm() {
    form?.reset();
    if (countInput) {
      countInput.value = String(DEFAULT_QUESTION_COUNT);
    }
    ensureQuestionFields(DEFAULT_QUESTION_COUNT);
    questionContainer?.querySelectorAll("textarea, input").forEach((field) => {
      field.value = "";
    });
    if (jsonOutput) {
      jsonOutput.value = "";
    }
    setStatus("Form cleared. Ready for a fresh activity.", "success");
  }

  ensureQuestionFields(DEFAULT_QUESTION_COUNT);

  openBtn.addEventListener("click", () => {
    setStatus("", "");
    openBuilder();
  });

  closeBtn?.addEventListener("click", () => {
    closeBuilder();
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeBuilder();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("is-visible")) {
      closeBuilder();
    }
  });

  countInput?.addEventListener("change", (event) => {
    const target = event.target;
    ensureQuestionFields(target?.value ?? DEFAULT_QUESTION_COUNT);
  });

  clearBtn?.addEventListener("click", () => {
    resetForm();
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) {
      setStatus("Please complete every required field before generating the activity.", "error");
      return;
    }

    const activity = buildActivityData();
    if (!activity.questions.length) {
      setStatus("Add at least one complete question, answer, and feedback entry.", "error");
      return;
    }

    try {
      const slide = buildActivitySlide(activity);
      await insertSlideIntoDeck(slide);
      if (jsonOutput) {
        jsonOutput.value = JSON.stringify(activity, null, 2);
      }
      setStatus("Activity created! Navigate through the deck to see the new slide.", "success");
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong while generating the activity.", "error");
    }
  });
}
