/**
 * Visual Activity Builder for Sandbox Deck Builder
 * Google Forms-style interface for building interactive activities
 */

export class VisualActivityBuilder {
  constructor(container, onSave) {
    this.container = container;
    this.onSave = onSave;
    this.activityData = {
      type: 'multiple-choice',
      data: {
        title: 'Untitled activity',
        instructions: '',
        rubric: '',
        questions: [],
      },
    };

    this.init();
  }

  /**
   * Initialize the builder
   */
  init() {
    this.render();
  }

  /**
   * Render the builder interface
   */
  render() {
    this.container.innerHTML = `
      <div class="activity-visual-builder">
        <div class="activity-builder-header">
          <input type="text"
                 class="activity-title-input"
                 value="${this.activityData.data.title}"
                 placeholder="Activity title"
                 data-field="title" />

          <select class="activity-type-select" data-field="type">
            <option value="multiple-choice">Multiple Choice</option>
            <option value="dropdown">Dropdown</option>
            <option value="gapfill">Gap Fill</option>
            <option value="grouping">Grouping</option>
            <option value="linking">Linking/Matching</option>
            <option value="ranking">Ranking</option>
            <option value="multiple-choice-grid">Multiple Choice Grid</option>
            <option value="table-completion">Table Completion</option>
            <option value="quiz-show">Quiz Show</option>
          </select>
        </div>

        <div class="activity-builder-meta">
          <textarea class="activity-instructions-input"
                    placeholder="Instructions for learners..."
                    data-field="instructions">${this.activityData.data.instructions}</textarea>

          <textarea class="activity-rubric-input"
                    placeholder="Success criteria or rubric..."
                    data-field="rubric">${this.activityData.data.rubric || ''}</textarea>
        </div>

        <div class="activity-builder-content" id="activity-content">
          <!-- Questions/content will be rendered here -->
        </div>

        <div class="activity-builder-footer">
          <button type="button" class="activity-btn-secondary" data-action="cancel">
            Cancel
          </button>
          <button type="button" class="activity-btn-primary" data-action="save">
            <i class="fa-solid fa-check" aria-hidden="true"></i> Save activity
          </button>
        </div>
      </div>
    `;

    // Set activity type
    this.container.querySelector('.activity-type-select').value = this.activityData.type;

    // Attach event listeners
    this.attachEventListeners();

    // Render content based on activity type
    this.renderActivityContent();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Title input
    this.container.querySelector('.activity-title-input').addEventListener('input', (e) => {
      this.activityData.data.title = e.target.value;
    });

    // Type select
    this.container.querySelector('.activity-type-select').addEventListener('change', (e) => {
      this.activityData.type = e.target.value;
      this.activityData.data.questions = []; // Reset questions
      this.renderActivityContent();
    });

    // Instructions
    this.container.querySelector('.activity-instructions-input').addEventListener('input', (e) => {
      this.activityData.data.instructions = e.target.value;
    });

    // Rubric
    this.container.querySelector('.activity-rubric-input').addEventListener('input', (e) => {
      this.activityData.data.rubric = e.target.value;
    });

    // Save button
    this.container.querySelector('[data-action="save"]').addEventListener('click', () => {
      this.save();
    });

    // Cancel button
    this.container.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      this.cancel();
    });
  }

  /**
   * Render activity content based on type
   */
  renderActivityContent() {
    const contentContainer = this.container.querySelector('#activity-content');

    switch (this.activityData.type) {
      case 'multiple-choice':
        this.renderMultipleChoice(contentContainer);
        break;
      case 'dropdown':
        this.renderDropdown(contentContainer);
        break;
      case 'gapfill':
        this.renderGapFill(contentContainer);
        break;
      case 'grouping':
        this.renderGrouping(contentContainer);
        break;
      case 'linking':
        this.renderLinking(contentContainer);
        break;
      case 'ranking':
        this.renderRanking(contentContainer);
        break;
      case 'multiple-choice-grid':
        this.renderMultipleChoiceGrid(contentContainer);
        break;
      case 'table-completion':
        this.renderTableCompletion(contentContainer);
        break;
      case 'quiz-show':
        this.renderQuizShow(contentContainer);
        break;
      default:
        contentContainer.innerHTML = '<p>Select an activity type to begin.</p>';
    }
  }

  /**
   * Render Multiple Choice questions (Google Forms style)
   */
  renderMultipleChoice(container) {
    if (!this.activityData.data.questions) {
      this.activityData.data.questions = [];
    }

    container.innerHTML = `
      <div class="activity-questions-container">
        <div id="questions-list"></div>
        <button type="button" class="activity-add-question-btn" data-action="add-question">
          <i class="fa-solid fa-plus" aria-hidden="true"></i> Add question
        </button>
      </div>
    `;

    const questionsList = container.querySelector('#questions-list');

    // Render existing questions
    this.activityData.data.questions.forEach((question, index) => {
      questionsList.appendChild(this.createMultipleChoiceCard(question, index));
    });

    // Add question button
    container.querySelector('[data-action="add-question"]').addEventListener('click', () => {
      const newQuestion = {
        prompt: 'Question prompt',
        options: ['Option 1', 'Option 2', 'Option 3'],
        answer: 'Option 1',
        explanation: '',
      };
      this.activityData.data.questions.push(newQuestion);
      questionsList.appendChild(
        this.createMultipleChoiceCard(newQuestion, this.activityData.data.questions.length - 1)
      );
    });
  }

  /**
   * Create a Multiple Choice question card (Google Forms style)
   */
  createMultipleChoiceCard(question, index) {
    const card = document.createElement('div');
    card.className = 'activity-question-card';
    card.dataset.index = index;

    card.innerHTML = `
      <div class="activity-question-header">
        <span class="activity-question-number">${index + 1}</span>
        <button type="button" class="activity-delete-btn" data-action="delete-question">
          <i class="fa-solid fa-trash" aria-hidden="true"></i>
        </button>
      </div>

      <input type="text"
             class="activity-question-prompt"
             value="${question.prompt}"
             placeholder="Question prompt"
             data-field="prompt" />

      <div class="activity-options-container">
        ${question.options
          .map(
            (option, optionIndex) => `
          <div class="activity-option-row">
            <input type="radio"
                   name="correct-${index}"
                   value="${optionIndex}"
                   ${question.answer === option ? 'checked' : ''}
                   data-action="set-correct" />
            <input type="text"
                   class="activity-option-input"
                   value="${option}"
                   placeholder="Option ${optionIndex + 1}"
                   data-option-index="${optionIndex}" />
            <button type="button"
                    class="activity-option-delete-btn"
                    data-action="delete-option"
                    data-option-index="${optionIndex}">
              <i class="fa-solid fa-times" aria-hidden="true"></i>
            </button>
          </div>
        `
          )
          .join('')}
      </div>

      <button type="button" class="activity-add-option-btn" data-action="add-option">
        <i class="fa-solid fa-plus" aria-hidden="true"></i> Add option
      </button>

      <textarea class="activity-explanation-input"
                placeholder="Explanation (optional)"
                data-field="explanation">${question.explanation || ''}</textarea>
    `;

    // Attach event listeners
    this.attachQuestionCardListeners(card, question, index);

    return card;
  }

  /**
   * Attach event listeners to question card
   */
  attachQuestionCardListeners(card, question, index) {
    // Delete question
    card.querySelector('[data-action="delete-question"]').addEventListener('click', () => {
      this.activityData.data.questions.splice(index, 1);
      this.renderActivityContent();
    });

    // Update prompt
    card.querySelector('[data-field="prompt"]').addEventListener('input', (e) => {
      question.prompt = e.target.value;
    });

    // Update explanation
    card.querySelector('[data-field="explanation"]')?.addEventListener('input', (e) => {
      question.explanation = e.target.value;
    });

    // Update options
    card.querySelectorAll('.activity-option-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const optionIndex = parseInt(e.target.dataset.optionIndex);
        question.options[optionIndex] = e.target.value;
      });
    });

    // Set correct answer
    card.querySelectorAll('[data-action="set-correct"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const optionIndex = parseInt(e.target.value);
        question.answer = question.options[optionIndex];
      });
    });

    // Delete option
    card.querySelectorAll('[data-action="delete-option"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const optionIndex = parseInt(e.target.dataset.optionIndex);
        question.options.splice(optionIndex, 1);
        this.renderActivityContent();
      });
    });

    // Add option
    card.querySelector('[data-action="add-option"]').addEventListener('click', () => {
      question.options.push(`Option ${question.options.length + 1}`);
      this.renderActivityContent();
    });
  }

  /**
   * Render Dropdown activity
   */
  renderDropdown(container) {
    // Similar to multiple choice but with dropdown-specific fields
    this.renderMultipleChoice(container);
  }

  /**
   * Render Gap Fill activity
   */
  renderGapFill(container) {
    if (!this.activityData.data.passage) {
      this.activityData.data.passage = '';
    }
    if (!this.activityData.data.gaps) {
      this.activityData.data.gaps = [];
    }

    container.innerHTML = `
      <div class="activity-gapfill-container">
        <h4>Passage</h4>
        <p class="activity-hint">Use <code>___</code> to mark gaps in the text</p>
        <textarea class="activity-passage-input"
                  placeholder="Enter your passage with ___ for gaps..."
                  data-field="passage">${this.activityData.data.passage}</textarea>

        <h4>Gap Answers</h4>
        <p class="activity-hint">Define acceptable answers for each gap</p>
        <div id="gaps-list"></div>
      </div>
    `;

    // Update passage
    container.querySelector('[data-field="passage"]').addEventListener('input', (e) => {
      this.activityData.data.passage = e.target.value;

      // Auto-detect gaps
      const gapCount = (e.target.value.match(/___/g) || []).length;
      while (this.activityData.data.gaps.length < gapCount) {
        this.activityData.data.gaps.push({ acceptable: [''] });
      }

      this.renderGapsList(container.querySelector('#gaps-list'));
    });

    this.renderGapsList(container.querySelector('#gaps-list'));
  }

  /**
   * Render gaps list for Gap Fill
   */
  renderGapsList(container) {
    container.innerHTML = '';

    this.activityData.data.gaps.forEach((gap, index) => {
      const gapDiv = document.createElement('div');
      gapDiv.className = 'activity-gap-item';
      gapDiv.innerHTML = `
        <label>Gap ${index + 1}</label>
        <input type="text"
               class="activity-gap-input"
               value="${gap.acceptable.join(', ')}"
               placeholder="Acceptable answers (comma-separated)"
               data-gap-index="${index}" />
      `;

      gapDiv.querySelector('.activity-gap-input').addEventListener('input', (e) => {
        gap.acceptable = e.target.value.split(',').map((s) => s.trim());
      });

      container.appendChild(gapDiv);
    });
  }

  /**
   * Render Grouping activity
   */
  renderGrouping(container) {
    if (!this.activityData.data.categories) {
      this.activityData.data.categories = [
        { name: 'Category 1', items: [] },
        { name: 'Category 2', items: [] },
      ];
    }

    container.innerHTML = `
      <div class="activity-grouping-container">
        <h4>Categories</h4>
        <div id="categories-list"></div>
        <button type="button" class="activity-add-category-btn" data-action="add-category">
          <i class="fa-solid fa-plus" aria-hidden="true"></i> Add category
        </button>
      </div>
    `;

    const categoriesList = container.querySelector('#categories-list');

    this.activityData.data.categories.forEach((category, catIndex) => {
      const catCard = document.createElement('div');
      catCard.className = 'activity-category-card';
      catCard.innerHTML = `
        <div class="activity-category-header">
          <input type="text"
                 class="activity-category-name"
                 value="${category.name}"
                 placeholder="Category name"
                 data-cat-index="${catIndex}" />
          <button type="button"
                  class="activity-delete-btn"
                  data-action="delete-category"
                  data-cat-index="${catIndex}">
            <i class="fa-solid fa-trash" aria-hidden="true"></i>
          </button>
        </div>

        <div class="activity-items-container">
          ${category.items
            .map(
              (item, itemIndex) => `
            <div class="activity-item-row">
              <input type="text"
                     class="activity-item-input"
                     value="${item}"
                     placeholder="Item"
                     data-cat-index="${catIndex}"
                     data-item-index="${itemIndex}" />
              <button type="button"
                      class="activity-item-delete-btn"
                      data-action="delete-item"
                      data-cat-index="${catIndex}"
                      data-item-index="${itemIndex}">
                <i class="fa-solid fa-times" aria-hidden="true"></i>
              </button>
            </div>
          `
            )
            .join('')}
        </div>

        <button type="button"
                class="activity-add-item-btn"
                data-action="add-item"
                data-cat-index="${catIndex}">
          <i class="fa-solid fa-plus" aria-hidden="true"></i> Add item
        </button>
      `;

      // Update category name
      catCard.querySelector('.activity-category-name').addEventListener('input', (e) => {
        category.name = e.target.value;
      });

      // Delete category
      catCard.querySelector('[data-action="delete-category"]').addEventListener('click', () => {
        this.activityData.data.categories.splice(catIndex, 1);
        this.renderActivityContent();
      });

      // Update items
      catCard.querySelectorAll('.activity-item-input').forEach((input) => {
        input.addEventListener('input', (e) => {
          const itemIndex = parseInt(e.target.dataset.itemIndex);
          category.items[itemIndex] = e.target.value;
        });
      });

      // Delete item
      catCard.querySelectorAll('[data-action="delete-item"]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const itemIndex = parseInt(btn.dataset.itemIndex);
          category.items.splice(itemIndex, 1);
          this.renderActivityContent();
        });
      });

      // Add item
      catCard.querySelector('[data-action="add-item"]').addEventListener('click', () => {
        category.items.push('New item');
        this.renderActivityContent();
      });

      categoriesList.appendChild(catCard);
    });

    // Add category button
    container.querySelector('[data-action="add-category"]').addEventListener('click', () => {
      this.activityData.data.categories.push({
        name: `Category ${this.activityData.data.categories.length + 1}`,
        items: [],
      });
      this.renderActivityContent();
    });
  }

  /**
   * Render Linking activity
   */
  renderLinking(container) {
    if (!this.activityData.data.pairs) {
      this.activityData.data.pairs = [];
    }

    container.innerHTML = `
      <div class="activity-linking-container">
        <h4>Matching Pairs</h4>
        <div id="pairs-list"></div>
        <button type="button" class="activity-add-pair-btn" data-action="add-pair">
          <i class="fa-solid fa-plus" aria-hidden="true"></i> Add pair
        </button>
      </div>
    `;

    const pairsList = container.querySelector('#pairs-list');

    this.activityData.data.pairs.forEach((pair, index) => {
      const pairCard = document.createElement('div');
      pairCard.className = 'activity-pair-card';
      pairCard.innerHTML = `
        <div class="activity-pair-header">
          <span class="activity-pair-number">${index + 1}</span>
          <button type="button"
                  class="activity-delete-btn"
                  data-action="delete-pair"
                  data-pair-index="${index}">
            <i class="fa-solid fa-trash" aria-hidden="true"></i>
          </button>
        </div>

        <div class="activity-pair-inputs">
          <input type="text"
                 class="activity-pair-input"
                 value="${pair.prompt || ''}"
                 placeholder="Left item"
                 data-pair-index="${index}"
                 data-field="prompt" />
          <span class="activity-pair-arrow">→</span>
          <input type="text"
                 class="activity-pair-input"
                 value="${pair.match || ''}"
                 placeholder="Right item"
                 data-pair-index="${index}"
                 data-field="match" />
        </div>

        <input type="text"
               class="activity-hint-input"
               value="${pair.hint || ''}"
               placeholder="Hint (optional)"
               data-pair-index="${index}"
               data-field="hint" />
      `;

      // Update pair
      pairCard.querySelectorAll('.activity-pair-input, .activity-hint-input').forEach((input) => {
        input.addEventListener('input', (e) => {
          const field = e.target.dataset.field;
          pair[field] = e.target.value;
        });
      });

      // Delete pair
      pairCard.querySelector('[data-action="delete-pair"]').addEventListener('click', () => {
        this.activityData.data.pairs.splice(index, 1);
        this.renderActivityContent();
      });

      pairsList.appendChild(pairCard);
    });

    // Add pair button
    container.querySelector('[data-action="add-pair"]').addEventListener('click', () => {
      this.activityData.data.pairs.push({ prompt: '', match: '', hint: '' });
      this.renderActivityContent();
    });
  }

  /**
   * Render Ranking activity
   */
  renderRanking(container) {
    if (!this.activityData.data.items) {
      this.activityData.data.items = [];
    }

    container.innerHTML = `
      <div class="activity-ranking-container">
        <h4>Items to Rank</h4>
        <p class="activity-hint">List items in the correct order from first to last</p>
        <div id="ranking-list"></div>
        <button type="button" class="activity-add-item-btn" data-action="add-ranking-item">
          <i class="fa-solid fa-plus" aria-hidden="true"></i> Add item
        </button>
      </div>
    `;

    const rankingList = container.querySelector('#ranking-list');

    this.activityData.data.items.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'activity-ranking-item';
      itemDiv.innerHTML = `
        <span class="activity-ranking-number">${index + 1}</span>
        <input type="text"
               class="activity-ranking-input"
               value="${item}"
               placeholder="Item ${index + 1}"
               data-item-index="${index}" />
        <button type="button"
                class="activity-delete-btn"
                data-action="delete-ranking-item"
                data-item-index="${index}">
          <i class="fa-solid fa-trash" aria-hidden="true"></i>
        </button>
      `;

      // Update item
      itemDiv.querySelector('.activity-ranking-input').addEventListener('input', (e) => {
        this.activityData.data.items[index] = e.target.value;
      });

      // Delete item
      itemDiv.querySelector('[data-action="delete-ranking-item"]').addEventListener('click', () => {
        this.activityData.data.items.splice(index, 1);
        this.renderActivityContent();
      });

      rankingList.appendChild(itemDiv);
    });

    // Add item button
    container.querySelector('[data-action="add-ranking-item"]').addEventListener('click', () => {
      this.activityData.data.items.push('New item');
      this.renderActivityContent();
    });
  }

  /**
   * Render Multiple Choice Grid activity
   */
  renderMultipleChoiceGrid(container) {
    // Simplified version - similar to multiple choice but with rows and columns
    container.innerHTML = `
      <div class="activity-grid-container">
        <h4>Multiple Choice Grid</h4>
        <p class="activity-hint">Create a matrix of questions with shared answer options</p>
        <p class="activity-note">Coming soon: Full grid builder interface</p>
      </div>
    `;
  }

  /**
   * Render Table Completion activity
   */
  renderTableCompletion(container) {
    container.innerHTML = `
      <div class="activity-table-container">
        <h4>Table Completion</h4>
        <p class="activity-hint">Create a table with cells for learners to fill in</p>
        <p class="activity-note">Coming soon: Full table builder interface</p>
      </div>
    `;
  }

  /**
   * Render Quiz Show activity
   */
  renderQuizShow(container) {
    container.innerHTML = `
      <div class="activity-quiz-show-container">
        <h4>Quiz Show</h4>
        <p class="activity-hint">Create a timed team quiz with questions and scoring</p>
        <p class="activity-note">Coming soon: Full quiz show builder interface</p>
      </div>
    `;
  }

  /**
   * Save the activity
   */
  save() {
    if (this.onSave) {
      this.onSave(this.activityData);
    }
  }

  /**
   * Cancel editing
   */
  cancel() {
    if (confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
      // Close the builder
      this.container.innerHTML = '';
    }
  }

  /**
   * Load existing activity data
   */
  loadActivity(activityData) {
    this.activityData = activityData;
    this.render();
  }
}

/**
 * Open activity builder in a modal
 */
export function openActivityBuilder(onSave) {
  const modal = document.createElement('div');
  modal.className = 'activity-builder-modal';
  modal.innerHTML = `
    <div class="activity-builder-modal-content">
      <div id="activity-builder-container"></div>
    </div>
  `;

  document.body.appendChild(modal);

  const container = modal.querySelector('#activity-builder-container');
  const builder = new VisualActivityBuilder(container, (activityData) => {
    onSave(activityData);
    modal.remove();
  });

  return builder;
}
