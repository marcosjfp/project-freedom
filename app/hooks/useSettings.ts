import { useSyncExternalStore } from 'react';
import { settingsRepository } from '../features/settings/browser-repository';
import type { SettingsRepository } from '../features/settings/repository';

export function useSettings(
  repository: SettingsRepository = settingsRepository,
) {
  const snapshot = useSyncExternalStore(
    repository.subscribe,
    repository.getSnapshot,
  );
  return { ...snapshot, repository };
}
