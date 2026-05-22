type UmamiData = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    umami?: {
      track(event: string, data?: UmamiData): void;
    };
  }
}

export function track(event: string, data?: UmamiData): void {
  if (typeof window === "undefined" || !window.umami) return;
  window.umami.track(event, data);
}
