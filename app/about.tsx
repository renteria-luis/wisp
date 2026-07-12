import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { personal } from '@/personal/personal.config';
import { inputText } from '@/theme/inputText';
import { colors } from '@/theme/tokens';

const VERSION = '1.0.0';

export default function About() {
  const router = useRouter();
  const { t } = useTranslation();

  // Hidden easter egg: 7 quick taps on the heart open a 4-digit code prompt.
  const taps = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState('');

  const onHeartTap = () => {
    taps.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => (taps.current = 0), 1500);
    if (taps.current >= 7) {
      taps.current = 0;
      setCode('');
      setCodeOpen(true);
    }
  };

  const closeCode = () => {
    setCodeOpen(false);
    setCode('');
  };

  const submitCode = () => {
    const c = code.trim();
    closeCode();
    if (c === '3019') {
      // Activate God mode.
      router.push('/godmode');
    }
    // Any other code: silently closed.
  };

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-row justify-end px-6 pt-5">
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

      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-4xl font-bold text-primary-600">
          {personal.appName}
        </Text>
        <Text className="mt-1 text-sm text-ink-mute">
          {t('about.version', { version: VERSION })}
        </Text>

        <View className="mt-10 items-center">
          <Pressable
            onPress={onHeartTap}
            accessibilityRole="button"
            accessibilityLabel="♥"
            hitSlop={14}
          >
            <Text className="text-2xl text-accent-500">♥</Text>
          </Pressable>
          <Text className="mt-2 text-center text-base font-medium text-ink">
            {personal.dedicationLine}
          </Text>
        </View>

        <Text className="mt-10 text-center text-sm leading-6 text-ink-soft">
          {t('about.privacy')}
        </Text>
        <Text className="mt-2 text-center text-xs text-ink-mute">
          {t('about.madeBy', { name: personal.authorName })}
        </Text>
      </View>

      <Text className="px-8 pb-6 text-center text-xs text-ink-mute">
        {t('common.notMedicalAdvice')}
      </Text>

      <Modal
        visible={codeOpen}
        transparent
        animationType="fade"
        onRequestClose={closeCode}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 items-center justify-center bg-black/40 px-10"
        >
          <View className="w-full max-w-[320px] rounded-2xl bg-neutral-0 p-5">
            <Text className="text-center text-lg font-bold text-ink">
              {t('egg.title')}
            </Text>
            <TextInput
              value={code}
              onChangeText={(v) =>
                setCode(v.replace(/[^0-9]/g, '').slice(0, 4))
              }
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
              placeholder="••••"
              placeholderTextColor={colors.ink.mute}
              onSubmitEditing={submitCode}
              style={inputText}
              className="mt-4 rounded-xl border border-neutral-200 px-4 py-3 text-center text-2xl tracking-[8px] text-ink"
            />
            <View className="mt-5 flex-row justify-end gap-6">
              <Pressable
                onPress={closeCode}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text className="text-base font-medium text-ink-mute">
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={submitCode}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text className="text-base font-semibold text-primary-600">
                  {t('common.ok')}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
