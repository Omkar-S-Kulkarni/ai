import 'fake-indexeddb/auto'

// Mock navigator.storage
if (typeof navigator !== 'undefined') {
  if (!navigator.storage) {
    // @ts-expect-error Mocking navigator.storage
    navigator.storage = {
      estimate: async () => ({ usage: 1024 * 1024, quota: 50 * 1024 * 1024 }),
    }
  }
}
