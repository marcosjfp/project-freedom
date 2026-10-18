import type { SettingsSnapshot } from '../settings/repository';
import { effectiveSettings } from '../settings/schema';
import { classifyRoute } from './routes';
import { YOUTUBE_SELECTORS } from './selectors';

export const MARKERS = {
  route: 'data-project-freedom-route',
  home: 'data-project-freedom-home',
  shorts: 'data-project-freedom-shorts',
  watch: 'data-project-freedom-watch',
} as const;

export function deriveRules(url: string | URL, snapshot: SettingsSnapshot) {
  const route = classifyRoute(url);
  const settings = effectiveSettings(
    snapshot.settings,
    snapshot.status === 'ready',
  );
  return {
    route,
    home: route === 'home' && settings.hideHomeRecommendations,
    shorts: route !== 'unsupported' && settings.hideShortsDiscovery,
    watch: route === 'watch' && settings.hideWatchRecommendations,
  };
}

// Only fixed local selectors and fixed marker names become CSS.
export const shieldStylesheet = (['home', 'shorts', 'watch'] as const)
  .map((feature) => {
    const gate = `html[${MARKERS[feature]}]`;
    return `${YOUTUBE_SELECTORS[feature].map((selector) => `${gate} ${selector}`).join(',\n')} { display: none !important; }`;
  })
  .join('\n');
