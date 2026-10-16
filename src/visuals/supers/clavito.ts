import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, emit, pick, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, colorFlash, comet, glowTex, lensBarrel, markHit, orb, shockwave, spark, victim } from './energy';

const COLORS = [0xff3fa4, 0x3af0ff, 0xffe14d, 0x9b5cff];
/** Un golpe de dembow (ms). */
const BEAT = 300;

/**
 * CLAVITO · DEMBOW APOCALÍPTICO: láseres de colores barren la pantalla y toda la imagen rebota con el beat;
 * dispara pulsos de color que van saltando. El rival rebota obligado al ritmo.
 * Remate: negro y silencio medio segundo… y el drop: flash de color y lluvia de chispas.
 */
export const clavito: SuperShow = {
  start(c: ShowCtx) {
    const lasers = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(lasers);
    Object.assign(c.data, { lasers });
  },
  update(c: ShowCtx, dt: number) {
    // Patrón de dembow: golpe fuerte, contratiempo y golpe.
    const ph = (c.t % BEAT) / BEAT;
    const beat = Math.max(0, 1 - ph * 4) + (ph > 0.5 ? Math.max(0, 1 - (ph - 0.5) * 6) * 0.6 : 0);
    const dark = c.data.drop === 'dark';
    const g = c.data.lasers as Phaser.GameObjects.Graphics;
    g.clear();
    if (!dark) {
      for (let i = 0; i < 8; i++) {
        const ox = (i % 2 ? 0 : GAME_WIDTH);
        const a = Math.PI / 2 + Math.sin(c.t / (260 + i * 40) + i) * 1.1;
        const ex = ox + Math.cos(a) * 2400 * (i % 2 ? 1 : -1);
        const ey = -60 + Math.sin(a) * 2400;
        const col = COLORS[(i + Math.floor(c.t / BEAT)) % COLORS.length];
        g.lineStyle(26, col, 0.08 + beat * 0.08).lineBetween(ox, -60, ex, ey);
        g.lineStyle(4, col, 0.5 + beat * 0.4).lineBetween(ox, -60, ex, ey);
      }
      // Pantalla que "bombea" con el beat.
      const b = lensBarrel(c);
      if (b) b.amount = 1 + beat * 0.035;
      if (Math.random() < dt * 30) emit(c, glowTex(c.scene), rand(0, GAME_WIDTH), rand(0, GAME_HEIGHT), { life: 0.4, scale: rand(0.5, 1.2), grow: -2, tint: pick(COLORS), add: true, layer: 'back' });
    }
    // El rival rebota al ritmo.
    victim(c, dark ? { tint: 0x333333 } : { y: -beat * 34, sy: 1 - beat * 0.12, sx: 1 + beat * 0.08, tint: COLORS[Math.floor(c.t / BEAT) % COLORS.length], fill: beat > 0.85 });
  },
  note(c, x, y, hit, final) {
    return hit ? orb(c, x, y, final ? 0xffffff : pick(COLORS), final ? 50 : 30) : spark(c, x, y, pick(COLORS));
  },
  fly(c, x, y, age, final, obj) {
    // Va saltando como una pelota con el beat.
    obj.setY(y - Math.abs(Math.sin(age * 10)) * 60);
    comet(c, x, obj.y, pick(COLORS), final ? 1.2 : 0.7, 0.3);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, pick(COLORS), 12, 700);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // Silencio y negro… y el drop.
    c.data.drop = 'dark';
    veil(scene, 0x000000, 0.95, 420, 30, 120, 47);
    scene.time.delayedCall(480, () => {
      c.data.drop = 'go';
      colorFlash(scene, 'hue', 700);
      veil(scene, 0xff3fa4, 0.5, 60, 10, 400, 48);
      shockwave(scene, 0.8, 900);
      for (const col of COLORS) burst(c, t.x, t.y, col, 22, 1600);
      for (let k = 0; k < 6; k++) c.fx.ring(t.x, t.y, COLORS[k % COLORS.length], 240 + k * 170, 0.5);
      c.fx.hit(t.x, t.y, 0xff3fa4, true);
      scene.cameras.main.shake(700, 0.032);
      slam(scene, GAME_WIDTH / 2, 420, '¡DROP!', '#ff3fa4', 190);
    });
  },
};
