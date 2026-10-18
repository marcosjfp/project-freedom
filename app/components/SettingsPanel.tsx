import { useEffect, useRef, useState } from 'react';
import type { SettingsRepository } from '../features/settings/repository';
import { useSettings } from '../hooks/useSettings';
import { ToggleField } from './ToggleField';

export function SettingsPanel({
  repository,
}: {
  repository?: SettingsRepository;
}) {
  const state = useSettings(repository);
  const [confirmReset, setConfirmReset] = useState(false);
  const resetTrigger = useRef<HTMLButtonElement>(null);
  const cancelReset = useRef<HTMLButtonElement>(null);
  const resetWasOpen = useRef(false);
  useEffect(() => {
    if (confirmReset) cancelReset.current?.focus();
    else if (resetWasOpen.current) resetTrigger.current?.focus();
    resetWasOpen.current = confirmReset;
  }, [confirmReset]);
  const disabled = state.status !== 'ready' || state.busy;
  const resetAvailable =
    (state.status === 'ready' || state.status === 'unsupported') && !state.busy;

  return (
    <>
      {state.status === 'unsupported' && (
        <p role="alert" className="error-message">
          Saved preferences use an unsupported format. Update this prototype or
          reset preferences to start again. Your saved data has not been
          replaced.
        </p>
      )}
      {state.error && (
        <p role="alert" className="error-message">
          {state.error}
        </p>
      )}
      {state.status === 'error' && (
        <button type="button" onClick={() => void state.repository.retry()}>
          Retry loading
        </button>
      )}
      <fieldset className="settings-fields" disabled={disabled}>
        <legend className="visually-hidden">Your YouTube preferences</legend>
        <ToggleField
          label="Enable selected controls"
          description="Keep your selections when switched off."
          checked={state.settings.enabled}
          onChange={(v) => void state.repository.setSetting('enabled', v)}
        />
        <ToggleField
          label="Hide home recommendations"
          description="Keep search and deliberate browsing available."
          checked={state.settings.hideHomeRecommendations}
          onChange={(v) =>
            void state.repository.setSetting('hideHomeRecommendations', v)
          }
        />
        <ToggleField
          label="Hide Shorts discovery"
          description="Keep directly opened Shorts links available."
          checked={state.settings.hideShortsDiscovery}
          onChange={(v) =>
            void state.repository.setSetting('hideShortsDiscovery', v)
          }
        />
        <ToggleField
          label="Hide watch recommendations"
          description="Keep the video player and playlists available."
          checked={state.settings.hideWatchRecommendations}
          onChange={(v) =>
            void state.repository.setSetting('hideWatchRecommendations', v)
          }
        />
      </fieldset>
      <p role="status" className="save-status">
        {state.status === 'loading'
          ? 'Loading preferences…'
          : state.busy
            ? 'Saving…'
            : state.status === 'error'
              ? 'Preferences are unavailable.'
              : state.status === 'unsupported'
                ? 'Controls are paused for this saved format.'
                : (state.notice ?? 'Preferences stay in this browser profile.')}
      </p>
      <div className="reset-section">
        {confirmReset ? (
          <div role="group" aria-label="Confirm reset">
            <p>Reset your saved selections? All controls will be off.</p>
            <div className="button-row">
              <button
                type="button"
                ref={cancelReset}
                disabled={state.busy}
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!resetAvailable}
                onClick={() => {
                  void state.repository.reset().then((success) => {
                    if (success) setConfirmReset(false);
                  });
                }}
              >
                Confirm reset
              </button>
            </div>
          </div>
        ) : (
          <button
            ref={resetTrigger}
            type="button"
            className="text-button"
            disabled={!resetAvailable}
            onClick={() => setConfirmReset(true)}
          >
            Reset preferences
          </button>
        )}
      </div>
    </>
  );
}
