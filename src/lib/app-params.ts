const isBrowser = typeof window !== 'undefined';

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

  if (defaultValue) {
    storage.setItem(storageKey, defaultValue);
    return defaultValue;
  }

  const storedValue = storage.getItem(storageKey);
  if (storedValue) {
    return storedValue;
  }

  return null;
};

const getAppParams = () => {
  if (isBrowser && getAppParamValue('clear_access_token') === 'true') {
    window.localStorage.removeItem('base44_access_token');
    window.localStorage.removeItem('token');
  }

  return {
    appId: getAppParamValue('app_id', { defaultValue: process.env.NEXT_PUBLIC_BASE44_APP_ID }) ?? '',
    token: getAppParamValue('access_token', { removeFromUrl: true }),
    fromUrl: getAppParamValue('from_url', { defaultValue: isBrowser ? window.location.href : '' }),
    functionsVersion: getAppParamValue('functions_version', {
      defaultValue: process.env.NEXT_PUBLIC_BASE44_FUNCTIONS_VERSION,
    }),
    appBaseUrl: getAppParamValue('app_base_url', {
      defaultValue: process.env.NEXT_PUBLIC_BASE44_APP_BASE_URL,
    }) ?? '',
  };
};

export const appParams = getAppParams();
