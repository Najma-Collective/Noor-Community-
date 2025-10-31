import { onDocumentReady, markInitialised, smoothScroll } from './utils.js';

const initDropdown = (root) => {
  if (!markInitialised(root)) {
    return;
  }

  const items = Array.from(root.querySelectorAll('.dropdown-item'));
  if (!items.length) {
    return;
  }

  const checkBtn = root.querySelector('#dropdown-check');
  const resetBtn = root.querySelector('#dropdown-reset');
  const closeBtn = root.querySelector('#dropdown-close');
  const feedback = root.querySelector('#dropdown-feedback');
  const summary = root.querySelector('#dropdown-summary');
  const details = root.querySelector('#dropdown-details');

  const reset = () => {
    items.forEach((item) => {
      const select = item.querySelector('select');
      if (select) {
        select.value = '';
      }
      item.classList.remove('correct', 'incorrect');
    });
    if (feedback) {
      feedback.hidden = true;
    }
    if (details) {
      details.innerHTML = '';
    }
  };

  const evaluate = () => {
    if (!feedback || !summary || !details) {
      return;
    }
    let score = 0;
    details.innerHTML = '';

    items.forEach((item) => {
      const select = item.querySelector('select');
      const correctIndex = Number(item.dataset.correct);
      const selectedValue = select ? select.value : '';
      const isCorrect = selectedValue !== '' && Number(selectedValue) === correctIndex;
      item.classList.toggle('correct', isCorrect);
      item.classList.toggle('incorrect', !isCorrect);
      if (isCorrect) {
        score += 1;
      }

      const detail = document.createElement('li');
      const prompt = item.querySelector('.dropdown-prompt')?.textContent || 'Prompt';
      const heading = document.createElement('strong');
      heading.textContent = prompt;
      detail.appendChild(heading);

      const optionList = select ? Array.from(select.options) : [];
      const chosenOption = optionList.find((option) => option.value === selectedValue);
      const chosenText = selectedValue !== '' ? chosenOption?.text || 'No selection' : 'No selection';
      const correctOption = optionList.find((option) => option.value === String(correctIndex));
      const correctText = Number.isFinite(correctIndex) ? correctOption?.text || 'Not set' : 'Not set';

      const span = document.createElement('span');
      span.textContent = ` — You chose: ${chosenText}. Correct: ${correctText}.`;
      detail.appendChild(span);

      const hint = item.querySelector('[data-role="feedback"]')?.textContent || '';
      if (hint) {
        const note = document.createElement('p');
        note.className = 'detail-note';
        note.textContent = hint;
        detail.appendChild(note);
      }

      details.appendChild(detail);
    });

    summary.textContent = `You answered ${score} of ${items.length} correctly.`;
    feedback.hidden = false;
    smoothScroll(feedback);
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
    .querySelectorAll('.dropdown-activity[data-module="dropdown"]')
    .forEach((root) => initDropdown(root));
};

onDocumentReady(bootstrap);
