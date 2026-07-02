/**
 * Illustrated companion sprites (PNG) + wearable accessories.
 *
 * Each character has three faces: `base` (awake/content), `closed` (eyes shut —
 * reused for the blink AND for sleeping at night) and `sad` (when the day's
 * smoking crosses half the quota). Images are square 1024² with a transparent
 * background; the component draws them into a fixed box with `contain`, so the
 * exact source resolution never matters (see the note on the companion).
 *
 * Accessories are separate transparent PNGs positioned over the box; `x`/`y`/
 * `scale` are fractions of the box, meant to be eyeballed/tuned.
 */
import type { ImageSourcePropType } from 'react-native';

export interface SpriteSet {
  base: ImageSourcePropType;
  closed: ImageSourcePropType;
  sad: ImageSourcePropType;
}

export const CHARACTER_SPRITES: Record<string, SpriteSet> = {
  bunny: {
    base: require('../../../assets/companion/naked/bunny.png'),
    closed: require('../../../assets/companion/naked/bunny_closedeyes.png'),
    sad: require('../../../assets/companion/naked/bunny_sad.png'),
  },
  cat: {
    base: require('../../../assets/companion/naked/cat.png'),
    closed: require('../../../assets/companion/naked/cat_closedeyes.png'),
    sad: require('../../../assets/companion/naked/cat_sad.png'),
  },
  chick: {
    base: require('../../../assets/companion/naked/chick.png'),
    closed: require('../../../assets/companion/naked/chick_closedeyes.png'),
    sad: require('../../../assets/companion/naked/chick_sad.png'),
  },
  fox: {
    base: require('../../../assets/companion/naked/fox.png'),
    closed: require('../../../assets/companion/naked/fox_closedeyes.png'),
    sad: require('../../../assets/companion/naked/fox_sad.png'),
  },
};

export const SPRITE_CHARACTER_IDS = ['bunny', 'cat', 'chick', 'fox'] as const;

/** True if `character` maps to one of the illustrated sprite sets. */
export function hasSprite(character?: string): boolean {
  return !!character && character in CHARACTER_SPRITES;
}

/** Which sprite to show today when no specific one is chosen — rotates daily so
 *  all four characters get their turn (until the Space picker returns). */
export function characterForToday(nowMs = Date.now()): string {
  const day = Math.floor(nowMs / 86_400_000);
  return SPRITE_CHARACTER_IDS[day % SPRITE_CHARACTER_IDS.length]!;
}

export type AccessorySlot = 'body' | 'bow' | 'hat';

export interface SpriteAccessory {
  id: string;
  slot: AccessorySlot;
  price: number;
  art: ImageSourcePropType;
  /** Centre position as a fraction of the companion box. */
  x: number;
  y: number;
  /** Size as a fraction of the companion box. */
  scale: number;
  /** Draw order — higher renders on top. */
  z: number;
}

// Placement is a first-pass guess; fine-tune per item once visible on a device.
export const SPRITE_ACCESSORIES: SpriteAccessory[] = [
  {
    id: 'spr_hoodie',
    slot: 'body',
    price: 220,
    art: require('../../../assets/companion/accessories/hoodie.png'),
    x: 0.5,
    y: 0.62,
    scale: 0.94,
    z: 1,
  },
  {
    id: 'spr_bow',
    slot: 'bow',
    price: 100,
    art: require('../../../assets/companion/accessories/bow.png'),
    x: 0.5,
    y: 0.46,
    scale: 0.34,
    z: 2,
  },
  {
    id: 'spr_beanie',
    slot: 'hat',
    price: 150,
    art: require('../../../assets/companion/accessories/beanie.png'),
    x: 0.5,
    y: 0.2,
    scale: 0.6,
    z: 3,
  },
];

export function accessoryById(id: string): SpriteAccessory | undefined {
  return SPRITE_ACCESSORIES.find((a) => a.id === id);
}

/** Apply slot-exclusivity: wearing an item drops any other in the same slot. */
export function toggleWornId(worn: string[], id: string): string[] {
  const item = accessoryById(id);
  if (!item) return worn;
  if (worn.includes(id)) return worn.filter((w) => w !== id);
  const sameSlot = SPRITE_ACCESSORIES.filter((a) => a.slot === item.slot).map(
    (a) => a.id,
  );
  return [...worn.filter((w) => !sameSlot.includes(w)), id];
}
