import type { ReactNode } from 'react';
import { View } from 'react-native';

type Props = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: Props) {
  return (
    <View
      className={`rounded-2xl border border-neutral-200 bg-neutral-0 p-4 ${className}`}
    >
      {children}
    </View>
  );
}
