import { Image } from 'expo-image';
import { Pressable } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const GIFT = require('../../../assets/companion/secret/gift.png');
const ASPECT = 620 / 512;

/**
 * The secret companion holding a gift — static art shown in the wishlist. It
 * doesn't animate on its own; a tap gives it one soft "breath".
 */
export function GiftBuddy({ size = 148 }: { size?: number }) {
  const breath = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.06 }],
  }));

  const onTap = () => {
    breath.value = withSequence(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
    );
  };

  return (
    <Pressable onPress={onTap} accessibilityRole="image" accessibilityLabel="gift">
      <Animated.View style={style}>
        <Image
          source={GIFT}
          style={{ width: size * ASPECT, height: size }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </Pressable>
  );
}
