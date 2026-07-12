import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { useTutorialTarget } from '@/components/tutorial/useTutorialTarget';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { NumberField } from '@/components/ui/NumberField';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useProgressData } from '@/hooks/useProgressData';
import { useCelebration } from '@/store/useCelebration';
import { useSettings } from '@/store/useSettings';
import { useTutorial } from '@/store/useTutorial';
import { useTutorialSandbox } from '@/store/useTutorialSandbox';
import {
  type PurchasedItem,
  sortByPrice,
  useWishlist,
  type WishItem,
} from '@/store/useWishlist';
import { inputText } from '@/theme/inputText';
import { colors } from '@/theme/tokens';
import { formatMedium, nowISO } from '@/utils/date';

/** Manage the "save up for" wishlist; each item fills as smoke-free savings grow. */
export default function Wishlist() {
  const router = useRouter();
  const { t } = useTranslation();
  const realItems = useWishlist((s) => s.items);
  const realPurchased = useWishlist((s) => s.purchased);
  const add = useWishlist((s) => s.add);
  const remove = useWishlist((s) => s.remove);
  const markBought = useWishlist((s) => s.markBought);
  const celebrate = useCelebration((s) => s.celebrate);
  const currency = useSettings((s) => s.pricing.currency);
  // `saved` already reads the sandbox (20 pretend savings) during the tour.
  const { saved } = useProgressData();

  // Guided tour: this screen runs on the practice wishlist — the user types the
  // suggested item, "buys" it with the pretend savings, and sees where treats
  // land, without touching the real list.
  const tourOn = useTutorial((s) => s.active);
  const sbxWishlist = useTutorialSandbox((s) => s.wishlist);
  const formTarget = useTutorialTarget('wishlist-form');
  const itemTarget = useTutorialTarget('wishlist-item');
  const treatedTarget = useTutorialTarget('wishlist-treated');
  const setScroller = useTutorial((s) => s.setScroller);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!tourOn) return;
    setScroller('wishlist', (targetWindowY) => {
      const desired = insets.top + 120;
      scrollRef.current?.scrollTo({
        y: Math.max(0, scrollY.current + (targetWindowY - desired)),
        animated: true,
      });
    });
    return () => setScroller('wishlist', undefined);
  }, [tourOn, setScroller, insets.top]);

  const items: WishItem[] = tourOn
    ? sbxWishlist
        .filter((w) => !w.purchased)
        .map((w) => ({ id: w.id, name: w.name, price: w.price, createdAt: nowISO() }))
    : realItems;
  const purchased: PurchasedItem[] = tourOn
    ? sbxWishlist
        .filter((w) => w.purchased)
        .map((w) => ({
          id: w.id,
          name: w.name,
          price: w.price,
          createdAt: nowISO(),
          purchasedAt: nowISO(),
        }))
    : realPurchased;

  const onBought = (id: string, itemName: string) => {
    if (tourOn) {
      // Practice purchase: move it to the sandbox's treated list and let the
      // tour advance to show where it landed.
      useTutorialSandbox.getState().purchaseWish(id);
      useTutorial.getState().signalAction('wish-buy');
      return;
    }
    markBought(id);
    celebrate('🎁', t('celebrate.bought', { name: itemName }));
  };

  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const sorted = sortByPrice(items);
  const canAdd = name.trim().length > 0 && price != null && price > 0;

  const onAdd = () => {
    if (!canAdd || price == null) return;
    const added = name.trim();
    if (tourOn) {
      // The tour asks for a specific practice item; accept only that one so the
      // instructions and what appears on screen stay in sync.
      const nm = added.toLowerCase();
      const okName = nm === 'pants' || nm === 'pantalones';
      if (!okName || price !== 20) return;
      Keyboard.dismiss();
      useTutorialSandbox.getState().addWish(added, 20);
      setName('');
      setPrice(null);
      setNote('');
      useTutorial.getState().signalAction('wish-add');
      return;
    }
    add(name, price, note);
    Keyboard.dismiss();
    celebrate('🎁', t('wishlist.added', { name: added }));
    setName('');
    setPrice(null);
    setNote('');
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950">
      <KeyboardAvoider>
      <View className="flex-row items-center justify-between px-6 pb-3 pt-5">
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

      <ScrollView
        ref={scrollRef}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        contentContainerClassName="gap-4 px-6 pb-12 pt-2"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text className="text-sm leading-5 text-ink-soft dark:text-neutral-300">
          {t('wishlist.subtitle')}
        </Text>

        <View ref={formTarget.ref}>
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
                  style={inputText}
                  className="py-4 text-base text-ink dark:text-neutral-50"
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
                  style={inputText}
                  className="py-4 text-base text-ink dark:text-neutral-50"
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
        </View>

        {sorted.length === 0 ? (
          <View className="mt-6 items-center">
            <Text className="mt-3 text-center text-sm text-ink-mute dark:text-neutral-400">
              {t('wishlist.empty')}
            </Text>
          </View>
        ) : (
          sorted.map((item, idx) => {
            const pct = item.price > 0 ? Math.min(1, saved / item.price) : 1;
            const done = saved >= item.price;
            return (
              <View key={item.id} ref={idx === 0 ? itemTarget.ref : undefined}>
              <Card>
                <View className="flex-row items-start justify-between">
                  <Text className="flex-1 pr-3 text-base font-semibold text-ink dark:text-neutral-50">
                    {item.name}
                  </Text>
                  <Pressable
                    onPress={() => (tourOn ? undefined : remove(item.id))}
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
                      onPress={() => onBought(item.id, item.name)}
                    />
                  </View>
                ) : null}
              </Card>
              </View>
            );
          })
        )}

        {purchased.length > 0 ? (
          <View ref={treatedTarget.ref}>
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
          </View>
        ) : null}
      </ScrollView>
      </KeyboardAvoider>
      <TutorialOverlay scope="modal" />
    </SafeAreaView>
  );
}
