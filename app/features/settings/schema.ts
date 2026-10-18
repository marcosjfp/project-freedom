export const SETTINGS_KEYS = {
  enabled: 'pf.enabled',
  hideHomeRecommendations: 'pf.youtube.hideHomeRecommendations',
  hideShortsDiscovery: 'pf.youtube.hideShortsDiscovery',
  hideWatchRecommendations: 'pf.youtube.hideWatchRecommendations',
} as const;
export const SCHEMA_KEY = 'pf.schemaVersion';
export const OWNED_KEYS = [SCHEMA_KEY, ...Object.values(SETTINGS_KEYS)];
export const SCHEMA_VERSION = 1;
export type Setting = keyof typeof SETTINGS_KEYS;
export type Settings = Readonly<Record<Setting, boolean>>;
export type StoredValues = Record<string, unknown>;
export const DEFAULT_SETTINGS: Settings = Object.freeze({
  enabled: false,
  hideHomeRecommendations: false,
  hideShortsDiscovery: false,
  hideWatchRecommendations: false,
});

export function decodeSettings(raw: StoredValues) {
  const empty = OWNED_KEYS.every((key) => !Object.hasOwn(raw, key));
  const supported = empty || raw[SCHEMA_KEY] === SCHEMA_VERSION;
  const settings: Settings = supported
    ? Object.freeze({
        enabled: raw[SETTINGS_KEYS.enabled] === true,
        hideHomeRecommendations:
          raw[SETTINGS_KEYS.hideHomeRecommendations] === true,
        hideShortsDiscovery: raw[SETTINGS_KEYS.hideShortsDiscovery] === true,
        hideWatchRecommendations:
          raw[SETTINGS_KEYS.hideWatchRecommendations] === true,
      })
    : DEFAULT_SETTINGS;
  return { supported, settings };
}

export function effectiveSettings(
  settings: Settings,
  supported = true,
): Settings {
  return supported && settings.enabled ? settings : DEFAULT_SETTINGS;
}
