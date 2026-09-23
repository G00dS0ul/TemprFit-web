// Mock implementation of next/headers for test execution

let mockCookies = new Map();

export function setMockCookies(cookieObj) {
  mockCookies = new Map(Object.entries(cookieObj));
}

export function clearMockCookies() {
  mockCookies = new Map();
}

export function cookies() {
  return {
    get(name) {
      if (!mockCookies.has(name)) return undefined;
      return { name, value: mockCookies.get(name) };
    },
    set(name, value) {
      mockCookies.set(name, value);
    },
    delete(name) {
      mockCookies.delete(name);
    },
  };
}

let mockHeaders = new Headers();

export function setMockHeaders(headerObj) {
  mockHeaders = new Headers(headerObj);
}

export function clearMockHeaders() {
  mockHeaders = new Headers();
}

export function headers() {
  return mockHeaders;
}
