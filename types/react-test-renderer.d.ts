// Minimal ambient types for `react-test-renderer` (no @types package is
// installed in this toolchain). Covers only the surface our tests use.
declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';

  export interface TestInstance {
    props: Record<string, any>;
    type: unknown;
    children: (TestInstance | string)[];
    findAll(predicate: (node: TestInstance) => boolean): TestInstance[];
    findByType(type: unknown): TestInstance;
    findByProps(props: Record<string, unknown>): TestInstance;
  }

  export interface ReactTestRenderer {
    toJSON(): unknown;
    root: TestInstance;
    unmount(): void;
    update(element: ReactElement): void;
  }

  export function create(element: ReactElement): ReactTestRenderer;
  export function act(callback: () => void | Promise<void>): void;

  const TestRenderer: {
    create: typeof create;
    act: typeof act;
  };
  export default TestRenderer;
}
