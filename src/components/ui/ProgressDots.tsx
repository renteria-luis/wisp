import { View } from 'react-native';

type Props = {
  index: number;
  total: number;
};

export function ProgressDots({ index, total }: Props) {
  return (
    <View className="flex-row gap-2" accessibilityRole="progressbar">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-2 rounded-full ${
            i === index ? 'w-6 bg-primary-500' : 'w-2 bg-primary-200'
          }`}
        />
      ))}
    </View>
  );
}
