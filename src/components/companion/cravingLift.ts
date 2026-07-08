import { makeMutable } from 'react-native-reanimated';

/**
 * Shared 0→1 lift for the Home companion while the craving sheet is open, so PP
 * peeks above the sheet. The craving screen drives it on mount / unmount (so it
 * drops the instant the sheet is dismissed by any means — button or swipe), and
 * Home reads it in an animated style. Module-level so both screens share it.
 */
export const cravingLift = makeMutable(0);
