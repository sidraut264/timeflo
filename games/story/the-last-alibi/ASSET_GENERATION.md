# Asset Generation Guide — *The Last Alibi*

This document defines the unified art direction, file naming conventions, layer breakdown, and image-generation prompts for replacing or augmenting the procedural retro-illustrated assets in **The Last Alibi**.

## Completed phases — November 26, 2026

- Environments: all nine rooms now have image backgrounds. Added `environments/billiard_room/layer_2_mid.png` and `environments/guest_room/layer_2_mid.png`.
- Characters: retained the six existing suspect portraits, added `characters/portraits/arthur.png` in the journal header, and added six transparent PNGs under `characters/sprites/`. Phaser loads these through the manifest, retains procedural fallbacks, and scales breathing animation relative to each image's display size.
- Evidence: all 19 clues have individual PNG illustrations under `objects/clues/`, connected to inventory, inspection, and evidence-board views through the manifest.

All paths above are relative to `assets/`. These 28 new assets were generated using the built-in `image_gen` tool. Exact prompts, portrait references, and document correction prompts are recorded in `assets/generation-prompts.json`. Existing artwork was preserved. The document illustrations are supporting visuals; the game's clue descriptions remain the source for complete evidence text.

The nine room illustrations are complete opaque backgrounds in the `mid` slot. Separate sky, far, foreground, and lighting artwork remains optional; those layers retain procedural effects. The title-screen storm animation also remains procedural.

## Runtime optimization

The game serves content-versioned WebP derivatives through `assets/manifest.json`.
Original PNG/JPEG artwork remains in place; `scripts/artwork-sources.json` records
the source paths. Run `npm run assets:optimize` with Python 3 and Pillow (WebP support)
to rebuild derivatives, then `npm run build` to update the playable distribution.

Image bounds preserve aspect ratio without upscaling: backgrounds 1600×900,
portraits 384×512, transparent sprites 312×600, and clues 320×320. These give small
UI images room for high-density displays. Initial conversion reduced the 41 images
from 74.62 MB to 1.86 MB. Portraits and clue images use native lazy loading and async
decoding; room art continues to load on entry. The production build copies only
manifest-referenced artwork and the manifest, excluding original images and prompts.
Vercel uploads also exclude the source artwork directory; site links use `dist/`.

---

## 1. Unified Art Direction & Technical Spec

- **Era / Reference**: 1998–2005 European & noir point-and-click PC adventure games (*Broken Sword*, *Gabriel Knight 3*, *Syberia*, *Post Mortem*, *Black Mirror*).
- **Medium**: Hand-painted gouache & oil-wash illustration on slightly textured dark paper, subtle film grain, soft atmospheric fog, imperfect painterly brushstrokes. **Avoid photorealism, 3D renders, neon saturation, or modern mobile vector art.**
- **Color Palette**:
  - Deep Umber / Dark Brown (`#1a120d`, `#2d1f16`)
  - Desaturated Pine Green (`#1f2d27`, `#2e4238`)
  - Dirty Tungsten Yellow (`#c99c4a`, `#8f6a2d`)
  - Aged Burgundy (`#5a1d22`, `#3b1216`)
  - Muted Slate Blue (`#1b2735`, `#324459`)
  - Deep Charcoal Shadows (`#090a0d`)
- **Perspective**: Slight eye-level one-point or shallow two-point interior architectural perspective, horizon line at `58%` screen height.
- **Dimensions**:
  - Environment layers: `1600 x 720` PNG (transparent alpha on `far`, `midground`, `foreground`, and `lighting` layers).
  - Character portraits: `320 x 400` PNG (waist-up/bust, painterly chiaroscuro lighting, dark vignette background).
  - Character world sprites: `240 x 460` PNG (transparent background, slight rim lighting).
  - Inventory & clue icons: `256 x 256` PNG (isolated on transparent or dark velvet card background).

---

## 2. Parallax Layer Architecture

Each room under `assets/environments/<room_folder>/` supports independent replacement of up to 5 layered PNGs:

| Filename | Scroll Factor | Alpha Required | Purpose |
| :--- | :--- | :--- | :--- |
| `layer_0_sky.png` | `0.10x` | No | Storm clouds, lightning-lit moorland, distant night sky visible through windows |
| `layer_1_far.png` | `0.25x` | Yes | Distant corridor walls, far alcoves, window mullions, background silhouettes |
| `layer_2_mid.png` | `0.55x` | Yes | Primary room walls, wainscoting, bookshelves, fireplaces, desks, doors |
| `layer_3_fore.png` | `0.85x` | Yes | Framing oak pillars, hanging chandeliers, foreground chair backs, archways |
| `layer_4_light.png` | `1.00x` | Yes | Soft warm tungsten lamp cones, cold moonlight shafts, corner vignette |

> **Fallback Guarantee**: Whenever any PNG above is absent, the game's `TextureRegistry` automatically generates a matching retro-painted procedural texture at runtime so the game remains 100% playable.

---

## 3. Environment Prompts

### Shared Style Suffix (append to all environment prompts)
> *"1999 PC adventure game painted background illustration, gothic English manor interior at night in 1997, oil paint and gouache texture, muted dark brown desaturated green burgundy slate blue palette, warm tungsten lamp light against deep shadows, subtle canvas grain, atmospheric noir mystery, no modern UI, no text, 1600x720 wide horizontal composition."*

1. **Main Hall (`assets/environments/mansion/`)**
   - `layer_0_sky.png`: Stormy midnight English countryside sky seen through tall arched stained-glass manor windows, muted slate blue clouds, distant rain streaks.
   - `layer_1_far.png`: Grand double-height oak staircase receding into shadow, gallery landing balustrade, transparent window panes.
   - `layer_2_mid.png`: Dark oak-paneled foyer of Blackwood Manor, grandfather clock frozen near midnight, Persian rug worn thin, stone hearth with dying embers, heavy arched doors left and right.
   - `layer_3_fore.png`: Foreground carved dark oak archway framing left and right edges, wrought-iron chandelier hanging from top edge, transparent center.

2. **Edward's Study (`assets/environments/study/`)**
   - `layer_0_sky.png`: Violent storm rain beating against a tall gothic mullioned bay window, pale moonlight behind storm clouds.
   - `layer_1_far.png`: Recessed mahogany bookcase alcove and window frame interior, rain-streaked glass, shadows.
   - `layer_2_mid.png`: Cluttered Victorian executive study, heavy mahogany writing desk with green banker's lamp, spilled brandy glass, fireplace hearth, framed portrait hiding a wall safe, leather armchair.
   - `layer_3_fore.png`: Foreground dark velvet curtain edges and timber ceiling beam framing the scene.

3. **Library (`assets/environments/library/`)**
   - `layer_1_far.png` / `layer_2_mid.png`: Floor-to-ceiling walnut bookshelves packed with leather-bound medical and legal volumes, rolling wooden ladder, architect's map chest, globe, dim reading table with brass lamp.

4. **Dining Room (`assets/environments/dining_room/`)**
   - `layer_2_mid.png`: Long formal mahogany dining table set with tarnished silver candelabras, burgundy wallpaper peeling slightly at corners, half-cleared supper plates, leather briefcase beside sideboard.

5. **Kitchen (`assets/environments/kitchen/`)**
   - `layer_2_mid.png`: Stone-flagged Victorian service kitchen, black cast-iron range stove, copper pots hanging above prep table, porcelain scullery sink with washbasin, cellar door bolted with iron latch.

6. **Upstairs Corridor (`assets/environments/corridor/`)**
   - `layer_2_mid.png`: Narrow shadowy upper gallery, faded burgundy runner carpet, ancestral portraits watching the hall, heavy oak door to the Study with splintered brass lock, doorway to Guest Bedroom.

7. **Guest Bedroom (`assets/environments/guest_room/`)**
   - `layer_2_mid.png`: Spare guest quarters, four-poster bed with rumpled olive quilt, nightstand with cold porcelain teacup and travel clock, leather physician's medical bag resting on a luggage bench.

8. **Billiard Room (`assets/environments/billiard_room/`)**
   - `layer_2_mid.png`: Desaturated green felt billiard table lit by a low-hanging brass shade lamp, cue rack along burgundy wainscot wall, smoldering stone fireplace with charred paper scraps in the grate.

9. **Basement (`assets/environments/basement/`)**
   - `layer_2_mid.png`: Damp limestone cellar beneath Blackwood Manor, dusty wine racks hiding a rusted iron lever, cast-iron coal furnace with ash chute, damp coal-dusted stone floor leading to a concealed spiral stair.

---

## 4. Character Portrait Prompts (`assets/characters/portraits/`)

### Shared Portrait Style Suffix
> *"1999 detective adventure game character portrait, bust shot, painterly oil-on-canvas chiaroscuro, muted desaturated tones, tungsten key light, deep shadow background, suspicious noir expression, 320x400."*

1. `eleanor.png` — **Eleanor Blackwood**: Late 40s aristocratic English woman, upswept silver-streaked dark hair, high-collared burgundy velvet evening dress, pearl drop earring (one missing), guarded poised expression.
2. `thomas.png` — **Thomas Blackwood**: Early 40s disheveled gentleman, loosened dark tie, rumpled tweed waistcoat, hollow exhausted eyes, slight stubble, nervous tension.
3. `margaret.png` — **Margaret Wells**: Mid-60s English housekeeper, neat grey bun, black wool dress with crisp starched collar and silver brooch, stern weathered face, watchful eyes.
4. `reed.png` — **Dr. Samuel Reed**: Late 40s personal physician, wire-rimmed spectacles reflecting warm lamp glow, tailored charcoal three-piece suit, neatly trimmed beard, composed yet calculating stare.
5. `victor.png` — **Victor Hale**: Late 40s business partner, wet trenchcoat over pinstripe suit, rain-dampened dark hair, sharp angular jaw, guarded cynicism.
6. `clara.png` — **Clara Blackwood**: Early 20s daughter, pale quiet face, dark wool cardigan over linen blouse, holding a charcoal pencil, haunted observant eyes.
7. `arthur.png` — **Detective Arthur Hayes**: Early 40s former police detective, weathered brown tweed coat, dark circles under sharp hazel eyes, rain-soaked collar, stoic determination.

---

## 5. Key Clue & Object Prompts (`assets/objects/clues/`)

> Style: *"Vintage 1998 adventure game inventory item illustration on dark velvet background, oil-painted realism with slight grain, warm directional spotlight, 256x256."*

- `broken_pocket_watch.png`: Cracked gold pocket watch with hands stopped permanently at 11:32.
- `brass_paperweight.png`: Heavy tarnished brass lion paperweight with faint dark residue along its base.
- `laced_brandy_glass.png`: Cut-crystal snifter half-filled with amber brandy and cloudy white sediment.
- `missing_study_key.png`: Old ornate brass skeleton key dusted with black furnace ash.
- `medical_bag_vial.png`: Small amber apothecary glass bottle labeled *Chloral Hydrate — Dr. S. Reed*, nearly empty.
- `case_1992_dossier.png`: Manila police dossier stamped *CONFIDENTIAL 1992* with altered toxicology chart.
- `servant_passage_blueprint.png`: Yellowed 1920 architectural blueprint showing a hidden spiral passage in red ink.
- `clara_sketchbook.png`: Open charcoal sketchbook showing a figure in a dark coat slipping down a cellar stair.
