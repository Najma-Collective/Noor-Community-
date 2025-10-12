(() => {
  const globalPresentations = window.MOSAIC_PRESENTATIONS || {};
  const presentationIds = Object.keys(globalPresentations);
  const presentations = presentationIds.reduce((acc, id) => {
    acc[id] = globalPresentations[id];
    return acc;
  }, {});
  const defaultPresentationId = presentationIds[0] || null;

  const STORAGE_KEY = 'mosaic-state-v1';
  const COLOR_CHOICES = [
    { name: 'Sage', value: 'var(--secondary-sage)', textColor: 'var(--deep-forest)' },
    { name: 'Forest', value: 'rgba(90, 107, 82, 0.75)', textColor: 'var(--soft-white)' },
    { name: 'Cream', value: 'rgba(248, 246, 240, 0.9)', textColor: 'var(--deep-forest)' },
    { name: 'Moss', value: 'rgba(122, 132, 113, 0.75)', textColor: 'var(--soft-white)' },
    { name: 'Gold', value: 'rgba(216, 178, 110, 0.85)', textColor: '#3E2F1F' }
  ];

  const stageViewport = document.querySelector('.stage-viewport');
  const navPrev = stageViewport.querySelector('.slide-nav-prev');
  const navNext = stageViewport.querySelector('.slide-nav-next');
  const connectorLayer = document.querySelector('.annotation-connector-layer');
  const slideCounterEl = document.querySelector('.slide-counter');
  const annotationPanel = document.getElementById('annotation-panel');
  const annotationList = document.getElementById('annotation-list');
  const annotationEmpty = document.getElementById('annotation-empty');
  const annotationPopover = document.getElementById('annotation-popover');
  const annotationModalBackdrop = document.getElementById('annotation-modal-backdrop');
  const annotationText = document.getElementById('annotation-text');
  const annotationSaveBtn = document.getElementById('annotation-save');
  const colorPalette = document.getElementById('annotation-color-palette');
  const closeModalBtn = annotationModalBackdrop.querySelector('.close-modal');
  const presentationSelector = document.getElementById('presentation-selector');
  const exportButton = document.querySelector('.btn-export');
  const workspaceGrid = document.querySelector('.workspace-grid');

  let slides = [];
  let currentSlideIndex = 0;
  let currentPresentationId = null;
  let fieldValues = {};
  let annotations = [];
  let activeMark = null;
  let selectedColor = COLOR_CHOICES[0].value;
  let selectedTextColor = COLOR_CHOICES[0].textColor;
  let annotationDraft = null;

  const templateCache = {};

  function updateContentEditableState(element) {
    if (!element || !element.isContentEditable) {
      return;
    }
    const textValue = element.textContent ? element.textContent.replace(/\u200B/g, '').trim() : '';
    if (textValue) {
      element.dataset.state = 'filled';
    } else {
      delete element.dataset.state;
    }
  }

  function getPexelsService() {
    if (window.PexelsService && typeof window.PexelsService.fetchImage === 'function') {
      return window.PexelsService;
    }
    return null;
  }

  async function resolveSlideMedia(slide, presentation) {
    const resolvedContent = { ...slide.content };
    const service = getPexelsService();
    if (!service) {
      return { ...slide, content: resolvedContent };
    }

    const baseTitle = resolvedContent.title || presentation.deckTitle;

    try {
      if (resolvedContent.backgroundImageQuery) {
        const media = await service.fetchImage(resolvedContent.backgroundImageQuery, {
          orientation: 'landscape',
          size: 'large'
        });
        if (media && media.url) {
          resolvedContent.backgroundImage = media.url;
          resolvedContent.backgroundImageAlt = media.alt || `Background visual for ${baseTitle}`;
          resolvedContent.backgroundImageCredit = media.photographer || '';
        }
      }

      if (resolvedContent.imageQuery) {
        const media = await service.fetchImage(resolvedContent.imageQuery, {
          orientation: 'landscape',
          size: 'large'
        });
        if (media && media.url) {
          resolvedContent.image = media.url;
          resolvedContent.imageAlt = media.alt || `Supporting visual for ${baseTitle}`;
          resolvedContent.imageCredit = media.photographer || '';
        }
      }

      if (Array.isArray(resolvedContent.imageQueries) && resolvedContent.imageQueries.length) {
        const results = await service.fetchImages(resolvedContent.imageQueries, {
          orientation: 'landscape',
          size: 'large'
        });
        if (Array.isArray(results) && results.length === resolvedContent.imageQueries.length) {
          const urls = [];
          const alts = [];
          const credits = [];
          results.forEach((media, index) => {
            if (!media || !media.url) {
              return;
            }
            urls.push(media.url);
            alts.push(media.alt || `Visual ${index + 1} for ${baseTitle}`);
            credits.push(media.photographer || '');
          });
          if (urls.length) {
            resolvedContent.images = urls;
            resolvedContent.imageAltTexts = alts;
            resolvedContent.imageCredits = credits;
          }
        }
      }
    } catch (error) {
      console.warn('Unable to enrich slide media from Pexels', error);
    }

    return { ...slide, content: resolvedContent };
  }

  function monitorSlideOverflow(slideElement) {
    if (!slideElement || !window.OverflowMonitor) {
      return;
    }
    const candidates = slideElement.querySelectorAll(
      'h1, h2, h3, h4, p, li, .card, .table-layout, textarea, input, .annotation-card, .callout-box, .writing-pad'
    );
    window.OverflowMonitor.observe(candidates);
  }

  const defaultState = {
    activePresentation: defaultPresentationId,
    slides: {},
    fields: {},
    annotations: {}
  };

  Handlebars.registerHelper('join', (arr, separator) => (Array.isArray(arr) ? arr.join(separator) : ''));
  Handlebars.registerHelper('alphabet', index => String.fromCharCode(97 + Number(index)));

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...defaultState };
      }
      const parsed = JSON.parse(raw);
      return {
        ...defaultState,
        ...parsed,
        slides: { ...defaultState.slides, ...(parsed.slides || {}) },
        fields: { ...defaultState.fields, ...(parsed.fields || {}) },
        annotations: { ...defaultState.annotations, ...(parsed.annotations || {}) }
      };
    } catch (error) {
      console.warn('Failed to load saved state', error);
      return { ...defaultState };
    }
  }

  let state = loadState();

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Unable to persist state', error);
    }
  }

  function compileTemplate(layoutName) {
    if (templateCache[layoutName]) {
      return templateCache[layoutName];
    }
    const templateEl = document.getElementById(`${layoutName}-template`);
    if (!templateEl) {
      throw new Error(`Missing template for layout: ${layoutName}`);
    }
    const template = Handlebars.compile(templateEl.innerHTML.trim());
    templateCache[layoutName] = template;
    return template;
  }

  function clearSlides() {
    stageViewport.querySelectorAll('section.slide-stage').forEach(section => section.remove());
  }

  function createSlideSection(layout, context) {
    const template = compileTemplate(layout);
    const section = document.createElement('section');
    section.className = 'slide-stage hidden';
    section.dataset.layout = layout;
    section.dataset.slideIndex = context._slideIndex;
    section.innerHTML = template(context);
    return section;
  }

  async function renderPresentation(presentation, { preserveSlideIndex = false } = {}) {
    stageViewport.classList.add('is-loading');
    stageViewport.setAttribute('aria-busy', 'true');
    navPrev.disabled = true;
    navNext.disabled = true;

    try {
      const enhancedSlides = await Promise.all(
        presentation.slides.map(slide => resolveSlideMedia(slide, presentation))
      );

      clearSlides();
      slides = [];
      const navAnchor = stageViewport.querySelector('.slide-nav-prev');

      enhancedSlides.forEach((slide, index) => {
        const context = {
          ...slide.content,
          deckTitle: presentation.deckTitle,
          _slideIndex: index
        };
        const section = createSlideSection(slide.layout, context);
        if (navAnchor) {
          stageViewport.insertBefore(section, navAnchor);
        } else {
          stageViewport.appendChild(section);
        }
        slides.push(section);
      });

      attachFieldListeners();
      restoreFieldValues();
      restoreAnnotationsOnSlides();

      const savedIndex = preserveSlideIndex
        ? Math.min(state.slides[currentPresentationId] || 0, slides.length - 1)
        : 0;
      const initialIndex = savedIndex < 0 ? 0 : savedIndex;
      showSlide(initialIndex);

      if (window.OverflowMonitor) {
        window.OverflowMonitor.observe(stageViewport.querySelectorAll('.slide-stage'));
        window.OverflowMonitor.refresh();
      }
    } finally {
      stageViewport.classList.remove('is-loading');
      stageViewport.removeAttribute('aria-busy');
    }
  }

  function attachFieldListeners() {
    stageViewport.removeEventListener('input', handleFieldInput, true);
    stageViewport.removeEventListener('change', handleFieldChange, true);
    stageViewport.addEventListener('input', handleFieldInput, true);
    stageViewport.addEventListener('change', handleFieldChange, true);
  }

  function handleFieldInput(event) {
    const target = event.target;
    if (!target.dataset.fieldKey) {
      return;
    }
    if (target.type === 'radio' || target.type === 'checkbox') {
      return;
    }
    const key = target.dataset.fieldKey;
    let value;
    if (target.isContentEditable) {
      value = target.innerHTML;
    } else if (typeof target.value !== 'undefined') {
      value = target.value;
    }
    if (value === undefined) {
      return;
    }
    fieldValues[key] = value;
    state.fields[currentPresentationId] = { ...fieldValues };
    persistState();
    if (target.isContentEditable) {
      updateContentEditableState(target);
    }
    if (window.OverflowMonitor) {
      window.OverflowMonitor.check(target);
    }
  }

  function handleFieldChange(event) {
    const target = event.target;
    if (!target.dataset.fieldKey) {
      return;
    }
    const key = target.dataset.fieldKey;
    if (target.isContentEditable) {
      fieldValues[key] = target.innerHTML;
      state.fields[currentPresentationId] = { ...fieldValues };
      persistState();
      updateContentEditableState(target);
      if (window.OverflowMonitor) {
        window.OverflowMonitor.check(target);
      }
      return;
    }
    if (target.type === 'radio') {
      if (target.checked) {
        fieldValues[key] = target.value;
      }
    } else if (target.type === 'checkbox') {
      fieldValues[key] = target.checked;
    } else {
      fieldValues[key] = target.value;
    }
    state.fields[currentPresentationId] = { ...fieldValues };
    persistState();
    if (window.OverflowMonitor) {
      window.OverflowMonitor.check(target);
    }
  }

  function restoreFieldValues() {
    stageViewport.querySelectorAll('[data-field-key]').forEach(element => {
      const key = element.dataset.fieldKey;
      const storedValue = fieldValues[key];
      if (storedValue === undefined) {
        return;
      }
      if (element.type === 'radio') {
        element.checked = String(storedValue) === element.value;
      } else if (element.type === 'checkbox') {
        element.checked = Boolean(storedValue);
      } else if (element.isContentEditable) {
        element.innerHTML = storedValue || '';
        updateContentEditableState(element);
      } else {
        element.value = storedValue;
      }
    });
  }

  function showSlide(index) {
    if (!slides.length) {
      slideCounterEl.textContent = '0 / 0';
      return;
    }
    const clampedIndex = Math.max(0, Math.min(index, slides.length - 1));
    slides.forEach((slide, idx) => {
      if (idx === clampedIndex) {
        slide.classList.remove('hidden');
      } else {
        slide.classList.add('hidden');
      }
    });
    currentSlideIndex = clampedIndex;
    navPrev.disabled = clampedIndex === 0;
    navNext.disabled = clampedIndex === slides.length - 1;
    slideCounterEl.textContent = `${clampedIndex + 1} / ${slides.length}`;
    state.slides[currentPresentationId] = clampedIndex;
    persistState();
    renderAnnotationsPanel();
    drawConnectors();
    monitorSlideOverflow(slides[clampedIndex]);
    if (window.OverflowMonitor) {
      window.OverflowMonitor.refresh();
    }
  }

  function nextSlide() {
    showSlide(currentSlideIndex + 1);
  }

  function prevSlide() {
    showSlide(currentSlideIndex - 1);
  }

  function getAnnotationColor(colorValue) {
    return colorValue;
  }

  function resetAnnotationPopover(removePending = false) {
    annotationPopover.classList.add('hidden');
    annotationPopover.style.top = '-9999px';
    annotationPopover.style.left = '-9999px';
    if (removePending && annotationDraft && activeMark && !annotationModalBackdrop.classList.contains('is-open')) {
      const fragment = document.createDocumentFragment();
      while (activeMark.firstChild) {
        fragment.appendChild(activeMark.firstChild);
      }
      activeMark.replaceWith(fragment);
      activeMark = null;
      annotationDraft = null;
    }
  }

  function handleTextSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      resetAnnotationPopover(true);
      return;
    }
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;
    if (!container) {
      return;
    }
    const slideSection = container.closest ? container.closest('.slide-stage') : null;
    if (!slideSection || slideSection.classList.contains('hidden')) {
      resetAnnotationPopover(true);
      return;
    }
    if (container.closest && container.closest('mark')) {
      resetAnnotationPopover(true);
      selection.removeAllRanges();
      return;
    }
    const annotationId = createAnnotationId();
    const mark = document.createElement('mark');
    mark.classList.add('annotation-highlight');
    mark.dataset.annotationId = annotationId;
    try {
      const extracted = range.extractContents();
      mark.appendChild(extracted);
      range.insertNode(mark);
      selection.removeAllRanges();
      activeMark = mark;
      annotationDraft = {
        id: annotationId,
        slideIndex: Number(slideSection.dataset.slideIndex),
        quote: mark.textContent
      };
      positionPopover(mark);
    } catch (error) {
      console.warn('Could not create annotation highlight', error);
      mark.remove();
      selection.removeAllRanges();
      resetAnnotationPopover(true);
    }
  }

  function positionPopover(mark) {
    const rect = mark.getBoundingClientRect();
    annotationPopover.style.top = `${window.scrollY + rect.top - 48}px`;
    annotationPopover.style.left = `${window.scrollX + rect.left}px`;
    annotationPopover.classList.remove('hidden');
  }

  function createAnnotationId() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `anno-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  function openAnnotationModal() {
    if (!activeMark || !annotationDraft) {
      return;
    }
    resetAnnotationPopover();
    buildColorPalette();
    annotationText.value = '';
    annotationModalBackdrop.classList.add('is-open');
    document.body.classList.add('modal-open');
    selectedColor = COLOR_CHOICES[0].value;
    selectedTextColor = COLOR_CHOICES[0].textColor;
    applyMarkColor(selectedColor);
    annotationText.focus();
  }

  function closeAnnotationModal() {
    annotationModalBackdrop.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    annotationText.value = '';
    if (activeMark && !annotations.find(item => item.id === activeMark.dataset.annotationId)) {
      const fragment = document.createDocumentFragment();
      while (activeMark.firstChild) {
        fragment.appendChild(activeMark.firstChild);
      }
      activeMark.replaceWith(fragment);
    }
    activeMark = null;
    annotationDraft = null;
    resetAnnotationPopover();
  }

  function applyMarkColor(color) {
    if (!activeMark) {
      return;
    }
    activeMark.style.background = getAnnotationColor(color);
  }

  function buildColorPalette() {
    colorPalette.innerHTML = '';
    COLOR_CHOICES.forEach((choice, index) => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'color-swatch';
      swatch.style.background = choice.value;
      swatch.setAttribute('aria-label', choice.name);
      if (index === 0) {
        swatch.classList.add('is-selected');
      }
      swatch.addEventListener('click', () => {
        selectedColor = choice.value;
        selectedTextColor = choice.textColor;
        colorPalette.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('is-selected'));
        swatch.classList.add('is-selected');
        applyMarkColor(choice.value);
      });
      swatch.title = choice.name;
      colorPalette.appendChild(swatch);
    });
  }

  function saveAnnotation() {
    if (!activeMark || !annotationDraft) {
      return;
    }
    const noteText = annotationText.value.trim();
    const annotation = {
      id: annotationDraft.id,
      slideIndex: annotationDraft.slideIndex,
      quote: annotationDraft.quote,
      color: selectedColor,
      textColor: selectedTextColor,
      note: noteText
    };
    activeMark.style.background = getAnnotationColor(selectedColor);
    activeMark.dataset.annotationId = annotation.id;
    activeMark.classList.add('annotation-highlight');

    annotations = annotations.filter(item => item.id !== annotation.id);
    annotations.push(annotation);
    state.annotations[currentPresentationId] = annotations;
    persistState();
    renderAnnotationsPanel();
    drawConnectors();
    activeMark = null;
    annotationDraft = null;
    resetAnnotationPopover();
    closeAnnotationModal();
  }

  function renderAnnotationsPanel() {
    if (!annotations.length) {
      annotationEmpty.style.display = 'block';
      annotationList.innerHTML = '';
      drawConnectors();
      if (window.OverflowMonitor) {
        window.OverflowMonitor.refresh();
      }
      return;
    }
    const visibleAnnotations = annotations.filter(item => item.slideIndex === currentSlideIndex);
    if (!visibleAnnotations.length) {
      annotationEmpty.style.display = 'block';
      annotationList.innerHTML = '';
      drawConnectors();
      if (window.OverflowMonitor) {
        window.OverflowMonitor.refresh();
      }
      return;
    }
    annotationEmpty.style.display = 'none';
    annotationList.innerHTML = '';
    visibleAnnotations.forEach(annotation => {
      const card = document.createElement('div');
      card.className = 'annotation-card';
      card.dataset.annotationId = annotation.id;
      card.style.background = getAnnotationColor(annotation.color);
      card.style.color = annotation.textColor || 'var(--deep-forest)';
      card.innerHTML = `
        <div class="annotation-quote">“${annotation.quote}”</div>
        ${annotation.note ? `<p>${annotation.note}</p>` : ''}
        <div class="annotation-meta">Slide ${annotation.slideIndex + 1}</div>
      `;
      card.addEventListener('mouseenter', () => highlightAnnotation(annotation.id, true));
      card.addEventListener('mouseleave', () => highlightAnnotation(annotation.id, false));
      annotationList.appendChild(card);
      if (window.OverflowMonitor) {
        window.OverflowMonitor.observe(card);
      }
    });

    if (window.OverflowMonitor) {
      window.OverflowMonitor.refresh();
    }
  }

  function highlightAnnotation(annotationId, isActive) {
    const mark = stageViewport.querySelector(`mark[data-annotation-id="${annotationId}"]`);
    if (mark) {
      mark.classList.toggle('is-active', isActive);
    }
  }

  function restoreAnnotationsOnSlides() {
    annotations.forEach(annotation => {
      const slide = stageViewport.querySelector(`.slide-stage[data-slide-index="${annotation.slideIndex}"]`);
      if (!slide) {
        return;
      }
      const existing = slide.querySelector(`mark[data-annotation-id="${annotation.id}"]`);
      if (existing) {
        existing.style.background = getAnnotationColor(annotation.color);
        return;
      }
      const mark = placeAnnotationHighlight(slide, annotation);
      if (mark) {
        mark.dataset.annotationId = annotation.id;
        mark.classList.add('annotation-highlight');
        mark.style.background = getAnnotationColor(annotation.color);
      }
    });
  }

  function placeAnnotationHighlight(slide, annotation) {
    const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.textContent;
      const index = text.toLowerCase().indexOf(annotation.quote.toLowerCase());
      if (index !== -1) {
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + annotation.quote.length);
        const mark = document.createElement('mark');
        const extracted = range.extractContents();
        mark.appendChild(extracted);
        range.insertNode(mark);
        return mark;
      }
    }
    return null;
  }

  function drawConnectors() {
    if (!connectorLayer) {
      return;
    }
    connectorLayer.innerHTML = '';
    const visibleAnnotations = annotations.filter(item => item.slideIndex === currentSlideIndex);
    if (!visibleAnnotations.length) {
      return;
    }
    const workspaceRect = workspaceGrid.getBoundingClientRect();
    const width = workspaceRect.width;
    const height = workspaceRect.height;
    connectorLayer.setAttribute('viewBox', `0 0 ${width} ${height}`);
    connectorLayer.setAttribute('width', width);
    connectorLayer.setAttribute('height', height);
    connectorLayer.style.width = `${width}px`;
    connectorLayer.style.height = `${height}px`;

    visibleAnnotations.forEach(annotation => {
      const mark = stageViewport.querySelector(`mark[data-annotation-id="${annotation.id}"]`);
      const card = annotationList.querySelector(`[data-annotation-id="${annotation.id}"]`);
      if (!mark || !card) {
        return;
      }
      const markRect = mark.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const startX = markRect.right - workspaceRect.left;
      const startY = markRect.top + markRect.height / 2 - workspaceRect.top;
      const endX = cardRect.left - workspaceRect.left;
      const endY = cardRect.top + cardRect.height / 2 - workspaceRect.top;
      const curve = Math.max(40, (endX - startX) / 2);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${startX},${startY} C${startX + curve},${startY} ${endX - curve},${endY} ${endX},${endY}`);
      path.setAttribute('stroke', getAnnotationColor(annotation.color));
      connectorLayer.appendChild(path);
    });
  }

  function populatePresentationSelector() {
    presentationSelector.innerHTML = '';
    const presentationList = Object.values(presentations);
    if (!presentationList.length) {
      const option = document.createElement('option');
      option.textContent = 'No presentations available';
      option.disabled = true;
      option.selected = true;
      presentationSelector.appendChild(option);
      presentationSelector.disabled = true;
      return;
    }

    presentationSelector.disabled = false;
    presentationList.forEach(presentation => {
      const option = document.createElement('option');
      option.value = presentation.id;
      option.textContent = presentation.deckTitle;
      presentationSelector.appendChild(option);
    });
  }

  async function switchPresentation(presentationId) {
    const presentation = presentations[presentationId];
    if (!presentation) {
      console.warn('Presentation not found:', presentationId);
      return;
    }

    currentPresentationId = presentationId;
    presentationSelector.value = presentationId;
    state.activePresentation = presentationId;
    fieldValues = { ...(state.fields[presentationId] || {}) };
    annotations = [...(state.annotations[presentationId] || [])];
    persistState();
    await renderPresentation(presentation, { preserveSlideIndex: true });
  }

  function initializeAnnotationInteractions() {
    stageViewport.addEventListener('mouseup', handleTextSelection);
    annotationPopover.addEventListener('click', openAnnotationModal);
    annotationSaveBtn.addEventListener('click', saveAnnotation);
    closeModalBtn.addEventListener('click', closeAnnotationModal);
    annotationModalBackdrop.addEventListener('click', event => {
      if (event.target === annotationModalBackdrop) {
        closeAnnotationModal();
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && annotationModalBackdrop.classList.contains('is-open')) {
        closeAnnotationModal();
      }
    });
  }

  function initializeNavigation() {
    navNext.addEventListener('click', nextSlide);
    navPrev.addEventListener('click', prevSlide);
    document.addEventListener('keydown', event => {
      if (event.target.matches('input, textarea') || event.target.isContentEditable) {
        return;
      }
      if (event.key === 'ArrowRight') {
        nextSlide();
      }
      if (event.key === 'ArrowLeft') {
        prevSlide();
      }
    });
  }

  function initializeExport() {
    exportButton.addEventListener('click', () => window.print());
  }

  function initializePresentationSelector() {
    populatePresentationSelector();
    presentationSelector.addEventListener('change', event => {
      switchPresentation(event.target.value).catch(error => {
        console.error('Failed to switch presentation', error);
      });
    });
  }

  async function initialize() {
    initializeAnnotationInteractions();
    initializeNavigation();
    initializeExport();
    initializePresentationSelector();
    window.addEventListener('resize', drawConnectors);

    const startPresentation = state.activePresentation && presentations[state.activePresentation]
      ? state.activePresentation
      : defaultPresentationId;

    if (!startPresentation) {
      console.warn('No Mosaic presentations were registered.');
      return;
    }

    await switchPresentation(startPresentation);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initialize().catch(error => {
      console.error('Failed to initialise Mosaic', error);
    });
  });
})();
