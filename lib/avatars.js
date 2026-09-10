// Preset avatar system. Uses DiceBear's free, keyless HTTP API to render
// avatars as SVGs from a seed string — no image files to ship, no API key,
// works equally well as an <img src> on the client or a stored URL server-side.
// If you'd rather self-host avatars later, only avatarUrlForSeed() needs to change.

export const AVATAR_STYLE = 'avataaars';

// A fixed, curated set of seeds so the gallery is stable across reloads and
// deployments (the same seed always renders the same avatar).
export const AVATAR_PRESETS = [
  { id: 'flex', seed: 'Flex-Forge' },
  { id: 'blaze', seed: 'Blaze-Forge' },
  { id: 'nova', seed: 'Nova-Forge' },
  { id: 'titan', seed: 'Titan-Forge' },
  { id: 'echo', seed: 'Echo-Forge' },
  { id: 'rex', seed: 'Rex-Forge' },
  { id: 'luna', seed: 'Luna-Forge' },
  { id: 'atlas', seed: 'Atlas-Forge' },
  { id: 'sage', seed: 'Sage-Forge' },
  { id: 'jett', seed: 'Jett-Forge' },
  { id: 'ivy', seed: 'Ivy-Forge' },
  { id: 'ryder', seed: 'Ryder-Forge' },
  { id: 'zara', seed: 'Zara-Forge' },
  { id: 'kai', seed: 'Kai-Forge' },
  { id: 'remy', seed: 'Remy-Forge' },
  { id: 'storm', seed: 'Storm-Forge' },
];

export function avatarUrlForSeed(seed) {
  return `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;
}

export const PRESET_AVATAR_URLS = AVATAR_PRESETS.map((p) => ({
  id: p.id,
  url: avatarUrlForSeed(p.seed),
}));

// Deterministic pick from a stable key (e.g. the new username) so re-running
// this for the same user always lands on the same avatar instead of
// reshuffling on every call.
export function pickRandomAvatarSeed(stableKey) {
  const key = stableKey && stableKey.length ? stableKey : Math.random().toString(36).slice(2);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PRESETS.length;
  return AVATAR_PRESETS[index].seed;
}

export function randomAvatarUrl(stableKey) {
  return avatarUrlForSeed(pickRandomAvatarSeed(stableKey));
}

export function isPresetAvatarUrl(url) {
  return typeof url === 'string' && url.startsWith('https://api.dicebear.com/');
}
