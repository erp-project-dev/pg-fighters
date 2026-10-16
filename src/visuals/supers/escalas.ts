import Phaser from 'phaser';
import { GAME_WIDTH } from '../../config';
import { chest, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, body, burst, colorFlash, comet, glowTex, markHit, orb, shockwave, spark, victim } from './energy';

const STEEL = 0x9fb0c8;
const GOLD = 0xe0b862;
const BANDS = 3;

/**
 * DOCTOR ESCALAS · LA TRILOGÍA COMPLETA: tres franjas de luz cruzan la pantalla y por cada una corren
 * escalas de puntos que suben y bajan; dispara escaleras de puntos de luz. Cada "tomo" deja al rival
 * marcado por un haz. Remate: tres impactos seguidos, cada uno más grande, y FIN.
 */
export const escalas: SuperShow = {
  spread: 1.3,
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(ADD);
    const marks = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(g);
    c.front.add(marks);
    Object.assign(c.data, { g, marks });
  },
  update(c: ShowCtx) {
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    for (let b = 0; b < BANDS; b++) {
      const y0 = 240 + b * 230;
      g.fillStyle(b === 1 ? GOLD : STEEL, 0.06).fillRect(0, y0 - 60, GAME_WIDTH, 120);
      for (let l = 0; l < 5; l++) g.lineStyle(2, STEEL, 0.22).lineBetween(0, y0 - 40 + l * 20, GAME_WIDTH, y0 - 40 + l * 20);
      // Escala que sube y baja corriendo por la franja.
      for (let i = 0; i < 28; i++) {
        const x = ((i * 70 + c.t * (0.5 + b * 0.2) * (b % 2 ? -1 : 1)) % (GAME_WIDTH + 200) + GAME_WIDTH + 200) % (GAME_WIDTH + 200) - 100;
        const step = (i + Math.floor(c.t / 120)) % 8;
        const y = y0 + 40 - (step < 4 ? step : 8 - step) * 20;
        g.fillStyle(b === 1 ? GOLD : 0xffffff, 0.75).fillCircle(x, y, 7);
      }
    }
    // Cada tomo marca al rival con un haz.
    const marks = c.data.marks as Phaser.GameObjects.Graphics;
    marks.clear();
    const hits = c.data.hits ?? 0;
    const bd = body(c.target);
    for (let i = 0; i < Math.min(BANDS, Math.ceil(hits / 2)); i++) {
      const y = bd.top + bd.h * (0.25 + i * 0.25);
      marks.fillStyle(i === 1 ? GOLD : STEEL, 0.35).fillRect(bd.x - bd.w * 1.6, y - 8, bd.w * 3.2, 16);
      marks.fillStyle(0xffffff, 0.8).fillRect(bd.x - bd.w * 1.6, y - 2, bd.w * 3.2, 4);
    }
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, { tint: since < 120 ? 0xffffff : 0xdfe6f0, fill: since < 120, x: since < 200 ? (Math.floor(c.t / 40) % 2 ? 6 : -6) : 0 });
  },
  note(c, x, y, hit, final) {
    return hit ? orb(c, x, y, final ? GOLD : STEEL, final ? 44 : 24) : spark(c, x, y, STEEL);
  },
  fly(c, x, y, age, final) {
    // Escalera de puntos detrás del proyectil.
    const step = Math.floor(age * 30) % 6;
    comet(c, x - c.owner.facing * 20, y + (step - 3) * 10, final ? GOLD : 0xffffff, final ? 0.8 : 0.5, 0.5);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    c.fx.ring(x, y, STEEL, 160, 0.3);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // Tomo I, II y III: tres impactos, cada uno más grande.
    for (let i = 0; i < 3; i++) {
      scene.time.delayedCall(i * 220, () => {
        const k = i + 1;
        shockwave(scene, 0.2 * k, 500 + k * 150);
        burst(c, t.x, t.y, i === 2 ? GOLD : STEEL, 14 * k, 600 + k * 300, glowTex(scene));
        for (let r = 0; r < k + 1; r++) c.fx.ring(t.x, t.y, i === 2 ? GOLD : STEEL, 200 + r * 160 + k * 60, 0.45);
        c.fx.hit(t.x, t.y, i === 2 ? GOLD : STEEL, true);
        scene.cameras.main.shake(200 + k * 120, 0.008 * k);
        if (i === 2) {
          colorFlash(scene, 'burn', 500);
          veil(scene, 0xffffff, 0.5, 80, 20, 400, 48);
          slam(scene, GAME_WIDTH / 2, 420, 'FIN', '#e0b862', 200, 0);
        }
      });
    }
  },
};
