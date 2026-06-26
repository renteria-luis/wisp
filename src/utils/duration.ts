/**
 * Two-unit duration formatters for the recovery screen.
 * - `formatCountUp` — smoke-free time (counts up): s → m+s → h+m → d+h.
 * - `formatCountDown` — time to next milestone: m+s → h+m → d+h → mo+d → y+mo.
 * Seconds only appear in the smallest (sub-hour) tier, so only nearby
 * countdowns need to tick every second. Units come from i18n (`health.unit.*`).
 */
type Translate = (key: string, opts?: { count?: number }) => string;

const MIN = 60;
const HOUR = 3600;
const DAY = 86400;

function u(t: Translate, unit: string, count: number): string {
  return t(`health.unit.${unit}`, { count });
}

export function formatCountUp(totalSeconds: number, t: Translate): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < MIN) return u(t, 's', s);
  if (s < HOUR) return `${u(t, 'm', Math.floor(s / MIN))} ${u(t, 's', s % MIN)}`;
  if (s < 48 * HOUR)
    return `${u(t, 'h', Math.floor(s / HOUR))} ${u(t, 'm', Math.floor((s % HOUR) / MIN))}`;
  return `${u(t, 'd', Math.floor(s / DAY))} ${u(t, 'h', Math.floor((s % DAY) / HOUR))}`;
}

export function formatCountDown(totalSeconds: number, t: Translate): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < HOUR)
    return `${u(t, 'm', Math.floor(s / MIN))} ${u(t, 's', s % MIN)}`;
  if (s < 48 * HOUR)
    return `${u(t, 'h', Math.floor(s / HOUR))} ${u(t, 'm', Math.floor((s % HOUR) / MIN))}`;
  if (s < 60 * DAY)
    return `${u(t, 'd', Math.floor(s / DAY))} ${u(t, 'h', Math.floor((s % DAY) / HOUR))}`;
  if (s < 2 * 365 * DAY) {
    const months = Math.floor(s / (30 * DAY));
    return `${u(t, 'mo', months)} ${u(t, 'd', Math.floor((s % (30 * DAY)) / DAY))}`;
  }
  const years = Math.floor(s / (365 * DAY));
  return `${u(t, 'y', years)} ${u(t, 'mo', Math.floor((s % (365 * DAY)) / (30 * DAY)))}`;
}

/** True when a countdown is short enough to warrant 1-second ticking. */
export function countdownTicksSeconds(totalSeconds: number): boolean {
  return totalSeconds < HOUR;
}
