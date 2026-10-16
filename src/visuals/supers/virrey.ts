import Phaser from 'phaser';
import { GAME_WIDTH } from '../../config';
import { chest, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, body, burst, colorFlash, comet, glowTex, lensColor, markHit, orb, rays, shockwave, spark, victim } from './energy';

const GOLD = 0xc9a227;
const COLD = 0xf3e6b3;

/**
 * EL VIRREY · EL TRIBUTO: rayos de oro detrás de él y la pantalla se vuelve fría y dorada, sin otros colores;
 * dispara orbes de oro pálido. Al rival le "drenan" la energía: chispas salen de él hacia el Virrey.
 * Remate: absorción total, todas las chispas vuelven a él y estalla en oro.
 */
export const virrey: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(g);
    Object.assign(c.data, { g });
  },
  update(c: ShowCtx, dt: number) {
    const p = chest(c.owner);
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    rays(g, p.x, p.y - 40, 24, 1700, c.t / 3000, GOLD, 0.08, 0.05);
    for (let k = 4; k > 0; k--) g.lineStyle(3, COLD, 0.12 * k).strokeCircle(p.x, p.y - 40, 120 + k * 40 + Math.sin(c.t / 200) * 8);
    // Frío y dorado: el color se va.
    const cm = lensColor(c);
    if (cm) {
      cm.colorMatrix.sepia();
      cm.colorMatrix.saturate(-0.4, true);
      cm.colorMatrix.alpha = Math.min(0.75, c.t / 900);
    }
    // Tributo: chispas que salen del rival y vuelan hacia él.
    if (c.data.hits && Math.random() < dt * 70) {
      const b = body(c.target);
      const sx = b.x + rand(-b.w, b.w);
      const sy = rand(b.top, b.feet);
      const life = 0.55;
      emit(c, glowTex(c.scene), sx, sy, { vx: (p.x - sx) / life, vy: (p.y - sy) / life, life, scale: rand(0.3, 0.7), tint: Math.random() < 0.7 ? GOLD : COLD, add: true });
    }
    const since = c.t - (c.data.hitAt ?? -9999);
    const drained = Math.min(1, (c.data.hits ?? 0) / 6);
    victim(c, { tint: since < 120 ? COLD : 0xa0a0a0, fill: since < 120, alpha: 1 - drained * 0.3, sy: 1 - drained * 0.05, x: since < 150 ? rand(-5, 5) : 0 });
  },
  note(c, x, y, hit, final) {
    return hit ? orb(c, x, y, final ? 0xffffff : COLD, final ? 50 : 28) : spark(c, x, y, GOLD);
  },
  fly(c, x, y, _age, final) {
    comet(c, x, y, GOLD, final ? 1.4 : 0.8);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, GOLD, 10, 600);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    const p = chest(c.owner);
    // Absorción total: una lluvia de chispas del rival a él…
    for (let i = 0; i < 70; i++) {
      const a = rand(0, Math.PI * 2);
      const sx = t.x + Math.cos(a) * rand(20, 160);
      const sy = t.y + Math.sin(a) * rand(20, 200);
      const life = rand(0.35, 0.6);
      emit(c, glowTex(scene), sx, sy, { vx: (p.x - sx) / life, vy: (p.y - sy) / life, life, scale: rand(0.5, 1), tint: i % 3 ? GOLD : COLD, add: true });
    }
    // …y estalla en oro sobre el rival.
    scene.time.delayedCall(420, () => {
      colorFlash(scene, 'burn', 600);
      veil(scene, COLD, 0.55, 100, 20, 500, 48);
      shockwave(scene, 0.6, 900);
      burst(c, t.x, t.y, GOLD, 50, 1500);
      for (let k = 0; k < 5; k++) c.fx.ring(t.x, t.y, k % 2 ? COLD : GOLD, 240 + k * 170, 0.5);
      c.fx.hit(t.x, t.y, GOLD, true);
      scene.cameras.main.shake(600, 0.026);
      slam(scene, GAME_WIDTH / 2, 420, 'POR DECRETO', '#e0b53a', 140, -8);
    });
  },
};
