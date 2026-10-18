import { defineConfig } from 'wxt';

export default defineConfig({
  manifestVersion: 3,
  modules: ['@wxt-dev/module-react'],
  // Manual loading avoids the optional web-ext browser-launch dependency.
  webExt: { disabled: true },
  // The supported Chromium has native modulepreload; omit its legacy fetch polyfill.
  vite: () => ({ build: { modulePreload: { polyfill: false } } }),
  manifest: {
    permissions: ['storage'],
    name: 'Project Freedom (Prototype)',
    action: {
      default_title: 'Project Freedom',
    },
  },
});
