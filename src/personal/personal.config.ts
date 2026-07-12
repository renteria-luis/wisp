/**
 * Personal configuration — EDIT ME (PROJECT.md §11).
 *
 * A single file holding the dedication + easter-egg text. Kept deliberately
 * out of the i18n locale files (these stay in English and are personal). A
 * future public build just swaps this file to neutralize the personal touches.
 */
export const personal = {
  appName: 'Wisp',
  companionDefaultName: 'Wisp',
  dedicateeName: 'Tiffani',
  authorName: 'Luis',
  dedicationLine: 'Made with ♥ for Tiffani',

  /** Optional 'MM-DD' anniversary for a special-date greeting. */
  specialDate: null as string | null,
  /** Optional meaningful number for the savings/streak easter egg. */
  specialNumber: null as number | null,

  easterEggs: {
    companionLongPress:
      "Tiffani — I'm proud of you. Every hard day is worth it. — Luis",
    savingsOrStreakNote: "Look how far you've come. I knew you could. — Luis",
    hiddenSpaceNote: 'L ♥ T',
    specialDateGreeting:
      "Happy day, Tiffani. Today, like every day, I'm in your corner.",
  },
} as const;

export type Personal = typeof personal;
