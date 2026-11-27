export interface AssetManifest {
  titleScreen?: string;
  environments: Record<string, Partial<Record<'sky' | 'far' | 'mid' | 'fore' | 'light', string>>>;
  portraits: Record<string, string>;
  sprites: Record<string, string>;
  clues: Record<string, string>;
}

let cachedManifest: AssetManifest = {
  environments: {},
  portraits: {},
  sprites: {},
  clues: {}
};

let loaded = false;
let allPreloaded = false;
const preloadedImages = new Map<string, HTMLImageElement>();

export function resolveAssetUrl(path: string): string {
  const base =
    typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL
      : '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return path.replace(/^\.\/+/, normalizedBase);
}

function mapRecordValues(rec?: Record<string, string>): Record<string, string> {
  if (!rec) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(rec)) {
    out[k] = resolveAssetUrl(v);
  }
  return out;
}

export async function loadAssetManifest(): Promise<AssetManifest> {
  if (loaded) return cachedManifest;
  try {
    const res = await fetch(resolveAssetUrl('./assets/manifest.json'), { cache: 'no-cache' });
    if (res.ok) {
      const json = (await res.json()) as Partial<AssetManifest>;
      const envs: AssetManifest['environments'] = {};
      for (const [locId, slots] of Object.entries(json.environments || {})) {
        if (slots) {
          envs[locId] = mapRecordValues(slots as Record<string, string>);
        }
      }
      cachedManifest = {
        titleScreen: json.titleScreen ? resolveAssetUrl(json.titleScreen) : undefined,
        environments: envs,
        portraits: mapRecordValues(json.portraits),
        sprites: mapRecordValues(json.sprites),
        clues: mapRecordValues(json.clues)
      };
    }
  } catch {
    // Fallback to procedural assets silently
  }
  loaded = true;
  return cachedManifest;
}

export function getAssetManifestSync(): AssetManifest {
  return cachedManifest;
}

export function getPreloadedImage(url: string): HTMLImageElement | undefined {
  return preloadedImages.get(url);
}

export function areAllAssetsPreloaded(): boolean {
  return allPreloaded;
}

function loadAndDecodeImage(url: string, timeoutMs = 10000): Promise<void> {
  if (preloadedImages.has(url)) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    };

    const timer = window.setTimeout(finish, timeoutMs);

    img.onload = async () => {
      try {
        if (typeof img.decode === 'function') {
          await img.decode();
        }
      } catch {
        // Ignore decode warning if image already loaded
      }
      preloadedImages.set(url, img);
      finish();
    };
    img.onerror = finish;
    img.src = url;
  });
}

export async function preloadAllAssets(
  onProgress?: (loadedCount: number, totalCount: number, label: string) => void
): Promise<void> {
  const manifest = await loadAssetManifest();

  const entries: Array<{ url: string; label: string }> = [];
  for (const slots of Object.values(manifest.environments)) {
    for (const url of Object.values(slots)) {
      if (url) entries.push({ url, label: 'Surveying Blackwood Manor rooms...' });
    }
  }
  for (const url of Object.values(manifest.sprites)) {
    entries.push({ url, label: 'Locating manor occupants...' });
  }
  for (const url of Object.values(manifest.portraits)) {
    entries.push({ url, label: 'Preparing suspect dossiers...' });
  }
  for (const url of Object.values(manifest.clues)) {
    entries.push({ url, label: 'Cataloging physical evidence...' });
  }

  // Deduplicate by URL while preserving category labels
  const seen = new Set<string>();
  const uniqueEntries = entries.filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });

  const total = uniqueEntries.length;
  if (total === 0) {
    allPreloaded = true;
    onProgress?.(1, 1, 'Case file ready.');
    return;
  }

  let completed = 0;
  onProgress?.(0, total, uniqueEntries[0].label);

  // Concurrency-limited pool (6 parallel downloads) keeps mobile browsers responsive
  const concurrency = 6;
  let cursor = 0;

  const worker = async () => {
    while (cursor < uniqueEntries.length) {
      const idx = cursor++;
      const item = uniqueEntries[idx];
      await loadAndDecodeImage(item.url);
      completed++;
      onProgress?.(completed, total, item.label);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, uniqueEntries.length) }, worker));
  allPreloaded = true;
}
