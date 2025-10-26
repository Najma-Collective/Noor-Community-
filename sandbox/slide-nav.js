export function initSlideNavigator({
  stageViewport,
  onSelectSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onMoveSlidesToSection,
} = {}) {
  if (!(stageViewport instanceof HTMLElement)) {
    return null;
  }

  const tray = document.createElement("div");
  tray.className = "slide-nav-tray";
  tray.dataset.state = "collapsed";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "slide-nav-toggle";
  toggle.innerHTML = `
    <span class="slide-nav-toggle-icon" aria-hidden="true">
      <i class="fa-solid fa-table-list"></i>
    </span>
    <span class="sr-only">Toggle slide navigator</span>
  `;
  toggle.setAttribute("aria-expanded", "false");

  const panelId = `slide-nav-list-${Math.random().toString(16).slice(2, 8)}`;
  toggle.setAttribute("aria-controls", panelId);

  const shelf = document.createElement("div");
  shelf.className = "slide-nav-shelf";

  const statusRegion = document.createElement("p");
  statusRegion.className = "sr-only slide-nav-status";
  statusRegion.setAttribute("role", "status");
  statusRegion.setAttribute("aria-live", "polite");
  statusRegion.setAttribute("aria-atomic", "true");

  const list = document.createElement("ul");
  list.className = "slide-nav-list";
  list.id = panelId;
  list.setAttribute("role", "list");

  shelf.appendChild(list);
  shelf.appendChild(statusRegion);

  tray.appendChild(toggle);
  tray.appendChild(shelf);

  stageViewport.appendChild(tray);

  const focusableSelectors = [
    "button:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  const announceTargets = [statusRegion, document.getElementById("deck-status")].filter(
    Boolean,
  );

  let slidesMeta = [];
  let availableSections = [];
  let activeIndex = 0;
  let isOpen = false;

  const enforceFocus = (event) => {
    if (!isOpen) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (tray.contains(target)) {
      return;
    }
    const focusables = getFocusableElements();
    const fallback = focusables[0] ?? toggle;
    fallback?.focus({ preventScroll: true });
  };

  tray.__slideNavFocusHandler = enforceFocus;

  function announce(message = "") {
    announceTargets.forEach((target) => {
      target.textContent = message;
    });
  }

  function getFocusableElements() {
    return Array.from(tray.querySelectorAll(focusableSelectors)).filter(
      (element) =>
        element instanceof HTMLElement &&
        !element.hasAttribute("disabled") &&
        (element.offsetParent !== null || element === document.activeElement),
    );
  }

  function normaliseThumbnailDescriptor(descriptor) {
    if (!descriptor) {
      return null;
    }

    if (descriptor instanceof HTMLElement) {
      return { type: "node", value: descriptor };
    }

    if (typeof descriptor === "string") {
      const trimmed = descriptor.trim();
      if (!trimmed) {
        return null;
      }
      if (trimmed.startsWith("<")) {
        return { type: "html", value: trimmed };
      }
      return { type: "url", value: trimmed };
    }

    if (typeof descriptor === "object") {
      const { html, url, node } = descriptor;
      if (typeof html === "string" && html.trim()) {
        return { type: "html", value: html.trim() };
      }
      if (node instanceof HTMLElement) {
        return { type: "node", value: node };
      }
      if (typeof url === "string" && url.trim()) {
        return { type: "url", value: url.trim() };
      }
    }

    return null;
  }

  function createThumbnailElement(thumbnail) {
    if (!thumbnail) {
      return null;
    }
    const container = document.createElement("div");
    container.className = "slide-nav-thumbnail";
    switch (thumbnail.type) {
      case "html":
        container.innerHTML = thumbnail.value;
        break;
      case "url": {
        const img = document.createElement("img");
        img.src = thumbnail.value;
        img.alt = "";
        img.loading = "lazy";
        container.appendChild(img);
        break;
      }
      case "node":
        container.appendChild(thumbnail.value.cloneNode(true));
        break;
      default:
        return null;
    }
    return container.childElementCount || container.textContent ? container : null;
  }

  function describeSlide(meta) {
    const titleText = String(meta?.title ?? "").trim();
    const stageText = String(meta?.stage ?? "").trim();
    if (stageText && titleText) {
      return `${stageText} – ${titleText}`;
    }
    return titleText || stageText || `Slide ${Number(meta?.originalIndex ?? 0) + 1}`;
  }

  function handleSelectSlide(index) {
    if (typeof onSelectSlide !== "function") {
      return;
    }
    try {
      onSelectSlide(index);
    } catch (error) {
      console.warn("Slide selection callback failed", error);
    }
  }

  async function handleDuplicateSlide(index, meta) {
    if (typeof onDuplicateSlide !== "function") {
      return;
    }
    try {
      const result = onDuplicateSlide(index);
      await Promise.resolve(result);
      announce(`Duplicated ${describeSlide(meta)}.`);
    } catch (error) {
      console.warn("Slide duplicate callback failed", error);
    }
  }

  async function handleDeleteSlide(index, meta) {
    if (typeof onDeleteSlide !== "function") {
      return;
    }
    try {
      const result = onDeleteSlide(index);
      await Promise.resolve(result);
      announce(`Deleted ${describeSlide(meta)}.`);
    } catch (error) {
      console.warn("Slide delete callback failed", error);
    }
  }

  async function handleMoveSlide(fromIndex, toIndex, meta, direction) {
    if (typeof onMoveSlide !== "function") {
      return;
    }
    try {
      const result = onMoveSlide(fromIndex, toIndex);
      const resolved = await Promise.resolve(result);
      if (resolved !== false) {
        const directionText = direction === "forward" ? "after" : "before";
        const targetMeta = slidesMeta.find((item) => item.originalIndex === toIndex);
        const targetText = targetMeta ? describeSlide(targetMeta) : `slide ${toIndex + 1}`;
        announce(`Moved ${describeSlide(meta)} ${directionText} ${targetText}.`);
      }
    } catch (error) {
      console.warn("Slide move callback failed", error);
    }
  }

  async function handleMoveToSection(index, section, meta) {
    if (!section || typeof onMoveSlidesToSection !== "function") {
      return;
    }
    try {
      const result = onMoveSlidesToSection([index], section);
      const resolved = await Promise.resolve(result);
      if (resolved !== false) {
        announce(`Moved ${describeSlide(meta)} to ${section}.`);
      }
    } catch (error) {
      console.warn("Slide move-to-section callback failed", error);
    }
  }

  function applyActiveState() {
    const items = list.querySelectorAll(".slide-nav-card");
    items.forEach((item) => {
      if (!(item instanceof HTMLElement)) {
        return;
      }
      const itemIndex = Number(item.dataset.index);
      const isActive = itemIndex === activeIndex;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function scrollActiveIntoView({ smooth } = { smooth: true }) {
    const activeItem = list.querySelector(
      `.slide-nav-card[data-index="${activeIndex}"] .slide-nav-card-button`,
    );
    if (activeItem instanceof HTMLElement) {
      activeItem.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "nearest",
        inline: "center",
      });
    }
  }

  function buildSectionOptions(select) {
    if (!(select instanceof HTMLSelectElement)) {
      return;
    }
    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Move to section…";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    availableSections.forEach((label) => {
      const option = document.createElement("option");
      option.value = label;
      option.textContent = label;
      select.appendChild(option);
    });

    select.disabled = availableSections.length === 0;
  }

  function renderSlides() {
    list.innerHTML = "";

    if (!slidesMeta.length) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "slide-nav-empty";
      emptyItem.textContent = "No slides yet.";
      list.appendChild(emptyItem);
      return;
    }

    slidesMeta.forEach((meta, orderIndex) => {
      const { stage, title, originalIndex, thumbnail } = meta;

      const item = document.createElement("li");
      item.className = "slide-nav-card";
      item.dataset.index = String(originalIndex);

      const cardButton = document.createElement("button");
      cardButton.type = "button";
      cardButton.className = "slide-nav-card-button";
      cardButton.addEventListener("click", () => {
        handleSelectSlide(originalIndex);
        activeIndex = originalIndex;
        applyActiveState();
      });

      const thumb = createThumbnailElement(thumbnail);
      if (thumb) {
        cardButton.appendChild(thumb);
      }

      const metaWrap = document.createElement("div");
      metaWrap.className = "slide-nav-meta";

      const stageEl = document.createElement("span");
      stageEl.className = "slide-nav-stage";
      stageEl.textContent = stage;

      const titleEl = document.createElement("span");
      titleEl.className = "slide-nav-title";
      titleEl.textContent = title;

      metaWrap.appendChild(stageEl);
      metaWrap.appendChild(titleEl);
      cardButton.appendChild(metaWrap);

      const actions = document.createElement("div");
      actions.className = "slide-nav-actions";

      if (typeof onMoveSlide === "function") {
        const moveBack = document.createElement("button");
        moveBack.type = "button";
        moveBack.className = "slide-nav-action-btn";
        moveBack.innerHTML = '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i><span class="sr-only">Move slide left</span>';
        moveBack.disabled = orderIndex === 0;
        moveBack.addEventListener("click", (event) => {
          event.stopPropagation();
          if (orderIndex === 0) {
            return;
          }
          const previous = slidesMeta[orderIndex - 1];
          if (previous) {
            handleMoveSlide(originalIndex, previous.originalIndex, meta, "back");
          }
        });
        actions.appendChild(moveBack);

        const moveForward = document.createElement("button");
        moveForward.type = "button";
        moveForward.className = "slide-nav-action-btn";
        moveForward.innerHTML = '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i><span class="sr-only">Move slide right</span>';
        moveForward.disabled = orderIndex === slidesMeta.length - 1;
        moveForward.addEventListener("click", (event) => {
          event.stopPropagation();
          if (orderIndex >= slidesMeta.length - 1) {
            return;
          }
          const next = slidesMeta[orderIndex + 1];
          if (next) {
            handleMoveSlide(originalIndex, next.originalIndex, meta, "forward");
          }
        });
        actions.appendChild(moveForward);
      }

      if (typeof onDuplicateSlide === "function") {
        const duplicateBtn = document.createElement("button");
        duplicateBtn.type = "button";
        duplicateBtn.className = "slide-nav-action-btn";
        duplicateBtn.innerHTML = '<i class="fa-solid fa-clone" aria-hidden="true"></i><span class="sr-only">Duplicate slide</span>';
        duplicateBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          handleDuplicateSlide(originalIndex, meta);
        });
        actions.appendChild(duplicateBtn);
      }

      if (typeof onDeleteSlide === "function") {
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "slide-nav-action-btn slide-nav-action-btn--danger";
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span class="sr-only">Delete slide</span>';
        deleteBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          handleDeleteSlide(originalIndex, meta);
        });
        actions.appendChild(deleteBtn);
      }

      if (typeof onMoveSlidesToSection === "function") {
        const sectionWrap = document.createElement("div");
        sectionWrap.className = "slide-nav-section";

        const sectionLabel = document.createElement("label");
        sectionLabel.className = "sr-only";
        sectionLabel.setAttribute("for", `${panelId}-section-${originalIndex}`);
        sectionLabel.textContent = `Move ${describeSlide(meta)} to section`;

        const sectionSelect = document.createElement("select");
        sectionSelect.className = "slide-nav-section-select";
        sectionSelect.id = `${panelId}-section-${originalIndex}`;
        buildSectionOptions(sectionSelect);
        sectionSelect.addEventListener("change", (event) => {
          event.stopPropagation();
          const value = event.target?.value ?? "";
          if (!value) {
            return;
          }
          handleMoveToSection(originalIndex, value, meta);
          buildSectionOptions(sectionSelect);
        });

        sectionWrap.appendChild(sectionLabel);
        sectionWrap.appendChild(sectionSelect);
        actions.appendChild(sectionWrap);
      }

      item.appendChild(cardButton);
      if (actions.childElementCount > 0) {
        item.appendChild(actions);
      }

      list.appendChild(item);
    });

    applyActiveState();
  }

  function refreshSections() {
    const seen = new Set();
    availableSections = [];
    slidesMeta.forEach(({ stage }) => {
      const label = String(stage ?? "").trim();
      if (!label || seen.has(label)) {
        return;
      }
      seen.add(label);
      availableSections.push(label);
    });
  }

  function openTray() {
    if (isOpen) {
      return;
    }
    isOpen = true;
    tray.dataset.state = "expanded";
    toggle.setAttribute("aria-expanded", "true");
    document.addEventListener("focusin", enforceFocus);
    announce("Slide navigator expanded.");
    requestAnimationFrame(() => {
      const activeButton = list.querySelector(
        ".slide-nav-card.is-active .slide-nav-card-button",
      );
      const fallback =
        (activeButton instanceof HTMLElement && activeButton) ||
        list.querySelector(".slide-nav-card-button");
      if (fallback instanceof HTMLElement) {
        fallback.focus({ preventScroll: true });
        fallback.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    });
  }

  function closeTray({ focusToggle = true } = {}) {
    if (!isOpen) {
      return;
    }
    isOpen = false;
    tray.dataset.state = "collapsed";
    toggle.setAttribute("aria-expanded", "false");
    document.removeEventListener("focusin", enforceFocus);
    announce("Slide navigator collapsed.");
    if (focusToggle) {
      toggle.focus({ preventScroll: true });
    }
  }

  function handleTrayKeydown(event) {
    if (!isOpen) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeTray();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }

    const focusables = getFocusableElements();
    if (!focusables.length) {
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (activeElement === first || !tray.contains(activeElement)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      }
    } else if (activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  const handleToggleClick = (event) => {
    if (isOpen) {
      const shouldRestoreFocus = event?.detail === 0;
      closeTray({ focusToggle: shouldRestoreFocus });
    } else {
      openTray();
    }
  };

  const handleToggleKeydown = (event) => {
    if (event.key === "ArrowUp" && !isOpen) {
      event.preventDefault();
      openTray();
    }
  };

  toggle.addEventListener("click", handleToggleClick);
  toggle.addEventListener("keydown", handleToggleKeydown);

  tray.addEventListener("keydown", handleTrayKeydown);

  return {
    updateSlides(meta = []) {
      slidesMeta = Array.isArray(meta)
        ? meta.map((item, index) => ({
            stage: typeof item?.stage === "string" ? item.stage : String(item?.stage ?? ""),
            title: typeof item?.title === "string" ? item.title : String(item?.title ?? ""),
            originalIndex:
              typeof item?.originalIndex === "number" && Number.isFinite(item.originalIndex)
                ? item.originalIndex
                : index,
            thumbnail: normaliseThumbnailDescriptor(
              item?.thumbnail ?? item?.thumbnailHtml ?? item?.thumbnailUrl,
            ),
          }))
        : [];
      refreshSections();
      renderSlides();
      if (isOpen) {
        scrollActiveIntoView({ smooth: false });
      }
    },
    setActive(index = 0) {
      activeIndex = typeof index === "number" ? index : 0;
      applyActiveState();
      if (isOpen) {
        scrollActiveIntoView();
      }
    },
    destroy() {
      closeTray({ focusToggle: false });
      document.removeEventListener("focusin", enforceFocus);
      tray.removeEventListener("keydown", handleTrayKeydown);
      toggle.removeEventListener("click", handleToggleClick);
      toggle.removeEventListener("keydown", handleToggleKeydown);
      delete tray.__slideNavFocusHandler;
      tray.remove();
    },
  };
}
