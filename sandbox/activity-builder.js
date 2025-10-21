const DEFAULT_STATES = {
  'multiple-choice': () => ({
    title: 'Quick Knowledge Check',
    instructions: 'Select the best answer for each question before checking your work.',
    rubric: 'Full credit is earned when all of the correct responses are selected.',
    questions: [
      {
        prompt: 'Sample question prompt goes here.',
        explanation: 'Explain why the correct answer is correct or clarify common misconceptions.',
        options: [
          { text: 'Correct option', correct: true },
          { text: 'Distractor A', correct: false },
          { text: 'Distractor B', correct: false }
        ]
      }
    ]
  }),
  gapfill: () => ({
    title: 'Complete the Passage',
    instructions: 'Type the missing words to complete the passage.',
    rubric: 'Earn one point for each correctly completed blank.',
    passage: 'Climate change refers to [[long-term]] shifts in temperature and weather patterns, mainly caused by [[human|human-caused|man-made]] activities.'
  }),
  grouping: () => ({
    title: 'Sort the Concepts',
    instructions: 'Drag each card into the matching category.',
    rubric: 'Each card placed in the correct category is worth one point.',
    categories: [
      {
        name: 'Renewable Energy',
        description: 'Sources that replenish naturally.',
        items: ['Solar', 'Wind']
      },
      {
        name: 'Non-renewable Energy',
        description: 'Sources that will eventually run out.',
        items: ['Coal', 'Natural Gas']
      }
    ]
  }),
  'table-completion': () => ({
    title: 'Compare the Options',
    instructions: 'Complete the table with the correct information.',
    rubric: 'Each cell that matches the answer key is worth one point.',
    columnHeaders: ['Feature', 'Option A', 'Option B'],
    rows: [
      { label: 'Cost', answers: ['lower', 'higher'] },
      { label: 'Availability', answers: ['limited', 'wide'] }
    ]
  })
};

const escapeHtml = (unsafe = '') =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

class ActivityBuilder {
  constructor() {
    this.state = {
      type: 'multiple-choice',
      data: DEFAULT_STATES['multiple-choice']()
    };

    this.typeSelect = document.getElementById('activity-type');
    this.formContainer = document.getElementById('builder-form');
    this.previewFrame = document.getElementById('activity-preview');
    this.outputArea = document.getElementById('output-html');
    this.copyBtn = document.getElementById('copy-html');
    this.refreshBtn = document.getElementById('refresh-preview');
    this.alertTemplate = document.getElementById('alert-template');

    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.handleFormInput = this.handleFormInput.bind(this);
    this.handleFormClick = this.handleFormClick.bind(this);
    this.renderForm = this.renderForm.bind(this);
  }

  init() {
    this.typeSelect.addEventListener('change', this.handleTypeChange);
    this.formContainer.addEventListener('input', this.handleFormInput);
    this.formContainer.addEventListener('change', this.handleFormInput);
    this.formContainer.addEventListener('click', this.handleFormClick);
    this.copyBtn.addEventListener('click', () => this.copyHtml());
    this.refreshBtn.addEventListener('click', () => this.updateOutputs());

    this.renderForm();
    this.updateOutputs();
  }

  handleTypeChange(event) {
    const nextType = event.target.value;
    this.state = {
      type: nextType,
      data: DEFAULT_STATES[nextType]()
    };
    this.renderForm();
    this.updateOutputs();
  }

  handleFormInput(event) {
    const { target } = event;
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
      case 'copy-html':
        this.copyHtml();
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

  renderForm() {
    const { type, data } = this.state;
    let markup = '';

    const shared = `
      <section class="form-section">
        <h2 class="section-title">General Settings</h2>
        <div class="form-grid">
          <label>Activity title
            <input type="text" value="${escapeHtml(data.title)}" data-field="title" placeholder="Enter a descriptive title" />
          </label>
          <label>Rubric / success criteria
            <textarea data-field="rubric" placeholder="Describe how the activity is graded">${escapeHtml(data.rubric)}</textarea>
          </label>
          <label>Instructions
            <textarea data-field="instructions" placeholder="Provide learner instructions">${escapeHtml(data.instructions)}</textarea>
          </label>
        </div>
      </section>
    `;

    if (type === 'multiple-choice') {
      markup = [
        shared,
        '<section class="form-section">',
        '<h2 class="section-title">Questions</h2>',
        ...data.questions.map((question, qIndex) => `
          <article class="question-block" data-block="question" data-index="${qIndex}">
            <div class="block-header">
              <h3>Question ${qIndex + 1}</h3>
              <button type="button" class="subtle-link" data-action="remove-question">Remove</button>
            </div>
            <label>Prompt
              <textarea data-field="prompt" placeholder="Enter the learner prompt">${escapeHtml(question.prompt)}</textarea>
            </label>
            <label>Feedback explanation
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
                      <button type="button" class="subtle-link" data-action="remove-option">Remove</button>
                    </div>
                  `
                )
                .join('')}
            </div>
            <button type="button" class="chip-btn" data-action="add-option">Add option</button>
          </article>
        `),
        '<button type="button" class="chip-btn" data-action="add-question">Add question</button>',
        '</section>'
      ].join('');
    } else if (type === 'gapfill') {
      markup = `
        ${shared}
        <section class="form-section">
          <h2 class="section-title">Passage</h2>
          <label>Passage text with blanks
            <textarea data-field="passage" placeholder="Wrap each answer in double brackets like [[answer|alternate]]">${escapeHtml(
              data.passage
            )}</textarea>
          </label>
          <p class="helper-text">Separate alternate correct answers with a vertical bar. Each pair of brackets creates an input.</p>
        </section>
      `;
    } else if (type === 'grouping') {
      markup = [
        shared,
        '<section class="form-section">',
        '<h2 class="section-title">Categories & cards</h2>',
        ...data.categories.map(
          (category, cIndex) => `
            <article class="category-block" data-block="category" data-index="${cIndex}">
              <div class="block-header">
                <h3>Category ${cIndex + 1}</h3>
                <button type="button" class="subtle-link" data-action="remove-category">Remove</button>
              </div>
              <label>Name
                <input type="text" data-field="category-name" value="${escapeHtml(category.name)}" placeholder="Category name" />
              </label>
              <label>Description (optional)
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
                        <button type="button" class="subtle-link" data-action="remove-item">Remove</button>
                      </div>
                    `
                  )
                  .join('')}
              </div>
              <button type="button" class="chip-btn" data-action="add-item">Add card</button>
            </article>
          `
        ),
        '<button type="button" class="chip-btn" data-action="add-category">Add category</button>',
        '</section>'
      ].join('');
    } else if (type === 'table-completion') {
      markup = [
        shared,
        '<section class="form-section">',
        '<h2 class="section-title">Table structure</h2>',
        '<div class="table-headers" data-block="table-header">',
        data.columnHeaders
          .map(
            (header, hIndex) => `
              <label>Header ${hIndex + 1}
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
                <button type="button" class="subtle-link" data-action="remove-row">Remove</button>
              </div>
              <label>Row label
                <input type="text" data-field="row-label" value="${escapeHtml(row.label)}" placeholder="Row label" />
              </label>
              <div class="cell-row">
                ${row.answers
                  .map(
                    (cell, cellIndex) => `
                      <label>Cell ${cellIndex + 1}
                        <input type="text" data-field="row-answer-${cellIndex}" value="${escapeHtml(cell)}" placeholder="Correct value" />
                      </label>
                    `
                  )
                  .join('')}
              </div>
            </article>
          `
        ),
        '<button type="button" class="chip-btn" data-action="add-row">Add row</button>',
        '</section>'
      ].join('');
    }

    this.formContainer.innerHTML = markup;

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
    const { type, data } = this.state;
    return JSON.parse(JSON.stringify({ type, data }));
  }

  updateOutputs() {
    const config = this.getCurrentConfig();
    const generator = Generators[config.type];
    if (!generator) return;

    const html = generator(config.data);

    this.outputArea.value = html;

    const iframeDoc = this.previewFrame.contentDocument;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
  }

  async copyHtml() {
    try {
      await navigator.clipboard.writeText(this.outputArea.value);
      this.showAlert('HTML copied to clipboard.');
    } catch (error) {
      console.error(error);
      this.showAlert('Copy failed. Select and copy manually.');
    }
  }

  showAlert(message) {
    const alertNode = this.alertTemplate.content.firstElementChild.cloneNode(true);
    alertNode.textContent = message;
    document.body.appendChild(alertNode);
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
              detail.innerHTML = `
                <h4>${question.querySelector('.mc-question-title').innerText}</h4>
                <p><strong>Your answer:</strong> ${learnerAnswer}</p>
                ${isCorrect ? '' : `<p><strong>Correct answer:</strong> ${correctAnswer}</p>`}
                <p class="explanation">${question.dataset.explanation || ''}</p>
              `;
              details.appendChild(detail);
            });

            scoreLine.textContent = `You answered ${correctCount} of ${totalCount} correctly.`;
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
              detail.innerHTML = `
                <h4>Blank ${index + 1}</h4>
                <p><strong>Your answer:</strong> ${input.value || 'No response'}</p>
                ${isCorrect ? '' : `<p><strong>Acceptable answers:</strong> ${gap.dataset.answers.replace(/\|/g, ', ')}</p>`}
              `;
              details.appendChild(detail);
            });

            if (attempted === 0) {
              scoreLine.textContent = 'Please complete at least one blank before checking.';
            } else {
              scoreLine.textContent = `You answered ${correct} of ${attempted} correctly.`;
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
        (category, index) => `
          <section class="group-target" data-accepts="${escapeHtml(category.name)}">
            <header>
              <h3>${escapeHtml(category.name)}</h3>
              ${category.description ? `<p>${escapeHtml(category.description)}</p>` : ''}
            </header>
            <div class="drop-zone" aria-label="${escapeHtml(category.name)}" data-zone-index="${index}"></div>
          </section>
        `
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
                detail.innerHTML = `
                  <h4>${item.innerText.trim()}</h4>
                  <p>${isCorrect ? 'Placed correctly' : 'Should be in ' + item.dataset.category}</p>
                `;
                details.appendChild(detail);
              });
            });

            scoreLine.textContent = `You sorted ${correct} of ${total} cards correctly.`;
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
              detail.innerHTML = `
                <h4>${input.closest('tr').querySelector('th').innerText} – ${input.dataset.header || ''}</h4>
                <p><strong>Your answer:</strong> ${input.value || 'No response'}</p>
                ${isCorrect ? '' : `<p><strong>Correct answer:</strong> ${input.dataset.answer}</p>`}
              `;
              details.appendChild(detail);
            });

            if (attempted === 0) {
              scoreLine.textContent = 'Please complete at least one cell before checking.';
            } else {
              scoreLine.textContent = `You answered ${correct} of ${attempted} correctly.`;
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

window.addEventListener('DOMContentLoaded', () => {
  const builder = new ActivityBuilder();
  builder.init();
});
