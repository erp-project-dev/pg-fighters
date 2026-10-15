import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, dotTex, emit, fireworks, rand, slam, type ShowCtx, type SuperShow } from './kit';

/** TAYLOY · EL HONOR DE LA PÚA DE JADE: cintas de luz jade y oro serpentean por la pantalla y suben chispas; remate: estallido de honor. */
export const tayloy: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(g);
    Object.assign(c.data, { g });
  },
  update(c: ShowCtx, dt: number) {
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    // Tres cintas que serpentean de un lado a otro, como un dragón sin cuerpo.
    for (let r = 0; r < 3; r++) {
      const color = r === 1 ? 0xffd166 : 0x2fd08f;
      for (const [w, a] of [[30, 0.07], [8, 0.3]] as const) {
        g.lineStyle(w, color, a);
        g.beginPath();
        for (let k = 0; k <= 60; k++) {
          const x = (k / 60) * (GAME_WIDTH + 200) - 100;
          const y = GAME_HEIGHT * 0.45 + Math.sin(k * 0.22 - c.t / (260 + r * 70) + r * 2) * (180 - r * 40) + Math.cos(k * 0.08 + c.t / 900) * 60;
          if (k === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.strokePath();
      }
    }
    if (Math.random() < dt * 30) emit(c, dotTex(c.scene), rand(0, GAME_WIDTH), GAME_HEIGHT - rand(0, 200), { vy: -rand(120, 260), vx: rand(-30, 30), life: 2, scale: rand(0.4, 1), tint: Math.random() < 0.7 ? 0x2fd08f : 0xffd166, add: true, layer: 'back' });
  },
  impact(c, x, y, final) {
    if (!final) return;
    const t = chest(c.target);
    c.fx.hit(t.x, t.y, 0x2fd08f, true);
    for (let k = 0; k < 3; k++) c.fx.ring(t.x, t.y, k % 2 ? 0xffd166 : 0x2fd08f, 200 + k * 140, 0.5);
    c.scene.cameras.main.shake(360, 0.018);
    fireworks(c, t.x, t.y - 200, [0xe0141e, 0xffd166, 0x2fd08f], 8, 700);
    slam(c.scene, t.x, t.y - 320, '¡HONOR!', '#2fd08f', 160);
  },
};
