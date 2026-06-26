/**
 * Illustrated companion sprites (PNG) + wearable accessories.
 *
 * Each character has one image per vitality band (+ an optional blink frame).
 * Accessories are separate transparent PNGs positioned over the companion box;
 * `x`/`y`/`scale` are fractions of the box and are meant to be eyeballed/tuned.
 */
import type { ImageSourcePropType } from 'react-native';

import type { VitalityState } from '@/types/domain';

export interface SpriteSet {
  base: Record<VitalityState, ImageSourcePropType>;
  blink?: ImageSourcePropType;
}

export const CHARACTER_SPRITES: Record<string, SpriteSet> = {
  cat: {
    base: {
      radiant: require('../../../assets/companion/cat/radiant.png'),
      okay: require('../../../assets/companion/cat/okay.png'),
      tired: require('../../../assets/companion/cat/tired.png'),
      exhausted: require('../../../assets/companion/cat/exhausted.png'),
    },
    blink: require('../../../assets/companion/cat/blink.png'),
  },
};

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

// Placement is a first-pass guess (the art is centred in its own 500² frame);
// fine-tune these four numbers per item once it's visible on a device.
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

export function hasSprite(character?: string): boolean {
  return !!character && character in CHARACTER_SPRITES;
}
