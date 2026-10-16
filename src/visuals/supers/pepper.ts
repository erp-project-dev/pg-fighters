import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, colorFlash, comet, lensColor, markHit, shockwave, shot, spark, squareTex, victim } from './energy';

const TEAL = 0x2bd4c4;
const BARS = 32;

/**
 * PEPPER · ESTÁNDAR INTERNACIONAL: barras de espectro gigantes ocupan todo el fondo y saltan con cada golpe.
 * Dispara pulsos cuadrados de energía y cada impacto "comprime" al rival (se achata).
 * Remate: todo se satura en rojo, CLIP, y la imagen revienta.
 */
export const pepper: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(g);
    Object.assign(c.data, { g, levels: new Array(BARS).fill(0) as number[], kick: 0 });
  },
  update(c: ShowCtx, dt: number) {
    const g = c.data.g as Phaser.GameObjects.Graphics;
    const levels = c.data.levels as number[];
    c.data.kick = Math.max(0, c.data.kick - dt * 2.5);
    const clip = c.data.finalAt !== undefined;
    g.clear();
    const w = GAME_WIDTH / BARS;
    for (let i = 0; i < BARS; i++) {
      const target = 0.15 + Math.abs(Math.sin(c.t / (110 + i * 9) + i)) * 0.35 + c.data.kick * (1 - i / BARS) * 0.6;
      levels[i] += (Math.min(1, target) - levels[i]) * Math.min(1, dt * 14);
      const h = levels[i] * (GAME_HEIGHT - 160);
      const segs = Math.floor(h / 26);
      for (let s = 0; s < segs; s++) {
        const hot = s / 34;
        const color = clip || hot > 0.8 ? 0xff3b3b : hot > 0.6 ? 0xffd23f : TEAL;
        g.fillStyle(color, 0.22).fillRect(i * w + 4, GAME_HEIGHT - 60 - s * 26, w - 8, 20);
      }
    }
    // Más "producción": la pantalla se va saturando.
    const cm = lensColor(c);
    if (cm) {
      cm.colorMatrix.saturate(0.4 + c.t / c.duration);
      cm.colorMatrix.alpha = 0.8;
    }
    // Compresión: cada golpe aplasta al rival y vuelve despacio.
    const since = c.t - (c.data.hitAt ?? -9999);
    const k = Math.max(0, 1 - since / 450);
    victim(c, { sy: 1 - k * 0.32, sx: 1 + k * 0.22, tint: since < 100 ? 0xffffff : undefined, fill: since < 100 });
  },
  note(c, x, y, hit, final) {
    return hit ? shot(c, squareTex(c.scene), x, y, final ? 0xff3b3b : TEAL, final ? 3.4 : 2) : spark(c, x, y, TEAL);
  },
  fly(c, x, y, age, final, obj) {
    // Pulso cuadrado: late entre dos tamaños, sin girar.
    obj.setAngle(0).setScale((final ? 3.4 : 2) * (Math.sin(age * 40) > 0 ? 1.15 : 0.85));
    comet(c, x, y, TEAL, final ? 1.2 : 0.8, 0.25);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    c.data.kick = 1;
    burst(c, x, y, TEAL, 10, 600, squareTex(c.scene));
    if (!final) return;
    const t = chest(c.target);
    colorFlash(c.scene, 'saturate', 900);
    veil(c.scene, 0xff3b3b, 0.45, 140, 20, 400, 47);
    shockwave(c.scene, 0.55, 800);
    for (let k = 0; k < 4; k++) c.fx.ring(t.x, t.y, 0xff3b3b, 240 + k * 180, 0.5);
    c.fx.hit(t.x, t.y, 0xff3b3b, true);
    c.scene.cameras.main.shake(500, 0.024);
    slam(c.scene, t.x, t.y - 300, 'CLIP', '#ff3b3b', 170, 0);
  },
};
