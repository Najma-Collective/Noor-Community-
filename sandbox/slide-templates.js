export const LAYOUT_ICON_DEFAULTS = {
  'blank-canvas': 'fa-solid fa-border-all',
  'hero-overlay': 'fa-solid fa-mountain-sun',
  'card-stack': 'fa-solid fa-layer-group',
  'pill-with-gallery': 'fa-solid fa-grip',
  'reflection-board': 'fa-solid fa-star-half-stroke',
  'split-grid': 'fa-solid fa-table-columns',
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
    pillGalleryActionIcon: 'fa-solid fa-location-arrow',
  },
  'reflection-board': {
    reflectionBoardPillIcon: 'fa-solid fa-sparkles',
    reflectionBoardColumnIcon: 'fa-solid fa-star',
    reflectionBoardCardIcon: 'fa-solid fa-circle-dot',
  },
  'split-grid': {
    splitGridPillIcon: 'fa-solid fa-seedling',
    splitGridLeftIcon: 'fa-solid fa-sun',
    splitGridRightIcon: 'fa-solid fa-arrow-trend-up',
    splitGridItemIcon: 'fa-solid fa-circle-check',
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
    {
      id: 'mosaicStyle',
      label: 'Mosaic layout',
      appliesTo: 'inner',
      defaultValue: 'tiles',
      options: [
        { value: 'tiles', label: 'Balanced tiles', classes: ['mosaic-style-tiles'] },
        { value: 'spotlight', label: 'Lead spotlight', classes: ['mosaic-style-spotlight'] },
        { value: 'story', label: 'Story strip', classes: ['mosaic-style-story'] },
      ],
    },
  ],
  'reflection-board': [
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
      id: 'boardStyle',
      label: 'Board density',
      appliesTo: 'inner',
      defaultValue: 'open',
      options: [
        { value: 'open', label: 'Open grid', classes: ['board-style-open'] },
        { value: 'compact', label: 'Compact tiles', classes: ['board-style-compact'] },
      ],
    },
  ],
  'split-grid': [
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
      id: 'gridBalance',
      label: 'Column balance',
      appliesTo: 'inner',
      defaultValue: 'even',
      options: [
        { value: 'even', label: 'Even split', classes: ['grid-balance-even'] },
        { value: 'left-hero', label: 'Left hero', classes: ['grid-balance-left-hero'] },
        { value: 'right-hero', label: 'Right hero', classes: ['grid-balance-right-hero'] },
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
    title: 'Surface the build momentum in one glance',
    description:
      'Use the mosaic to pair your scenario pill with evidence tiles, then add quick actions so teams know what comes next.',
    mosaicStyle: 'tiles',
    gallery: [
      {
        caption: 'Kick-off huddle · Crews frame the user need and note the first evidence goal.',
        image: {
          pexelsQuery: 'students collaborating on design sprint',
          orientation: 'landscape',
        },
      },
      {
        caption: 'Prototype lab · Document the messy middle alongside the feedback lens in play.',
        image: {
          pexelsQuery: 'students prototyping together classroom sticky notes',
          orientation: 'landscape',
        },
      },
      {
        caption: 'Gallery walk · Capture how learners narrate the impact badge they unlocked.',
        image: {
          pexelsQuery: 'student presenting project classroom reflection',
          orientation: 'landscape',
        },
      },
      {
        caption: 'Mentor moments · Highlight who coached the next build move and why it mattered.',
        image: {
          pexelsQuery: 'mentor coaching students project',
          orientation: 'landscape',
        },
      },
    ],
    actions: [
      {
        label: 'Download observation checklist',
        description: 'Equip coaches to log glow/grow notes during the next sprint lap.',
        icon: 'fa-solid fa-list-check',
        href: '#',
      },
      {
        label: 'Share prototype brief',
        description: 'Remind teams which evidence unlocks the milestone badge this week.',
        icon: 'fa-solid fa-share-nodes',
        href: '#',
      },
    ],
  }),
  'reflection-board': () => ({
    pill: 'Reflection board',
    pillIcon: 'fa-solid fa-sparkles',
    title: 'Capture glow + grow insights before closing',
    description:
      'Invite each crew to pin evidence to the board, then surface the stretch experiments that will launch next session.',
    boardNote: 'Prompt: What moment of impact did you see today? What experiment will you run next?',
    columns: [
      {
        title: 'Glow moments',
        icon: 'fa-solid fa-sun',
        emphasis: 'Celebrate progress and visible momentum.',
        cards: [
          {
            title: 'Learner voice',
            description: 'Document a quote or interaction that captures confidence gains.',
          },
          {
            title: 'Evidence capture',
            description: 'Note the artefact or data point that proves today’s objective landed.',
          },
        ],
      },
      {
        title: 'Grow moves',
        icon: 'fa-solid fa-arrow-trend-up',
        emphasis: 'Name the stretch that keeps momentum building.',
        cards: [
          {
            title: 'Next experiment',
            description: 'Describe the iteration learners will test during the next build block.',
          },
          {
            title: 'Support needed',
            description: 'List partners, resources, or time the team needs to ship.',
          },
        ],
      },
    ],
    footer: {
      label: 'Synthesize as a team',
      description: 'Cluster the notes, celebrate a win, and choose one experiment to launch in the next session.',
    },
  }),
  'split-grid': () => ({
    pill: 'Dual recap',
    pillIcon: 'fa-solid fa-seedling',
    title: 'Balance wins with next growth moves',
    description:
      'Use the split grid to recap highlights on the left and plan the grow focus on the right so learners leave with clarity.',
    columns: [
      {
        title: 'Glow column',
        icon: 'fa-solid fa-star',
        description: 'What energised the crew today? Capture key quotes and artefacts.',
        items: [
          {
            title: 'Moment to celebrate',
            detail: 'Summarise a highlight or badge unlocked during the session.',
          },
          {
            title: 'Evidence spotlight',
            detail: 'Note the photo, doc, or metric that backs up the glow.',
          },
        ],
      },
      {
        title: 'Grow column',
        icon: 'fa-solid fa-bolt',
        description: 'Where will we invest effort next? Plan the next move and support.',
        items: [
          {
            title: 'Stretch focus',
            detail: 'Name the experiment or skill you will rehearse next.',
          },
          {
            title: 'Support request',
            detail: 'List the resource, partner, or time window that unlocks progress.',
          },
        ],
      },
    ],
    footerNote: 'Close the recap by inviting each crew to star one glow and commit to a single grow move.',
  }),
};
