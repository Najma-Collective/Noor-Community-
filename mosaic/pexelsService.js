(function (global) {
  const API_ENDPOINT = 'https://api.pexels.com/v1/search';
  const DEFAULT_OPTIONS = {
    orientation: 'landscape',
    perPage: 1,
    size: 'large'
  };
  const cache = new Map();
  let missingKeyWarned = false;

  function resolveApiKey() {
    if (global.__PEXELS_API_KEY__) {
      return global.__PEXELS_API_KEY__;
    }

    if (typeof process !== 'undefined' && process.env && process.env.PEXELS_API_KEY) {
      return process.env.PEXELS_API_KEY;
    }

    const meta = document.querySelector('meta[name="pexels-api-key"]');
    if (meta && meta.content) {
      return meta.content;
    }

    return null;
  }

  async function performRequest(query, options = {}) {
    const apiKey = resolveApiKey();
    if (!apiKey) {
      if (!missingKeyWarned) {
        console.warn('Pexels API key is not configured. Provide PEXELS_API_KEY at build time.');
        missingKeyWarned = true;
      }
      return null;
    }

    const requestOptions = { ...DEFAULT_OPTIONS, ...options };
    const searchParams = new URLSearchParams({
      query,
      per_page: String(requestOptions.perPage)
    });

    if (requestOptions.orientation) {
      searchParams.set('orientation', requestOptions.orientation);
    }
    if (requestOptions.size) {
      searchParams.set('size', requestOptions.size);
    }

    const cacheKey = `${query}__${JSON.stringify(requestOptions)}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${API_ENDPOINT}?${searchParams.toString()}`, {
        headers: {
          Authorization: apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Pexels API responded with status ${response.status}`);
      }

      const payload = await response.json();
      cache.set(cacheKey, payload);
      return payload;
    } catch (error) {
      console.warn('Unable to retrieve images from Pexels', error);
      return null;
    }
  }

  function selectImageFromResponse(payload, preferredSize = 'landscape') {
    if (!payload || !Array.isArray(payload.photos) || !payload.photos.length) {
      return null;
    }
    const photo = payload.photos[0];
    const source = photo.src || {};
    return {
      alt: photo.alt || '',
      photographer: photo.photographer,
      url:
        source[preferredSize] ||
        source.large2x ||
        source.large ||
        source.original ||
        source.medium
    };
  }

  async function fetchImage(query, options = {}) {
    const payload = await performRequest(query, options);
    if (!payload) {
      return null;
    }
    return selectImageFromResponse(payload, options.preferredSize || options.orientation || 'landscape');
  }

  async function fetchImages(queries, options = {}) {
    if (!Array.isArray(queries)) {
      return [];
    }
    const results = await Promise.all(
      queries.map(query => fetchImage(query, options))
    );
    return results.filter(Boolean);
  }

  global.PexelsService = {
    fetchImage,
    fetchImages,
    resolveApiKey,
    _performRequest: performRequest
  };
})(window);
