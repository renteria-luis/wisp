import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/NumberField';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useProgressData } from '@/hooks/useProgressData';
import { useSettings } from '@/store/useSettings';
import { sortByPrice, useWishlist } from '@/store/useWishlist';
import { colors } from '@/theme/tokens';
import { formatMedium } from '@/utils/date';

/** Manage the "save up for" wishlist; each item fills as smoke-free savings grow. */
export default function Wishlist() {
  const router = useRouter();
  const { t } = useTranslation();
  const items = useWishlist((s) => s.items);
  const purchased = useWishlist((s) => s.purchased);
  const add = useWishlist((s) => s.add);
  const remove = useWishlist((s) => s.remove);
  const markBought = useWishlist((s) => s.markBought);
  const currency = useSettings((s) => s.pricing.currency);
  const { saved } = useProgressData();

  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const sorted = sortByPrice(items);
  const canAdd = name.trim().length > 0 && price != null && price > 0;

  const onAdd = () => {
    if (!canAdd || price == null) return;
    add(name, price, note);
    setName('');
    setPrice(null);
    setNote('');
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <Text className="text-xl font-bold text-ink dark:text-neutral-50">
          {t('wishlist.title')}
        </Text>
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

      <ScrollView contentContainerClassName="gap-4 px-5 pb-12 pt-2">
        <Text className="text-sm leading-5 text-ink-soft dark:text-neutral-300">
          {t('wishlist.subtitle')}
        </Text>

        <Card>
          <View className="gap-3">
            <View>
              <Text className="mb-1 text-sm font-medium text-ink-soft dark:text-neutral-300">
                {t('wishlist.itemName')}
              </Text>
              <View className="rounded-xl border border-neutral-200 bg-neutral-0 px-4 dark:border-neutral-800 dark:bg-neutral-900">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('wishlist.itemPlaceholder')}
                  placeholderTextColor={colors.ink.mute}
                  className="py-3 text-base text-ink dark:text-neutral-50"
                />
              </View>
            </View>
            <NumberField
              label={t('wishlist.itemPrice')}
              value={price}
              onChange={setPrice}
              decimal
              suffix={currency}
            />
            <View>
              <Text className="mb-1 text-sm font-medium text-ink-soft dark:text-neutral-300">
                {t('wishlist.note')}
              </Text>
              <View className="rounded-xl border border-neutral-200 bg-neutral-0 px-4 dark:border-neutral-800 dark:bg-neutral-900">
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={t('wishlist.notePlaceholder')}
                  placeholderTextColor={colors.ink.mute}
                  className="py-3 text-base text-ink dark:text-neutral-50"
                />
              </View>
            </View>
            <Button
              label={t('wishlist.add')}
              onPress={onAdd}
              disabled={!canAdd}
            />
          </View>
        </Card>

        {sorted.length === 0 ? (
          <Text className="mt-2 text-center text-sm text-ink-mute dark:text-neutral-400">
            {t('wishlist.empty')}
          </Text>
        ) : (
          sorted.map((item) => {
            const pct = item.price > 0 ? Math.min(1, saved / item.price) : 1;
            const done = saved >= item.price;
            return (
              <Card key={item.id}>
                <View className="flex-row items-start justify-between">
                  <Text className="flex-1 pr-3 text-base font-semibold text-ink dark:text-neutral-50">
                    {item.name}
                  </Text>
                  <Pressable
                    onPress={() => remove(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.cancel')}
                    hitSlop={8}
                    className="px-1"
                  >
                    <Text className="text-base text-ink-mute dark:text-neutral-400">
                      ✕
                    </Text>
                  </Pressable>
                </View>
                <View className="mb-2 mt-1 flex-row items-baseline justify-between">
                  <Text className="text-sm text-ink-mute dark:text-neutral-400">
                    {item.price.toFixed(2)} {currency}
                  </Text>
                  <Text
                    className={`text-sm font-bold ${
                      done
                        ? 'text-primary-600'
                        : 'text-ink-soft dark:text-neutral-300'
                    }`}
                  >
                    {done ? t('wishlist.reached') : `${Math.round(pct * 100)}%`}
                  </Text>
                </View>
                <ProgressBar progress={pct} />
                {item.note ? (
                  <Text className="mt-2 text-xs text-ink-mute dark:text-neutral-400">
                    {item.note}
                  </Text>
                ) : null}
                {done ? (
                  <View className="mt-3">
                    <Button
                      label={t('wishlist.bought')}
                      onPress={() => markBought(item.id)}
                    />
                  </View>
                ) : null}
              </Card>
            );
          })
        )}

        {purchased.length > 0 ? (
          <>
            <Text className="mt-4 text-sm font-semibold text-ink dark:text-neutral-50">
              {t('wishlist.treatedTitle')}
            </Text>
            {purchased.map((p) => (
              <Card key={p.id}>
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 pr-3 text-base font-semibold text-ink dark:text-neutral-50">
                    🎁 {p.name}
                  </Text>
                  <Text className="text-sm text-ink-mute dark:text-neutral-400">
                    {p.price.toFixed(2)} {currency}
                  </Text>
                </View>
                <Text className="mt-1 text-xs text-ink-mute dark:text-neutral-400">
                  {formatMedium(p.purchasedAt)}
                </Text>
              </Card>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
