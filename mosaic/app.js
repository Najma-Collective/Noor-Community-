(() => {
  const MEDIA_HOST_WHITELIST = new Set([
    window.location.host,
    'localhost',
    '127.0.0.1',
    'images.pexels.com'
  ]);

  const PEXELS_API_KEY = 'ntFmvz0n4RpCRtHtRVV7HhAcbb4VQLwyEenPsqfIGdvpVvkgagK2dQEd';
  const PEXELS_ENDPOINT = 'https://api.pexels.com/v1/search';
  const FALLBACK_PLACEHOLDER_IMAGE =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" role="img" aria-label="Image unavailable"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#EFF3ED"/><stop offset="100%" stop-color="#D6E2D0"/></linearGradient></defs><rect width="400" height="260" fill="url(#grad)"/><g fill="#5F6F65" font-family="Nunito, sans-serif" text-anchor="middle"><text x="200" y="128" font-size="24" font-weight="600">Image unavailable</text><text x="200" y="162" font-size="16">We will keep your slide readable.</text></g></svg>'
    );
  const pexelsQueryCache = new Map();

  const presentations = {
    buildingCv: {
      id: 'buildingCv',
      deckTitle: 'Building a CV',
      slides: [
        {
          layout: 'hero-title',
          content: {
            backgroundImage: 'assets/images/building-cv-hero.svg',
            title: 'Building a CV'
          }
        },
        {
          layout: 'framed-list',
          content: {
            title: 'Learning Outcomes',
            introText: 'By the end of this lesson, you will be able to:',
            listItems: [
              'Choose a clear CV structure that fits your profile.',
              'Write action-based bullet points that show impact.',
              'Tailor your CV to a specific role in minutes.'
            ]
          }
        },
        {
          layout: 'two-column-details',
          content: {
            title: 'Anatomy of a Strong CV',
            subtitle: 'Balance clarity with personal voice',
            leftContentHTML:
              '<h3>Essential sections</h3><ul><li>Professional summary: one dynamic sentence.</li><li>Key skills: 5 bullet points organised by theme.</li><li>Experience: reverse chronological with results.</li><li>Education: highlight relevant certifications.</li></ul>',
            rightContentHTML:
              '<h3>Design choices</h3><ul><li>Keep margins generous and fonts consistent.</li><li>Use bold, not colour, to signal hierarchy.</li><li>Leave breathing space for easy scanning.</li><li>Save as PDF to protect formatting.</li></ul>'
          }
        },
        {
          layout: 'full-text-block',
          content: {
            htmlContent:
              '<h2>Sample Snapshot</h2><p><strong>Jade Hassan</strong> | Project Coordinator</p><p><em>Summary:</em> Agile project lead with 5+ years managing cross-cultural teams to deliver community programmes.</p><h3>Experience</h3><ul><li><strong>Community Spark</strong> — Coordinated 12-week employability bootcamp; achieved 92% completion.</li><li><strong>Bright Futures NGO</strong> — Redesigned volunteer onboarding, cutting attrition by 30%.</li></ul><h3>Skills</h3><ul><li>Stakeholder communication</li><li>Event budgeting</li><li>Report writing</li></ul>'
          }
        },
        {
          layout: 'discussion-table',
          content: {
            title: 'Warm Discussion',
            subtitle: 'Discuss the questions in pairs.',
            questions: [
              'What do recruiters scan first on a CV?',
              'How can a hobby strengthen your profile?',
              'When did you last update your CV and why?'
            ]
          }
        },
        {
          layout: 'analysis-table',
          content: {
            title: 'Experience Analyzer',
            instruction: 'Rewrite each bullet with action verbs and numbers.',
            questions: [
              'Organised events for students.',
              'Helped the sales team reach targets.',
              'Worked in customer service at a cafe.'
            ]
          }
        },
        {
          layout: 'image-response',
          content: {
            title: 'Personal Branding',
            instruction: 'Note two ways to express your personality professionally.',
            image: 'assets/images/cv-profile.svg'
          }
        },
        {
          layout: 'checklist',
          content: {
            title: 'Peer Review Checklist',
            instruction: 'Swap CV drafts and tick each item.',
            checklistItems: [
              '<b>Summary hooks attention</b> with role-specific keywords.',
              '<b>Experience bullets</b> include numbers or outcomes.',
              '<b>Design stays consistent</b> with spacing and fonts.',
              '<b>Contact details</b> look professional and current.'
            ]
          }
        },
        {
          layout: 'task-preparation',
          content: {
            title: 'Next Steps',
            instruction: 'Prepare to finalise your CV tonight.',
            steps: [
              'Select a job ad and highlight three repeated phrases.',
              'Tailor your summary + top skills to match the language.',
              'Email your updated CV to a peer for feedback.'
            ]
          }
        }
      ]
    },
    tourismStorytelling: {
      id: 'tourismStorytelling',
      deckTitle: 'Tourism & Storytelling',
      slides: [
        {
          layout: 'hero-title',
          content: {
            backgroundImage: 'assets/images/tourism-hero.svg',
            title: 'Tourism & Storytelling'
          }
        },
        {
          layout: 'simple-centered-text',
          content: {
            title: 'Our Journey Today',
            subtitle: 'Observe • Imagine • Share'
          }
        },
        {
          layout: 'image-prompt',
          content: {
            title: 'Warm-up',
            instruction: 'What details make this marketplace unforgettable?',
            image: 'assets/images/tourism-market.svg'
          }
        },
        {
          layout: 'image-matching-horizontal',
          content: {
            title: 'Match the Mood',
            instruction: 'Pair each photo with the sentence that fits the vibe.',
            images: [
              'assets/images/tourism-story-1.svg',
              'assets/images/tourism-story-2.svg',
              'assets/images/tourism-story-3.svg'
            ],
            sentences: [
              'The guide points to the horizon as the sun rises.',
              'Travellers pause to taste a new spice at the stall.',
              'Friends laugh while trying to capture the perfect photo.'
            ]
          }
        },
        {
          layout: 'storyboard-creator',
          content: {
            title: 'Craft Your Storyboard',
            instruction: 'Write a sentence under each frame to tell a mini-tour.',
            images: [
              'assets/images/tourism-story-1.svg',
              'assets/images/tourism-story-2.svg',
              'assets/images/tourism-story-3.svg',
              'assets/images/tourism-story-4.svg'
            ]
          }
        },
        {
          layout: 'gap-fill-exercise',
          content: {
            title: 'Narration Boost',
            instruction: 'Use the words to complete the storytelling sentence.',
            wordBox: ['vibrant', 'stalls', 'weaving'],
            sentence: 'The ___ guide led us through ___ of colour, weaving a ___ memory.'
          }
        },
        {
          layout: 'audio-comprehension',
          content: {
            title: 'Listen & Note',
            instruction: 'Imagine you hear a guide welcoming visitors. Capture two key points.',
            image: 'assets/images/tourism-guide.svg',
            text: '“Welcome back! Today we explore the hidden alleys, sample sweet saffron tea, and learn a phrase locals love.”',
            audioFile: 'assets/audio/tour-guide.mp3'
          }
        },
        {
          layout: 'three-column-reflection',
          content: {
            title: 'Reflect & Share',
            instruction: 'Capture quick thoughts before your presentation.',
            questions: [
              'Which moment in your story feels most vivid?',
              'What sensory detail can you add?',
              'How will you invite listeners into the journey?'
            ]
          }
        },
        {
          layout: 'reporting-prompt',
          content: {
            title: 'Ready to Report Back',
            instruction: 'Use the image to guide your storytelling summary.',
            image: 'assets/images/tourism-guide.svg'
          }
        }
      ]
    },
    givingDirections: {
      id: 'givingDirections',
      deckTitle: 'How to Give Directions',
      slides: [
        {
          layout: 'hero-title',
          content: {
            backgroundImage: 'assets/images/directions-hero.svg',
            title: 'How to Give Directions'
          }
        },
        {
          layout: 'framed-list',
          content: {
            title: 'Lesson Goals',
            introText: 'By the end you can confidently:',
            listItems: [
              'Use sequencing phrases to guide a listener.',
              'Highlight landmarks to check understanding.',
              'Confirm that the listener feels confident to go.'
            ]
          }
        },
        {
          layout: 'matching-task-vertical',
          content: {
            title: 'Map the Route',
            instruction: 'Match the listener questions with the helpful responses.',
            stimulusHTML:
              '<p><strong>Starting point:</strong> City library entrance.</p><p><strong>Destination:</strong> Riverside cafe.</p><p>Consider turns, landmarks, and distance.</p>',
            options: [
              '“Walk past the fountain and take the first left.”',
              '“It is opposite the museum with the glass roof.”',
              '“It is a ten-minute walk; shall I mark it on your map?”'
            ]
          }
        },
        {
          layout: 'image-response',
          content: {
            title: 'Try It Out',
            instruction: 'Write two sentences to guide a visitor from the star to the cafe.',
            image: 'assets/images/city-map.svg'
          }
        }
      ]
    }
  };

  const STORAGE_KEY = 'mosaic-state-v1';

  function isApprovedMediaUrl(url) {
    try {
      const parsed = new URL(url, document.baseURI);
      if (parsed.origin === window.location.origin) {
        return true;
      }
      return MEDIA_HOST_WHITELIST.has(parsed.host);
    } catch (error) {
      console.warn('Invalid media URL', url, error);
      return false;
    }
  }

  function resolveMediaUrl(path) {
    if (!path) {
      return '';
    }
    const trimmed = String(path).trim();
    if (!trimmed) {
      return '';
    }
    if (/^data:/i.test(trimmed)) {
      return trimmed;
    }
    try {
      const absoluteUrl = new URL(trimmed, document.baseURI).href;
      return isApprovedMediaUrl(absoluteUrl) ? absoluteUrl : '';
    } catch (error) {
      console.warn('Unable to resolve media path', path, error);
      return '';
    }
  }

  function normalizeMediaContext(context) {
    if (!context || typeof context !== 'object') {
      return context;
    }
    const normalized = { ...context };
    if (context.backgroundImage) {
      normalized.backgroundImage = resolveMediaUrl(context.backgroundImage);
    }
    if (context.image) {
      normalized.image = resolveMediaUrl(context.image);
    }
    if (Array.isArray(context.images)) {
      normalized.images = context.images.map(resolveMediaUrl);
    }
    if (context.audioFile) {
      normalized.audioFile = resolveMediaUrl(context.audioFile);
    }
    return normalized;
  }

  function buildFallbackQuery(presentation, context) {
    const tokens = [];
    if (context?.imageQuery) {
      tokens.push(context.imageQuery);
    }
    if (presentation?.deckTitle) {
      tokens.push(presentation.deckTitle);
    }
    if (context?.title) {
      tokens.push(context.title);
    }
    if (context?.subtitle) {
      tokens.push(context.subtitle);
    }
    if (context?.instruction) {
      tokens.push(context.instruction);
    }
    return tokens.join(' ').trim();
  }

  async function requestPexelsImage(query) {
    const safeQuery = query.trim();
    if (!safeQuery) {
      return '';
    }
    if (!PEXELS_API_KEY) {
      console.warn('Missing Pexels API key; cannot fetch fallback image.');
      return '';
    }
    const cacheKey = safeQuery.toLowerCase();
    if (pexelsQueryCache.has(cacheKey)) {
      return pexelsQueryCache.get(cacheKey);
    }
    try {
      const url = new URL(PEXELS_ENDPOINT);
      url.searchParams.set('query', safeQuery);
      url.searchParams.set('per_page', '1');
      url.searchParams.set('orientation', 'landscape');
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: PEXELS_API_KEY
        }
      });
      if (!response.ok) {
        throw new Error(`Pexels responded with ${response.status}`);
      }
      const data = await response.json();
      const fallbackUrl = data?.photos?.[0]?.src?.large || data?.photos?.[0]?.src?.original || '';
      pexelsQueryCache.set(cacheKey, fallbackUrl);
      return fallbackUrl;
    } catch (error) {
      console.warn('Unable to fetch fallback image from Pexels', error);
      pexelsQueryCache.set(cacheKey, '');
      return '';
    }
  }

  function applyImagePlaceholder(img) {
    if (!img) {
      return;
    }
    img.removeEventListener('error', handleImageError);
    img.src = FALLBACK_PLACEHOLDER_IMAGE;
    img.alt = 'Image unavailable';
    img.classList.add('is-placeholder');
  }

  async function handleImageError(event) {
    const img = event.currentTarget;
    if (!img || img.dataset.fallbackAttempted === 'true') {
      applyImagePlaceholder(img);
      return;
    }
    img.dataset.fallbackAttempted = 'true';
    const query = img.dataset.fallbackQuery || '';
    const fallbackUrl = await requestPexelsImage(query);
    if (fallbackUrl && fallbackUrl !== img.src) {
      img.src = fallbackUrl;
      img.dataset.isFallback = 'true';
      return;
    }
    applyImagePlaceholder(img);
  }

  function initializeSlideMedia(section, context, presentation) {
    if (!section) {
      return;
    }
    const fallbackQuery = buildFallbackQuery(presentation, context);
    section.querySelectorAll('img').forEach(img => {
      if (!img) {
        return;
      }
      if (!img.getAttribute('src')) {
        img.src = FALLBACK_PLACEHOLDER_IMAGE;
        img.classList.add('is-placeholder');
      }
      img.loading = 'lazy';
      img.decoding = 'async';
      const derivedQuery = [fallbackQuery, img.getAttribute('alt')]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (derivedQuery) {
        img.dataset.fallbackQuery = derivedQuery;
      }
      img.addEventListener('error', handleImageError);
    });
  }
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
  let cleanupPrintArtifacts = null;

  const templateCache = {};

  const defaultState = {
    activePresentation: 'buildingCv',
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

  function renderPresentation(presentation, { preserveSlideIndex = false } = {}) {
    teardownPrintArtifacts();
    clearSlides();
    slides = [];
    const navAnchor = stageViewport.querySelector('.slide-nav-prev');
    presentation.slides.forEach((slide, index) => {
      try {
        const context = {
          ...slide.content,
          deckTitle: presentation.deckTitle,
          _slideIndex: index
        };
        const normalizedContext = normalizeMediaContext(context);
        const section = createSlideSection(slide.layout, normalizedContext);
        initializeSlideMedia(section, normalizedContext, presentation);
        if (navAnchor) {
          stageViewport.insertBefore(section, navAnchor);
        } else {
          stageViewport.appendChild(section);
        }
        slides.push(section);
      } catch (error) {
        console.error('Unable to render slide', slide, error);
        const errorSection = document.createElement('section');
        errorSection.className = 'slide-stage';
        errorSection.dataset.layout = 'error';

        const slideInner = document.createElement('div');
        slideInner.className = 'slide-inner';

        const card = document.createElement('div');
        card.className = 'card card-full-height error-slide';

        const heading = document.createElement('h2');
        heading.textContent = 'Slide could not be displayed';

        const subtitle = document.createElement('p');
        subtitle.className = 'subtitle';
        subtitle.textContent = error.message || 'An unexpected error occurred.';

        card.appendChild(heading);
        card.appendChild(subtitle);
        slideInner.appendChild(card);
        errorSection.appendChild(slideInner);

        if (navAnchor) {
          stageViewport.insertBefore(errorSection, navAnchor);
        } else {
          stageViewport.appendChild(errorSection);
        }
        slides.push(errorSection);
      }
    });

    attachFieldListeners();
    restoreFieldValues();
    restoreAnnotationsOnSlides();

    const savedIndex = preserveSlideIndex
      ? Math.min(state.slides[currentPresentationId] || 0, slides.length - 1)
      : 0;
    showSlide(savedIndex < 0 ? 0 : savedIndex);
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
    fieldValues[target.dataset.fieldKey] = target.value;
    state.fields[currentPresentationId] = { ...fieldValues };
    persistState();
  }

  function handleFieldChange(event) {
    const target = event.target;
    if (!target.dataset.fieldKey) {
      return;
    }
    if (target.type === 'radio') {
      if (target.checked) {
        fieldValues[target.dataset.fieldKey] = target.value;
      }
    } else if (target.type === 'checkbox') {
      fieldValues[target.dataset.fieldKey] = target.checked;
    } else {
      fieldValues[target.dataset.fieldKey] = target.value;
    }
    state.fields[currentPresentationId] = { ...fieldValues };
    persistState();
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
      return;
    }
    const visibleAnnotations = annotations.filter(item => item.slideIndex === currentSlideIndex);
    if (!visibleAnnotations.length) {
      annotationEmpty.style.display = 'block';
      annotationList.innerHTML = '';
      drawConnectors();
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
    });
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

  function buildPrintAnnotationSummaries() {
    const created = [];
    if (!slides.length) {
      return () => {};
    }
    slides.forEach((slide, index) => {
      const annotationsForSlide = annotations.filter(item => item.slideIndex === index);
      if (!annotationsForSlide.length) {
        return;
      }
      const summary = document.createElement('aside');
      summary.className = 'print-annotation-summary';

      const heading = document.createElement('h3');
      heading.textContent = 'Annotations';
      summary.appendChild(heading);

      const list = document.createElement('ol');
      list.className = 'print-annotation-list';
      annotationsForSlide.forEach(item => {
        const li = document.createElement('li');
        const quote = document.createElement('blockquote');
        quote.textContent = item.quote;
        li.appendChild(quote);
        if (item.note) {
          const note = document.createElement('p');
          note.textContent = item.note;
          li.appendChild(note);
        }
        list.appendChild(li);
      });
      summary.appendChild(list);
      slide.appendChild(summary);
      created.push(summary);
    });
    return () => {
      created.forEach(node => node.remove());
    };
  }

  function preparePrintArtifacts() {
    if (typeof cleanupPrintArtifacts === 'function') {
      cleanupPrintArtifacts();
    }
    cleanupPrintArtifacts = buildPrintAnnotationSummaries();
  }

  function teardownPrintArtifacts() {
    if (typeof cleanupPrintArtifacts === 'function') {
      cleanupPrintArtifacts();
    }
    cleanupPrintArtifacts = null;
  }

  function populatePresentationSelector() {
    presentationSelector.innerHTML = '';
    Object.values(presentations).forEach(presentation => {
      const option = document.createElement('option');
      option.value = presentation.id;
      option.textContent = presentation.deckTitle;
      presentationSelector.appendChild(option);
    });
  }

  function switchPresentation(presentationId) {
    currentPresentationId = presentationId;
    presentationSelector.value = presentationId;
    state.activePresentation = presentationId;
    fieldValues = { ...(state.fields[presentationId] || {}) };
    annotations = [...(state.annotations[presentationId] || [])];
    persistState();
    const presentation = presentations[presentationId];
    renderPresentation(presentation, { preserveSlideIndex: true });
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
      if (event.target.matches('input, textarea')) {
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
    exportButton.addEventListener('click', () => {
      preparePrintArtifacts();
      window.print();
    });
    window.addEventListener('beforeprint', preparePrintArtifacts);
    window.addEventListener('afterprint', teardownPrintArtifacts);
  }

  function initializePresentationSelector() {
    populatePresentationSelector();
    presentationSelector.addEventListener('change', event => {
      switchPresentation(event.target.value);
    });
  }

  function initialize() {
    initializeAnnotationInteractions();
    initializeNavigation();
    initializeExport();
    initializePresentationSelector();
    window.addEventListener('resize', drawConnectors);

    const startPresentation = state.activePresentation && presentations[state.activePresentation]
      ? state.activePresentation
      : 'buildingCv';
    switchPresentation(startPresentation);
  }

  document.addEventListener('DOMContentLoaded', initialize);
})();
