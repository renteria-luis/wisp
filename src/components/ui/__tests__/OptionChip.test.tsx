import { describe, expect, it, jest } from '@jest/globals';
import TestRenderer, {
  act,
  type ReactTestRenderer,
  type TestInstance,
} from 'react-test-renderer';

import { OptionChip } from '../OptionChip';

// RNTL v14's `render` wrapper does not bind queries under this jest-expo / React
// 19 toolchain, so we drive react-test-renderer directly — it renders the real
// component (NativeWind className and all) and lets us inspect/press it.
function renderChip(props: {
  label: string;
  selected: boolean;
  onPress: () => void;
}): ReactTestRenderer {
  let tr!: ReactTestRenderer;
  act(() => {
    tr = TestRenderer.create(<OptionChip {...props} />);
  });
  return tr;
}

describe('OptionChip', () => {
  it('renders its label', () => {
    const tr = renderChip({ label: 'Coffee', selected: false, onPress: () => {} });
    expect(JSON.stringify(tr.toJSON())).toContain('Coffee');
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const tr = renderChip({ label: 'Coffee', selected: false, onPress });
    const button = tr.root.findAll(
      (n: TestInstance) =>
        n.props.accessibilityRole === 'button' &&
        typeof n.props.onPress === 'function',
    )[0]!;
    act(() => button.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reflects the selected state for assistive tech', () => {
    const tr = renderChip({ label: 'Tea', selected: true, onPress: () => {} });
    const button = tr.root.findAll(
      (n: TestInstance) => n.props.accessibilityState != null,
    )[0]!;
    expect(button.props.accessibilityState).toMatchObject({ selected: true });
  });
});
