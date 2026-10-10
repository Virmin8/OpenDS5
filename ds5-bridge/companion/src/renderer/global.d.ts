import type { AppInfoApi, BridgeApi, SetupApi, UpdateApi, VdsApi } from '../preload';

declare global {
  interface Window {
    bridge: BridgeApi;
    setup: SetupApi;
    update: UpdateApi;
    appInfo: AppInfoApi;
    vds: VdsApi;
  }
}

export {};
