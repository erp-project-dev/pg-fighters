import Phaser from 'phaser';
import { chest, slam, type ShowCtx, type SuperShow } from './kit';

const COLORS = [0xff7a2b, 0xffd166, 0x4dff88, 0x3dd6ff, 0xff3fa4];

/** PENTALICK · COMBO INFINITO DE CINCO LICKS: cinco anillos de colores salen de él en orden… y vuelven a empezar. */
export const pentalick: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(g);
    Object.assign(c.data, { g });
  },
  update(c: ShowCtx) {
    const p = chest(c.owner);
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    // Cada anillo nace cada 300 ms, en el orden de los cinco licks, y se expande hasta desaparecer.
    const period = 300;
    for (let k = 0; k < 6; k++) {
      const born = Math.floor(c.t / period) - k;
      if (born < 0) continue;
      const age = (c.t - born * period) / (period * 6);
      const r = 60 + age * 1100;
      g.lineStyle(10 * (1 - age) + 2, COLORS[born % 5], 0.45 * (1 - age)).strokeCircle(p.x, p.y, r);
    }
  },
  impact(c, x, y, final) {
    if (!final) return;
    const t = chest(c.target);
    COLORS.forEach((col, k) => c.fx.ring(t.x, t.y, col, 160 + k * 110, 0.5));
    c.fx.hit(t.x, t.y, 0xff7a2b, true);
    c.scene.cameras.main.shake(300, 0.016);
    slam(c.scene, t.x, t.y - 300, 'LICK 1 (OTRA VEZ)', '#ff7a2b', 96);
  },
};
