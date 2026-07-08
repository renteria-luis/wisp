import { Text, TextInput } from 'react-native';

/**
 * Make Changa the default font for every Text / TextInput.
 *
 * React Native has no CSS cascade, so a custom font only applies where it's set
 * explicitly. We patch the base components' default style; NativeWind weight
 * classes still layer on top, and iOS resolves the weight from the "Changa"
 * family. Call once, before the first render.
 */
type Defaultable = { defaultProps?: { style?: unknown } };

export function applyFontDefault(family = 'Changa'): void {
  for (const Comp of [Text, TextInput] as unknown as Defaultable[]) {
    Comp.defaultProps = Comp.defaultProps ?? {};
    Comp.defaultProps.style = [
      { fontFamily: family },
      Comp.defaultProps.style,
    ];
  }
}
