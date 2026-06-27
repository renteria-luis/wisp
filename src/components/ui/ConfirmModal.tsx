import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from './Button';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** A pretty, in-app confirmation dialog (replaces the native OS alert). */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        onPress={onCancel}
        className="flex-1 items-center justify-center bg-black/40 px-6"
      >
        {/* Inner Pressable swallows taps so they don't close via the backdrop. */}
        <Pressable
          onPress={() => {}}
          className="w-full rounded-2xl bg-neutral-0 p-5 dark:bg-neutral-900"
        >
          <Text className="text-lg font-bold text-ink dark:text-neutral-50">
            {title}
          </Text>
          <Text className="mt-2 text-sm leading-5 text-ink-soft dark:text-neutral-300">
            {message}
          </Text>
          <View className="mt-5 gap-2">
            <Button label={confirmLabel} onPress={onConfirm} />
            <Button label={cancelLabel} variant="ghost" onPress={onCancel} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
