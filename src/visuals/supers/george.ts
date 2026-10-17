import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, colorFlash, echo, every, markHit, ringTex, shockwave, shot, spark, victim, wave } from './energy';

const GREEN = 0x4dff88;
const PALE = 0xd6ffe4;
const LINES = 7;

/**
 * GEORGE · AFINACIÓN ABSOLUTA: ondas de luz cruzan la pantalla temblando desafinadas y se van enderezando.
 * Dispara anillos perfectos. El rival se ve doble (dos copias desfasadas) hasta que se "afina".
 * Remate: todo se alinea, la imagen se congela y sale un anillo perfecto gigante.
 */
export const george: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(g);
    Object.assign(c.data, { g });
  },
  update(c: ShowCtx) {
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    const detune = c.data.finalAt !== undefined ? 0 : Math.max(0.08, 1 - c.t / c.duration);
    for (let i = 0; i < LINES; i++) {
      const y0 = 140 + i * ((GAME_HEIGHT - 300) / (LINES - 1));
      const amp = (40 + i * 8) * detune;
      const main = i === 3;
      wave(g, y0, amp, 60 + i * 9, c.t / (90 + i * 15), GREEN, main ? 16 : 8, 0.1);
      wave(g, y0, amp, 60 + i * 9, c.t / (90 + i * 15), main ? PALE : GREEN, main ? 4 : 2, main ? 0.6 : 0.3);
      // Segunda línea desfasada: se junta con la primera a medida que se afina.
      wave(g, y0 + amp * 0.6, amp, 60 + i * 9, c.t / (90 + i * 15) + detune * 2, GREEN, 2, 0.18 * detune);
    }
    // Anillos concéntricos que salen de él.
    if (every(c, 'ringAt', 420)) c.fx.ring(chest(c.owner).x, chest(c.owner).y, GREEN, 260, 0.6);
    // El rival se ve doble: dos copias desfasadas que se juntan al afinarse.
    const off = 26 * detune * Math.sin(c.t / 70);
    if (c.data.hits && every(c, 'dblAt', 50)) echo(c.scene, c.target.sprite, { dx: off * 2, color: GREEN, alpha: 0.4 * detune + 0.05, ms: 90 });
    victim(c, { x: off, y: Math.sin(c.t / 33) * 4 * detune, angle: Math.sin(c.t / 45) * 4 * detune });
  },
  note(c, x, y, hit, final) {
    return hit ? shot(c, ringTex(c.scene), x, y, final ? PALE : GREEN, final ? 1.2 : 0.7) : spark(c, x, y, GREEN);
  },
  fly(c, x, y, age, final, obj) {
    // Anillo perfecto que vibra en su frecuencia.
    obj.setAngle(0).setScale((final ? 1.2 : 0.7) * (1 + Math.sin(age * 30) * 0.1));
    if (every(c, 'flyRing', 80)) c.fx.ring(x, y, GREEN, 60, 0.25);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    c.fx.ring(x, y, PALE, 160, 0.3);
    if (!final) return;
    const t = chest(c.target);
    // Todo se alinea y la imagen queda quieta un instante.
    colorFlash(c.scene, 'gray', 500, 0.7);
    veil(c.scene, PALE, 0.25, 160, 20, 300, 47);
    c.scene.time.delayedCall(180, () => {
      shockwave(c.scene, 0.4, 700);
      for (let k = 0; k < 6; k++) c.scene.time.delayedCall(k * 60, () => c.fx.ring(t.x, t.y, k % 2 ? PALE : GREEN, 220 + k * 200, 0.6));
      c.fx.hit(t.x, t.y, GREEN, true);
      c.scene.cameras.main.shake(300, 0.014);
      const textX = Phaser.Math.Clamp(t.x, 470, GAME_WIDTH - 470);
      const textY = Math.max(270, t.y - 300);
      slam(c.scene, textX, textY - 95, 'EL BEND SE', '#d6ffe4', 96, -4);
      slam(c.scene, textX, textY + 60, 'RESPETA', '#4dff88', 190, -4)
        .setShadow(0, 0, '#4dff88', 48, true, true);
    });
  },
};
