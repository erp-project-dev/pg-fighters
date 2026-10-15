import Phaser from 'phaser';
import { chest, type ShowCtx, type SuperShow } from './kit';

/** Five strings resonate slowly; the final bend releases one broad blues wave. */
export const mayin: SuperShow = {
  start(c: ShowCtx) {
    const strings = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(strings);
    c.data.bluesStrings = strings;
  },
  update(c) {
    const g = c.data.bluesStrings as Phaser.GameObjects.Graphics;
    const p = chest(c.owner);
    g.clear();
    const grow = Math.min(1, c.t / 550);
    for (let i = 0; i < 5; i++) {
      g.lineStyle(i === 2 ? 4 : 2, i === 2 ? 0xffdb97 : 0x78b9ff, 0.32 * grow);
      g.beginPath();
      for (let j = 0; j <= 40; j++) {
        const k = j / 40;
        const x = p.x + c.owner.facing * (k * 620 - 180) * grow;
        const y = p.y + (i - 2) * 28 + Math.sin(k * Math.PI) * Math.sin(c.t / 170 + k * 8 + i) * 25;
        if (j === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokePath();
    }
  },
  impact(c, x, y, final) {
    if (!final) return;
    const wave = c.scene.add.graphics().setDepth(46).setBlendMode(Phaser.BlendModes.ADD);
    const state = { radius: 35, alpha: 0.85 };
    c.scene.tweens.add({ targets: state, radius: 660, alpha: 0, duration: 700, ease: 'Cubic.easeOut',
      onUpdate: () => {
        wave.clear();
        for (let i = 0; i < 5; i++) {
          wave.lineStyle(8 - i, i === 2 ? 0xffdb97 : 0x78b9ff, state.alpha);
          wave.strokeEllipse(x, y, state.radius * 2, state.radius * 0.6 + i * 20);
        }
      }, onComplete: () => wave.destroy() });
    c.scene.cameras.main.shake(200, 0.008);
  },
};
