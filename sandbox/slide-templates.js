import archetypeConfig from './config/archetypes.json' assert { type: 'json' };

const { _meta: _archetypeMetaIgnored, ...archetypeLayouts } = archetypeConfig ?? {};

const cloneValue = (value) => {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  if (value === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value));
};

const ensurePlainObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const normaliseIconClass = (value) =>
  (typeof value === 'string' ? value.trim() : '');

const BASE_LAYOUT_ICON_DEFAULTS = {
  'blank-canvas': 'fa-solid fa-border-all',
};

const LAYOUT_FIELD_ICON_PROPERTY_MAP = Object.freeze({
  'learning-objectives': Object.freeze({
    learningGoalIcon: 'goalIcon',
    learningCommunicativeGoalIcon: 'communicativeGoalIcon',
  }),
  'model-dialogue': Object.freeze({
    dialogueInstructionsIcon: 'instructionsIcon',
  }),
  'interactive-practice': Object.freeze({
    practiceInstructionsIcon: 'instructionsIcon',
    practiceActivityTypeIcon: 'activityTypeIcon',
  }),
  'card-stack': Object.freeze({
    cardStackPillIcon: 'pillIcon',
    cardStackItemIcon: 'cardIcon',
  }),
  'pill-with-gallery': Object.freeze({
    pillGalleryPillIcon: 'pillIcon',
    pillGalleryItemIcon: 'itemIcon',
  }),
  'communicative-task': Object.freeze({
    taskPreparationIcon: 'preparationIcon',
    taskPerformanceIcon: 'performanceIcon',
    taskScaffoldingIcon: 'scaffoldingIcon',
  }),
  'pronunciation-focus': Object.freeze({
    pronunciationTargetIcon: 'targetIcon',
    pronunciationWordsIcon: 'wordsIcon',
    pronunciationSentencesIcon: 'sentencesIcon',
    pronunciationPracticeIcon: 'practiceIcon',
  }),
  reflection: Object.freeze({
    reflectionPromptsIcon: 'promptsIcon',
  }),
  'grounding-activity': Object.freeze({
    groundingStepsIcon: 'stepsIcon',
  }),
  'topic-introduction': Object.freeze({
    topicHookIcon: 'hookIcon',
    topicContextIcon: 'contextIcon',
    topicQuestionIcon: 'essentialQuestionIcon',
    topicKeyVocabularyIcon: 'keyVocabularyIcon',
  }),
  'guided-discovery': Object.freeze({
    discoveryContextIcon: 'contextIcon',
    discoveryPromptsIcon: 'discoveryPromptsIcon',
    discoveryNoticingQuestionsIcon: 'noticingQuestionsIcon',
    discoveryLanguageSamplesIcon: 'sampleLanguageIcon',
  }),
  'creative-practice': Object.freeze({
    creativeBriefIcon: 'briefIcon',
    creativeMaterialsIcon: 'materialsIcon',
    creativeMakingStepsIcon: 'makingStepsIcon',
    creativeSharingOptionsIcon: 'sharingOptionsIcon',
  }),
  'task-divider': Object.freeze({
    dividerTimingIcon: 'timingIcon',
    dividerFocusIcon: 'focusIcon',
    dividerActionsIcon: 'actionsIcon',
  }),
  'task-reporting': Object.freeze({
    reportingGoalIcon: 'goalIcon',
    reportingPromptsIcon: 'promptsIcon',
    reportingRolesIcon: 'rolesIcon',
    reportingEvidenceIcon: 'evidenceIcon',
  }),
  'genre-deconstruction': Object.freeze({
    genreTypeIcon: 'genreIcon',
    genrePurposeIcon: 'purposeIcon',
    genreFeaturesIcon: 'featuresIcon',
    genreMentorTextIcon: 'mentorTextIcon',
  }),
  'linguistic-feature-hunt': Object.freeze({
    featureSourceTextIcon: 'sourceTextIcon',
    featureTargetsIcon: 'featuresIcon',
    featureReflectionIcon: 'reflectionIcon',
  }),
  'text-reconstruction': Object.freeze({
    reconstructionContextIcon: 'contextIcon',
    reconstructionStepsIcon: 'stepsIcon',
    reconstructionSegmentsIcon: 'segmentsIcon',
  }),
  'jumbled-text-sequencing': Object.freeze({
    sequencingInstructionsIcon: 'instructionsIcon',
    sequencingSegmentsIcon: 'segmentsIcon',
    sequencingSupportTipsIcon: 'supportTipsIcon',
  }),
  'scaffolded-joint-construction': Object.freeze({
    jointMentorIcon: 'mentorFocusIcon',
    jointSharedOutcomeIcon: 'sharedOutcomeIcon',
    jointTeacherMovesIcon: 'teacherMovesIcon',
    jointLearnerMovesIcon: 'learnerMovesIcon',
  }),
  'independent-construction-checklist': Object.freeze({
    checklistReminderIcon: 'reminderIcon',
    checklistItemsIcon: 'checklistIcon',
    checklistStretchIcon: 'stretchGoalsIcon',
  }),
});

const layoutDefaultFactories = {};
const layoutIconDefaults = { ...BASE_LAYOUT_ICON_DEFAULTS };
const layoutFieldIconDefaults = {};

for (const [layout, config] of Object.entries(archetypeLayouts)) {
  const defaults = ensurePlainObject(config?.defaults);
  layoutDefaultFactories[layout] = () => cloneValue(defaults);

  const layoutIcon = normaliseIconClass(defaults?.layoutIcon);
  if (layoutIcon) {
    layoutIconDefaults[layout] = layoutIcon;
  }

  const propertyMap = LAYOUT_FIELD_ICON_PROPERTY_MAP[layout];
  if (propertyMap) {
    for (const [fieldName, propertyKey] of Object.entries(propertyMap)) {
      const iconClass = normaliseIconClass(defaults?.[propertyKey]);
      if (!iconClass) {
        continue;
      }
      layoutFieldIconDefaults[layout] ??= {};
      layoutFieldIconDefaults[layout][fieldName] = iconClass;
    }
  }
}

export const BUILDER_LAYOUT_DEFAULTS = Object.freeze({
  ...layoutDefaultFactories,
});

export function cloneLayoutDefaults(layout = 'blank-canvas', { fallback = 'blank-canvas' } = {}) {
  const factory = BUILDER_LAYOUT_DEFAULTS?.[layout];
  if (typeof factory === 'function') {
    return factory();
  }
  if (fallback && layout !== fallback) {
    const fallbackFactory = BUILDER_LAYOUT_DEFAULTS?.[fallback];
    if (typeof fallbackFactory === 'function') {
      return fallbackFactory();
    }
  }
  return {};
}

export const getArchetypeDefaults = cloneLayoutDefaults;

const freezeNested = (object) =>
  Object.freeze(
    Object.fromEntries(
      Object.entries(object).map(([key, value]) => [key, Object.freeze({ ...value })]),
    ),
  );

export const LAYOUT_ICON_DEFAULTS = Object.freeze({
  ...layoutIconDefaults,
});

export const LAYOUT_FIELD_ICON_DEFAULTS = freezeNested(layoutFieldIconDefaults);

const LAYOUT_ICON_PLACEHOLDERS = new Set([
  '@layout',
  '@layoutIcon',
  '@layout-icon',
  'layoutIcon',
  '{layoutIcon}',
  '{{layoutIcon}}',
]);

export const getLayoutFieldIconDefault = (layout, field) => {
  const icons = LAYOUT_FIELD_ICON_DEFAULTS?.[layout];
  if (!icons) {
    return '';
  }
  const rawValue = icons[field];
  if (typeof rawValue !== 'string') {
    return '';
  }
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return '';
  }
  if (LAYOUT_ICON_PLACEHOLDERS.has(trimmed)) {
    const fallback = LAYOUT_ICON_DEFAULTS?.[layout];
    return typeof fallback === 'string' ? fallback : '';
  }
  return trimmed;
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
