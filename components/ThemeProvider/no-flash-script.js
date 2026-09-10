// Stringified and inlined into <head> — must stay dependency-free and tiny.
export const noFlashScript = `
(function () {
  try {
    var pref = window.localStorage.getItem('repforge-theme') || 'system';
    var theme = pref;
    if (pref === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;
