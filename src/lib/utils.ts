export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || '';
}

export function getAppHost(): string {
  if (typeof window !== 'undefined') {
    return window.location.host;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_URL).host;
    } catch {
      return 'fanmeet.app';
    }
  }
  return 'fanmeet.app';
}
