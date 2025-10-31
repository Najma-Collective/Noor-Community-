import { onDocumentReady, markInitialised, smoothScroll } from './utils.js';

const initMultipleChoice = (root) => {
  if (!markInitialised(root)) {
    return;
  }

  const questions = Array.from(root.querySelectorAll('.mc-question'));
  if (!questions.length) {
    return;
  }

  const checkBtn = root.querySelector('#mc-check');
  const resetBtn = root.querySelector('#mc-reset');
  const feedback = root.querySelector('#mc-feedback');
  const scoreLine = root.querySelector('#mc-score');
  const details = root.querySelector('#mc-details');
  const closeBtn = root.querySelector('#mc-close');

  const evaluate = () => {
    if (!feedback || !scoreLine || !details) {
      return;
    }
    let correctCount = 0;
    const totalCount = questions.length;
    details.innerHTML = '';

    questions.forEach((question) => {
      const options = Array.from(question.querySelectorAll('.mc-option'));
      const expected = options
        .filter((option) => option.dataset.correct === 'true')
        .map((option) => options.indexOf(option));
      const selected = options
        .map((option, index) => ({ option, index }))
        .filter(({ option }) => option.querySelector('input')?.checked)
        .map(({ index }) => index);

      const isCorrect =
        expected.length === selected.length && expected.every((value) => selected.includes(value));
      if (isCorrect) {
        correctCount += 1;
      }

      const learnerAnswer = selected.length
        ? selected.map((index) => options[index].innerText.trim()).join(', ')
        : 'No response';
      const correctAnswer = expected.length
        ? expected.map((index) => options[index].innerText.trim()).join(', ')
        : 'No correct answer provided';

      const detail = document.createElement('div');
      detail.className = `feedback-item ${isCorrect ? 'correct' : 'incorrect'}`;
      const questionTitle = question.querySelector('.mc-question-title')?.innerText || 'Question';
      const explanation = question.dataset.explanation || '';
      detail.innerHTML = `
        <h4>${questionTitle}</h4>
        <p><strong>Your answer:</strong> ${learnerAnswer}</p>
        ${isCorrect ? '' : `<p><strong>Correct answer:</strong> ${correctAnswer}</p>`}
        <p class="explanation">${explanation}</p>
      `;
      details.appendChild(detail);
    });

    scoreLine.textContent = `You answered ${correctCount} of ${totalCount} correctly.`;
    feedback.hidden = false;
    smoothScroll(feedback);
  };

  const reset = () => {
    details?.innerHTML = '';
    if (feedback) {
      feedback.hidden = true;
    }
    root.querySelectorAll('.mc-options input').forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.checked = false;
      }
    });
  };

  checkBtn?.addEventListener('click', evaluate);
  resetBtn?.addEventListener('click', reset);
  closeBtn?.addEventListener('click', () => {
    if (feedback) {
      feedback.hidden = true;
    }
  });
};

const bootstrap = () => {
  document
    .querySelectorAll('.mc-activity[data-module="multiple-choice"]')
    .forEach((root) => initMultipleChoice(root));
};

onDocumentReady(bootstrap);
