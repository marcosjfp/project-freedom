/* global chrome, innerWidth, getComputedStyle, document, devicePixelRatio */
// Optional qualification against installed Google Chrome. Test-only browser APIs
// and debugging flags never become part of the extension manifest or bundles.
import { chromium, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { clearTimeout, setTimeout } from 'node:timers';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const extension = path.resolve('.output/chrome-mv3');
const fixture = await readFile('tests/fixtures/youtube.html', 'utf8');
const profile = await mkdtemp(
  path.join(tmpdir(), 'freedom-stock-qualification-'),
);
const report = {
  version: JSON.parse(await readFile('package.json', 'utf8')).version,
  checks: {},
  mode: 'installed Chrome, isolated profile, headless; native browser APIs, no physical toolbar click or VoiceOver',
};
let context;
async function launch() {
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chrome',
    headless: true,
    ignoreDefaultArgs: ['--disable-extensions'],
    viewport: { width: 1100, height: 900 },
    args: ['--enable-unsafe-extension-debugging'],
  });
  await context.route('https://www.youtube.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: fixture }),
  );
  return context.browser().newBrowserCDPSession();
}
async function choose(page, name, value) {
  const checkbox = page.getByRole('checkbox', { name, exact: true });
  await expect(checkbox).toBeEnabled();
  if ((await checkbox.isChecked()) !== value) await checkbox.click();
  await expect(checkbox).toBeChecked({ checked: value });
}
// Native action popups are exposed as CDP targets but not normal Playwright
// tab pages in this Chrome version. Use Chrome's documented nested CDP session.
async function popupSession(browserSession, targetId) {
  const { sessionId } = await browserSession.send('Target.attachToTarget', {
    targetId,
    flatten: false,
  });
  const pending = new Map();
  let nextId = 0;
  browserSession.on('Target.receivedMessageFromTarget', (event) => {
    if (event.sessionId !== sessionId) return;
    const message = JSON.parse(event.message),
      request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timer);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  function send(method, params = {}) {
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Popup protocol timeout: ${method}`));
      }, 5000);
      pending.set(id, { resolve, reject, timer });
      void browserSession
        .send('Target.sendMessageToTarget', {
          sessionId,
          message: JSON.stringify({ id, method, params }),
        })
        .catch((error) => {
          clearTimeout(timer);
          pending.delete(id);
          reject(error);
        });
    });
  }
  async function evaluate(expression) {
    const reply = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (reply.exceptionDetails) throw new Error(reply.exceptionDetails.text);
    return reply.result.value;
  }
  async function key(key, code, virtualKey) {
    for (const type of ['keyDown', 'keyUp'])
      await send('Input.dispatchKeyEvent', {
        type,
        key,
        code,
        windowsVirtualKeyCode: virtualKey,
      });
  }
  return { send, evaluate, key };
}
try {
  let browserSession = await launch();
  report.browser = context.browser().version();
  const { id } = await browserSession.send('Extensions.loadUnpacked', {
    path: extension,
  });
  const options = await context.newPage();
  await options.goto(`chrome-extension://${id}/options.html`);
  await expect(options.getByRole('checkbox').first()).toBeEnabled();
  for (const checkbox of await options.getByRole('checkbox').all())
    await expect(checkbox).not.toBeChecked();
  report.checks.freshAllOff = true;
  for (const name of [
    'Hide home recommendations',
    'Hide Shorts discovery',
    'Hide watch recommendations',
  ])
    await choose(options, name, true);
  const page = await context.newPage();
  await page.goto('https://www.youtube.com/');
  await expect(page.getByTestId('home-card')).toBeVisible();
  report.zoom = await options.evaluate(async () => {
    const tab = await chrome.tabs.getCurrent();
    await chrome.tabs.setZoom(tab.id, 2);
    return {
      factor: await chrome.tabs.getZoom(tab.id),
      cssWidth: innerWidth,
      rootFont: getComputedStyle(document.documentElement).fontSize,
      devicePixelRatio,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(report.zoom.factor).toBe(2);
  expect(report.zoom.cssWidth).toBe(550);
  expect(report.zoom.rootFont).toBe('14px');
  expect(report.zoom.horizontalOverflow).toBe(false);
  await options
    .getByRole('button', { name: 'Reset preferences' })
    .scrollIntoViewIfNeeded();
  await expect(
    options.getByRole('button', { name: 'Reset preferences' }),
  ).toBeVisible();
  // Capture the native viewport directly: Playwright's full-page clip can
  // crop a browser-zoomed page using its original device scale assumption.
  const optionsSession = await context.newCDPSession(options);
  const optionsShot = await optionsSession.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  await writeFile(
    '.output/chrome-options-native-200.png',
    Buffer.from(optionsShot.data, 'base64'),
  );
  report.checks.nativeOptionsZoom = true;
  await options.evaluate(() => chrome.action.openPopup());
  let target;
  await expect
    .poll(async () => {
      target = (
        await browserSession.send('Target.getTargets', { filter: [{}] })
      ).targetInfos.find(
        (info) =>
          info.type === 'page' &&
          info.url === `chrome-extension://${id}/popup.html`,
      );
      return Boolean(target);
    })
    .toBe(true);
  const popup = await popupSession(browserSession, target.targetId);
  report.popup = await popup.evaluate(
    '({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,checkboxes:document.querySelectorAll("input[type=checkbox]").length,overflowX:document.documentElement.scrollWidth>innerWidth,scrollHeight:document.documentElement.scrollHeight})',
  );
  expect(report.popup.checkboxes).toBe(4);
  expect(report.popup.overflowX).toBe(false);
  await popup.key('Tab', 'Tab', 9);
  expect(
    await popup.evaluate(
      'document.activeElement===document.querySelector("input[type=checkbox]")',
    ),
  ).toBe(true);
  await popup.key(' ', 'Space', 32);
  await expect
    .poll(() =>
      popup.evaluate('document.querySelector("input[type=checkbox]").checked'),
    )
    .toBe(true);
  await expect(page.getByTestId('home-card')).toBeHidden();
  await popup.evaluate(
    'document.querySelector(".reset-section button").scrollIntoView()',
  );
  expect(
    await popup.evaluate(
      '(()=>{const r=document.querySelector(".reset-section button").getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()',
    ),
  ).toBe(true);
  const shot = await popup.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  await writeFile(
    '.output/chrome-native-action-popup.png',
    Buffer.from(shot.data, 'base64'),
  );
  report.checks.nativePopupKeyboardAndScrolling = true;
  await context.close();
  browserSession = await launch();
  // CDP loading is test-session setup, like Chromium's --load-extension.
  // Reload the same path/ID while retaining the profile and stored choices.
  const reloaded = await browserSession.send('Extensions.loadUnpacked', {
    path: extension,
  });
  expect(reloaded.id).toBe(id);
  report.debugLoadEachLaunch = true;
  expect(
    (await browserSession.send('Extensions.getExtensions')).extensions.some(
      (info) => info.id === id && info.enabled,
    ),
  ).toBe(true);
  const reopened = await context.newPage();
  await reopened.goto(`chrome-extension://${id}/options.html`);
  await expect(reopened.getByRole('checkbox').first()).toBeChecked();
  const restored = await context.newPage();
  await restored.goto('https://www.youtube.com/');
  await expect(restored.getByTestId('home-card')).toBeHidden();
  report.checks.sameProfileRestart = true;
  await choose(reopened, 'Enable selected controls', false);
  await expect(restored.getByTestId('home-card')).toBeVisible();
  report.checks.masterOffWithoutReload = true;
  await reopened.getByRole('button', { name: 'Reset preferences' }).click();
  await reopened.getByRole('button', { name: 'Confirm reset' }).click();
  expect(await reopened.evaluate(() => chrome.storage.local.get(null))).toEqual(
    {},
  );
  report.checks.reset = true;
  await writeFile(
    '.output/installed-chrome-qualification.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context?.close();
  await rm(profile, { recursive: true, force: true });
}
