import { expect, test } from '@playwright/test';
import {
  choose,
  launchQualification,
  youtubeFixture,
} from './helpers/extension';

test('browser disabling and re-enabling recover after the documented tab reload', async ({
  browserName,
}, testInfo) => {
  expect(browserName).toBe('chromium');
  const { context, id, close } = await launchQualification();
  await context.route('https://www.youtube.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: youtubeFixture }),
  );
  try {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${id}/popup.html`);
    await choose(popup, 'Hide home recommendations', true);
    await choose(popup, 'Enable selected controls', true);
    const page = await context.newPage();
    await page.goto('https://www.youtube.com/');
    await expect(page.getByTestId('home-card')).toBeHidden();
    const manager = await context.newPage();
    await manager.goto('chrome://extensions/');
    const item = manager
      .locator('extensions-item')
      .filter({ hasText: 'Project Freedom (Prototype)' });
    const toggle = item.locator('#enableToggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect
      .poll(() =>
        toggle.evaluate(
          (element) => (element as HTMLElement & { checked: boolean }).checked,
        ),
      )
      .toBe(false);
    const stylePresentImmediatelyAfterDisable =
      (await page.locator('#project-freedom-youtube-style').count()) > 0;
    await page.reload();
    await expect(page.getByTestId('home-card')).toBeVisible();
    await expect(page.locator('#project-freedom-youtube-style')).toHaveCount(0);
    await toggle.click();
    await expect
      .poll(() =>
        toggle.evaluate(
          (element) => (element as HTMLElement & { checked: boolean }).checked,
        ),
      )
      .toBe(true);
    await page.reload();
    await expect(page.getByTestId('home-card')).toBeHidden();
    await expect(page.locator('#project-freedom-youtube-style')).toHaveCount(1);
    // Chromium closes extension pages when the extension is disabled.
    const reopened = await context.newPage();
    await reopened.goto(`chrome-extension://${id}/popup.html`);
    await expect(
      reopened.getByRole('checkbox', {
        name: 'Enable selected controls',
        exact: true,
      }),
    ).toBeChecked();
    await choose(reopened, 'Enable selected controls', false);
    await expect(page.getByTestId('home-card')).toBeVisible();
    await testInfo.attach('lifecycle-summary', {
      body: JSON.stringify(
        {
          stylePresentImmediatelyAfterDisable,
          disabledTabReloadRestoredPage: true,
          reenabledTabReloadRestoredSavedChoice: true,
          masterOffWithoutReload: true,
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
