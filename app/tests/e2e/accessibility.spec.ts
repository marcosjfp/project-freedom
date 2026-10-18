import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { launchQualification } from './helpers/extension';

declare const chrome: typeof import('wxt/browser').browser;

async function audit(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
      'wcag22aa',
      'best-practice',
    ])
    .analyze();
  expect(
    result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  return {
    violations: result.violations.length,
    incomplete: result.incomplete.map(({ id }) => id),
    passes: result.passes.length,
  };
}
async function noHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test('settings support keyboard operation, reflow, focus restoration, and automated accessibility checks', async ({
  browserName,
}, testInfo) => {
  expect(browserName).toBe('chromium');
  const { context, id, close } = await launchQualification();
  const scans: Record<string, unknown> = {};
  try {
    const popup = await context.newPage();
    await popup.setViewportSize({ width: 360, height: 800 });
    await popup.goto(`chrome-extension://${id}/popup.html`);
    const master = popup.getByRole('checkbox', {
      name: 'Enable selected controls',
      exact: true,
    });
    await expect(master).toBeEnabled();
    scans.popup = await audit(popup);
    // Starting from the document, operate all preference and reset controls by keyboard.
    await popup.keyboard.press('Tab');
    await expect(master).toBeFocused();
    const focus = await master.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        style: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
      };
    });
    expect(focus.style).toBe('solid');
    expect(focus.width).toBeGreaterThanOrEqual(3);
    await popup.keyboard.press('Space');
    await expect(master).toBeChecked();
    for (const name of [
      'Hide home recommendations',
      'Hide Shorts discovery',
      'Hide watch recommendations',
    ]) {
      await popup.keyboard.press('Tab');
      const checkbox = popup.getByRole('checkbox', { name, exact: true });
      await expect(checkbox).toBeFocused();
      await popup.keyboard.press('Space');
      await expect(checkbox).toBeChecked();
    }
    await popup.keyboard.press('Tab');
    await expect(
      popup.getByRole('button', { name: 'Reset preferences' }),
    ).toBeFocused();
    await popup.keyboard.press('Enter');
    await expect(
      popup.getByRole('button', { name: 'Cancel', exact: true }),
    ).toBeFocused();
    scans.confirmReset = await audit(popup);
    await popup.keyboard.press('Enter');
    await expect(
      popup.getByRole('button', { name: 'Reset preferences' }),
    ).toBeFocused();
    await popup.keyboard.press('Enter');
    await popup.keyboard.press('Tab');
    await expect(
      popup.getByRole('button', { name: 'Confirm reset' }),
    ).toBeFocused();
    await popup.keyboard.press('Enter');
    await expect(master).not.toBeChecked();
    await expect(
      popup.getByRole('button', { name: 'Reset preferences' }),
    ).toBeFocused();
    await popup.keyboard.press('Tab');
    await expect(
      popup.getByRole('button', { name: 'Settings & privacy' }),
    ).toBeFocused();
    const opened = context.waitForEvent('page');
    await popup.keyboard.press('Enter');
    const options = await opened;
    await expect(
      options.getByRole('checkbox', {
        name: 'Enable selected controls',
        exact: true,
      }),
    ).toBeEnabled();
    scans.options = await audit(options);
    await popup.evaluate(() =>
      chrome.storage.local.set({ 'pf.schemaVersion': 2 }),
    );
    await expect(options.getByRole('alert')).toContainText('unsupported');
    scans.unsupported = await audit(options);
    await options.getByRole('button', { name: 'Reset preferences' }).click();
    await options.getByRole('button', { name: 'Confirm reset' }).click();
    await expect(master).toBeEnabled();
    for (const page of [popup, options]) {
      await page.setViewportSize({ width: 320, height: 800 });
      await noHorizontalOverflow(page);
      // 200% text sizing plus narrow reflow. This is not browser chrome zoom or VoiceOver.
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '28px';
      });
      await noHorizontalOverflow(page);
      await page
        .getByRole('button', { name: 'Reset preferences' })
        .scrollIntoViewIfNeeded();
      await expect(
        page.getByRole('button', { name: 'Reset preferences' }),
      ).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath(
          page === popup
            ? 'popup-200-percent-text.png'
            : 'options-200-percent-text.png',
        ),
        fullPage: true,
      });
    }
    await testInfo.attach('accessibility-summary', {
      body: JSON.stringify(
        {
          scans,
          keyboard: 'passed',
          textSizing: '200% root text, 320 CSS px viewport',
          voiceOver: 'not tested',
          browserChromeZoom: 'not tested',
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
