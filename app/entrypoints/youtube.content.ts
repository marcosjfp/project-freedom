import { defineContentScript } from 'wxt/utils/define-content-script';
import { settingsRepository } from '../features/settings/browser-repository';
import { mountYouTubeShield } from '../features/youtube/controller';

export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  allFrames: false,
  world: 'ISOLATED',
  runAt: 'document_idle',
  noScriptStartedPostMessage: true,
  main(ctx) {
    const controller = mountYouTubeShield({
      document,
      url: location.href,
      repository: settingsRepository,
    });
    ctx.onInvalidated(() => controller.dispose());
    const refresh = () => {
      if (ctx.isValid) controller.setUrl(location.href);
    };
    // Read the committed URL. Native navigate notifications can precede a
    // canceled navigation; an event payload must not change active rules.
    ctx.addEventListener(window, 'wxt:locationchange', refresh);
    ctx.addEventListener(window, 'popstate', refresh);
    ctx.addEventListener(window, 'pageshow', refresh);
    // Commit-time events cover native SPA navigations and redirects.
    if ('navigation' in window) {
      ctx.addEventListener(
        window.navigation as EventTarget,
        'currententrychange',
        refresh,
      );
    }
    ctx.addEventListener(document, 'yt-navigate-finish', refresh);
    ctx.addEventListener(document, 'visibilitychange', refresh);
  },
});
