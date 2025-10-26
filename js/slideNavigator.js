export function initSlideNavigator({
  stageViewport,
  onSelectSlide,
} = {}) {
  if (!(stageViewport instanceof HTMLElement)) {
    return null;
  }

  const footer = document.createElement("div");
  footer.className = "slide-jump-footer";

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

  const panelId = `slide-jump-panel-${Math.random().toString(36).slice(2)}`;
  const titleId = `${panelId}-title`;
  const title = document.createElement("h2");
  title.id = titleId;
  title.className = "sr-only";
  title.textContent = "Jump to a slide";

  const list = document.createElement("ul");
  list.className = "slide-jump-list";

  panel.id = panelId;
  panel.setAttribute("aria-labelledby", titleId);
  trigger.setAttribute("aria-controls", panelId);

  panel.appendChild(title);
  panel.appendChild(list);
  footer.appendChild(panel);
  footer.appendChild(trigger);

  if (!list) {
    return null;
  }

  let slidesMeta = [];
  let activeIndex = 0;
  let isOpen = false;

  function applyActiveState() {
    const items = list.querySelectorAll(".slide-jump-item");
    items.forEach((item, index) => {
      const isActive = index === activeIndex;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function renderSlides() {
    list.innerHTML = "";
    slidesMeta.forEach(({ stage, title }, index) => {
      const item = document.createElement("li");
      item.className = "slide-jump-entry";
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
        activeItem.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
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

  stageViewport.appendChild(footer);

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
