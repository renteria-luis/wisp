import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/NumberField';
import { OptionChip } from '@/components/ui/OptionChip';
import { applyLanguage, type SupportedLanguage } from '@/i18n';
import {
  rescheduleTriggerNotifications,
  requestNotificationPermission,
} from '@/notifications/scheduler';
import { useSettings } from '@/store/useSettings';
import { applyTheme, type ThemePref } from '@/theme/appearance';
import { colors } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';
import type { Gender } from '@/types/domain';
import { exportAppData, wipeAppData } from '@/utils/appData';

const GENDERS: Gender[] = ['female', 'male', 'nonbinary', 'prefer_not'];
const CURRENCIES = ['USD', 'CAD', 'PEN'];
const LANGS: { value: SupportedLanguage | null; key: string }[] = [
  { value: null, key: 'auto' },
  { value: 'en', key: 'en' },
  { value: 'es', key: 'es' },
];
const THEMES: ThemePref[] = ['system', 'light', 'dark', 'pink'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-sm font-semibold uppercase tracking-wide text-ink-mute dark:text-neutral-400">
        {title}
      </Text>
      <Card>
        <View className="gap-4">{children}</View>
      </Card>
    </View>
  );
}

function TextField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-ink-soft dark:text-neutral-300">{label}</Text>
      <View className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-0 dark:bg-neutral-900 px-4">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.ink.mute}
          className="py-3 text-base text-ink dark:text-neutral-50"
        />
      </View>
    </View>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 23,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const step = (d: number) => onChange(Math.min(max, Math.max(min, value + d)));
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm font-medium text-ink-soft dark:text-neutral-300">{label}</Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => step(-1)}
          accessibilityRole="button"
          accessibilityLabel="−"
          className="h-9 w-9 items-center justify-center rounded-full bg-primary-100"
        >
          <Text className="text-lg font-bold text-primary-700">−</Text>
        </Pressable>
        <Text className="w-14 text-center text-base font-semibold text-ink dark:text-neutral-50">
          {String(value).padStart(2, '0')}:00
        </Text>
        <Pressable
          onPress={() => step(1)}
          accessibilityRole="button"
          accessibilityLabel="+"
          className="h-9 w-9 items-center justify-center rounded-full bg-primary-100"
        >
          <Text className="text-lg font-bold text-primary-700">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const router = useRouter();
  const s = useSettings();
  const c = useThemeColors();
  const [busy, setBusy] = useState(false);

  const quiet = s.quietHours ?? {
    start: { hour: 22, minute: 0 },
    end: { hour: 7, minute: 0 },
  };

  const reschedule = (enabled: boolean, q = s.quietHours) =>
    rescheduleTriggerNotifications(s.triggers, q, enabled);

  const onToggleNotifications = async (next: boolean) => {
    const enabled = next ? await requestNotificationPermission() : false;
    s.setNotificationsEnabled(enabled);
    await reschedule(enabled);
    if (next && !enabled) Alert.alert(t('settings.notifBlocked'));
  };

  const setQuiet = (patch: Partial<typeof quiet>) => {
    const q = { ...quiet, ...patch };
    s.setQuietHours(q);
    void reschedule(s.notificationsEnabled, q);
  };

  const onLanguage = (value: SupportedLanguage | null) => {
    s.setLanguage(value);
    applyLanguage(value);
    void Haptics.selectionAsync();
  };

  const onExport = async () => {
    setBusy(true);
    const result = await exportAppData();
    setBusy(false);
    if (result === 'unavailable') Alert.alert(t('settings.exportUnavailable'));
    else if (result === 'error') Alert.alert(t('settings.exportError'));
  };

  const onReset = () => {
    Alert.alert(t('settings.resetTitle'), t('settings.resetBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.resetConfirm'),
        style: 'destructive',
        onPress: async () => {
          await wipeAppData();
          router.replace('/welcome');
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950">
      <View className="flex-row items-center justify-between px-6 pb-3 pt-5">
        <Text className="text-xl font-bold text-ink dark:text-neutral-50">{t('settings.title')}</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={8}
          className="px-2 py-1"
        >
          <Text className="text-base font-medium text-primary-600">
            {t('common.close')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-6 px-6 pb-12 pt-2">
        <Section title={t('settings.you')}>
          <TextField
            label={t('settings.yourName')}
            value={s.userName}
            onChangeText={s.setUserName}
            placeholder={t('settings.yourNamePlaceholder')}
          />
          <TextField
            label={t('settings.companionName')}
            value={s.companionName}
            onChangeText={s.setCompanionName}
          />
        </Section>

        <Section title={t('settings.profile')}>
          <View>
            <Text className="mb-2 text-sm font-medium text-ink-soft dark:text-neutral-300">
              {t('settings.gender')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {GENDERS.map((g) => (
                <OptionChip
                  key={g}
                  label={t(`gender.${g}`)}
                  selected={s.profile.gender === g}
                  onPress={() => s.setProfile({ gender: g })}
                />
              ))}
            </View>
          </View>
          <NumberField
            label={t('settings.age')}
            value={s.profile.age ?? null}
            onChange={(v) => s.setProfile({ age: v ?? undefined })}
          />
          <NumberField
            label={t('settings.yearsSmoking')}
            value={s.profile.yearsSmoking ?? null}
            onChange={(v) => s.setProfile({ yearsSmoking: v ?? undefined })}
          />
        </Section>

        <Section title={t('settings.pricing')}>
          <NumberField
            label={t('settings.packPrice')}
            value={s.pricing.packPrice || null}
            onChange={(v) => s.setPricing({ packPrice: v ?? 0 })}
            decimal
            suffix={s.pricing.currency}
          />
          <NumberField
            label={t('settings.cigsPerPack')}
            value={s.pricing.cigsPerPack || null}
            onChange={(v) => s.setPricing({ cigsPerPack: v ?? 20 })}
          />
          <View>
            <Text className="mb-2 text-sm font-medium text-ink-soft dark:text-neutral-300">
              {t('settings.currency')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CURRENCIES.map((c) => (
                <OptionChip
                  key={c}
                  label={c}
                  selected={s.pricing.currency === c}
                  onPress={() => s.setPricing({ currency: c })}
                />
              ))}
            </View>
          </View>
        </Section>

        <Section title={t('settings.notifications')}>
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 pr-3 text-sm font-medium text-ink-soft dark:text-neutral-300">
              {t('settings.enableNotifications')}
            </Text>
            <Switch
              value={s.notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ true: c.primary['400'] }}
            />
          </View>
          <Text className="text-xs text-ink-mute dark:text-neutral-400">{t('settings.quietHours')}</Text>
          <Stepper
            label={t('settings.quietStart')}
            value={quiet.start.hour}
            onChange={(h) => setQuiet({ start: { hour: h, minute: 0 } })}
          />
          <Stepper
            label={t('settings.quietEnd')}
            value={quiet.end.hour}
            onChange={(h) => setQuiet({ end: { hour: h, minute: 0 } })}
          />
        </Section>

        <Section title={t('settings.language')}>
          <View className="flex-row flex-wrap gap-2">
            {LANGS.map((l) => (
              <OptionChip
                key={l.key}
                label={t(`settings.lang.${l.key}`)}
                selected={s.language === l.value}
                onPress={() => onLanguage(l.value)}
              />
            ))}
          </View>
        </Section>

        <Section title={t('settings.appearance')}>
          <View className="flex-row flex-wrap gap-2">
            {THEMES.map((th) => (
              <OptionChip
                key={th}
                label={t(`settings.theme.${th}`)}
                selected={s.theme === th}
                onPress={() => applyTheme(th)}
              />
            ))}
          </View>
        </Section>

        <Section title={t('settings.data')}>
          <Text className="text-xs leading-5 text-ink-mute dark:text-neutral-400">
            {t('settings.dataNote')}
          </Text>
          <Button
            label={busy ? t('settings.exporting') : t('settings.export')}
            variant="secondary"
            onPress={onExport}
            disabled={busy}
          />
          <Button
            label={t('settings.reset')}
            variant="ghost"
            onPress={onReset}
          />
        </Section>

        <Pressable
          onPress={() => router.push('/about')}
          accessibilityRole="button"
          className="items-center py-2"
        >
          <Text className="text-sm font-medium text-primary-600">
            {t('settings.about')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
