import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  title?: string;
  message: string;
};

/**
 * Minimal centered placeholder used by screens that are scaffolded but not yet
 * implemented. Replaced phase by phase as real screens land.
 */
export function PlaceholderScreen({ title, message }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950">
      <View className="flex-1 items-center justify-center px-8">
        {title ? (
          <Text className="mb-2 text-2xl font-semibold text-ink dark:text-neutral-50">
            {title}
          </Text>
        ) : null}
        <Text className="text-center text-base leading-6 text-ink-soft dark:text-neutral-300">
          {message}
        </Text>
      </View>
    </SafeAreaView>
  );
}
