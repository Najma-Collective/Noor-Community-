export const LAYOUT_ICON_DEFAULTS = {
  'blank-canvas': 'fa-solid fa-border-all',
  'learning-objectives': 'fa-solid fa-bullseye',
  'model-dialogue': 'fa-solid fa-comments',
  'interactive-practice': 'fa-solid fa-list-check',
  'communicative-task': 'fa-solid fa-people-arrows',
  'pronunciation-focus': 'fa-solid fa-wave-square',
  reflection: 'fa-solid fa-moon',
  'grounding-activity': 'fa-solid fa-leaf',
  'topic-introduction': 'fa-solid fa-lightbulb',
  'guided-discovery': 'fa-solid fa-magnifying-glass',
  'creative-practice': 'fa-solid fa-paintbrush',
  'task-divider': 'fa-solid fa-flag-checkered',
  'task-reporting': 'fa-solid fa-bullhorn',
  'genre-deconstruction': 'fa-solid fa-book-open',
  'linguistic-feature-hunt': 'fa-solid fa-highlighter',
  'text-reconstruction': 'fa-solid fa-puzzle-piece',
  'jumbled-text-sequencing': 'fa-solid fa-shuffle',
  'scaffolded-joint-construction': 'fa-solid fa-people-group',
  'independent-construction-checklist': 'fa-solid fa-clipboard-check',
};

export const LAYOUT_FIELD_ICON_DEFAULTS = {
  'learning-objectives': {
    learningGoalIcon: 'fa-solid fa-bullseye',
    learningCommunicativeGoalIcon: 'fa-solid fa-comments',
  },
  'model-dialogue': {
    dialogueInstructionsIcon: 'fa-solid fa-person-chalkboard',
  },
  'guided-discovery': {
    discoveryContextIcon: 'fa-solid fa-circle-info',
    discoveryPromptsIcon: 'fa-solid fa-list-ul',
    discoveryNoticingQuestionsIcon: 'fa-solid fa-eye',
    discoveryLanguageSamplesIcon: 'fa-solid fa-quote-right',
  },
  'creative-practice': {
    creativeBriefIcon: 'fa-solid fa-lightbulb',
    creativeMaterialsIcon: 'fa-solid fa-toolbox',
    creativeMakingStepsIcon: 'fa-solid fa-gears',
    creativeSharingOptionsIcon: 'fa-solid fa-people-arrows',
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
  'grounding-activity': {
    groundingStepsIcon: 'fa-solid fa-shoe-prints',
  },
  'topic-introduction': {
    topicHookIcon: 'fa-solid fa-hand-pointer',
    topicContextIcon: 'fa-solid fa-circle-info',
    topicQuestionIcon: 'fa-solid fa-circle-question',
    topicKeyVocabularyIcon: 'fa-solid fa-spell-check',
  },
  'task-divider': {
    dividerTimingIcon: 'fa-solid fa-stopwatch',
    dividerFocusIcon: 'fa-solid fa-bullseye',
    dividerActionsIcon: 'fa-solid fa-list-check',
  },
  'task-reporting': {
    reportingGoalIcon: 'fa-solid fa-flag-checkered',
    reportingPromptsIcon: 'fa-solid fa-comments',
    reportingRolesIcon: 'fa-solid fa-user-group',
    reportingEvidenceIcon: 'fa-solid fa-magnifying-glass',
  },
  'genre-deconstruction': {
    genreTypeIcon: 'fa-solid fa-book-open',
    genrePurposeIcon: 'fa-solid fa-bullseye',
    genreFeaturesIcon: 'fa-solid fa-list',
    genreMentorTextIcon: 'fa-solid fa-feather',
  },
  'linguistic-feature-hunt': {
    featureSourceTextIcon: 'fa-solid fa-book',
    featureTargetsIcon: 'fa-solid fa-highlighter',
    featureReflectionIcon: 'fa-solid fa-lightbulb',
  },
  'text-reconstruction': {
    reconstructionContextIcon: 'fa-solid fa-circle-info',
    reconstructionStepsIcon: 'fa-solid fa-list-ol',
    reconstructionSegmentsIcon: 'fa-solid fa-table-columns',
  },
  'jumbled-text-sequencing': {
    sequencingInstructionsIcon: 'fa-solid fa-circle-play',
    sequencingSegmentsIcon: 'fa-solid fa-bars',
    sequencingSupportTipsIcon: 'fa-solid fa-lightbulb',
  },
  'scaffolded-joint-construction': {
    jointMentorIcon: 'fa-solid fa-chalkboard-user',
    jointSharedOutcomeIcon: 'fa-solid fa-people-group',
    jointTeacherMovesIcon: 'fa-solid fa-person-chalkboard',
    jointLearnerMovesIcon: 'fa-solid fa-people-line',
  },
  'independent-construction-checklist': {
    checklistReminderIcon: 'fa-solid fa-bell',
    checklistItemsIcon: 'fa-solid fa-square-check',
    checklistStretchIcon: 'fa-solid fa-mountain',
  },
};

export const getLayoutFieldIconDefault = (layout, field) => {
  const layoutDefaults = LAYOUT_FIELD_ICON_DEFAULTS[layout];
  const defaultClass = layoutDefaults?.[field];
  return typeof defaultClass === 'string' ? defaultClass : '';
};

export const SLIDE_TEMPLATE_MODIFIERS = {
  'blank-canvas': [
    {
      id: 'stageAlignment',
      label: 'Stage alignment',
      appliesTo: 'stage',
      defaultValue: 'top',
      options: [
        { value: 'top', label: 'Top aligned', classes: [] },
        { value: 'center', label: 'Centered', classes: ['is-centered-stage'] },
      ],
    },
    {
      id: 'contentAlignment',
      label: 'Content alignment',
      appliesTo: 'inner',
      defaultValue: 'start',
      options: [
        { value: 'start', label: 'Left', classes: ['align-start'] },
        { value: 'center', label: 'Center', classes: ['align-center'] },
        { value: 'end', label: 'Right', classes: ['align-end'] },
      ],
    },
  ],
  'title-full-image': [
    {
      id: 'stageAlignment',
      label: 'Stage alignment',
      appliesTo: 'stage',
      defaultValue: 'center',
      options: [
        { value: 'top', label: 'Top aligned', classes: [] },
        { value: 'center', label: 'Centered', classes: ['is-centered-stage'] },
      ],
    },
    {
      id: 'contentAlignment',
      label: 'Content alignment',
      appliesTo: 'inner',
      defaultValue: 'center',
      options: [
        { value: 'start', label: 'Left', classes: ['align-start'] },
        { value: 'center', label: 'Center', classes: ['align-center'] },
        { value: 'end', label: 'Right', classes: ['align-end'] },
      ],
    },
    {
      id: 'overlayAlignment',
      label: 'Overlay alignment',
      appliesTo: '.bg-content',
      defaultValue: 'center',
      options: [
        { value: 'left', label: 'Left overlay', classes: ['overlay-align-left'] },
        { value: 'center', label: 'Center overlay', classes: ['overlay-align-center'] },
        { value: 'right', label: 'Right overlay', classes: ['overlay-align-right'] },
      ],
    },
    {
      id: 'overlayTheme',
      label: 'Overlay card theme',
      appliesTo: '.overlay-card',
      defaultValue: 'deep',
      options: [
        { value: 'deep', label: 'Deep glass', classes: [] },
        { value: 'light', label: 'Light glass', classes: ['is-light'] },
        { value: 'centered', label: 'Centered copy', classes: ['centered'] },
      ],
    },
    {
      id: 'imageOverlay',
      label: 'Image overlay',
      appliesTo: '.img-overlay',
      defaultValue: 'soft',
      options: [
        { value: 'dark', label: 'Deep', classes: ['overlay-dark'] },
        { value: 'soft', label: 'Soft dark', classes: ['overlay-soft-dark'] },
        { value: 'light', label: 'Light', classes: ['overlay-light'] },
        { value: 'none', label: 'None', classes: ['overlay-none'] },
      ],
    },
  ],
  'title-single-column': [
    {
      id: 'stageAlignment',
      label: 'Stage alignment',
      appliesTo: 'stage',
      defaultValue: 'top',
      options: [
        { value: 'top', label: 'Top aligned', classes: [] },
        { value: 'center', label: 'Centered', classes: ['is-centered-stage'] },
      ],
    },
    {
      id: 'contentAlignment',
      label: 'Content alignment',
      appliesTo: 'inner',
      defaultValue: 'start',
      options: [
        { value: 'start', label: 'Left', classes: ['align-start'] },
        { value: 'center', label: 'Center', classes: ['align-center'] },
        { value: 'end', label: 'Right', classes: ['align-end'] },
      ],
    },
    {
      id: 'subtitleSize',
      label: 'Subtitle size',
      appliesTo: '.deck-subtitle',
      defaultValue: 'base',
      options: [
        { value: 'base', label: 'Default', classes: [] },
        { value: 'large', label: 'Large', classes: ['text-step-1'] },
        { value: 'small', label: 'Small', classes: ['text-step--1'] },
      ],
    },
  ],
  'title-two-columns': [
    {
      id: 'stageAlignment',
      label: 'Stage alignment',
      appliesTo: 'stage',
      defaultValue: 'top',
      options: [
        { value: 'top', label: 'Top aligned', classes: [] },
        { value: 'center', label: 'Centered', classes: ['is-centered-stage'] },
      ],
    },
    {
      id: 'gridAlignment',
      label: 'Column alignment',
      appliesTo: '.two-column-grid',
      defaultValue: 'start',
      options: [
        { value: 'start', label: 'Top', classes: ['grid-align-start'] },
        { value: 'center', label: 'Center', classes: ['grid-align-center'] },
      ],
    },
    {
      id: 'gridJustify',
      label: 'Column justification',
      appliesTo: '.two-column-grid',
      defaultValue: 'stretch',
      options: [
        { value: 'stretch', label: 'Stretch', classes: [] },
        { value: 'centered', label: 'Centered', classes: ['grid-justify-center'] },
      ],
    },
  ],
  'title-three-columns': [
    {
      id: 'stageAlignment',
      label: 'Stage alignment',
      appliesTo: 'stage',
      defaultValue: 'top',
      options: [
        { value: 'top', label: 'Top aligned', classes: [] },
        { value: 'center', label: 'Centered', classes: ['is-centered-stage'] },
      ],
    },
    {
      id: 'gridAlignment',
      label: 'Card alignment',
      appliesTo: '.grid-align-start, .grid-align-center',
      defaultValue: 'start',
      options: [
        { value: 'start', label: 'Top', classes: ['grid-align-start'] },
        { value: 'center', label: 'Center', classes: ['grid-align-center'] },
      ],
    },
    {
      id: 'gridJustify',
      label: 'Card justification',
      appliesTo: '.grid-justify-center',
      defaultValue: 'stretch',
      options: [
        { value: 'stretch', label: 'Stretch', classes: [] },
        { value: 'centered', label: 'Centered', classes: ['grid-justify-center'] },
      ],
    },
  ],
  'titled-items': [
    {
      id: 'stageAlignment',
      label: 'Stage alignment',
      appliesTo: 'stage',
      defaultValue: 'top',
      options: [
        { value: 'top', label: 'Top aligned', classes: [] },
        { value: 'center', label: 'Centered', classes: ['is-centered-stage'] },
      ],
    },
    {
      id: 'contentAlignment',
      label: 'Content alignment',
      appliesTo: 'inner',
      defaultValue: 'start',
      options: [
        { value: 'start', label: 'Left', classes: ['align-start'] },
        { value: 'center', label: 'Center', classes: ['align-center'] },
        { value: 'end', label: 'Right', classes: ['align-end'] },
      ],
    },
    {
      id: 'itemSize',
      label: 'Item size',
      appliesTo: '.flow-list, .ordered-list',
      defaultValue: 'base',
      options: [
        { value: 'base', label: 'Default', classes: [] },
        { value: 'compact', label: 'Compact', classes: ['text-step--1'] },
        { value: 'large', label: 'Large', classes: ['text-step-1'] },
      ],
    },
  ],
  'simple-text': [
    {
      id: 'stageAlignment',
      label: 'Stage alignment',
      appliesTo: 'stage',
      defaultValue: 'top',
      options: [
        { value: 'top', label: 'Top aligned', classes: [] },
        { value: 'center', label: 'Centered', classes: ['is-centered-stage'] },
      ],
    },
    {
      id: 'contentAlignment',
      label: 'Content alignment',
      appliesTo: 'inner',
      defaultValue: 'start',
      options: [
        { value: 'start', label: 'Left', classes: ['align-start'] },
        { value: 'center', label: 'Center', classes: ['align-center'] },
        { value: 'end', label: 'Right', classes: ['align-end'] },
      ],
    },
    {
      id: 'textScale',
      label: 'Text size',
      appliesTo: '.slide-inner',
      defaultValue: 'base',
      options: [
        { value: 'base', label: 'Body', classes: [] },
        { value: 'large', label: 'Large', classes: ['text-step-1'] },
        { value: 'headline', label: 'Headline', classes: ['text-step-2'] },
      ],
    },
    {
      id: 'textEmphasis',
      label: 'Text emphasis',
      appliesTo: '.slide-inner',
      defaultValue: 'regular',
      options: [
        { value: 'regular', label: 'Regular', classes: [] },
        { value: 'italic', label: 'Italic', classes: ['text-italic'] },
      ],
    },
  ],
};

export const BUILDER_LAYOUT_DEFAULTS = {
  'blank-canvas': () => ({}),
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
    instructions:
      "In pairs, identify the two main questions and how the speakers answer them.",
    instructionsIcon: getLayoutFieldIconDefault(
      'model-dialogue',
      'dialogueInstructionsIcon',
    ),
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
    activityType: 'Gap Fill',
    activityTypeIcon: getLayoutFieldIconDefault(
      'interactive-practice',
      'practiceActivityTypeIcon',
    ),
    title: 'Practice',
    instructions: 'Complete each sentence with the best option.',
    instructionsIcon: getLayoutFieldIconDefault(
      'interactive-practice',
      'practiceInstructionsIcon',
    ),
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
    scaffoldingIcon: getLayoutFieldIconDefault(
      'communicative-task',
      'taskScaffoldingIcon',
    ),
    overlayColor: 'color-mix(in srgb, var(--deep-forest) 78%, transparent)',
    overlayOpacity: 36,
  }),
  'pronunciation-focus': () => ({
    icon: LAYOUT_ICON_DEFAULTS['pronunciation-focus'],
    title: 'What does /st/ sound like?',
    target: '/st/ sound',
    targetIcon: getLayoutFieldIconDefault(
      'pronunciation-focus',
      'pronunciationTargetIcon',
    ),
    words: ['student', 'study'],
    wordsIcon: getLayoutFieldIconDefault(
      'pronunciation-focus',
      'pronunciationWordsIcon',
    ),
    sentences: ['Are you a student? ↗', "We start at six o'clock. ↘"],
    sentencesIcon: getLayoutFieldIconDefault(
      'pronunciation-focus',
      'pronunciationSentencesIcon',
    ),
    practice:
      'Invite 3-4 learners to say the sentences, then personalise with their own ideas.',
    practiceIcon: getLayoutFieldIconDefault(
      'pronunciation-focus',
      'pronunciationPracticeIcon',
    ),
    imageUrl:
      'https://images.pexels.com/photos/5905711/pexels-photo-5905711.jpeg?auto=compress&cs=tinysrgb&w=1600',
    overlayColor: 'color-mix(in srgb, var(--primary-sage) 35%, var(--deep-forest) 65%)',
    overlayOpacity: 40,
  }),
  reflection: () => ({
    icon: LAYOUT_ICON_DEFAULTS.reflection,
    title: 'Reflection',
    prompts: ['A classmate’s name', 'A place in Palestine', 'A job'],
    promptsIcon: getLayoutFieldIconDefault('reflection', 'reflectionPromptsIcon'),
    imageUrl:
      'https://images.pexels.com/photos/4144226/pexels-photo-4144226.jpeg?auto=compress&cs=tinysrgb&w=1600',
    overlayColor: 'color-mix(in srgb, var(--deep-forest) 70%, transparent)',
    overlayOpacity: 38,
  }),
  'grounding-activity': () => ({
    icon: LAYOUT_ICON_DEFAULTS['grounding-activity'],
    title: 'Grounding activity',
    subtitle: 'Arrive in the room',
    steps: [
      'Take a steady breath in for four counts.',
      'Hold gently for two counts, then exhale for six.',
      'Name one thing you can see, hear, and feel right now.',
    ],
    stepsIcon: getLayoutFieldIconDefault('grounding-activity', 'groundingStepsIcon'),
    imageUrl: '',
    overlayColor: '#10352c',
    overlayOpacity: 45,
  }),
  'topic-introduction': () => ({
    icon: LAYOUT_ICON_DEFAULTS['topic-introduction'],
    title: 'Today we explore',
    hook: 'What projects build thriving communities?',
    hookIcon: getLayoutFieldIconDefault('topic-introduction', 'topicHookIcon'),
    context: 'Learners will connect the lesson theme to local initiatives.',
    contextIcon: getLayoutFieldIconDefault('topic-introduction', 'topicContextIcon'),
    essentialQuestion: 'How can communities design projects that last?',
    essentialQuestionIcon: getLayoutFieldIconDefault(
      'topic-introduction',
      'topicQuestionIcon',
    ),
    keyVocabulary: ['sustainable', 'stakeholders', 'implementation'],
    keyVocabularyIcon: getLayoutFieldIconDefault(
      'topic-introduction',
      'topicKeyVocabularyIcon',
    ),
    imageUrl: '',
    overlayColor: '#152a41',
    overlayOpacity: 42,
  }),
  'guided-discovery': () => ({
    icon: LAYOUT_ICON_DEFAULTS['guided-discovery'],
    title: 'Guided discovery',
    context: 'Learners examine a short text and notice language patterns.',
    contextIcon: getLayoutFieldIconDefault('guided-discovery', 'discoveryContextIcon'),
    discoveryPrompts: [
      'Read the exchange twice. Underline what the speakers are doing.',
      'Circle verbs that come directly after reporting verbs.',
    ],
    discoveryPromptsIcon: getLayoutFieldIconDefault(
      'guided-discovery',
      'discoveryPromptsIcon',
    ),
    noticingQuestions: [
      'What tense do the reporting verbs take?',
      'How does the writer show uncertainty or hesitation?',
    ],
    noticingQuestionsIcon: getLayoutFieldIconDefault(
      'guided-discovery',
      'discoveryNoticingQuestionsIcon',
    ),
    sampleLanguage: [
      'They suggested starting with a community survey.',
      'We might consider inviting local youth groups.',
    ],
    sampleLanguageIcon: getLayoutFieldIconDefault(
      'guided-discovery',
      'discoveryLanguageSamplesIcon',
    ),
    imageUrl: '',
    overlayColor: '#2b293f',
    overlayOpacity: 36,
  }),
  'creative-practice': () => ({
    icon: LAYOUT_ICON_DEFAULTS['creative-practice'],
    title: 'Creative practice',
    brief: 'Teams design a solution prototype using the target language.',
    briefIcon: getLayoutFieldIconDefault('creative-practice', 'creativeBriefIcon'),
    materials: ['Large paper', 'Markers', 'Sticky notes'],
    materialsIcon: getLayoutFieldIconDefault(
      'creative-practice',
      'creativeMaterialsIcon',
    ),
    makingSteps: [
      'Sketch your idea and label key features in English.',
      'Write a short pitch sentence using the lesson language.',
    ],
    makingStepsIcon: getLayoutFieldIconDefault(
      'creative-practice',
      'creativeMakingStepsIcon',
    ),
    sharingOptions: [
      'Gallery walk with peer feedback.',
      'Quick 60-second pitch to another team.',
    ],
    sharingOptionsIcon: getLayoutFieldIconDefault(
      'creative-practice',
      'creativeSharingOptionsIcon',
    ),
    imageUrl: '',
    overlayColor: '#4b1f2c',
    overlayOpacity: 38,
  }),
  'task-divider': () => ({
    icon: LAYOUT_ICON_DEFAULTS['task-divider'],
    title: 'Task cycle',
    subtitle: 'Before you speak',
    timing: '5 minutes',
    timingIcon: getLayoutFieldIconDefault('task-divider', 'dividerTimingIcon'),
    focus: 'Plan the approach with your partner.',
    focusIcon: getLayoutFieldIconDefault('task-divider', 'dividerFocusIcon'),
    actions: [
      'Skim the prompt together and clarify unknown words.',
      'Agree on who will start and how you will share the time.',
    ],
    actionsIcon: getLayoutFieldIconDefault('task-divider', 'dividerActionsIcon'),
    imageUrl: '',
    overlayColor: '#1f2d3a',
    overlayOpacity: 28,
  }),
  'task-reporting': () => ({
    icon: LAYOUT_ICON_DEFAULTS['task-reporting'],
    title: 'Task reporting',
    goal: 'Share highlights from your conversations.',
    goalIcon: getLayoutFieldIconDefault('task-reporting', 'reportingGoalIcon'),
    prompts: [
      'What solution did your partner propose?',
      'Which detail surprised you and why?',
    ],
    promptsIcon: getLayoutFieldIconDefault('task-reporting', 'reportingPromptsIcon'),
    roles: [
      { label: 'Facilitator', value: 'Keep the share-out moving and invite quieter voices.' },
      { label: 'Notetaker', value: 'Capture one quote per speaker.' },
    ],
    rolesIcon: getLayoutFieldIconDefault('task-reporting', 'reportingRolesIcon'),
    evidence: ['Summaries on sticky notes', 'Group reflection photo'],
    evidenceIcon: getLayoutFieldIconDefault('task-reporting', 'reportingEvidenceIcon'),
    imageUrl: '',
    overlayColor: '#2a3b2c',
    overlayOpacity: 32,
  }),
  'genre-deconstruction': () => ({
    icon: LAYOUT_ICON_DEFAULTS['genre-deconstruction'],
    title: 'Genre deconstruction',
    genre: 'Community proposal email',
    genreIcon: getLayoutFieldIconDefault('genre-deconstruction', 'genreTypeIcon'),
    purpose: 'Notice how writers persuade funders.',
    purposeIcon: getLayoutFieldIconDefault('genre-deconstruction', 'genrePurposeIcon'),
    features: [
      { label: 'Opening move', value: 'Warm greeting plus appreciation.' },
      { label: 'Problem framing', value: 'Connect to a specific local need.' },
      { label: 'Call to action', value: 'Invite next steps with a clear ask.' },
    ],
    featuresIcon: getLayoutFieldIconDefault('genre-deconstruction', 'genreFeaturesIcon'),
    mentorText: 'Dear Sawsan, thank you for meeting with our learners this month...',
    mentorTextIcon: getLayoutFieldIconDefault('genre-deconstruction', 'genreMentorTextIcon'),
    imageUrl: '',
    overlayColor: '#263141',
    overlayOpacity: 34,
  }),
  'linguistic-feature-hunt': () => ({
    icon: LAYOUT_ICON_DEFAULTS['linguistic-feature-hunt'],
    title: 'Feature hunt',
    sourceText:
      '“Our neighbourhood garden thrives because volunteers coordinate watering schedules and compost pickups.”',
    sourceTextIcon: getLayoutFieldIconDefault(
      'linguistic-feature-hunt',
      'featureSourceTextIcon',
    ),
    targets: ['Verbs that show collaboration', 'Phrases that signal cause and effect'],
    targetsIcon: getLayoutFieldIconDefault('linguistic-feature-hunt', 'featureTargetsIcon'),
    reflection: ['Which phrases could you recycle for your own project pitch?'],
    reflectionIcon: getLayoutFieldIconDefault('linguistic-feature-hunt', 'featureReflectionIcon'),
    imageUrl: '',
    overlayColor: '#2f3446',
    overlayOpacity: 32,
  }),
  'text-reconstruction': () => ({
    icon: LAYOUT_ICON_DEFAULTS['text-reconstruction'],
    title: 'Rebuild the text',
    context: 'Learners reorganise sentence strips to rebuild a short memo.',
    contextIcon: getLayoutFieldIconDefault('text-reconstruction', 'reconstructionContextIcon'),
    steps: [
      'Read each strip aloud and identify keywords.',
      'Match sentence starters with logical endings.',
    ],
    stepsIcon: getLayoutFieldIconDefault('text-reconstruction', 'reconstructionStepsIcon'),
    segments: ['First, gather input from youth councils.', 'Then draft a one-page summary for the mayor.'],
    segmentsIcon: getLayoutFieldIconDefault('text-reconstruction', 'reconstructionSegmentsIcon'),
    imageUrl: '',
    overlayColor: '#263141',
    overlayOpacity: 34,
  }),
  'jumbled-text-sequencing': () => ({
    icon: LAYOUT_ICON_DEFAULTS['jumbled-text-sequencing'],
    title: 'Sequence the jumbled text',
    instructions: 'Work in teams to put the statements back into order.',
    instructionsIcon: getLayoutFieldIconDefault(
      'jumbled-text-sequencing',
      'sequencingInstructionsIcon',
    ),
    segments: [
      'The youth group surveyed families about local needs.',
      'They prioritised safe transport to after-school programmes.',
      'Volunteers mapped routes and scheduled drivers.',
    ],
    segmentsIcon: getLayoutFieldIconDefault(
      'jumbled-text-sequencing',
      'sequencingSegmentsIcon',
    ),
    supportTips: [
      'Look for time connectives that give clues.',
      'Check pronoun references before finalising.',
    ],
    supportTipsIcon: getLayoutFieldIconDefault(
      'jumbled-text-sequencing',
      'sequencingSupportTipsIcon',
    ),
    imageUrl: '',
    overlayColor: '#2f233c',
    overlayOpacity: 26,
  }),
  'scaffolded-joint-construction': () => ({
    icon: LAYOUT_ICON_DEFAULTS['scaffolded-joint-construction'],
    title: 'Scaffolded joint construction',
    mentorFocus: 'Mentor text: project proposal introduction',
    mentorFocusIcon: getLayoutFieldIconDefault(
      'scaffolded-joint-construction',
      'jointMentorIcon',
    ),
    sharedOutcome: 'Draft the opening paragraph together.',
    sharedOutcomeIcon: getLayoutFieldIconDefault(
      'scaffolded-joint-construction',
      'jointSharedOutcomeIcon',
    ),
    teacherMoves: [
      'Think aloud to model paragraph planning.',
      'Invite learners to suggest precise vocabulary.',
    ],
    teacherMovesIcon: getLayoutFieldIconDefault(
      'scaffolded-joint-construction',
      'jointTeacherMovesIcon',
    ),
    learnerMoves: [
      'Offer phrases that mirror the mentor text.',
      'Negotiate sentence order with your group.',
    ],
    learnerMovesIcon: getLayoutFieldIconDefault(
      'scaffolded-joint-construction',
      'jointLearnerMovesIcon',
    ),
    imageUrl: '',
    overlayColor: '#213329',
    overlayOpacity: 28,
  }),
  'independent-construction-checklist': () => ({
    icon: LAYOUT_ICON_DEFAULTS['independent-construction-checklist'],
    title: 'Independent construction',
    reminder: 'Use the checklist while drafting your text.',
    reminderIcon: getLayoutFieldIconDefault(
      'independent-construction-checklist',
      'checklistReminderIcon',
    ),
    checklist: [
      'State the community challenge clearly.',
      'Reference at least one stakeholder perspective.',
      'Close with a hopeful call to action.',
    ],
    checklistIcon: getLayoutFieldIconDefault(
      'independent-construction-checklist',
      'checklistItemsIcon',
    ),
    stretchGoals: ['Add a compelling statistic.', 'Include a direct learner quote.'],
    stretchGoalsIcon: getLayoutFieldIconDefault(
      'independent-construction-checklist',
      'checklistStretchIcon',
    ),
    imageUrl: '',
    overlayColor: '#2a2f27',
    overlayOpacity: 22,
  }),
};

