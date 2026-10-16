import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, colorFlash, comet, glintTex, glowTex, lensColor, markHit, missile, shockwave, spark, victim } from './energy';

const GOLD = 0xffc83d;
const PALE = 0xfff1b8;

/**
 * SLANDOR · HERENCIA MILLONARIA: destellos dorados barren la pantalla en diagonal y llueven chispas de oro.
 * Dispara rayos dorados gruesos. Cada golpe va dorando al rival hasta dejarlo quieto como estatua.
 * Remate: estallido de luz dorada cegadora.
 */
export const slandor: SuperShow = {
  aim: true,
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(g);
    Object.assign(c.data, { g });
  },
  update(c: ShowCtx, dt: number) {
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    // Barridos diagonales de luz.
    for (let i = 0; i < 6; i++) {
      const x = ((c.t * 0.9 + i * 420) % (GAME_WIDTH + 1200)) - 600;
      g.fillStyle(GOLD, 0.06 + (i % 2) * 0.05);
      g.fillPoints([
        new Phaser.Math.Vector2(x, 0), new Phaser.Math.Vector2(x + 90 + i * 20, 0),
        new Phaser.Math.Vector2(x - 500 + 90 + i * 20, GAME_HEIGHT), new Phaser.Math.Vector2(x - 500, GAME_HEIGHT),
      ], true);
    }
    if (Math.random() < dt * 40) emit(c, glowTex(c.scene), rand(0, GAME_WIDTH), -20, { vy: rand(250, 500), vx: rand(-40, 40), life: 2.5, scale: rand(0.2, 0.5), tint: GOLD, add: true, layer: 'back' });
    if (Math.random() < dt * 10) emit(c, glintTex(c.scene), rand(0, GAME_WIDTH), rand(0, GAME_HEIGHT), { life: 0.5, scale: rand(0.3, 0.8), grow: -1, spin: 90, tint: PALE, add: true });
    const cm = lensColor(c);
    if (cm) {
      cm.colorMatrix.sepia();
      cm.colorMatrix.alpha = Math.min(0.5, c.t / c.duration);
    }
    // El rival se va dorando y se queda inmóvil.
    const hits = c.data.hits ?? 0;
    const since = c.t - (c.data.hitAt ?? -9999);
    const gold = Math.min(1, hits / 3);
    victim(c, { tint: since < 120 ? 0xffffff : gold > 0.6 ? GOLD : 0xffe7a0, fill: since < 120 || gold >= 1, x: since < 200 ? rand(-5, 5) : 0 });
  },
  note(c, x, y, hit, final) {
    return hit ? missile(c, x, y, GOLD, final ? 50 : 32) : spark(c, x, y, GOLD);
  },
  fly(c, x, y, _age, final) {
    comet(c, x, y, GOLD, final ? 1.6 : 1);
    if (Math.random() < 0.3) emit(c, glintTex(c.scene), x, y, { life: 0.3, scale: 0.4, grow: -1, tint: PALE, add: true });
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, GOLD, 16, 800, glintTex(c.scene));
    if (!final) return;
    const t = chest(c.target);
    colorFlash(c.scene, 'burn', 800);
    veil(c.scene, PALE, 0.85, 160, 20, 600, 48);
    shockwave(c.scene, 0.5, 800);
    burst(c, t.x, t.y, GOLD, 60, 1500, glintTex(c.scene));
    for (let k = 0; k < 5; k++) c.fx.ring(t.x, t.y, GOLD, 240 + k * 180, 0.5 + k * 0.1);
    c.fx.hit(t.x, t.y, GOLD, true);
    c.scene.cameras.main.shake(500, 0.022);
    slam(c.scene, t.x, t.y - 300, '$ $ $', '#ffd23f', 160);
  },
};
