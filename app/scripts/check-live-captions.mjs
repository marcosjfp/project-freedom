/* global document */
// Optional live smoke, never part of the production extension or offline suite.
// Uses only normal public YouTube/player controls in a disposable Chrome profile.
import { chromium, expect } from '@playwright/test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { URL } from 'node:url';

const extension = path.resolve('.output/chrome-mv3');
const profile = await mkdtemp(path.join(tmpdir(), 'freedom-live-captions-'));
const report = {
  version: JSON.parse(await readFile('package.json', 'utf8')).version,
  mode: 'installed Chrome, headless, isolated signed-out profile; public video, no personal data',
  videoId: 'iG9CE55wbtY',
  responses: [],
  states: [],
  offeredSkipsUsed: 0,
  verdict: 'unverified',
};
let context;
const pendingResponses = [];
async function choose(page, value) {
  const checkbox = page.getByRole('checkbox', {
    name: 'Enable selected controls',
    exact: true,
  });
  await expect(checkbox).toBeEnabled();
  if ((await checkbox.isChecked()) !== value) await checkbox.click();
  await expect(checkbox).toBeChecked({ checked: value });
  await expect(page.getByRole('status')).not.toHaveText('Saving…');
}
try {
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chrome',
    headless: true,
    ignoreDefaultArgs: ['--disable-extensions'],
    viewport: { width: 1365, height: 900 },
    args: ['--enable-unsafe-extension-debugging'],
  });
  report.browser = context.browser().version();
  const session = await context.browser().newBrowserCDPSession();
  const { id } = await session.send('Extensions.loadUnpacked', {
    path: extension,
  });
  const options = await context.newPage();
  await options.goto(`chrome-extension://${id}/options.html`);
  const watch = options.getByRole('checkbox', {
    name: 'Hide watch recommendations',
    exact: true,
  });
  await expect(watch).toBeEnabled();
  await watch.click();
  await expect(watch).toBeChecked();
  await choose(options, false);
  const page = await context.newPage();
  page.on('response', (response) => {
    if (new URL(response.url()).pathname !== '/api/timedtext') return;
    pendingResponses.push(
      (async () => {
        const metadata = {
          status: response.status(),
          contentType: response.headers()['content-type'] ?? null,
        };
        report.responses.push(metadata);
        try {
          // Inspect byte count only; never save subtitle text or request tokens.
          metadata.bytes = (await response.body()).length;
        } catch {
          metadata.bodyUnavailable = true;
        }
      })(),
    );
  });
  await page.goto(`https://www.youtube.com/watch?v=${report.videoId}`, {
    waitUntil: 'domcontentloaded',
  });
  const reject = page
    .getByRole('button', {
      name: /^Reject the use of cookies|^Reject all/,
    })
    .first();
  // Consent may appear after the initial document is ready. Never remove it.
  if (
    await reject.waitFor({ state: 'visible', timeout: 6500 }).then(
      () => true,
      () => false,
    )
  ) {
    await reject.click();
    await expect(reject).toBeHidden({ timeout: 15000 });
    report.consentRejected = true;
  }
  const player = page.locator('#movie_player');
  const video = player.locator('video').first();
  await video.waitFor({ state: 'visible', timeout: 20000 });
  const deadline = Date.now() + 160000;
  let ready = false;
  while (Date.now() < deadline) {
    await player.hover();
    const skip = player.getByRole('button', { name: /^Skip/ }).first();
    if (await skip.isVisible()) {
      await skip.click();
      report.offeredSkipsUsed++;
    }
    const state = await video.evaluate((v) => ({
      paused: v.paused,
      time: v.currentTime,
      ready: v.readyState,
      ad: v.closest('#movie_player')?.classList.contains('ad-showing'),
    }));
    if (state.paused) await player.locator('.ytp-play-button').click();
    if (!state.ad && !state.paused && state.time > 4 && state.ready >= 2) {
      ready = true;
      break;
    }
    await page.waitForTimeout(1500);
  }
  if (!ready)
    throw new Error('Main playback was not ready within the sample window.');
  await player.hover();
  const cc = player.locator('.ytp-subtitles-button');
  await expect(cc).toBeVisible();
  if ((await cc.getAttribute('aria-pressed')) !== 'true') await cc.click();
  await expect(cc).toHaveAttribute('aria-pressed', 'true');
  for (const masterEnabled of [false, true]) {
    await choose(options, masterEnabled);
    await page.bringToFront();
    const root = page.locator('html');
    if (masterEnabled)
      await expect(root).toHaveAttribute('data-project-freedom-watch', '');
    else {
      await expect(root).not.toHaveAttribute('data-project-freedom-watch');
      await expect(page.locator('#project-freedom-youtube-style')).toHaveCount(
        0,
      );
    }
    const segment = page
      .locator('.ytp-caption-segment')
      .filter({ hasText: /\S/ })
      .first();
    const rendered = await expect(segment)
      .toBeVisible({ timeout: 5000 })
      .then(
        () => true,
        () => false,
      );
    const state = await page.evaluate(() => {
      const v = document.querySelector('video');
      const player = document.querySelector('#movie_player');
      return {
        time: v?.currentTime,
        paused: v?.paused,
        ad: player?.classList.contains('ad-showing'),
        ccPressed: player
          ?.querySelector('.ytp-subtitles-button')
          ?.getAttribute('aria-pressed'),
        captionTextLength:
          player
            ?.querySelector('.ytp-caption-window-container')
            ?.textContent?.trim().length ?? 0,
        watchRuleActive: document.documentElement.hasAttribute(
          'data-project-freedom-watch',
        ),
        stylePresent: !!document.querySelector(
          '#project-freedom-youtube-style',
        ),
      };
    });
    if (state.paused || state.ad || state.time <= 4)
      throw new Error(
        'Main playback became unavailable during caption sampling.',
      );
    report.states.push({ masterEnabled, rendered, ...state });
    console.log(
      `Caption sample, master ${masterEnabled ? 'on' : 'off'}: ${rendered ? 'visible' : 'not rendered'}`,
    );
  }
  if (
    report.states.length === 2 &&
    report.states.every((s) => s.rendered && s.captionTextLength > 0)
  )
    report.verdict = 'passed sampled live video';
} catch (error) {
  // Deliberately omit full automation call logs, URLs with tokens and page text.
  report.error = error.message.split('\n')[0];
} finally {
  try {
    await context?.close();
  } finally {
    await Promise.allSettled(pendingResponses);
    await rm(profile, { recursive: true, force: true });
    await writeFile(
      '.output/live-caption-qualification.json',
      JSON.stringify(report, null, 2) + '\n',
    );
  }
}
console.log(
  `Live captions: ${report.verdict}; metadata in .output/live-caption-qualification.json`,
);
// Nonzero means unverified, not an assertion that the extension caused a failure.
if (report.verdict === 'unverified') process.exitCode = 2;
