export const LAYOUT_ICON_DEFAULTS = {
  'blank-canvas': 'fa-solid fa-border-all',
  'learning-objectives': 'fa-solid fa-bullseye',
  'model-dialogue': 'fa-solid fa-comments',
  'interactive-practice': 'fa-solid fa-puzzle-piece',
  'communicative-task': 'fa-solid fa-people-arrows',
  'pronunciation-focus': 'fa-solid fa-wave-square',
  reflection: 'fa-solid fa-lightbulb',
  'grounding-activity': 'fa-solid fa-spa',
  'topic-introduction': 'fa-solid fa-compass',
  'guided-discovery': 'fa-solid fa-magnifying-glass',
  'creative-practice': 'fa-solid fa-paintbrush',
  'task-divider': 'fa-solid fa-flag-checkered',
  'task-reporting': 'fa-solid fa-clipboard-list',
  'genre-deconstruction': 'fa-solid fa-book-open',
  'linguistic-feature-hunt': 'fa-solid fa-binoculars',
  'text-reconstruction': 'fa-solid fa-layer-group',
  'jumbled-text-sequencing': 'fa-solid fa-shuffle',
  'scaffolded-joint-construction': 'fa-solid fa-people-group',
  'independent-construction-checklist': 'fa-solid fa-check-double',
  'card-stack': 'fa-solid fa-layer-group',
  'pill-with-gallery': 'fa-solid fa-images',
};

export const LAYOUT_FIELD_ICON_DEFAULTS = {
  'learning-objectives': {
    learningGoalIcon: 'fa-solid fa-bullseye',
    learningCommunicativeGoalIcon: 'fa-solid fa-comments',
  },
  'model-dialogue': {
    dialogueInstructionsIcon: 'fa-solid fa-ear-listen',
  },
  'interactive-practice': {
    practiceInstructionsIcon: 'fa-solid fa-person-chalkboard',
    practiceActivityTypeIcon: 'fa-solid fa-puzzle-piece',
  },
  'communicative-task': {
    taskPreparationIcon: 'fa-solid fa-list-check',
    taskPerformanceIcon: 'fa-solid fa-people-arrows',
    taskScaffoldingIcon: 'fa-solid fa-language',
  },
  'pronunciation-focus': {
    pronunciationTargetIcon: 'fa-solid fa-wave-square',
    pronunciationWordsIcon: 'fa-solid fa-font',
    pronunciationSentencesIcon: 'fa-solid fa-quote-left',
    pronunciationPracticeIcon: 'fa-solid fa-microphone-lines',
  },
  reflection: {
    reflectionPromptsIcon: 'fa-solid fa-lightbulb',
  },
  'grounding-activity': {
    groundingStepsIcon: 'fa-solid fa-spa',
  },
  'topic-introduction': {
    topicHookIcon: 'fa-solid fa-seedling',
    topicContextIcon: 'fa-solid fa-map-location-dot',
    topicQuestionIcon: 'fa-solid fa-question-circle',
    topicKeyVocabularyIcon: 'fa-solid fa-language',
  },
  'guided-discovery': {
    discoveryContextIcon: 'fa-solid fa-lightbulb',
    discoveryPromptsIcon: 'fa-solid fa-comments-question',
    discoveryNoticingQuestionsIcon: 'fa-solid fa-eye',
    discoveryLanguageSamplesIcon: 'fa-solid fa-quote-right',
  },
  'creative-practice': {
    creativeBriefIcon: 'fa-solid fa-paintbrush',
    creativeMaterialsIcon: 'fa-solid fa-toolbox',
    creativeMakingStepsIcon: 'fa-solid fa-list-ol',
    creativeSharingOptionsIcon: 'fa-solid fa-share-nodes',
  },
  'task-divider': {
    dividerTimingIcon: 'fa-solid fa-hourglass-half',
    dividerFocusIcon: 'fa-solid fa-bullseye',
    dividerActionsIcon: 'fa-solid fa-list',
  },
  'task-reporting': {
    reportingGoalIcon: 'fa-solid fa-flag',
    reportingPromptsIcon: 'fa-solid fa-comments',
    reportingRolesIcon: 'fa-solid fa-users',
    reportingEvidenceIcon: 'fa-solid fa-folder-open',
  },
  'genre-deconstruction': {
    genreTypeIcon: 'fa-solid fa-book',
    genrePurposeIcon: 'fa-solid fa-bullhorn',
    genreFeaturesIcon: 'fa-solid fa-layer-group',
    genreMentorTextIcon: 'fa-solid fa-file-lines',
  },
  'linguistic-feature-hunt': {
    featureSourceTextIcon: 'fa-solid fa-newspaper',
    featureTargetsIcon: 'fa-solid fa-highlighter',
    featureReflectionIcon: 'fa-solid fa-person-circle-question',
  },
  'text-reconstruction': {
    reconstructionContextIcon: 'fa-solid fa-map',
    reconstructionStepsIcon: 'fa-solid fa-list-ol',
    reconstructionSegmentsIcon: 'fa-solid fa-bars-staggered',
  },
  'jumbled-text-sequencing': {
    sequencingInstructionsIcon: 'fa-solid fa-clipboard-list',
    sequencingSegmentsIcon: 'fa-solid fa-shuffle',
    sequencingSupportTipsIcon: 'fa-solid fa-life-ring',
  },
  'scaffolded-joint-construction': {
    jointMentorIcon: 'fa-solid fa-user-graduate',
    jointSharedOutcomeIcon: 'fa-solid fa-people-carry-box',
    jointTeacherMovesIcon: 'fa-solid fa-chalkboard-user',
    jointLearnerMovesIcon: 'fa-solid fa-people-line',
  },
  'independent-construction-checklist': {
    checklistReminderIcon: 'fa-solid fa-circle-info',
    checklistItemsIcon: 'fa-solid fa-square-check',
    checklistStretchIcon: 'fa-solid fa-mountain',
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

const STAGE_ALIGNMENT_OPTIONS = [
  { value: 'top', label: 'Top aligned', classes: [] },
  { value: 'center', label: 'Centered', classes: ['is-centered-stage'] },
];

const CONTENT_ALIGNMENT_OPTIONS = [
  { value: 'start', label: 'Left', classes: ['align-start'] },
  { value: 'center', label: 'Center', classes: ['align-center'] },
  { value: 'end', label: 'Right', classes: ['align-end'] },
];

const OVERLAY_ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left', classes: ['overlay-align-left'] },
  { value: 'center', label: 'Center', classes: ['overlay-align-center'] },
  { value: 'right', label: 'Right', classes: ['overlay-align-right'] },
];

const createStageAlignmentModifier = () => ({
  id: 'stageAlignment',
  label: 'Stage alignment',
  appliesTo: 'stage',
  defaultValue: 'top',
  options: STAGE_ALIGNMENT_OPTIONS,
});

const createContentAlignmentModifier = () => ({
  id: 'contentAlignment',
  label: 'Content alignment',
  appliesTo: 'inner',
  defaultValue: 'start',
  options: CONTENT_ALIGNMENT_OPTIONS,
});

const createOverlayAlignmentModifier = () => ({
  id: 'overlayAlignment',
  label: 'Overlay alignment',
  appliesTo: 'inner',
  defaultValue: 'center',
  options: OVERLAY_ALIGNMENT_OPTIONS,
});

export const SLIDE_TEMPLATE_MODIFIERS = {
  'blank-canvas': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'card-stack': [
    createStageAlignmentModifier(),
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
    createStageAlignmentModifier(),
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
  'learning-objectives': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'model-dialogue': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'interactive-practice': [createStageAlignmentModifier()],
  'communicative-task': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'pronunciation-focus': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  reflection: [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'grounding-activity': [createStageAlignmentModifier(), createOverlayAlignmentModifier()],
  'topic-introduction': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'guided-discovery': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'creative-practice': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'task-divider': [createStageAlignmentModifier(), createOverlayAlignmentModifier()],
  'task-reporting': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'genre-deconstruction': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'linguistic-feature-hunt': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'text-reconstruction': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'jumbled-text-sequencing': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'scaffolded-joint-construction': [createStageAlignmentModifier(), createContentAlignmentModifier()],
  'independent-construction-checklist': [
    createStageAlignmentModifier(),
    createContentAlignmentModifier(),
  ],
};

export const BUILDER_LAYOUT_DEFAULTS = {
  'blank-canvas': () => ({}),
  'learning-objectives': () => ({
    title: 'Lesson aims',
    goals: [
      'Analyse a report on a local economic issue to identify key challenges.',
      'Evaluate two proposed strategies and justify your choice using persuasive language.',
      'Collaborate with peers to summarise your recommendations for community stakeholders.',
      'Use sentence stress effectively to emphasise key findings in discussion.',
    ],
    communicativeGoal:
      'Present a concise pitch that highlights support for local artisans in Nablus.',
    goalIcon: 'fa-solid fa-bullseye',
    communicativeGoalIcon: 'fa-solid fa-comments',
  }),
  'model-dialogue': () => ({
    title: 'Model: Designing a hybrid pilot',
    instructions:
      'Read the transcript from Fatima and Yousef as they agree on a digital literacy pilot. Highlight persuasive moves before learners notice patterns.',
    instructionsIcon: 'fa-solid fa-ear-listen',
    turns: [
      {
        speaker: 'Fatima',
        line: "Okay, so we've agreed that the Nablus report is clear: we need a digital skills programme.",
      },
      {
        speaker: 'Yousef',
        line: 'Exactly. I propose we start with a mentorship model called "Digital Pioneers."',
      },
      {
        speaker: 'Fatima',
        line: 'Mentorship is powerful, but my only concern is that it might be too slow to show results.',
      },
      {
        speaker: 'Yousef',
        line: "That's a good point. The main advantage of mentorship is the personalised support it offers.",
      },
      {
        speaker: 'Fatima',
        line: 'An alternative approach could be to focus on intensive workshops -- maybe we can combine both ideas?',
      },
      {
        speaker: 'Yousef',
        line: "A hybrid model sounds like the best of both worlds. Let's design that pilot.",
      },
    ],
  }),
  'interactive-practice': () => ({
    title: 'Grammar check: subject-verb agreement',
    instructions:
      'Choose the correct verb form for each networking statement, then compare answers with a partner.',
    instructionsIcon: 'fa-solid fa-person-chalkboard',
    activityType: 'multiple-choice',
    activityTypeIcon: 'fa-solid fa-puzzle-piece',
    questions: [
      {
        prompt: 'My team ___ mobile applications for regional clients.',
        options: ['develop', 'develops'],
        answer: 'develops',
      },
      {
        prompt: 'Our marketing lead ___ campaigns across Ramallah and Dublin.',
        options: ['runs', 'run'],
        answer: 'runs',
      },
      {
        prompt: 'The UX designer ___ responsible for user testing every sprint.',
        options: ['is', 'are'],
        answer: 'is',
      },
    ],
  }),
  'communicative-task': () => ({
    title: 'Speed networking session',
    preparation:
      'Scenario: You are attending the Global Connect virtual summit linking Ramallah and Dublin professionals.\nPlan a two-sentence introduction highlighting your role and a current project.',
    performance:
      "Rotate through five-minute breakout rooms, introduce yourself, and capture each partner's name, role, and one responsibility.",
    preparationIcon: 'fa-solid fa-list-check',
    performanceIcon: 'fa-solid fa-people-arrows',
    scaffolding: [
      "Starter line: \"Hi, I'm ... and I lead ...\".",
      'Clarifying questions such as "What does that involve day to day?"',
      'Note-taking frame: Name · Role · Follow-up idea.',
    ],
    scaffoldingIcon: 'fa-solid fa-language',
  }),
  'pronunciation-focus': () => ({
    title: 'Pronunciation: Word stress for job titles',
    target: 'Focus on primary stress in multi-word job titles used during networking.',
    words: ['Project MANager', 'DAta aNALyst', 'Marketing SPEcialist', 'UX/UI deSIGNer'],
    sentences: [
      'Our PROJECT MANager coordinates cross-city sprints.',
      "Fatima is the DAta aNALyst tracking the pilot's impact.",
    ],
    practice:
      'Chorally repeat each title, then record yourself emphasising the stressed syllable while introducing your role.',
    targetIcon: 'fa-solid fa-wave-square',
    wordsIcon: 'fa-solid fa-font',
    sentencesIcon: 'fa-solid fa-quote-left',
    practiceIcon: 'fa-solid fa-microphone-lines',
  }),
  reflection: () => ({
    title: 'Reflection · 3 · 2 · 1',
    prompts: [
      'Three things you learned about introducing yourself professionally.',
      'Two phrases you plan to reuse in your next networking conversation.',
      'One question you still have about building connections.',
    ],
    promptsIcon: 'fa-solid fa-lightbulb',
  }),
  'grounding-activity': () => ({
    title: 'Arrival breathwork ritual',
    subtitle: 'Reset before we connect',
    steps: [
      'Close your eyes, plant both feet, and visualise the networking room you are entering.',
      'Inhale for four counts imagining new opportunities, exhale for six to release nerves.',
      'Open your eyes and name one intention for how you want to show up in the session.',
    ],
    stepsIcon: 'fa-solid fa-spa',
    imageUrl:
      'https://images.pexels.com/photos/1487010/pexels-photo-1487010.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900',
    overlayColor: '#0f172a',
    overlayOpacity: 0.6,
  }),
  'topic-introduction': () => ({
    title: 'Today we explore: Strategic planning for local artisans',
    hook: 'What makes a social enterprise proposal compelling to funders?',
    context:
      'We are analysing a Nablus case study where online sales dropped 20% because artisans lacked digital marketing skills.',
    essentialQuestion: 'How can we design support that rebuilds those skills quickly and sustainably?',
    keyVocabulary: ['digital literacy', 'hybrid pilot', 'community mentorship', 'impact metrics'],
    hookIcon: 'fa-solid fa-seedling',
    contextIcon: 'fa-solid fa-map-location-dot',
    essentialQuestionIcon: 'fa-solid fa-question-circle',
    keyVocabularyIcon: 'fa-solid fa-language',
  }),
  'guided-discovery': () => ({
    title: 'Noticing persuasive language',
    context:
      'Transcript excerpts from Fatima and Yousef agreeing on the hybrid pilot programme.',
    discoveryPrompts: [
      'Highlight phrases that introduce each proposal.',
      'Underline how each speaker justifies their idea with evidence.',
    ],
    discoveryPromptsIcon: 'fa-solid fa-comments-question',
    noticingQuestions: [
      'How does Fatima soften her concern about mentorship?',
      'Where do they signal a compromise is possible?',
    ],
    noticingQuestionsIcon: 'fa-solid fa-eye',
    sampleLanguage: [
      'I propose we start with...',
      'The evidence strongly suggests...',
      'An alternative approach could be...',
      'The main advantage is...',
    ],
    sampleLanguageIcon: 'fa-solid fa-quote-right',
    contextIcon: 'fa-solid fa-lightbulb',
  }),
  'creative-practice': () => ({
    title: 'Brainstorming community solutions',
    brief:
      "Design a creative intervention that rebuilds artisans' digital marketing confidence.",
    briefIcon: 'fa-solid fa-paintbrush',
    materials: [
      'Jamboard template with columns for Focus · Approach · Impact.',
      'Sticky-note pack for capturing quick ideas.',
      'Timer set for six minutes to keep momentum high.',
    ],
    materialsIcon: 'fa-solid fa-toolbox',
    makingSteps: [
      'Identify one artisan group in Nablus that needs urgent support.',
      'Sketch two training activities that blend mentorship and workshops.',
      'Define how you will measure success after the pilot.',
    ],
    makingStepsIcon: 'fa-solid fa-list-ol',
    sharingOptions: [
      'Post a screenshot of your Jamboard frame in the chat.',
      'Nominate a spokesperson to summarise the top idea live.',
    ],
    creativeSharingOptionsIcon: 'fa-solid fa-share-nodes',
  }),
  'task-divider': () => ({
    title: 'Task launch',
    subtitle: 'Speed networking session',
    timing: '15 minutes total',
    timingIcon: 'fa-solid fa-hourglass-half',
    focus: 'Connect with three professionals and capture next steps.',
    focusIcon: 'fa-solid fa-bullseye',
    actions: [
      'Preview the breakout rotation and the goal for each round.',
      'Review the language focus for introductions.',
      'Assign a reporter for the debrief.',
    ],
    actionsIcon: 'fa-solid fa-list',
  }),
  'task-reporting': () => ({
    title: 'Post-event debrief',
    goal: 'Summarise who you met and why the connection matters.',
    goalIcon: 'fa-solid fa-flag',
    prompts: [
      'Name and role of the most interesting person you met.',
      'One reason they are a valuable contact for future projects.',
    ],
    promptsIcon: 'fa-solid fa-comments',
    roles: [
      { label: 'Reporter', value: 'Shares highlights from the breakout room.' },
      { label: 'Active listener', value: 'Captures key phrases to report back.' },
    ],
    rolesIcon: 'fa-solid fa-users',
    evidence: [
      'Use Present Simple to describe responsibilities clearly.',
      'Note any follow-up commitments you made.',
    ],
    evidenceIcon: 'fa-solid fa-folder-open',
  }),
  'genre-deconstruction': () => ({
    title: 'Deconstructing a strategic pitch dialogue',
    genre: 'Collaborative proposal meeting',
    genreIcon: 'fa-solid fa-book',
    purpose: 'Co-create a hybrid support programme for local artisans.',
    purposeIcon: 'fa-solid fa-bullhorn',
    features: [
      { label: 'Proposal frames', value: '"I propose we..." to launch ideas clearly.' },
      { label: 'Evidence markers', value: '"The data showed..." grounds suggestions in findings.' },
      { label: 'Diplomatic hedges', value: '"My only concern is..." softens disagreement.' },
    ],
    featuresIcon: 'fa-solid fa-layer-group',
    mentorText:
      'Excerpt from Fatima and Yousef agreeing on the Digital Pioneers + Artisan Accelerate pilot.',
    mentorTextIcon: 'fa-solid fa-file-lines',
  }),
  'linguistic-feature-hunt': () => ({
    title: 'Language hunt: persuasive collaboration',
    sourceText: 'Transcript from the Digital Pioneers pilot planning meeting.',
    sourceTextIcon: 'fa-solid fa-newspaper',
    features: [
      'Proposal openers (e.g., "I propose we start with...").',
      'Justification clauses ("The evidence strongly suggests...").',
      'Compromise signals ("Perhaps we can combine the ideas?").',
    ],
    featuresIcon: 'fa-solid fa-highlighter',
    reflection: [
      'Which phrases will you reuse when proposing community projects?',
      'How do these frames keep the tone collaborative?',
    ],
    reflectionIcon: 'fa-solid fa-person-circle-question',
  }),
  'text-reconstruction': () => ({
    title: 'Rebuild the project update',
    context:
      'You need to write a follow-up email summarising the hybrid pilot decision for stakeholders.',
    contextIcon: 'fa-solid fa-map',
    steps: [
      'Sort the jumbled sentences into a clear introduction, evidence, and next steps.',
      "Check that each paragraph links back to the artisans' needs.",
    ],
    stepsIcon: 'fa-solid fa-list-ol',
    segments: [
      "Thank you for today's meeting about the Nablus artisan report.",
      'We confirmed the skills gap is driven by limited digital marketing experience.',
      'The team agreed to launch a hybrid programme combining workshops and student mentorship.',
      "Our next step is to recruit mentors and design the first two photography masterclasses.",
    ],
    segmentsIcon: 'fa-solid fa-bars-staggered',
  }),
  'jumbled-text-sequencing': () => ({
    title: 'Sequence the pilot roadmap',
    instructions:
      'Place each milestone in the order we need to complete it for the hybrid pilot launch.',
    instructionsIcon: 'fa-solid fa-clipboard-list',
    segments: [
      'Gather baseline sales data from participating artisans.',
      'Deliver the storytelling workshop series.',
      'Match each artisan with a Digital Pioneer mentor.',
      'Host the week-eight showcase and collect testimonials.',
    ],
    segmentsIcon: 'fa-solid fa-shuffle',
    supportTips: [
      'Look for temporal clues such as "first" or "after the workshops".',
      'Remember mentorship follows training in the hybrid model.',
    ],
    supportTipsIcon: 'fa-solid fa-life-ring',
  }),
  'scaffolded-joint-construction': () => ({
    title: 'Co-writing the pilot proposal',
    mentorFocus: 'Model how to draft the executive summary together.',
    mentorFocusIcon: 'fa-solid fa-user-graduate',
    sharedOutcome: 'A one-page pitch outlining the hybrid training approach.',
    sharedOutcomeIcon: 'fa-solid fa-people-carry-box',
    teacherMoves: [
      'Annotate the mentor text to highlight proposal structure.',
      'Co-write the opening paragraph with learner input.',
      'Think aloud when selecting evidence from the report.',
    ],
    teacherMovesIcon: 'fa-solid fa-chalkboard-user',
    learnerMoves: [
      'Suggest verbs that keep the tone persuasive.',
      'Draft the workshop description sentences in pairs.',
      'Highlight where mentorship benefits are referenced.',
    ],
    learnerMovesIcon: 'fa-solid fa-people-line',
  }),
  'independent-construction-checklist': () => ({
    title: 'Independent pitch draft checklist',
    reminder: 'Your final email should invite stakeholders to support the hybrid pilot.',
    reminderIcon: 'fa-solid fa-circle-info',
    checklist: [
      'State the problem and key statistic from the report.',
      'Describe both workshop and mentorship components clearly.',
      'Request a specific next step or resource.',
    ],
    checklistIcon: 'fa-solid fa-square-check',
    stretchGoals: [
      'Include a quote from an artisan to humanise the need.',
      'Add a measurable target for the first quarter.',
    ],
    stretchGoalsIcon: 'fa-solid fa-mountain',
  }),
  'card-stack': () => ({
    pill: 'Task cycle roadmap',
    pillIcon: 'fa-solid fa-bookmark',
    title: 'Preview the hybrid pilot workflow',
    description:
      'Use the stack to outline how learners move from analysis to reporting throughout the unit.',
    cardIcon: 'fa-solid fa-circle-dot',
    cards: [
      {
        title: 'Analyse the report',
        description: 'Pull out statistics and needs driving the programme.',
      },
      {
        title: 'Prototype the training mix',
        description: 'Decide how workshops and mentorship complement each other.',
      },
      {
        title: 'Plan the showcase',
        description: 'Design how artisans will demonstrate new skills to funders.',
      },
    ],
  }),
  'pill-with-gallery': () => ({
    pill: 'Scenario spotlight',
    pillIcon: 'fa-solid fa-camera-retro',
    title: 'Ground the challenge with vivid artefacts',
    description:
      'Pair the scenario pill with a gallery of visuals so learners can see the momentum behind the hybrid pilot.',
    itemIcon: 'fa-solid fa-image',
    gallery: [
      {
        image:
          'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900',
        alt: 'Professionals networking in a bright coworking space',
        caption: 'Summit welcome · Attendees swap introductions before the first breakout.',
      },
      {
        image:
          'https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1920&h=1080',
        alt: 'Two colleagues planning a project with a laptop',
        caption: 'Planning huddle · Teams map the workshop and mentorship pairing.',
      },
      {
        image:
          'https://images.pexels.com/photos/3184634/pexels-photo-3184634.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1920&h=1080',
        alt: 'Facilitator presenting data on a board',
        caption: 'Stakeholder pitch · Learners present impact metrics to secure support.',
      },
    ],
  }),
};
