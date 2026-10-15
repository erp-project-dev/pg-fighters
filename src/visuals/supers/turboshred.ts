import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, rand, slam, type ShowCtx, type SuperShow } from './kit';

/** TURBOSHRED · METRÓNOMO EN HUELGA: líneas de velocidad cada vez más rápidas cruzan la pantalla y deja copias de sí mismo; remate: un trazo al rival. */
export const turboshred: SuperShow = {
  start(c: ShowCtx) {
    const lines = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(lines);
    Object.assign(c.data, { lines, ghostAt: 0 });
  },
  update(c: ShowCtx) {
    const o = c.owner;
    const speed = 2 + (c.t / c.duration) * 6; // aceleran durante el solo
    const lines = c.data.lines as Phaser.GameObjects.Graphics;
    lines.clear();
    for (let i = 0; i < 26; i++) {
      const y = ((i * 97 + c.t * 0.05) % (GAME_HEIGHT - 120)) + 40;
      const span = GAME_WIDTH + 600;
      const x = (((i * 331 + c.t * speed * o.facing) % span) + span) % span - 300;
      lines.lineStyle(i % 3 ? 2 : 5, i % 4 ? 0xffee32 : 0xffffff, i % 3 ? 0.18 : 0.32).lineBetween(x, y, x - o.facing * rand(200, 420), y);
    }
    // Copias de sí mismo
    if (c.t - c.data.ghostAt > 70) {
      c.data.ghostAt = c.t;
      c.fx.ghost(o.sprite, 0xffee32, 0.35, 200);
    }
  },
  impact(c, x, y, final) {
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    const from = chest(c.owner);
    const streak = scene.add.graphics().setDepth(47).setBlendMode(Phaser.BlendModes.ADD);
    streak.lineStyle(40, 0xffee32, 0.35).lineBetween(from.x, from.y, t.x, t.y).lineStyle(10, 0xffffff, 1).lineBetween(from.x, from.y, t.x, t.y);
    scene.tweens.add({ targets: streak, alpha: 0, duration: 380, onComplete: () => streak.destroy() });
    c.fx.hit(t.x, t.y, 0xffee32, true);
    scene.cameras.main.shake(300, 0.016);
    slam(scene, t.x, t.y - 300, '¿ESO ERA LENTO?', '#ffee32', 100);
  },
};
