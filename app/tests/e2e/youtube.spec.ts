import { chromium, expect, test, type Page } from '@playwright/test';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SCHEMA_KEY } from '../../features/settings/schema';

declare const chrome: typeof import('wxt/browser').browser;
const extension = path.resolve('.output/chrome-mv3');
const fixture = await readFile(
  path.resolve('tests/fixtures/youtube.html'),
  'utf8',
);

async function spa(page: Page, pathname: string, route: string) {
  await page.evaluate(
    ({ pathname, route }) => {
      history.pushState({}, '', pathname);
      document
        .querySelectorAll<HTMLElement>('[data-route]')
        .forEach((element) => {
          element.hidden = element.dataset.route !== route;
        });
    },
    { pathname, route },
  );
}

test('production content script hides only selected discovery surfaces and reverses cleanly', async ({
  browserName,
}, testInfo) => {
  expect(browserName).toBe('chromium');
  const profile = await mkdtemp(path.join(tmpdir(), 'freedom-youtube-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 900 },
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
  });
  const errors: string[] = [];
  context.on('page', (page) =>
    page.on('pageerror', (error) => errors.push(error.message)),
  );
  await context.route('https://www.youtube.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: fixture }),
  );
  await context.route('https://example.org/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: fixture }),
  );
  try {
    const manager = await context.newPage();
    await manager.goto('chrome://extensions/');
    const item = manager
      .locator('extensions-item')
      .filter({ hasText: 'Project Freedom (Prototype)' });
    await item.waitFor({ state: 'attached' });
    const id = await item.getAttribute('id');
    expect(id).toMatch(/^[a-p]{32}$/);
    await manager.close();
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${id}/popup.html`);
    await expect(
      popup.getByRole('checkbox', { name: 'Enable selected controls' }),
    ).toBeEnabled();
    async function choose(name: string, checked: boolean) {
      const checkbox = popup.getByRole('checkbox', { name, exact: true });
      if ((await checkbox.isChecked()) !== checked) await checkbox.click();
      if (checked) await expect(checkbox).toBeChecked();
      else await expect(checkbox).not.toBeChecked();
      await expect(popup.getByRole('status')).not.toHaveText('Saving…');
    }
    const page = await context.newPage();
    await page.goto('https://www.youtube.com/');
    await expect(page.getByTestId('home-card')).toBeVisible();
    await expect(page.locator('#project-freedom-youtube-style')).toHaveCount(0);
    await choose('Hide home recommendations', true);
    await expect(page.getByTestId('home-card')).toBeVisible();
    const anotherTab = await context.newPage();
    await anotherTab.goto('https://www.youtube.com/');
    await expect(anotherTab.getByTestId('home-card')).toBeVisible();
    await choose('Enable selected controls', true);
    await expect(page.getByTestId('home-card')).toBeHidden();
    await expect(anotherTab.getByTestId('home-card')).toBeHidden();
    await expect(page.getByTestId('home-section')).toBeHidden();
    await expect(page.getByTestId('home-safety')).toBeVisible();
    await expect(page.getByTestId('consent')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
    await page.evaluate(() => {
      if (!('navigation' in window))
        throw new Error('Navigation API unavailable');
      const navigation = window.navigation as EventTarget & {
        navigate(url: string): {
          committed: Promise<unknown>;
          finished: Promise<unknown>;
        };
      };
      navigation.addEventListener(
        'navigate',
        (event) => event.preventDefault(),
        { once: true },
      );
      const canceled = navigation.navigate('/watch?v=canceled');
      void canceled.committed.catch(() => {});
      void canceled.finished.catch(() => {});
    });
    await expect(page).toHaveURL('https://www.youtube.com/');
    await expect(page.getByTestId('home-card')).toBeHidden();
    await page.reload();
    await expect(page.getByTestId('home-card')).toBeHidden();
    await expect(page.locator('#project-freedom-youtube-style')).toHaveCount(1);
    await expect(page.getByTestId('shorts-guide')).toBeVisible();
    await choose('Hide Shorts discovery', true);
    await expect(page.getByTestId('shorts-guide')).toBeHidden();
    await expect(page.getByTestId('shorts-mini-guide')).toBeHidden();
    await expect(page.getByTestId('unknown-guide')).toBeVisible();

    await spa(page, '/results?search_query=chosen', 'search');
    await expect(page.getByTestId('search-video')).toBeVisible();
    await expect(page.getByTestId('search-short-result')).toBeVisible();
    await expect(page.getByTestId('search-shorts')).toBeHidden();
    await expect(page.getByTestId('legacy-shorts')).toBeHidden();
    await expect(page.getByTestId('mixed-shelf')).toBeVisible();
    await page.evaluate(() => {
      const shelf = document.createElement('grid-shelf-view-model');
      shelf.dataset.testid = 'late-shorts';
      const short = document.createElement('ytm-shorts-lockup-view-model');
      short.textContent = 'Late inserted synthetic Short';
      shelf.append(short);
      document.querySelector('ytd-search')?.append(shelf);
    });
    await expect(page.getByTestId('late-shorts')).toBeHidden();
    await expect(page.locator('#project-freedom-youtube-style')).toHaveCount(1);
    await choose('Hide Shorts discovery', false);
    await expect(page.getByTestId('late-shorts')).toBeVisible();
    await expect(page.getByTestId('search-shorts')).toBeVisible();
    await choose('Hide Shorts discovery', true);

    await spa(page, '/watch?v=chosen&list=explicit', 'watch');
    await expect(page.getByTestId('watch-card')).toBeVisible();
    await expect(page.getByTestId('watch-shorts')).toBeHidden();
    await choose('Hide watch recommendations', true);
    for (const card of [
      'watch-card',
      'legacy-watch-card',
      'playlist-suggestion',
    ])
      await expect(page.getByTestId(card)).toBeHidden();
    for (const preserved of [
      'player',
      'video',
      'playlist',
      'nested-playlist-item',
      'watch-safety',
      'comments',
      'consent',
    ])
      await expect(page.getByTestId(preserved)).toBeVisible();
    for (const button of ['play', 'captions', 'fullscreen', 'playlist-next']) {
      await page.getByTestId(button).click();
      await expect(page.getByTestId(button)).toHaveAttribute(
        'data-activated',
        'true',
      );
    }
    await page.screenshot({
      path: testInfo.outputPath('phase2-watch-fixture.png'),
      fullPage: true,
    });
    await page.goBack();
    await expect(page.getByTestId('search-video')).toBeVisible();
    await expect(page.getByTestId('search-shorts')).toBeHidden();
    await page.goForward();
    await expect(page.getByTestId('watch-card')).toBeHidden();
    await expect(page.getByTestId('playlist')).toBeVisible();

    await spa(page, '/feed/subscriptions', 'subscriptions');
    await expect(page.getByTestId('subscription-video')).toBeVisible();
    await expect(page.getByTestId('subscription-shorts')).toBeHidden();
    await spa(page, '/results?search_query=chosen', 'search');
    await page.getByTestId('search-short-result').getByRole('link').click();
    await expect(page).toHaveURL('https://www.youtube.com/shorts/chosen');
    await expect(page.getByTestId('shorts-player')).toBeVisible();
    await expect(page.getByTestId('shorts-exit')).toBeVisible();
    await page.goto('https://www.youtube.com/@chosen');
    await expect(page.getByTestId('unknown-content')).toBeVisible();
    await expect(page.locator('#project-freedom-youtube-style')).toHaveCount(0);

    await page.goto('https://www.youtube.com/');
    await expect(page.getByTestId('home-card')).toBeHidden();
    await page.evaluate(() => {
      const frame = document.createElement('iframe');
      frame.id = 'embedded';
      frame.src = 'https://www.youtube.com/?frame=fixture';
      document.body.append(frame);
    });
    const frame = page.frameLocator('#embedded');
    await expect(frame.getByTestId('home-card')).toBeVisible();
    await expect(frame.locator('#project-freedom-youtube-style')).toHaveCount(
      0,
    );
    await choose('Enable selected controls', false);
    await expect(page.getByTestId('home-card')).toBeVisible();
    await expect(anotherTab.getByTestId('home-card')).toBeVisible();
    await expect(
      anotherTab.locator('#project-freedom-youtube-style'),
    ).toHaveCount(0);
    await expect(page.locator('#project-freedom-youtube-style')).toHaveCount(0);
    await expect(page.getByTestId('home-card')).toHaveAttribute(
      'style',
      'display: grid',
    );
    await choose('Enable selected controls', true);
    await expect(page.getByTestId('home-card')).toBeHidden();
    await popup.evaluate(
      (schema) => chrome.storage.local.set({ [schema]: 2 }),
      SCHEMA_KEY,
    );
    await expect(page.getByTestId('home-card')).toBeVisible();
    await expect(page.locator('#project-freedom-youtube-style')).toHaveCount(0);
    await popup.getByRole('button', { name: 'Reset preferences' }).click();
    await popup.getByRole('button', { name: 'Confirm reset' }).click();
    await expect(
      popup.getByRole('checkbox', { name: 'Enable selected controls' }),
    ).not.toBeChecked();
    await expect(page.getByTestId('home-card')).toBeVisible();
    await choose('Hide home recommendations', true);
    await choose('Enable selected controls', true);
    await page.goto('https://example.org/');
    await expect(page.getByTestId('home-card')).toBeVisible();
    await expect(page.locator('#project-freedom-youtube-style')).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
