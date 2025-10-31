const onDocumentReady = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  } else {
    callback();
  }
};

const markInitialised = (element) => {
  if (!element || element.dataset.moduleReady === 'true') {
    return false;
  }
  element.dataset.moduleReady = 'true';
  return true;
};

const parseConfig = (raw, fallback = null) => {
  if (typeof raw !== 'string' || !raw.trim()) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Unable to parse module config', error);
    return fallback;
  }
};

const normaliseText = (value = '') => value.trim().toLowerCase();

const smoothScroll = (element) => {
  if (element && typeof element.scrollIntoView === 'function') {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

export { onDocumentReady, markInitialised, parseConfig, normaliseText, smoothScroll };
