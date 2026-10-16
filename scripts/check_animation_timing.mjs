import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { attackFrameIndex } from '../src/visuals/roster/AnimationTiming.ts';
import { MOVES } from '../src/data/moves.ts';
const metadata = JSON.parse(readFileSync('public/assets/characters/george/animations/metadata.json', 'utf8'));
for (const id of ['jab', 'uppercut', 'special']) {
  const move = MOVES[id];
  const seen = new Set();
  const ranges = metadata.phaseFrames[move.pose];
  for (let elapsed = 0; elapsed < move.startup + move.active + move.recovery; elapsed++) {
    const phase = elapsed < move.startup ? 'startup' : elapsed < move.startup + move.active ? 'active' : 'recovery';
    seen.add(attackFrameIndex(elapsed, phase, move, 8, ranges));
  }
  assert.deepEqual([...seen], [0, 1, 2, 3, 4, 5, 6, 7], `${id} must traverse all eight drawings in order`);
}
assert.equal(attackFrameIndex(MOVES.special.startup, 'recovery', MOVES.special, 8, metadata.phaseFrames.special), 3, 'Projectile release starts on drawing 3');
assert.equal(attackFrameIndex(MOVES.uppercut.startup, 'active', MOVES.uppercut, 8, metadata.phaseFrames.uppercut), 2);
assert.equal(attackFrameIndex(MOVES.uppercut.startup + MOVES.uppercut.active, 'recovery', MOVES.uppercut, 8, metadata.phaseFrames.uppercut), 5);
const atlas = JSON.parse(readFileSync('public/assets/characters/george/animations/atlas.json', 'utf8'));
assert.equal(atlas.textures.length, 27);
const names = new Set(atlas.textures.flatMap((page) => page.frames.map((frame) => frame.filename)));
for (const animation of Object.values(metadata.animations)) {
  for (let i = 0; i < 8; i++) assert(names.has(`george-${animation.pose}-${i}`));
  assert(names.has(`george-${animation.pose}`));
}
console.log('Animation checks passed: all eight attack drawings, projectile release, and 27 atlas pages.');
