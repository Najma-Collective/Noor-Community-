const LAYOUT_ICON_DEFAULTS = {
  'learning-objectives': 'fa-solid fa-bullseye',
  'model-dialogue': 'fa-solid fa-comments',
  'interactive-practice': 'fa-solid fa-list-check',
  'communicative-task': 'fa-solid fa-people-arrows',
  'pronunciation-focus': 'fa-solid fa-wave-square',
  reflection: 'fa-solid fa-moon',
};

const LAYOUT_FIELD_ICON_DEFAULTS = {
  'learning-objectives': {
    learningGoalIcon: 'fa-solid fa-bullseye',
    learningCommunicativeGoalIcon: 'fa-solid fa-comments',
  },
  'model-dialogue': {
    dialogueInstructionsIcon: 'fa-solid fa-person-chalkboard',
  },
  'interactive-practice': {
    practiceInstructionsIcon: 'fa-solid fa-clipboard-check',
    practiceActivityTypeIcon: 'fa-solid fa-shapes',
  },
  'communicative-task': {
    taskPreparationIcon: 'fa-solid fa-list-check',
    taskPerformanceIcon: 'fa-solid fa-people-group',
    taskScaffoldingIcon: 'fa-solid fa-lightbulb',
  },
  'pronunciation-focus': {
    pronunciationTargetIcon: 'fa-solid fa-wave-square',
    pronunciationWordsIcon: 'fa-solid fa-font',
    pronunciationSentencesIcon: 'fa-solid fa-quote-right',
    pronunciationPracticeIcon: 'fa-solid fa-microphone-lines',
  },
  reflection: {
    reflectionPromptsIcon: 'fa-solid fa-comment-dots',
  },
};

const MODULE_TYPE_LABELS = {
  'multiple-choice': 'Multiple choice',
  gapfill: 'Gap fill',
  grouping: 'Grouping',
  'table-completion': 'Table completion',
  matching: 'Matching',
  'error-correction': 'Error correction',
};

const trimText = (value) => (typeof value === 'string' ? value.trim() : '');
const normaliseIconClass = (value) => (typeof value === 'string' ? value.trim() : '');

const getLayoutFieldIconDefault = (layout, field) => {
  const layoutDefaults = LAYOUT_FIELD_ICON_DEFAULTS[layout];
  const defaultClass = layoutDefaults?.[field];
  return typeof defaultClass === 'string' ? defaultClass : '';
};

const normaliseOverlayPercent = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    if (value <= 1 && value >= 0) {
      return Math.round(value * 100);
    }
    return Math.min(Math.max(Math.round(value), 0), 100);
  }
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  if (parsed <= 1 && parsed >= 0) {
    return Math.round(parsed * 100);
  }
  return Math.min(Math.max(Math.round(parsed), 0), 100);
};

const resolveOverlayOpacity = (percent) => {
  const numeric = normaliseOverlayPercent(percent);
  if (numeric <= 0) {
    return 0;
  }
  return Math.min(Math.max(numeric / 100, 0), 0.92);
};

const attachLayoutIconBadge = (slide, iconClass) => {
  if (!(slide instanceof HTMLElement)) {
    return;
  }
  const existing = slide.querySelector('.lesson-layout-icon');
  if (existing instanceof HTMLElement) {
    existing.remove();
  }
  if (typeof iconClass !== 'string') {
    slide.removeAttribute('data-layout-icon');
    return;
  }
  const trimmed = iconClass.trim();
  if (!trimmed) {
    slide.removeAttribute('data-layout-icon');
    return;
  }
  const badge = document.createElement('span');
  badge.className = 'lesson-layout-icon';
  const icon = document.createElement('i');
  icon.className = trimmed;
  icon.setAttribute('aria-hidden', 'true');
  badge.appendChild(icon);
  slide.appendChild(badge);
  slide.dataset.layoutIcon = trimmed;
};

const getEffectiveLayoutIcon = (_layout, iconClass) =>
  typeof iconClass === 'string' ? iconClass.trim() : '';

const applyLessonBackground = (
  slide,
  { imageUrl = '', overlayColor = '', overlayOpacity = 0 } = {},
) => {
  if (!(slide instanceof HTMLElement)) {
    return;
  }
  const resolvedImage = trimText(imageUrl);
  if (resolvedImage) {
    slide.classList.add('lesson-slide--has-image');
    slide.style.setProperty('--lesson-bg-image', `url("${resolvedImage}")`);
  }
  const resolvedColor = trimText(overlayColor);
  const resolvedOpacity = resolveOverlayOpacity(overlayOpacity);
  if (resolvedColor) {
    slide.style.setProperty('--lesson-overlay-color', resolvedColor);
  }
  if (resolvedOpacity > 0) {
    slide.classList.add('lesson-slide--has-overlay');
    slide.style.setProperty('--lesson-overlay-opacity', String(resolvedOpacity));
  } else {
    slide.style.removeProperty('--lesson-overlay-opacity');
  }
};

const createBaseLessonSlide = (layout, options = {}) => {
  const { iconClass = '', ...backgroundOptions } = options;
  const slide = document.createElement('div');
  slide.className = 'slide-stage hidden lesson-slide';
  slide.dataset.type = 'lesson';
  if (layout) {
    slide.dataset.layout = layout;
    slide.classList.add(`lesson-slide--${layout}`);
  }
  applyLessonBackground(slide, backgroundOptions);
  const inner = document.createElement('div');
  inner.className = 'slide-inner lesson-slide-inner';
  if (layout) {
    inner.classList.add(`${layout}-layout`);
  }
  attachLayoutIconBadge(slide, iconClass);
  slide.appendChild(inner);
  return { slide, inner };
};

const BUILDER_LAYOUT_DEFAULTS = {
  'learning-objectives': () => ({
    icon: LAYOUT_ICON_DEFAULTS['learning-objectives'],
    title: 'Learning Outcomes',
    goals: [
      'Learn vocabulary for jobs and places in a city.',
      "Practise asking and answering questions with 'do'.",
      'Focus on blending the /st/ sound.',
    ],
    goalIcon: getLayoutFieldIconDefault('learning-objectives', 'learningGoalIcon'),
    communicativeGoal: 'get to know a new person.',
    communicativeGoalIcon: getLayoutFieldIconDefault(
      'learning-objectives',
      'learningCommunicativeGoalIcon',
    ),
    imageUrl:
      'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=1600',
    overlayColor: 'color-mix(in srgb, var(--deep-forest) 82%, transparent)',
    overlayOpacity: 45,
  }),
  'model-dialogue': () => ({
    icon: LAYOUT_ICON_DEFAULTS['model-dialogue'],
    title: 'Get to know people',
    instructions: "In pairs, identify the two main questions and how the speakers answer them.",
    instructionsIcon: getLayoutFieldIconDefault('model-dialogue', 'dialogueInstructionsIcon'),
    imageUrl:
      'https://images.pexels.com/photos/1181354/pexels-photo-1181354.jpeg?auto=compress&cs=tinysrgb&w=1600',
    overlayColor: 'color-mix(in srgb, var(--primary-sage) 55%, var(--deep-forest) 45%)',
    overlayOpacity: 38,
    audioUrl: '',
    turns: [
      { speaker: "Amina", line: "Hi! I'm Amina. Nice to meet you." },
      { speaker: "Sara", line: "Hi Amina! I'm Sara. Where are you from?" },
      { speaker: "Amina", line: "I'm from Nablus. Do you live nearby?" },
      { speaker: "Sara", line: "Yes, I live in Ramallah. What do you do?" },
    ],
  }),
  'interactive-practice': () => ({
    icon: LAYOUT_ICON_DEFAULTS['interactive-practice'],
    activityType: 'gapfill',
    activityTypeIcon: getLayoutFieldIconDefault('interactive-practice', 'practiceActivityTypeIcon'),
    title: 'Practice',
    instructions: 'Complete each sentence with the best option.',
    instructionsIcon: getLayoutFieldIconDefault('interactive-practice', 'practiceInstructionsIcon'),
    questions: [
      {
        prompt: 'I live ____ a flat ___ Ramallah.',
        options: ['in / on', 'in / in', 'on / in'],
        answer: 'in / in',
      },
      {
        prompt: 'My sister works ___ a nurse.',
        options: ['at', 'as', 'for'],
        answer: 'as',
      },
    ],
    imageUrl:
      'https://images.pexels.com/photos/1181711/pexels-photo-1181711.jpeg?auto=compress&cs=tinysrgb&w=1600',
    overlayColor: 'color-mix(in srgb, var(--secondary-sage) 65%, var(--deep-forest) 35%)',
    overlayOpacity: 42,
  }),
  'communicative-task': () => ({
    icon: LAYOUT_ICON_DEFAULTS['communicative-task'],
    title: 'Language exchange introductions',
    imageUrl:
      'https://images.pexels.com/photos/1438072/pexels-photo-1438072.jpeg?auto=compress&cs=tinysrgb&w=1600',
    preparation:
      'You are at a language exchange event. Decide who you will meet and note two follow-up questions you want to ask.',
    performance:
      'Move to breakout rooms. Take turns introducing yourselves and asking the follow-up questions you prepared.',
    preparationIcon: getLayoutFieldIconDefault('communicative-task', 'taskPreparationIcon'),
    performanceIcon: getLayoutFieldIconDefault('communicative-task', 'taskPerformanceIcon'),
    scaffolding: [
      'A: Where do you live, ____?',
      'B: I live in ____. What do you do?',
      "A: I work as a ____ because ____.",
    ],
    overlayColor: 'color-mix(in srgb, var(--deep-forest) 78%, transparent)',
    overlayOpacity: 36,
  }),
  'pronunciation-focus': () => ({
    icon: LAYOUT_ICON_DEFAULTS['pronunciation-focus'],
    title: 'What does /st/ sound like?',
    target: '/st/ sound',
    targetIcon: getLayoutFieldIconDefault('pronunciation-focus', 'pronunciationTargetIcon'),
    words: ['student', 'study'],
    wordsIcon: getLayoutFieldIconDefault('pronunciation-focus', 'pronunciationWordsIcon'),
    sentences: ['Are you a student? ↗', "We start at six o'clock. ↘"],
    sentencesIcon: getLayoutFieldIconDefault('pronunciation-focus', 'pronunciationSentencesIcon'),
    practice: 'Invite 3-4 learners to say the sentences, then personalise with their own ideas.',
    practiceIcon: getLayoutFieldIconDefault('pronunciation-focus', 'pronunciationPracticeIcon'),
    imageUrl:
      'https://images.pexels.com/photos/5905711/pexels-photo-5905711.jpeg?auto=compress&cs=tinysrgb&w=1600',
    overlayColor: 'color-mix(in srgb, var(--primary-sage) 35%, var(--deep-forest) 65%)',
    overlayOpacity: 40,
  }),
  reflection: () => ({
    icon: LAYOUT_ICON_DEFAULTS.reflection,
    title: 'Reflection',
    prompts: ["A classmate’s name", 'A place in Palestine', 'A job'],
    promptsIcon: getLayoutFieldIconDefault('reflection', 'reflectionPromptsIcon'),
    imageUrl:
      'https://images.pexels.com/photos/4144226/pexels-photo-4144226.jpeg?auto=compress&cs=tinysrgb&w=1600',
    overlayColor: 'color-mix(in srgb, var(--deep-forest) 70%, transparent)',
    overlayOpacity: 38,
  }),
};

function createLearningObjectivesSlide({
  title = 'Learning Outcomes',
  goals = [],
  communicativeGoal = '',
  goalIcon = '',
  imageUrl = '',
  overlayColor = '',
  overlayOpacity = 0,
  layoutIcon = '',
} = {}) {
  const { slide, inner } = createBaseLessonSlide('learning-objectives', {
    imageUrl,
    overlayColor,
    overlayOpacity,
    iconClass: getEffectiveLayoutIcon('learning-objectives', layoutIcon),
  });

  const header = document.createElement('header');
  header.className = 'lesson-header';
  inner.appendChild(header);

  const heading = document.createElement('h2');
  heading.textContent = trimText(title) || 'Learning Outcomes';
  header.appendChild(heading);

  const goalText = trimText(communicativeGoal);
  if (goalText) {
    const goalElement = document.createElement('p');
    goalElement.className = 'lesson-communicative';
    const lead = document.createElement('strong');
    lead.textContent = 'So you can';
    goalElement.appendChild(lead);
    goalElement.appendChild(document.createTextNode(` ${goalText}`));
    header.appendChild(goalElement);
  }

  const body = document.createElement('div');
  body.className = 'lesson-body';
  inner.appendChild(body);

  const cleanedGoals = Array.isArray(goals) ? goals.map((goal) => trimText(goal)).filter(Boolean) : [];
  const goalIconClass =
    normaliseIconClass(goalIcon) ||
    getLayoutFieldIconDefault('learning-objectives', 'learningGoalIcon') ||
    'fas fa-bullseye';
  if (cleanedGoals.length) {
    const card = document.createElement('div');
    card.className = 'card lesson-goals-card';
    const list = document.createElement('ul');
    list.className = 'lesson-goals';
    cleanedGoals.forEach((goal, index) => {
      const item = document.createElement('li');
      const icon = document.createElement('span');
      icon.className = 'lesson-goal-icon';
      const iconGlyph = document.createElement('i');
      iconGlyph.className = goalIconClass;
      iconGlyph.setAttribute('aria-hidden', 'true');
      const iconLabel = document.createElement('span');
      iconLabel.className = 'sr-only';
      iconLabel.textContent = `Goal ${index + 1}`;
      icon.appendChild(iconGlyph);
      icon.appendChild(iconLabel);
      const text = document.createElement('p');
      text.textContent = goal;
      item.appendChild(icon);
      item.appendChild(text);
      list.appendChild(item);
    });
    card.appendChild(list);
    body.appendChild(card);
  } else {
    const placeholder = document.createElement('p');
    placeholder.className = 'lesson-empty';
    placeholder.textContent = 'List the lesson goals to orient learners.';
    body.appendChild(placeholder);
  }

  return slide;
}

function createModelDialogueSlide({
  title = 'Model dialogue',
  instructions = '',
  imageUrl = '',
  audioUrl = '',
  turns = [],
  overlayColor = '',
  overlayOpacity = 0,
  layoutIcon = '',
} = {}) {
  const { slide, inner } = createBaseLessonSlide('model-dialogue', {
    imageUrl,
    overlayColor,
    overlayOpacity,
    iconClass: getEffectiveLayoutIcon('model-dialogue', layoutIcon),
  });

  const resolvedImage = trimText(imageUrl);

  const header = document.createElement('header');
  header.className = 'lesson-header';
  inner.appendChild(header);

  const heading = document.createElement('h2');
  heading.textContent = trimText(title) || 'Model dialogue';
  header.appendChild(heading);

  const instructionText = trimText(instructions);
  if (instructionText) {
    const instructionEl = document.createElement('p');
    instructionEl.className = 'lesson-instructions';
    instructionEl.textContent = instructionText;
    header.appendChild(instructionEl);
  }

  const body = document.createElement('div');
  body.className = 'lesson-dialogue';
  inner.appendChild(body);

  const dialogueWrap = document.createElement('div');
  dialogueWrap.className = 'lesson-dialogue-text';
  body.appendChild(dialogueWrap);

  const cleanedTurns = Array.isArray(turns)
    ? turns
        .map((turn) => ({ speaker: trimText(turn?.speaker), line: trimText(turn?.line) }))
        .filter((turn) => turn.speaker || turn.line)
    : [];

  if (cleanedTurns.length) {
    cleanedTurns.forEach((turn) => {
      const block = document.createElement('div');
      block.className = 'dialogue-turn';
      const speaker = document.createElement('span');
      speaker.className = 'dialogue-speaker';
      speaker.textContent = turn.speaker || 'Speaker';
      const line = document.createElement('p');
      line.className = 'dialogue-line';
      line.textContent = turn.line || '';
      block.appendChild(speaker);
      block.appendChild(line);
      dialogueWrap.appendChild(block);
    });
  } else {
    const placeholder = document.createElement('p');
    placeholder.className = 'lesson-empty';
    placeholder.textContent = 'Add dialogue turns so learners can analyse the model.';
    dialogueWrap.appendChild(placeholder);
  }

  if (resolvedImage) {
    const visual = document.createElement('div');
    visual.className = 'lesson-dialogue-visual';
    const img = document.createElement('img');
    img.src = resolvedImage;
    img.alt = trimText(title) || 'Dialogue context';
    img.loading = 'lazy';
    img.decoding = 'async';
    visual.appendChild(img);
    body.appendChild(visual);
  }

  const audioSource = trimText(audioUrl);
  if (audioSource) {
    const audioWrap = document.createElement('div');
    audioWrap.className = 'lesson-audio';
    const audioEl = document.createElement('audio');
    audioEl.controls = true;
    audioEl.src = audioSource;
    audioWrap.appendChild(audioEl);
    inner.appendChild(audioWrap);
  }

  return slide;
}

function createCommunicativeTaskSlide({
  title = 'Communicative task',
  imageUrl = '',
  preparation = '',
  performance = '',
  scaffolding = [],
  preparationIcon = '',
  performanceIcon = '',
  overlayColor = '',
  overlayOpacity = 0,
  layoutIcon = '',
} = {}) {
  const { slide, inner } = createBaseLessonSlide('communicative-task', {
    imageUrl,
    overlayColor,
    overlayOpacity,
    iconClass: getEffectiveLayoutIcon('communicative-task', layoutIcon),
  });
  slide.dataset.type = 'communicative-task';

  const header = document.createElement('header');
  header.className = 'lesson-header';
  inner.appendChild(header);

  const heading = document.createElement('h2');
  heading.textContent = trimText(title) || 'Communicative task';
  header.appendChild(heading);

  const splitPreparationText = (text) => {
    const value = trimText(text);
    if (!value) {
      return { scenario: '', remainder: '' };
    }
    const newlineIndex = value.indexOf('\n');
    if (newlineIndex !== -1) {
      const scenario = trimText(value.slice(0, newlineIndex));
      const remainder = trimText(value.slice(newlineIndex + 1));
      if (scenario && remainder) {
        return { scenario, remainder };
      }
    }
    const sentenceMatch = value.match(/^(.+?[.!?])\s+([\s\S]+)$/);
    if (sentenceMatch) {
      const [, scenario, remainder] = sentenceMatch;
      const trimmedScenario = trimText(scenario);
      const trimmedRemainder = trimText(remainder);
      if (trimmedScenario && trimmedRemainder) {
        return { scenario: trimmedScenario, remainder: trimmedRemainder };
      }
    }
    return { scenario: '', remainder: value };
  };

  const body = document.createElement('div');
  body.className = 'task-body';
  inner.appendChild(body);

  const mainCard = document.createElement('div');
  mainCard.className = 'card communicative-task-card';
  body.appendChild(mainCard);

  const { scenario: scenarioText, remainder: preparationRemainder } = splitPreparationText(preparation);

  if (scenarioText) {
    const scenarioCard = document.createElement('div');
    scenarioCard.className = 'column-card task-scenario';
    const scenarioHeading = document.createElement('h3');
    scenarioHeading.textContent = 'Scenario';
    const scenarioParagraph = document.createElement('p');
    scenarioParagraph.textContent = scenarioText;
    scenarioCard.appendChild(scenarioHeading);
    scenarioCard.appendChild(scenarioParagraph);
    mainCard.appendChild(scenarioCard);
  }

  const instructionList = document.createElement('ul');
  instructionList.className = 'instruction-list task-instruction-list';
  mainCard.appendChild(instructionList);

  const preparationIconClass =
    normaliseIconClass(preparationIcon) ||
    getLayoutFieldIconDefault('communicative-task', 'taskPreparationIcon') ||
    'fa-solid fa-list-check';
  const performanceIconClass =
    normaliseIconClass(performanceIcon) ||
    getLayoutFieldIconDefault('communicative-task', 'taskPerformanceIcon') ||
    'fa-solid fa-people-group';

  const steps = [
    {
      label: 'Preparation',
      icon: preparationIconClass,
      text: trimText(preparationRemainder) || 'Describe how learners should get ready together.',
    },
    {
      label: 'Performance',
      icon: performanceIconClass,
      text: trimText(performance) || 'Explain how learners will carry out the task.',
    },
  ];

  steps
    .filter((step) => Boolean(step.text))
    .forEach(({ label, icon, text }) => {
      const item = document.createElement('li');
      const iconEl = document.createElement('i');
      iconEl.className = icon;
      iconEl.setAttribute('aria-hidden', 'true');
      item.appendChild(iconEl);
      const content = document.createElement('div');
      content.className = 'instruction-content';
      const stepHeading = document.createElement('h4');
      stepHeading.textContent = label;
      const stepText = document.createElement('p');
      stepText.textContent = text;
      content.appendChild(stepHeading);
      content.appendChild(stepText);
      item.appendChild(content);
      instructionList.appendChild(item);
    });

  const scaffoldingItems = Array.isArray(scaffolding)
    ? scaffolding.map((item) => trimText(item)).filter(Boolean)
    : [];
  const scaffoldingCard = document.createElement('div');
  scaffoldingCard.className = 'column-card task-scaffolding';
  const scaffoldHeading = document.createElement('h3');
  scaffoldHeading.textContent = 'Language support';
  scaffoldingCard.appendChild(scaffoldHeading);
  if (scaffoldingItems.length) {
    const list = document.createElement('ul');
    list.className = 'task-scaffolding-list';
    scaffoldingItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
    scaffoldingCard.appendChild(list);
  } else {
    const placeholder = document.createElement('p');
    placeholder.className = 'lesson-empty';
    placeholder.textContent = 'Add sentence stems or prompts to support learners during the task.';
    scaffoldingCard.appendChild(placeholder);
  }
  body.appendChild(scaffoldingCard);

  return slide;
}

function createPronunciationFocusSlide({
  title = 'Pronunciation focus',
  target = '',
  words = [],
  sentences = [],
  practice = '',
  imageUrl = '',
  overlayColor = '',
  overlayOpacity = 0,
  layoutIcon = '',
} = {}) {
  const { slide, inner } = createBaseLessonSlide('pronunciation-focus', {
    imageUrl,
    overlayColor,
    overlayOpacity,
    iconClass: getEffectiveLayoutIcon('pronunciation-focus', layoutIcon),
  });
  slide.dataset.type = 'pronunciation';

  const header = document.createElement('header');
  header.className = 'lesson-header';
  inner.appendChild(header);

  const heading = document.createElement('h2');
  heading.textContent = trimText(title) || 'Pronunciation focus';
  header.appendChild(heading);

  const targetText = trimText(target);
  if (targetText) {
    const targetEl = document.createElement('p');
    targetEl.className = 'pronunciation-target';
    targetEl.textContent = targetText;
    header.appendChild(targetEl);
  }

  const card = document.createElement('div');
  card.className = 'pronunciation-focus-card';
  inner.appendChild(card);

  const wordList = Array.isArray(words) ? words.map((word) => trimText(word)).filter(Boolean) : [];
  if (wordList.length) {
    const wordsEl = document.createElement('div');
    wordsEl.className = 'pronunciation-words';
    wordList.forEach((word) => {
      const span = document.createElement('span');
      span.textContent = word;
      wordsEl.appendChild(span);
    });
    card.appendChild(wordsEl);
  }

  const sentenceList = Array.isArray(sentences)
    ? sentences.map((sentence) => trimText(sentence)).filter(Boolean)
    : [];
  if (sentenceList.length) {
    const sentenceEl = document.createElement('div');
    sentenceEl.className = 'pronunciation-examples';
    sentenceList.forEach((sentence) => {
      const example = document.createElement('span');
      example.textContent = sentence;
      sentenceEl.appendChild(example);
    });
    card.appendChild(sentenceEl);
  }

  const practiceText = trimText(practice);
  const practiceEl = document.createElement('div');
  practiceEl.className = 'pronunciation-practice';
  practiceEl.textContent = practiceText || 'Describe how learners should practise the target sound.';
  card.appendChild(practiceEl);

  return slide;
}

function createReflectionSlide({
  title = 'Reflection',
  prompts = [],
  imageUrl = '',
  overlayColor = '',
  overlayOpacity = 0,
  layoutIcon = '',
} = {}) {
  const { slide, inner } = createBaseLessonSlide('reflection', {
    imageUrl,
    overlayColor,
    overlayOpacity,
    iconClass: getEffectiveLayoutIcon('reflection', layoutIcon),
  });
  slide.dataset.type = 'reflection';

  const header = document.createElement('header');
  header.className = 'lesson-header';
  inner.appendChild(header);

  const heading = document.createElement('h2');
  heading.textContent = trimText(title) || 'Reflection';
  header.appendChild(heading);

  const body = document.createElement('div');
  body.className = 'reflection-body';
  inner.appendChild(body);

  const promptList = Array.isArray(prompts) ? prompts.map((prompt) => trimText(prompt)).filter(Boolean) : [];
  if (promptList.length) {
    const list = document.createElement('ul');
    list.className = 'reflection-prompts';
    promptList.forEach((prompt) => {
      const li = document.createElement('li');
      li.textContent = prompt;
      list.appendChild(li);
    });
    body.appendChild(list);
  } else {
    const placeholder = document.createElement('p');
    placeholder.className = 'lesson-empty';
    placeholder.textContent = 'Add reflection prompts to guide learners.';
    body.appendChild(placeholder);
  }

  return slide;
}

function createInteractivePracticeSlide({
  title = 'Practice',
  instructions = '',
  activityType = 'multiple-choice',
  questions = [],
  imageUrl = '',
  overlayColor = '',
  overlayOpacity = 0,
  layoutIcon = '',
} = {}) {
  const resolvedTitle = trimText(title) || 'Practice';
  const resolvedInstructions = trimText(instructions);
  const resolvedType = trimText(activityType) || 'multiple-choice';
  const resolvedQuestions = Array.isArray(questions)
    ? questions.filter((q) => q && (q.prompt || q.options?.length))
    : [];

  const slide = document.createElement('div');
  slide.className = 'slide-stage hidden interactive-practice-slide';
  slide.dataset.type = 'interactive-practice';
  slide.dataset.activityType = resolvedType;

  attachLayoutIconBadge(slide, getEffectiveLayoutIcon('interactive-practice', layoutIcon));

  if (imageUrl || overlayColor) {
    applyLessonBackground(slide, { imageUrl, overlayColor, overlayOpacity });
  }

  const inner = document.createElement('div');
  inner.className = 'slide-inner interactive-practice-inner';
  slide.appendChild(inner);

  const header = document.createElement('header');
  header.className = 'practice-header';
  inner.appendChild(header);

  const heading = document.createElement('h2');
  heading.textContent = resolvedTitle;
  header.appendChild(heading);

  const typeBadge = document.createElement('span');
  typeBadge.className = 'practice-type';
  typeBadge.textContent = MODULE_TYPE_LABELS[resolvedType] || resolvedType;
  header.appendChild(typeBadge);

  const body = document.createElement('div');
  body.className = 'practice-body';
  inner.appendChild(body);

  const instructionSection = document.createElement('section');
  instructionSection.className = 'practice-instructions';
  if (resolvedInstructions) {
    const paragraph = document.createElement('p');
    paragraph.textContent = resolvedInstructions;
    instructionSection.appendChild(paragraph);
  } else {
    const placeholder = document.createElement('p');
    placeholder.className = 'lesson-empty';
    placeholder.textContent = 'Describe how learners should complete the activity.';
    instructionSection.appendChild(placeholder);
  }
  body.appendChild(instructionSection);

  const questionSection = document.createElement('section');
  questionSection.className = 'practice-questions';
  body.appendChild(questionSection);

  if (resolvedQuestions.length) {
    const list = document.createElement('ol');
    resolvedQuestions.forEach(({ prompt, options = [], answer }, index) => {
      const item = document.createElement('li');
      item.className = 'practice-question';
      const promptEl = document.createElement('p');
      promptEl.className = 'practice-question-text';
      promptEl.textContent = prompt || `Question ${index + 1}`;
      item.appendChild(promptEl);
      const optionList = Array.isArray(options) ? options.filter(Boolean) : [];
      if (optionList.length) {
        const optionsEl = document.createElement('ul');
        optionsEl.className = 'practice-options';
        optionList.forEach((opt) => {
          const optLi = document.createElement('li');
          optLi.textContent = opt;
          optionsEl.appendChild(optLi);
        });
        item.appendChild(optionsEl);
      }
      const answerText = trimText(answer);
      if (answerText) {
        const answerEl = document.createElement('p');
        answerEl.className = 'practice-answer';
        answerEl.textContent = `Correct: ${answerText}`;
        item.appendChild(answerEl);
      }
      list.appendChild(item);
    });
    questionSection.appendChild(list);
  } else {
    const placeholder = document.createElement('p');
    placeholder.className = 'lesson-empty';
    placeholder.textContent = 'List the prompts or stems learners will respond to.';
    questionSection.appendChild(placeholder);
  }

  const moduleArea = document.createElement('div');
  moduleArea.className = 'practice-module';
  moduleArea.dataset.role = 'practice-module-area';
  inner.appendChild(moduleArea);

  const moduleHost = document.createElement('div');
  moduleHost.className = 'practice-module-host';
  moduleHost.dataset.role = 'practice-module-host';
  moduleArea.appendChild(moduleHost);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'activity-btn';
  addBtn.dataset.action = 'add-module';
  addBtn.innerHTML =
    '<i class="fa-solid fa-puzzle-piece" aria-hidden="true"></i><span>Add interactive module</span>';
  moduleArea.appendChild(addBtn);

  return slide;
}

const LAYOUT_FACTORIES = {
  'learning-objectives': createLearningObjectivesSlide,
  'model-dialogue': createModelDialogueSlide,
  'interactive-practice': createInteractivePracticeSlide,
  'communicative-task': createCommunicativeTaskSlide,
  'pronunciation-focus': createPronunciationFocusSlide,
  reflection: createReflectionSlide,
};

const LAYOUT_METADATA = {
  'learning-objectives': {
    label: 'Learning objectives',
    description: 'Launch the lesson with skill goals and a communicative outcome.',
    callouts: [
      {
        title: 'Communicative goal chips',
        text: 'Swap the “So you can…” line to mirror the social purpose learners will attempt this week.',
      },
      {
        title: 'Goal bullets',
        text: 'Reorder or replace the three skill bullets so they match your focus skills and grammar targets.',
      },
    ],
  },
  'model-dialogue': {
    label: 'Model dialogue',
    description: 'Showcase a mentor exchange for learners to analyse and notice.',
    callouts: [
      {
        title: 'Mentor text block',
        text: 'Replace the speaker names and lines with a dialogue that echoes the context your learners will role-play.',
      },
      {
        title: 'Instruction strip',
        text: 'Tweak the instruction sentence to highlight what learners should notice or annotate while listening.',
      },
    ],
  },
  'interactive-practice': {
    label: 'Interactive practice',
    description: 'Stage auto-graded checks or collaborative practice stems.',
    callouts: [
      {
        title: 'Scaffolding list',
        text: 'Edit the prompts and answer keys, then swap the module below for a Jamboard, Jamila activity, or your own tool.',
      },
    ],
  },
  'communicative-task': {
    label: 'Communicative task',
    description: 'Guide learners through preparation, performance, and shared language support.',
    callouts: [
      {
        title: 'Scenario card',
        text: 'Refresh the scenario sentence so it evokes the real-world exchange your learners will simulate.',
      },
      {
        title: 'Scaffolding list',
        text: 'Replace the stems with functional language and follow-up questions your learners will find useful.',
      },
    ],
  },
  'pronunciation-focus': {
    label: 'Pronunciation focus',
    description: 'Surface target sounds with example words, sentences, and practice moves.',
    callouts: [
      {
        title: 'Sound targets',
        text: 'Swap the word chips for ones that match the sound pattern and stress your learners are exploring.',
      },
      {
        title: 'Practice prompt',
        text: 'Rewrite the coaching tip to reference gestures or mirrors you’ll use while drilling.',
      },
    ],
  },
  reflection: {
    label: 'Reflection',
    description: 'Close the lesson with prompts for individual or partner reflection.',
    callouts: [
      {
        title: 'Exit ticket prompts',
        text: 'Replace the bullet prompts with sentence starters or emoji scales that fit your closing routine.',
      },
    ],
  },
};

const renderLayoutCard = (layout, container) => {
  const factory = LAYOUT_FACTORIES[layout];
  const defaultsFactory = BUILDER_LAYOUT_DEFAULTS[layout];
  const metadata = LAYOUT_METADATA[layout];
  if (typeof factory !== 'function' || typeof defaultsFactory !== 'function') {
    return;
  }
  const defaults = defaultsFactory();
  const slide = factory(defaults);
  slide.classList.remove('hidden');

  const card = document.createElement('article');
  card.className = 'layout-card';

  const label = document.createElement('div');
  label.className = 'layout-label';
  const icon = document.createElement('i');
  icon.className = LAYOUT_ICON_DEFAULTS[layout] || 'fa-solid fa-border-all';
  icon.setAttribute('aria-hidden', 'true');
  label.appendChild(icon);
  const labelText = document.createElement('span');
  labelText.textContent = metadata?.label || layout;
  label.appendChild(labelText);
  card.appendChild(label);

  if (metadata?.description) {
    const description = document.createElement('p');
    description.className = 'layout-description';
    description.textContent = metadata.description;
    card.appendChild(description);
  }

  card.appendChild(slide);

  if (Array.isArray(metadata?.callouts)) {
    metadata.callouts.forEach(({ title, text }) => {
      if (!text) {
        return;
      }
      const callout = document.createElement('div');
      callout.className = 'teacher-callout';
      const calloutIcon = document.createElement('i');
      calloutIcon.className = 'fa-solid fa-lightbulb';
      calloutIcon.setAttribute('aria-hidden', 'true');
      callout.appendChild(calloutIcon);
      const copyWrap = document.createElement('div');
      if (title) {
        const heading = document.createElement('strong');
        heading.textContent = title;
        copyWrap.appendChild(heading);
      }
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      copyWrap.appendChild(paragraph);
      callout.appendChild(copyWrap);
      card.appendChild(callout);
    });
  }

  container.appendChild(card);
};

const initLayoutGallery = () => {
  const container = document.querySelector('[data-layout-gallery]');
  if (!(container instanceof HTMLElement)) {
    return;
  }
  Object.keys(LAYOUT_FACTORIES).forEach((layout) => {
    renderLayoutCard(layout, container);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLayoutGallery);
} else {
  initLayoutGallery();
}
