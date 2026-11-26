export interface AssetManifest {
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

export async function loadAssetManifest(): Promise<AssetManifest> {
  if (loaded) return cachedManifest;
  try {
    const res = await fetch('./assets/manifest.json', { cache: 'no-cache' });
    if (res.ok) {
      const json = (await res.json()) as Partial<AssetManifest>;
      cachedManifest = {
        environments: json.environments || {},
        portraits: json.portraits || {},
        sprites: json.sprites || {},
        clues: json.clues || {}
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
