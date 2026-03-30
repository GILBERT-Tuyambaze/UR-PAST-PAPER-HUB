let runtimeConfig: { API_BASE_URL: string } | null = null;
let configLoading = true;

const defaultConfig = {
  API_BASE_URL: '',
};

export async function loadRuntimeConfig(): Promise<void> {
  try {
    const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    let configUrl: string | null = null;

    if (envApiBaseUrl) {
      configUrl = `${envApiBaseUrl}/api/config`;
    } else if (typeof window !== 'undefined' && isLocalFrontendDevOrigin(window.location.origin)) {
      configUrl = '/api/config';
    }

    if (!configUrl) {
      runtimeConfig = defaultConfig;
      return;
    }

    const response = await fetch(configUrl);
    const contentType = response.headers.get('content-type') || '';

    if (response.ok && contentType.includes('application/json')) {
      runtimeConfig = await response.json();
    }
  } catch {
  } finally {
    configLoading = false;
  }
}

export function getConfig() {
  if (configLoading) {
    return defaultConfig;
  }

  if (runtimeConfig) {
    return runtimeConfig;
  }

  if (import.meta.env.VITE_API_BASE_URL) {
    return {
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    };
  }

  return defaultConfig;
}

function isLocalFrontendDevOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname);
  } catch {
    return false;
  }
}

function isLocalBackendUrl(apiBaseUrl: string): boolean {
  try {
    const url = new URL(apiBaseUrl);
    return (
      ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname) &&
      url.port === '8000'
    );
  } catch {
    return false;
  }
}

function shouldUseLocalProxy(apiBaseUrl: string): boolean {
  if (typeof window === 'undefined') return false;
  if (!isLocalFrontendDevOrigin(window.location.origin)) return false;

  return isLocalBackendUrl(apiBaseUrl);
}

export function getAPIBaseURL(): string {
  const apiBaseUrl = getConfig().API_BASE_URL;

  // In local Vite development, prefer the same-origin `/api` proxy so popup auth
  // and token exchange avoid unnecessary cross-origin browser restrictions.
  if (shouldUseLocalProxy(apiBaseUrl)) {
    return '';
  }

  return apiBaseUrl;
}

export const config = {
  get API_BASE_URL() {
    return getAPIBaseURL();
  },
};
