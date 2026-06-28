import { createClient, type Base44Client } from '@base44/sdk';
import { getAppParams } from '@/lib/app-params';

const DEFAULT_APP_BASE_URL = process.env.NEXT_PUBLIC_BASE44_APP_BASE_URL ?? 'https://sorelia.base44.app';
const DEFAULT_APP_ID = process.env.NEXT_PUBLIC_BASE44_APP_ID ?? '6a3f193173edbc16833522f4';

function buildClient(): Base44Client {
  const params = getAppParams();

  return createClient({
    appId: params.appId || DEFAULT_APP_ID,
    token: params.token ?? undefined,
    functionsVersion: params.functionsVersion ?? undefined,
    serverUrl: '',
    requiresAuth: false,
    appBaseUrl: params.appBaseUrl || DEFAULT_APP_BASE_URL,
  });
}

let client = buildClient();

export function refreshBase44Client(): Base44Client {
  client = buildClient();
  return client;
}

export const base44 = new Proxy({} as Base44Client, {
  get(_target, prop) {
    return Reflect.get(client, prop);
  },
});
