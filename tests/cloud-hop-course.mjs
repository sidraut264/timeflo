import fs from 'node:fs';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../games/zen/cloud-hop/world.js', import.meta.url), 'utf8');
const { generateCourse } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
for (let level = 1; level <= 20; level++) {
  for (let seed = 0; seed < 500; seed++) {
    const course = generateCourse(seed, level), platforms = course.platforms;
    assert.equal(platforms[0].kind, 'start');
    assert.equal(platforms.at(-1).kind, 'finish');
    for (let i = 1; i < platforms.length; i++) {
      const a = platforms[i - 1], b = platforms[i];
      const gap = a.z - a.d / 2 - (b.z + b.d / 2);
      // Even at opposite moving-platform extremes, the nearest edges are
      // comfortably within the first jump's 5.66-unit horizontal range.
      const sideways = Math.max(0, Math.abs(a.x - b.x) + a.amplitude + b.amplitude - (a.w + b.w) / 2);
      assert(gap >= .89 && gap <= 2.31);
      assert(Math.hypot(gap, sideways) < 3);
      assert(b.y - a.y <= .38);
      assert(b.w >= 3.8 && b.d >= 3.7);
      if (b.kind === 'checkpoint') assert.equal(b.amplitude, 0);
    }
  }
}
assert.deepEqual(generateCourse(98341, 7), generateCourse(98341, 7), 'same seed reproduces same level');
assert.notDeepEqual(generateCourse(98341, 7), generateCourse(98342, 7), 'new seeds produce new courses');
console.log('PASS 10,000 random courses: bounded gaps, reachable heights, stable checkpoints, deterministic retry');
