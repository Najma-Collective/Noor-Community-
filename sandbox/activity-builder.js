const DEFAULT_STATES = {
  'multiple-choice': () => ({
    title: 'C1 Checkpoint · Climate Solutions Sprint',
    instructions:
      'Skim the scenario pill, read the prompt badge, then tap the best response before revealing the feedback card.',
    rubric:
      'Learners earn a progress badge for each prompt answered correctly. Discuss any uncertain items before advancing.',
    questions: [
      {
        prompt:
          'Which action best represents a low-cost, high-impact climate solution we could prototype this term?',
        explanation:
          'Distributed solar kits create an immediate, measurable reduction in emissions while modelling learner agency.',
        options: [
          { text: 'Installing rooftop solar starter kits across the neighbourhood hub', correct: true },
          { text: 'Hosting weekly awareness assemblies in the auditorium', correct: false },
          { text: 'Publishing a quarterly sustainability report for stakeholders', correct: false },
          { text: 'Planting decorative palms around the entrance plaza', correct: false }
        ]
      },
      {
        prompt: 'Which data badge should pair with the infographic on Slide 4 of this deck?',
        explanation:
          'The infographic highlights measurable gains, so we surface the Impact badge rather than narrative or testimonial cues.',
        options: [
          { text: 'Impact badge · compares baseline and post-project metrics', correct: true },
          { text: 'People badge · lifts a learner testimonial or quote', correct: false },
          { text: 'Story badge · cues the narrative hook for the showcase', correct: false }
        ]
      }
    ]
  }),
  gapfill: () => ({
    title: 'Badge Copy Refinement',
    instructions: 'Preview the mentor text pill, then tighten each badge caption with precise C1 language.',
    rubric: 'Award one point per correctly completed blank; coach for concision before revealing the model answers.',
    passage:
      'Each slide opens with a [[scenario|context]] pill that anchors learners in a real brief. ' +
      'To reinforce the voice and tone, pair every action card with a [[badge|micro-badge]] label that signals the focus. ' +
      'During the showcase, move from the [[insight|key insight]] badge into the reflection grid so evidence stays visible.'
  }),
  grouping: () => ({
    title: 'Assemble the Slide Stack',
    instructions: 'Drag each card into the correct lane to storyboard the updated presentation flow.',
    rubric: 'Teams earn a collaboration badge for every card sorted into the matching lane.',
    categories: [
      {
        name: 'Launch Pillars',
        description: 'Use these to open the deck with momentum and clarity.',
        items: ['Scenario pill', 'Spark question duo', 'Visual promise badge']
      },
      {
        name: 'Studio Habits',
        description: 'Mid-deck structures that drive iteration and prototyping.',
        items: ['Feedback carousel', 'Prototype gallery', 'Coach check-in pill']
      },
      {
        name: 'Reflection Tokens',
        description: 'Closing structures that surface evidence of learning.',
        items: ['Glow/Grow cards', 'Exit ticket mosaic', 'Next steps badge']
      }
    ]
  }),
  'table-completion': () => ({
    title: 'Card Composition Planner',
    instructions: 'Complete the matrix to align each slide card with the new visual language.',
    rubric: 'Assign one point per accurately completed cell. Invite teams to justify their pairings before scoring.',
    columnHeaders: ['Focus area', 'Learner-facing move', 'Visible artifact'],
    rows: [
      {
        label: 'Scenario launch',
        answers: ['Pose a bold question framed as a pill', 'Hero image with overlay badge']
      },
      {
        label: 'Practice lane',
        answers: ['Sequence a trio of iterative tasks', 'Card stack with step badges']
      },
      {
        label: 'Reflection close',
        answers: ['Collect evidence and next steps aloud', 'Dual-column recap with progress chips']
      }
    ]
  }),
  'quiz-show': () => ({
    title: 'Slide Quiz Showdown',
    instructions:
      'Run the lightning round: reveal the prompt pill, let teams buzz in, then flip the answer and extension cards.',
    rubric:
      'Award two points for accurate responses and one point for strong extensions. Pause between slides to celebrate badges earned.',
    defaultTime: 35,
    questions: [
      {
        prompt:
          'Which visual cue signals a progress badge has been earned during the reflection slide?',
        answer: 'A soft green chip with the badge icon pulses beside the learner name.',
        feedback: 'Invite learners to describe what evidence unlocked that badge to reinforce metacognition.',
        image: 'https://images.pexels.com/photos/414645/pexels-photo-414645.jpeg',
        time: 40
      },
      {
        prompt: 'How should we introduce a new studio habit card when time is limited?',
        answer: 'Use the Story pill to headline the purpose, then anchor the task with a single coaching prompt.',
        feedback: 'Model a concise demo before inviting teams to rehearse the habit in pairs.',
        image: 'https://images.pexels.com/photos/3184328/pexels-photo-3184328.jpeg',
        time: 30
      },
      {
        prompt: 'What belongs in the recap grid after a prototyping sprint?',
        answer: 'Three wins, one edge, and next-iteration commitments captured as badges.',
        feedback: 'Layer the exit ticket mosaic beneath so trends stay visible across teams.',
        image: 'https://images.pexels.com/photos/1181356/pexels-photo-1181356.jpeg',
        time: 35
      }
    ],
    teams: [
      { name: 'Team Catalyst', icon: 'fa-solid fa-bolt', score: 0 },
      { name: 'Team Atlas', icon: 'fa-solid fa-mountain', score: 0 },
      { name: 'Team Pulse', icon: 'fa-solid fa-wave-square', score: 0 }
    ]
  })
};

const TYPE_META = {
  'multiple-choice': {
    label: 'Multiple choice quiz',
    icon: 'fa-list-check',
    accent: 'mc',
    helper: 'Offer up to four answer choices and mark every correct option.',
  },
  gapfill: {
    label: 'Gap fill activity',
    icon: 'fa-i-cursor',
    accent: 'gap',
    helper: 'Transform passages into interactive cloze tasks with instant feedback.',
  },
  grouping: {
    label: 'Grouping challenge',
    icon: 'fa-layer-group',
    accent: 'group',
    helper: 'Create drag-and-drop cards for learners to sort into categories.',
  },
  'table-completion': {
    label: 'Table completion',
    icon: 'fa-table-cells-large',
    accent: 'table',
    helper: 'Build comparison charts where learners supply the missing details.',
  },
  'quiz-show': {
    label: 'Slide quiz showdown',
    icon: 'fa-person-chalkboard',
    accent: 'quiz',
    helper: 'Stage a paced quiz with a live scoreboard and revealable answers.',
  },
  default: {
    label: 'Interactive activity',
    icon: 'fa-shapes',
    accent: 'mc',
    helper: 'Configure activity content and preview the generated slide.',
  },
};

const STORAGE_KEY = 'noor-activity-builder-state-v2';
const SELECTED_STORAGE_KEY = 'noor-activity-builder-selected-preset-v1';
const deepClone = (value) => {
  if (value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
};

const escapeHtml = (unsafe = '') =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatMultiline = (value = '') => escapeHtml(value).replace(/\n/g, '<br>');

class ActivityBuilder {
  constructor() {
    this.state = {
      type: 'multiple-choice',
      data: this.getDefaultState('multiple-choice'),
      presetId: null,
    };

    this.typeSelect = document.getElementById('activity-type');
    this.formContainer = document.getElementById('builder-form');
    this.previewFrame = document.getElementById('activity-preview');
    this.outputArea = document.getElementById('output-html');
    this.copyBtn = document.getElementById('copy-html');
    this.refreshBtn = document.getElementById('refresh-preview');
    this.sendToDeckBtn = document.getElementById('send-to-deck');
    this.alertTemplate = document.getElementById('alert-template');
    this.statusEl = document.getElementById('builder-status');
    this.isEmbedded = window.parent && window.parent !== window;

    this.canUseStorage = typeof window !== 'undefined' && 'localStorage' in window;
    this.pendingSelectedPresets = {};
    this.needsStateMigrationPersist = false;
    this.savedStates = this.loadSavedStates();
    this.selectedPresets = this.loadSelectedPresets();

    let selectionsChanged = false;
    const cleanedSelections = {};
    Object.entries(this.selectedPresets || {}).forEach(([type, presetId]) => {
      if (this.getPresetById(type, presetId)) {
        cleanedSelections[type] = presetId;
      } else {
        selectionsChanged = true;
      }
    });
    this.selectedPresets = cleanedSelections;

    if (Object.keys(this.pendingSelectedPresets).length) {
      this.selectedPresets = { ...this.selectedPresets, ...this.pendingSelectedPresets };
      selectionsChanged = true;
      this.pendingSelectedPresets = {};
    }

    if (selectionsChanged) {
      this.persistSelectedPresets();
    }

    if (this.needsStateMigrationPersist) {
      this.persistSavedStates();
    }

    const initialPresetId = this.selectedPresets[this.state.type];
    const initialPreset = this.getPresetById(this.state.type, initialPresetId);
    if (initialPreset) {
      this.state.data = deepClone(initialPreset.data);
      this.state.presetId = initialPreset.id;
    } else {
      const presets = this.getPresetsForType(this.state.type);
      if (presets.length) {
        const firstPreset = presets[0];
        this.state.data = deepClone(firstPreset.data);
        this.state.presetId = firstPreset.id;
        this.selectedPresets[this.state.type] = firstPreset.id;
        this.persistSelectedPresets();
      }
    }

    this.pendingConfig = null;
    this.updateFrame = null;

    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.handleFormInput = this.handleFormInput.bind(this);
    this.handleFormClick = this.handleFormClick.bind(this);
    this.renderForm = this.renderForm.bind(this);
    this.handlePresetSelect = this.handlePresetSelect.bind(this);
    this.sendToDeck = this.sendToDeck.bind(this);
  }

  loadSavedStates() {
    const result = {};
    this.pendingSelectedPresets = {};
    this.needsStateMigrationPersist = false;

    if (!this.canUseStorage) {
      return result;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return result;
      }

      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) {
        return result;
      }

      const migratedSelections = {};
      let needsPersist = false;

      Object.entries(parsed).forEach(([type, value]) => {
        if (!value) {
          return;
        }

        if (Array.isArray(value)) {
          const cleaned = value
            .map((preset) => {
              if (!preset || typeof preset !== 'object') {
                needsPersist = true;
                return null;
              }

              const id = typeof preset.id === 'string' && preset.id.trim()
                ? preset.id.trim()
                : this.generatePresetId();
              if (id !== preset.id) {
                needsPersist = true;
              }

              const name = typeof preset.name === 'string' && preset.name.trim()
                ? preset.name.trim()
                : 'Untitled preset';
              if (name !== preset.name) {
                needsPersist = true;
              }

              const hasValidData = preset.data && typeof preset.data === 'object';
              const data = hasValidData ? preset.data : this.getDefaultState(type);
              if (!hasValidData) {
                needsPersist = true;
              }
              if (!data) {
                return null;
              }

              return {
                id,
                name,
                data: deepClone(data),
              };
            })
            .filter(Boolean);

          if (cleaned.length) {
            result[type] = cleaned;
            if (cleaned.length !== value.length) {
              needsPersist = true;
            }
          }
        } else if (typeof value === 'object') {
          const id = this.generatePresetId();
          result[type] = [
            {
              id,
              name: 'Saved preset',
              data: deepClone(value),
            },
          ];
          migratedSelections[type] = id;
          needsPersist = true;
        }
      });

      this.pendingSelectedPresets = migratedSelections;
      this.needsStateMigrationPersist = needsPersist;
      return result;
    } catch (error) {
      console.warn('Unable to parse saved builder state', error);
      return {};
    }
  }

  loadSelectedPresets() {
    if (!this.canUseStorage) {
      return {};
    }
    try {
      const raw = window.localStorage.getItem(SELECTED_STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (error) {
      console.warn('Unable to parse selected preset state', error);
      return {};
    }
  }

  persistSavedStates() {
    if (!this.canUseStorage) {
      return;
    }
    try {
      if (!Object.keys(this.savedStates || {}).length) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.savedStates));
    } catch (error) {
      console.warn('Unable to persist builder state', error);
    }
  }

  persistSelectedPresets() {
    if (!this.canUseStorage) {
      return;
    }
    try {
      if (!Object.keys(this.selectedPresets || {}).length) {
        window.localStorage.removeItem(SELECTED_STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(SELECTED_STORAGE_KEY, JSON.stringify(this.selectedPresets));
    } catch (error) {
      console.warn('Unable to persist selected preset state', error);
    }
  }

  persistStateFromConfig(config) {
    if (!config || !config.type) {
      return;
    }

    const { type, data, presetId } = config;
    if (!presetId) {
      return;
    }

    const presets = this.getPresetsForType(type);
    if (!presets.length) {
      return;
    }

    let didUpdate = false;
    const nextPresets = presets.map((preset) => {
      if (preset.id !== presetId) {
        return preset;
      }
      didUpdate = true;
      return {
        ...preset,
        data: deepClone(data),
      };
    });

    if (didUpdate) {
      this.setPresetsForType(type, nextPresets);
    }
  }

  getDefaultState(type) {
    const factory = DEFAULT_STATES[type];
    return typeof factory === 'function' ? factory() : {};
  }

  generatePresetId() {
    return `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  getPresetsForType(type) {
    const presets = this.savedStates?.[type];
    return Array.isArray(presets) ? presets : [];
  }

  setPresetsForType(type, presets) {
    if (!type) {
      return;
    }

    const nextPresets = (Array.isArray(presets) ? presets : [])
      .map((preset) => {
        if (!preset || typeof preset !== 'object') {
          return null;
        }
        const id = typeof preset.id === 'string' && preset.id.trim() ? preset.id.trim() : this.generatePresetId();
        const name = typeof preset.name === 'string' && preset.name.trim() ? preset.name.trim() : 'Untitled preset';
        const data = preset.data && typeof preset.data === 'object' ? preset.data : this.getDefaultState(type);
        if (!data) {
          return null;
        }
        return {
          id,
          name,
          data: deepClone(data),
        };
      })
      .filter(Boolean);

    if (nextPresets.length) {
      this.savedStates[type] = nextPresets;
    } else {
      delete this.savedStates[type];
    }

    this.persistSavedStates();
  }

  getPresetById(type, presetId) {
    if (!presetId) {
      return null;
    }
    const presets = this.getPresetsForType(type);
    const preset = presets.find((entry) => entry.id === presetId);
    if (!preset) {
      return null;
    }
    return {
      id: preset.id,
      name: preset.name,
      data: deepClone(preset.data),
    };
  }

  generateDefaultPresetName(type) {
    const presets = this.getPresetsForType(type);
    const nextNumber = presets.length + 1;
    const meta = TYPE_META[type] || TYPE_META.default;
    return `${meta.label} preset ${nextNumber}`;
  }

  handlePresetSelect(event) {
    const presetId = event.target.value;
    const { type } = this.state;

    if (!presetId) {
      this.state = {
        type,
        data: this.getDefaultState(type),
        presetId: null,
      };
      delete this.selectedPresets[type];
      this.persistSelectedPresets();
      this.renderForm();
      this.updateOutputs();
      this.flushUpdateQueue();
      this.showAlert('Reverted to default starter content.');
      return;
    }

    const preset = this.getPresetById(type, presetId);
    if (!preset) {
      event.target.value = '';
      this.showAlert('Selected preset could not be loaded.');
      return;
    }

    this.state = {
      type,
      data: deepClone(preset.data),
      presetId: preset.id,
    };
    this.selectedPresets[type] = preset.id;
    this.persistSelectedPresets();
    this.renderForm();
    this.updateOutputs();
    this.flushUpdateQueue();
    this.showAlert(`Loaded "${preset.name}" preset.`);
  }

  saveCurrentAsPreset() {
    const { type, data } = this.state;
    const defaultName = this.generateDefaultPresetName(type);
    if (typeof window === 'undefined' || typeof window.prompt !== 'function') {
      this.showAlert('Preset saving is unavailable in this environment.');
      return;
    }
    const response = window.prompt('Name this preset', defaultName);
    if (response === null) {
      this.announceStatus('Preset save cancelled.');
      return;
    }
    const presetName = response.trim() || defaultName;
    const newPreset = {
      id: this.generatePresetId(),
      name: presetName,
      data: deepClone(data),
    };
    const presets = this.getPresetsForType(type);
    const nextPresets = [...presets, newPreset];
    this.setPresetsForType(type, nextPresets);
    this.state.presetId = newPreset.id;
    this.selectedPresets[type] = newPreset.id;
    this.persistSelectedPresets();
    this.renderForm();
    this.updateOutputs();
    this.flushUpdateQueue();
    this.showAlert(`Saved preset "${presetName}".`);
  }

  renameSelectedPreset() {
    const { type, presetId } = this.state;
    if (!presetId) {
      this.showAlert('Select a preset to rename first.');
      return;
    }
    const presets = this.getPresetsForType(type);
    const preset = presets.find((entry) => entry.id === presetId);
    if (!preset) {
      this.showAlert('The selected preset is no longer available.');
      this.renderForm();
      return;
    }
    if (typeof window === 'undefined' || typeof window.prompt !== 'function') {
      this.showAlert('Preset rename is unavailable in this environment.');
      return;
    }
    const response = window.prompt('Rename preset', preset.name);
    if (response === null) {
      this.announceStatus('Preset rename cancelled.');
      return;
    }
    const trimmed = response.trim();
    if (!trimmed) {
      this.showAlert('Preset name cannot be empty.');
      return;
    }
    if (trimmed === preset.name) {
      this.announceStatus('Preset name unchanged.');
      return;
    }
    const nextPresets = presets.map((entry) =>
      entry.id === presetId
        ? {
            ...entry,
            name: trimmed,
          }
        : entry
    );
    this.setPresetsForType(type, nextPresets);
    this.renderForm();
    this.showAlert(`Preset renamed to "${trimmed}".`);
  }

  deleteSelectedPreset() {
    const { type, presetId } = this.state;
    if (!presetId) {
      this.showAlert('Select a preset to delete first.');
      return;
    }
    const presets = this.getPresetsForType(type);
    const preset = presets.find((entry) => entry.id === presetId);
    if (!preset) {
      this.showAlert('The selected preset is no longer available.');
      this.renderForm();
      return;
    }
    if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
      this.showAlert('Preset deletion is unavailable in this environment.');
      return;
    }
    const confirmed = window.confirm(`Delete the "${preset.name}" preset? This cannot be undone.`);
    if (!confirmed) {
      this.announceStatus('Preset deletion cancelled.');
      return;
    }

    const nextPresets = presets.filter((entry) => entry.id !== presetId);
    this.setPresetsForType(type, nextPresets);

    if (nextPresets.length) {
      const fallback = nextPresets[0];
      this.state = {
        type,
        data: deepClone(fallback.data),
        presetId: fallback.id,
      };
      this.selectedPresets[type] = fallback.id;
      this.persistSelectedPresets();
      this.renderForm();
      this.updateOutputs();
      this.flushUpdateQueue();
      this.showAlert(`Deleted preset "${preset.name}". Loaded "${fallback.name}".`);
    } else {
      this.state = {
        type,
        data: this.getDefaultState(type),
        presetId: null,
      };
      delete this.selectedPresets[type];
      this.persistSelectedPresets();
      this.renderForm();
      this.updateOutputs();
      this.flushUpdateQueue();
      this.showAlert(`Deleted preset "${preset.name}".`);
    }
  }

  announceStatus(message) {
    if (!this.statusEl) {
      return;
    }
    this.statusEl.textContent = message;
  }

  scheduleRender(config) {
    this.pendingConfig = config;
    if (this.updateFrame) {
      return;
    }
    this.updateFrame = window.requestAnimationFrame(() => {
      this.updateFrame = null;
      const nextConfig = this.pendingConfig ?? this.getCurrentConfig();
      this.pendingConfig = null;
      this.renderOutputs(nextConfig);
    });
  }

  flushUpdateQueue() {
    const config = this.pendingConfig ?? this.getCurrentConfig();
    if (this.updateFrame) {
      window.cancelAnimationFrame(this.updateFrame);
      this.updateFrame = null;
      this.pendingConfig = null;
    }
    this.renderOutputs(config);
  }

  renderOutputs(config) {
    if (!config || !config.type) {
      return;
    }
    const generator = Generators[config.type];
    if (!generator) {
      return;
    }

    const html = generator(config.data);
    if (this.outputArea) {
      this.outputArea.value = html;
    }

    if (this.previewFrame instanceof HTMLIFrameElement) {
      try {
        const iframeDoc = this.previewFrame.contentDocument;
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
      } catch (error) {
        console.error('Unable to refresh activity preview', error);
        this.announceStatus('Unable to refresh the preview.');
      }
    }

    this.persistStateFromConfig(config);
  }

  forceUpdate() {
    this.flushUpdateQueue();
  }

  init() {
    this.typeSelect.addEventListener('change', this.handleTypeChange);
    this.formContainer.addEventListener('input', this.handleFormInput);
    this.formContainer.addEventListener('change', this.handleFormInput);
    this.formContainer.addEventListener('click', this.handleFormClick);
    this.copyBtn.addEventListener('click', () => this.copyHtml());
    this.downloadBtn = document.getElementById('download-html');
    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadHtml());
    }
    this.refreshBtn.addEventListener('click', () => {
      this.forceUpdate();
      this.showAlert('Preview refreshed.');
    });
    if (this.sendToDeckBtn) {
      if (!this.isEmbedded) {
        this.sendToDeckBtn.hidden = true;
      } else {
        this.sendToDeckBtn.addEventListener('click', this.sendToDeck);
      }
    }

    this.renderForm();
    this.updateOutputs();
    this.flushUpdateQueue();
  }

  handleTypeChange(event) {
    const nextType = event.target.value;
    const selectedPresetId = this.selectedPresets[nextType];
    const selectedPreset = this.getPresetById(nextType, selectedPresetId);
    let statusMessage;

    if (selectedPreset) {
      this.state = {
        type: nextType,
        data: deepClone(selectedPreset.data),
        presetId: selectedPreset.id,
      };
      statusMessage = `Loaded "${selectedPreset.name}" preset.`;
    } else {
      const presets = this.getPresetsForType(nextType);
      if (presets.length) {
        const fallbackPreset = presets[0];
        this.state = {
          type: nextType,
          data: deepClone(fallbackPreset.data),
          presetId: fallbackPreset.id,
        };
        this.selectedPresets[nextType] = fallbackPreset.id;
        this.persistSelectedPresets();
        statusMessage = `Loaded "${fallbackPreset.name}" preset.`;
      } else {
        this.state = {
          type: nextType,
          data: this.getDefaultState(nextType),
          presetId: null,
        };
        delete this.selectedPresets[nextType];
        this.persistSelectedPresets();
        const meta = TYPE_META[nextType] || TYPE_META.default;
        statusMessage = `${meta.label} preset ready to customise.`;
      }
    }
    this.renderForm();
    this.updateOutputs();
    this.flushUpdateQueue();
    if (statusMessage) {
      this.announceStatus(statusMessage);
    }
  }

  handleFormInput(event) {
    const { target } = event;
    if (target.id === 'preset-select') {
      return;
    }
    if (!target.closest('[data-block]')) {
      // high-level fields
      this.updateGlobalField(target);
    } else {
      const block = target.closest('[data-block]');
      const blockType = block.dataset.block;
      switch (blockType) {
        case 'question':
          this.updateQuestionField(block, target);
          break;
        case 'option':
          this.updateOptionField(block, target);
          break;
        case 'quiz-question':
          this.updateQuizQuestionField(block, target);
          break;
        case 'category':
          this.updateCategoryField(block, target);
          break;
        case 'item':
          this.updateItemField(block, target);
          break;
        case 'table-row':
          this.updateTableRowField(block, target);
          break;
        case 'table-header':
          this.updateTableHeaderField(target);
          break;
        case 'team':
          this.updateTeamField(block, target);
          break;
        default:
          break;
      }
    }
    this.updateOutputs();
  }

  handleFormClick(event) {
    const actionBtn = event.target.closest('[data-action]');
    if (!actionBtn) return;

    const action = actionBtn.dataset.action;

    switch (action) {
      case 'add-question':
        this.addQuestion();
        break;
      case 'remove-question':
        this.removeQuestion(actionBtn.closest('[data-block="question"]').dataset.index);
        break;
      case 'add-option':
        this.addOption(actionBtn.closest('[data-block="question"]').dataset.index);
        break;
      case 'remove-option':
        this.removeOption(
          actionBtn.closest('[data-block="question"]').dataset.index,
          actionBtn.closest('[data-block="option"]').dataset.optionIndex
        );
        break;
      case 'add-quiz-question':
        this.addQuizQuestion();
        break;
      case 'remove-quiz-question':
        this.removeQuizQuestion(actionBtn.closest('[data-block="quiz-question"]').dataset.index);
        break;
      case 'add-category':
        this.addCategory();
        break;
      case 'remove-category':
        this.removeCategory(actionBtn.closest('[data-block="category"]').dataset.index);
        break;
      case 'add-item':
        this.addItem(actionBtn.closest('[data-block="category"]').dataset.index);
        break;
      case 'remove-item':
        this.removeItem(
          actionBtn.closest('[data-block="category"]').dataset.index,
          actionBtn.closest('[data-block="item"]').dataset.itemIndex
        );
        break;
      case 'add-row':
        this.addTableRow();
        break;
      case 'remove-row':
        this.removeTableRow(actionBtn.closest('[data-block="table-row"]').dataset.index);
        break;
      case 'add-team':
        this.addTeam();
        break;
      case 'remove-team':
        this.removeTeam(actionBtn.closest('[data-block="team"]').dataset.index);
        break;
      case 'copy-html':
        this.copyHtml();
        break;
      case 'preset-save':
        this.saveCurrentAsPreset();
        break;
      case 'preset-rename':
        this.renameSelectedPreset();
        break;
      case 'preset-delete':
        this.deleteSelectedPreset();
        break;
      default:
        break;
    }
  }

  updateGlobalField(target) {
    const { field } = target.dataset;
    if (!field) return;
    if (field === 'title' || field === 'instructions' || field === 'rubric') {
      this.state.data[field] = target.value;
    } else if (field === 'passage') {
      this.state.data.passage = target.value;
    } else if (field === 'default-time') {
      const value = Number(target.value);
      if (Number.isFinite(value) && value > 0) {
        this.state.data.defaultTime = value;
      }
    }
  }

  updateQuestionField(block, target) {
    const index = Number(block.dataset.index);
    const question = this.state.data.questions[index];
    const field = target.dataset.field;
    if (field === 'prompt') {
      question.prompt = target.value;
    } else if (field === 'explanation') {
      question.explanation = target.value;
    }
  }

  updateOptionField(block, target) {
    const questionIndex = Number(block.closest('[data-block="question"]').dataset.index);
    const optionIndex = Number(block.dataset.optionIndex);
    const option = this.state.data.questions[questionIndex].options[optionIndex];
    const field = target.dataset.field;
    if (field === 'option-text') {
      option.text = target.value;
    } else if (field === 'option-correct') {
      option.correct = target.checked;
    }
  }

  updateQuizQuestionField(block, target) {
    const index = Number(block.dataset.index);
    const question = this.state.data.questions[index];
    if (!question) {
      return;
    }
    const field = target.dataset.field;
    if (field === 'question-prompt') {
      question.prompt = target.value;
    } else if (field === 'question-answer') {
      question.answer = target.value;
    } else if (field === 'question-feedback') {
      question.feedback = target.value;
    } else if (field === 'question-image') {
      question.image = target.value;
    } else if (field === 'question-time') {
      const value = Number(target.value);
      if (Number.isFinite(value) && value > 0) {
        question.time = value;
      }
    }
  }

  updateCategoryField(block, target) {
    const index = Number(block.dataset.index);
    const category = this.state.data.categories[index];
    const field = target.dataset.field;
    if (field === 'category-name') {
      category.name = target.value;
    } else if (field === 'category-description') {
      category.description = target.value;
    }
  }

  updateItemField(block, target) {
    const categoryIndex = Number(block.closest('[data-block="category"]').dataset.index);
    const itemIndex = Number(block.dataset.itemIndex);
    const items = this.state.data.categories[categoryIndex].items;
    items[itemIndex] = target.value;
  }

  updateTableRowField(block, target) {
    const rowIndex = Number(block.dataset.index);
    const row = this.state.data.rows[rowIndex];
    const field = target.dataset.field;
    if (field === 'row-label') {
      row.label = target.value;
    } else if (field && field.startsWith('row-answer-')) {
      const answerIndex = Number(field.split('-').pop());
      row.answers[answerIndex] = target.value;
    }
  }

  updateTableHeaderField(target) {
    const headerIndex = Number(target.dataset.headerIndex);
    this.state.data.columnHeaders[headerIndex] = target.value;
  }

  updateTeamField(block, target) {
    const index = Number(block.dataset.index);
    const team = this.state.data.teams[index];
    if (!team) {
      return;
    }
    const field = target.dataset.field;
    if (field === 'team-name') {
      team.name = target.value;
    } else if (field === 'team-icon') {
      team.icon = target.value;
      const preview = block.querySelector('.team-icon-preview i');
      if (preview) {
        const className = target.value.trim() || 'fa-solid fa-people-group';
        preview.className = className;
      }
    }
  }

  addQuestion() {
    this.state.data.questions.push({
      prompt: 'New question prompt',
      explanation: 'Add guidance or rationale here.',
      options: [
        { text: 'Option 1', correct: false },
        { text: 'Option 2', correct: false }
      ]
    });
    this.renderForm();
    this.updateOutputs();
  }

  removeQuestion(index) {
    const idx = Number(index);
    if (this.state.data.questions.length <= 1) return;
    this.state.data.questions.splice(idx, 1);
    this.renderForm();
    this.updateOutputs();
  }

  addOption(questionIndex) {
    const idx = Number(questionIndex);
    this.state.data.questions[idx].options.push({ text: 'New option', correct: false });
    this.renderForm();
    this.updateOutputs();
  }

  removeOption(questionIndex, optionIndex) {
    const qIdx = Number(questionIndex);
    const oIdx = Number(optionIndex);
    const options = this.state.data.questions[qIdx].options;
    if (options.length <= 2) return;
    options.splice(oIdx, 1);
    this.renderForm();
    this.updateOutputs();
  }

  addQuizQuestion() {
    const defaultTime = Number.isFinite(Number(this.state.data.defaultTime))
      ? Number(this.state.data.defaultTime)
      : 45;
    this.state.data.questions.push({
      prompt: 'New quiz prompt',
      answer: 'Add the reveal answer here.',
      feedback: 'Share an extension, fun fact, or next step.',
      image: '',
      time: defaultTime,
    });
    this.renderForm();
    this.updateOutputs();
  }

  removeQuizQuestion(index) {
    const idx = Number(index);
    if (this.state.data.questions.length <= 1) return;
    this.state.data.questions.splice(idx, 1);
    this.renderForm();
    this.updateOutputs();
  }

  addCategory() {
    this.state.data.categories.push({ name: 'New category', description: '', items: ['New item'] });
    this.renderForm();
    this.updateOutputs();
  }

  removeCategory(index) {
    const idx = Number(index);
    if (this.state.data.categories.length <= 2) return;
    this.state.data.categories.splice(idx, 1);
    this.renderForm();
    this.updateOutputs();
  }

  addItem(categoryIndex) {
    const idx = Number(categoryIndex);
    this.state.data.categories[idx].items.push('New item');
    this.renderForm();
    this.updateOutputs();
  }

  removeItem(categoryIndex, itemIndex) {
    const cIdx = Number(categoryIndex);
    const iIdx = Number(itemIndex);
    const items = this.state.data.categories[cIdx].items;
    if (items.length <= 1) return;
    items.splice(iIdx, 1);
    this.renderForm();
    this.updateOutputs();
  }

  addTableRow() {
    const columns = this.state.data.columnHeaders.length - 1;
    const answers = Array.from({ length: columns }, () => '');
    this.state.data.rows.push({ label: 'Row label', answers });
    this.renderForm();
    this.updateOutputs();
  }

  removeTableRow(index) {
    const idx = Number(index);
    if (this.state.data.rows.length <= 1) return;
    this.state.data.rows.splice(idx, 1);
    this.renderForm();
    this.updateOutputs();
  }

  addTeam() {
    const nextIndex = this.state.data.teams.length + 1;
    this.state.data.teams.push({ name: `Team ${nextIndex}`, icon: 'fa-solid fa-star', score: 0 });
    this.renderForm();
    this.updateOutputs();
  }

  removeTeam(index) {
    const idx = Number(index);
    if (this.state.data.teams.length <= 1) return;
    this.state.data.teams.splice(idx, 1);
    this.renderForm();
    this.updateOutputs();
  }

  renderForm() {
    const { type, data } = this.state;
    const presets = this.getPresetsForType(type);
    const selectedPresetId = this.state.presetId || '';
    const hasPresetSelection = Boolean(selectedPresetId);
    let markup = '';

    const meta = TYPE_META[type] || TYPE_META.default;

    const placeholderLabel = presets.length
      ? 'Start from default template'
      : 'No saved presets yet — using default template';
    const presetOptions = [
      `<option value="" ${hasPresetSelection ? '' : 'selected'}>${placeholderLabel}</option>`,
      ...presets.map(
        (preset) =>
          `<option value="${escapeHtml(preset.id)}" ${
            preset.id === selectedPresetId ? 'selected' : ''
          }>${escapeHtml(preset.name)}</option>`
      ),
    ].join('');

    const presetControls = `
      <section class="form-section preset-section">
        <header class="section-heading">
          <div>
            <h2><i class="fa-solid fa-floppy-disk"></i> Presets</h2>
            <p>Choose, save, or manage presets for this activity type.</p>
          </div>
        </header>
        <div class="preset-toolbar">
          <label class="field">
            <span class="field-label"><i class="fa-solid fa-folder-open"></i> Saved presets</span>
            <select id="preset-select" aria-label="Saved presets">
              ${presetOptions}
            </select>
          </label>
          <div class="preset-actions">
            <button type="button" class="chip-btn" data-action="preset-save"><i class="fa-solid fa-floppy-disk"></i> Save as new</button>
            <button type="button" class="chip-btn" data-action="preset-rename" ${hasPresetSelection ? '' : 'disabled'}><i class="fa-solid fa-pen-to-square"></i> Rename</button>
            <button type="button" class="chip-btn" data-action="preset-delete" ${hasPresetSelection ? '' : 'disabled'}><i class="fa-solid fa-trash-can"></i> Delete</button>
          </div>
        </div>
      </section>
    `;

    const hero = `
      <section class="form-hero accent-${meta.accent}">
        <div class="form-hero-icon" aria-hidden="true">
          <i class="fa-solid ${meta.icon}"></i>
        </div>
        <div class="form-hero-copy">
          <p class="form-hero-eyebrow">Activity preset</p>
          <h2>${meta.label}</h2>
          <p>${meta.helper}</p>
        </div>
      </section>
    `;

    const shared = `
      <section class="form-section">
        <header class="section-heading">
          <div>
            <h2><i class="fa-solid fa-sliders"></i> General settings</h2>
            <p>Set the core messaging that anchors this activity for learners.</p>
          </div>
        </header>
        <div class="form-grid">
          <label class="field">
            <span class="field-label"><i class="fa-solid fa-heading"></i> Activity title</span>
            <input type="text" value="${escapeHtml(data.title)}" data-field="title" placeholder="Enter a descriptive title" />
          </label>
          <label class="field field--span">
            <span class="field-label"><i class="fa-solid fa-bullseye"></i> Instructions</span>
            <textarea data-field="instructions" placeholder="Provide learner instructions">${escapeHtml(data.instructions)}</textarea>
          </label>
          <label class="field field--span">
            <span class="field-label"><i class="fa-solid fa-star"></i> Rubric / success criteria</span>
            <textarea data-field="rubric" placeholder="Describe how the activity is graded">${escapeHtml(data.rubric)}</textarea>
          </label>
        </div>
      </section>
    `;

    if (type === 'multiple-choice') {
      markup = [
        hero,
        shared,
        '<section class="form-section">',
        '<header class="section-heading">',
        '<div>',
        '<h2><i class="fa-solid fa-square-check"></i> Questions</h2>',
        '<p>Create prompts, explanations, and mark every correct answer.</p>',
        '</div>',
        '<button type="button" class="chip-btn" data-action="add-question"><i class="fa-solid fa-plus"></i> Add question</button>',
        '</header>',
        ...data.questions.map((question, qIndex) => `
          <article class="question-block" data-block="question" data-index="${qIndex}">
            <div class="block-header">
              <h3>Question ${qIndex + 1}</h3>
              <button type="button" class="subtle-link" data-action="remove-question"><i class="fa-solid fa-trash-can"></i> Remove</button>
            </div>
            <label class="field">
              <span class="field-label"><i class="fa-solid fa-pen-to-square"></i> Prompt</span>
              <textarea data-field="prompt" placeholder="Enter the learner prompt">${escapeHtml(question.prompt)}</textarea>
            </label>
            <label class="field">
              <span class="field-label"><i class="fa-solid fa-message"></i> Feedback explanation</span>
              <textarea data-field="explanation" placeholder="Explain the answer">${escapeHtml(question.explanation)}</textarea>
            </label>
            <div class="option-list">
              ${question.options
                .map(
                  (option, oIndex) => `
                    <div class="option-row" data-block="option" data-option-index="${oIndex}">
                      <label class="checkbox">
                        <input type="checkbox" data-field="option-correct" ${option.correct ? 'checked' : ''} />
                        <span>Correct</span>
                      </label>
                      <input type="text" data-field="option-text" value="${escapeHtml(option.text)}" placeholder="Option text" />
                      <button type="button" class="subtle-link" data-action="remove-option" aria-label="Remove option"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                  `
                )
                .join('')}
            </div>
            <button type="button" class="chip-btn" data-action="add-option"><i class="fa-solid fa-plus"></i> Add option</button>
          </article>
        `),
        '</section>'
      ].join('');
    } else if (type === 'quiz-show') {
      const defaultTime = Number.isFinite(Number(data.defaultTime)) ? Number(data.defaultTime) : 45;
      const iconSuggestions = [
        'fa-solid fa-star',
        'fa-solid fa-crown',
        'fa-solid fa-dragon',
        'fa-solid fa-rocket',
        'fa-solid fa-meteor',
        'fa-solid fa-feather-pointed',
        'fa-solid fa-fire-flame-curved',
        'fa-solid fa-leaf'
      ];
      const datalistId = 'team-icon-options';
      const teamDatalist = `
        <datalist id="${datalistId}">
          ${iconSuggestions.map((icon) => `<option value="${escapeHtml(icon)}"></option>`).join('')}
        </datalist>
      `;

      const quizShared = `
        <section class="form-section">
          <header class="section-heading">
            <div>
              <h2><i class="fa-solid fa-sliders"></i> General settings</h2>
              <p>Frame the quiz for your learners and set a pacing baseline.</p>
            </div>
          </header>
          <div class="form-grid">
            <label class="field">
              <span class="field-label"><i class="fa-solid fa-heading"></i> Activity title</span>
              <input type="text" value="${escapeHtml(data.title)}" data-field="title" placeholder="Enter a descriptive title" />
            </label>
            <label class="field field--span">
              <span class="field-label"><i class="fa-solid fa-bullseye"></i> Instructions</span>
              <textarea data-field="instructions" placeholder="Provide learner instructions">${escapeHtml(
                data.instructions
              )}</textarea>
            </label>
            <label class="field field--span">
              <span class="field-label"><i class="fa-solid fa-star"></i> Rubric / success criteria</span>
              <textarea data-field="rubric" placeholder="Describe how the activity is graded">${escapeHtml(data.rubric)}</textarea>
            </label>
            <label class="field">
              <span class="field-label"><i class="fa-solid fa-clock"></i> Default time per question (seconds)</span>
              <input type="number" min="5" max="600" step="5" value="${escapeHtml(
                String(defaultTime)
              )}" data-field="default-time" />
            </label>
          </div>
        </section>
      `;

      const scoreboardSection = `
        <section class="form-section">
          <header class="section-heading">
            <div>
              <h2><i class="fa-solid fa-people-group"></i> Scoreboard teams</h2>
              <p>Pick an icon and label for each team. Scores persist across every slide.</p>
            </div>
            <button type="button" class="chip-btn" data-action="add-team"><i class="fa-solid fa-plus"></i> Add team</button>
          </header>
          ${teamDatalist}
          ${data.teams
            .map(
              (team, tIndex) => `
                <article class="team-block" data-block="team" data-index="${tIndex}">
                  <div class="block-header">
                    <h3>Team ${tIndex + 1}</h3>
                    <button type="button" class="subtle-link" data-action="remove-team"><i class="fa-solid fa-trash-can"></i> Remove</button>
                  </div>
                  <div class="team-fields">
                    <label class="field">
                      <span class="field-label"><i class="fa-solid fa-pen-to-square"></i> Team name</span>
                      <input type="text" data-field="team-name" value="${escapeHtml(team.name || '')}" placeholder="Team name" />
                    </label>
                    <label class="field">
                      <span class="field-label"><i class="fa-solid fa-icons"></i> Font Awesome icon class</span>
                      <input type="text" list="${datalistId}" data-field="team-icon" value="${escapeHtml(
                        team.icon || ''
                      )}" placeholder="e.g. fa-solid fa-rocket" />
                      <p class="helper-text">Preview updates as you type.</p>
                    </label>
                    <div class="team-icon-preview" aria-hidden="true">
                      <i class="${escapeHtml(team.icon || 'fa-solid fa-people-group')}"></i>
                    </div>
                  </div>
                </article>
              `
            )
            .join('')}
        </section>
      `;

      const slidesSection = `
        <section class="form-section">
          <header class="section-heading">
            <div>
              <h2><i class="fa-solid fa-clapperboard"></i> Slide content</h2>
              <p>One question per slide. Add imagery and custom timing to pace your session.</p>
            </div>
            <button type="button" class="chip-btn" data-action="add-quiz-question"><i class="fa-solid fa-plus"></i> Add slide</button>
          </header>
          ${data.questions
            .map(
              (question, qIndex) => `
                <article class="quiz-question-block" data-block="quiz-question" data-index="${qIndex}">
                  <div class="block-header">
                    <h3>Slide ${qIndex + 1}</h3>
                    <button type="button" class="subtle-link" data-action="remove-quiz-question"><i class="fa-solid fa-trash-can"></i> Remove</button>
                  </div>
                  <label class="field field--span">
                    <span class="field-label"><i class="fa-solid fa-question"></i> Question prompt</span>
                    <textarea data-field="question-prompt" placeholder="Enter the question learners will see">${escapeHtml(
                      question.prompt || ''
                    )}</textarea>
                  </label>
                  <label class="field field--span">
                    <span class="field-label"><i class="fa-solid fa-lightbulb"></i> Correct answer</span>
                    <textarea data-field="question-answer" placeholder="Answer to reveal">${escapeHtml(
                      question.answer || ''
                    )}</textarea>
                  </label>
                  <label class="field field--span">
                    <span class="field-label"><i class="fa-solid fa-comment-dots"></i> Feedback or extension</span>
                    <textarea data-field="question-feedback" placeholder="Add an interesting note or follow-up">${escapeHtml(
                      question.feedback || ''
                    )}</textarea>
                  </label>
                  <div class="quiz-question-grid">
                    <label class="field">
                      <span class="field-label"><i class="fa-solid fa-image"></i> Image URL (optional)</span>
                      <input type="url" data-field="question-image" value="${escapeHtml(
                        question.image || ''
                      )}" placeholder="https://" />
                    </label>
                    <label class="field">
                      <span class="field-label"><i class="fa-solid fa-hourglass"></i> Time limit (seconds)</span>
                      <input type="number" min="5" max="600" step="5" data-field="question-time" value="${escapeHtml(
                        String(
                          Number.isFinite(Number(question.time)) && Number(question.time) > 0
                            ? Number(question.time)
                            : defaultTime
                        )
                      )}" />
                    </label>
                  </div>
                </article>
              `
            )
            .join('')}
        </section>
      `;

      markup = [hero, quizShared, scoreboardSection, slidesSection].join('');
    } else if (type === 'gapfill') {
      markup = `
        ${hero}
        ${shared}
        <section class="form-section">
          <header class="section-heading">
            <div>
              <h2><i class="fa-solid fa-i-cursor"></i> Passage</h2>
              <p>Use double brackets to indicate each blank learners will complete.</p>
            </div>
          </header>
          <label class="field field--span">
            <span class="field-label"><i class="fa-solid fa-highlighter"></i> Passage text with blanks</span>
            <textarea data-field="passage" placeholder="Wrap each answer in double brackets like [[answer|alternate]]">${escapeHtml(
              data.passage
            )}</textarea>
          </label>
          <p class="helper-text"><i class="fa-solid fa-lightbulb"></i> Separate alternate correct answers with a vertical bar. Each pair of brackets creates an input.</p>
        </section>
      `;
    } else if (type === 'grouping') {
      markup = [
        hero,
        shared,
        '<section class="form-section">',
        '<header class="section-heading">',
        '<div>',
        '<h2><i class="fa-solid fa-folder-tree"></i> Categories & cards</h2>',
        '<p>Define the target groups and the cards learners will sort.</p>',
        '</div>',
        '<button type="button" class="chip-btn" data-action="add-category"><i class="fa-solid fa-plus"></i> Add category</button>',
        '</header>',
        ...data.categories.map(
          (category, cIndex) => `
            <article class="category-block" data-block="category" data-index="${cIndex}">
              <div class="block-header">
                <h3>Category ${cIndex + 1}</h3>
                <button type="button" class="subtle-link" data-action="remove-category"><i class="fa-solid fa-trash-can"></i> Remove</button>
              </div>
              <label class="field">
                <span class="field-label"><i class="fa-solid fa-tag"></i> Name</span>
                <input type="text" data-field="category-name" value="${escapeHtml(category.name)}" placeholder="Category name" />
              </label>
              <label class="field">
                <span class="field-label"><i class="fa-solid fa-align-left"></i> Description (optional)</span>
                <textarea data-field="category-description" placeholder="Helpful hints or criteria">${escapeHtml(
                  category.description || ''
                )}</textarea>
              </label>
              <div class="items">
                ${category.items
                  .map(
                    (item, iIndex) => `
                      <div class="item-row" data-block="item" data-item-index="${iIndex}">
                        <input type="text" value="${escapeHtml(item)}" placeholder="Card text" />
                        <button type="button" class="subtle-link" data-action="remove-item" aria-label="Remove card"><i class="fa-solid fa-xmark"></i></button>
                      </div>
                    `
                  )
                  .join('')}
              </div>
              <button type="button" class="chip-btn" data-action="add-item"><i class="fa-solid fa-plus"></i> Add card</button>
            </article>
          `
        ),
        '</section>'
      ].join('');
    } else if (type === 'table-completion') {
      markup = [
        hero,
        shared,
        '<section class="form-section">',
        '<header class="section-heading">',
        '<div>',
        '<h2><i class="fa-solid fa-table"></i> Table structure</h2>',
        '<p>Specify the headers and the correct answers for each row.</p>',
        '</div>',
        '<button type="button" class="chip-btn" data-action="add-row"><i class="fa-solid fa-plus"></i> Add row</button>',
        '</header>',
        '<div class="table-headers" data-block="table-header">',
        data.columnHeaders
          .map(
            (header, hIndex) => `
              <label class="field">
                <span class="field-label"><i class="fa-solid fa-heading"></i> Header ${hIndex + 1}</span>
                <input type="text" value="${escapeHtml(header)}" data-header-index="${hIndex}" />
              </label>
            `
          )
          .join(''),
        '</div>',
        '<p class="helper-text">Header 1 is used for the row labels. Remaining headers represent blanks learners will complete.</p>',
        ...data.rows.map(
          (row, rIndex) => `
            <article class="table-row-block" data-block="table-row" data-index="${rIndex}">
              <div class="block-header">
                <h3>Row ${rIndex + 1}</h3>
                <button type="button" class="subtle-link" data-action="remove-row"><i class="fa-solid fa-trash-can"></i> Remove</button>
              </div>
              <label class="field">
                <span class="field-label"><i class="fa-solid fa-text-width"></i> Row label</span>
                <input type="text" data-field="row-label" value="${escapeHtml(row.label)}" placeholder="Row label" />
              </label>
              <div class="cell-row">
                ${row.answers
                  .map(
                    (cell, cellIndex) => `
                      <label class="field">
                        <span class="field-label"><i class="fa-solid fa-pen-to-square"></i> Cell ${cellIndex + 1}</span>
                        <input type="text" data-field="row-answer-${cellIndex}" value="${escapeHtml(cell)}" placeholder="Correct value" />
                      </label>
                    `
                  )
                  .join('')}
              </div>
            </article>
          `
        ),
        '</section>'
      ].join('');
    }

    if (!markup) {
      markup = `${hero}${shared}`;
    }

    const finalMarkup = `${presetControls}${markup}`;
    this.formContainer.innerHTML = finalMarkup;

    this.presetSelect = this.formContainer.querySelector('#preset-select');
    if (this.presetSelect) {
      this.presetSelect.addEventListener('change', this.handlePresetSelect);
    }

    const renameBtn = this.formContainer.querySelector('[data-action="preset-rename"]');
    const deleteBtn = this.formContainer.querySelector('[data-action="preset-delete"]');
    if (renameBtn) {
      renameBtn.disabled = !hasPresetSelection;
    }
    if (deleteBtn) {
      deleteBtn.disabled = !hasPresetSelection;
    }

    // annotate inputs for headers (for change events)
    if (this.state.type === 'table-completion') {
      this.formContainer.querySelectorAll('[data-header-index]').forEach((input) => {
        input.dataset.field = 'table-header';
      });
    }

    if (this.state.type === 'grouping') {
      this.formContainer.querySelectorAll('.category-block .items input').forEach((input) => {
        input.dataset.field = 'item-text';
      });
    }
  }

  getCurrentConfig() {
    const { type, data, presetId } = this.state;
    return {
      type,
      data: deepClone(data),
      presetId: presetId ?? null,
    };
  }

  loadConfig(config, { announce = true } = {}) {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const type = typeof config.type === 'string' ? config.type : null;
    if (!type || !(type in DEFAULT_STATES)) {
      return false;
    }

    const baseData =
      config.data && typeof config.data === 'object'
        ? deepClone(config.data)
        : this.getDefaultState(type);

    if (!baseData || typeof baseData !== 'object') {
      return false;
    }

    const presetId =
      typeof config.presetId === 'string' && config.presetId.trim()
        ? config.presetId.trim()
        : null;

    this.state = {
      type,
      data: baseData,
      presetId,
    };

    if (this.typeSelect) {
      this.typeSelect.value = type;
    }

    this.renderForm();
    this.updateOutputs();
    this.flushUpdateQueue();

    if (announce) {
      const meta = TYPE_META[type] || TYPE_META.default;
      this.announceStatus(`${meta.label} loaded from deck.`);
    }

    return true;
  }

  updateOutputs() {
    const config = this.getCurrentConfig();
    this.scheduleRender(config);
  }

  async copyHtml() {
    try {
      this.forceUpdate();
      await navigator.clipboard.writeText(this.outputArea.value);
      this.showAlert('HTML copied to clipboard.');
    } catch (error) {
      console.error(error);
      this.showAlert('Copy failed. Select and copy manually.');
    }
  }

  downloadHtml() {
    let downloadUrl;
    let anchor;
    try {
      this.forceUpdate();
      const html = this.outputArea?.value ?? '';
      if (!html.trim()) {
        this.showAlert('Build an activity before downloading.');
        return;
      }

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      downloadUrl = URL.createObjectURL(blob);
      const title = (this.state?.data?.title || 'activity').trim().toLowerCase();
      const slug = title.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'activity';
      const filename = `${slug}-module.html`;

      anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      this.showAlert(`Downloaded ${filename}.`);
    } catch (error) {
      console.error('Unable to download activity HTML', error);
      this.showAlert('Download failed. Try copying the HTML instead.');
    } finally {
      if (anchor?.parentNode) {
        anchor.remove();
      }
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    }
  }

  sendToDeck() {
    if (!this.isEmbedded) {
      this.showAlert('Open this builder inside the deck to send modules directly.');
      return;
    }
    this.forceUpdate();
    const html = this.outputArea.value;
    if (!html.trim()) {
      this.showAlert('Build an activity before sending it to the deck.');
      return;
    }

    const payload = {
      source: 'noor-activity-builder',
      type: 'activity-module',
      config: this.getCurrentConfig(),
      html,
    };

    try {
      window.parent.postMessage(payload, '*');
      this.showAlert('Sent to the deck workspace.');
    } catch (error) {
      console.error('Unable to send module to deck', error);
      this.showAlert('Unable to send module to the deck right now.');
    }
  }

  showAlert(message) {
    const alertNode = this.alertTemplate.content.firstElementChild.cloneNode(true);
    alertNode.textContent = message;
    document.body.appendChild(alertNode);
    this.announceStatus(message);
    requestAnimationFrame(() => alertNode.classList.add('show'));
    setTimeout(() => {
      alertNode.classList.remove('show');
      alertNode.addEventListener('transitionend', () => alertNode.remove(), { once: true });
    }, 2600);
  }
}

const Generators = {
  'multiple-choice': (config) => {
    const questionsMarkup = config.questions
      .map((question, qIndex) => {
        const hasMultipleCorrect = question.options.filter((option) => option.correct).length > 1;
        const inputType = hasMultipleCorrect ? 'checkbox' : 'radio';
        const optionsMarkup = question.options
          .map((option, oIndex) => {
            const optionId = `q${qIndex}-option${oIndex}`;
            return `
              <label class="mc-option" data-correct="${option.correct}">
                <input type="${inputType}" name="question-${qIndex}" value="${oIndex}" ${inputType === 'checkbox' ? '' : 'required'} />
                <span>${escapeHtml(option.text)}</span>
              </label>
            `;
          })
          .join('');
        return `
          <section class="mc-question" data-question-index="${qIndex}" data-explanation="${escapeHtml(
          question.explanation
        )}">
            <h3 class="mc-question-title">${escapeHtml(question.prompt)}</h3>
            <div class="mc-options" role="group" aria-label="${escapeHtml(question.prompt)}">
              ${optionsMarkup}
            </div>
          </section>
        `;
      })
      .join('');

    return wrapInTemplate(config, `
      <div class="mc-activity">
        ${questionsMarkup}
        <div class="activity-actions">
          <button id="mc-check" class="activity-btn">Check answers</button>
          <button id="mc-reset" class="activity-btn secondary">Reset</button>
        </div>
        <aside id="mc-feedback" class="mc-feedback" hidden>
          <h3>Feedback</h3>
          <p id="mc-score"></p>
          <div id="mc-details"></div>
          <button id="mc-close" class="activity-btn secondary">Close</button>
        </aside>
      </div>
      <script>
        (() => {
          const toArray = (nodeList) => Array.prototype.slice.call(nodeList);
          const questions = toArray(document.querySelectorAll('.mc-question'));
          const checkBtn = document.getElementById('mc-check');
          const resetBtn = document.getElementById('mc-reset');
          const feedback = document.getElementById('mc-feedback');
          const scoreLine = document.getElementById('mc-score');
          const details = document.getElementById('mc-details');
          const closeBtn = document.getElementById('mc-close');

          const evaluate = () => {
            let correctCount = 0;
            let totalCount = questions.length;
            details.innerHTML = '';

            questions.forEach((question, index) => {
              const options = toArray(question.querySelectorAll('.mc-option'));
              const expected = options.filter((opt) => opt.dataset.correct === 'true').map((opt) => options.indexOf(opt));
              const selected = options
                .map((opt, idx) => ({ opt, idx }))
                .filter(({ opt }) => opt.querySelector('input').checked)
                .map(({ idx }) => idx);

              const isCorrect = expected.length === selected.length && expected.every((value) => selected.includes(value));
              if (isCorrect) {
                correctCount += 1;
              }
              const learnerAnswer = selected.length
                ? selected.map((idx) => options[idx].innerText.trim()).join(', ')
                : 'No response';
              const correctAnswer = expected.length
                ? expected.map((idx) => options[idx].innerText.trim()).join(', ')
                : 'No correct answer provided';
              const detail = document.createElement('div');
              detail.className = 'feedback-item ' + (isCorrect ? 'correct' : 'incorrect');
              const correctAnswerMarkup = isCorrect
                ? ''
                : '<p><strong>Correct answer:</strong> ' + correctAnswer + '</p>';
              detail.innerHTML =
                '<h4>' +
                question.querySelector('.mc-question-title').innerText +
                '</h4>' +
                '<p><strong>Your answer:</strong> ' +
                learnerAnswer +
                '</p>' +
                correctAnswerMarkup +
                '<p class="explanation">' +
                (question.dataset.explanation || '') +
                '</p>';
              details.appendChild(detail);
            });

            scoreLine.textContent =
              'You answered ' + correctCount + ' of ' + totalCount + ' correctly.';
            feedback.hidden = false;
            feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
          };

          checkBtn.addEventListener('click', evaluate);
          closeBtn.addEventListener('click', () => (feedback.hidden = true));
          resetBtn.addEventListener('click', () => {
            details.innerHTML = '';
            feedback.hidden = true;
            document.querySelectorAll('.mc-options input').forEach((input) => {
              if (input.type === 'radio' || input.type === 'checkbox') {
                input.checked = false;
              }
            });
          });
        })();
      </script>
    `);
  },
  'quiz-show': (config) => {
    const fallback = DEFAULT_STATES['quiz-show']();
    const questions = Array.isArray(config.questions) && config.questions.length ? config.questions : fallback.questions;
    const teams = Array.isArray(config.teams) && config.teams.length ? config.teams : fallback.teams;
    const defaultTime = Number.isFinite(Number(config.defaultTime)) && Number(config.defaultTime) > 0
      ? Math.round(Number(config.defaultTime))
      : fallback.defaultTime;

    const teamsMarkup = teams
      .map((team, index) => {
        const iconClass = team.icon && team.icon.trim() ? team.icon.trim() : 'fa-solid fa-people-group';
        const teamName = team.name && team.name.trim() ? team.name.trim() : `Team ${index + 1}`;
        const scoreValue = Number.isFinite(Number(team.score)) ? Number(team.score) : 0;
        return `
          <li class="team-card" data-team-index="${index}" data-score="${scoreValue}">
            <div class="team-icon-shell"><i class="${escapeHtml(iconClass)}" aria-hidden="true"></i></div>
            <div class="team-meta">
              <span class="team-name">${escapeHtml(teamName)}</span>
              <span class="team-score" data-role="score">${scoreValue}</span>
            </div>
            <button type="button" class="score-btn" data-action="increment" aria-label="Add a point to ${escapeHtml(teamName)}">
              <i class="fa-solid fa-arrow-up-long" aria-hidden="true"></i>
            </button>
            <span class="burst" aria-hidden="true"></span>
          </li>
        `;
      })
      .join('');

    const slidesMarkup = questions
      .map((question, index) => {
        const slideTime = Number.isFinite(Number(question.time)) && Number(question.time) > 0
          ? Math.round(Number(question.time))
          : defaultTime;
        const prompt = question.prompt ? formatMultiline(question.prompt) : '<em>Add a prompt in the builder.</em>';
        const answer = question.answer ? formatMultiline(question.answer) : '<em>Add the answer in the builder.</em>';
        const feedback = question.feedback
          ? formatMultiline(question.feedback)
          : '<em>Provide follow-up or feedback.</em>';
        const imageMarkup = question.image && question.image.trim()
          ? `
            <figure class="quiz-visual">
              <img src="${escapeHtml(question.image)}" alt="${escapeHtml(`Illustration for question ${index + 1}`)}" loading="lazy" />
            </figure>
          `
          : '';

        return `
          <article class="quiz-slide ${index === 0 ? 'is-active' : ''}" data-slide-index="${index}" data-time="${slideTime}">
            <header class="quiz-slide-header">
              <span class="quiz-pill">Question ${index + 1}</span>
              <span class="quiz-slide-timer" data-slide-timer>${slideTime}s</span>
            </header>
            <div class="quiz-slide-body">
              <div class="quiz-copy">
                <div class="quiz-question-text">${prompt}</div>
                <div class="quiz-reveal-content">
                  <div class="quiz-answer">
                    <h3><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Answer</h3>
                    <p>${answer}</p>
                  </div>
                  <div class="quiz-feedback">
                    <h3><i class="fa-solid fa-star" aria-hidden="true"></i> Extension</h3>
                    <p>${feedback}</p>
                  </div>
                </div>
              </div>
              ${imageMarkup}
            </div>
            <footer class="quiz-slide-footer">
              <button type="button" class="activity-btn secondary quiz-reveal-btn" data-role="reveal">
                <i class="fa-solid fa-eye" aria-hidden="true"></i>
                <span>Reveal answer</span>
              </button>
            </footer>
          </article>
        `;
      })
      .join('');

    return wrapInTemplate(config, `
      <style>
        .quiz-show {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .quiz-stage {
          position: relative;
          padding-top: 1.5rem;
        }

        .quiz-frame {
          background: rgba(246, 248, 243, 0.75);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2rem 1.75rem 2.5rem;
          min-height: 360px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .quiz-scoreboard {
          position: absolute;
          top: -1.5rem;
          right: -1.5rem;
          width: min(260px, 80vw);
          background: #fff;
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 22px 38px rgba(31, 38, 28, 0.12);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          z-index: 5;
        }

        .scoreboard-header h2 {
          margin: 0;
          font-size: 1.1rem;
          font-family: 'Questrial', sans-serif;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .scoreboard-header p {
          margin: 0;
          color: var(--muted);
          font-size: 0.85rem;
        }

        .scoreboard-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .team-card {
          position: relative;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0.75rem;
          align-items: center;
          background: rgba(246, 248, 243, 0.65);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 0.75rem 0.9rem;
          overflow: hidden;
        }

        .team-icon-shell {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: var(--accent-soft);
          color: var(--accent);
          font-size: 1.25rem;
        }

        .team-name {
          display: block;
          font-weight: 700;
        }

        .team-score {
          display: block;
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--accent);
        }

        .score-btn {
          border: none;
          background: var(--accent);
          color: #fff;
          border-radius: 50%;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .score-btn:hover,
        .score-btn:focus-visible {
          transform: translateY(-1px);
          box-shadow: 0 12px 28px rgba(61, 111, 93, 0.35);
          outline: none;
        }

        .burst {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(255, 215, 141, 0.9) 0%, rgba(255, 215, 141, 0) 70%);
          opacity: 0;
          transform: scale(0.7);
          pointer-events: none;
          border-radius: inherit;
        }

        .team-card.bursting .burst {
          animation: quiz-burst 550ms ease-out forwards;
        }

        @keyframes quiz-burst {
          0% {
            opacity: 0.85;
            transform: scale(0.65);
          }
          100% {
            opacity: 0;
            transform: scale(1.2);
          }
        }

        .quiz-progress {
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .quiz-slides {
          position: relative;
        }

        .quiz-slide {
          display: none;
          flex-direction: column;
          gap: 1.5rem;
        }

        .quiz-slide.is-active {
          display: flex;
        }

        .quiz-slide-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .quiz-pill {
          background: var(--accent);
          color: #fff;
          border-radius: 999px;
          padding: 0.35rem 1rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-size: 0.75rem;
        }

        .quiz-slide-timer {
          font-weight: 700;
          color: var(--accent);
        }

        .quiz-slide-body {
          display: grid;
          gap: 1.25rem;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          align-items: start;
        }

        .quiz-copy {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .quiz-question-text {
          font-size: 1.25rem;
          line-height: 1.7;
        }

        .quiz-visual {
          margin: 0;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 18px 36px rgba(31, 38, 28, 0.12);
          border: 1px solid var(--border);
        }

        .quiz-visual img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }

        .quiz-reveal-content {
          border-top: 1px dashed var(--border);
          padding-top: 1rem;
          display: grid;
          gap: 0.75rem;
          opacity: 0;
          max-height: 0;
          overflow: hidden;
          transition: opacity 0.35s ease, max-height 0.35s ease;
        }

        .quiz-slide.is-revealed .quiz-reveal-content {
          opacity: 1;
          max-height: 640px;
        }

        .quiz-answer h3,
        .quiz-feedback h3 {
          margin: 0 0 0.4rem;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .quiz-answer p,
        .quiz-feedback p {
          margin: 0;
        }

        .quiz-slide-footer {
          display: flex;
          justify-content: flex-end;
        }

        .quiz-slide.time-up .quiz-slide-header {
          animation: pulse-accent 1s ease-in-out infinite;
        }

        @keyframes pulse-accent {
          0%,
          100% {
            color: var(--accent);
          }
          50% {
            color: var(--error);
          }
        }

        .quiz-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .quiz-timer {
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--accent);
        }

        .quiz-controls button[disabled] {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 860px) {
          .quiz-scoreboard {
            position: static;
            width: 100%;
            margin-bottom: 1.5rem;
          }

          .quiz-stage {
            padding-top: 0;
          }

          .quiz-frame {
            padding: 1.5rem;
          }
        }
      </style>
      <div class="quiz-show">
        <div class="quiz-stage" data-default-time="${defaultTime}">
          <aside class="quiz-scoreboard" aria-label="Scoreboard">
            <div class="scoreboard-header">
              <h2><i class="fa-solid fa-trophy" aria-hidden="true"></i> Scoreboard</h2>
              <p>Tap the arrow to award a point.</p>
            </div>
            <ul class="scoreboard-list">
              ${teamsMarkup}
            </ul>
          </aside>
          <div class="quiz-frame">
            <div class="quiz-progress" id="quiz-progress" aria-live="polite"></div>
            <div class="quiz-slides">
              ${slidesMarkup}
            </div>
            <div class="quiz-controls">
              <button type="button" class="activity-btn secondary" id="quiz-prev">
                <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
                <span>Previous</span>
              </button>
              <div class="quiz-timer">Time left: <span id="quiz-timer-value">${defaultTime}s</span></div>
              <button type="button" class="activity-btn" id="quiz-next">
                <span>Next</span>
                <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      <script>
        (() => {
          const stage = document.querySelector('.quiz-stage');
          if (!stage) return;
          const slides = Array.from(stage.querySelectorAll('.quiz-slide'));
          if (!slides.length) return;
          const defaultTime = Number(stage.dataset.defaultTime) || ${defaultTime};
          const prevBtn = document.getElementById('quiz-prev');
          const nextBtn = document.getElementById('quiz-next');
          const timerDisplay = document.getElementById('quiz-timer-value');
          const progressDisplay = document.getElementById('quiz-progress');
          let activeIndex = slides.findIndex((slide) => slide.classList.contains('is-active'));
          if (activeIndex < 0) activeIndex = 0;
          let timerId = null;
          let remaining = 0;

          const getSlideTime = (slide) => {
            const raw = Number(slide.dataset.time);
            if (Number.isFinite(raw) && raw > 0) {
              return Math.round(raw);
            }
            return defaultTime;
          };

          const updateButtons = () => {
            if (prevBtn) {
              prevBtn.disabled = activeIndex === 0;
            }
            if (nextBtn) {
              const label = nextBtn.querySelector('span');
              if (label) {
                label.textContent = activeIndex === slides.length - 1 ? 'Restart' : 'Next';
              }
            }
          };

          const setProgress = () => {
            if (!progressDisplay) return;
            progressDisplay.textContent = 'Question ' + (activeIndex + 1) + ' of ' + slides.length;
          };

          const updateTimerLabel = () => {
            const value = Math.max(0, Math.ceil(remaining)) + 's';
            if (timerDisplay) {
              timerDisplay.textContent = value;
            }
            const currentSlide = slides[activeIndex];
            const slideTimer = currentSlide ? currentSlide.querySelector('[data-slide-timer]') : null;
            if (slideTimer) {
              slideTimer.textContent = value;
            }
          };

          const clearTimer = () => {
            if (timerId) {
              window.clearInterval(timerId);
              timerId = null;
            }
          };

          const startTimer = (duration) => {
            clearTimer();
            remaining = duration;
            updateTimerLabel();
            timerId = window.setInterval(() => {
              remaining -= 1;
              if (remaining <= 0) {
                remaining = 0;
                updateTimerLabel();
                clearTimer();
                const current = slides[activeIndex];
                if (current) {
                  current.classList.add('time-up');
                }
              } else {
                updateTimerLabel();
              }
            }, 1000);
          };

          const activateSlide = (index) => {
            if (index < 0 || index >= slides.length) return;
            slides.forEach((slide, idx) => {
              slide.classList.toggle('is-active', idx === index);
              if (idx === index) {
                slide.classList.remove('is-revealed', 'time-up');
              }
            });
            activeIndex = index;
            setProgress();
            updateButtons();
            startTimer(getSlideTime(slides[activeIndex]));
          };

          if (prevBtn) {
            prevBtn.addEventListener('click', () => {
              if (activeIndex > 0) {
                activateSlide(activeIndex - 1);
              }
            });
          }

          if (nextBtn) {
            nextBtn.addEventListener('click', () => {
              if (activeIndex === slides.length - 1) {
                activateSlide(0);
              } else {
                activateSlide(activeIndex + 1);
              }
            });
          }

          stage.addEventListener('click', (event) => {
            const revealBtn = event.target.closest('[data-role="reveal"]');
            if (!revealBtn) return;
            const slide = revealBtn.closest('.quiz-slide');
            if (!slide) return;
            const isRevealed = slide.classList.toggle('is-revealed');
            const labelSpan = revealBtn.querySelector('span');
            if (labelSpan) {
              labelSpan.textContent = isRevealed ? 'Hide answer' : 'Reveal answer';
            }
            const icon = revealBtn.querySelector('i');
            if (icon) {
              icon.classList.toggle('fa-eye', !isRevealed);
              icon.classList.toggle('fa-eye-slash', isRevealed);
            }
            if (isRevealed) {
              clearTimer();
              remaining = 0;
              updateTimerLabel();
            } else {
              startTimer(getSlideTime(slide));
            }
          });

          const scoreboard = stage.querySelector('.quiz-scoreboard');
          if (scoreboard) {
            scoreboard.addEventListener('click', (event) => {
              const button = event.target.closest('.score-btn');
              if (!button) return;
              const teamCard = button.closest('.team-card');
              if (!teamCard) return;
              const teamName = teamCard.querySelector('.team-name')?.textContent || 'team';
              const scoreEl = teamCard.querySelector('[data-role="score"]');
              let score = Number(teamCard.dataset.score || '0');
              score += 1;
              teamCard.dataset.score = score;
              if (scoreEl) {
                scoreEl.textContent = score;
              }
              teamCard.classList.remove('bursting');
              void teamCard.offsetWidth;
              teamCard.classList.add('bursting');
              button.setAttribute('aria-label', 'Add a point to ' + teamName + ' (current: ' + score + ')');
            });

            scoreboard.addEventListener('animationend', (event) => {
              if (event.target.classList.contains('burst')) {
                event.target.parentElement?.classList.remove('bursting');
              }
            });
          }

          activateSlide(activeIndex);
        })();
      </script>
    `);
  },
  gapfill: (config) => {
    const { segments, gaps } = parseGapfill(config.passage);
    let blankCounter = 0;
    const passageMarkup = segments
      .map((segment, index) => {
        const safeSegment = escapeHtml(segment);
        const gap = gaps[index];
        if (!gap) {
          return `<span>${safeSegment}</span>`;
        }
        const gapMarkup = `
          <span class="gap" data-answers="${gap.map((ans) => escapeHtml(ans)).join('|')}">
            <label class="visually-hidden" for="gap-${blankCounter}">Blank ${blankCounter + 1}</label>
            <input id="gap-${blankCounter}" type="text" aria-label="Blank ${blankCounter + 1}" placeholder="Type answer" />
          </span>
        `;
        blankCounter += 1;
        return `${safeSegment}${gapMarkup}`;
      })
      .join('');

    return wrapInTemplate(config, `
      <div class="gapfill-activity">
        <p class="gapfill-text">${passageMarkup}</p>
        <div class="activity-actions">
          <button id="gap-check" class="activity-btn">Check answers</button>
          <button id="gap-reset" class="activity-btn secondary">Reset</button>
        </div>
        <aside id="gap-feedback" class="gap-feedback" hidden>
          <h3>Feedback</h3>
          <p id="gap-score"></p>
          <div id="gap-details"></div>
          <button id="gap-close" class="activity-btn secondary">Close</button>
        </aside>
      </div>
      <script>
        (() => {
          const gaps = Array.from(document.querySelectorAll('.gap'));
          const checkBtn = document.getElementById('gap-check');
          const resetBtn = document.getElementById('gap-reset');
          const feedback = document.getElementById('gap-feedback');
          const scoreLine = document.getElementById('gap-score');
          const details = document.getElementById('gap-details');
          const closeBtn = document.getElementById('gap-close');

          const normalise = (value) => value.trim().toLowerCase();

          checkBtn.addEventListener('click', () => {
            let correct = 0;
            let attempted = 0;
            details.innerHTML = '';

            gaps.forEach((gap, index) => {
              const input = gap.querySelector('input');
              const learnerValue = normalise(input.value);
              const answers = gap.dataset.answers.split('|').map((ans) => normalise(ans));
              if (!learnerValue) {
                input.classList.remove('correct', 'incorrect');
                return;
              }
              attempted += 1;
              const isCorrect = answers.includes(learnerValue);
              if (isCorrect) correct += 1;
              input.classList.toggle('correct', isCorrect);
              input.classList.toggle('incorrect', !isCorrect);
              const detail = document.createElement('div');
              detail.className = 'feedback-item ' + (isCorrect ? 'correct' : 'incorrect');
              const acceptableAnswersMarkup = isCorrect
                ? ''
                :
                    '<p><strong>Acceptable answers:</strong> ' +
                    gap.dataset.answers.replace(/\\|/g, ', ') +
                    '</p>';
              detail.innerHTML =
                '<h4>Blank ' +
                (index + 1) +
                '</h4>' +
                '<p><strong>Your answer:</strong> ' +
                (input.value || 'No response') +
                '</p>' +
                acceptableAnswersMarkup;
              details.appendChild(detail);
            });

            if (attempted === 0) {
              scoreLine.textContent = 'Please complete at least one blank before checking.';
            } else {
              scoreLine.textContent =
                'You answered ' + correct + ' of ' + attempted + ' correctly.';
            }
            feedback.hidden = false;
            feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });

          resetBtn.addEventListener('click', () => {
            gaps.forEach((gap) => {
              const input = gap.querySelector('input');
              input.value = '';
              input.classList.remove('correct', 'incorrect');
            });
            feedback.hidden = true;
            details.innerHTML = '';
          });

          closeBtn.addEventListener('click', () => (feedback.hidden = true));
        })();
      </script>
    `);
  },
  grouping: (config) => {
    const items = config.categories.flatMap((category) =>
      category.items.map((item) => ({ text: item, category: category.name }))
    );
    const itemMarkup = items
      .map((item, index) => `
        <div class="group-item" draggable="true" data-category="${escapeHtml(item.category)}" id="group-item-${index}">
          ${escapeHtml(item.text)}
        </div>
      `)
      .join('');

    const categoryMarkup = config.categories
      .map(
        (category, index) => {
          const descriptionMarkup = category.description
            ? '<p>' + escapeHtml(category.description) + '</p>'
            : '';
          return `
          <section class="group-target" data-accepts="${escapeHtml(category.name)}">
            <header>
              <h3>${escapeHtml(category.name)}</h3>
              ${descriptionMarkup}
            </header>
            <div class="drop-zone" aria-label="${escapeHtml(category.name)}" data-zone-index="${index}"></div>
          </section>
        `;
        }
      )
      .join('');

    return wrapInTemplate(config, `
      <div class="grouping-activity">
        <div class="group-source" aria-label="Cards to sort">${itemMarkup}</div>
        <div class="group-targets">${categoryMarkup}</div>
        <div class="activity-actions">
          <button id="group-check" class="activity-btn">Check matches</button>
          <button id="group-reset" class="activity-btn secondary">Reset</button>
        </div>
        <aside id="group-feedback" class="group-feedback" hidden>
          <h3>Feedback</h3>
          <p id="group-score"></p>
          <div id="group-details"></div>
          <button id="group-close" class="activity-btn secondary">Close</button>
        </aside>
      </div>
      <script>
        (() => {
          const dragItems = Array.from(document.querySelectorAll('.group-item'));
          const dropZones = Array.from(document.querySelectorAll('.drop-zone'));
          const checkBtn = document.getElementById('group-check');
          const resetBtn = document.getElementById('group-reset');
          const feedback = document.getElementById('group-feedback');
          const scoreLine = document.getElementById('group-score');
          const details = document.getElementById('group-details');
          const closeBtn = document.getElementById('group-close');
          const sourceContainer = document.querySelector('.group-source');

          dragItems.forEach((item) => {
            item.addEventListener('dragstart', (event) => {
              event.dataTransfer.setData('text/plain', item.id);
              setTimeout(() => item.classList.add('dragging'), 0);
            });
            item.addEventListener('dragend', () => item.classList.remove('dragging'));
          });

          const allowDrop = (event) => {
            event.preventDefault();
          };

          dropZones.forEach((zone) => {
            zone.addEventListener('dragover', allowDrop);
            zone.addEventListener('drop', (event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData('text/plain');
              const dragged = document.getElementById(id);
              if (dragged) {
                zone.appendChild(dragged);
              }
            });
          });

          sourceContainer.addEventListener('dragover', allowDrop);
          sourceContainer.addEventListener('drop', (event) => {
            event.preventDefault();
            const id = event.dataTransfer.getData('text/plain');
            const dragged = document.getElementById(id);
            if (dragged) {
              sourceContainer.appendChild(dragged);
            }
          });

          checkBtn.addEventListener('click', () => {
            let correct = 0;
            let total = dragItems.length;
            details.innerHTML = '';

            dropZones.forEach((zone) => {
              const expected = zone.parentElement.querySelector('h3').innerText.trim();
              Array.from(zone.children).forEach((item) => {
                const isCorrect = item.dataset.category === expected;
                item.classList.toggle('correct', isCorrect);
                item.classList.toggle('incorrect', !isCorrect);
                if (isCorrect) correct += 1;
                const detail = document.createElement('div');
                detail.className = 'feedback-item ' + (isCorrect ? 'correct' : 'incorrect');
                detail.innerHTML =
                  '<h4>' +
                  item.innerText.trim() +
                  '</h4>' +
                  '<p>' +
                  (isCorrect
                    ? 'Placed correctly'
                    : 'Should be in ' + item.dataset.category) +
                  '</p>';
                details.appendChild(detail);
              });
            });

            scoreLine.textContent =
              'You sorted ' + correct + ' of ' + total + ' cards correctly.';
            feedback.hidden = false;
            feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });

          resetBtn.addEventListener('click', () => {
            dragItems.forEach((item) => {
              item.classList.remove('correct', 'incorrect');
              sourceContainer.appendChild(item);
            });
            details.innerHTML = '';
            feedback.hidden = true;
          });

          closeBtn.addEventListener('click', () => (feedback.hidden = true));
        })();
      </script>
    `);
  },
  'table-completion': (config) => {
    const tableMarkup = [`<thead><tr>`, ...config.columnHeaders.map((header) => `<th>${escapeHtml(header)}</th>`), '</tr></thead>'].join('');
    const bodyMarkup = config.rows
      .map((row, rowIndex) => {
        const cells = [`<th scope="row">${escapeHtml(row.label)}</th>`].concat(
          row.answers.map(
            (answer, answerIndex) => `
              <td>
                <label class="visually-hidden" for="cell-${rowIndex}-${answerIndex}">${escapeHtml(
              config.columnHeaders[answerIndex + 1] || 'Response'
            )} for ${escapeHtml(row.label)}</label>
                <input id="cell-${rowIndex}-${answerIndex}" type="text" data-answer="${escapeHtml(answer)}" data-header="${escapeHtml(
              config.columnHeaders[answerIndex + 1] || 'Response'
            )}" placeholder="Type here" />
              </td>
            `
          )
        );
        return `<tr>${cells.join('')}</tr>`;
      })
      .join('');

    return wrapInTemplate(config, `
      <div class="table-activity">
        <div class="table-wrapper">
          <table>${tableMarkup}<tbody>${bodyMarkup}</tbody></table>
        </div>
        <div class="activity-actions">
          <button id="table-check" class="activity-btn">Check answers</button>
          <button id="table-reset" class="activity-btn secondary">Reset</button>
        </div>
        <aside id="table-feedback" class="table-feedback" hidden>
          <h3>Feedback</h3>
          <p id="table-score"></p>
          <div id="table-details"></div>
          <button id="table-close" class="activity-btn secondary">Close</button>
        </aside>
      </div>
      <script>
        (() => {
          const inputs = Array.from(document.querySelectorAll('.table-activity input'));
          const checkBtn = document.getElementById('table-check');
          const resetBtn = document.getElementById('table-reset');
          const feedback = document.getElementById('table-feedback');
          const scoreLine = document.getElementById('table-score');
          const details = document.getElementById('table-details');
          const closeBtn = document.getElementById('table-close');
          const normalise = (value) => value.trim().toLowerCase();

          checkBtn.addEventListener('click', () => {
            let correct = 0;
            let attempted = 0;
            details.innerHTML = '';

            inputs.forEach((input) => {
              const learnerValue = normalise(input.value);
              const answer = normalise(input.dataset.answer || '');
              if (!learnerValue) {
                input.classList.remove('correct', 'incorrect');
                return;
              }
              attempted += 1;
              const isCorrect = learnerValue === answer;
              if (isCorrect) correct += 1;
              input.classList.toggle('correct', isCorrect);
              input.classList.toggle('incorrect', !isCorrect);
              const detail = document.createElement('div');
              detail.className = 'feedback-item ' + (isCorrect ? 'correct' : 'incorrect');
              const tableAnswerMarkup = isCorrect
                ? ''
                : '<p><strong>Correct answer:</strong> ' + input.dataset.answer + '</p>';
              detail.innerHTML =
                '<h4>' +
                input.closest('tr').querySelector('th').innerText +
                ' – ' +
                (input.dataset.header || '') +
                '</h4>' +
                '<p><strong>Your answer:</strong> ' +
                (input.value || 'No response') +
                '</p>' +
                tableAnswerMarkup;
              details.appendChild(detail);
            });

            if (attempted === 0) {
              scoreLine.textContent = 'Please complete at least one cell before checking.';
            } else {
              scoreLine.textContent =
                'You answered ' + correct + ' of ' + attempted + ' correctly.';
            }
            feedback.hidden = false;
            feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });

          resetBtn.addEventListener('click', () => {
            inputs.forEach((input) => {
              input.value = '';
              input.classList.remove('correct', 'incorrect');
            });
            details.innerHTML = '';
            feedback.hidden = true;
          });

          closeBtn.addEventListener('click', () => (feedback.hidden = true));
        })();
      </script>
    `);
  }
};

const wrapInTemplate = (config, innerMarkup) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(config.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Questrial&display=swap"
    rel="stylesheet"
  />
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
    integrity="sha512-MX58QX8wG7n+9yYvCMpOZXS6jttuPAHyBs+K6TfGsDzpDHK5vVsQt1zArhcXd1LSeX776BF3nf6/3cxguP3R0A=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  />
  <style>
    :root {
      --bg: #f9faf7;
      --surface: #ffffff;
      --border: #d8e0d0;
      --text: #1f261c;
      --muted: #6b7a63;
      --accent: #3d6f5d;
      --accent-soft: rgba(61, 111, 93, 0.1);
      --error: #c75c5c;
      --success: #3d8458;
      font-family: 'Nunito', 'Segoe UI', sans-serif;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-size: 16px;
      line-height: 1.6;
    }

    .activity-shell {
      max-width: 900px;
      margin: 0 auto;
      padding: 3rem 1.5rem 4rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    header.activity-header {
      background: var(--surface);
      border-radius: 20px;
      padding: 2rem;
      border: 1px solid var(--border);
      box-shadow: 0 18px 32px rgba(31, 38, 28, 0.08);
    }

    header.activity-header h1 {
      margin: 0 0 0.5rem;
      font-family: 'Questrial', sans-serif;
      letter-spacing: 0.02em;
      font-size: 2.1rem;
    }

    header.activity-header p.instructions {
      margin: 0;
      color: var(--muted);
    }

    header.activity-header .rubric {
      margin-top: 1.25rem;
      padding: 1rem 1.25rem;
      background: var(--accent-soft);
      border-radius: 14px;
      border: 1px dashed var(--accent);
    }

    .activity-body {
      background: var(--surface);
      border-radius: 20px;
      border: 1px solid var(--border);
      padding: 2rem;
      box-shadow: 0 12px 28px rgba(31, 38, 28, 0.06);
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .activity-btn {
      border-radius: 999px;
      border: none;
      padding: 0.75rem 1.75rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      background: linear-gradient(135deg, var(--accent), #559e86);
      color: #fff;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .activity-btn:hover,
    .activity-btn:focus-visible {
      transform: translateY(-1px);
      box-shadow: 0 10px 28px rgba(61, 111, 93, 0.25);
    }

    .activity-btn.secondary {
      background: transparent;
      color: var(--accent);
      border: 1px solid var(--accent);
      box-shadow: none;
    }

    .activity-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .feedback-item {
      border-radius: 12px;
      border: 1px solid var(--border);
      padding: 1rem 1.25rem;
      background: rgba(255, 255, 255, 0.9);
      margin-bottom: 0.75rem;
    }

    .feedback-item.correct {
      border-left: 5px solid var(--success);
    }

    .feedback-item.incorrect {
      border-left: 5px solid var(--error);
    }

    .feedback-item h4 {
      margin-top: 0;
      margin-bottom: 0.35rem;
      font-size: 1rem;
    }

    .feedback-item p {
      margin: 0.15rem 0;
    }

    .feedback-item .explanation {
      margin-top: 0.5rem;
      color: var(--muted);
    }

    .mc-question,
    .gapfill-text,
    .grouping-activity,
    .table-wrapper {
      background: rgba(246, 248, 243, 0.65);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
    }

    .mc-options {
      display: grid;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .mc-option {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.65rem;
      align-items: center;
      background: #fff;
      padding: 0.75rem 1rem;
      border-radius: 14px;
      border: 1px solid var(--border);
    }

    .mc-feedback,
    .gap-feedback,
    .group-feedback,
    .table-feedback {
      background: var(--surface);
      border-radius: 18px;
      border: 1px solid var(--border);
      padding: 1.5rem;
      box-shadow: 0 18px 32px rgba(31, 38, 28, 0.08);
    }

    .gapfill-text {
      line-height: 1.9;
      font-size: 1.05rem;
    }

    .gapfill-text input {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.35rem 0.5rem;
      min-width: 120px;
    }

    .gapfill-text input.correct {
      border-color: var(--success);
      background: rgba(61, 132, 88, 0.12);
    }

    .gapfill-text input.incorrect {
      border-color: var(--error);
      background: rgba(199, 92, 92, 0.12);
    }

    .grouping-activity {
      display: grid;
      gap: 1.5rem;
    }

    .group-source {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .group-item {
      background: #fff;
      border-radius: 999px;
      padding: 0.55rem 1.15rem;
      border: 1px solid var(--border);
      cursor: grab;
      transition: transform 0.2s ease;
    }

    .group-item.dragging {
      opacity: 0.7;
      transform: scale(0.96);
    }

    .group-item.correct {
      border-color: var(--success);
    }

    .group-item.incorrect {
      border-color: var(--error);
    }

    .group-targets {
      display: grid;
      gap: 1rem;
    }

    .group-target header h3 {
      margin: 0;
    }

    .group-target header p {
      margin: 0.25rem 0 0;
      color: var(--muted);
    }

    .drop-zone {
      min-height: 90px;
      margin-top: 0.75rem;
      border: 2px dashed var(--border);
      border-radius: 14px;
      padding: 0.75rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      background: rgba(255, 255, 255, 0.6);
    }

    .table-wrapper {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
    }

    th,
    td {
      border: 1px solid var(--border);
      padding: 0.75rem;
      text-align: left;
    }

    th {
      background: rgba(61, 111, 93, 0.08);
    }

    td input {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.5rem 0.65rem;
    }

    td input.correct {
      border-color: var(--success);
      background: rgba(61, 132, 88, 0.12);
    }

    td input.incorrect {
      border-color: var(--error);
      background: rgba(199, 92, 92, 0.12);
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (min-width: 900px) {
      .group-targets {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  </style>
</head>
<body>
  <div class="activity-shell">
    <header class="activity-header">
      <h1>${escapeHtml(config.title)}</h1>
      <p class="instructions">${escapeHtml(config.instructions)}</p>
      <div class="rubric">
        <strong>Success criteria:</strong>
        <p>${escapeHtml(config.rubric)}</p>
      </div>
    </header>
    <section class="activity-body">
      ${innerMarkup}
    </section>
  </div>
</body>
</html>
`;

const parseGapfill = (passage = '') => {
  const pattern = /\[\[(.+?)\]\]/g;
  const segments = [];
  const gaps = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(passage)) !== null) {
    const segment = passage.slice(lastIndex, match.index);
    segments.push(segment);
    const answers = match[1]
      .split('|')
      .map((answer) => answer.trim())
      .filter(Boolean);
    gaps.push(answers);
    lastIndex = pattern.lastIndex;
  }

  segments.push(passage.slice(lastIndex));
  gaps.push(null);

  return { segments, gaps };
};

export { DEFAULT_STATES, TYPE_META, Generators };

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const builder = new ActivityBuilder();
    builder.init();

    if (builder.isEmbedded) {
      const postStatus = (status) => {
        try {
          window.parent.postMessage(
            { source: 'noor-activity-builder', type: 'activity-module', status },
            '*',
          );
        } catch (error) {
          console.warn(`Unable to notify deck of builder ${status} status`, error);
        }
      };

      postStatus('ready');

      window.addEventListener('message', (event) => {
        if (event.source !== window.parent) {
          return;
        }
        const message = event.data;
        if (!message || message.source !== 'noor-deck' || message.type !== 'activity-module-load') {
          return;
        }
        const loaded = builder.loadConfig(message.config);
        if (loaded) {
          postStatus('loaded');
        }
      });
    }
  });
}
