import { Text, View } from 'react-native';

/** Room reserved for the bubble. It sits at the bottom of this box and grows
 *  upward into it, so a longer line never pushes the companion down. */
const BOX_H = 150;

/**
 * A little speech bubble shown just above the companion on Home. The bubble
 * itself still sizes to its text — it's simply bottom-anchored inside a
 * fixed-height box, so growing from one line to two expands upward instead of
 * shoving the companion around.
 */
export function SpeechBubble({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View
      className="w-full items-center justify-end"
      style={{ height: BOX_H }}
    >
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
