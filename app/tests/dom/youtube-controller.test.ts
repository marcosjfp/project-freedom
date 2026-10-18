// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { createSettingsRepository } from '../../features/settings/repository';
import { SCHEMA_KEY, SETTINGS_KEYS } from '../../features/settings/schema';
import { mountYouTubeShield } from '../../features/youtube/controller';
import { MARKERS } from '../../features/youtube/rules';
import { MemoryStorage } from '../helpers/memory-storage';

const active = {
  [SCHEMA_KEY]: 1,
  [SETTINGS_KEYS.enabled]: true,
  [SETTINGS_KEYS.hideHomeRecommendations]: true,
  [SETTINGS_KEYS.hideShortsDiscovery]: true,
  [SETTINGS_KEYS.hideWatchRecommendations]: true,
};
const cleanups: Array<() => void> = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  document.body.innerHTML = '';
});
async function mount(storage = new MemoryStorage(active)) {
  const repository = createSettingsRepository(storage);
  const controller = mountYouTubeShield({
    document,
    url: 'https://www.youtube.com/',
    repository,
  });
  cleanups.push(() => controller.dispose());
  await vi.waitFor(() =>
    expect(repository.getSnapshot().status).not.toBe('loading'),
  );
  return { controller, repository, storage };
}
it('leaves the DOM untouched when all preferences are off', async () => {
  document.body.innerHTML =
    '<div id="untouched" style="display:grid">Original content</div>';
  const before = document.documentElement.outerHTML;
  await mount(new MemoryStorage());
  expect(document.documentElement.outerHTML).toBe(before);
});
it('reacts to saved changes and restores page-owned presentation on master off', async () => {
  document.body.innerHTML =
    '<div style="display:grid" data-other-extension="keep">Page content</div>';
  const original = document.body.innerHTML;
  const { repository } = await mount();
  expect(document.documentElement.hasAttribute(MARKERS.home)).toBe(true);
  expect(
    document.querySelectorAll('#project-freedom-youtube-style'),
  ).toHaveLength(1);
  await repository.setSetting('enabled', false);
  expect(document.querySelector('#project-freedom-youtube-style')).toBeNull();
  expect(
    Object.values(MARKERS).some((name) =>
      document.documentElement.hasAttribute(name),
    ),
  ).toBe(false);
  expect(document.body.innerHTML).toBe(original);
});
it('does not carry home/watch hiding into search, subscriptions, Shorts, or unknown routes', async () => {
  const { controller } = await mount();
  for (const route of ['results', 'feed/subscriptions', 'shorts/chosen']) {
    controller.setUrl(`https://www.youtube.com/${route}`);
    expect(document.documentElement.hasAttribute(MARKERS.home)).toBe(false);
    expect(document.documentElement.hasAttribute(MARKERS.watch)).toBe(false);
    expect(document.documentElement.hasAttribute(MARKERS.shorts)).toBe(true);
  }
  controller.setUrl('https://www.youtube.com/@chosen');
  expect(document.querySelector('#project-freedom-youtube-style')).toBeNull();
  controller.setUrl('https://www.youtube.com/watch?v=chosen');
  expect(document.documentElement.hasAttribute(MARKERS.watch)).toBe(true);
});
it('removes effects immediately for unsupported saved formats', async () => {
  const { storage } = await mount();
  await storage.set({ [SCHEMA_KEY]: 2 });
  expect(document.querySelector('#project-freedom-youtube-style')).toBeNull();
  expect(
    Object.values(MARKERS).some((name) =>
      document.documentElement.hasAttribute(name),
    ),
  ).toBe(false);
});
it('fails open on initial storage errors', async () => {
  const storage = new MemoryStorage(active);
  storage.get.mockRejectedValueOnce(new Error('unavailable'));
  await mount(storage);
  expect(document.querySelector('#project-freedom-youtube-style')).toBeNull();
});
it('replaces an existing controller without leaving styles or listeners behind', async () => {
  const first = await mount();
  const second = await mount();
  expect(first.storage.listeners.size).toBe(0);
  expect(second.storage.listeners.size).toBe(1);
  expect(
    document.querySelectorAll('#project-freedom-youtube-style'),
  ).toHaveLength(1);
  first.controller.dispose();
  expect(
    document.querySelectorAll('#project-freedom-youtube-style'),
  ).toHaveLength(1);
  second.controller.dispose();
  expect(second.storage.listeners.size).toBe(0);
  expect(document.querySelector('#project-freedom-youtube-style')).toBeNull();
});
