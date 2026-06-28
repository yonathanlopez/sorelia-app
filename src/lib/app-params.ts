const isBrowser = typeof window !== 'undefined';

const ENV_APP_ID = process.env.NEXT_PUBLIC_BASE44_APP_ID ?? '6a3f193173edbc16833522f4';
const ENV_APP_BASE_URL = process.env.NEXT_PUBLIC_BASE44_APP_BASE_URL ?? 'https://sorelia.base44.app';
const ENV_FUNCTIONS_VERSION = process.env.NEXT_PUBLIC_BASE44_FUNCTIONS_VERSION;

const toSnakeCase = (str: string) => str.replace(/([A-Z])/g, '_$1').toLowerCase();

const getAppParamValue = (
  paramName: string,
  { defaultValue = undefined, removeFromUrl = false }: { defaultValue?: string; removeFromUrl?: boolean } = {},
) => {
  if (!isBrowser) {
    return defaultValue ?? null;
  }

  const storage = window.localStorage;
  const storageKey = `base44_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }

  if (searchParam) {
    storage.setItem(storageKey, searchParam);
    return searchParam;
  }

  const storedValue = storage.getItem(storageKey);
  if (storedValue) {
    return storedValue;
  }

  if (defaultValue) {
    storage.setItem(storageKey, defaultValue);
    return defaultValue;
  }

  return null;
};

export function getStoredAccessToken(): string | null {
  if (!isBrowser) return null;
  return (
    window.localStorage.getItem('base44_access_token') ||
    window.localStorage.getItem('token')
  );
}

export function getAppParams() {
  if (isBrowser && getAppParamValue('clear_access_token') === 'true') {
    window.localStorage.removeItem('base44_access_token');
    window.localStorage.removeItem('token');
  }

  const token =
    getAppParamValue('access_token', { removeFromUrl: true }) || getStoredAccessToken();

  return {
    appId: getAppParamValue('app_id', { defaultValue: ENV_APP_ID }) || ENV_APP_ID,
    token,
    fromUrl: getAppParamValue('from_url', { defaultValue: isBrowser ? window.location.href : '' }),
    functionsVersion:
      getAppParamValue('functions_version', { defaultValue: ENV_FUNCTIONS_VERSION }) ||
      ENV_FUNCTIONS_VERSION ||
      null,
    appBaseUrl:
      getAppParamValue('app_base_url', { defaultValue: ENV_APP_BASE_URL }) || ENV_APP_BASE_URL,
  };
}

export const appParams = getAppParams();

export function getPostAuthRedirectUrl(path = '/'): string {
  if (!isBrowser) return path;
  return new URL(path, window.location.origin).toString();
}
