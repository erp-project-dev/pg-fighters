import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, slam, type ShowCtx, type SuperShow } from './kit';

/** DOCTOR ESCALAS · LA TRILOGÍA COMPLETA: tres pentagramas de luz recorren la pantalla con escalas que suben y bajan; remate: FIN. */
export const escalas: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(g);
    Object.assign(c.data, { g });
  },
  update(c: ShowCtx) {
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    const dir = c.owner.facing;
    // Tres pentagramas (uno por libro), cada uno con sus cinco líneas.
    for (let staff = 0; staff < 3; staff++) {
      const top = GAME_HEIGHT * 0.14 + staff * GAME_HEIGHT * 0.24;
      const tilt = Math.sin(c.t / 900 + staff) * 18;
      for (let l = 0; l < 5; l++) {
        g.lineStyle(3, 0xd6e2f2, 0.45).lineBetween(0, top + l * 18 - tilt, GAME_WIDTH, top + l * 18 + tilt);
      }
      // Notas de luz que corren por el pentagrama dibujando una escala.
      for (let n = 0; n < 14; n++) {
        const span = GAME_WIDTH + 200;
        const x = (((n * 150 + c.t * 0.45 * dir) % span) + span) % span - 100;
        const step = (n + staff * 3) % 8;
        const y = top + 72 - step * 9 + ((x / GAME_WIDTH) * 2 - 1) * tilt;
        g.fillStyle(0xe0b862, 0.85).fillEllipse(x, y, 26, 18);
        g.lineStyle(3, 0xe0b862, 0.7).lineBetween(x + 12, y, x + 12, y - 48);
      }
    }
  },
  impact(c, x, y, final) {
    if (!final) return;
    const t = chest(c.target);
    for (let k = 0; k < 3; k++) c.fx.ring(t.x, t.y, k % 2 ? 0xb8c6da : 0xe0b862, 200 + k * 130, 0.5);
    c.fx.hit(t.x, t.y, 0xe0b862, true);
    c.scene.cameras.main.shake(320, 0.016);
    slam(c.scene, t.x, t.y - 330, 'FIN', '#e0b862', 170, 0);
  },
};
