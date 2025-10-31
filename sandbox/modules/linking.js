import { onDocumentReady, markInitialised, parseConfig, smoothScroll } from './utils.js';

const shuffle = (items) => {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const initLinking = (root) => {
  if (!markInitialised(root)) {
    return;
  }

  const config = parseConfig(root.dataset.config, {});
  const pairs = Array.isArray(config?.pairs) ? config.pairs : [];
  const selects = Array.from(root.querySelectorAll('.linking-select'));
  if (!pairs.length || !selects.length) {
    return;
  }

  const baseOptions = pairs.map((pair, index) => ({ value: String(index), label: pair.match }));
  const answerMap = new Map(baseOptions.map((entry) => [entry.value, entry.label]));

  const buildOptions = (select) => {
    const currentValue = select.value;
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Choose match';
    select.appendChild(placeholder);
    shuffle(baseOptions).forEach((entry) => {
      const option = document.createElement('option');
      option.value = entry.value;
      option.textContent = entry.label;
      select.appendChild(option);
    });
    if (currentValue && answerMap.has(currentValue)) {
      select.value = currentValue;
    }
  };

  const feedback = root.querySelector('#linking-feedback');
  const summary = root.querySelector('#linking-summary');
  const details = root.querySelector('#linking-details');
  const checkBtn = root.querySelector('#linking-check');
  const resetBtn = root.querySelector('#linking-reset');
  const closeBtn = root.querySelector('#linking-close');

  const reset = () => {
    selects.forEach((select) => {
      buildOptions(select);
      select.value = '';
      const row = select.closest('.linking-row');
      if (row) {
        row.classList.remove('correct', 'incorrect');
      }
    });
    if (feedback) {
      feedback.hidden = true;
    }
    if (details) {
      details.innerHTML = '';
    }
  };

  reset();

  const evaluate = () => {
    if (!feedback || !summary || !details) {
      return;
    }
    let correctCount = 0;
    details.innerHTML = '';

    selects.forEach((select, index) => {
      const row = select.closest('.linking-row');
      const chosen = select.value;
      const isCorrect = chosen && Number(chosen) === index;
      if (row) {
        row.classList.toggle('correct', isCorrect);
        row.classList.toggle('incorrect', !isCorrect);
      }
      if (isCorrect) {
        correctCount += 1;
      }
      const detail = document.createElement('li');
      const prompt = row?.querySelector('.linking-statement')?.textContent || `Prompt ${index + 1}`;
      const heading = document.createElement('strong');
      heading.textContent = prompt;
      detail.appendChild(heading);

      const span = document.createElement('span');
      const chosenLabel = chosen ? answerMap.get(chosen) || 'Incorrect match' : 'No selection';
      const expectedLabel = answerMap.get(String(index)) || row?.dataset.answer || 'Not set';
      span.textContent = ` — You linked: ${chosenLabel}. Correct: ${expectedLabel}.`;
      detail.appendChild(span);

      const hint = row?.querySelector('.linking-hint')?.textContent || pairs[index]?.hint;
      if (hint) {
        const note = document.createElement('p');
        note.className = 'detail-note';
        note.textContent = hint;
        detail.appendChild(note);
      }

      details.appendChild(detail);
    });

    summary.textContent = `You linked ${correctCount} of ${selects.length} correctly.`;
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
    .querySelectorAll('.linking-activity[data-module="linking"]')
    .forEach((root) => initLinking(root));
};

onDocumentReady(bootstrap);
