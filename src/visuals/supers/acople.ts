import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../../config';
import { chest, dotTex, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';

interface Bolt {
  pts: { x: number; y: number }[];
  life: number;
}

/** Rayo quebrado entre dos puntos. */
const jagged = (x0: number, y0: number, x1: number, y1: number, steps = 9, amp = 50) => {
  const pts = [{ x: x0, y: y0 }];
  for (let i = 1; i < steps; i++) {
    const k = i / steps;
    pts.push({ x: x0 + (x1 - x0) * k + rand(-amp, amp), y: y0 + (y1 - y0) * k + rand(-amp, amp) });
  }
  pts.push({ x: x1, y: y1 });
  return pts;
};

/**
 * EL ACOPLE · LA ÚLTIMA FECHA (energía oscura): un vórtice negro y rojo detrás de él se traga la luz,
 * rayos oscuros golpean el suelo y el escenario se cierra. Remate: implosión y estallido de feedback.
 * Sus orbes siguen siendo los proyectiles.
 */
export const acople: SuperShow = {
  lift: 50,
  start(c: ShowCtx) {
    const vortex = c.scene.add.graphics();
    const glow = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add([vortex, glow]);
    const bolts = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    const vignette = c.scene.add.graphics();
    c.front.add([bolts, vignette]);
    Object.assign(c.data, { vortex, glow, bolts, vignette, list: [] as Bolt[], boltAt: 0, ringAt: 0 });
    c.scene.cameras.main.shake(300, 0.006);
  },
  update(c: ShowCtx, dt: number) {
    const p = chest(c.owner);
    const t = c.t;
    // Vórtice: anillos de energía oscura girando hacia adentro y un núcleo negro
    const v = c.data.vortex as Phaser.GameObjects.Graphics;
    const glow = c.data.glow as Phaser.GameObjects.Graphics;
    v.clear();
    glow.clear();
    const grow = Math.min(1, t / 500);
    for (let r = 9; r >= 1; r--) {
      const radius = r * 48 * grow;
      v.fillStyle(r % 2 ? 0x12000a : 0x2a0018, 0.5).fillCircle(p.x, p.y, radius);
      const a0 = t / (180 + r * 40) * (r % 2 ? 1 : -1);
      glow.lineStyle(4, r % 3 ? 0xb3001e : 0x6a00ff, 0.55);
      glow.beginPath();
      glow.arc(p.x, p.y, radius, a0, a0 + Math.PI * 0.7);
      glow.strokePath();
    }
    v.fillStyle(0x000000, 1).fillCircle(p.x, p.y, 70 * grow + Math.sin(t / 60) * 6);
    glow.lineStyle(3, 0xff173d, 0.9).strokeCircle(p.x, p.y, 74 * grow + Math.sin(t / 60) * 6);
    // Partículas tragadas por el vórtice (oscuras y rojas)
    if (Math.random() < dt * 45) {
      const a = rand(0, Math.PI * 2);
      const d = rand(380, 620);
      const life = d / 700;
      const dark = Math.random() < 0.5;
      emit(c, dotTex(c.scene), p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, {
        vx: -Math.cos(a) * 700, vy: -Math.sin(a) * 700, life, scale: rand(0.6, 1.4), tint: dark ? 0x1a0010 : 0xff173d, add: !dark, layer: 'back',
      });
    }
    // Rayos oscuros que caen al suelo
    const list = c.data.list as Bolt[];
    if (t - c.data.boltAt > 160) {
      c.data.boltAt = t;
      const gx = p.x + rand(-700, 700);
      list.push({ pts: jagged(p.x, p.y, gx, GROUND_Y, 10, 45), life: 0.18 });
      if (Math.random() < 0.4) c.fx.dust(gx, GROUND_Y, Math.sign(gx - p.x) || 1, 5);
    }
    const bolts = c.data.bolts as Phaser.GameObjects.Graphics;
    bolts.clear();
    for (const b of list) {
      b.life -= dt;
      const k = Math.max(0, b.life / 0.18);
      bolts.lineStyle(10 * k + 2, 0x6a00ff, 0.35 * k).strokePoints(b.pts as Phaser.Math.Vector2[]);
      bolts.lineStyle(3, 0xff3b5c, k).strokePoints(b.pts as Phaser.Math.Vector2[]);
    }
    c.data.list = list.filter((b) => b.life > 0);
    // Anillos de feedback
    if (t - c.data.ringAt > 380) {
      c.data.ringAt = t;
      c.fx.ring(p.x, p.y, 0xff173d, 300, 0.5);
    }
    // El escenario se cierra: bordes rojos oscuros que laten
    const vg = c.data.vignette as Phaser.GameObjects.Graphics;
    const beat = 0.35 + Math.sin(t / 110) * 0.12;
    vg.clear();
    for (let k = 0; k < 6; k++) {
      const w = 40 + k * 30;
      vg.lineStyle(w, k < 2 ? 0x000000 : 0x3a0010, beat * (1 - k / 7)).strokeRect(-60 + w / 2, -60 + w / 2, GAME_WIDTH + 120 - w, GAME_HEIGHT + 120 - w);
    }
  },
  impact(c, x, y, final) {
    if (!final) return;
    // Implosión: un anillo rojo se cierra sobre el rival… y revienta.
    const scene = c.scene;
    const t = chest(c.target);
    veil(scene, 0x000000, 0.9, 380, 40, 300, 47);
    const ring = scene.add.graphics().setDepth(49).setBlendMode(Phaser.BlendModes.ADD);
    const state = { r: 1100 };
    scene.tweens.add({
      targets: state, r: 0, duration: 380, ease: 'Cubic.easeIn',
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(26, 0xff173d, 0.9).strokeCircle(t.x, t.y, state.r);
        ring.lineStyle(10, 0x6a00ff, 0.8).strokeCircle(t.x, t.y, state.r * 0.8);
      },
      onComplete: () => {
        ring.destroy();
        veil(scene, 0xff173d, 0.6, 80, 20, 500, 48);
        for (let k = 0; k < 5; k++) c.fx.ring(t.x, t.y, k % 2 ? 0x6a00ff : 0xff173d, 260 + k * 160, 0.5 + k * 0.12);
        c.fx.hit(t.x, t.y, 0xff173d, true);
        c.fx.hit(t.x, t.y, 0x6a00ff, true);
        scene.cameras.main.shake(700, 0.03);
        slam(scene, GAME_WIDTH / 2, 420, 'FEEDBACK TOTAL', '#ff173d', 140, 0);
      },
    });
  },
};
