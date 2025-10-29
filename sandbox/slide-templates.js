import archetypeConfig from './config/archetypes.json' assert { type: 'json' };

export const LAYOUT_ICON_DEFAULTS = {
  'blank-canvas': 'fa-solid fa-border-all',
  'learning-objectives': 'fa-solid fa-bullseye',
  'topic-introduction': 'fa-solid fa-lightbulb',
  'grounding-activity': 'fa-solid fa-leaf',
  'communicative-task': 'fa-solid fa-people-group',
  'interactive-practice': 'fa-solid fa-puzzle-piece',
  'task-reporting': 'fa-solid fa-bullhorn',
  reflection: 'fa-solid fa-moon',
  'card-stack': 'fa-solid fa-layer-group',
  'pill-with-gallery': 'fa-solid fa-images',
};

export const LAYOUT_FIELD_ICON_DEFAULTS = {
  'learning-objectives': {
    learningGoalIcon: 'fa-solid fa-crosshairs',
    learningCommunicativeGoalIcon: 'fa-solid fa-comments',
  },
  'topic-introduction': {
    topicHookIcon: 'fa-solid fa-sparkles',
    topicContextIcon: 'fa-solid fa-location-dot',
    topicQuestionIcon: 'fa-solid fa-circle-question',
    topicKeyVocabularyIcon: 'fa-solid fa-highlighter',
  },
  'grounding-activity': {
    groundingStepsIcon: 'fa-solid fa-seedling',
  },
  'communicative-task': {
    taskPreparationIcon: 'fa-solid fa-list-check',
    taskPerformanceIcon: 'fa-solid fa-people-arrows',
    taskScaffoldingIcon: 'fa-solid fa-language',
  },
  'interactive-practice': {
    practiceInstructionsIcon: 'fa-solid fa-chalkboard-user',
    practiceActivityTypeIcon: 'fa-solid fa-puzzle-piece',
  },
  'task-reporting': {
    reportingGoalIcon: 'fa-solid fa-flag-checkered',
    reportingPromptsIcon: 'fa-solid fa-microphone-lines',
    reportingRolesIcon: 'fa-solid fa-user-group',
    reportingEvidenceIcon: 'fa-solid fa-clipboard-check',
  },
  reflection: {
    reflectionPromptsIcon: 'fa-solid fa-pen-to-square',
  },
  'card-stack': {
    cardStackPillIcon: 'fa-solid fa-bookmark',
    cardStackItemIcon: 'fa-solid fa-circle-dot',
  },
  'pill-with-gallery': {
    pillGalleryPillIcon: 'fa-solid fa-camera-retro',
    pillGalleryItemIcon: 'fa-solid fa-image',
  },
};

export const getLayoutFieldIconDefault = (layout, field) =>
  LAYOUT_FIELD_ICON_DEFAULTS?.[layout]?.[field] ?? '';

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
  'card-stack': [
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
      id: 'stackDensity',
      label: 'Card spacing',
      appliesTo: 'inner',
      defaultValue: 'default',
      options: [
        { value: 'default', label: 'Comfortable', classes: ['stack-md'] },
        { value: 'tight', label: 'Compact', classes: ['stack-tight'] },
        { value: 'roomy', label: 'Roomy', classes: ['stack-lg'] },
      ],
    },
  ],
  'pill-with-gallery': [
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
      id: 'galleryAlignment',
      label: 'Gallery alignment',
      appliesTo: 'inner',
      defaultValue: 'start',
      options: [
        { value: 'start', label: 'Left', classes: ['align-start'] },
        { value: 'center', label: 'Center', classes: ['align-center'] },
      ],
    },
  ],
};

export const BUILDER_LAYOUT_DEFAULTS = {
  'blank-canvas': () => ({}),
  'learning-objectives': () => ({
    title: 'Lesson aims · Community pitch clinic',
    goals: [
      'Name one strength and one stretch move in a peer pitch.',
      'Use distancing language to soften critiques respectfully.',
      'Capture next-step notes that teams can act on tomorrow.',
    ],
    goalIcon: 'fa-solid fa-crosshairs',
    communicativeGoal: 'coach a partner toward a sharper community solution.',
    communicativeGoalIcon: 'fa-solid fa-comments',
    imageUrl:
      'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600',
    overlayColor: 'rgba(18, 39, 33, 0.82)',
    overlayOpacity: 0.68,
  }),
  'topic-introduction': () => ({
    title: 'Launch the plaza design sprint',
    hook: 'Nablus teens get one weekend to reimagine the civic square.',
    hookIcon: 'fa-solid fa-sparkles',
    context: 'Studio teams will storyboard pop-up ideas before dawn tomorrow.',
    contextIcon: 'fa-solid fa-location-dot',
    essentialQuestion: 'How might we invite younger children into the makerspace plaza?',
    essentialQuestionIcon: 'fa-solid fa-circle-question',
    keyVocabulary: ['prototype loop', 'mentor hour', 'impact journal'],
    keyVocabularyIcon: 'fa-solid fa-highlighter',
    imageUrl:
      'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600',
    overlayColor: 'rgba(18, 39, 33, 0.78)',
    overlayOpacity: 0.6,
  }),
  'grounding-activity': () => ({
    title: 'Arrive + breathe',
    subtitle: 'Invite calm focus before the design stand-up.',
    steps: [
      'Plant both feet, soften your shoulders, and inhale for four counts.',
      'Hold the breath for four counts while you notice one sound nearby.',
      'Exhale slowly for six counts while picturing tonight\'s small success.',
      'Share one word in the chat that names the energy you want to bring.',
    ],
    stepsIcon: 'fa-solid fa-seedling',
    overlayColor: 'rgba(17, 43, 33, 0.55)',
    overlayOpacity: 0.35,
  }),
  'communicative-task': () => ({
    title: 'Community interview walk',
    preparation:
      'Meet the organiser from the youth centre who requested this sprint.\nSkim the partner brief and highlight any missing context.',
    preparationIcon: 'fa-solid fa-list-check',
    performance:
      'Interview the organiser in pairs. Capture quotes that reveal needs, tensions, and hopeful outcomes.',
    performanceIcon: 'fa-solid fa-people-arrows',
    scaffolding: [
      'Could you tell us about a moment when the plaza felt most alive?',
      'What would success look like by the end of next month?',
      'Which community members still feel invisible in current plans?',
    ],
    scaffoldingIcon: 'fa-solid fa-language',
    imageUrl:
      'https://images.pexels.com/photos/2422259/pexels-photo-2422259.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600',
    overlayColor: 'rgba(21, 44, 35, 0.62)',
    overlayOpacity: 0.52,
  }),
  'interactive-practice': () => ({
    title: 'Checkpoint · mentor huddle',
    instructions:
      'Skim the prompts with your table, choose the response that best reflects the sprint evidence, then queue an interactive module if you want to extend.',
    instructionsIcon: 'fa-solid fa-chalkboard-user',
    activityType: 'multiple-choice',
    activityTypeIcon: 'fa-solid fa-puzzle-piece',
    questions: [
      {
        prompt: 'Which student move most clearly demonstrates iteration?',
        options: [
          'They describe the original plan without changes.',
          'They compare draft one with the latest prototype photos.',
          'They promise to make edits later tonight.',
        ],
        answer: 'They compare draft one with the latest prototype photos.',
      },
      {
        prompt: 'What should the mentor spotlight during share-outs?',
        options: [
          'Moments when teams reframed the user need.',
          'How quickly teams finished their slides.',
          'Who spoke the longest in each group.',
        ],
        answer: 'Moments when teams reframed the user need.',
      },
    ],
  }),
  'task-reporting': () => ({
    title: 'Sprint share-out',
    goal: 'Celebrate one bold revision and invite targeted peer feedback.',
    goalIcon: 'fa-solid fa-flag-checkered',
    prompts: [
      'State your user insight in one sentence.',
      'Show the before/after slide that changed your direction.',
      'Name the next experiment you will run before showcase day.',
    ],
    promptsIcon: 'fa-solid fa-microphone-lines',
    roles: [
      { label: 'Presenter', value: 'Narrates the update and cues feedback.' },
      { label: 'Note taker', value: 'Logs kudos, questions, and commitments.' },
      { label: 'Timekeeper', value: 'Keeps the round to four focused minutes.' },
    ],
    rolesIcon: 'fa-solid fa-user-group',
    evidence: [
      'Capture one quote that proves impact.',
      'Screenshot any sketch or prototype you mention.',
      'Log which badge your team unlocked this round.',
    ],
    evidenceIcon: 'fa-solid fa-clipboard-check',
    overlayColor: 'rgba(25, 52, 40, 0.55)',
    overlayOpacity: 0.48,
  }),
  reflection: () => ({
    title: '3-2-1 close-out',
    prompts: [
      '3 wins your team saw in today\'s mentoring loop.',
      '2 questions you still want the partner to answer.',
      '1 micro-goal you\'ll tackle before tomorrow\'s studio.',
    ],
    promptsIcon: 'fa-solid fa-pen-to-square',
  }),
  'card-stack': () => ({
    pill: 'Studio sprint stack',
    pillIcon: 'fa-solid fa-bookmark',
    title: 'Preview the next build moves',
    description:
      'Skim the stack to confirm the workflow: prep the sprint, collect field notes, and plan the next showcase.',
    cardIcon: 'fa-solid fa-circle-dot',
    cards: [
      {
        title: 'Prototype ready check',
        description: 'List the build, blockers, and final tweaks teams need before sharing.',
      },
      {
        title: 'Feedback carousel',
        description: 'Identify which peers will rotate through and the lens they should use while observing.',
      },
      {
        title: 'Evidence capture',
        description: 'Note the artefacts, quotes, or data teams will collect to prove the sprint worked.',
      },
    ],
  }),
  'pill-with-gallery': () => ({
    pill: 'Scenario spotlight',
    pillIcon: 'fa-solid fa-camera-retro',
    title: 'Ground the challenge with vivid artefacts',
    description:
      'Pair the scenario pill with a gallery of in-sprint visuals so learners can orient quickly and see real momentum.',
    itemIcon: 'fa-solid fa-image',
    gallery: [
      {
        image:
          'https://images.pexels.com/photos/1181265/pexels-photo-1181265.jpeg?auto=compress&cs=tinysrgb&h=650&w=980',
        alt: 'Students discussing project notes around a table',
        caption: 'Sprint briefing · Teams outline the user need and pitch rapid ideas.',
      },
      {
        image:
          'https://images.pexels.com/photos/3182765/pexels-photo-3182765.jpeg?auto=compress&cs=tinysrgb&h=650&w=980',
        alt: 'Prototype sketches spread across a worktable',
        caption: 'Iteration lab · Capture early prototypes with quick annotations.',
      },
      {
        image:
          'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&h=650&w=980',
        alt: 'Learner presenting to peers with a laptop in hand',
        caption: 'Gallery walk · Highlight how teams narrate impact evidence.',
      },
    ],
  }),
};

const ARCHETYPE_DEFAULT_FACTORIES = {
  'hero-overlay-intro': () => ({
    layout: 'topic-introduction',
    data: BUILDER_LAYOUT_DEFAULTS['topic-introduction'](),
  }),
  'grounding-ritual': () => ({
    layout: 'grounding-activity',
    data: BUILDER_LAYOUT_DEFAULTS['grounding-activity'](),
  }),
  'lesson-aims': () => ({
    layout: 'learning-objectives',
    data: BUILDER_LAYOUT_DEFAULTS['learning-objectives'](),
  }),
  'scenario-with-media': () => ({
    layout: 'communicative-task',
    data: BUILDER_LAYOUT_DEFAULTS['communicative-task'](),
  }),
  'interactive-checkpoint': () => ({
    layout: 'interactive-practice',
    data: BUILDER_LAYOUT_DEFAULTS['interactive-practice'](),
  }),
  'task-report': () => ({
    layout: 'task-reporting',
    data: BUILDER_LAYOUT_DEFAULTS['task-reporting'](),
  }),
  'reflection-321': () => ({
    layout: 'reflection',
    data: BUILDER_LAYOUT_DEFAULTS.reflection(),
  }),
  'card-stack': () => ({
    layout: 'card-stack',
    data: BUILDER_LAYOUT_DEFAULTS['card-stack'](),
  }),
  'pill-gallery': () => ({
    layout: 'pill-with-gallery',
    data: BUILDER_LAYOUT_DEFAULTS['pill-with-gallery'](),
  }),
};

export const ARCHETYPE_LIBRARY = Object.freeze(
  (Array.isArray(archetypeConfig?.archetypes) ? archetypeConfig.archetypes : []).map((entry) => ({
    ...entry,
    layout: entry.layout,
  })),
);

export const getArchetypeTemplate = (id) => {
  const factory = ARCHETYPE_DEFAULT_FACTORIES[id];
  if (typeof factory !== 'function') {
    return null;
  }
  try {
    const state = factory();
    return {
      id,
      ...state,
    };
  } catch (error) {
    console.warn('Unable to generate archetype defaults', id, error);
    return null;
  }
};

export const listArchetypeIds = () => Object.keys(ARCHETYPE_DEFAULT_FACTORIES);
