import { Text, View } from 'react-native';

/** A little speech bubble shown just above the companion on Home. */
export function SpeechBubble({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View className="items-center">
      <View className="max-w-[290px] rounded-2xl border border-neutral-200 bg-neutral-0 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
        <Text className="text-center text-sm leading-5 text-ink dark:text-neutral-100">
          {text}
        </Text>
      </View>
      {/* little tail pointing down at the companion */}
      <View className="-mt-1.5 h-3 w-3 rotate-45 border-b border-r border-neutral-200 bg-neutral-0 dark:border-neutral-800 dark:bg-neutral-900" />
    </View>
  );
}
