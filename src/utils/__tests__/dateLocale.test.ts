import { formatMedium, setDateLocale, dateLocaleTag, todayISO, addDaysISO } from '@/utils/date';

describe('date locale', () => {
  it('formats human dates in English by default', () => {
    setDateLocale('en');
    expect(formatMedium('2026-07-17')).toBe('Jul 17, 2026');
    expect(dateLocaleTag()).toBe('en-US');
  });
  it('formats human dates in Spanish when the app is Spanish', () => {
    setDateLocale('es');
    expect(formatMedium('2026-07-17')).toBe('17 jul 2026');
    expect(dateLocaleTag()).toBe('es-ES');
  });
  it('leaves MACHINE formats locale-free (plans must stay ISO)', () => {
    setDateLocale('es');
    expect(todayISO(new Date(2026, 6, 17))).toBe('2026-07-17');
    expect(addDaysISO('2026-07-17', 3)).toBe('2026-07-20');
  });
});
