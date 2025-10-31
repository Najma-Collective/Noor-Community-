const API_ENDPOINT = 'https://api.pexels.com/v1/search';
const DEFAULT_OPTIONS = {
  perPage: 1,
  orientation: 'landscape',
  size: 'large',
};
const SANDBOX_KEY = 'ntFmvz0n4RpCRtHtRVV7HhAcbb4VQLwyEenPsqfIGdvpVvkgagK2dQEd';
let missingKeyWarned = false;

const toCamel = (value) => (typeof value === 'string' ? value.trim() : '');

export const resolvePexelsKey = () => {
  if (typeof window !== 'undefined' && window.__PEXELS_API_KEY__) {
    return String(window.__PEXELS_API_KEY__);
  }

  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="pexels-api-key"]');
    if (meta && meta.content) {
      return meta.content.trim();
    }
  }

  if (typeof process !== 'undefined' && process.env && process.env.PEXELS_API_KEY) {
    return String(process.env.PEXELS_API_KEY);
  }

  return SANDBOX_KEY;
};

const buildSearchParams = (query, options) => {
  const params = new URLSearchParams();
  params.set('query', query);
  params.set('per_page', String(options.perPage ?? DEFAULT_OPTIONS.perPage));
  if (options.orientation) {
    params.set('orientation', options.orientation);
  }
  if (options.size) {
    params.set('size', options.size);
  }
  return params;
};

export const requestFromPexels = async (query, options = {}) => {
  const apiKey = resolvePexelsKey();
  if (!apiKey) {
    if (!missingKeyWarned) {
      console.warn('Pexels API key is not configured.');
      missingKeyWarned = true;
    }
    return null;
  }

  const merged = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const params = buildSearchParams(query, merged);

  try {
    const response = await fetch(`${API_ENDPOINT}?${params.toString()}`, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API responded with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch imagery from Pexels', error);
    return null;
  }
};

export const selectPhoto = (payload, preferredSize) => {
  if (!payload || !Array.isArray(payload.photos) || payload.photos.length === 0) {
    return null;
  }

  const photo = payload.photos[0];
  const src = photo.src || {};
  const sizeKey = toCamel(preferredSize) || 'landscape';
  const url = src[sizeKey] || src.landscape || src.large2x || src.large || src.original || src.medium || '';

  return {
    alt: photo.alt || '',
    photographer: photo.photographer || '',
    url,
  };
};

export const fetchPexelsImage = async (query, options = {}) => {
  const payload = await requestFromPexels(query, options);
  if (!payload) {
    return null;
  }
  return selectPhoto(payload, options.preferredSize || options.orientation || options.size);
};
