export function initSlideNavigator({
  stageViewport,
  onSelectSlide,
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

  const titleId = "slide-jump-title";
  panel.innerHTML = `
    <div class="slide-jump-header">
      <h2 id="${titleId}">Jump to a slide</h2>
      <button type="button" class="slide-jump-close" aria-label="Close slide navigator">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </div>
    <div class="slide-jump-body">
      <ul class="slide-jump-list"></ul>
    </div>
  `;
  panel.setAttribute("aria-labelledby", titleId);

  const list = panel.querySelector(".slide-jump-list");
  const closeBtn = panel.querySelector(".slide-jump-close");

  if (!list || !closeBtn) {
    return null;
  }

  let slidesMeta = [];
  let activeIndex = 0;
  let isOpen = false;

  function applyActiveState() {
    const items = list.querySelectorAll(".slide-jump-item");
    items.forEach((item, index) => {
      item.classList.toggle("is-active", index === activeIndex);
      item.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    });
  }

  function renderSlides() {
    list.innerHTML = "";
    slidesMeta.forEach(({ stage, title }, index) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "slide-jump-item";
      button.dataset.index = String(index);
      button.innerHTML = `
        <span class="slide-jump-stage">${stage}</span>
        <span class="slide-jump-title">${title}</span>
      `;
      button.addEventListener("click", () => {
        if (typeof onSelectSlide === "function") {
          onSelectSlide(index);
        }
        closePanel();
      });
      item.appendChild(button);
      list.appendChild(item);
    });
    applyActiveState();
  }

  function openPanel() {
    if (isOpen) return;
    isOpen = true;
    panel.classList.add("is-visible");
    panel.setAttribute("aria-hidden", "false");
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
    isOpen = false;
    panel.classList.remove("is-visible");
    panel.setAttribute("aria-hidden", "true");
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

  trigger.addEventListener("click", () => {
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  });

  closeBtn.addEventListener("click", () => {
    closePanel();
  });

  stageViewport.appendChild(trigger);
  stageViewport.appendChild(panel);

  return {
    updateSlides(meta = []) {
      slidesMeta = Array.isArray(meta) ? meta : [];
      renderSlides();
    },
    setActive(index = 0) {
      activeIndex = typeof index === "number" ? index : 0;
      applyActiveState();
    },
  };
}
