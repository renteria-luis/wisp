import type { ImageSourcePropType } from 'react-native';

const base = require('../../../assets/companion/secret/base.png');

/**
 * Secret frames — the secret companion (unlocked only for her).
 *
 * FRAME-BASED animation (not video clips): swap transparent PNGs at a low fps for
 * that hand-drawn "boil" look. Drop new frames into
 * `assets/companion/secret/` and register them here:
 *  - `idle`: 2–3 slightly re-drawn variants of the standing pose. Cycled at a low
 *    fps they make the wobbly outline shimmer (line boil). One frame = static.
 *  - `blink`: a single eyes-closed frame.
 *  - `actions`: short sequences (3–4 frames each) played once on tap, e.g.
 *    `cookie` (sit + eat), `hamster` (hug the friend), `wave`, `turn`.
 * Keep every frame the SAME square canvas + framing so nothing jumps.
 */
export const POMPOM: {
  idle: ImageSourcePropType[];
  blink: ImageSourcePropType | null;
  actions: Record<string, ImageSourcePropType[]>;
} = {
  idle: [base],
  blink: null,
  actions: {},
};
