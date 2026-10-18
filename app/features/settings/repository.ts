import {
  decodeSettings,
  DEFAULT_SETTINGS,
  OWNED_KEYS,
  SCHEMA_KEY,
  SCHEMA_VERSION,
  SETTINGS_KEYS,
  type Setting,
  type Settings,
  type StoredValues,
} from './schema';

export type StorageChanges = Record<string, { newValue?: unknown }>;
export interface SettingsStorage {
  get(keys: string[]): Promise<StoredValues>;
  set(values: StoredValues): Promise<void>;
  remove(keys: string[]): Promise<void>;
  subscribe(listener: (changes: StorageChanges) => void): () => void;
}
export interface SettingsSnapshot {
  readonly status: 'loading' | 'ready' | 'unsupported' | 'error';
  readonly settings: Settings;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
}
const REMOVED = Symbol('removed');

export function createSettingsRepository(storage: SettingsStorage) {
  let snapshot: SettingsSnapshot = {
    status: 'loading',
    settings: DEFAULT_SETTINGS,
    busy: false,
    error: null,
    notice: null,
  };
  let raw: StoredValues = {};
  let initialized = false;
  let epoch = 0;
  let readId = 0;
  let unwatch: (() => void) | undefined;
  let overlay: Map<string, unknown> | undefined;
  const listeners = new Set<() => void>();

  function publish(patch: Partial<SettingsSnapshot>) {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  }
  function reconcile() {
    const { supported, settings } = decodeSettings(raw);
    publish({ status: supported ? 'ready' : 'unsupported', settings });
  }
  function apply(target: StoredValues, key: string, value: unknown) {
    if (value === REMOVED) delete target[key];
    else target[key] = value;
  }
  function onChange(changes: StorageChanges) {
    let relevant = false;
    for (const key of OWNED_KEYS) {
      const change = changes[key];
      if (!change) continue;
      relevant = true;
      const value = Object.hasOwn(change, 'newValue')
        ? change.newValue
        : REMOVED;
      apply(raw, key, value);
      overlay?.set(key, value);
    }
    if (relevant && initialized) reconcile();
  }
  async function read(): Promise<boolean> {
    const currentEpoch = epoch;
    const currentRead = ++readId;
    const changesDuringRead = new Map<string, unknown>();
    overlay = changesDuringRead;
    try {
      const values = await storage.get(OWNED_KEYS);
      if (currentEpoch !== epoch || currentRead !== readId) return false;
      raw = { ...values };
      // Notifications received during a slow read are newer than its snapshot.
      changesDuringRead.forEach((value, key) => apply(raw, key, value));
      initialized = true;
      overlay = undefined;
      reconcile();
      return true;
    } catch {
      if (currentEpoch !== epoch || currentRead !== readId) return false;
      initialized = false;
      overlay = undefined;
      publish({
        status: 'error',
        settings: DEFAULT_SETTINGS,
        error:
          'Could not read preferences. Controls are paused. Try loading again.',
      });
      return false;
    }
  }
  function watch() {
    try {
      unwatch = storage.subscribe(onChange);
      void read();
    } catch {
      publish({
        status: 'error',
        settings: DEFAULT_SETTINGS,
        error: 'Could not watch preferences. Try loading again.',
      });
    }
  }
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    if (listeners.size === 1) {
      epoch += 1;
      initialized = false;
      publish({ status: 'loading', busy: false, error: null, notice: null });
      // Register before the initial read to avoid missing concurrent edits.
      watch();
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        epoch += 1;
        readId += 1;
        overlay = undefined;
        unwatch?.();
        unwatch = undefined;
      }
    };
  };
  async function mutate(action: () => Promise<void>, success: string) {
    if (snapshot.busy || listeners.size === 0) return false;
    const currentEpoch = epoch;
    publish({ busy: true, error: null, notice: null });
    try {
      await action();
      if (currentEpoch !== epoch) return false;
      const refreshed = await read();
      if (refreshed) publish({ notice: success });
      return refreshed;
    } catch {
      if (currentEpoch === epoch) {
        // Read back persisted state, including a partially completed reset.
        const refreshed = await read();
        if (currentEpoch === epoch && refreshed) {
          publish({
            error:
              'Could not complete this change. The controls show the saved preferences. Try again.',
          });
        }
      }
      return false;
    } finally {
      if (currentEpoch === epoch) publish({ busy: false });
    }
  }
  return {
    subscribe,
    getSnapshot: () => snapshot,
    retry: async () => {
      if (snapshot.busy || listeners.size === 0) return;
      initialized = false;
      publish({ status: 'loading', error: null, notice: null });
      if (unwatch) await read();
      else watch();
    },
    setSetting: async (setting: Setting, value: boolean) => {
      if (
        snapshot.status !== 'ready' ||
        !Object.hasOwn(SETTINGS_KEYS, setting) ||
        typeof value !== 'boolean'
      )
        return false;
      return mutate(async () => {
        const fresh = await storage.get(OWNED_KEYS);
        if (
          !decodeSettings(fresh).supported ||
          !decodeSettings(raw).supported
        ) {
          throw new Error('Unsupported saved schema');
        }
        await storage.set({
          ...(fresh[SCHEMA_KEY] === undefined
            ? { [SCHEMA_KEY]: SCHEMA_VERSION }
            : {}),
          [SETTINGS_KEYS[setting]]: value,
        });
      }, 'Saved in this browser.');
    },
    reset: async () => {
      if (snapshot.status !== 'ready' && snapshot.status !== 'unsupported')
        return false;
      return mutate(async () => {
        await storage.set({ [SETTINGS_KEYS.enabled]: false });
        await storage.remove(OWNED_KEYS);
      }, 'Preferences reset. All controls are off.');
    },
  };
}
export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
