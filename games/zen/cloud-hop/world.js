// The course is generated independently of rendering, with bounded, jumpable gaps.
export const THEMES = [
  { name: 'Lilac skies', sky: '#d5cae9', fog: '#d9cfed', top: '#bfd28d', side: '#b5a5c6', leaf: '#98b96c', flower: '#f3d497' },
  { name: 'Mint meadows', sky: '#c9e1d8', fog: '#d2e8e0', top: '#b0cd8b', side: '#91b7ae', leaf: '#7ea679', flower: '#f3b7bf' },
  { name: 'Peach daydream', sky: '#f0d4c8', fog: '#f3dfd3', top: '#c4cd96', side: '#c3a59a', leaf: '#99b48a', flower: '#f5e6ab' },
  { name: 'Blue day out', sky: '#c8dded', fog: '#d7e6ee', top: '#b2d4a7', side: '#a0afc8', leaf: '#83b497', flower: '#e4c4ee' },
];
export function randomSeed() {
  if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 4294967296);
}
export function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function generateCourse(seed, level = 1) {
  const random = rng(seed), count = 15 + Math.min(7, Math.floor((level - 1) / 2));
  const platforms = [{ x: 0, y: 0, z: 0, w: 7.5, d: 6.5, kind: 'start', phase: 0, amplitude: 0 }];
  for (let i = 1; i < count; i++) {
    const prev = platforms[i - 1], checkpoint = i % 5 === 0, finish = i === count - 1;
    const w = checkpoint || finish ? 5.5 : 3.8 + random() * 1.5;
    const d = checkpoint || finish ? 5 : 3.7 + random() * 1.2;
    const gap = .9 + random() * Math.min(1.4, 1 + level * .06);
    const x = Math.max(-5.5, Math.min(5.5, prev.x + (random() - .5) * 3.2));
    const y = Math.max(-.6, Math.min(1.8, prev.y + (random() - .42) * .65));
    const kind = finish ? 'finish' : checkpoint ? 'checkpoint' : i > 2 && random() < .25 ? 'moving' : 'normal';
    platforms.push({ x, y, z: prev.z - prev.d / 2 - d / 2 - gap, w, d, kind, phase: random() * Math.PI * 2, amplitude: kind === 'moving' ? .45 + random() * .4 : 0 });
  }
  return { seed, level, theme: THEMES[(level - 1) % THEMES.length], platforms };
}
