import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Companion } from '@/components/companion/Companion';
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
  onPress,
}: {
  cosmetic: Cosmetic;
  owned: boolean;
  equipped: boolean;
  onPress: (c: Cosmetic) => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={() => onPress(cosmetic)}
      accessibilityRole="button"
      className={`w-[30%] items-center rounded-2xl border bg-neutral-0 p-3 ${
        equipped ? 'border-primary-500' : 'border-neutral-200'
      }`}
    >
      <View
        style={{ backgroundColor: cosmetic.swatch }}
        className="h-12 w-12 rounded-full"
      />
      <Text className="mt-2 text-[11px] text-ink-mute">
        {t(`cosmeticType.${cosmetic.type}`)}
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
  const { score, band } = useVitality();
  const balance = useEconomy((s) => s.balance);
  const spend = useEconomy((s) => s.spend);
  const owned = useCompanion((s) => s.owned);
  const equipped = useCompanion((s) => s.equipped);
  const add = useCompanion((s) => s.add);
  const equip = useCompanion((s) => s.equip);

  const companionColor =
    cosmeticById(equipped.companion_color ?? '')?.swatch ??
    colors.primary['400'];
  const accessoryColor = cosmeticById(equipped.accessory ?? '')?.swatch;
  const rotation = useMemo(() => dailyRotation(todayISO()), []);

  const onPressCosmetic = async (c: Cosmetic) => {
    if (owned.includes(c.id)) {
      equip(c);
      void Haptics.selectionAsync();
      return;
    }
    if (balance >= c.price) {
      const ok = await spend(c.price);
      if (ok) {
        add(c.id);
        equip(c);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const isEquipped = (c: Cosmetic) => equipped[c.type] === c.id;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 px-6 pb-10 pt-4">
        <View className="items-center">
          <Companion
            vitality={score}
            band={band}
            color={companionColor}
            accessoryColor={accessoryColor}
          />
        </View>

        <View className="flex-row items-center gap-2 self-center rounded-full bg-accent-100 px-5 py-2">
          <View className="h-4 w-4 rounded-full bg-accent-500" />
          <Text className="text-base font-bold text-accent-700">
            {t('space.coins', { count: balance })}
          </Text>
        </View>

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
              onPress={onPressCosmetic}
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
              onPress={onPressCosmetic}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
