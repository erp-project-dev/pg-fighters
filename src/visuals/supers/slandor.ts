import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, dotTex, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';

/** SLANDOR · HERENCIA MILLONARIA: destellos dorados en diagonal barren la pantalla y todo brilla; remate: estallido de oro. */
export const slandor: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(g);
    Object.assign(c.data, { g });
  },
  update(c: ShowCtx, dt: number) {
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    // Barridos de brillo en diagonal, como luz sobre oro.
    for (let i = 0; i < 6; i++) {
      const x = ((c.t * 0.9 + i * 420) % (GAME_WIDTH + 900)) - 450;
      const w = 40 + (i % 3) * 30;
      g.fillStyle(0xffd23f, 0.16 + (i % 2) * 0.1);
      g.fillPoints([
        new Phaser.Math.Vector2(x, 0), new Phaser.Math.Vector2(x + w, 0),
        new Phaser.Math.Vector2(x + w - 500, GAME_HEIGHT), new Phaser.Math.Vector2(x - 500, GAME_HEIGHT),
      ], true);
    }
    // Chispas que titilan por toda la pantalla
    if (Math.random() < dt * 90) emit(c, dotTex(c.scene), rand(0, GAME_WIDTH), rand(0, GAME_HEIGHT), { life: 0.4, scale: rand(0.8, 2), tint: 0xffe9a8, add: true, layer: 'back' });
  },
  impact(c, x, y, final) {
    if (!final) return;
    const t = chest(c.target);
    veil(c.scene, 0xffd23f, 0.45, 100);
    for (let k = 0; k < 4; k++) c.fx.ring(t.x, t.y, k % 2 ? 0xffffff : 0xffd23f, 200 + k * 140, 0.5);
    c.fx.hit(t.x, t.y, 0xffd23f, true);
    c.scene.cameras.main.shake(340, 0.018);
    slam(c.scene, t.x, t.y - 300, '$ $ $', '#ffd23f', 160);
  },
};
