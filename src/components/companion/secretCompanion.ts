import type { ImageSourcePropType } from 'react-native';

/**
 * Secret frames — the secret companion (unlocked only for her).
 *
 * Hand-drawn smooth-line poses, all normalized to a single locked canvas
 * (720×780) so PP never jumps between frames: the blue background was keyed out
 * and every frame re-anchored to a shared centre-line + ground-line, then
 * quantized to PNG8. The state machine in `SecretCompanion` swaps these
 * frames to build idle blinks, ambient moves, and tap actions.
 */
export const PP_FRAMES = {
  base: require('../../../assets/companion/secret/base.png'),
  blink: require('../../../assets/companion/secret/blink.png'),
  inclined: require('../../../assets/companion/secret/inclined.png'),
  sad: require('../../../assets/companion/secret/sad.png'),
  arms: require('../../../assets/companion/secret/arms.png'),
  pancake: require('../../../assets/companion/secret/pancake.png'),
  ham1: require('../../../assets/companion/secret/ham1.png'),
  ham2: require('../../../assets/companion/secret/ham2.png'),
  ham3: require('../../../assets/companion/secret/ham3.png'),
  giro: require('../../../assets/companion/secret/giro.png'),
  back: require('../../../assets/companion/secret/back.png'),
  // Sitting set (shares one locked canvas of its own).
  sit: require('../../../assets/companion/secret/sit.png'),
  sit_blink: require('../../../assets/companion/secret/sit_blink.png'),
  sit_sad: require('../../../assets/companion/secret/sit_sad.png'),
  cookie1: require('../../../assets/companion/secret/cookie1.png'),
  cookie2: require('../../../assets/companion/secret/cookie2.png'),
} satisfies Record<string, ImageSourcePropType>;

export type PPFrame = keyof typeof PP_FRAMES;

/** Frame canvas aspect (width / height) — all frames share it. */
export const PP_ASPECT = 714 / 780;

type Action = { end: 'stand' | 'sit'; steps: [PPFrame, number][] };

/**
 * Tap actions. Each is a list of [frame, ms] steps played once, then the machine
 * settles into `end` posture. Sequences bridge big pose gaps with the natural
 * in-between frames (sit / arms) so the swaps read smoothly.
 */
export const PP_ACTIONS = {
  // Lean over and hold it a while — a "basic movement".
  lean: {
    end: 'stand',
    steps: [
      ['inclined', 4500],
      ['base', 1],
    ],
  },
  // Hold up the pancakes to show them off (doesn't eat them).
  pancake: {
    end: 'stand',
    steps: [
      ['arms', 220],
      ['pancake', 2600],
      ['arms', 220],
      ['base', 1],
    ],
  },
  // Pick up the hamster friend and show it, then set it down.
  hamster: {
    end: 'stand',
    steps: [
      ['ham1', 300],
      ['ham2', 260],
      ['ham3', 3200],
      ['ham2', 220],
      ['arms', 220],
      ['base', 1],
    ],
  },
  // Turn around and wave, then face front again.
  giro: {
    end: 'stand',
    steps: [
      ['giro', 440],
      ['back', 1000],
      ['giro', 440],
      ['base', 1],
    ],
  },
  // Sit down, nibble the cookie (loop the two bite frames), stand back up.
  cookieStand: {
    end: 'stand',
    steps: [
      ['sit', 300],
      ['cookie1', 380],
      ['cookie2', 300],
      ['cookie1', 300],
      ['cookie2', 300],
      ['cookie1', 300],
      ['cookie2', 300],
      ['cookie1', 260],
      ['sit', 320],
      ['base', 1],
    ],
  },
  // Same as cookieStand but PP stays seated at the end instead of standing up.
  cookieStandStay: {
    end: 'sit',
    steps: [
      ['sit', 300],
      ['cookie1', 380],
      ['cookie2', 300],
      ['cookie1', 300],
      ['cookie2', 300],
      ['cookie1', 300],
      ['cookie2', 300],
      ['cookie1', 260],
      ['sit', 1],
    ],
  },
  // Nibble the cookie while already seated (stays seated).
  cookieSit: {
    end: 'sit',
    steps: [
      ['cookie1', 380],
      ['cookie2', 300],
      ['cookie1', 300],
      ['cookie2', 300],
      ['cookie1', 300],
      ['cookie2', 300],
      ['cookie1', 260],
      ['sit', 1],
    ],
  },
} satisfies Record<string, Action>;

export type PPActionId = keyof typeof PP_ACTIONS;
