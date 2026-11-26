"""Create runtime WebP artwork without modifying the original images.

Requires Pillow with WebP support. Run from any directory with Python 3.
The source manifest stays separate so repeated runs always use the originals.
"""
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps, features

ROOT = Path(__file__).resolve().parents[1]
SOURCES = Path(__file__).with_name('artwork-sources.json')
SPECS = {
    'environments': ((1600, 900), 83),
    'portraits': ((384, 512), 84),
    'sprites': ((312, 600), 86),
    'clues': ((320, 320), 85),
}


def main():
    if not features.check('webp'):
        raise RuntimeError('Pillow must have WebP support')
    manifest = json.loads(SOURCES.read_text())
    totals = {}

    def convert(group, url):
        source = ROOT / url
        bounds, quality = SPECS[group]
        # Including encoder version/settings makes URLs safe to cache across updates.
        recipe = f'{bounds}:{quality}:6:{Image.__version__}'
        digest = hashlib.sha256(source.read_bytes() + recipe.encode()).hexdigest()[:12]
        relative = source.relative_to(ROOT / 'assets')
        target = ROOT / 'assets' / 'optimized' / relative.parent / f'{source.stem}.{digest}.webp'
        target.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original)
            image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')
            image.thumbnail(bounds, getattr(Image, 'Resampling', Image).LANCZOS)
            image.save(target, 'WEBP', quality=quality, method=6)
        before, after = totals.get(group, (0, 0))
        totals[group] = before + source.stat().st_size, after + target.stat().st_size
        return './' + target.relative_to(ROOT).as_posix()

    for group, entries in manifest.items():
        for key, value in entries.items():
            if group == 'environments':
                for layer, url in value.items():
                    value[layer] = convert(group, url)
            else:
                entries[key] = convert(group, value)

    (ROOT / 'assets/manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    for group, (before, after) in totals.items():
        print(f'{group}: {before / 1e6:.2f} MB -> {after / 1e6:.2f} MB')
    before = sum(pair[0] for pair in totals.values())
    after = sum(pair[1] for pair in totals.values())
    print(f'Total: {before / 1e6:.2f} MB -> {after / 1e6:.2f} MB ({1 - after / before:.1%} smaller)')


if __name__ == '__main__':
    main()
