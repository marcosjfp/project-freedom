import { expect, test } from '@playwright/test';
import { OWNED_KEYS, SCHEMA_KEY } from '../../features/settings/schema';
import {
  choose,
  fixtureRoute,
  launchQualification,
  youtubeFixture,
} from './helpers/extension';

declare const chrome: typeof import('wxt/browser').browser;

test('production controls stay local during online and offline fixture use', async ({
  browserName,
}, testInfo) => {
  expect(browserName).toBe('chromium');
  const { context, id, close } = await launchQualification();
  const unexpected: string[] = [],
    sockets: string[] = [];
  const requests: Array<{
    url: string;
    type: string;
    initiator: string;
    extensionStack: boolean;
  }> = [];
  const errors: string[] = [];
  context.on('page', (page) => {
    page.on('websocket', (socket) => sockets.push(socket.url()));
    page.on('pageerror', (error) => errors.push(error.message));
  });
  await context.route(/^https?:\/\//, (route) => {
    if (
      route.request().isNavigationRequest() &&
      route.request().url().startsWith('https://www.youtube.com/')
    )
      return route.fulfill({ contentType: 'text/html', body: youtubeFixture });
    unexpected.push(route.request().url());
    return route.abort();
  });
  try {
    const popup = await context.newPage();
    const options = await context.newPage();
    const page = await context.newPage();
    for (const target of [popup, options, page]) {
      const cdp = await context.newCDPSession(target);
      await cdp.send('Network.enable');
      cdp.on('Network.requestWillBeSent', (event) => {
        if (!/^https?:/.test(event.request.url)) return;
        requests.push({
          url: event.request.url,
          type: event.type ?? 'Unknown',
          initiator: event.initiator.type,
          extensionStack: Boolean(
            event.initiator.stack?.callFrames.some((frame) =>
              frame.url.startsWith(`chrome-extension://${id}/`),
            ),
          ),
        });
      });
    }
    await popup.goto(`chrome-extension://${id}/popup.html`);
    await options.goto(`chrome-extension://${id}/options.html`);
    await expect(popup.getByRole('checkbox').first()).toBeEnabled();
    expect(await popup.evaluate(() => chrome.storage.local.get(null))).toEqual(
      {},
    );
    await page.goto('https://www.youtube.com/');
    for (const name of [
      'Hide home recommendations',
      'Hide Shorts discovery',
      'Hide watch recommendations',
      'Enable selected controls',
    ])
      await choose(popup, name, true);
    await expect(page.getByTestId('home-card')).toBeHidden();
    await fixtureRoute(page, '/results?search_query=synthetic', 'search');
    await expect(page.getByTestId('search-shorts')).toBeHidden();
    await fixtureRoute(page, '/watch?v=synthetic&list=synthetic', 'watch');
    await expect(page.getByTestId('watch-card')).toBeHidden();
    const saved = await popup.evaluate(() => chrome.storage.local.get(null));
    expect(Object.keys(saved).sort()).toEqual([...OWNED_KEYS].sort());
    expect(saved[SCHEMA_KEY]).toBe(1);
    expect(
      Object.entries(saved)
        .filter(([key]) => key !== SCHEMA_KEY)
        .every(([, value]) => value === true),
    ).toBe(true);
    expect(await popup.evaluate(() => chrome.storage.sync.get(null))).toEqual(
      {},
    );
    expect(
      await popup.evaluate(() => chrome.storage.session.get(null)),
    ).toEqual({});
    expect(await popup.evaluate(() => localStorage.length)).toBe(0);
    expect(await popup.evaluate(() => indexedDB.databases())).toEqual([]);
    await context.setOffline(true);
    const start = performance.now();
    await choose(options, 'Enable selected controls', false);
    await expect(page.getByTestId('watch-card')).toBeVisible({ timeout: 1000 });
    const masterOffUpperBoundMs = performance.now() - start;
    expect(masterOffUpperBoundMs).toBeLessThan(1000);
    await choose(options, 'Enable selected controls', true);
    await expect(page.getByTestId('watch-card')).toBeHidden();
    await options.getByRole('button', { name: 'Reset preferences' }).click();
    await options.getByRole('button', { name: 'Confirm reset' }).click();
    await expect(page.getByTestId('watch-card')).toBeVisible();
    expect(await popup.evaluate(() => chrome.storage.local.get(null))).toEqual(
      {},
    );
    expect(context.serviceWorkers()).toHaveLength(0);
    expect(unexpected).toEqual([]);
    expect(sockets).toEqual([]);
    expect(errors).toEqual([]);
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      url: 'https://www.youtube.com/',
      type: 'Document',
      extensionStack: false,
    });
    await testInfo.attach('privacy-summary', {
      body: JSON.stringify(
        {
          requests,
          unexpected,
          sockets,
          storageKeysBeforeReset: Object.keys(saved).sort(),
          localAfterReset: {},
          sync: {},
          session: {},
          extensionLocalStorage: 0,
          extensionIndexedDB: [],
          masterOffUpperBoundMs,
          offlineControls: 'passed',
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });
  } finally {
    await close();
  }
});
