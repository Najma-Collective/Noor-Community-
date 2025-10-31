import { onDocumentReady, markInitialised, smoothScroll } from './utils.js';

const shuffle = (array) => {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const initRanking = (root) => {
  if (!markInitialised(root)) {
    return;
  }

  const list = root.querySelector('.ranking-list');
  if (!list) {
    return;
  }

  const entries = Array.from(list.children);
  if (!entries.length) {
    return;
  }

  const checkBtn = root.querySelector('#ranking-check');
  const resetBtn = root.querySelector('#ranking-reset');
  const closeBtn = root.querySelector('#ranking-close');
  const feedback = root.querySelector('#ranking-feedback');
  const summary = root.querySelector('#ranking-summary');
  const details = root.querySelector('#ranking-details');

  const refreshNumbers = () => {
    Array.from(list.children).forEach((item, index) => {
      const badge = item.querySelector('.ranking-number');
      if (badge) {
        badge.textContent = index + 1;
      }
    });
  };

  const updateControls = () => {
    const children = Array.from(list.children);
    children.forEach((item, index) => {
      const upBtn = item.querySelector('button[data-role="rank-up"]');
      const downBtn = item.querySelector('button[data-role="rank-down"]');
      if (upBtn) {
        upBtn.disabled = index === 0;
      }
      if (downBtn) {
        downBtn.disabled = index === children.length - 1;
      }
    });
  };

  const reset = () => {
    const shuffled = shuffle(entries);
    shuffled.forEach((item) => {
      item.classList.remove('correct', 'incorrect');
      list.appendChild(item);
    });
    if (feedback) {
      feedback.hidden = true;
    }
    if (details) {
      details.innerHTML = '';
    }
    refreshNumbers();
    updateControls();
  };

  list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-role]');
    if (!button) {
      return;
    }
    const item = button.closest('.ranking-item');
    if (!item) {
      return;
    }
    if (button.dataset.role === 'rank-up') {
      const previous = item.previousElementSibling;
      if (previous) {
        list.insertBefore(item, previous);
      }
    } else if (button.dataset.role === 'rank-down') {
      const next = item.nextElementSibling;
      if (next) {
        list.insertBefore(next, item);
      }
    }
    refreshNumbers();
    updateControls();
  });

  const evaluate = () => {
    if (!feedback || !summary || !details) {
      return;
    }
    const ordered = Array.from(list.children);
    let score = 0;
    details.innerHTML = '';

    ordered.forEach((item, position) => {
      const answerIndex = Number(item.dataset.answerIndex);
      const isCorrect = answerIndex === position;
      item.classList.toggle('correct', isCorrect);
      item.classList.toggle('incorrect', !isCorrect);
      if (isCorrect) {
        score += 1;
      }
      const detail = document.createElement('li');
      const title = document.createElement('strong');
      const text = item.dataset.itemText || `Item ${position + 1}`;
      title.textContent = `${position + 1}. ${text}`;
      detail.appendChild(title);
      if (!isCorrect) {
        const span = document.createElement('span');
        span.textContent = ` — Correct position: ${answerIndex + 1}`;
        detail.appendChild(span);
      }
      if (item.dataset.itemNote) {
        const note = document.createElement('p');
        note.className = 'detail-note';
        note.textContent = item.dataset.itemNote;
        detail.appendChild(note);
      }
      details.appendChild(detail);
    });

    summary.textContent = `You placed ${score} of ${ordered.length} in the correct position.`;
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

  reset();
};

const bootstrap = () => {
  document
    .querySelectorAll('.ranking-activity[data-module="ranking"]')
    .forEach((root) => initRanking(root));
};

onDocumentReady(bootstrap);
