import { onDocumentReady, markInitialised, normaliseText, smoothScroll } from './utils.js';

const initGapfill = (root) => {
  if (!markInitialised(root)) {
    return;
  }

  const gaps = Array.from(root.querySelectorAll('.gap'));
  if (!gaps.length) {
    return;
  }

  const checkBtn = root.querySelector('#gap-check');
  const resetBtn = root.querySelector('#gap-reset');
  const feedback = root.querySelector('#gap-feedback');
  const scoreLine = root.querySelector('#gap-score');
  const details = root.querySelector('#gap-details');
  const closeBtn = root.querySelector('#gap-close');

  const evaluate = () => {
    if (!feedback || !scoreLine || !details) {
      return;
    }
    let correct = 0;
    let attempted = 0;
    details.innerHTML = '';

    gaps.forEach((gap, index) => {
      const input = gap.querySelector('input');
      const value = normaliseText(input?.value || '');
      const answers = (gap.dataset.answers || '')
        .split('|')
        .map((answer) => normaliseText(answer))
        .filter(Boolean);

      if (!input) {
        return;
      }

      if (!value) {
        input.classList.remove('correct', 'incorrect');
        return;
      }

      attempted += 1;
      const isCorrect = answers.includes(value);
      if (isCorrect) {
        correct += 1;
      }
      input.classList.toggle('correct', isCorrect);
      input.classList.toggle('incorrect', !isCorrect);

      const detail = document.createElement('div');
      detail.className = `feedback-item ${isCorrect ? 'correct' : 'incorrect'}`;
      const acceptableAnswers = answers.length ? answers.join(', ') : 'Not provided';
      detail.innerHTML = `
        <h4>Blank ${index + 1}</h4>
        <p><strong>Your answer:</strong> ${input.value || 'No response'}</p>
        ${isCorrect ? '' : `<p><strong>Acceptable answers:</strong> ${acceptableAnswers}</p>`}
      `;
      details.appendChild(detail);
    });

    if (attempted === 0) {
      scoreLine.textContent = 'Please complete at least one blank before checking.';
    } else {
      scoreLine.textContent = `You answered ${correct} of ${attempted} correctly.`;
    }
    feedback.hidden = false;
    smoothScroll(feedback);
  };

  const reset = () => {
    gaps.forEach((gap) => {
      const input = gap.querySelector('input');
      if (input) {
        input.value = '';
        input.classList.remove('correct', 'incorrect');
      }
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
    .querySelectorAll('.gapfill-activity[data-module="gapfill"]')
    .forEach((root) => initGapfill(root));
};

onDocumentReady(bootstrap);
