import { browser } from 'wxt/browser';
import { ProjectHeader } from '../../components/ProjectHeader';
import { SettingsPanel } from '../../components/SettingsPanel';

export default function App() {
  return (
    <main className="options" aria-labelledby="project-title">
      <ProjectHeader />
      <p className="preview-note">
        <strong>YouTube controls · Desktop website</strong>
        Choose which discovery sections you see. Switch the master control off
        to restore our changes. Some layouts may remain visible.
      </p>
      <h2>Your YouTube preferences</h2>
      <SettingsPanel />
      <section className="privacy-section" aria-labelledby="privacy-title">
        <h2 id="privacy-title">Your choices stay here</h2>
        <p>
          This prototype stores only the master choice, three feature choices,
          and their settings format version in this browser profile. Preferences
          are not synced or uploaded. No account is needed.
        </p>
        <p>
          It does not record browsing activity, searches, videos, messages, age,
          or health information. Reset removes its own preferences. Browser
          profiles and backups are controlled by your device and browser.
        </p>
        <p>
          Controls hide supported discovery sections while keeping search,
          subscriptions, directly opened videos, and playlists available. They
          will not change YouTube’s recommendation system or data practices.
        </p>
        <p>
          Site access is limited to top-level pages on www.youtube.com. The
          extension checks the current route and page structure locally, without
          saving or uploading them. Native apps, embedded videos, autoplay, and
          recommendations inside the player are outside this prototype’s scope.
          After disabling or updating the extension in your browser, reload open
          YouTube tabs to clear previously applied controls.
        </p>
      </section>
      <footer className="project-footer">
        <p>
          Prototype {browser.runtime.getManifest().version} · Local preferences
          only
        </p>
      </footer>
    </main>
  );
}
