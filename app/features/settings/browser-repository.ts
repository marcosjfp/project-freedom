import { browser } from 'wxt/browser';
import { createSettingsRepository, type SettingsStorage } from './repository';

export const browserStorage: SettingsStorage = {
  get: (keys) => browser.storage.local.get(keys),
  set: (values) => browser.storage.local.set(values),
  remove: (keys) => browser.storage.local.remove(keys),
  subscribe(listener) {
    const onChanged = (
      changes: Parameters<typeof listener>[0],
      area: string,
    ) => {
      if (area === 'local') listener(changes);
    };
    browser.storage.onChanged.addListener(onChanged);
    return () => browser.storage.onChanged.removeListener(onChanged);
  },
};
export const settingsRepository = createSettingsRepository(browserStorage);
