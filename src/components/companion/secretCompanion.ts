import type { ImageSourcePropType } from 'react-native';

/**
 * Secret frames — the secret companion (unlocked only for her).
 *
 * Hand-drawn smooth-line poses, all normalized to a single locked canvas
 * (823×780) so PP never jumps between frames: the background was keyed out and
 * every frame was re-anchored to a shared centre-line + ground-line, then
 * quantized to PNG8. The state machine in `SecretCompanion` swaps these
 * frames to build idle blinks, ambient moves, and tap actions.
 */
export const PP_FRAMES = {
  base: require('../../../assets/companion/secret/base.png'),
  blink: require('../../../assets/companion/secret/blink.png'),
  inclined: require('../../../assets/companion/secret/inclined.png'),
  sad: require('../../../assets/companion/secret/sad.png'),
  sit: require('../../../assets/companion/secret/sit.png'),
  arms: require('../../../assets/companion/secret/arms.png'),
  pancake: require('../../../assets/companion/secret/pancake.png'),
  ham1: require('../../../assets/companion/secret/ham1.png'),
  ham2: require('../../../assets/companion/secret/ham2.png'),
  ham3: require('../../../assets/companion/secret/ham3.png'),
  cookie1: require('../../../assets/companion/secret/cookie1.png'),
  cookie2: require('../../../assets/companion/secret/cookie2.png'),
  cookie3: require('../../../assets/companion/secret/cookie3.png'),
} satisfies Record<string, ImageSourcePropType>;

export type PPFrame = keyof typeof PP_FRAMES;

/** Frame canvas aspect (width / height) — all frames share it. */
export const PP_ASPECT = 823 / 780;

/**
 * Tap actions. Each is a list of [frame, ms] steps played once, then the
 * machine returns to idle. Sequences bridge big pose gaps with the natural
 * in-between frames (sit / arms) so the swap reads smoothly.
 */
export const PP_ACTIONS = {
  // A quick lean and back — a "basic movement".
  lean: [
    ['inclined', 640],
    ['base', 1],
  ],
  // Hold up the pancakes to show them off (doesn't eat them).
  pancake: [
    ['arms', 220],
    ['pancake', 2600],
    ['arms', 220],
    ['base', 1],
  ],
  // Pick up the hamster friend and show it, then set it down.
  hamster: [
    ['ham1', 300],
    ['ham2', 260],
    ['ham3', 3200],
    ['ham2', 220],
    ['arms', 220],
    ['base', 1],
  ],
  // Sit down and nibble the cookie (loop the two bite frames a few times).
  cookie: [
    ['sit', 300],
    ['cookie1', 360],
    ['cookie2', 200],
    ['cookie3', 200],
    ['cookie2', 200],
    ['cookie3', 200],
    ['cookie2', 200],
    ['cookie3', 200],
    ['cookie1', 260],
    ['sit', 300],
    ['base', 1],
  ],
} satisfies Record<string, [PPFrame, number][]>;

export type PPActionId = keyof typeof PP_ACTIONS;
