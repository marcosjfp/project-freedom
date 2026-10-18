import {
  chromium,
  expect,
  test,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  OWNED_KEYS,
  SCHEMA_KEY,
  SETTINGS_KEYS,
} from '../../features/settings/schema';

// This global exists inside the real extension pages evaluated below.
declare const chrome: typeof import('wxt/browser').browser;

const extension = path.resolve('.output/chrome-mv3');
const master = (page: Page) =>
  page.getByRole('checkbox', { name: 'Enable selected controls' });
const home = (page: Page) =>
  page.getByRole('checkbox', { name: 'Hide home recommendations' });
const shorts = (page: Page) =>
  page.getByRole('checkbox', { name: 'Hide Shorts discovery' });

test('local choices sync, survive restart, recover, and reset without touching unrelated storage', async ({
  browserName,
}, testInfo) => {
  expect(browserName).toBe('chromium');
  const profile = await mkdtemp(path.join(tmpdir(), 'freedom-settings-'));
  const pageErrors: string[] = [];
  const outbound: string[] = [];
  let context: BrowserContext | undefined;

  async function launch() {
    context = await chromium.launchPersistentContext(profile, {
      channel: 'chromium',
      headless: true,
      viewport: { width: 1000, height: 900 },
      args: [
        `--disable-extensions-except=${extension}`,
        `--load-extension=${extension}`,
      ],
    });
    context.on('page', (page) => {
      page.on('pageerror', (error) => {
        if (page.url().startsWith('chrome-extension://'))
          pageErrors.push(error.message);
      });
      page.on('request', (request) => {
        if (
          page.url().startsWith('chrome-extension://') &&
          /^https?:/.test(request.url())
        )
          outbound.push(request.url());
      });
    });
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
    await popup.setViewportSize({ width: 360, height: 800 });
    await popup.goto(`chrome-extension://${id}/popup.html`);
    await expect(master(popup)).toBeEnabled();
    return { popup, id, context };
  }

  try {
    let instance = await launch();
    let popup = instance.popup;
    for (const checkbox of await popup.getByRole('checkbox').all())
      await expect(checkbox).not.toBeChecked();
    expect(await popup.evaluate(() => chrome.storage.local.get(null))).toEqual(
      {},
    );
    const newPage = instance.context.waitForEvent('page');
    await popup.getByRole('button', { name: 'Settings & privacy' }).click();
    const options = await newPage;
    await expect(
      options.getByRole('heading', { name: 'Your choices stay here' }),
    ).toBeVisible();
    await expect(master(options)).toBeEnabled();

    await Promise.all([home(popup).click(), shorts(options).click()]);
    await expect(home(options)).toBeChecked();
    await expect(shorts(popup)).toBeChecked();
    await master(popup).click();
    await expect(master(options)).toBeChecked();
    await master(options).click();
    await expect(master(popup)).not.toBeChecked();
    await expect(home(popup)).toBeChecked();
    await expect(shorts(options)).toBeChecked();
    await expect(popup.getByRole('status')).not.toHaveText('Saving…');

    await popup.locator('main').screenshot({
      path: testInfo.outputPath('phase1-popup.png'),
    });
    await options.locator('main').screenshot({
      path: testInfo.outputPath('phase1-options.png'),
    });
    expect(
      await options
        .locator('.privacy-section p')
        .first()
        .evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
    ).toBeGreaterThanOrEqual(14);
    expect(
      await popup.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await options.evaluate(() =>
      chrome.storage.local.set({ unrelated: 'sentinel' }),
    );

    await popup.getByRole('button', { name: 'Reset preferences' }).click();
    await expect(popup.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await popup.keyboard.press('Enter');
    await expect(
      popup.getByRole('button', { name: 'Reset preferences' }),
    ).toBeFocused();
    await expect(home(popup)).toBeChecked();
    await popup.getByRole('button', { name: 'Reset preferences' }).click();
    await popup.getByRole('button', { name: 'Confirm reset' }).click();
    await expect(home(options)).not.toBeChecked();
    expect(
      await options.evaluate(() => chrome.storage.local.get(null)),
    ).toEqual({ unrelated: 'sentinel' });

    await options.evaluate(
      async ({ schema, enabled }) => {
        await chrome.storage.local.set({ [schema]: 2, [enabled]: true });
      },
      { schema: SCHEMA_KEY, enabled: SETTINGS_KEYS.enabled },
    );
    await expect(popup.getByRole('alert')).toContainText('unsupported format');
    await expect(master(popup)).toBeDisabled();
    await expect(master(popup)).not.toBeChecked();
    expect(
      (await options.evaluate(() => chrome.storage.local.get(null)))[
        SCHEMA_KEY
      ],
    ).toBe(2);
    await options.getByRole('button', { name: 'Reset preferences' }).click();
    await options.getByRole('button', { name: 'Confirm reset' }).click();
    await expect(master(popup)).toBeEnabled();
    await shorts(popup).click();
    await expect(shorts(options)).toBeChecked();
    await master(popup).click();
    await expect(master(options)).toBeChecked();
    await instance.context.close();

    instance = await launch();
    popup = instance.popup;
    await expect(master(popup)).toBeChecked();
    await expect(shorts(popup)).toBeChecked();
    const stored = await popup.evaluate(() => chrome.storage.local.get(null));
    expect(
      Object.keys(stored)
        .filter((key) => key !== 'unrelated')
        .every((key) => OWNED_KEYS.includes(key)),
    ).toBe(true);
    expect(stored.unrelated).toBe('sentinel');
    expect(instance.context.serviceWorkers()).toHaveLength(0);
    expect(pageErrors).toEqual([]);
    expect(outbound).toEqual([]);
  } finally {
    await context?.close();
    await rm(profile, { recursive: true, force: true });
  }
});
