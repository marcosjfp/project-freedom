import { describe, expect, it } from 'vitest';
import { classifyRoute } from '../../features/youtube/routes';
import { deriveRules } from '../../features/youtube/rules';
import { DEFAULT_SETTINGS } from '../../features/settings/schema';
import type { SettingsSnapshot } from '../../features/settings/repository';

describe('YouTube route boundaries', () => {
  it.each([
    ['https://www.youtube.com/', 'home'],
    ['https://www.youtube.com/?feature=home', 'home'],
    ['https://www.youtube.com/results?search_query=chosen', 'search'],
    ['https://www.youtube.com/watch?v=chosen&list=explicit', 'watch'],
    ['https://www.youtube.com/feed/subscriptions', 'subscriptions'],
    ['https://www.youtube.com/shorts/chosen', 'shorts'],
    ['https://www.youtube.com/shorts/chosen/', 'shorts'],
    ['https://www.youtube.com/@chosen', 'unsupported'],
    ['https://www.youtube.com/feed/history', 'unsupported'],
    ['https://www.youtube.com/shorts/', 'unsupported'],
    ['https://www.youtube.com/shorts/chosen/extra', 'unsupported'],
    ['https://m.youtube.com/', 'unsupported'],
    ['https://www.youtube.com.example.invalid/', 'unsupported'],
    ['http://www.youtube.com/', 'unsupported'],
    ['not a URL', 'unsupported'],
  ])('classifies %s without widening site scope', (url, route) => {
    expect(classifyRoute(url)).toBe(route);
  });
});

const selected: SettingsSnapshot = {
  status: 'ready',
  busy: false,
  error: null,
  notice: null,
  settings: {
    enabled: true,
    hideHomeRecommendations: true,
    hideShortsDiscovery: true,
    hideWatchRecommendations: true,
  },
};
it('applies home/watch rules only on the corresponding route', () => {
  expect(deriveRules('https://www.youtube.com/', selected)).toMatchObject({
    home: true,
    watch: false,
    shorts: true,
  });
  expect(
    deriveRules('https://www.youtube.com/watch?v=chosen', selected),
  ).toMatchObject({ home: false, watch: true, shorts: true });
  expect(
    deriveRules('https://www.youtube.com/results', selected),
  ).toMatchObject({ home: false, watch: false, shorts: true });
});
it.each(['loading', 'unsupported', 'error'] as const)(
  'fails open while preferences are %s',
  (status) => {
    expect(
      deriveRules('https://www.youtube.com/', { ...selected, status }),
    ).toMatchObject({ home: false, watch: false, shorts: false });
  },
);
it('applies nothing on an unsupported route even when all choices are enabled', () => {
  expect(
    deriveRules('https://www.youtube.com/@chosen', selected),
  ).toMatchObject({ home: false, watch: false, shorts: false });
});
it('keeps selections independent and master off authoritative', () => {
  expect(
    deriveRules('https://www.youtube.com/', {
      ...selected,
      settings: { ...selected.settings, enabled: false },
    }),
  ).toMatchObject({ home: false, watch: false, shorts: false });
  expect(
    deriveRules('https://www.youtube.com/watch?v=chosen', {
      ...selected,
      settings: {
        ...DEFAULT_SETTINGS,
        enabled: true,
        hideWatchRecommendations: true,
      },
    }),
  ).toMatchObject({ home: false, watch: true, shorts: false });
});
