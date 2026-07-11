import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from './Button';
import { KeyboardAvoider } from './KeyboardAvoider';
import { ProgressDots } from './ProgressDots';
import { ThemeToggle } from './ThemeToggle';

type Props = {
  stepIndex: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  canGoBack?: boolean;
};

/** Shared onboarding layout: progress, title, scrollable body, footer nav. */
export function OnboardingStep({
  stepIndex,
  totalSteps,
  title,
  subtitle,
  children,
  onNext,
  nextLabel,
  nextDisabled,
  canGoBack = true,
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView
      className="flex-1 bg-cream dark:bg-neutral-950"
      edges={['top', 'bottom']}
    >
      <KeyboardAvoider>
      <ScrollView
        contentContainerClassName="grow px-6 pb-6 pt-4"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="flex-row items-center justify-between">
          <ProgressDots index={stepIndex} total={totalSteps} />
          <ThemeToggle />
        </View>
        <Text className="mt-6 text-2xl font-bold text-ink dark:text-neutral-50">
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-2 text-base leading-6 text-ink-soft dark:text-neutral-300">
            {subtitle}
          </Text>
        ) : null}
        <View className="mt-6 gap-5">{children}</View>
      </ScrollView>

      <View className="flex-row gap-3 px-6 pb-2 pt-2">
        {canGoBack ? (
          <View className="flex-1">
            <Button
              label={t('common.back')}
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>
        ) : null}
        <View className="flex-1">
          <Button
            label={nextLabel ?? t('common.next')}
            onPress={onNext}
            disabled={nextDisabled}
          />
        </View>
      </View>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}
