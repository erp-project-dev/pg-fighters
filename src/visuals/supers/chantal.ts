import Phaser from 'phaser';
import { chest, slam, type ShowCtx, type SuperShow } from './kit';

const ARMS = 6;

/** CHANTAL · PLATO DE LICKS A LA CARTA: brazos de espiral giran a su alrededor, como un plato que da vueltas; remate: la espiral se cierra. */
export const chantal: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(g);
    Object.assign(c.data, { g, close: -1 });
  },
  update(c: ShowCtx) {
    const p = chest(c.owner);
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    const squeeze = c.data.close < 0 ? 1 : Math.max(0, 1 - (c.t - c.data.close) / 300);
    const spin = c.t / 380;
    for (let arm = 0; arm < ARMS; arm++) {
      g.lineStyle(arm % 2 ? 3 : 6, arm % 2 ? 0xffffff : 0xff6b6b, arm % 2 ? 0.18 : 0.3);
      g.beginPath();
      for (let k = 0; k <= 60; k++) {
        const r = (40 + k * 16) * squeeze;
        const a = spin + (arm / ARMS) * Math.PI * 2 + k * 0.11;
        const x = p.x + Math.cos(a) * r;
        const y = p.y + Math.sin(a) * r * 0.62;
        if (k === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
    }
  },
  impact(c, x, y, final) {
    if (!final) return;
    c.data.close = c.t;
    const t = chest(c.target);
    for (let k = 0; k < 3; k++) c.fx.ring(t.x, t.y, k % 2 ? 0xffffff : 0xff6b6b, 220 + k * 130, 0.45);
    c.fx.hit(t.x, t.y, 0xff6b6b, true);
    c.scene.cameras.main.shake(280, 0.014);
    slam(c.scene, t.x, t.y - 300, 'TOTAL: K.O.', '#ff6b6b', 140);
  },
};
