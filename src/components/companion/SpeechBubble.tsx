import { Text, View } from 'react-native';

/** A little speech bubble shown just above the companion on Home. */
export function SpeechBubble({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View className="items-center pt-2">
      <View className="max-w-[330px] rounded-[28px] border border-neutral-200 bg-neutral-0 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <Text className="text-center text-xl font-medium leading-7 text-ink dark:text-neutral-100">
          {text}
        </Text>
      </View>
      {/* little tail pointing down at the companion */}
      <View className="-mt-2 h-4 w-4 rotate-45 border-b border-r border-neutral-200 bg-neutral-0 dark:border-neutral-800 dark:bg-neutral-900" />
    </View>
  );
}
