import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, slam, type ShowCtx, type SuperShow } from './kit';

const LINES = 7;

/** GEORGE · AFINACIÓN ABSOLUTA: líneas de osciloscopio cruzan la pantalla temblando y se van enderezando hasta quedar perfectas. */
export const george: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(g);
    Object.assign(c.data, { g, flat: false });
  },
  update(c: ShowCtx) {
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    // Desafinación: amplitud alta al principio, casi nada al final (y cero en el remate).
    const detune = c.data.flat ? 0 : Math.max(0.08, 1 - c.t / c.duration);
    for (let i = 0; i < LINES; i++) {
      const y0 = 140 + i * ((GAME_HEIGHT - 300) / (LINES - 1));
      const amp = (30 + i * 6) * detune;
      const alpha = 0.18 + (i === 3 ? 0.25 : 0);
      g.lineStyle(i === 3 ? 4 : 2, i === 3 ? 0xd6ffe4 : 0x4dff88, alpha);
      g.beginPath();
      for (let x = 0; x <= GAME_WIDTH; x += 16) {
        const y = y0 + Math.sin(x / (60 + i * 9) + c.t / (90 + i * 15)) * amp + Math.sin(x / 23 + c.t / 40) * amp * 0.3;
        if (x === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
    }
  },
  impact(c, x, y, final) {
    if (!final) return;
    c.data.flat = true;
    const t = chest(c.target);
    for (let k = 0; k < 4; k++) c.scene.time.delayedCall(k * 90, () => c.fx.ring(t.x, t.y, 0x4dff88, 200 + k * 120, 0.5));
    c.fx.hit(t.x, t.y, 0x4dff88, true);
    c.scene.cameras.main.shake(260, 0.012);
    slam(c.scene, t.x, t.y - 300, '0 CENTS', '#4dff88', 140);
  },
};
