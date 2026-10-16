import Phaser from 'phaser';
import { GAME_WIDTH } from '../../config';
import { chest, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, body, burst, colorFlash, comet, glowTex, markHit, ringTex, shockwave, spark, spinX, spiral, victim } from './energy';

const RED = 0xe63946;
const WARM = 0xffb347;

/** Disco de energía: aro de color con centro brillante (gira con `spin`). */
const disc = (c: ShowCtx, x: number, y: number, size: number) =>
  c.scene.add.container(x, y, [
    c.scene.add.image(0, 0, glowTex(c.scene)).setTint(RED).setBlendMode(ADD).setScale(size * 2.4),
    c.scene.add.image(0, 0, ringTex(c.scene)).setTint(WARM).setBlendMode(ADD).setScale(size * 0.8, size * 0.5),
    c.scene.add.image(26 * size, 0, glowTex(c.scene)).setTint(0xffffff).setBlendMode(ADD).setScale(size * 0.6),
  ]);

/**
 * CHANTAL · PLATO DE LICKS A LA CARTA: una espiral de luz gira a su alrededor y se abre hasta llenar la pantalla;
 * lanza discos de energía que giran. El rival queda atrapado en una espiral propia, girando.
 * Remate: la espiral se cierra de golpe sobre el rival y estalla.
 */
export const chantal: SuperShow = {
  spin: 720,
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(ADD);
    const trap = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(g);
    c.front.add(trap);
    Object.assign(c.data, { g, trap, close: 1 });
  },
  update(c: ShowCtx) {
    const p = chest(c.owner);
    const u = Math.min(1, c.t / c.duration);
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    const r = (300 + u * 1300) * c.data.close;
    spiral(g, p.x, p.y, 4, r, c.t / 300, RED, 22, 0.1);
    spiral(g, p.x, p.y, 4, r, c.t / 300, WARM, 4, 0.55);
    spiral(g, p.x, p.y, 3, r * 0.6, -c.t / 200, RED, 3, 0.4, 2);
    // El rival, atrapado en su propia espiral, gira.
    const trap = c.data.trap as Phaser.GameObjects.Graphics;
    trap.clear();
    if (c.data.hits) {
      const b = body(c.target);
      spiral(trap, b.x, b.feet - b.h * 0.5, 3, b.h * 0.8, c.t / 120, WARM, 3, 0.6, 1.2);
    }
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, { sx: spinX(c.t, 1.6 + (c.data.hits ?? 0) * 0.3), y: -Math.max(0, 1 - since / 400) * 30, tint: since < 120 ? 0xffffff : undefined, fill: since < 120 });
  },
  note(c, x, y, hit, final) {
    return hit ? disc(c, x, y, final ? 1.5 : 1) : spark(c, x, y, WARM);
  },
  fly(c, x, y, _age, final) {
    comet(c, x, y, RED, final ? 1.2 : 0.8);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, WARM, 12, 700);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // La espiral se cierra… y revienta.
    scene.tweens.add({ targets: c.data, close: 0.05, duration: 320, ease: 'Cubic.easeIn' });
    scene.time.delayedCall(320, () => {
      colorFlash(scene, 'burn', 500);
      veil(scene, RED, 0.45, 80, 20, 420, 48);
      shockwave(scene, 0.6, 800);
      burst(c, t.x, t.y, RED, 40, 1400);
      burst(c, t.x, t.y, WARM, 30, 1100);
      for (let k = 0; k < 5; k++) c.fx.ring(t.x, t.y, k % 2 ? WARM : RED, 240 + k * 180, 0.5);
      c.fx.hit(t.x, t.y, RED, true);
      scene.cameras.main.shake(600, 0.026);
      slam(scene, GAME_WIDTH / 2, 420, 'TOTAL: K.O.', '#ff6b6b', 150);
    });
  },
};
