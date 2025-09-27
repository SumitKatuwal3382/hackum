// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock ResizeObserver for tests (jsdom doesn't implement it)
class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}
if (!window.ResizeObserver) {
	window.ResizeObserver = ResizeObserverMock;
}
