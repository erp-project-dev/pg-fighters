import Phaser from 'phaser';
import { GAME_WIDTH } from '../../config';
import { chest, slam, tex, veil, type ShowCtx, type SuperShow } from './kit';

/** Estrella de ocho puntas (dos cuadrados cruzados) con anillos: arabesco geométrico. */
const arabesqueTex = (scene: Phaser.Scene, key: string, size: number, color: number, accent: number) =>
  tex(scene, key, size, size, (g) => {
    const c = size / 2;
    const r = size * 0.42;
    const square = (rot: number) => {
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < 4; i++) pts.push(new Phaser.Math.Vector2(c + Math.cos(rot + (i / 4) * Math.PI * 2) * r, c + Math.sin(rot + (i / 4) * Math.PI * 2) * r));
      return pts;
    };
    g.lineStyle(size / 60, color, 0.9).strokePoints(square(0), true).strokePoints(square(Math.PI / 4), true);
    g.lineStyle(size / 90, accent, 0.9).strokeCircle(c, c, r * 0.7).strokeCircle(c, c, r * 1.05);
    for (let i = 0; i < 16; i++) g.fillStyle(accent, 1).fillCircle(c + Math.cos((i / 16) * Math.PI * 2) * r * 1.05, c + Math.sin((i / 16) * Math.PI * 2) * r * 1.05, size / 120);
    g.lineStyle(size / 120, color, 0.7).strokePoints(square(Math.PI / 8).map((p) => p.set(c + (p.x - c) * 0.55, c + (p.y - c) * 0.55)), true);
  });

/** MARKUS · KABOOOM ORIENTAL: arabescos dorados y azules giran a su alrededor; remate: ¡KABOOOM! de sonido. */
export const markus: SuperShow = {
  spin: 300,
  start(c: ShowCtx) {
    const big = c.scene.add.image(0, 0, arabesqueTex(c.scene, 'sx-arab-big', 620, 0xe0b862, 0x5c9dff)).setBlendMode(Phaser.BlendModes.ADD).setScale(0);
    const small = c.scene.add.image(0, 0, arabesqueTex(c.scene, 'sx-arab-small', 360, 0x5c9dff, 0xe0b862)).setBlendMode(Phaser.BlendModes.ADD).setScale(0);
    c.back.add([big, small]);
    c.scene.tweens.add({ targets: big, scale: 1, duration: 420, ease: 'Back.easeOut' });
    c.scene.tweens.add({ targets: small, scale: 1, delay: 120, duration: 420, ease: 'Back.easeOut' });
    Object.assign(c.data, { big, small, pulseAt: 0 });
  },
  update(c: ShowCtx) {
    const p = chest(c.owner);
    const beat = 1 + Math.sin(c.t / 120) * 0.04;
    (c.data.big as Phaser.GameObjects.Image).setPosition(p.x, p.y - 40).setAngle(c.t / 30).setScale(beat);
    (c.data.small as Phaser.GameObjects.Image).setPosition(p.x, p.y - 40).setAngle(-c.t / 18);
    if (c.t - c.data.pulseAt > 450) {
      c.data.pulseAt = c.t;
      c.fx.ring(p.x, p.y - 40, 0x5c9dff, 240, 0.45);
    }
  },
  impact(c, x, y, final) {
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    veil(scene, 0xffffff, 0.55, 90);
    for (let k = 0; k < 6; k++) scene.time.delayedCall(k * 70, () => c.fx.ring(t.x, t.y, k % 2 ? 0xe0b862 : 0x5c9dff, 220 + k * 170, 0.55));
    c.fx.hit(t.x, t.y, 0x5c9dff, true);
    c.fx.hit(t.x, t.y, 0xe0b862, true);
    scene.cameras.main.shake(650, 0.026);
    slam(scene, GAME_WIDTH / 2, 420, '¡KABOOOOM!', '#5c9dff', 190, -3);
  },
};
