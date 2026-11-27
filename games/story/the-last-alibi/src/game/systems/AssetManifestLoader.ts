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
