import { onDocumentReady, markInitialised, smoothScroll } from './utils.js';

const initGrouping = (root) => {
  if (!markInitialised(root)) {
    return;
  }

  const dragItems = Array.from(root.querySelectorAll('.group-item'));
  const dropZones = Array.from(root.querySelectorAll('.drop-zone'));
  const sourceContainer = root.querySelector('.group-source');
  if (!dragItems.length || !dropZones.length || !sourceContainer) {
    return;
  }

  const checkBtn = root.querySelector('#group-check');
  const resetBtn = root.querySelector('#group-reset');
  const feedback = root.querySelector('#group-feedback');
  const scoreLine = root.querySelector('#group-score');
  const details = root.querySelector('#group-details');
  const closeBtn = root.querySelector('#group-close');

  dragItems.forEach((item) => {
    item.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', item.id);
      window.setTimeout(() => item.classList.add('dragging'), 0);
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
      const dragged = id ? root.querySelector(`[id="${id}"]`) : null;
      if (dragged) {
        zone.appendChild(dragged);
      }
    });
  });

  sourceContainer.addEventListener('dragover', allowDrop);
  sourceContainer.addEventListener('drop', (event) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    const dragged = id ? root.querySelector(`[id="${id}"]`) : null;
    if (dragged) {
      sourceContainer.appendChild(dragged);
    }
  });

  const evaluate = () => {
    if (!feedback || !scoreLine || !details) {
      return;
    }
    let correct = 0;
    const total = dragItems.length;
    details.innerHTML = '';

    dropZones.forEach((zone) => {
      const expected = zone.parentElement?.querySelector('h3')?.textContent?.trim();
      Array.from(zone.children).forEach((item) => {
        const isCorrect = expected && item.dataset.category === expected;
        item.classList.toggle('correct', Boolean(isCorrect));
        item.classList.toggle('incorrect', !isCorrect);
        if (isCorrect) {
          correct += 1;
        }
        const detail = document.createElement('div');
        detail.className = `feedback-item ${isCorrect ? 'correct' : 'incorrect'}`;
        detail.innerHTML = `
          <h4>${item.textContent?.trim() || 'Item'}</h4>
          <p>${isCorrect ? 'Placed correctly' : `Should be in ${item.dataset.category}`}</p>
        `;
        details.appendChild(detail);
      });
    });

    scoreLine.textContent = `You sorted ${correct} of ${total} cards correctly.`;
    feedback.hidden = false;
    smoothScroll(feedback);
  };

  const reset = () => {
    dragItems.forEach((item) => {
      item.classList.remove('correct', 'incorrect');
      sourceContainer.appendChild(item);
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
    .querySelectorAll('.grouping-activity[data-module="grouping"]')
    .forEach((root) => initGrouping(root));
};

onDocumentReady(bootstrap);
