import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, emit, fireworks, rand, slam, tex, type ShowCtx, type SuperShow } from './kit';

const RIBBONS = [0x0055a4, 0xffffff, 0xef4135, 0x8ecae6];

const petalTex = (scene: Phaser.Scene) => tex(scene, 'sx-petal', 20, 12, (g) => g.fillStyle(0xffffff, 1).fillEllipse(10, 6, 20, 12));

/** JEAN-PIERRE · GIRA EUROPEA: cintas de luz ondulan por la pantalla como un viento elegante, con pétalos; remate: MERCI. */
export const jeanpierre: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(g);
    Object.assign(c.data, { g });
  },
  update(c: ShowCtx, dt: number) {
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    RIBBONS.forEach((col, i) => {
      const base = GAME_HEIGHT * (0.22 + i * 0.16);
      for (const [w, a] of [[26, 0.08], [6, 0.3]] as const) {
        g.lineStyle(w, col, a);
        g.beginPath();
        for (let x = -40; x <= GAME_WIDTH + 40; x += 20) {
          const y = base + Math.sin(x / 260 + c.t / 520 + i * 1.7) * 90 + Math.sin(x / 90 + c.t / 300) * 14;
          if (x === -40) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.strokePath();
      }
    });
    if (Math.random() < dt * 30) emit(c, petalTex(c.scene), rand(0, GAME_WIDTH), -20, { vy: rand(90, 170), vx: rand(40, 140), spin: rand(-200, 200), tint: Math.random() < 0.5 ? 0xffc2d1 : 0xff8fab, life: 6 });
  },
  impact(c, x, y, final) {
    if (!final) return;
    const t = chest(c.target);
    c.fx.hit(t.x, t.y, 0xff4d79, true);
    c.scene.cameras.main.shake(280, 0.014);
    fireworks(c, t.x, t.y - 280, [0x0055a4, 0xffffff, 0xef4135], 7, 600);
    slam(c.scene, t.x, t.y - 300, 'MERCI', '#8ecae6', 170, -4);
  },
};
