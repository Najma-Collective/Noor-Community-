import { onDocumentReady, markInitialised, normaliseText, smoothScroll } from './utils.js';

const initTableCompletion = (root) => {
  if (!markInitialised(root)) {
    return;
  }

  const inputs = Array.from(root.querySelectorAll('.table-activity input'));
  if (!inputs.length) {
    return;
  }

  const checkBtn = root.querySelector('#table-check');
  const resetBtn = root.querySelector('#table-reset');
  const feedback = root.querySelector('#table-feedback');
  const scoreLine = root.querySelector('#table-score');
  const details = root.querySelector('#table-details');
  const closeBtn = root.querySelector('#table-close');

  const evaluate = () => {
    if (!feedback || !scoreLine || !details) {
      return;
    }
    let correct = 0;
    let attempted = 0;
    details.innerHTML = '';

    inputs.forEach((input) => {
      const learnerValue = normaliseText(input.value || '');
      const answer = normaliseText(input.dataset.answer || '');
      if (!learnerValue) {
        input.classList.remove('correct', 'incorrect');
        return;
      }
      attempted += 1;
      const isCorrect = learnerValue === answer;
      if (isCorrect) {
        correct += 1;
      }
      input.classList.toggle('correct', isCorrect);
      input.classList.toggle('incorrect', !isCorrect);

      const detail = document.createElement('div');
      detail.className = `feedback-item ${isCorrect ? 'correct' : 'incorrect'}`;
      const rowLabel = input.closest('tr')?.querySelector('th')?.innerText || 'Row';
      const header = input.dataset.header || '';
      detail.innerHTML = `
        <h4>${rowLabel} – ${header}</h4>
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
    smoothScroll(feedback);
  };

  const reset = () => {
    inputs.forEach((input) => {
      input.value = '';
      input.classList.remove('correct', 'incorrect');
    });
    if (details) {
      details.innerHTML = '';
    }
    if (feedback) {
      feedback.hidden = true;
    }
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
    .querySelectorAll('.table-activity[data-module="table-completion"]')
    .forEach((root) => initTableCompletion(root));
};

onDocumentReady(bootstrap);
