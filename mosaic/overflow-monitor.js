(function (global) {
  const observedElements = new Map();
  const ResizeObserverCtor = global.ResizeObserver;
  if (!ResizeObserverCtor) {
    console.warn('ResizeObserver is not supported in this environment. Overflow monitoring is disabled.');
    global.OverflowMonitor = {
      observe: () => {},
      refresh: () => {},
      disconnect: () => {},
      check: () => {}
    };
    return;
  }

  const resizeObserver = new ResizeObserverCtor(entries => {
    entries.forEach(entry => {
      checkOverflow(entry.target);
    });
  });

  function getElements(target) {
    if (!target) {
      return [];
    }
    if (typeof target === 'string') {
      return Array.from(document.querySelectorAll(target));
    }
    if (target instanceof Element) {
      return [target];
    }
    if (target instanceof NodeList || Array.isArray(target)) {
      return Array.from(target).filter(Boolean);
    }
    return [];
  }

  function checkOverflow(element) {
    if (!(element instanceof Element)) {
      return;
    }
    const hasOverflow =
      element.scrollHeight - 1 > element.clientHeight ||
      element.scrollWidth - 1 > element.clientWidth;

    if (hasOverflow) {
      element.classList.add('is-overflowing');
      if (!element.dataset.originalTitle && !element.title) {
        const text = element.textContent.trim();
        if (text) {
          element.dataset.originalTitle = text;
          element.title = text;
        }
      }
    } else {
      element.classList.remove('is-overflowing');
      if (element.dataset.originalTitle) {
        element.title = '';
      }
    }
  }

  function observe(target) {
    const elements = getElements(target);
    elements.forEach(element => {
      if (observedElements.has(element)) {
        checkOverflow(element);
        return;
      }
      resizeObserver.observe(element);
      observedElements.set(element, true);
      checkOverflow(element);
    });
  }

  function refresh() {
    observedElements.forEach((_, element) => {
      checkOverflow(element);
    });
  }

  function disconnect(target) {
    const elements = getElements(target);
    if (elements.length) {
      elements.forEach(element => {
        resizeObserver.unobserve(element);
        observedElements.delete(element);
      });
      return;
    }
    resizeObserver.disconnect();
    observedElements.clear();
  }

  global.OverflowMonitor = {
    observe,
    refresh,
    disconnect,
    check: checkOverflow
  };
})(window);
