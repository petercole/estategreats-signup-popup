import '@testing-library/jest-dom/vitest'

// jsdom ships no matchMedia. Default every test to a desktop, fine-pointer
// device; individual tests override it when they need mobile timing.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    value: (query: string) => ({
      addEventListener: () => undefined,
      addListener: () => undefined,
      dispatchEvent: () => false,
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: () => undefined,
      removeListener: () => undefined,
    }),
    writable: true,
  })
}
