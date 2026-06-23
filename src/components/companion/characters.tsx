/**
 * Companion character silhouettes (the unlockable `character` cosmetic).
 *
 * Each character is just a body shape (+ ears / tail / gills / wings). The
 * shared face — eyes, mouth, cheeks, glow, bob — is drawn by `Companion`, so
 * every creature reuses the same vitality-driven expression system and is
 * tinted by the equipped `companion_color`. Designs are original.
 *
 * The viewBox is 100×100; the face zone lives around x30–70 / y45–80, so every
 * body keeps that area clear and adds its silhouette features around it.
 */
import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

/** Soft accents that stay constant regardless of the body tint. */
const PINK = '#f3a8bd';
const CREAM = '#fff7ef';

export const DEFAULT_CHARACTER = 'char_wisp';

export interface CharacterParts {
  /** Drawn behind the body (tails, gills, wings) — same tint as the body. */
  behind?: (color: string) => ReactNode;
  /** The body silhouette plus ears / tuft / accents, in the body tint. */
  body: (color: string) => ReactNode;
}

export const CHARACTERS: Record<string, CharacterParts> = {
  // The original wisp — a soft teardrop spirit. Default, always owned.
  char_wisp: {
    body: (c) => (
      <Path
        d="M50 14 C64 26 80 40 78 60 C76 82 62 92 50 92 C38 92 24 82 22 60 C20 40 36 26 50 14 Z"
        fill={c}
      />
    ),
  },

  // Cat — rounded body, triangle ears, a little curled tail.
  char_cat: {
    behind: (c) => (
      <Path d="M82 74 C96 72 96 90 84 88 C90 84 88 78 82 74 Z" fill={c} />
    ),
    body: (c) => (
      <G>
        <Path d="M24 36 L28 14 L48 32 Z" fill={c} />
        <Path d="M76 36 L72 14 L52 32 Z" fill={c} />
        <Path d="M30 33 L32 21 L43 31 Z" fill={PINK} opacity={0.85} />
        <Path d="M70 33 L68 21 L57 31 Z" fill={PINK} opacity={0.85} />
        <Path
          d="M50 28 C70 28 82 44 82 62 C82 83 68 93 50 93 C32 93 18 83 18 62 C18 44 30 28 50 28 Z"
          fill={c}
        />
      </G>
    ),
  },

  // Bunny — tall splayed ears with a pink inner.
  char_bunny: {
    body: (c) => (
      <G>
        <Path d="M43 32 C39 14 39 3 45 4 C49 5 48 20 48 32 Z" fill={c} />
        <Path d="M57 32 C61 14 61 3 55 4 C51 5 52 20 52 32 Z" fill={c} />
        <Path d="M44 30 C42 16 44 9 46 9 C47 14 47 22 47 30 Z" fill={PINK} opacity={0.8} />
        <Path d="M56 30 C58 16 56 9 54 9 C53 14 53 22 53 30 Z" fill={PINK} opacity={0.8} />
        <Path
          d="M50 28 C70 28 82 44 82 62 C82 83 68 93 50 93 C32 93 18 83 18 62 C18 44 30 28 50 28 Z"
          fill={c}
        />
      </G>
    ),
  },

  // Fox — pointy ears, a big fluffy tail with a cream tip, cream muzzle.
  char_fox: {
    behind: (c) => (
      <G>
        <Path d="M22 64 C2 56 0 92 24 84 C16 78 16 70 22 64 Z" fill={c} />
        <Path d="M10 80 C2 78 4 90 15 86 C11 84 10 82 10 80 Z" fill={CREAM} opacity={0.9} />
      </G>
    ),
    body: (c) => (
      <G>
        <Path d="M26 34 L24 10 L48 30 Z" fill={c} />
        <Path d="M74 34 L76 10 L52 30 Z" fill={c} />
        <Path d="M30 31 L29 17 L43 29 Z" fill={PINK} opacity={0.8} />
        <Path d="M70 31 L71 17 L57 29 Z" fill={PINK} opacity={0.8} />
        <Path
          d="M50 30 C70 30 82 46 82 63 C82 84 68 93 50 93 C32 93 18 84 18 63 C18 46 30 30 50 30 Z"
          fill={c}
        />
        <Ellipse cx={50} cy={73} rx={19} ry={13} fill={CREAM} opacity={0.8} />
      </G>
    ),
  },

  // Axolotl — squat body with three feathery pink gills each side + top fin.
  char_axolotl: {
    behind: () => (
      <G fill={PINK}>
        <Path d="M16 42 C4 38 2 47 16 47 Z" />
        <Path d="M14 53 C0 50 -1 60 14 59 Z" />
        <Path d="M16 64 C4 62 3 72 16 70 Z" />
        <Path d="M84 42 C96 38 98 47 84 47 Z" />
        <Path d="M86 53 C100 50 101 60 86 59 Z" />
        <Path d="M84 64 C96 62 97 72 84 70 Z" />
      </G>
    ),
    body: (c) => (
      <G>
        <Path d="M44 33 C46 24 54 24 56 33 Z" fill={PINK} />
        <Path
          d="M50 32 C73 32 85 46 85 63 C85 83 69 93 50 93 C31 93 15 83 15 63 C15 46 27 32 50 32 Z"
          fill={c}
        />
      </G>
    ),
  },

  // Bird — round chick with a three-feather tuft and little wings.
  char_bird: {
    body: (c) => (
      <G>
        <Path d="M46 32 C40 20 46 12 49 24 Z" fill={c} />
        <Path d="M50 31 C47 17 53 17 50 31 Z" fill={c} />
        <Path d="M54 32 C60 20 54 12 51 24 Z" fill={c} />
        <Path
          d="M50 30 C70 30 82 46 82 63 C82 84 68 93 50 93 C32 93 18 84 18 63 C18 46 30 30 50 30 Z"
          fill={c}
        />
        <Path d="M18 66 C6 66 8 82 22 76 C18 73 17 70 18 66 Z" fill={c} />
        <Path d="M82 66 C94 66 92 82 78 76 C82 73 83 70 82 66 Z" fill={c} />
      </G>
    ),
  },
};

export function characterParts(id?: string): CharacterParts {
  return CHARACTERS[id ?? DEFAULT_CHARACTER] ?? CHARACTERS[DEFAULT_CHARACTER]!;
}

/** Tiny creature glyph for the shop tile — silhouette + two dot eyes. */
export function CharacterIcon({
  id,
  color,
  size = 44,
}: {
  id: string;
  color: string;
  size?: number;
}) {
  const parts = characterParts(id);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {parts.behind?.(color)}
      {parts.body(color)}
      <G fill={colors.ink.DEFAULT}>
        <Circle cx={41} cy={56} r={4} />
        <Circle cx={59} cy={56} r={4} />
      </G>
    </Svg>
  );
}
