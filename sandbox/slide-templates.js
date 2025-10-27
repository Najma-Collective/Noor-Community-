export const LAYOUT_ICON_DEFAULTS = {
  'blank-canvas': 'fa-solid fa-border-all',
  'hero-pill': 'fa-solid fa-star',
  'icon-instruction-list': 'fa-solid fa-list-check',
  'emoji-gallery': 'fa-solid fa-face-smile-beam',
  'note-grid': 'fa-solid fa-table-cells-large',
  'quiz-card': 'fa-solid fa-circle-question',
};

export const LAYOUT_FIELD_ICON_DEFAULTS = {
  'hero-pill': {
    heroPillIcon: 'fa-solid fa-star',
  },
  'icon-instruction-list': {
    instructionPillIcon: 'fa-solid fa-hand',
    instructionItemIcon: 'fa-solid fa-circle',
  },
  'emoji-gallery': {
    galleryPillIcon: 'fa-solid fa-face-smile-beam',
  },
  'note-grid': {
    notePillIcon: 'fa-solid fa-people-arrows',
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
  'hero-pill': [
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
  ],
  'icon-instruction-list': [
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
  ],
  'emoji-gallery': [
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
  ],
  'note-grid': [
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
  ],
  'quiz-card': [
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
  ],
};

export const BUILDER_LAYOUT_DEFAULTS = {
  'blank-canvas': () => ({}),
  'hero-pill': () => ({
    pill: 'Lesson 1',
    pillIcon: 'fa-solid fa-star',
    title: 'Hello, new friends!',
    subtitle: 'We will speak, listen, and smile today.',
    body: [
      'Use simple English to talk about your name, your city, and one thing you like.',
    ],
  }),
  'icon-instruction-list': () => ({
    pill: 'Warm-up',
    pillIcon: 'fa-solid fa-hand',
    title: 'Say your name',
    items: [
      { icon: 'fa-solid fa-hand', text: 'Wave to the class.' },
      { icon: 'fa-solid fa-user', text: 'Say: "Hi, I\'m ____."' },
      { icon: 'fa-solid fa-heart', text: 'Add one word you love.' },
    ],
  }),
  'emoji-gallery': () => ({
    pill: 'Feelings',
    title: 'How do you feel?',
    items: [
      { emoji: '😊', label: 'happy' },
      { emoji: '😎', label: 'cool' },
      { emoji: '😴', label: 'tired' },
      { emoji: '🤗', label: 'thankful' },
    ],
    feedback: 'Show the card and say: "I feel ____ today."',
  }),
  'note-grid': () => ({
    pill: 'Pair talk',
    pillIcon: 'fa-solid fa-people-arrows',
    title: 'Pair talk',
    notes: [
      { heading: 'Partner name', text: '' },
      { heading: 'Likes', text: '' },
      { heading: 'City', text: '' },
      { heading: 'Extra note', text: '' },
    ],
    tips: [
      { heading: 'Food', text: 'I like ____.' },
      { heading: 'Place', text: 'My city is ____.' },
      { heading: 'Hobby', text: 'I enjoy ____.' },
    ],
  }),
  'quiz-card': () => ({
    title: 'Quiz time',
    subtitle: 'Pick the best word',
    question: '"I ____ music."',
    options: [
      { label: 'A) love', correct: true },
      { label: 'B) drink', correct: false },
      { label: 'C) cook', correct: false },
      { label: 'D) drive', correct: false },
    ],
    feedback: 'We say "I love music" to talk about favourite sounds.',
  }),
};
