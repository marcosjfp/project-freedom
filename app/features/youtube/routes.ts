export type YouTubeRoute =
  'home' | 'search' | 'watch' | 'subscriptions' | 'shorts' | 'unsupported';

export function classifyRoute(input: string | URL): YouTubeRoute {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return 'unsupported';
  }
  if (url.origin !== 'https://www.youtube.com') return 'unsupported';
  if (url.pathname === '/') return 'home';
  if (url.pathname === '/results') return 'search';
  if (url.pathname === '/watch') return 'watch';
  if (url.pathname === '/feed/subscriptions') return 'subscriptions';
  if (/^\/shorts\/[^/]+\/?$/.test(url.pathname)) return 'shorts';
  return 'unsupported';
}
