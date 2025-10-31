import { onDocumentReady } from './utils.js';
import { fetchPexelsImage } from '../pexels-client.js';

const statusMessage = (element, message) => {
  if (!element) {
    return;
  }
  element.textContent = message;
};

const buildImage = (url, alt) => {
  const img = document.createElement('img');
  img.src = url;
  img.alt = alt;
  img.loading = 'lazy';
  return img;
};

const initFigure = async (figure) => {
  if (!figure || figure.dataset.initialised === 'true') {
    return;
  }

  figure.dataset.initialised = 'true';

  const query = figure.dataset.pexelsQuery;
  if (!query) {
    return;
  }

  const orientation = figure.dataset.pexelsOrientation || 'landscape';
  const placeholder = figure.querySelector('[data-role="pexels-placeholder"]');
  statusMessage(placeholder, 'Loading image…');

  const result = await fetchPexelsImage(query, { orientation });
  if (!result || !result.url) {
    statusMessage(placeholder, 'Image unavailable.');
    return;
  }

  const figcaption = figure.querySelector('figcaption');
  const image = buildImage(result.url, result.alt || `Decorative image for ${query}`);

  if (placeholder) {
    placeholder.remove();
  }

  figure.insertBefore(image, figcaption || null);

  if (figcaption && !figcaption.textContent.trim() && result.photographer) {
    figcaption.textContent = `Photo by ${result.photographer} on Pexels.`;
  }
};

const bootstrap = () => {
  document
    .querySelectorAll('[data-pexels-query]')
    .forEach((figure) => initFigure(figure));
};

onDocumentReady(bootstrap);
