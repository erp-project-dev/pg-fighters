import Phaser from 'phaser';
import { GAME_WIDTH } from '../../config';
import { chest, chipTex, emit, pick, rand, slam, type ShowCtx, type SuperShow } from './kit';

const CONFETTI = [0x4dff88, 0xffffff, 0xffe14d, 0x3dd6ff];

/** MIMÉTICO · COPIA EXACTA: líneas de enfoque estilo manga apuntan a él, como un estadio que lo mira; remate: ¡COPIADO! */
export const mimetico: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(g);
    Object.assign(c.data, { g, seed: 0 });
  },
  update(c: ShowCtx, dt: number) {
    const p = chest(c.owner);
    const g = c.data.g as Phaser.GameObjects.Graphics;
    // Las líneas se redibujan a saltos (cada 70 ms), como el parpadeo de una viñeta.
    if (c.t - c.data.seed > 70) {
      c.data.seed = c.t;
      g.clear();
      for (let i = 0; i < 70; i++) {
        const a = rand(0, Math.PI * 2);
        const r0 = rand(260, 420);
        const r1 = 1500;
        g.lineStyle(rand(2, 7), Math.random() < 0.2 ? 0x4dff88 : 0xffffff, rand(0.08, 0.22));
        g.lineBetween(p.x + Math.cos(a) * r0, p.y + Math.sin(a) * r0, p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1);
      }
    }
    if (Math.random() < dt * 30) emit(c, chipTex(c.scene), rand(0, GAME_WIDTH), -20, { vy: rand(150, 260), vx: rand(-80, 80), spin: rand(-500, 500), scale: rand(0.5, 0.9), tint: pick(CONFETTI), life: 4 });
  },
  impact(c, x, y, final) {
    if (!final) return;
    const t = chest(c.target);
    c.fx.hit(t.x, t.y, 0x4dff88, true);
    for (let k = 0; k < 4; k++) c.fx.ring(t.x, t.y, k % 2 ? 0xffffff : 0x4dff88, 220 + k * 140, 0.5);
    c.scene.cameras.main.shake(400, 0.016);
    for (let i = 0; i < 60; i++) emit(c, chipTex(c.scene), t.x, t.y, { vx: rand(-700, 700), vy: rand(-1000, -300), gravity: 900, spin: rand(-600, 600), tint: pick(CONFETTI), life: 2 });
    slam(c.scene, GAME_WIDTH / 2, 420, '¡COPIADO!', '#4dff88', 180, -4);
  },
};
