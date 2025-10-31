import { onDocumentReady, markInitialised, parseConfig, smoothScroll } from './utils.js';

const initGrid = (root) => {
  if (!markInitialised(root)) {
    return;
  }

  const rows = Array.from(root.querySelectorAll('.grid-row'));
  if (!rows.length) {
    return;
  }

  const columns = parseConfig(root.dataset.columns, []);
  const checkBtn = root.querySelector('#grid-check');
  const resetBtn = root.querySelector('#grid-reset');
  const closeBtn = root.querySelector('#grid-close');
  const feedback = root.querySelector('#grid-feedback');
  const summary = root.querySelector('#grid-summary');
  const details = root.querySelector('#grid-details');

  const reset = () => {
    rows.forEach((row) => {
      row.classList.remove('correct', 'incorrect');
      row.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.checked = false;
      });
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

    rows.forEach((row, index) => {
      const correctIndex = Number(row.dataset.correct);
      const selected = Array.from(row.querySelectorAll('input[type="radio"]')).find((input) => input.checked);
      const selectedIndex = selected ? Number(selected.value) : NaN;
      const isCorrect = Number.isFinite(correctIndex) && selectedIndex === correctIndex;
      row.classList.toggle('correct', isCorrect);
      row.classList.toggle('incorrect', !isCorrect);
      if (isCorrect) {
        score += 1;
      }

      const detail = document.createElement('li');
      const prompt = row.querySelector('.grid-row-label')?.textContent || `Row ${index + 1}`;
      const heading = document.createElement('strong');
      heading.textContent = prompt;
      detail.appendChild(heading);

      const chosenLabel = Number.isFinite(selectedIndex) ? columns[selectedIndex] || 'No selection' : 'No selection';
      const correctLabel = Number.isFinite(correctIndex) ? columns[correctIndex] || 'Not set' : 'Not set';

      const span = document.createElement('span');
      span.textContent = ` — You chose: ${chosenLabel}. Correct: ${correctLabel}.`;
      detail.appendChild(span);

      const note = row.querySelector('.grid-row-note')?.textContent;
      if (note) {
        const detailNote = document.createElement('p');
        detailNote.className = 'detail-note';
        detailNote.textContent = note;
        detail.appendChild(detailNote);
      }

      details.appendChild(detail);
    });

    summary.textContent = `You matched ${score} of ${rows.length} correctly.`;
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
    .querySelectorAll('.grid-activity[data-module="multiple-choice-grid"]')
    .forEach((root) => initGrid(root));
};

onDocumentReady(bootstrap);
