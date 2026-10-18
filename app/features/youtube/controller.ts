import type { SettingsRepository } from '../settings/repository';
import { deriveRules, MARKERS, shieldStylesheet } from './rules';

interface ControllerOptions {
  document: Document;
  url: string | URL;
  repository: SettingsRepository;
}
export interface YouTubeController {
  setUrl(url: string | URL): void;
  dispose(): void;
}
const mounted = new WeakMap<Document, YouTubeController>();

export function mountYouTubeShield({
  document,
  url,
  repository,
}: ControllerOptions): YouTubeController {
  mounted.get(document)?.dispose();
  const root = document.documentElement;
  let currentUrl = url;
  let disposed = false;
  let style: HTMLStyleElement | undefined;
  const previous = new Map<string, string | null>();

  function setMarker(name: string, value: string | null) {
    if (!previous.has(name)) previous.set(name, root.getAttribute(name));
    if (value === null) root.removeAttribute(name);
    else root.setAttribute(name, value);
  }
  function clearEffects() {
    style?.remove();
    style = undefined;
    previous.forEach((value, name) => {
      if (value === null) root.removeAttribute(name);
      else root.setAttribute(name, value);
    });
    previous.clear();
  }
  function update() {
    if (disposed) return;
    const rules = deriveRules(currentUrl, repository.getSnapshot());
    if (!rules.home && !rules.shorts && !rules.watch) {
      clearEffects();
      return;
    }
    setMarker(MARKERS.route, rules.route);
    setMarker(MARKERS.home, rules.home ? '' : null);
    setMarker(MARKERS.shorts, rules.shorts ? '' : null);
    setMarker(MARKERS.watch, rules.watch ? '' : null);
    if (!style) {
      style = document.createElement('style');
      style.id = 'project-freedom-youtube-style';
      style.textContent = shieldStylesheet;
      (document.head ?? root).append(style);
    }
  }
  const unsubscribe = repository.subscribe(update);
  const controller: YouTubeController = {
    setUrl(nextUrl) {
      currentUrl = nextUrl;
      update();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      clearEffects();
      if (mounted.get(document) === controller) mounted.delete(document);
    },
  };
  mounted.set(document, controller);
  update();
  return controller;
}
