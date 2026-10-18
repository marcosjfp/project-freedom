import assert from 'node:assert/strict';

export function expectedManifest(pkg) {
  return {
    manifest_version: 3,
    name: 'Project Freedom (Prototype)',
    description: pkg.description,
    version: pkg.version,
    permissions: ['storage'],
    action: { default_title: 'Project Freedom', default_popup: 'popup.html' },
    options_ui: { open_in_tab: true, page: 'options.html' },
    content_scripts: [
      {
        matches: ['https://www.youtube.com/*'],
        all_frames: false,
        run_at: 'document_idle',
        js: ['content-scripts/youtube.js'],
        world: 'ISOLATED',
      },
    ],
  };
}
export function validateManifest(manifest, pkg) {
  // Reject every unexpected field, including capabilities added by future tooling.
  assert.deepEqual(
    manifest,
    expectedManifest(pkg),
    'Production manifest differs from the reviewed capability contract',
  );
}
