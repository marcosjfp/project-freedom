import { chromium, expect, type Page } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const youtubeFixture = await readFile(
  path.resolve('tests/fixtures/youtube.html'),
  'utf8',
);
export async function launchQualification() {
  const profile = await mkdtemp(path.join(tmpdir(), 'freedom-qualification-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 900 },
    args: [
      `--disable-extensions-except=${path.resolve('.output/chrome-mv3')}`,
      `--load-extension=${path.resolve('.output/chrome-mv3')}`,
    ],
  });
  async function close() {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
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
    return { context, id, close };
  } catch (error) {
    await close();
    throw error;
  }
}
export async function choose(page: Page, name: string, value: boolean) {
  const checkbox = page.getByRole('checkbox', { name, exact: true });
  await expect(checkbox).toBeEnabled();
  if ((await checkbox.isChecked()) !== value) await checkbox.click();
  await expect(checkbox).toBeChecked({ checked: value });
  await expect(page.getByRole('status')).not.toHaveText('Saving…');
}
export async function fixtureRoute(
  page: Page,
  pathname: string,
  route: string,
) {
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
