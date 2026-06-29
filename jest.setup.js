// Jest setup: provide an in-memory AsyncStorage so persisted Zustand stores can
// be imported in tests without the native module. See:
// https://react-native-async-storage.github.io/async-storage/docs/advanced/jest
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
