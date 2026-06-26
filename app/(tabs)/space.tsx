import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SpriteCompanion } from '@/components/companion/SpriteCompanion';
import {
  SPRITE_ACCESSORIES,
  toggleWornId,
  type SpriteAccessory,
} from '@/components/companion/sprites';
import { Button } from '@/components/ui/Button';
import { useVitality } from '@/hooks/useVitality';
import { personal } from '@/personal/personal.config';
import { useCompanion } from '@/store/useCompanion';
import { useEconomy } from '@/store/useEconomy';

function AccessoryTile({
  accessory,
  owned,
  worn,
  affordable,
  onPress,
}: {
  accessory: SpriteAccessory;
  owned: boolean;
  worn: boolean;
  affordable: boolean;
  onPress: (a: SpriteAccessory) => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={() => onPress(accessory)}
      accessibilityRole="button"
      className={`w-[30%] items-center rounded-2xl border bg-neutral-0 p-3 dark:bg-neutral-900 ${
        worn ? 'border-primary-500' : 'border-neutral-200 dark:border-neutral-800'
      }`}
    >
      <Image
        source={accessory.art}
        resizeMode="contain"
        style={{ height: 56, width: 56 }}
      />
      <Text className="mt-1 text-[11px] text-ink-mute dark:text-neutral-400">
        {t(`wear.${accessory.id}`)}
      </Text>
      {worn ? (
        <Text className="text-xs font-semibold text-primary-600">
          {t('space.worn')}
        </Text>
      ) : owned ? (
        <Text className="text-xs font-medium text-ink-soft dark:text-neutral-300">
          {t('space.owned')}
        </Text>
      ) : (
        <Text
          className={`text-xs font-semibold ${affordable ? 'text-ink dark:text-neutral-50' : 'text-ink-mute dark:text-neutral-400'}`}
        >
          {accessory.price}
        </Text>
      )}
    </Pressable>
  );
}

export default function Space() {
  const { t } = useTranslation();
  const router = useRouter();
  const { band } = useVitality();
  const balance = useEconomy((s) => s.balance);
  const pending = useEconomy((s) => s.pending);
  const spend = useEconomy((s) => s.spend);
  const claim = useEconomy((s) => s.claim);
  const owned = useCompanion((s) => s.owned);
  const add = useCompanion((s) => s.add);
  const worn = useCompanion((s) => s.worn);
  const setWorn = useCompanion((s) => s.setWorn);

  const [showHidden, setShowHidden] = useState(false);

  // Hidden God-mode trigger: 7 quick taps on the balance (dev builds only).
  const godTaps = useRef(0);
  const godTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBalanceTap = () => {
    if (!__DEV__) return;
    godTaps.current += 1;
    if (godTimer.current) clearTimeout(godTimer.current);
    godTimer.current = setTimeout(() => (godTaps.current = 0), 1500);
    if (godTaps.current >= 7) {
      godTaps.current = 0;
      router.push('/godmode');
    }
  };

  const onClaim = async () => {
    const amount = await claim();
    if (amount > 0)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const onAccessory = async (a: SpriteAccessory) => {
    if (owned.includes(a.id)) {
      setWorn(toggleWornId(worn, a.id));
      void Haptics.selectionAsync();
      return;
    }
    if (balance >= a.price) {
      const ok = await spend(a.price);
      if (ok) {
        add(a.id);
        setWorn(toggleWornId(worn, a.id));
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950" edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 px-6 pb-10 pt-4">
        <View className="flex-row justify-end">
          <Pressable
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel={t('settings.title')}
            hitSlop={8}
            className="px-2 py-1"
          >
            <Text className="text-xl">⚙️</Text>
          </Pressable>
        </View>

        <View className="items-center">
          <SpriteCompanion band={band} worn={worn} size={220} />
        </View>

        <Pressable
          onPress={onBalanceTap}
          className="flex-row items-center gap-2 self-center rounded-full bg-accent-100 px-5 py-2"
        >
          <View className="h-4 w-4 rounded-full bg-accent-500" />
          <Text className="text-base font-bold text-accent-700">
            {t('space.coins', { count: balance })}
          </Text>
        </Pressable>

        {pending > 0 ? (
          <View className="flex-row items-center justify-between rounded-2xl border border-accent-300 bg-accent-50 px-4 py-3 dark:bg-accent-900">
            <View>
              <Text className="text-xs text-ink-mute dark:text-neutral-400">
                {t('space.earned')}
              </Text>
              <Text className="text-lg font-bold text-accent-700">
                {t('space.pending', { count: pending })}
              </Text>
            </View>
            <View className="w-32">
              <Button label={t('space.claim')} onPress={onClaim} />
            </View>
          </View>
        ) : null}

        <Text className="mt-2 text-sm font-semibold text-ink dark:text-neutral-50">
          {t('space.dressUp')}
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {SPRITE_ACCESSORIES.map((a) => (
            <AccessoryTile
              key={a.id}
              accessory={a}
              owned={owned.includes(a.id)}
              worn={worn.includes(a.id)}
              affordable={balance >= a.price}
              onPress={onAccessory}
            />
          ))}
        </View>

        <Pressable
          onPress={() => setShowHidden((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="✦"
          hitSlop={8}
          className="items-center pt-6"
        >
          <Text className="text-base text-neutral-300">✦</Text>
        </Pressable>
        {showHidden ? (
          <Text className="text-center text-xs text-ink-mute dark:text-neutral-400">
            {personal.easterEggs.hiddenSpaceNote}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
