/**
 * Personal configuration (PROJECT.md §11).
 *
 * Everything the app says that is *personal* — the dedication, the hidden notes,
 * who it was made for — lives here and nowhere else. That is not decoration: it
 * means a build for someone else is a one-file swap, and nothing private can
 * leak into a screen it was never written for.
 *
 * This is the neutral copy: the warmth is real, but every word is written for
 * whoever happens to be holding the phone. The only name in it is the author's,
 * which is a credit rather than a confidence.
 */
export const personal = {
  appName: 'Wisp',
  companionDefaultName: 'Wisp',
  /** Falls back into the companion's greeting if the user never gave a name. */
  dedicateeName: 'friend',
  authorName: 'Luis Renteria',
  dedicationLine: 'Made with ♥',

  /** Optional 'MM-DD' anniversary for a special-date greeting. */
  specialDate: null as string | null,
  /** Optional meaningful number for the savings/streak easter egg. */
  specialNumber: null as number | null,

  easterEggs: {
    /** hiddenSpaceNote is dead copy — the Space tab it belonged to was dropped.
     *  Kept so the shape stays in step with the personal build's copy. */
    companionLongPress: "I'm proud of you. Every hard day is worth it.",
    savingsOrStreakNote: "Look how far you've come. I knew you could.",
    hiddenSpaceNote: '♥',
    specialDateGreeting:
      "Happy day. Today, like every day, I'm in your corner.",
  },
} as const;

export type Personal = typeof personal;
