import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const PHASES = [
  { key: 'inhale', duration: 4000, scale: 1 },
  { key: 'hold', duration: 4000, scale: 1 },
  { key: 'exhale', duration: 6000, scale: 0.55 },
] as const;

/** A calming inhale–hold–exhale breathing circle with a haptic on each phase. */
export function BreathingGuide() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const scale = useSharedValue(0.55);

  useEffect(() => {
    const phase = PHASES[index]!;
    scale.value = withTiming(phase.scale, {
      duration: phase.duration,
      easing: Easing.inOut(Easing.ease),
    });
    void Haptics.selectionAsync();
    const id = setTimeout(
      () => setIndex((i) => (i + 1) % PHASES.length),
      phase.duration,
    );
    return () => clearTimeout(id);
  }, [index, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="items-center gap-8 py-4">
      <View className="h-60 w-60 items-center justify-center">
        <Animated.View
          style={animatedStyle}
          className="h-48 w-48 rounded-full bg-primary-300"
        />
      </View>
      <Text className="text-2xl font-semibold text-ink">
        {t(`craving.breathing.${PHASES[index]!.key}`)}
      </Text>
    </View>
  );
}
