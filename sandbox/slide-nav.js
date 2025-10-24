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

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "stage-utility-btn slide-jump-trigger";
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
  const sectionSelectId = `${titleId}-move-section`;
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
      <div class="slide-jump-toolbar" data-role="selection-toolbar">
        <label class="slide-jump-select-all">
          <input type="checkbox" class="slide-jump-select-all-input" />
          <span>Select all</span>
        </label>
        <span class="slide-jump-toolbar-count" aria-live="polite">No slides selected</span>
        <div class="slide-jump-toolbar-actions">
          <button type="button" class="slide-jump-toolbar-btn" data-action="duplicate">
            <i class="fa-solid fa-clone" aria-hidden="true"></i>
            <span>Duplicate</span>
          </button>
          <button type="button" class="slide-jump-toolbar-btn slide-jump-toolbar-btn--danger" data-action="delete">
            <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
            <span>Delete</span>
          </button>
          <div class="slide-jump-move-group">
            <label class="sr-only" for="${sectionSelectId}">Choose a section</label>
            <select id="${sectionSelectId}" class="slide-jump-section-select">
              <option value="" disabled selected>Choose section</option>
            </select>
            <button type="button" class="slide-jump-toolbar-btn" data-action="move-section">
              <i class="fa-solid fa-arrow-turn-down" aria-hidden="true"></i>
              <span>Move to section</span>
            </button>
          </div>
        </div>
      </div>
      <ul class="slide-jump-list"></ul>
    </div>
  `;
  panel.setAttribute("aria-labelledby", titleId);

  const list = panel.querySelector(".slide-jump-list");
  const closeBtn = panel.querySelector(".slide-jump-close");
  const searchInput = panel.querySelector(".slide-jump-search");
  const statusRegion = panel.querySelector(".slide-jump-status");
  const toolbar = panel.querySelector(".slide-jump-toolbar");
  const selectAllInput = panel.querySelector(".slide-jump-select-all-input");
  const selectionCountEl = panel.querySelector(".slide-jump-toolbar-count");
  const duplicateBtn = panel.querySelector('[data-action="duplicate"]');
  const deleteBtn = panel.querySelector('[data-action="delete"]');
  const moveSectionBtn = panel.querySelector('[data-action="move-section"]');
  const sectionSelect = panel.querySelector(".slide-jump-section-select");
  const externalStatus = document.getElementById("deck-status");

  if (
    !list ||
    !closeBtn ||
    !searchInput ||
    !statusRegion ||
    !toolbar ||
    !selectAllInput ||
    !selectionCountEl ||
    !duplicateBtn ||
    !deleteBtn ||
    !moveSectionBtn ||
    !sectionSelect
  ) {
    return null;
  }

  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  const RENDER_CHUNK_SIZE = 36;
  const SEARCH_THROTTLE_MS = 160;

  const announceTargets = [statusRegion, externalStatus].filter(Boolean);

  let slidesMeta = [];
  let filteredSlides = [];
  let availableSections = [];
  let activeIndex = 0;
  let isOpen = false;
  let searchTerm = "";
  let renderOffset = 0;
  let sentinel = null;
  let chunkObserver = null;
  let searchTimeout = 0;

  const selectedIndices = new Set();

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

  function cleanupVirtualObserver() {
    if (chunkObserver && sentinel) {
      chunkObserver.unobserve(sentinel);
    }
    chunkObserver = null;
  }

  function destroySentinel() {
    if (sentinel) {
      sentinel.remove();
      sentinel = null;
    }
  }

  function handleSelectionAnnouncement(total) {
    if (total === 0) {
      announce("No slides selected.");
      return;
    }
    const plural = total === 1 ? "slide" : "slides";
    announce(`${total} ${plural} selected.`);
  }

  function updateToolbarAvailability() {
    const totalSelected = selectedIndices.size;
    const hasSelection = totalSelected > 0;
    const hasDuplicateAction = typeof onDuplicateSlide === "function";
    const hasDeleteAction = typeof onDeleteSlide === "function";
    const hasMoveToSection = typeof onMoveSlidesToSection === "function";
    duplicateBtn.disabled = !hasSelection || !hasDuplicateAction;
    deleteBtn.disabled = !hasSelection || !hasDeleteAction;

    const hasSectionTarget = Boolean(sectionSelect.value);
    moveSectionBtn.disabled = !hasSelection || !hasMoveToSection || !hasSectionTarget;

    const filteredIndices = filteredSlides.map((slide) => slide.originalIndex);
    const selectedInFiltered = filteredIndices.filter((index) => selectedIndices.has(index));
    if (filteredIndices.length === 0) {
      selectAllInput.checked = false;
      selectAllInput.indeterminate = false;
      selectAllInput.disabled = true;
    } else {
      selectAllInput.disabled = false;
      selectAllInput.checked = selectedInFiltered.length === filteredIndices.length && filteredIndices.length > 0;
      selectAllInput.indeterminate =
        selectedInFiltered.length > 0 && selectedInFiltered.length < filteredIndices.length;
    }

    let summary = "No slides selected";
    if (totalSelected > 0) {
      const plural = totalSelected === 1 ? "slide" : "slides";
      summary = `${totalSelected} ${plural} selected`;
    }
    selectionCountEl.textContent = summary;
  }

  function clearSelection({ announceChange = true } = {}) {
    if (!selectedIndices.size) {
      return;
    }
    selectedIndices.clear();
    if (announceChange) {
      handleSelectionAnnouncement(0);
    }
    updateToolbarAvailability();
    list.querySelectorAll('.slide-jump-select').forEach((checkbox) => {
      if (checkbox instanceof HTMLInputElement) {
        checkbox.checked = false;
      }
    });
  }

  function toggleSelection(index, shouldSelect) {
    if (!Number.isInteger(index)) {
      return;
    }
    if (shouldSelect) {
      selectedIndices.add(index);
    } else {
      selectedIndices.delete(index);
    }
    handleSelectionAnnouncement(selectedIndices.size);
    updateToolbarAvailability();
  }

  function getSelectedIndicesSorted() {
    return Array.from(selectedIndices).filter((index) => Number.isInteger(index)).sort((a, b) => a - b);
  }

  function createThumbnailElement(thumbnail) {
    if (!thumbnail) {
      return null;
    }
    const container = document.createElement("div");
    container.className = "slide-jump-thumbnail";
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
      case "node": {
        container.appendChild(thumbnail.value.cloneNode(true));
        break;
      }
      default:
        return null;
    }
    return container.childElementCount || container.textContent ? container : null;
  }

  function createSlideRow(meta, filteredIndex) {
    const { stage, title, originalIndex, thumbnail } = meta;
    const item = document.createElement("li");
    item.className = "slide-jump-row";
    item.dataset.filteredIndex = String(filteredIndex);

    const selectWrap = document.createElement("label");
    selectWrap.className = "slide-jump-select-wrap";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "slide-jump-select";
    checkbox.dataset.index = String(originalIndex);
    checkbox.checked = selectedIndices.has(originalIndex);
    checkbox.addEventListener("change", (event) => {
      event.stopPropagation();
      const isChecked = Boolean(event.target?.checked);
      toggleSelection(originalIndex, isChecked);
    });

    const fauxBox = document.createElement("span");
    fauxBox.className = "slide-jump-select-box";

    const srLabel = document.createElement("span");
    srLabel.className = "sr-only";
    const titleText = String(title ?? "");
    const stageText = String(stage ?? "");
    srLabel.textContent = stageText && titleText
      ? `Select slide ${stageText} – ${titleText}`
      : `Select slide ${titleText || stageText || originalIndex + 1}`;

    selectWrap.appendChild(checkbox);
    selectWrap.appendChild(fauxBox);
    selectWrap.appendChild(srLabel);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "slide-jump-item";
    button.dataset.index = String(originalIndex);

    const content = document.createElement("div");
    content.className = "slide-jump-content";

    const thumbnailEl = createThumbnailElement(thumbnail);
    if (thumbnailEl) {
      content.appendChild(thumbnailEl);
    }

    const metaWrap = document.createElement("div");
    metaWrap.className = "slide-jump-meta";

    const stageEl = document.createElement("span");
    stageEl.className = "slide-jump-stage";
    stageEl.textContent = stage;

    const titleEl = document.createElement("span");
    titleEl.className = "slide-jump-title";
    titleEl.textContent = title;

    metaWrap.appendChild(stageEl);
    metaWrap.appendChild(titleEl);
    content.appendChild(metaWrap);

    button.appendChild(content);
    button.addEventListener("click", () => {
      if (typeof onSelectSlide === "function") {
        onSelectSlide(originalIndex);
      }
      closePanel();
    });

    item.appendChild(selectWrap);
    item.appendChild(button);

    return item;
  }

  function appendChunk() {
    if (!filteredSlides.length || renderOffset >= filteredSlides.length) {
      return;
    }
    const end = Math.min(renderOffset + RENDER_CHUNK_SIZE, filteredSlides.length);
    for (let i = renderOffset; i < end; i += 1) {
      const row = createSlideRow(filteredSlides[i], i);
      if (sentinel) {
        list.insertBefore(row, sentinel);
      } else {
        list.appendChild(row);
      }
    }
    renderOffset = end;
    applyActiveState();

    if (renderOffset >= filteredSlides.length) {
      cleanupVirtualObserver();
      destroySentinel();
    }
  }

  function ensureActiveRendered() {
    const filteredIndex = filteredSlides.findIndex((slide) => slide.originalIndex === activeIndex);
    if (filteredIndex === -1) {
      return;
    }
    while (filteredIndex >= renderOffset && renderOffset < filteredSlides.length) {
      appendChunk();
    }
    const activeItem = list.querySelector(`.slide-jump-item[data-index="${activeIndex}"]`);
    if (activeItem instanceof HTMLElement) {
      activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function renderSlides() {
    cleanupVirtualObserver();
    destroySentinel();
    list.innerHTML = "";
    renderOffset = 0;

    if (!filteredSlides.length) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "slide-jump-empty";
      emptyItem.textContent = "No slides match your search.";
      list.appendChild(emptyItem);
      updateToolbarAvailability();
      return;
    }

    sentinel = document.createElement("li");
    sentinel.className = "slide-jump-sentinel";
    list.appendChild(sentinel);

    appendChunk();

    if (renderOffset < filteredSlides.length) {
      chunkObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            appendChunk();
          }
        });
      }, {
        root: list,
        threshold: 0.25,
      });
      if (sentinel) {
        chunkObserver.observe(sentinel);
      }
    }

    updateToolbarAvailability();
  }

  function rebuildSectionOptions() {
    const previousValue = sectionSelect.value;
    sectionSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose section";
    placeholder.disabled = true;
    sectionSelect.appendChild(placeholder);

    const seen = new Set();
    availableSections = [];
    slidesMeta.forEach(({ stage }) => {
      const label = String(stage ?? "").trim();
      if (!label || seen.has(label)) {
        return;
      }
      seen.add(label);
      availableSections.push(label);
      const option = document.createElement("option");
      option.value = label;
      option.textContent = label;
      sectionSelect.appendChild(option);
    });

    if (availableSections.includes(previousValue)) {
      sectionSelect.value = previousValue;
    } else {
      sectionSelect.value = "";
    }

    sectionSelect.disabled =
      availableSections.length === 0 || typeof onMoveSlidesToSection !== "function";
    updateToolbarAvailability();
  }

  function syncSelectionWithSlides() {
    const availableIndices = new Set(slidesMeta.map((slide) => slide.originalIndex));
    Array.from(selectedIndices).forEach((index) => {
      if (!availableIndices.has(index)) {
        selectedIndices.delete(index);
      }
    });
  }

  async function runSequentialAction(indices, callback, { onSuccessMessage } = {}) {
    if (typeof callback !== "function") {
      return;
    }
    const uniqueIndices = Array.from(new Set(indices)).filter((index) => Number.isInteger(index));
    if (!uniqueIndices.length) {
      return;
    }

    let successCount = 0;
    for (const index of uniqueIndices) {
      try {
        const result = callback(index, { bulk: true, indices: uniqueIndices.slice() });
        const resolved = await Promise.resolve(result);
        if (resolved !== false) {
          successCount += 1;
        }
      } catch (error) {
        console.warn("Slide navigator bulk action failed", error);
      }
    }

    if (successCount && onSuccessMessage) {
      const plural = successCount === 1 ? "slide" : "slides";
      announce(onSuccessMessage.replace("{count}", `${successCount} ${plural}`));
    }
  }

  async function handleBulkDuplicate() {
    const indices = getSelectedIndicesSorted();
    if (!indices.length) {
      return;
    }
    await runSequentialAction(indices, onDuplicateSlide, {
      onSuccessMessage: "{count} duplicated.",
    });
    clearSelection({ announceChange: false });
    updateToolbarAvailability();
  }

  async function handleBulkDelete() {
    const indices = getSelectedIndicesSorted().sort((a, b) => b - a);
    if (!indices.length) {
      return;
    }
    await runSequentialAction(indices, onDeleteSlide, {
      onSuccessMessage: "{count} deleted.",
    });
    clearSelection({ announceChange: false });
    updateToolbarAvailability();
  }

  async function handleBulkMoveToSection() {
    const indices = getSelectedIndicesSorted();
    const targetSection = sectionSelect.value;
    if (!indices.length || !targetSection) {
      return;
    }
    if (typeof onMoveSlidesToSection !== "function") {
      announce("Move to section is not available in this deck.");
      return;
    }
    try {
      const result = onMoveSlidesToSection(indices, targetSection);
      await Promise.resolve(result);
      announce(`Moved ${indices.length === 1 ? "slide" : "slides"} to ${targetSection}.`);
      clearSelection({ announceChange: false });
      updateToolbarAvailability();
    } catch (error) {
      console.warn("Moving slides to section failed", error);
      announce("We couldn’t move those slides. Try again.");
    }
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

  function queueSearch(value) {
    const term = typeof value === "string" ? value : "";
    window.clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
      searchTerm = term;
      applyFilter();
      renderSlides();
      announceSearchResults();
    }, SEARCH_THROTTLE_MS);
  }

  searchInput.addEventListener("input", (event) => {
    queueSearch(event.target?.value ?? "");
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

  selectAllInput.addEventListener("change", (event) => {
    const isChecked = Boolean(event.target?.checked);
    if (isChecked) {
      filteredSlides.forEach(({ originalIndex }) => {
        selectedIndices.add(originalIndex);
      });
      handleSelectionAnnouncement(selectedIndices.size);
    } else {
      filteredSlides.forEach(({ originalIndex }) => {
        selectedIndices.delete(originalIndex);
      });
      handleSelectionAnnouncement(selectedIndices.size);
    }
    list.querySelectorAll('.slide-jump-select').forEach((checkbox) => {
      if (checkbox instanceof HTMLInputElement) {
        const index = Number(checkbox.dataset.index);
        checkbox.checked = selectedIndices.has(index);
      }
    });
    updateToolbarAvailability();
  });

  duplicateBtn.addEventListener("click", () => {
    handleBulkDuplicate();
  });

  deleteBtn.addEventListener("click", () => {
    handleBulkDelete();
  });

  moveSectionBtn.addEventListener("click", () => {
    handleBulkMoveToSection();
  });

  sectionSelect.addEventListener("change", () => {
    updateToolbarAvailability();
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

  const ensureUtilityCluster = () => {
    if (!(stageViewport instanceof HTMLElement)) {
      return null;
    }
    const existing = stageViewport.querySelector('[data-role="stage-utilities"]');
    if (existing instanceof HTMLElement) {
      return existing;
    }
    const cluster = document.createElement('div');
    cluster.className = 'stage-utility-cluster';
    cluster.dataset.role = 'stage-utilities';
    stageViewport.appendChild(cluster);
    return cluster;
  };

  const utilityCluster = ensureUtilityCluster();
  if (utilityCluster) {
    utilityCluster.appendChild(trigger);
  } else {
    stageViewport.appendChild(trigger);
  }

  stageViewport.appendChild(panel);

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
            thumbnail: normaliseThumbnailDescriptor(item?.thumbnail ?? item?.thumbnailHtml ?? item?.thumbnailUrl),
          }))
        : [];
      syncSelectionWithSlides();
      applyFilter();
      rebuildSectionOptions();
      renderSlides();
      if (isOpen) {
        announceSearchResults();
      }
    },
    setActive(index = 0) {
      activeIndex = typeof index === "number" ? index : 0;
      applyActiveState();
      ensureActiveRendered();
    },
    destroy() {
      window.clearTimeout(searchTimeout);
      cleanupVirtualObserver();
      destroySentinel();
      closePanel();
      trigger.remove();
      panel.remove();
    },
  };
}
