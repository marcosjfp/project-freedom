import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSettingsRepository } from '../../features/settings/repository';
import {
  DEFAULT_SETTINGS,
  decodeSettings,
  effectiveSettings,
  OWNED_KEYS,
  SCHEMA_KEY,
  SETTINGS_KEYS,
  type StoredValues,
} from '../../features/settings/schema';
import { deferred, MemoryStorage } from '../helpers/memory-storage';

const stops: Array<() => void> = [];
afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
});
async function start(storage: MemoryStorage) {
  const repository = createSettingsRepository(storage);
  stops.push(repository.subscribe(() => {}));
  await vi.waitFor(() =>
    expect(repository.getSnapshot().status).not.toBe('loading'),
  );
  return repository;
}

describe('saved preferences and recovery', () => {
  it('starts off without creating stored data just by opening the UI', async () => {
    const storage = new MemoryStorage();
    const repository = await start(storage);
    expect(repository.getSnapshot().settings).toEqual(DEFAULT_SETTINGS);
    expect(storage.set).not.toHaveBeenCalled();
    expect(storage.data).toEqual({});
  });
  it('retains valid choices and rejects truthy malformed fields', () => {
    const decoded = decodeSettings({
      [SCHEMA_KEY]: 1,
      [SETTINGS_KEYS.enabled]: true,
      [SETTINGS_KEYS.hideHomeRecommendations]: 'true',
      [SETTINGS_KEYS.hideShortsDiscovery]: true,
      [SETTINGS_KEYS.hideWatchRecommendations]: 1,
    });
    expect(decoded.settings).toEqual({
      ...DEFAULT_SETTINGS,
      enabled: true,
      hideShortsDiscovery: true,
    });
  });
  it.each([2, 99, '1', null, false])(
    'preserves unsupported schema %s and applies nothing',
    async (version) => {
      const storage = new MemoryStorage({
        [SCHEMA_KEY]: version,
        [SETTINGS_KEYS.enabled]: true,
      });
      const before = { ...storage.data };
      const repository = await start(storage);
      expect(repository.getSnapshot().status).toBe('unsupported');
      expect(repository.getSnapshot().settings).toEqual(DEFAULT_SETTINGS);
      expect(await repository.setSetting('enabled', true)).toBe(false);
      expect(storage.data).toEqual(before);
      expect(storage.set).not.toHaveBeenCalled();
    },
  );
  it('fails open for orphaned preferences without a schema', () => {
    expect(decodeSettings({ [SETTINGS_KEYS.enabled]: true }).supported).toBe(
      false,
    );
  });
  it('turns the master off without discarding individual choices', async () => {
    const storage = new MemoryStorage({ [SCHEMA_KEY]: 1 });
    const repository = await start(storage);
    await repository.setSetting('hideShortsDiscovery', true);
    await repository.setSetting('enabled', true);
    await repository.setSetting('enabled', false);
    expect(repository.getSnapshot().settings.hideShortsDiscovery).toBe(true);
    expect(effectiveSettings(repository.getSnapshot().settings)).toEqual(
      DEFAULT_SETTINGS,
    );
  });
  it('preserves concurrent different-key edits from two views', async () => {
    const storage = new MemoryStorage();
    const first = await start(storage);
    const second = await start(storage);
    await Promise.all([
      first.setSetting('hideHomeRecommendations', true),
      second.setSetting('hideShortsDiscovery', true),
    ]);
    expect(first.getSnapshot().settings).toEqual({
      ...DEFAULT_SETTINGS,
      hideHomeRecommendations: true,
      hideShortsDiscovery: true,
    });
    expect(second.getSnapshot().settings).toEqual(first.getSnapshot().settings);
    for (const [values] of storage.set.mock.calls) {
      expect(
        Object.keys(values).filter((key) => key !== SCHEMA_KEY),
      ).toHaveLength(1);
    }
  });
  it('converges on the last persisted same-key change', async () => {
    const storage = new MemoryStorage({ [SCHEMA_KEY]: 1 });
    const first = await start(storage);
    const second = await start(storage);
    await first.setSetting('enabled', true);
    await second.setSetting('enabled', false);
    expect(first.getSnapshot().settings.enabled).toBe(false);
    expect(second.getSnapshot().settings.enabled).toBe(false);
  });
  it('rechecks the schema immediately before writing', async () => {
    const storage = new MemoryStorage();
    const repository = await start(storage);
    storage.data = { [SCHEMA_KEY]: 2, [SETTINGS_KEYS.enabled]: true };
    expect(await repository.setSetting('enabled', true)).toBe(false);
    expect(storage.set).not.toHaveBeenCalled();
    expect(repository.getSnapshot().status).toBe('unsupported');
  });
  it('keeps the last saved choice and reports a rejected write', async () => {
    const storage = new MemoryStorage({ [SCHEMA_KEY]: 1 });
    const repository = await start(storage);
    storage.set.mockRejectedValueOnce(new Error('write failed'));
    expect(await repository.setSetting('enabled', true)).toBe(false);
    expect(repository.getSnapshot().settings.enabled).toBe(false);
    expect(repository.getSnapshot().error).toMatch(/Could not complete/);
    expect(repository.getSnapshot().notice).toBeNull();
  });
  it('recovers from a failed initial read without writing', async () => {
    const storage = new MemoryStorage({
      [SCHEMA_KEY]: 1,
      [SETTINGS_KEYS.enabled]: true,
    });
    storage.get.mockRejectedValueOnce(new Error('read failed'));
    const repository = await start(storage);
    expect(repository.getSnapshot().status).toBe('error');
    expect(repository.getSnapshot().settings).toEqual(DEFAULT_SETTINGS);
    await repository.retry();
    expect(repository.getSnapshot().settings.enabled).toBe(true);
    expect(repository.getSnapshot().error).toBeNull();
    expect(storage.set).not.toHaveBeenCalled();
  });
  it('disables master before resetting only owned keys, including newer schemas', async () => {
    const storage = new MemoryStorage({
      [SCHEMA_KEY]: 2,
      [SETTINGS_KEYS.enabled]: true,
      unrelated: 'keep',
    });
    const repository = await start(storage);
    expect(await repository.reset()).toBe(true);
    expect(storage.operations).toEqual([
      { kind: 'set', values: { [SETTINGS_KEYS.enabled]: false } },
      { kind: 'remove', values: OWNED_KEYS },
    ]);
    expect(storage.data).toEqual({ unrelated: 'keep' });
    expect(repository.getSnapshot().settings).toEqual(DEFAULT_SETTINGS);
    expect(repository.getSnapshot().status).toBe('ready');
  });
  it('reports a partial reset without claiming success', async () => {
    const storage = new MemoryStorage({
      [SCHEMA_KEY]: 1,
      [SETTINGS_KEYS.enabled]: true,
      [SETTINGS_KEYS.hideShortsDiscovery]: true,
    });
    const repository = await start(storage);
    storage.remove.mockRejectedValueOnce(new Error('remove failed'));
    expect(await repository.reset()).toBe(false);
    expect(repository.getSnapshot().settings).toEqual({
      ...DEFAULT_SETTINGS,
      hideShortsDiscovery: true,
    });
    expect(repository.getSnapshot().notice).toBeNull();
    expect(repository.getSnapshot().error).not.toBeNull();
  });
});

describe('subscription ordering and lifetime', () => {
  it('keeps changes arriving during a delayed initial read', async () => {
    const storage = new MemoryStorage();
    const pending = deferred<StoredValues>();
    storage.get.mockImplementationOnce(() => pending.promise);
    const repository = createSettingsRepository(storage);
    stops.push(repository.subscribe(() => {}));
    expect(storage.listeners.size).toBe(1);
    await storage.set({ [SCHEMA_KEY]: 1, [SETTINGS_KEYS.enabled]: true });
    pending.resolve({});
    await vi.waitFor(() =>
      expect(repository.getSnapshot().settings.enabled).toBe(true),
    );
  });
  it('does not resurrect deleted preferences from a stale read', async () => {
    const old = { [SCHEMA_KEY]: 1, [SETTINGS_KEYS.enabled]: true };
    const storage = new MemoryStorage(old);
    const pending = deferred<StoredValues>();
    storage.get.mockImplementationOnce(() => pending.promise);
    const repository = createSettingsRepository(storage);
    stops.push(repository.subscribe(() => {}));
    await storage.remove(OWNED_KEYS);
    pending.resolve(old);
    await vi.waitFor(() =>
      expect(repository.getSnapshot().status).toBe('ready'),
    );
    expect(repository.getSnapshot().settings).toEqual(DEFAULT_SETTINGS);
  });
  it('ignores abandoned reads on Strict Mode-style resubscription and cleans up', async () => {
    const storage = new MemoryStorage({
      [SCHEMA_KEY]: 1,
      [SETTINGS_KEYS.enabled]: true,
    });
    const pending = deferred<StoredValues>();
    storage.get.mockImplementationOnce(() => pending.promise);
    const repository = createSettingsRepository(storage);
    const firstStop = repository.subscribe(() => {});
    firstStop();
    expect(storage.listeners.size).toBe(0);
    const secondStop = repository.subscribe(() => {});
    await vi.waitFor(() =>
      expect(repository.getSnapshot().settings.enabled).toBe(true),
    );
    pending.resolve({});
    await pending.promise;
    expect(repository.getSnapshot().settings.enabled).toBe(true);
    expect(storage.listeners.size).toBe(1);
    secondStop();
    expect(storage.listeners.size).toBe(0);
  });
});
