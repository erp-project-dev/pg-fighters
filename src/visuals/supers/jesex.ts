import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, dotTex, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';

/** JESEX · GIRA MUNDIAL: la pantalla se baña en dorado, brillos de lujo la cruzan y cae escarcha; remate: sello de PAGADO. */
export const jesex: SuperShow = {
  start(c: ShowCtx) {
    const tint = c.scene.add.rectangle(-60, -60, GAME_WIDTH + 120, GAME_HEIGHT + 120, 0xecd08a, 0).setOrigin(0);
    const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add([tint, g]);
    Object.assign(c.data, { tint, g });
  },
  update(c: ShowCtx, dt: number) {
    (c.data.tint as Phaser.GameObjects.Rectangle).setAlpha((0.08 + Math.sin(c.t / 200) * 0.03) * Math.min(1, c.t / 500));
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    // Destellos en cruz que aparecen y se apagan, como flashes de lujo.
    for (let i = 0; i < 9; i++) {
      const life = ((c.t / 700 + i * 0.37) % 1);
      const x = ((i * 613) % GAME_WIDTH);
      const y = ((i * 271) % (GAME_HEIGHT - 200)) + 60;
      const s = Math.sin(life * Math.PI) * 70;
      g.lineStyle(3, 0xfff3c4, 0.6 * Math.sin(life * Math.PI)).lineBetween(x - s, y, x + s, y).lineBetween(x, y - s, x, y + s);
      g.fillStyle(0xffffff, 0.5 * Math.sin(life * Math.PI)).fillCircle(x, y, 5);
    }
    // Escarcha dorada que cae despacio
    if (Math.random() < dt * 50) emit(c, dotTex(c.scene), rand(0, GAME_WIDTH), -10, { vy: rand(60, 140), vx: rand(-20, 20), life: 6, scale: rand(0.2, 0.5), tint: 0xffe08a, add: true, layer: 'back' });
  },
  impact(c, x, y, final) {
    if (!final) return;
    const t = chest(c.target);
    c.fx.hit(t.x, t.y, 0xecd08a, true);
    veil(c.scene, 0xecd08a, 0.3, 100);
    c.scene.cameras.main.shake(300, 0.016);
    const stamp = slam(c.scene, t.x, t.y - 120, 'PAGADO', '#ff3b3b', 140, -14);
    const frame = c.scene.add.graphics().setDepth(55).setAngle(-14).setPosition(t.x, t.y - 120);
    frame.lineStyle(10, 0xff3b3b, 1).strokeRoundedRect(-stamp.width / 2 - 20, -stamp.height / 2 - 6, stamp.width + 40, stamp.height + 12, 14);
    frame.setScale(2.6).setAlpha(0);
    c.scene.tweens.add({ targets: frame, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    c.scene.tweens.add({ targets: frame, alpha: 0, delay: 900, duration: 380, onComplete: () => frame.destroy() });
  },
};
