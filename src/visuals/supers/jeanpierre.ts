import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, colorFlash, comet, glintTex, glowTex, markHit, missile, shockwave, spark, spinX, victim, wave } from './energy';

const SKY = 0x8ecae6;
const TRICOLOR = [0x2b59ff, 0xffffff, 0xff3b4a];

/**
 * JEAN-PIERRE · GIRA EUROPEA: cintas de luz celeste fluyen como viento elegante por toda la pantalla,
 * con destellos suaves. Lanza cintas de luz que ondulan. El rival, envuelto, gira lento como en un vals.
 * Remate: estallido de luz en azul, blanco y rojo.
 */
export const jeanpierre: SuperShow = {
  aim: true,
  spread: 1.1,
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(g);
    Object.assign(c.data, { g });
  },
  update(c: ShowCtx, dt: number) {
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    for (let i = 0; i < 6; i++) {
      const y = 180 + i * 140 + Math.sin(c.t / 700 + i) * 60;
      const phase = c.t / (260 + i * 30) + i;
      wave(g, y, 50 + i * 8, 140 + i * 20, phase, i % 3 === 2 ? 0xffffff : SKY, 26, 0.06);
      wave(g, y, 50 + i * 8, 140 + i * 20, phase, i % 3 === 2 ? 0xffffff : SKY, 3, 0.4);
    }
    if (Math.random() < dt * 22) emit(c, glintTex(c.scene), rand(0, GAME_WIDTH), rand(0, GAME_HEIGHT), { vx: rand(60, 160) * c.owner.facing, vy: rand(-30, 30), life: 1.2, scale: rand(0.2, 0.5), spin: 60, tint: SKY, add: true, layer: 'back' });
    // Vals: tres tiempos, gira lento y se mece.
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, { sx: spinX(c.t, 0.8), x: Math.sin(c.t / 300) * 16, y: -Math.abs(Math.sin(c.t / 150)) * 10, tint: since < 120 ? 0xffffff : 0xcde9f6, fill: since < 120 });
    if (c.data.hits && Math.random() < dt * 30) {
      const a = c.t / 140;
      const t = chest(c.target);
      emit(c, glowTex(c.scene), t.x + Math.cos(a) * 90, t.y + Math.sin(a) * 140, { life: 0.4, scale: 0.5, grow: -1, tint: SKY, add: true });
    }
  },
  note(c, x, y, hit, final) {
    return hit ? missile(c, x, y, final ? 0xffffff : SKY, final ? 42 : 26) : spark(c, x, y, SKY);
  },
  fly(c, x, y, age, final) {
    comet(c, x, y + Math.sin(age * 12) * 18, final ? TRICOLOR[Math.floor(age * 12) % 3] : SKY, final ? 1.2 : 0.8, 0.45);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, SKY, 10, 600, glintTex(c.scene));
    if (!final) return;
    const t = chest(c.target);
    TRICOLOR.forEach((col, i) => c.scene.time.delayedCall(i * 110, () => {
      burst(c, t.x + (i - 1) * 140, t.y, col, 28, 1300);
      c.fx.ring(t.x + (i - 1) * 140, t.y, col, 320, 0.6);
    }));
    colorFlash(c.scene, 'burn', 400, 0.6);
    veil(c.scene, 0xffffff, 0.5, 80, 20, 400, 48);
    shockwave(c.scene, 0.5, 800);
    c.fx.hit(t.x, t.y, SKY, true);
    c.scene.cameras.main.shake(400, 0.02);
    slam(c.scene, t.x, t.y - 300, 'MERCI', '#8ecae6', 170, -4);
  },
};
