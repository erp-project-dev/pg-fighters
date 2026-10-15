import Phaser from 'phaser';
import { GROUND_Y } from '../../config';
import { chest, dotTex, emit, head, rand, slam, tex, veil, type ShowCtx, type SuperShow } from './kit';

const crossTex = (scene: Phaser.Scene) =>
  tex(scene, 'sx-cross', 64, 96, (g) => {
    g.fillStyle(0xfff3b0, 0.25).fillRect(16, 0, 32, 96).fillRect(0, 20, 64, 32);
    g.fillStyle(0xffffff, 1).fillRect(24, 4, 16, 88).fillRect(6, 28, 52, 16);
    g.fillStyle(0xffd166, 1).fillRect(28, 8, 8, 80).fillRect(10, 32, 44, 8);
  });

const ORBIT = 7;

/** TOXICITY · EXCOMUNIÓN TOTAL: brilla bañada en haces de luz con cruces de luz girando a su alrededor; remate: un pilar de luz sobre el rival. */
export const toxicity: SuperShow = {
  start(c: ShowCtx) {
    crossTex(c.scene);
    const rays = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(rays);
    c.data.rays = rays;
    c.data.orbit = Array.from({ length: ORBIT }, () => {
      const img = c.scene.add.image(0, 0, 'sx-cross').setBlendMode(Phaser.BlendModes.ADD);
      c.front.add(img);
      return img;
    });
    c.data.glowAt = 0;
  },
  update(c: ShowCtx, dt: number) {
    const o = c.owner;
    const h = head(o);
    const p = chest(o);
    // Haces de luz que bajan del cielo sobre ella
    const rays = c.data.rays as Phaser.GameObjects.Graphics;
    rays.clear();
    const pulse = 0.5 + Math.sin(c.t / 160) * 0.5;
    for (let i = -3; i <= 3; i++) {
      const w = 60 + Math.abs(i) * 20;
      rays.fillStyle(0xfff3b0, 0.05 + pulse * 0.03).fillTriangle(h.x + i * 30, -40, h.x + i * 150 - w, GROUND_Y, h.x + i * 150 + w, GROUND_Y);
    }
    rays.fillStyle(0xfff3b0, 0.18 + pulse * 0.1).fillCircle(h.x, h.y + 30, 110);
    // Cruces de luz girando a su alrededor (las de atrás más chicas y tenues)
    (c.data.orbit as Phaser.GameObjects.Image[]).forEach((img, i) => {
      const a = c.t / 420 + (i / ORBIT) * Math.PI * 2;
      const depth = Math.sin(a);
      img.setPosition(p.x + Math.cos(a) * 190, p.y + depth * 50 - 20).setScale(0.55 + depth * 0.2).setAlpha(0.55 + depth * 0.45);
    });
    // Brilla: fantasma dorado y chispas que suben
    if (c.t - c.data.glowAt > 110) {
      c.data.glowAt = c.t;
      c.fx.ghost(o.sprite, 0xfff3b0, 0.55, 300, 0.03);
    }
    if (Math.random() < dt * 30) emit(c, dotTex(c.scene), p.x + rand(-160, 160), p.y + rand(-200, 200), { vy: -rand(80, 200), life: 0.9, scale: rand(0.4, 0.9), tint: 0xffe08a, add: true });
  },
  note(c, x, y, hit) {
    return c.scene.add.image(x, y, crossTex(c.scene)).setScale(hit ? 1 : 0.45).setBlendMode(Phaser.BlendModes.ADD);
  },
  impact(c, x, y, final) {
    if (!final) return void c.fx.ring(x, y, 0xffd166, 110, 0.3);
    const scene = c.scene;
    const t = chest(c.target);
    // Pilar de luz que cae sobre el rival.
    const pillar = scene.add.graphics().setDepth(47).setBlendMode(Phaser.BlendModes.ADD);
    for (let i = 0; i < 5; i++) pillar.fillStyle(0xfff3b0, 0.14).fillRect(t.x - 30 - i * 24, -40, 60 + i * 48, GROUND_Y + 40);
    scene.tweens.add({ targets: pillar, alpha: 0, delay: 350, duration: 450, onComplete: () => pillar.destroy() });
    veil(scene, 0xffffff, 0.8, 120);
    c.fx.hit(t.x, t.y, 0xffd166, true);
    for (let k = 0; k < 4; k++) c.fx.ring(t.x, t.y, 0xfff3b0, 180 + k * 90, 0.5 + k * 0.1);
    scene.cameras.main.shake(380, 0.018);
    slam(scene, t.x, t.y - 300, '¡EXCOMULGADO!', '#ffd166', 110);
  },
};
