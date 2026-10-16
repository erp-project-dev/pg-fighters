import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../../config';
import { chest, dotTex, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, bolt, burst, colorFlash, comet, every, frame, jag, lensVignette, markHit, missile, shockPose, shockwave, spark, suck, victim, zapArcs } from './energy';

const RED = 0xff173d;
const VIOLET = 0x6a00ff;

interface Bolt { pts: Phaser.Math.Vector2[]; life: number }

/** Grieta de la pantalla: nace en un borde y avanza quebrada hacia el centro. */
const crack = () => {
  const side = Math.floor(rand(0, 4));
  const x0 = side === 0 ? 0 : side === 1 ? GAME_WIDTH : rand(0, GAME_WIDTH);
  const y0 = side === 2 ? 0 : side === 3 ? GAME_HEIGHT : rand(0, GAME_HEIGHT);
  const x1 = x0 + (GAME_WIDTH / 2 - x0) * rand(0.3, 0.6) + rand(-200, 200);
  const y1 = y0 + (GAME_HEIGHT / 2 - y0) * rand(0.3, 0.6) + rand(-120, 120);
  return jag(x0, y0, x1, y1, 8, 40);
};

/**
 * EL ACOPLE · LA ÚLTIMA FECHA: un agujero negro detrás de él se traga la luz y escupe misiles de plasma
 * que persiguen al rival en curvas. Cada golpe lo electrocuta y agrieta la pantalla.
 * Remate: los misiles convergen, implosión, silencio y estallido de feedback.
 */
export const acople: SuperShow = {
  lift: 50,
  aim: true,
  spread: 2.6,
  start(c: ShowCtx) {
    const vortex = c.scene.add.graphics();
    const glow = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add([vortex, glow]);
    const bolts = c.scene.add.graphics().setBlendMode(ADD);
    const edge = c.scene.add.graphics();
    c.front.add([bolts, edge]);
    Object.assign(c.data, { vortex, glow, bolts, edge, list: [] as Bolt[], cracks: [] as Phaser.Math.Vector2[][] });
    c.scene.cameras.main.shake(300, 0.006);
  },
  update(c: ShowCtx, dt: number) {
    const p = chest(c.owner);
    const t = c.t;
    // Agujero negro: anillos de energía oscura que giran hacia adentro.
    const v = c.data.vortex as Phaser.GameObjects.Graphics;
    const glow = c.data.glow as Phaser.GameObjects.Graphics;
    v.clear();
    glow.clear();
    const grow = Math.min(1, t / 500);
    for (let r = 10; r >= 1; r--) {
      const radius = r * 52 * grow;
      v.fillStyle(r % 2 ? 0x12000a : 0x2a0018, 0.5).fillCircle(p.x, p.y, radius);
      const a0 = t / (160 + r * 40) * (r % 2 ? 1 : -1);
      glow.lineStyle(5, r % 3 ? 0xb3001e : VIOLET, 0.6);
      glow.beginPath();
      glow.arc(p.x, p.y, radius, a0, a0 + Math.PI * 0.8);
      glow.strokePath();
    }
    v.fillStyle(0x000000, 1).fillCircle(p.x, p.y, 70 * grow + Math.sin(t / 60) * 6);
    glow.lineStyle(4, RED, 0.95).strokeCircle(p.x, p.y, 74 * grow + Math.sin(t / 60) * 6);
    if (Math.random() < dt * 60) suck(c, p.x, p.y, Math.random() < 0.5 ? 0x1a0010 : RED);
    // Rayos oscuros al suelo y descargas sobre el rival tras cada golpe.
    const list = c.data.list as Bolt[];
    if (every(c, 'boltAt', 140)) {
      const gx = p.x + rand(-760, 760);
      list.push({ pts: jag(p.x, p.y, gx, GROUND_Y, 10, 45), life: 0.18 });
      if (Math.random() < 0.4) c.fx.dust(gx, GROUND_Y, Math.sign(gx - p.x) || 1, 5);
    }
    const bolts = c.data.bolts as Phaser.GameObjects.Graphics;
    bolts.clear();
    for (const b of list) {
      b.life -= dt;
      bolt(bolts, b.pts, VIOLET, 3, Math.max(0, b.life / 0.18));
    }
    c.data.list = list.filter((b) => b.life > 0);
    const since = c.t - (c.data.hitAt ?? -9999);
    if (since < 420) zapArcs(bolts, c.target, RED, 4, 3);
    victim(c, since < 420 ? shockPose(c.t, since < 200 ? 0x000000 : RED, 1.4) : { x: rand(-3, 3), tint: 0xff9aa8 });
    // Bordes que laten y grietas acumuladas.
    const edge = c.data.edge as Phaser.GameObjects.Graphics;
    edge.clear();
    frame(edge, 0x3a0010, 0.35 + Math.sin(t / 110) * 0.12);
    for (const k of c.data.cracks as Phaser.Math.Vector2[][]) {
      edge.lineStyle(6, RED, 0.25).strokePoints(k);
      edge.lineStyle(2, 0xffd6dc, 0.85).strokePoints(k);
    }
    if (every(c, 'ringAt', 380)) c.fx.ring(p.x, p.y, RED, 320, 0.5);
    const vig = lensVignette(c, 0x2a0010);
    if (vig) vig.strength = 0.25 + Math.sin(t / 110) * 0.1;
  },
  note(c, x, y, hit, final) {
    if (!hit) return spark(c, x, y, Math.random() < 0.5 ? RED : VIOLET);
    return missile(c, x, y, final ? 0xffffff : Math.random() < 0.5 ? RED : VIOLET, final ? 46 : 28);
  },
  fly(c, x, y, _age, final) {
    comet(c, x, y, final ? RED : Math.random() < 0.5 ? RED : VIOLET, final ? 1.3 : 0.8);
    if (Math.random() < 0.08) emit(c, dotTex(c.scene), x, y, { vx: rand(-200, 200), vy: rand(-200, 200), life: 0.25, tint: 0xffffff, add: true });
  },
  impact(c, x, y, final) {
    markHit(c, final);
    (c.data.cracks as Phaser.Math.Vector2[][]).push(crack());
    burst(c, x, y, RED, 10, 600);
    if (!final) {
      shockwave(c.scene, 0.06, 300);
      return;
    }
    // Implosión: un anillo se cierra sobre el rival, silencio… y revienta.
    const scene = c.scene;
    const t = chest(c.target);
    veil(scene, 0x000000, 0.92, 380, 40, 300, 47);
    const ring = scene.add.graphics().setDepth(49).setBlendMode(ADD);
    const state = { r: 1100 };
    scene.tweens.add({
      targets: state, r: 0, duration: 380, ease: 'Cubic.easeIn',
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(26, RED, 0.9).strokeCircle(t.x, t.y, state.r);
        ring.lineStyle(10, VIOLET, 0.8).strokeCircle(t.x, t.y, state.r * 0.8);
      },
      onComplete: () => {
        ring.destroy();
        colorFlash(scene, 'negative', 420);
        shockwave(scene, 0.7, 900);
        veil(scene, RED, 0.55, 80, 20, 500, 48);
        for (let k = 0; k < 6; k++) c.fx.ring(t.x, t.y, k % 2 ? VIOLET : RED, 260 + k * 170, 0.5 + k * 0.12);
        c.fx.hit(t.x, t.y, RED, true);
        c.fx.hit(t.x, t.y, VIOLET, true);
        scene.cameras.main.shake(700, 0.03);
        slam(scene, GAME_WIDTH / 2, 420, 'FEEDBACK TOTAL', '#ff173d', 140, 0);
      },
    });
  },
};
