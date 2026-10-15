import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, dotTex, emit, rand, slam, type ShowCtx, type SuperShow } from './kit';

const COLORS = [0x5bcefa, 0xf5a9b8, 0xffffff];

/**
 * RICARDO · MI PROPIO SONIDO: haces de luz suben desde el piso (renacer) en celeste, rosa y blanco,
 * y anillos florecen desde él al ritmo del riff; remate: un estallido hacia arriba.
 */
export const ricardo: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(g);
    Object.assign(c.data, { g, ringAt: 0, k: 0 });
  },
  update(c: ShowCtx, dt: number) {
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    // Haces verticales que suben y se desvanecen hacia arriba.
    for (let i = 0; i < 14; i++) {
      const x = ((i * 157 + Math.sin(i * 3.1) * 90) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;
      const rise = ((c.t / (900 + (i % 4) * 160) + i * 0.27) % 1);
      const h = GAME_HEIGHT * (0.3 + 0.5 * rise);
      const color = COLORS[i % COLORS.length];
      g.fillStyle(color, 0.16 * (1 - rise)).fillRect(x - 10, GAME_HEIGHT - h, 20, h);
      g.fillStyle(color, 0.4 * (1 - rise)).fillRect(x - 2, GAME_HEIGHT - h, 4, h);
    }
    // Anillos que florecen desde él cada medio segundo.
    if (c.t - c.data.ringAt > 480) {
      c.data.ringAt = c.t;
      const p = chest(c.owner);
      c.fx.ring(p.x, p.y, COLORS[c.data.k++ % COLORS.length], 320, 0.6);
    }
    if (Math.random() < dt * 40) emit(c, dotTex(c.scene), rand(0, GAME_WIDTH), GAME_HEIGHT - rand(0, 120), { vy: -rand(200, 380), life: 2, scale: rand(0.4, 1), tint: COLORS[Math.floor(rand(0, 3))], add: true, layer: 'back' });
  },
  impact(c, x, y, final) {
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // Estallido que sube como un renacer.
    const burst = scene.add.graphics().setDepth(47).setBlendMode(Phaser.BlendModes.ADD);
    COLORS.forEach((col, i) => burst.fillStyle(col, 0.22).fillRect(t.x - 70 + i * 50, -40, 40, t.y + 40));
    scene.tweens.add({ targets: burst, alpha: 0, duration: 600, onComplete: () => burst.destroy() });
    for (let k = 0; k < 3; k++) c.fx.ring(t.x, t.y, COLORS[k], 220 + k * 140, 0.5);
    c.fx.hit(t.x, t.y, 0x5bcefa, true);
    scene.cameras.main.shake(320, 0.016);
    slam(scene, t.x, t.y - 300, 'ESTE SOY YO', '#5bcefa', 140);
  },
};
