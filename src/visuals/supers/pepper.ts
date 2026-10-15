import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';

const BARS = 48;

/** PEPPER · ESTÁNDAR INTERNACIONAL: un espectro de frecuencias ocupa toda la pantalla y late con el solo; remate: CLIP en rojo. */
export const pepper: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(g);
    Object.assign(c.data, { g, levels: Array(BARS).fill(0), nextAt: 0, targets: Array(BARS).fill(0), clip: false });
  },
  update(c: ShowCtx) {
    const levels = c.data.levels as number[];
    const targets = c.data.targets as number[];
    if (c.t > c.data.nextAt) {
      c.data.nextAt = c.t + 80;
      for (let i = 0; i < BARS; i++) targets[i] = c.data.clip ? 1 : rand(0.15, 1) * (0.55 + 0.45 * Math.sin(i / 4 + c.t / 180));
    }
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    const w = GAME_WIDTH / BARS;
    for (let i = 0; i < BARS; i++) {
      levels[i] += (targets[i] - levels[i]) * 0.3;
      const h = levels[i] * (GAME_HEIGHT * 0.75);
      const color = levels[i] > 0.85 ? 0xff3b3b : levels[i] > 0.65 ? 0xffe14d : 0x2bd4c4;
      // Barras finas que suben desde abajo y su reflejo tenue arriba.
      g.fillStyle(color, 0.22).fillRect(i * w + w * 0.3, GAME_HEIGHT - h, w * 0.4, h);
      g.fillStyle(color, 0.6).fillRect(i * w + w * 0.3, GAME_HEIGHT - h, w * 0.4, 4);
      g.fillStyle(color, 0.08).fillRect(i * w + w * 0.3, 0, w * 0.4, h * 0.35);
    }
  },
  impact(c, x, y, final) {
    if (!final) return;
    c.data.clip = true;
    const t = chest(c.target);
    const cam = c.scene.cameras.main;
    veil(c.scene, 0xff3b3b, 0.3, 140);
    cam.zoomTo(1.14, 90, 'Quad.easeOut');
    c.scene.time.delayedCall(180, () => cam.zoomTo(1.05, 260));
    cam.shake(300, 0.016);
    c.fx.hit(t.x, t.y, 0xff3b3b, true);
    slam(c.scene, t.x, t.y - 300, 'CLIP', '#ff3b3b', 170, 0);
  },
};
