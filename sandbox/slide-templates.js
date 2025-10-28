export const LAYOUT_ICON_DEFAULTS = {
  'blank-canvas': 'fa-solid fa-border-all',
  'hero-overlay': 'fa-solid fa-mountain-sun',
  'card-stack': 'fa-solid fa-layer-group',
  'pill-with-gallery': 'fa-solid fa-images',
};

export const LAYOUT_FIELD_ICON_DEFAULTS = {
  'hero-overlay': {
    heroOverlayPillIcon: 'fa-solid fa-city',
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
  'hero-overlay': [
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
      id: 'cardAlignment',
      label: 'Overlay alignment',
      appliesTo: 'inner',
      defaultValue: 'start',
      options: [
        { value: 'start', label: 'Left', classes: ['overlay-align-left'] },
        { value: 'center', label: 'Center', classes: ['overlay-align-center'] },
        { value: 'end', label: 'Right', classes: ['overlay-align-right'] },
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
  'interactive-practice': () => ({
    activityType: 'multiple-choice',
    questions: [{}],
  }),
  'hero-overlay': () => ({
    pill: 'Bethlehem × Amman partnership',
    pillIcon: 'fa-solid fa-city',
    headline: 'Applying critical thinking to urgent pivots',
    subtitle:
      'Open with the partnership context, then frame the negotiation challenge the cohort will tackle today.',
    overlayTint: '#14291f',
    overlayOpacity: 58,
    alignment: 'start',
    image: {
      pexelsQuery: 'professional team negotiating around table',
      orientation: 'landscape',
      alt: 'Professional team negotiating around a meeting table',
    },
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
