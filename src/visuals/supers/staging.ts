import type { SuperShow } from './kit';

/** Stage existing effects in three acts; their projectiles and hit timing stay intact. */
export function stageShow(show: SuperShow): SuperShow {
  return {
    ...show,
    start(c) {
      show.start?.(c);
      c.back.setAlpha(0).setScale(0.96);
      // Scale around the performer, rather than the screen origin.
      c.back.setPosition(c.owner.x * 0.04, 0);
      c.scene.tweens.add({ targets: c.back, alpha: 1, scale: 1, x: 0,
        duration: 420, ease: 'Cubic.easeOut' });
    },
    update(c, dt) {
      show.update?.(c, dt);
      // A restrained rise in contrast gives the final phrase room to land.
      if (!c.data.stagingFinal && c.t >= c.duration * 0.82) {
        c.data.stagingFinal = true;
        c.scene.tweens.add({ targets: c.back, alpha: 0.65, duration: 200, ease: 'Sine.easeIn' });
      }
    },
    impact(c, x, y, final) {
      if (final) {
        c.back.setAlpha(1);
        c.owner.sync();
      }
      show.impact?.(c, x, y, final);
    },
  };
}
