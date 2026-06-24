import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

const DURATION_SEC = 180; // "this craving passes in ~3 minutes"
const R = 80;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * R;

/** A 3-minute "this will pass" countdown with a progress ring. */
export function CravingTimer() {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(DURATION_SEC);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const offset = CIRCUMFERENCE * (1 - remaining / DURATION_SEC);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const done = remaining <= 0;

  return (
    <View className="items-center gap-6 py-4">
      <View className="h-[200px] w-[200px] items-center justify-center">
        <Svg width={200} height={200}>
          <Circle
            cx={100}
            cy={100}
            r={R}
            stroke={colors.primary['100']}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={100}
            cy={100}
            r={R}
            stroke={colors.primary['500']}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
          />
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-4xl font-bold text-ink dark:text-neutral-50">
            {minutes}:{String(seconds).padStart(2, '0')}
          </Text>
        </View>
      </View>
      <Text className="px-6 text-center text-base leading-6 text-ink-soft dark:text-neutral-300">
        {done ? t('craving.timer.done') : t('craving.timer.message')}
      </Text>
    </View>
  );
}
