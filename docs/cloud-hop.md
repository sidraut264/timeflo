# Cloud Hop

Cloud Hop is a standalone 3D platformer in the Zen collection. Open
`games/zen/cloud-hop/index.html` through a static server; no build is needed.
Both arcade menus include it under Zen. The document base keeps local asset
paths valid with Vercel's directory-index clean URL redirects. Three.js is vendored so 3D rendering does
not depend on a CDN at runtime.

Move with WASD or arrow keys. Space jumps, and a second press performs a
double jump. P or Escape pauses, and R returns to the latest checkpoint.
Touch devices get a joystick and a jump button. Collect optional gems and
walk into the final portal to advance to a new random world. New World
reshuffles the current level; Retry reproduces the same seed. Checkpoints
appear every five islands. Falling returns to the latest checkpoint with
unlimited attempts. Four pastel sky themes cycle as the levels advance.

Movement and platform collision use a fixed 120 Hz simulation with bounded
frame catch-up. Random generation constrains platform spacing and height
changes, including the extremes of moving platforms. The camera follows
smoothly, pixel ratio is capped, and shared decorative geometry is reused.
Sound is optional. Progress statistics use localStorage when available;
denied storage does not prevent play. Reduced motion suppresses bursts
and decorative bobbing. Changing browser tabs automatically pauses.

Validation:

- `node tests/cloud-hop-course.mjs` checks 10,000 deterministic courses for
  reachable gaps, height changes, and stable checkpoints.
- `node tests/cloud-hop-browser.cjs` uses Chrome DevTools on port 9222 and a
  local static server on port 8765. It exercises rendering, real keyboard
  movement, double jump, fall recovery, pause, retry, random regeneration,
  a full course, portal progression, sound, help, and mobile jump controls.
  It requires the `ws` dependency installed in `chess2/node_modules`.
