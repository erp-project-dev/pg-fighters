import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, dotTex, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';

const SUN = 0xff9f1c;
const GOLD = 0xffd166;

/**
 * INTI · PACHACUTI ("el mundo se da vuelta"): un sol gigante sale por detrás del escenario y sus rayos giran
 * cada vez más rápido; chispas doradas suben del piso. Remate: el mundo se voltea un instante y cae la luz.
 */
export const inti: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(g);
    Object.assign(c.data, { g, spin: 0, ringAt: 0 });
  },
  update(c: ShowCtx, dt: number) {
    const k = Math.min(1, c.t / c.duration);
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    // El sol sube desde abajo del horizonte hasta quedar detrás de Inti.
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT * (0.95 - 0.55 * Math.min(1, c.t / 900));
    c.data.spin += dt * (0.4 + k * 2.4);
    for (let i = 0; i < 16; i++) {
      const a = c.data.spin + (i / 16) * Math.PI * 2;
      const len = 900 + (i % 2) * 200;
      const w = 0.06;
      g.fillStyle(i % 2 ? GOLD : SUN, 0.12).fillTriangle(
        cx, cy,
        cx + Math.cos(a - w) * len, cy + Math.sin(a - w) * len,
        cx + Math.cos(a + w) * len, cy + Math.sin(a + w) * len,
      );
    }
    for (let r = 260; r > 120; r -= 20) g.fillStyle(SUN, 0.06).fillCircle(cx, cy, r);
    g.fillStyle(GOLD, 0.55).fillCircle(cx, cy, 120);
    // Anillo que late con el huayno.
    if (c.t - c.data.ringAt > 360) {
      c.data.ringAt = c.t;
      const p = chest(c.owner);
      c.fx.ring(p.x, p.y, SUN, 260, 0.5);
    }
    if (Math.random() < dt * 45) emit(c, dotTex(c.scene), rand(0, GAME_WIDTH), GAME_HEIGHT - rand(0, 100), { vy: -rand(220, 420), life: 2.2, scale: rand(0.4, 1), tint: GOLD, add: true, layer: 'back' });
  },
  impact(c, x, y, final) {
    if (!final) {
      c.fx.ring(x, y, GOLD, 90, 0.2);
      return;
    }
    const t = chest(c.target);
    const cam = c.scene.cameras.main;
    // Pachacuti: el mundo se da vuelta y vuelve a su lugar.
    c.scene.tweens.add({ targets: cam, rotation: Math.PI, duration: 160, yoyo: true, hold: 120, ease: 'Quad.easeInOut', onComplete: () => cam.setRotation(0) });
    veil(c.scene, 0xffffff, 0.45, 120);
    cam.shake(380, 0.02);
    c.fx.hit(t.x, t.y, SUN, true);
    for (let k = 0; k < 3; k++) c.fx.ring(t.x, t.y, k % 2 ? 0xffffff : SUN, 220 + k * 150, 0.55);
    slam(c.scene, t.x, t.y - 300, 'PACHACUTI', '#ff9f1c', 140);
  },
};
