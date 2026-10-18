import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import {
  choose,
  fixtureRoute,
  launchQualification,
  youtubeFixture,
} from './helpers/extension';

interface TraceEvent {
  name: string;
  ph: string;
  ts: number;
  dur?: number;
  args?: { data?: { url?: string; scriptName?: string } };
}
test('ten SPA transitions and a long feed stay bounded and idle work stops', async ({
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
    for (const name of [
      'Hide home recommendations',
      'Hide Shorts discovery',
      'Hide watch recommendations',
      'Enable selected controls',
    ])
      await choose(popup, name, true);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    const trace: TraceEvent[] = [];
    cdp.on('Tracing.dataCollected', ({ value }) =>
      trace.push(...(value as unknown as TraceEvent[])),
    );
    await cdp.send('Tracing.start', {
      categories: 'devtools.timeline,v8',
      transferMode: 'ReportEvents',
    });
    const metric = async () => {
      const result = await cdp.send('Performance.getMetrics');
      return Object.fromEntries(
        result.metrics.map(({ name, value }) => [name, value]),
      );
    };
    const samples: Array<{
      action: string;
      pageScriptMs: number;
      styleLayoutMs: number;
      taskMs: number;
      elapsedMs: number;
    }> = [];
    async function measure(action: string, change: () => Promise<void>) {
      const before = await metric(),
        start = performance.now();
      await change();
      const after = await metric();
      const delta = (name: string) =>
        ((after[name] ?? 0) - (before[name] ?? 0)) * 1000;
      samples.push({
        action,
        pageScriptMs: delta('ScriptDuration'),
        styleLayoutMs: delta('RecalcStyleDuration') + delta('LayoutDuration'),
        taskMs: delta('TaskDuration'),
        elapsedMs: performance.now() - start,
      });
    }
    await measure('initial-load', async () => {
      await page.goto('https://www.youtube.com/');
      await expect(page.getByTestId('home-card')).toBeHidden();
    });
    await cdp.send('HeapProfiler.collectGarbage');
    const lifecycleBefore = await metric();
    for (const [pathname, route] of [
      ['/results?search_query=synthetic', 'search'],
      ['/watch?v=synthetic', 'watch'],
      ['/feed/subscriptions', 'subscriptions'],
      ['/shorts/synthetic', 'shorts'],
      ['/', 'home'],
      ['/results?search_query=synthetic', 'search'],
      ['/watch?v=synthetic', 'watch'],
      ['/feed/subscriptions', 'subscriptions'],
      ['/shorts/synthetic', 'shorts'],
      ['/', 'home'],
    ]) {
      if (!pathname || !route) throw new Error('Invalid fixture route');
      await measure(`route-${route}`, async () => {
        await fixtureRoute(page, pathname, route);
        await expect(page.locator('html')).toHaveAttribute(
          'data-project-freedom-route',
          route,
        );
      });
    }
    await cdp.send('HeapProfiler.collectGarbage');
    const lifecycleAfter = await metric();
    expect(lifecycleAfter.JSEventListeners).toBe(
      lifecycleBefore.JSEventListeners,
    );
    await measure('insert-1000-home-cards', async () => {
      await page.evaluate(() => {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 1000; i++) {
          const card = document.createElement('ytd-rich-item-renderer');
          card.className = 'long-feed-card';
          const model = document.createElement('yt-lockup-view-model');
          model.textContent = 'Synthetic long-feed item';
          card.append(model);
          fragment.append(card);
        }
        document
          .querySelector(
            'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer > #contents',
          )
          ?.append(fragment);
      });
      await expect(page.locator('.long-feed-card:visible')).toHaveCount(0);
    });
    await measure('master-off-long-feed', async () => {
      await choose(popup, 'Enable selected controls', false);
      await expect(page.locator('.long-feed-card:visible')).toHaveCount(1000);
    });
    await measure('master-on-long-feed', async () => {
      await choose(popup, 'Enable selected controls', true);
      await expect(page.locator('.long-feed-card:visible')).toHaveCount(0);
    });
    await expect(page.locator('#project-freedom-youtube-style')).toHaveCount(1);
    // Allow style/layout and test polling to finish before measuring quiet time.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const beforeIdle = await metric();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const afterIdle = await metric();
    const idleScriptMs =
      ((afterIdle.ScriptDuration ?? 0) - (beforeIdle.ScriptDuration ?? 0)) *
      1000;
    expect(idleScriptMs).toBeLessThan(5);
    // CDP page counters are a reference signal, not complete attribution of every extension task.
    expect(
      Math.max(...samples.map((sample) => sample.pageScriptMs)),
    ).toBeLessThan(50);
    const completed = new Promise<void>((resolve) =>
      cdp.once('Tracing.tracingComplete', () => resolve()),
    );
    await cdp.send('Tracing.end');
    await completed;
    const extensionCalls = trace.filter(
      (event) =>
        event.ph === 'X' &&
        event.name === 'FunctionCall' &&
        (
          event.args?.data?.url ??
          event.args?.data?.scriptName ??
          ''
        ).startsWith(`chrome-extension://${id}/content-scripts/`),
    );
    const report = {
      browser: context.browser()?.version(),
      viewport: '1280x900',
      transitions: 10,
      insertedCards: 1000,
      samples,
      maximumPageScriptMs: Math.max(
        ...samples.map((sample) => sample.pageScriptMs),
      ),
      idleWindowMs: 1500,
      idleScriptMs,
      extensionFunctionCallCount: extensionCalls.length,
      maximumExtensionFunctionCallMs: Math.max(
        0,
        ...extensionCalls.map((event) => (event.dur ?? 0) / 1000),
      ),
      lifecycle: {
        before: lifecycleBefore.JSEventListeners,
        after: lifecycleAfter.JSEventListeners,
        heapBeforeBytes: lifecycleBefore.JSHeapUsedSize,
        heapAfterBytes: lifecycleAfter.JSHeapUsedSize,
      },
      scope:
        'synthetic fixture; whole-page CDP metrics include host/test code; trace contains only synthetic content',
    };
    await writeFile(
      testInfo.outputPath('phase3-performance-trace.json'),
      JSON.stringify({ traceEvents: trace }),
    );
    await testInfo.attach('performance-summary', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    });
  } finally {
    await close();
  }
});
