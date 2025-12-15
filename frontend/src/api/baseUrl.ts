const STORAGE_KEY = 'todo.apiBaseUrl';

export function isTauriRuntime() {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function normalizeApiBaseUrl(input: string) {
  const raw = input.trim();
  if (!raw) return '';

  // Allow same-origin relative API base (web deployment where backend serves the frontend).
  if (raw.startsWith('/')) return trimTrailingSlash(raw);

  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw) ? raw : `http://${raw}`;
  const normalized = trimTrailingSlash(withScheme);

  // If the user provides a server root, append /api.
  if (normalized.endsWith('/api')) return normalized;
  return `${normalized}/api`;
}

export function getStoredApiBaseUrl() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredApiBaseUrl(value: string) {
  const normalized = normalizeApiBaseUrl(value);
  try {
    if (!normalized) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // ignore
  }
}

function joinUrl(base: string, path: string) {
  const normalizedBase = trimTrailingSlash(base);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function getApiBaseUrl() {
  const stored = getStoredApiBaseUrl();
  if (stored) return stored;

  const env = import.meta.env.VITE_API_BASE_URL;
  if (env) return normalizeApiBaseUrl(env) || env;

  if (import.meta.env.DEV) return 'http://localhost:3000/api';

  // In Tauri production builds, same-origin '/api' won't exist, so provide a usable default.
  if (isTauriRuntime()) return 'http://127.0.0.1:3000/api';

  return '/api';
}

export function apiUrl(path: string) {
  return joinUrl(getApiBaseUrl(), path);
}
