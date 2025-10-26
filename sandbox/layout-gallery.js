import { BUILDER_LAYOUT_DEFAULTS, LAYOUT_ICON_DEFAULTS } from './slide-templates.js';

const trimText = (value) => (typeof value === 'string' ? value.trim() : '');

const createBlankCanvasSlide = () => {
  const slide = document.createElement('div');
  slide.className = 'slide-stage hidden';
  slide.dataset.type = 'blank';
  slide.dataset.layout = 'blank-canvas';
  slide.classList.add('lesson-slide');

  const inner = document.createElement('div');
  inner.className = 'slide-inner blank-canvas';
  inner.setAttribute('role', 'region');
  inner.setAttribute('aria-label', 'Blank slide workspace');

  slide.appendChild(inner);
  return slide;
};

const LAYOUT_FACTORIES = {
  'blank-canvas': createBlankCanvasSlide,
};

const LAYOUT_METADATA = {
  'blank-canvas': {
    label: 'Blank canvas',
    description: 'Start with an empty slide and place your own text boxes, drawings, and pasted media.',
  },
};

const renderLayoutCard = (layout, container) => {
  if (!(container instanceof HTMLElement)) {
    return;
  }
  const factory = LAYOUT_FACTORIES[layout];
  const defaultsFactory = BUILDER_LAYOUT_DEFAULTS[layout];
  if (typeof factory !== 'function' || typeof defaultsFactory !== 'function') {
    return;
  }
  const slide = factory(defaultsFactory());
  slide.classList.remove('hidden');

  const card = document.createElement('article');
  card.className = 'layout-card';

  const label = document.createElement('div');
  label.className = 'layout-label';
  const icon = document.createElement('i');
  icon.className = trimText(LAYOUT_ICON_DEFAULTS[layout]) || 'fa-solid fa-border-all';
  icon.setAttribute('aria-hidden', 'true');
  label.appendChild(icon);
  const labelText = document.createElement('span');
  labelText.textContent = LAYOUT_METADATA[layout]?.label || 'Blank canvas';
  label.appendChild(labelText);
  card.appendChild(label);

  const description = LAYOUT_METADATA[layout]?.description;
  if (description) {
    const descriptionEl = document.createElement('p');
    descriptionEl.className = 'layout-description';
    descriptionEl.textContent = description;
    card.appendChild(descriptionEl);
  }

  card.appendChild(slide);
  container.appendChild(card);
};

const initLayoutGallery = () => {
  const container = document.querySelector('[data-layout-gallery]');
  if (!(container instanceof HTMLElement)) {
    return;
  }
  renderLayoutCard('blank-canvas', container);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLayoutGallery);
} else {
  initLayoutGallery();
}
