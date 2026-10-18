import { vi } from 'vitest';
import type {
  SettingsStorage,
  StorageChanges,
} from '../../features/settings/repository';
import type { StoredValues } from '../../features/settings/schema';

export class MemoryStorage implements SettingsStorage {
  data: StoredValues;
  readonly listeners = new Set<(changes: StorageChanges) => void>();
  readonly operations: Array<{ kind: string; values: unknown }> = [];
  constructor(initial: StoredValues = {}) {
    this.data = { ...initial };
  }
  get = vi.fn(async (keys: string[]) =>
    Object.fromEntries(
      keys
        .filter((key) => Object.hasOwn(this.data, key))
        .map((key) => [key, this.data[key]]),
    ),
  );
  set = vi.fn(async (values: StoredValues) => {
    this.operations.push({ kind: 'set', values });
    Object.assign(this.data, values);
    this.emit(
      Object.fromEntries(
        Object.entries(values).map(([key, newValue]) => [key, { newValue }]),
      ),
    );
  });
  remove = vi.fn(async (keys: string[]) => {
    this.operations.push({ kind: 'remove', values: keys });
    keys.forEach((key) => delete this.data[key]);
    this.emit(Object.fromEntries(keys.map((key) => [key, {}])));
  });
  subscribe = (listener: (changes: StorageChanges) => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  emit(changes: StorageChanges) {
    this.listeners.forEach((listener) => listener(changes));
  }
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
