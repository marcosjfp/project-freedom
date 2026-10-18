import { useState } from 'react';
import { browser } from 'wxt/browser';
import { ProjectHeader } from '../../components/ProjectHeader';
import { SettingsPanel } from '../../components/SettingsPanel';

export default function App() {
  const [navigationError, setNavigationError] = useState(false);
  return (
    <main className="popup" aria-labelledby="project-title">
      <ProjectHeader />
      <p className="preview-note">
        <strong>YouTube controls · Desktop website</strong>
        Choose what to hide. Some layouts may remain visible.
      </p>
      <SettingsPanel />
      <footer className="project-footer">
        <button
          type="button"
          onClick={() => {
            setNavigationError(false);
            void browser.runtime
              .openOptionsPage()
              .catch(() => setNavigationError(true));
          }}
        >
          Settings & privacy
        </button>
        {navigationError && (
          <p role="alert">
            Could not open settings. Try the extension’s Options menu.
          </p>
        )}
        <p>No activity recording. No accounts.</p>
        <p className="version">
          Prototype {browser.runtime.getManifest().version}
        </p>
      </footer>
    </main>
  );
}
