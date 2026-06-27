/**
 * Quick things to do to ride out a craving. IDs only — the copy lives in i18n
 * under `craving.distraction.items.<id>`. The toolkit shows a random handful and
 * remembers which ones actually helped (see `useDistractions`).
 */
export const DISTRACTIONS: string[] = [
  'water',
  'deepbreath',
  'walk',
  'text',
  'gum',
  'music',
  'stretch',
  'pushups',
  'coldface',
  'brushteeth',
  'snack',
  'tea',
  'mint',
  'shower',
  'call',
  'game',
  'video',
  'meditate',
  'journal',
  'draw',
  'tidy',
  'dishes',
  'pet',
  'plants',
  'dance',
  'sing',
  'run',
  'jumpingjacks',
  'squats',
  'fidget',
  'puzzle',
  'read',
  'podcast',
  'cook',
  'todo',
  'why',
  'treat',
  'savings',
  'futureself',
  'sunlight',
  'freshair',
  'countdown',
  'ice',
  'sour',
  'gratitude',
];

/** A random `n` ids, avoiding anything in `exclude` when possible. */
export function pickRandom(n: number, exclude: string[] = []): string[] {
  const pool = DISTRACTIONS.filter((d) => !exclude.includes(d));
  const source = pool.length >= n ? pool : DISTRACTIONS;
  const shuffled = [...source];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, n);
}
