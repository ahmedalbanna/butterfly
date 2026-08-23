type EventName =
  | 'view_product'
  | 'add_to_bag'
  | 'remove_from_bag'
  | 'begin_checkout'
  | 'purchase'
  | 'stylist_open'
  | 'stylist_message'
  | 'voice_call_start'
  | 'voice_call_end'
  | 'sparkle_interact'
  | 'filter_shop';

type EventProps = Record<string, string | number | boolean | undefined>;

export function track(event: EventName, props?: EventProps) {
  // Console in dev, ready to swap with GA4 / Mixpanel / Firebase Analytics
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics]', event, props);
  }
  try {
    // Example: window.gtag?.('event', event, props)
    // firebase analytics: logEvent(analytics, event, props)
    if (typeof window !== 'undefined' && (window as unknown as { dataLayer?: unknown[] }).dataLayer) {
      (window as unknown as { dataLayer: unknown[] }).dataLayer.push({ event, ...props });
    }
  } catch {}
}

export function trackSparkle(productId: string) {
  track('sparkle_interact', { productId });
}
