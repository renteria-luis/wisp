import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Companion } from '@/components/companion/Companion';
import { CharacterIcon } from '@/components/companion/characters';
import { Button } from '@/components/ui/Button';
import { COSMETICS, cosmeticById, dailyRotation } from '@/engine/cosmetics';
import { useVitality } from '@/hooks/useVitality';
import { useCompanion } from '@/store/useCompanion';
import { useEconomy } from '@/store/useEconomy';
import { colors } from '@/theme/tokens';
import type { Cosmetic } from '@/types/domain';
import { todayISO } from '@/utils/date';

function CosmeticTile({
  cosmetic,
  owned,
  equipped,
  previewing,
  onPress,
}: {
  cosmetic: Cosmetic;
  owned: boolean;
  equipped: boolean;
  previewing: boolean;
  onPress: (c: Cosmetic) => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={() => onPress(cosmetic)}
      accessibilityRole="button"
      className={`w-[30%] items-center rounded-2xl border bg-neutral-0 p-3 ${
        equipped
          ? 'border-primary-500'
          : previewing
            ? 'border-accent-400'
            : 'border-neutral-200'
      }`}
    >
      {cosmetic.type === 'character' ? (
        <CharacterIcon id={cosmetic.id} color={cosmetic.swatch} size={48} />
      ) : (
        <View
          style={{ backgroundColor: cosmetic.swatch }}
          className="h-12 w-12 rounded-full"
        />
      )}
      <Text className="mt-2 text-[11px] text-ink-mute">
        {cosmetic.type === 'character'
          ? t(`character.${cosmetic.id}`)
          : t(`cosmeticType.${cosmetic.type}`)}
      </Text>
      {equipped ? (
        <Text className="text-xs font-semibold text-primary-600">
          {t('space.equipped')}
        </Text>
      ) : owned ? (
        <Text className="text-xs font-medium text-ink-soft">
          {t('space.owned')}
        </Text>
      ) : (
        <Text className="text-xs font-semibold text-ink">{cosmetic.price}</Text>
      )}
    </Pressable>
  );
}

export default function Space() {
  const { t } = useTranslation();
  const router = useRouter();
  const { score, band } = useVitality();
  const balance = useEconomy((s) => s.balance);
  const pending = useEconomy((s) => s.pending);
  const spend = useEconomy((s) => s.spend);
  const claim = useEconomy((s) => s.claim);
  const owned = useCompanion((s) => s.owned);
  const equipped = useCompanion((s) => s.equipped);
  const add = useCompanion((s) => s.add);
  const equip = useCompanion((s) => s.equip);

  const [preview, setPreview] = useState<Cosmetic | null>(null);

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

  const equippedColor =
    cosmeticById(equipped.companion_color ?? '')?.swatch ??
    colors.primary['400'];
  const equippedAccessory = cosmeticById(equipped.accessory ?? '')?.swatch;

  const shownColor =
    preview?.type === 'companion_color' ? preview.swatch : equippedColor;
  const shownAccessory =
    preview?.type === 'accessory' ? preview.swatch : equippedAccessory;
  const shownCharacter =
    preview?.type === 'character' ? preview.id : equipped.character;

  const rotation = useMemo(() => dailyRotation(todayISO()), []);

  const onClaim = async () => {
    const amount = await claim();
    if (amount > 0)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const onPreview = (c: Cosmetic) => {
    setPreview(c);
    void Haptics.selectionAsync();
  };

  const onConfirmPreview = async () => {
    if (!preview) return;
    if (owned.includes(preview.id)) {
      equip(preview);
      void Haptics.selectionAsync();
      setPreview(null);
      return;
    }
    if (balance >= preview.price) {
      const ok = await spend(preview.price);
      if (ok) {
        add(preview.id);
        equip(preview);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        setPreview(null);
      }
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const isEquipped = (c: Cosmetic) => equipped[c.type] === c.id;
  const previewOwned = preview ? owned.includes(preview.id) : false;
  const canAfford = preview ? balance >= preview.price : false;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 px-6 pb-10 pt-4">
        <View className="items-center">
          <Companion
            vitality={score}
            band={band}
            color={shownColor}
            accessoryColor={shownAccessory}
            character={shownCharacter}
          />
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
          <View className="flex-row items-center justify-between rounded-2xl border border-accent-300 bg-accent-50 px-4 py-3">
            <View>
              <Text className="text-xs text-ink-mute">{t('space.earned')}</Text>
              <Text className="text-lg font-bold text-accent-700">
                {t('space.pending', { count: pending })}
              </Text>
            </View>
            <View className="w-32">
              <Button label={t('space.claim')} onPress={onClaim} />
            </View>
          </View>
        ) : null}

        {preview ? (
          <View className="gap-2 rounded-2xl border border-accent-300 bg-neutral-0 p-3">
            <View className="flex-row items-center gap-3">
              {preview.type === 'character' ? (
                <CharacterIcon id={preview.id} color={preview.swatch} size={32} />
              ) : (
                <View
                  style={{ backgroundColor: preview.swatch }}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <Text className="flex-1 text-sm font-medium text-ink">
                {preview.type === 'character'
                  ? t(`character.${preview.id}`)
                  : t(`cosmeticType.${preview.type}`)}
              </Text>
              <Pressable onPress={() => setPreview(null)} className="px-2 py-1">
                <Text className="text-sm text-ink-mute">
                  {t('common.close')}
                </Text>
              </Pressable>
            </View>
            {previewOwned ? (
              <Button label={t('space.equip')} onPress={onConfirmPreview} />
            ) : canAfford ? (
              <Button
                label={t('space.buyFor', { count: preview.price })}
                onPress={onConfirmPreview}
              />
            ) : (
              <Button
                label={t('space.need', { count: preview.price })}
                variant="secondary"
                onPress={onConfirmPreview}
                disabled
              />
            )}
          </View>
        ) : null}

        <Text className="mt-2 text-sm font-semibold text-ink">
          {t('space.dailyToday')}
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {rotation.map((c) => (
            <CosmeticTile
              key={c.id}
              cosmetic={c}
              owned={owned.includes(c.id)}
              equipped={isEquipped(c)}
              previewing={preview?.id === c.id}
              onPress={onPreview}
            />
          ))}
        </View>

        <Text className="mt-2 text-sm font-semibold text-ink">
          {t('space.shop')}
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {COSMETICS.map((c) => (
            <CosmeticTile
              key={c.id}
              cosmetic={c}
              owned={owned.includes(c.id)}
              equipped={isEquipped(c)}
              previewing={preview?.id === c.id}
              onPress={onPreview}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
