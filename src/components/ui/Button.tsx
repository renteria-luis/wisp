import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColors } from '@/theme/useThemeColors';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  /** `md` (default, full CTA) or `sm` (compact, e.g. an inline action). */
  size?: 'md' | 'sm';
  /** Optional leading icon (colour it yourself to match the label). */
  icon?: ReactNode;
};

/** How far the face sinks when pressed (also the height of the coloured lip). */
const LIFT = 5;
const SHADOW = {
  shadowColor: '#1a180f',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.16,
  shadowRadius: 9,
  elevation: 4,
};

type Skin = { face: string; lip: string; text: string; depth: boolean };

function skinFor(
  variant: Variant,
  c: ReturnType<typeof useThemeColors>,
  isDark: boolean,
): Skin {
  if (variant === 'primary') {
    return { face: c.primary['500'], lip: c.primary['700'], text: '#ffffff', depth: true };
  }
  if (variant === 'secondary') {
    return isDark
      ? { face: c.primary['800'], lip: c.primary['900'], text: c.primary['100'], depth: true }
      : { face: c.primary['100'], lip: c.primary['200'], text: c.primary['700'], depth: true };
  }
  return {
    face: 'transparent',
    lip: 'transparent',
    text: isDark ? c.neutral['300'] : c.ink.soft,
    depth: false,
  };
}

/**
 * A soft, chunky pill button: a coloured lip peeks under the face and the face
 * sinks onto it when pressed (with a little haptic), giving a tactile,
 * Secret-ish bounce. Colours track the light / dark / pink themes.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  size = 'md',
  icon,
}: Props) {
  const c = useThemeColors();
  const isDark = useColorScheme() === 'dark';
  const press = useSharedValue(0);

  const sm = size === 'sm';
  const lift = sm ? 4 : LIFT;
  const padV = sm ? 10 : 15;
  const padH = sm ? 18 : 24;
  const font = sm ? 14 : 16;

  const skin = skinFor(variant, c, isDark);
  const depth = skin.depth && !disabled;

  const faceColor = disabled ? c.neutral['200'] : skin.face;
  const lipColor = disabled ? c.neutral['200'] : skin.lip;
  const textColor = disabled ? c.ink.mute : skin.text;

  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: press.value * (depth ? lift : 0) },
      { scale: 1 - press.value * (depth ? 0 : 0.03) },
    ],
  }));

  return (
    <Pressable
      onPressIn={() => {
        press.value = withTiming(1, { duration: 60 });
      }}
      onPressOut={() => {
        press.value = withTiming(0, {
          duration: 130,
          easing: Easing.out(Easing.quad),
        });
      }}
      onPress={() => {
        if (disabled) return;
        void Haptics.selectionAsync();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <View
        style={[
          {
            borderRadius: 999,
            backgroundColor: depth ? lipColor : 'transparent',
            paddingBottom: depth ? lift : 0,
          },
          depth ? SHADOW : null,
        ]}
      >
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: icon ? 8 : 0,
              borderRadius: 999,
              paddingVertical: padV,
              paddingHorizontal: padH,
              backgroundColor: faceColor,
              borderWidth: variant === 'ghost' ? 1 : 0,
              borderColor:
                variant === 'ghost'
                  ? isDark
                    ? c.neutral['700']
                    : c.neutral['200']
                  : 'transparent',
            },
            faceStyle,
          ]}
        >
          {icon}
          <Text
            style={{
              color: textColor,
              fontSize: font,
              fontFamily: 'Changa_600SemiBold',
            }}
          >
            {label}
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}
