export function initSlideNavigator({
  stageViewport,
  onSelectSlide,
  onDuplicateSlide,
} = {}) {
  if (!(stageViewport instanceof HTMLElement)) {
    return null;
  }

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "slide-jump-trigger";
  trigger.innerHTML = `
    <i class="fa-solid fa-table-list" aria-hidden="true"></i>
    <span class="sr-only">Open slide navigator</span>
  `;
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");

  const panel = document.createElement("div");
  panel.className = "slide-jump-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-hidden", "true");
  panel.setAttribute("tabindex", "-1");

  const panelId = `slide-jump-panel-${Math.random().toString(16).slice(2, 8)}`;
  panel.id = panelId;
  trigger.setAttribute("aria-controls", panelId);

  const titleId = "slide-jump-title";
  panel.innerHTML = `
    <div class="slide-jump-header">
      <h2 id="${titleId}">Jump to a slide</h2>
      <button type="button" class="slide-jump-close" aria-label="Close slide navigator">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </div>
    <div class="slide-jump-body">
      <div class="slide-jump-search-group">
        <label class="sr-only" for="${titleId}-search">Search slides</label>
        <input
          type="search"
          id="${titleId}-search"
          class="slide-jump-search"
          placeholder="Search by stage or title"
        />
      </div>
      <p class="slide-jump-status sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
      <ul class="slide-jump-list"></ul>
    </div>
  `;
  panel.setAttribute("aria-labelledby", titleId);

  const list = panel.querySelector(".slide-jump-list");
  const closeBtn = panel.querySelector(".slide-jump-close");
  const searchInput = panel.querySelector(".slide-jump-search");
  const statusRegion = panel.querySelector(".slide-jump-status");
  const externalStatus = document.getElementById("deck-status");

  if (!list || !closeBtn || !searchInput || !statusRegion) {
    return null;
  }

  let slidesMeta = [];
  let filteredSlides = [];
  let activeIndex = 0;
  let isOpen = false;
  let searchTerm = "";

  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  const announceTargets = [statusRegion, externalStatus].filter(Boolean);

  function announce(message = "") {
    announceTargets.forEach((target) => {
      target.textContent = message;
    });
  }

  function getFocusableElements() {
    return Array.from(panel.querySelectorAll(focusableSelectors)).filter((element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }
      if (element.hasAttribute("disabled")) {
        return false;
      }
      return element.offsetParent !== null || element === document.activeElement;
    });
  }

  function applyFilter() {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      filteredSlides = slidesMeta.slice();
      return;
    }
    filteredSlides = slidesMeta.filter(({ stage, title }) => {
      const stageText = String(stage ?? "").toLowerCase();
      const titleText = String(title ?? "").toLowerCase();
      return stageText.includes(term) || titleText.includes(term);
    });
  }

  function announceSearchResults() {
    const total = filteredSlides.length;
    const term = searchTerm.trim();
    let message = "";
    if (total === 0) {
      message = term
        ? `No slides match “${term}”.`
        : "No slides are currently available.";
    } else {
      const plural = total === 1 ? "slide" : "slides";
      message = term
        ? `Showing ${total} ${plural} for “${term}”.`
        : `Showing all ${total} ${plural}.`;
    }
    announce(message);
  }

  function focusItemByOffset(currentIndex, offset) {
    const items = Array.from(list.querySelectorAll(".slide-jump-item"));
    if (!items.length) {
      return;
    }
    const boundedIndex = ((currentIndex + offset) % items.length + items.length) % items.length;
    const target = items[boundedIndex];
    if (target instanceof HTMLElement) {
      target.focus({ preventScroll: true });
    }
  }

  function focusItemAt(index) {
    const items = Array.from(list.querySelectorAll(".slide-jump-item"));
    if (!items.length) {
      return;
    }
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    const target = items[clamped];
    if (target instanceof HTMLElement) {
      target.focus({ preventScroll: true });
    }
  }

  function applyActiveState() {
    const items = list.querySelectorAll(".slide-jump-item");
    items.forEach((item) => {
      const itemIndex = Number(item.dataset.index);
      const isActiveItem = itemIndex === activeIndex;
      item.classList.toggle("is-active", isActiveItem);
      item.setAttribute("aria-current", isActiveItem ? "true" : "false");
    });
  }

  function renderSlides() {
    list.innerHTML = "";
    if (!filteredSlides.length) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "slide-jump-empty";
      emptyItem.textContent = "No slides match your search.";
      list.appendChild(emptyItem);
      return;
    }

    const hasDuplicateAction = typeof onDuplicateSlide === "function";

    filteredSlides.forEach(({ stage, title, originalIndex }) => {
      const item = document.createElement("li");
      if (hasDuplicateAction) {
        item.className = "slide-jump-row";
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "slide-jump-item";
      button.dataset.index = String(originalIndex);
      button.innerHTML = `
        <span class="slide-jump-stage">${stage}</span>
        <span class="slide-jump-title">${title}</span>
      `;
      button.addEventListener("click", () => {
        if (typeof onSelectSlide === "function") {
          onSelectSlide(originalIndex);
        }
        closePanel();
      });
      item.appendChild(button);

      if (hasDuplicateAction) {
        const actions = document.createElement("div");
        actions.className = "slide-jump-actions";

        const duplicateBtn = document.createElement("button");
        duplicateBtn.type = "button";
        duplicateBtn.className = "slide-jump-action";
        duplicateBtn.innerHTML = `
          <i class="fa-solid fa-clone" aria-hidden="true"></i>
          <span>Duplicate</span>
        `;
        duplicateBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (typeof onDuplicateSlide !== "function") {
            return;
          }
          try {
            const result = onDuplicateSlide(originalIndex);
            if (result && typeof result.then === "function") {
              result
                .then((value) => {
                  if (typeof value === "number") {
                    closePanel();
                  }
                })
                .catch((error) => {
                  console.warn("Slide duplication failed", error);
                });
            } else if (typeof result === "number") {
              closePanel();
            }
          } catch (error) {
            console.warn("Slide duplication threw an error", error);
          }
        });

        actions.appendChild(duplicateBtn);
        item.appendChild(actions);
      }

      list.appendChild(item);
    });
    applyActiveState();
  }

  function handlePanelKeydown(event) {
    if (event.key === "Tab") {
      const focusable = getFocusableElements();
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey) {
        if (current === first || !panel.contains(current)) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (current === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
      return;
    }

    const items = Array.from(list.querySelectorAll(".slide-jump-item"));
    if (!items.length) {
      return;
    }

    const currentIndex = items.indexOf(document.activeElement);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusItemByOffset(currentIndex >= 0 ? currentIndex : 0, 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusItemByOffset(currentIndex >= 0 ? currentIndex : 0, -1);
        break;
      case "Home":
        event.preventDefault();
        focusItemAt(0);
        break;
      case "End":
        event.preventDefault();
        focusItemAt(items.length - 1);
        break;
      default:
        break;
    }
  }

  function openPanel() {
    if (isOpen) return;
    isOpen = true;
    panel.classList.add("is-visible");
    panel.setAttribute("aria-hidden", "false");
    panel.setAttribute("aria-modal", "true");
    trigger.setAttribute("aria-expanded", "true");

    const handleOutsideClick = (event) => {
      if (!panel.contains(event.target) && event.target !== trigger) {
        closePanel();
      }
    };

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        closePanel();
      }
    };

    panel.__deckOutsideListener = handleOutsideClick;
    panel.__deckKeyListener = handleKeydown;

    window.addEventListener("pointerdown", handleOutsideClick);
    window.addEventListener("keydown", handleKeydown);

    announceSearchResults();
    announce("Slide navigator opened." + (statusRegion.textContent ? ` ${statusRegion.textContent}` : ""));

    requestAnimationFrame(() => {
      const activeItem = list.querySelector(".slide-jump-item.is-active");
      if (activeItem instanceof HTMLElement) {
        activeItem.focus({ preventScroll: true });
        activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else {
        const firstItem = list.querySelector(".slide-jump-item");
        firstItem?.focus({ preventScroll: true });
      }
    });
  }

  function closePanel() {
    if (!isOpen) return;
    announce("Slide navigator closed.");
    isOpen = false;
    panel.classList.remove("is-visible");
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("aria-modal", "false");
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus({ preventScroll: true });

    if (panel.__deckOutsideListener) {
      window.removeEventListener("pointerdown", panel.__deckOutsideListener);
      delete panel.__deckOutsideListener;
    }
    if (panel.__deckKeyListener) {
      window.removeEventListener("keydown", panel.__deckKeyListener);
      delete panel.__deckKeyListener;
    }
  }

  searchInput.addEventListener("input", (event) => {
    searchTerm = typeof event.target?.value === "string" ? event.target.value : "";
    applyFilter();
    renderSlides();
    announceSearchResults();
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      const firstItem = list.querySelector(".slide-jump-item");
      if (firstItem instanceof HTMLElement) {
        event.preventDefault();
        firstItem.focus({ preventScroll: true });
      }
    }
    if (event.key === "ArrowUp") {
      const items = list.querySelectorAll(".slide-jump-item");
      const lastItem = items[items.length - 1];
      if (lastItem instanceof HTMLElement) {
        event.preventDefault();
        lastItem.focus({ preventScroll: true });
      }
    }
  });

  trigger.addEventListener("click", () => {
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" && !isOpen) {
      event.preventDefault();
      openPanel();
    }
  });

  panel.addEventListener("keydown", handlePanelKeydown);

  closeBtn.addEventListener("click", () => {
    closePanel();
  });

  stageViewport.appendChild(trigger);
  stageViewport.appendChild(panel);

  return {
    updateSlides(meta = []) {
      slidesMeta = Array.isArray(meta)
        ? meta.map((item, index) => ({
            stage: typeof item?.stage === "string" ? item.stage : String(item?.stage ?? ""),
            title: typeof item?.title === "string" ? item.title : String(item?.title ?? ""),
            originalIndex: index,
          }))
        : [];
      applyFilter();
      renderSlides();
      if (isOpen) {
        announceSearchResults();
      }
    },
    setActive(index = 0) {
      activeIndex = typeof index === "number" ? index : 0;
      applyActiveState();
    },
    destroy() {
      closePanel();
      trigger.remove();
      panel.remove();
    },
  };
}
