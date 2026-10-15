import Phaser from 'phaser';
import { chest, slam, type ShowCtx, type SuperShow } from './kit';

/** LA REMATADA · LA SEXTA CUERDA: una cuerda gigante vibra entre ella y el rival; remate: ¡TWANG! */
export const rematada: SuperShow = {
  start(c: ShowCtx) {
    const string = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.front.add(string);
    Object.assign(c.data, { string, amp: 0, snapAt: -1 });
  },
  update(c: ShowCtx, dt: number) {
    const a = chest(c.owner);
    const b = chest(c.target);
    const g = c.data.string as Phaser.GameObjects.Graphics;
    g.clear();
    c.data.amp = Math.max(6, c.data.amp - dt * 120);
    if (c.data.snapAt >= 0) {
      // Cuerda cortada: cada mitad vuelve a su punta como un látigo.
      const k = Math.min(1, (c.t - c.data.snapAt) / 300);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      for (const [from, sign] of [[a, 1], [b, -1]] as const) {
        const end = { x: mid.x + (from.x - mid.x) * k, y: mid.y + (from.y - mid.y) * k - Math.sin(k * Math.PI) * 120 * sign };
        g.lineStyle(6, 0xe0914a, 1 - k).lineBetween(from.x, from.y, end.x, end.y);
      }
      return;
    }
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    for (const [w, alpha] of [[14, 0.25], [5, 1]] as const) {
      g.lineStyle(w, 0xf2d0a0, alpha);
      g.beginPath();
      for (let i = 0; i <= 40; i++) {
        const k = i / 40;
        const off = Math.sin(k * Math.PI) * Math.sin(c.t / 18 + k * 8) * c.data.amp;
        g.lineTo(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k + off * (len > 0 ? 1 : 0));
      }
      g.strokePath();
    }
  },
  impact(c, x, y, final) {
    if (!final) return;
    c.data.snapAt = c.t;
    const t = chest(c.target);
    c.fx.hit(t.x, t.y, 0xe0914a, true);
    c.scene.cameras.main.shake(320, 0.018);
    slam(c.scene, t.x, t.y - 300, '¡TWANG!', '#e0914a', 170);
  },
};
