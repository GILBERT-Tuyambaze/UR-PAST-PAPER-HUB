export interface RuntimeConfig {
  API_BASE_URL: string;
}

let runtimeConfig: RuntimeConfig | null = null;
let configLoading = true;

const defaultConfig: RuntimeConfig = {
  API_BASE_URL: '',
};

const CONFIG_TIMEOUT_MS = 2500;
const CONFIG_TIMEOUT_REASON = 'runtime-config-timeout';

export function getDefaultConfig(): RuntimeConfig {
  if (import.meta.env.VITE_API_BASE_URL) {
    return {
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    };
  }

  return defaultConfig;
}

export function applyRuntimeConfig(config: RuntimeConfig) {
  runtimeConfig = config;
  configLoading = false;
}

export function markRuntimeConfigResolved() {
  configLoading = false;
}

export async function loadRuntimeConfig(timeoutMs = CONFIG_TIMEOUT_MS): Promise<RuntimeConfig> {
  try {
    const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    let configUrl: string | null = null;

    if (envApiBaseUrl) {
      configUrl = `${envApiBaseUrl}/api/config`;
    } else if (typeof window !== 'undefined' && isLocalFrontendDevOrigin(window.location.origin)) {
      configUrl = '/api/config';
    }

    if (!configUrl) {
      const fallback = getDefaultConfig();
      applyRuntimeConfig(fallback);
      return fallback;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(CONFIG_TIMEOUT_REASON), timeoutMs);
    const response = await fetch(configUrl, {
      signal: controller.signal,
    });
    window.clearTimeout(timeout);
    const contentType = response.headers.get('content-type') || '';

    if (response.ok && contentType.includes('application/json')) {
      const loadedConfig = (await response.json()) as RuntimeConfig;
      applyRuntimeConfig(loadedConfig);
      return loadedConfig;
    }
    console.warn('Runtime config endpoint returned a non-JSON or non-OK response, using fallback config');
    const fallback = getDefaultConfig();
    applyRuntimeConfig(fallback);
    return fallback;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn(
        `Runtime config request timed out after ${timeoutMs}ms, using fallback config`
      );
    } else {
      console.warn('Runtime config request failed, using fallback config:', error);
    }
    const fallback = getDefaultConfig();
    applyRuntimeConfig(fallback);
    return fallback;
  } finally {
    markRuntimeConfigResolved();
  }
}

export function getConfig() {
  if (configLoading) {
    return getDefaultConfig();
  }

  if (runtimeConfig) {
    return runtimeConfig;
  }

  return getDefaultConfig();
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
