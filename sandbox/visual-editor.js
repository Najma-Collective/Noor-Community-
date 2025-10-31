/**
 * Visual Slide Editor for Sandbox Deck Builder
 * Provides Google Slides-like editing experience with direct manipulation
 */

import {
  createLessonSlideFromState,
  SUPPORTED_LESSON_LAYOUTS,
} from './int-mod.js';
import {
  BUILDER_LAYOUT_DEFAULTS,
  LAYOUT_ICON_DEFAULTS,
  getLayoutFieldIconDefault,
  SLIDE_TEMPLATE_MODIFIERS,
} from './slide-templates.js';

export class VisualSlideEditor {
  constructor(deck) {
    this.deck = deck;
    this.currentSlide = null;
    this.currentSlideData = null;
    this.currentSlideLayout = null;
    this.editMode = false;

    // Modals
    this.iconPickerModal = null;
    this.imagePickerModal = null;
    this.colorPickerModal = null;

    // Bind methods
    this.handleSlideClick = this.handleSlideClick.bind(this);
    this.handleIconClick = this.handleIconClick.bind(this);
    this.handleImageClick = this.handleImageClick.bind(this);
    this.initIconPicker();
    this.initImagePicker();
    this.initColorPicker();
  }

  /**
   * Enable visual editing mode for a slide
   */
  enableEditMode(slide, slideData, layout) {
    this.currentSlide = slide;
    this.currentSlideData = slideData;
    this.currentSlideLayout = layout;
    this.editMode = true;

    // Add editing affordances based on slide type
    this.addEditingAffordances(slide, slideData, layout);

    // Add toolbar
    this.showEditingToolbar(slide, layout);
  }

  /**
   * Disable visual editing mode
   */
  disableEditMode() {
    if (!this.currentSlide) return;

    // Remove editing affordances
    this.removeEditingAffordances(this.currentSlide);
    this.hideEditingToolbar();

    this.editMode = false;
    this.currentSlide = null;
    this.currentSlideData = null;
    this.currentSlideLayout = null;
  }

  /**
   * Add editing affordances based on slide type
   */
  addEditingAffordances(slide, slideData, layout) {
    // Get allowed affordances for this layout
    const affordances = this.getLayoutAffordances(layout);

    // Make text fields editable
    if (affordances.text) {
      this.makeTextEditable(slide, slideData, layout);
    }

    // Make icons clickable to change
    if (affordances.icons) {
      this.makeIconsEditable(slide, slideData, layout);
    }

    // Make images clickable to change
    if (affordances.images) {
      this.makeImagesEditable(slide, slideData, layout);
    }

    // Add list item controls
    if (affordances.lists) {
      this.addListControls(slide, slideData, layout);
    }

    // Add background controls
    if (affordances.background) {
      this.addBackgroundControls(slide, slideData, layout);
    }
  }

  /**
   * Get allowed affordances for a layout type
   */
  getLayoutAffordances(layout) {
    const affordances = {
      'blank-canvas': {
        text: true,
        icons: true,
        images: true,
        lists: false,
        background: false,
        addElements: true,
      },
      'learning-objectives': {
        text: true,
        icons: true,
        images: false,
        lists: true, // goals array
        background: false,
        addElements: false,
      },
      'model-dialogue': {
        text: true,
        icons: true,
        images: false,
        lists: true, // turns array
        background: false,
        addElements: false,
      },
      'interactive-practice': {
        text: true,
        icons: true,
        images: false,
        lists: false,
        background: false,
        addElements: false,
        moduleEditor: true,
      },
      'communicative-task': {
        text: true,
        icons: true,
        images: false,
        lists: true, // scaffolding array
        background: false,
        addElements: false,
      },
      'pronunciation-focus': {
        text: true,
        icons: true,
        images: false,
        lists: true, // words, sentences arrays
        background: false,
        addElements: false,
      },
      'reflection': {
        text: true,
        icons: true,
        images: false,
        lists: true, // prompts array
        background: false,
        addElements: false,
      },
      'grounding-activity': {
        text: true,
        icons: true,
        images: true, // ONLY layout with background besides title
        lists: true, // steps array
        background: true,
        addElements: false,
      },
      'topic-introduction': {
        text: true,
        icons: true,
        images: false,
        lists: true, // keyVocabulary array
        background: false,
        addElements: false,
      },
      'guided-discovery': {
        text: true,
        icons: true,
        images: false,
        lists: true, // multiple arrays
        background: false,
        addElements: false,
      },
      'creative-practice': {
        text: true,
        icons: true,
        images: false,
        lists: true, // multiple arrays
        background: false,
        addElements: false,
      },
      'task-divider': {
        text: true,
        icons: true,
        images: false,
        lists: true, // actions array
        background: false,
        addElements: false,
      },
      'task-reporting': {
        text: true,
        icons: true,
        images: false,
        lists: true, // multiple arrays
        background: false,
        addElements: false,
      },
      'genre-deconstruction': {
        text: true,
        icons: true,
        images: false,
        lists: true, // features array
        background: false,
        addElements: false,
      },
      'linguistic-feature-hunt': {
        text: true,
        icons: true,
        images: false,
        lists: true, // features, reflection arrays
        background: false,
        addElements: false,
      },
      'text-reconstruction': {
        text: true,
        icons: true,
        images: false,
        lists: true, // steps, segments arrays
        background: false,
        addElements: false,
      },
      'jumbled-text-sequencing': {
        text: true,
        icons: true,
        images: false,
        lists: true, // segments, supportTips arrays
        background: false,
        addElements: false,
      },
      'scaffolded-joint-construction': {
        text: true,
        icons: true,
        images: false,
        lists: true, // teacherMoves, learnerMoves arrays
        background: false,
        addElements: false,
      },
      'independent-construction-checklist': {
        text: true,
        icons: true,
        images: false,
        lists: true, // checklist, stretchGoals arrays
        background: false,
        addElements: false,
      },
      'card-stack': {
        text: true,
        icons: true,
        images: false,
        lists: true, // cards array
        background: false,
        addElements: false,
      },
      'pill-with-gallery': {
        text: true,
        icons: true,
        images: true, // gallery images
        lists: true, // gallery array
        background: false,
        addElements: false,
      },
    };

    return affordances[layout] || {
      text: true,
      icons: false,
      images: false,
      lists: false,
      background: false,
      addElements: false,
    };
  }

  /**
   * Make text fields editable with contenteditable
   */
  makeTextEditable(slide, slideData, layout) {
    // Find all text elements that should be editable
    const editableSelectors = [
      '[data-editable="title"]',
      '[data-editable="text"]',
      '[data-editable="instructions"]',
      '[data-editable="prompt"]',
      '[data-editable="description"]',
      '.slide-title',
      '.slide-subtitle',
      'p[data-field]',
      'h1[data-field]',
      'h2[data-field]',
      'h3[data-field]',
      'li[data-editable]',
    ];

    editableSelectors.forEach((selector) => {
      const elements = slide.querySelectorAll(selector);
      elements.forEach((el) => {
        if (!el.hasAttribute('contenteditable')) {
          el.setAttribute('contenteditable', 'true');
          el.classList.add('visual-editor-editable');

          // Add blur event to save changes
          el.addEventListener('blur', (e) => {
            this.handleTextChange(e.target, slideData, layout);
          });

          // Add hover effect
          el.addEventListener('mouseenter', () => {
            el.classList.add('visual-editor-hover');
          });

          el.addEventListener('mouseleave', () => {
            el.classList.remove('visual-editor-hover');
          });
        }
      });
    });
  }

  /**
   * Make icons clickable to change
   */
  makeIconsEditable(slide, slideData, layout) {
    const icons = slide.querySelectorAll('i[class*="fa-"]');

    icons.forEach((icon) => {
      // Skip if already editable
      if (icon.classList.contains('visual-editor-icon-editable')) return;

      icon.classList.add('visual-editor-icon-editable');
      icon.style.cursor = 'pointer';

      // Add click handler
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openIconPicker(icon, slideData, layout);
      });

      // Add hover effect
      icon.addEventListener('mouseenter', () => {
        icon.classList.add('visual-editor-hover');
      });

      icon.addEventListener('mouseleave', () => {
        icon.classList.remove('visual-editor-hover');
      });
    });
  }

  /**
   * Make images clickable to change
   */
  makeImagesEditable(slide, slideData, layout) {
    const images = slide.querySelectorAll('img, [style*="background-image"]');

    images.forEach((img) => {
      // Skip if already editable
      if (img.classList.contains('visual-editor-image-editable')) return;

      img.classList.add('visual-editor-image-editable');
      img.style.cursor = 'pointer';

      // Add click handler
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openImagePicker(img, slideData, layout);
      });

      // Add hover effect
      img.addEventListener('mouseenter', () => {
        img.classList.add('visual-editor-hover');
      });

      img.addEventListener('mouseleave', () => {
        img.classList.remove('visual-editor-hover');
      });
    });
  }

  /**
   * Add controls for list items (add, remove)
   */
  addListControls(slide, slideData, layout) {
    // Find all list containers
    const lists = slide.querySelectorAll('ul[data-field], ol[data-field]');

    lists.forEach((list) => {
      const fieldName = list.dataset.field;

      // Add controls to each list item
      list.querySelectorAll('li').forEach((li, index) => {
        if (li.querySelector('.visual-editor-list-controls')) return; // Already has controls

        const controls = document.createElement('div');
        controls.className = 'visual-editor-list-controls';
        controls.innerHTML = `
          <button type="button" class="visual-editor-btn visual-editor-btn-sm" data-action="remove-item" title="Remove item">
            <i class="fa-solid fa-trash" aria-hidden="true"></i>
          </button>
        `;

        controls.querySelector('[data-action="remove-item"]').addEventListener('click', () => {
          this.removeListItem(list, index, fieldName, slideData, layout);
        });

        li.appendChild(controls);
      });

      // Add "Add Item" button at the end
      if (!list.querySelector('.visual-editor-add-item')) {
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'visual-editor-btn visual-editor-add-item';
        addBtn.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i> Add item';
        addBtn.addEventListener('click', () => {
          this.addListItem(list, fieldName, slideData, layout);
        });
        list.after(addBtn);
      }
    });
  }

  /**
   * Add background image and color controls
   */
  addBackgroundControls(slide, slideData, layout) {
    // Only for grounding-activity
    if (layout !== 'grounding-activity') return;

    // Add background control panel
    const panel = document.createElement('div');
    panel.className = 'visual-editor-background-panel';
    panel.innerHTML = `
      <button type="button" class="visual-editor-btn" data-action="change-background">
        <i class="fa-solid fa-image" aria-hidden="true"></i> Change background
      </button>
      <button type="button" class="visual-editor-btn" data-action="change-overlay">
        <i class="fa-solid fa-palette" aria-hidden="true"></i> Overlay color
      </button>
    `;

    panel.querySelector('[data-action="change-background"]').addEventListener('click', () => {
      this.openImagePicker(slide, slideData, layout, 'background');
    });

    panel.querySelector('[data-action="change-overlay"]').addEventListener('click', () => {
      this.openColorPicker(slide, slideData, layout);
    });

    slide.appendChild(panel);
  }

  /**
   * Handle text content changes
   */
  handleTextChange(element, slideData, layout) {
    const fieldName = element.dataset.field || element.dataset.editable;
    const newValue = element.textContent.trim();

    if (fieldName && slideData[fieldName] !== undefined) {
      slideData[fieldName] = newValue;
      this.saveSlideChanges(slideData, layout);
    }
  }

  /**
   * Add a new list item
   */
  addListItem(list, fieldName, slideData, layout) {
    const li = document.createElement('li');
    li.setAttribute('contenteditable', 'true');
    li.setAttribute('data-editable', 'true');
    li.textContent = 'New item';
    li.classList.add('visual-editor-editable');

    // Add controls
    const controls = document.createElement('div');
    controls.className = 'visual-editor-list-controls';
    controls.innerHTML = `
      <button type="button" class="visual-editor-btn visual-editor-btn-sm" data-action="remove-item" title="Remove item">
        <i class="fa-solid fa-trash" aria-hidden="true"></i>
      </button>
    `;

    const index = list.querySelectorAll('li').length;
    controls.querySelector('[data-action="remove-item"]').addEventListener('click', () => {
      this.removeListItem(list, index, fieldName, slideData, layout);
    });

    li.appendChild(controls);
    list.appendChild(li);

    // Update slide data
    if (Array.isArray(slideData[fieldName])) {
      slideData[fieldName].push('New item');
      this.saveSlideChanges(slideData, layout);
    }

    // Focus the new item
    li.focus();
  }

  /**
   * Remove a list item
   */
  removeListItem(list, index, fieldName, slideData, layout) {
    const items = list.querySelectorAll('li');
    if (items[index]) {
      items[index].remove();

      // Update slide data
      if (Array.isArray(slideData[fieldName])) {
        slideData[fieldName].splice(index, 1);
        this.saveSlideChanges(slideData, layout);
      }
    }
  }

  /**
   * Save slide changes back to deck
   */
  saveSlideChanges(slideData, layout) {
    // Update the slide in the deck
    const slideIndex = this.deck.slides.findIndex(
      (s) => s.layout === layout && s.data === slideData
    );

    if (slideIndex !== -1) {
      this.deck.slides[slideIndex] = { layout, data: slideData };

      // Trigger deck update event
      if (this.deck.onSlideUpdate) {
        this.deck.onSlideUpdate(slideIndex);
      }
    }
  }

  /**
   * Show editing toolbar
   */
  showEditingToolbar(slide, layout) {
    // Remove existing toolbar
    this.hideEditingToolbar();

    const toolbar = document.createElement('div');
    toolbar.className = 'visual-editor-toolbar';
    toolbar.id = 'visual-editor-toolbar';

    const affordances = this.getLayoutAffordances(layout);

    const buttons = [];

    if (affordances.addElements) {
      buttons.push(`
        <button type="button" class="visual-editor-toolbar-btn" data-action="add-textbox">
          <i class="fa-solid fa-t" aria-hidden="true"></i> Add textbox
        </button>
        <button type="button" class="visual-editor-toolbar-btn" data-action="add-icon">
          <i class="fa-solid fa-icons" aria-hidden="true"></i> Add icon
        </button>
        <button type="button" class="visual-editor-toolbar-btn" data-action="add-image">
          <i class="fa-solid fa-image" aria-hidden="true"></i> Add image
        </button>
      `);
    }

    buttons.push(`
      <button type="button" class="visual-editor-toolbar-btn" data-action="done-editing">
        <i class="fa-solid fa-check" aria-hidden="true"></i> Done
      </button>
    `);

    toolbar.innerHTML = buttons.join('');

    // Add event listeners
    toolbar.querySelector('[data-action="done-editing"]')?.addEventListener('click', () => {
      this.disableEditMode();
    });

    toolbar.querySelector('[data-action="add-textbox"]')?.addEventListener('click', () => {
      this.addTextbox(slide);
    });

    toolbar.querySelector('[data-action="add-icon"]')?.addEventListener('click', () => {
      this.addIcon(slide);
    });

    toolbar.querySelector('[data-action="add-image"]')?.addEventListener('click', () => {
      this.addImage(slide);
    });

    document.body.appendChild(toolbar);
  }

  /**
   * Hide editing toolbar
   */
  hideEditingToolbar() {
    const toolbar = document.getElementById('visual-editor-toolbar');
    if (toolbar) {
      toolbar.remove();
    }
  }

  /**
   * Add a textbox to blank canvas
   */
  addTextbox(slide) {
    const textbox = document.createElement('div');
    textbox.className = 'visual-editor-textbox';
    textbox.setAttribute('contenteditable', 'true');
    textbox.textContent = 'Click to edit text';

    // Make draggable
    this.makeDraggable(textbox);

    slide.querySelector('.slide-inner').appendChild(textbox);
  }

  /**
   * Add an icon to blank canvas
   */
  addIcon(slide) {
    const iconContainer = document.createElement('div');
    iconContainer.className = 'visual-editor-icon-container';

    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-star visual-editor-icon-editable';
    icon.style.cursor = 'pointer';
    icon.style.fontSize = '48px';

    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openIconPicker(icon, this.currentSlideData, this.currentSlideLayout);
    });

    iconContainer.appendChild(icon);
    this.makeDraggable(iconContainer);

    slide.querySelector('.slide-inner').appendChild(iconContainer);
  }

  /**
   * Add an image to blank canvas
   */
  addImage(slide) {
    const imgContainer = document.createElement('div');
    imgContainer.className = 'visual-editor-image-container';

    const img = document.createElement('img');
    img.src = 'https://via.placeholder.com/400x300?text=Click+to+change+image';
    img.alt = 'Click to change image';
    img.classList.add('visual-editor-image-editable');
    img.style.cursor = 'pointer';

    img.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openImagePicker(img, this.currentSlideData, this.currentSlideLayout);
    });

    imgContainer.appendChild(img);
    this.makeDraggable(imgContainer);

    slide.querySelector('.slide-inner').appendChild(imgContainer);
  }

  /**
   * Make element draggable
   */
  makeDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    element.style.position = 'absolute';
    element.style.cursor = 'move';

    element.addEventListener('mousedown', (e) => {
      if (e.target.hasAttribute('contenteditable')) return;

      isDragging = true;
      initialX = e.clientX - element.offsetLeft;
      initialY = e.clientY - element.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        element.style.left = currentX + 'px';
        element.style.top = currentY + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  /**
   * Initialize icon picker modal
   */
  initIconPicker() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'visual-editor-modal';
    modal.id = 'icon-picker-modal';
    modal.innerHTML = `
      <div class="visual-editor-modal-content">
        <div class="visual-editor-modal-header">
          <h3>Choose an icon</h3>
          <button type="button" class="visual-editor-modal-close" data-action="close-modal">
            <i class="fa-solid fa-times" aria-hidden="true"></i>
          </button>
        </div>
        <div class="visual-editor-modal-body">
          <input type="text" class="visual-editor-search" placeholder="Search Font Awesome icons..." id="icon-search" />
          <div class="visual-editor-icon-grid" id="icon-grid"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.iconPickerModal = modal;

    // Close button
    modal.querySelector('[data-action="close-modal"]').addEventListener('click', () => {
      this.closeIconPicker();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeIconPicker();
      }
    });

    // Search functionality
    const searchInput = modal.querySelector('#icon-search');
    searchInput.addEventListener('input', (e) => {
      this.filterIcons(e.target.value);
    });

    // Populate with Font Awesome icons
    this.populateIconPicker();
  }

  /**
   * Populate icon picker with Font Awesome icons
   */
  populateIconPicker() {
    // Common Font Awesome solid icons
    const icons = [
      'fa-star', 'fa-heart', 'fa-check', 'fa-times', 'fa-circle', 'fa-square',
      'fa-home', 'fa-user', 'fa-users', 'fa-envelope', 'fa-phone', 'fa-calendar',
      'fa-clock', 'fa-map-marker-alt', 'fa-search', 'fa-cog', 'fa-trash', 'fa-edit',
      'fa-save', 'fa-download', 'fa-upload', 'fa-share', 'fa-link', 'fa-paperclip',
      'fa-image', 'fa-camera', 'fa-video', 'fa-music', 'fa-headphones', 'fa-microphone',
      'fa-book', 'fa-bookmark', 'fa-file', 'fa-folder', 'fa-archive', 'fa-tag',
      'fa-tags', 'fa-lightbulb', 'fa-sun', 'fa-moon', 'fa-cloud', 'fa-umbrella',
      'fa-coffee', 'fa-pizza-slice', 'fa-utensils', 'fa-car', 'fa-plane', 'fa-bicycle',
      'fa-shopping-cart', 'fa-gift', 'fa-trophy', 'fa-medal', 'fa-crown', 'fa-gem',
      'fa-fire', 'fa-bolt', 'fa-snowflake', 'fa-leaf', 'fa-tree', 'fa-seedling',
      'fa-bullseye', 'fa-crosshairs', 'fa-bullhorn', 'fa-comments', 'fa-comment',
      'fa-quote-left', 'fa-quote-right', 'fa-language', 'fa-globe', 'fa-flag',
      'fa-puzzle-piece', 'fa-gamepad', 'fa-dice', 'fa-chess', 'fa-spa', 'fa-yin-yang',
      'fa-infinity', 'fa-battery-full', 'fa-wifi', 'fa-signal', 'fa-database',
      'fa-server', 'fa-laptop', 'fa-mobile', 'fa-tablet', 'fa-keyboard', 'fa-mouse',
      'fa-print', 'fa-barcode', 'fa-qrcode', 'fa-fingerprint', 'fa-lock', 'fa-unlock',
      'fa-key', 'fa-shield-alt', 'fa-eye', 'fa-eye-slash', 'fa-question-circle',
      'fa-info-circle', 'fa-exclamation-circle', 'fa-exclamation-triangle',
      'fa-check-circle', 'fa-times-circle', 'fa-plus-circle', 'fa-minus-circle',
      'fa-arrow-up', 'fa-arrow-down', 'fa-arrow-left', 'fa-arrow-right',
      'fa-chevron-up', 'fa-chevron-down', 'fa-chevron-left', 'fa-chevron-right',
      'fa-angle-up', 'fa-angle-down', 'fa-angle-left', 'fa-angle-right',
      'fa-list', 'fa-list-ul', 'fa-list-ol', 'fa-align-left', 'fa-align-center',
      'fa-align-right', 'fa-align-justify', 'fa-indent', 'fa-outdent',
      'fa-bold', 'fa-italic', 'fa-underline', 'fa-strikethrough', 'fa-font',
      'fa-text-height', 'fa-text-width', 'fa-heading', 'fa-paragraph',
      'fa-graduation-cap', 'fa-school', 'fa-chalkboard', 'fa-chalkboard-teacher',
      'fa-pencil-alt', 'fa-pen', 'fa-highlighter', 'fa-marker', 'fa-eraser',
      'fa-palette', 'fa-paint-brush', 'fa-spray-can', 'fa-fill-drip',
      'fa-calculator', 'fa-ruler', 'fa-compass', 'fa-drafting-compass',
      'fa-microscope', 'fa-flask', 'fa-atom', 'fa-dna', 'fa-brain',
      'fa-theater-masks', 'fa-music', 'fa-guitar', 'fa-drum', 'fa-microphone-alt',
    ];

    const grid = this.iconPickerModal.querySelector('#icon-grid');
    grid.innerHTML = '';

    icons.forEach((iconClass) => {
      const iconBtn = document.createElement('button');
      iconBtn.type = 'button';
      iconBtn.className = 'visual-editor-icon-option';
      iconBtn.dataset.iconClass = `fa-solid ${iconClass}`;
      iconBtn.innerHTML = `<i class="fa-solid ${iconClass}" aria-hidden="true"></i>`;
      iconBtn.title = iconClass.replace('fa-', '').replace(/-/g, ' ');

      iconBtn.addEventListener('click', () => {
        this.selectIcon(`fa-solid ${iconClass}`);
      });

      grid.appendChild(iconBtn);
    });
  }

  /**
   * Filter icons by search term
   */
  filterIcons(searchTerm) {
    const grid = this.iconPickerModal.querySelector('#icon-grid');
    const options = grid.querySelectorAll('.visual-editor-icon-option');

    const term = searchTerm.toLowerCase();

    options.forEach((option) => {
      const iconClass = option.dataset.iconClass.toLowerCase();
      const iconName = option.title.toLowerCase();

      if (iconName.includes(term) || iconClass.includes(term)) {
        option.style.display = '';
      } else {
        option.style.display = 'none';
      }
    });
  }

  /**
   * Open icon picker
   */
  openIconPicker(iconElement, slideData, layout) {
    this.currentIconElement = iconElement;
    this.currentIconSlideData = slideData;
    this.currentIconLayout = layout;

    this.iconPickerModal.style.display = 'flex';

    // Focus search input
    setTimeout(() => {
      this.iconPickerModal.querySelector('#icon-search').focus();
    }, 100);
  }

  /**
   * Close icon picker
   */
  closeIconPicker() {
    this.iconPickerModal.style.display = 'none';
    this.iconPickerModal.querySelector('#icon-search').value = '';
    this.filterIcons('');
  }

  /**
   * Select an icon
   */
  selectIcon(iconClass) {
    if (this.currentIconElement) {
      // Update the icon element classes
      this.currentIconElement.className = iconClass;

      // Update slide data if field is identified
      const fieldName = this.currentIconElement.dataset.field;
      if (fieldName && this.currentIconSlideData) {
        this.currentIconSlideData[fieldName] = iconClass;
        this.saveSlideChanges(this.currentIconSlideData, this.currentIconLayout);
      }
    }

    this.closeIconPicker();
  }

  /**
   * Initialize image picker modal
   */
  initImagePicker() {
    const modal = document.createElement('div');
    modal.className = 'visual-editor-modal';
    modal.id = 'image-picker-modal';
    modal.innerHTML = `
      <div class="visual-editor-modal-content">
        <div class="visual-editor-modal-header">
          <h3>Choose an image</h3>
          <button type="button" class="visual-editor-modal-close" data-action="close-modal">
            <i class="fa-solid fa-times" aria-hidden="true"></i>
          </button>
        </div>
        <div class="visual-editor-modal-body">
          <div class="visual-editor-tabs">
            <button type="button" class="visual-editor-tab active" data-tab="pexels">
              <i class="fa-solid fa-search" aria-hidden="true"></i> Search Pexels
            </button>
            <button type="button" class="visual-editor-tab" data-tab="upload">
              <i class="fa-solid fa-upload" aria-hidden="true"></i> Upload
            </button>
            <button type="button" class="visual-editor-tab" data-tab="url">
              <i class="fa-solid fa-link" aria-hidden="true"></i> URL
            </button>
          </div>

          <div class="visual-editor-tab-content" id="pexels-tab">
            <input type="text" class="visual-editor-search" placeholder="Search Pexels for images..." id="pexels-search" />
            <button type="button" class="visual-editor-btn" id="pexels-search-btn">Search</button>
            <div class="visual-editor-image-grid" id="pexels-results"></div>
          </div>

          <div class="visual-editor-tab-content" id="upload-tab" style="display: none;">
            <div class="visual-editor-upload-area">
              <input type="file" id="image-upload-input" accept="image/*" style="display: none;" />
              <button type="button" class="visual-editor-btn-large" id="upload-trigger">
                <i class="fa-solid fa-upload" aria-hidden="true"></i>
                <span>Choose image to upload</span>
              </button>
              <p class="visual-editor-hint">Supports JPG, PNG, GIF, WebP</p>
            </div>
          </div>

          <div class="visual-editor-tab-content" id="url-tab" style="display: none;">
            <input type="text" class="visual-editor-input" placeholder="Enter image URL..." id="image-url-input" />
            <button type="button" class="visual-editor-btn" id="image-url-btn">Use this image</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.imagePickerModal = modal;

    // Close button
    modal.querySelector('[data-action="close-modal"]').addEventListener('click', () => {
      this.closeImagePicker();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeImagePicker();
      }
    });

    // Tab switching
    modal.querySelectorAll('.visual-editor-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchImageTab(tabName);
      });
    });

    // Pexels search
    modal.querySelector('#pexels-search-btn').addEventListener('click', () => {
      const query = modal.querySelector('#pexels-search').value;
      this.searchPexels(query);
    });

    modal.querySelector('#pexels-search').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value;
        this.searchPexels(query);
      }
    });

    // Upload trigger
    modal.querySelector('#upload-trigger').addEventListener('click', () => {
      modal.querySelector('#image-upload-input').click();
    });

    modal.querySelector('#image-upload-input').addEventListener('change', (e) => {
      this.handleImageUpload(e.target.files[0]);
    });

    // URL input
    modal.querySelector('#image-url-btn').addEventListener('click', () => {
      const url = modal.querySelector('#image-url-input').value;
      this.selectImage(url);
    });
  }

  /**
   * Switch image picker tab
   */
  switchImageTab(tabName) {
    // Update tab buttons
    this.imagePickerModal.querySelectorAll('.visual-editor-tab').forEach((tab) => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update tab content
    this.imagePickerModal.querySelectorAll('.visual-editor-tab-content').forEach((content) => {
      content.style.display = 'none';
    });

    this.imagePickerModal.querySelector(`#${tabName}-tab`).style.display = 'block';
  }

  /**
   * Search Pexels for images
   */
  async searchPexels(query) {
    const resultsContainer = this.imagePickerModal.querySelector('#pexels-results');
    resultsContainer.innerHTML = '<p class="visual-editor-loading">Searching Pexels...</p>';

    try {
      // Note: This requires a Pexels API key
      // For now, we'll show a placeholder message
      resultsContainer.innerHTML = `
        <p class="visual-editor-hint">
          Pexels integration requires an API key.
          Please configure your Pexels API key in the sandbox settings.
        </p>
        <p class="visual-editor-hint">
          For now, you can use the URL tab to paste image URLs directly.
        </p>
      `;

      // TODO: Implement actual Pexels API integration
      // const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=20`, {
      //   headers: { Authorization: PEXELS_API_KEY }
      // });
      // const data = await response.json();
      // this.displayPexelsResults(data.photos);

    } catch (error) {
      resultsContainer.innerHTML = `<p class="visual-editor-error">Error searching Pexels: ${error.message}</p>`;
    }
  }

  /**
   * Display Pexels search results
   */
  displayPexelsResults(photos) {
    const resultsContainer = this.imagePickerModal.querySelector('#pexels-results');
    resultsContainer.innerHTML = '';

    if (!photos || photos.length === 0) {
      resultsContainer.innerHTML = '<p class="visual-editor-hint">No results found. Try a different search term.</p>';
      return;
    }

    photos.forEach((photo) => {
      const img = document.createElement('img');
      img.src = photo.src.medium;
      img.alt = photo.alt || 'Pexels image';
      img.className = 'visual-editor-image-result';
      img.addEventListener('click', () => {
        this.selectImage(photo.src.large);
      });

      resultsContainer.appendChild(img);
    });
  }

  /**
   * Handle image file upload
   */
  handleImageUpload(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectImage(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Open image picker
   */
  openImagePicker(imageElement, slideData, layout, context = 'image') {
    this.currentImageElement = imageElement;
    this.currentImageSlideData = slideData;
    this.currentImageLayout = layout;
    this.currentImageContext = context;

    this.imagePickerModal.style.display = 'flex';
  }

  /**
   * Close image picker
   */
  closeImagePicker() {
    this.imagePickerModal.style.display = 'none';
    this.imagePickerModal.querySelector('#pexels-search').value = '';
    this.imagePickerModal.querySelector('#image-url-input').value = '';
    this.imagePickerModal.querySelector('#pexels-results').innerHTML = '';
  }

  /**
   * Select an image
   */
  selectImage(imageUrl) {
    if (this.currentImageElement) {
      if (this.currentImageContext === 'background') {
        // Set as background image
        this.currentImageElement.style.backgroundImage = `url(${imageUrl})`;

        // Update slide data
        if (this.currentImageSlideData) {
          this.currentImageSlideData.imageUrl = imageUrl;
          this.saveSlideChanges(this.currentImageSlideData, this.currentImageLayout);
        }
      } else {
        // Set as img src
        if (this.currentImageElement.tagName === 'IMG') {
          this.currentImageElement.src = imageUrl;
        } else {
          this.currentImageElement.style.backgroundImage = `url(${imageUrl})`;
        }
      }
    }

    this.closeImagePicker();
  }

  /**
   * Initialize color picker modal
   */
  initColorPicker() {
    const modal = document.createElement('div');
    modal.className = 'visual-editor-modal';
    modal.id = 'color-picker-modal';
    modal.innerHTML = `
      <div class="visual-editor-modal-content visual-editor-modal-small">
        <div class="visual-editor-modal-header">
          <h3>Overlay color</h3>
          <button type="button" class="visual-editor-modal-close" data-action="close-modal">
            <i class="fa-solid fa-times" aria-hidden="true"></i>
          </button>
        </div>
        <div class="visual-editor-modal-body">
          <label for="overlay-color-input">Color</label>
          <input type="color" id="overlay-color-input" class="visual-editor-color-input" value="#0f172a" />

          <label for="overlay-opacity-input">Opacity</label>
          <input type="range" id="overlay-opacity-input" min="0" max="1" step="0.01" value="0.6" class="visual-editor-slider" />
          <span id="overlay-opacity-value">0.6</span>

          <button type="button" class="visual-editor-btn" id="apply-overlay-btn">Apply</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.colorPickerModal = modal;

    // Close button
    modal.querySelector('[data-action="close-modal"]').addEventListener('click', () => {
      this.closeColorPicker();
    });

    // Opacity slider
    modal.querySelector('#overlay-opacity-input').addEventListener('input', (e) => {
      modal.querySelector('#overlay-opacity-value').textContent = e.target.value;
    });

    // Apply button
    modal.querySelector('#apply-overlay-btn').addEventListener('click', () => {
      const color = modal.querySelector('#overlay-color-input').value;
      const opacity = modal.querySelector('#overlay-opacity-input').value;
      this.applyOverlayColor(color, opacity);
    });
  }

  /**
   * Open color picker
   */
  openColorPicker(slide, slideData, layout) {
    this.currentColorSlide = slide;
    this.currentColorSlideData = slideData;
    this.currentColorLayout = layout;

    // Pre-fill with current values if available
    if (slideData.overlayColor) {
      this.colorPickerModal.querySelector('#overlay-color-input').value = slideData.overlayColor;
    }
    if (slideData.overlayOpacity !== undefined) {
      const opacityInput = this.colorPickerModal.querySelector('#overlay-opacity-input');
      opacityInput.value = slideData.overlayOpacity;
      this.colorPickerModal.querySelector('#overlay-opacity-value').textContent = slideData.overlayOpacity;
    }

    this.colorPickerModal.style.display = 'flex';
  }

  /**
   * Close color picker
   */
  closeColorPicker() {
    this.colorPickerModal.style.display = 'none';
  }

  /**
   * Apply overlay color
   */
  applyOverlayColor(color, opacity) {
    if (this.currentColorSlideData) {
      this.currentColorSlideData.overlayColor = color;
      this.currentColorSlideData.overlayOpacity = parseFloat(opacity);

      // Update the slide
      this.saveSlideChanges(this.currentColorSlideData, this.currentColorLayout);

      // Re-render the slide to apply changes
      // This would need to be implemented in the main deck system
      if (this.deck.refreshSlide) {
        const slideIndex = this.deck.slides.findIndex(
          (s) => s.data === this.currentColorSlideData
        );
        this.deck.refreshSlide(slideIndex);
      }
    }

    this.closeColorPicker();
  }

  /**
   * Remove editing affordances
   */
  removeEditingAffordances(slide) {
    // Remove contenteditable
    slide.querySelectorAll('[contenteditable]').forEach((el) => {
      el.removeAttribute('contenteditable');
      el.classList.remove('visual-editor-editable', 'visual-editor-hover');
    });

    // Remove icon editing classes
    slide.querySelectorAll('.visual-editor-icon-editable').forEach((el) => {
      el.classList.remove('visual-editor-icon-editable', 'visual-editor-hover');
      el.style.cursor = '';
    });

    // Remove image editing classes
    slide.querySelectorAll('.visual-editor-image-editable').forEach((el) => {
      el.classList.remove('visual-editor-image-editable', 'visual-editor-hover');
      el.style.cursor = '';
    });

    // Remove list controls
    slide.querySelectorAll('.visual-editor-list-controls').forEach((el) => el.remove());
    slide.querySelectorAll('.visual-editor-add-item').forEach((el) => el.remove());

    // Remove background panel
    slide.querySelectorAll('.visual-editor-background-panel').forEach((el) => el.remove());
  }
}

/**
 * Auto-enable visual editing when a slide is clicked
 */
export function enableVisualEditingOnClick(deck) {
  const editor = new VisualSlideEditor(deck);

  // Listen for slide clicks
  document.addEventListener('click', (e) => {
    const slide = e.target.closest('.lesson-slide, .slide');
    if (slide && !editor.editMode) {
      // Find slide data
      const slideIndex = Array.from(slide.parentNode.children).indexOf(slide);
      const slideData = deck.slides[slideIndex];

      if (slideData) {
        editor.enableEditMode(slide, slideData.data, slideData.layout);
      }
    }
  });

  return editor;
}
