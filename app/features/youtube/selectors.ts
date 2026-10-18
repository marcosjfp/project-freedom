// Last public signed-out desktop inspection: 17 October 2026, Chromium 156.
// These selectors describe known components, not every YouTube experiment.
const safety =
  ':not(:has(dialog, [role="dialog"], ytd-consent-bump-v2-lightbox, ytd-player, #movie_player, ytd-playlist-panel-renderer, form, input))';
const outsidePlaylist = ':not(ytd-playlist-panel-renderer *)';
const home =
  'ytd-app ytd-browse[page-subtype="home"]:not([hidden]) ytd-rich-grid-renderer > #contents';
const search = 'ytd-app ytd-search:not([hidden])';
const watch =
  'ytd-app ytd-watch-flexy:not([hidden]) #related ytd-watch-next-secondary-results-renderer #items';
const subscriptions =
  'ytd-app ytd-browse[page-subtype="subscriptions"]:not([hidden])';
const browseShorts = [home, search, watch, subscriptions];
const modernShelf =
  'grid-shelf-view-model:has(ytm-shorts-lockup-view-model):not(:has(ytd-video-renderer, yt-lockup-view-model, ytd-playlist-panel-video-renderer))';

export const YOUTUBE_SELECTORS = {
  home: [
    `${home} > :is(ytd-rich-item-renderer, ytd-rich-section-renderer)${safety}`,
  ],
  shorts: [
    ...browseShorts.flatMap((root) => [
      `${root} ytd-reel-shelf-renderer${safety}`,
      `${root} ytd-rich-shelf-renderer[is-shorts]${safety}`,
      `${root} ${modernShelf}${safety}`,
    ]),
    'ytd-app ytd-guide-entry-renderer:has(a[href="/shorts"], a[href="/shorts/"], a[href^="/shorts/?"])',
    'ytd-app ytd-mini-guide-entry-renderer:has(a[href="/shorts"], a[href="/shorts/"], a[href^="/shorts/?"])',
  ],
  watch: [
    `${watch} :is(yt-lockup-view-model, ytd-compact-video-renderer, ytd-compact-playlist-renderer)${outsidePlaylist}${safety}`,
  ],
} as const;

export const SELECTOR_VERIFICATION = {
  inspectedOn: '2026-10-17',
  modernSearchShorts:
    'Live grid-shelf-view-model with ytm-shorts-lockup-view-model observed.',
  modernWatch:
    'Live yt-lockup-view-model cards under #related/#items observed; playlist is a separate sibling.',
  home: 'Live home browse/grid/contents observed. Signed-out profile had no recommendation tiles; populated grid covered by fixtures.',
  legacyShelvesAndCards:
    'Semantic component fallbacks covered by fixtures; not seen live in this profile.',
  navigation:
    'Href-based entries covered by fixtures. Linkless Shorts navigation is left visible until a safe structural selector is verified.',
  subscriptions:
    'Signed-out route observed; populated signed-in feed remains unverified.',
} as const;
