import type { AnalyticsEventName } from "@/app/_game/types";

export function trackEvent(
  _name: AnalyticsEventName,
  _properties: Record<string, string | number | boolean | null> = {},
) {
  void _name;
  void _properties;
  // No-op in MVP. Kept as the stable integration point for future analytics.
}
