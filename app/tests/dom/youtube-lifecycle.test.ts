// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { ContentScriptContext } from 'wxt/utils/content-script-context';
import definition from '../../entrypoints/youtube.content';
import { SCHEMA_KEY, SETTINGS_KEYS } from '../../features/settings/schema';

const contexts: ContentScriptContext[] = [];
afterEach(() => {
  contexts.splice(0).forEach((ctx) => ctx.notifyInvalidated());
  fakeBrowser.reset();
  vi.unstubAllGlobals();
});
it('cleans the real entrypoint on WXT invalidation and repeated initialization', async () => {
  vi.stubGlobal('location', new URL('https://www.youtube.com/'));
  await browser.storage.local.set({
    [SCHEMA_KEY]: 1,
    [SETTINGS_KEYS.enabled]: true,
    [SETTINGS_KEYS.hideHomeRecommendations]: true,
  });
  const first = new ContentScriptContext('youtube');
  contexts.push(first);
  await definition.main(first);
  await vi.waitFor(() =>
    expect(
      document.querySelectorAll('#project-freedom-youtube-style'),
    ).toHaveLength(1),
  );
  const second = new ContentScriptContext('youtube');
  contexts.push(second);
  await definition.main(second);
  expect(first.isInvalid).toBe(true);
  await vi.waitFor(() =>
    expect(
      document.querySelectorAll('#project-freedom-youtube-style'),
    ).toHaveLength(1),
  );
  second.notifyInvalidated();
  expect(document.querySelector('#project-freedom-youtube-style')).toBeNull();
  await browser.storage.local.set({ [SETTINGS_KEYS.enabled]: true });
  expect(document.querySelector('#project-freedom-youtube-style')).toBeNull();
});
