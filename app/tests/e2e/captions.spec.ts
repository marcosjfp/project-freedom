import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { choose, launchQualification } from './helpers/extension';

// Generated silence is our own fixture: no downloaded video, codecs, or media tools.
function silentWav() {
  const sampleRate = 8000;
  const bytes = sampleRate * 2 * 12;
  const wav = Buffer.alloc(44 + bytes);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + bytes, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(bytes, 40);
  return wav;
}

test('watch hiding preserves actual media playback and authored WebVTT captions through master changes', async ({
  browserName,
}, testInfo) => {
  expect(browserName).toBe('chromium');
  const fixture = await readFile(
    path.resolve('tests/fixtures/captions.html'),
    'utf8',
  );
  const { context, id, close } = await launchQualification();
  try {
    await context.route('https://www.youtube.com/**', (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === '/fixture.wav')
        return route.fulfill({ contentType: 'audio/wav', body: silentWav() });
      if (pathname === '/fixture.vtt')
        return route.fulfill({
          contentType: 'text/vtt',
          body: 'WEBVTT\n\n00:00.000 --> 00:12.000\nAuthored subtitle remains readable.\n',
        });
      return route.fulfill({ contentType: 'text/html', body: fixture });
    });
    const options = await context.newPage();
    await options.goto(`chrome-extension://${id}/options.html`);
    await choose(options, 'Hide watch recommendations', true);
    await choose(options, 'Enable selected controls', true);
    const page = await context.newPage();
    await page.goto('https://www.youtube.com/watch?v=authored-caption-fixture');
    const video = page.locator('video');
    const subtitle = page.locator('.ytp-caption-segment');
    await expect(page.getByTestId('recommendation')).toBeHidden();
    await expect(page.getByTestId('safety')).toBeVisible();
    await page
      .getByRole('button', { name: 'Authored captions', exact: true })
      .click();
    await page.getByRole('button', { name: 'Play authored media' }).click();
    await expect(subtitle).toHaveText('Authored subtitle remains readable.');
    await expect(subtitle).toBeVisible();
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
      .toBeGreaterThan(0.2);
    const states = [];
    for (const enabled of [false, true]) {
      await choose(options, 'Enable selected controls', enabled);
      await page.bringToFront();
      await expect(page.getByTestId('recommendation')).toBeVisible({
        visible: !enabled,
      });
      await expect(subtitle).toBeVisible();
      await expect(video).toBeVisible();
      const state = await video.evaluate((v: HTMLVideoElement) => ({
        paused: v.paused,
        trackMode: v.textTracks[0]?.mode,
        activeCues: v.textTracks[0]?.activeCues?.length,
        source: new URL(v.currentSrc).pathname,
        time: v.currentTime,
      }));
      expect(state.paused).toBe(false);
      expect(state.trackMode).toBe('hidden');
      expect(state.activeCues).toBe(1);
      expect(state.source).toBe('/fixture.wav');
      await expect
        .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
        .toBeGreaterThan(state.time + 0.2);
      states.push({ masterEnabled: enabled, ...state });
    }
    await page.screenshot({
      path: testInfo.outputPath('authored-captions.png'),
      fullPage: true,
    });
    await page
      .getByRole('button', { name: 'Authored captions', exact: true })
      .click();
    await expect(subtitle).toHaveCount(0);
    await video.evaluate((v: HTMLVideoElement) => v.pause());
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
      .toBe(true);
    await testInfo.attach('authored-caption-evidence', {
      body: JSON.stringify(
        {
          scope: 'controlled authored fixture, not live compatibility',
          states,
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
