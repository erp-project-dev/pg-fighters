import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../../config';
import { chest, emit, rand, slam, type ShowCtx, type SuperShow } from './kit';
import { ADD, body, burst, colorFlash, comet, glowTex, lensBarrel, markHit, orb, shockwave, spark, victim, wave } from './energy';

const GREEN = 0x2ecc71;
const WATER = 0x5ff0c8;

/**
 * AMU · LA VOZ DEL RÍO: ondas de agua suben desde abajo y la imagen tiembla con cada golpe del manguaré,
 * cada vez más fuerte; dispara ondas verdes que se curvan como agua. La corriente arrastra al rival,
 * que oscila entre burbujas. Remate: una ola de energía verde sube y barre toda la pantalla.
 */
export const amu: SuperShow = {
  spread: 1.6,
  start(c: ShowCtx) {
    const water = c.scene.add.graphics().setBlendMode(ADD);
    const flood = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(water);
    c.front.add(flood);
    Object.assign(c.data, { water, flood, level: 0, thump: 0 });
  },
  update(c: ShowCtx, dt: number) {
    const u = Math.min(1, c.t / c.duration);
    c.data.thump = Math.max(0, c.data.thump - dt * 3);
    // El río sube.
    const g = c.data.water as Phaser.GameObjects.Graphics;
    g.clear();
    const top = GAME_HEIGHT - 80 - u * 260;
    for (let i = 0; i < 6; i++) {
      const y = top + i * 55;
      wave(g, y, 14 + c.data.thump * 30, 90 + i * 14, c.t / (140 - i * 10) + i, i % 2 ? WATER : GREEN, 20, 0.07);
      wave(g, y, 14 + c.data.thump * 30, 90 + i * 14, c.t / (140 - i * 10) + i, i % 2 ? WATER : GREEN, 3, 0.4);
    }
    // Manguaré: la pantalla vibra con cada golpe de tronco.
    const b = lensBarrel(c);
    if (b) b.amount = 1 + c.data.thump * 0.04 + Math.sin(c.t / 90) * 0.003;
    if (Math.random() < dt * 25) emit(c, glowTex(c.scene), rand(0, GAME_WIDTH), GAME_HEIGHT, { vy: -rand(120, 300), vx: rand(-30, 30), life: 2, scale: rand(0.2, 0.5), tint: WATER, add: true, layer: 'back' });
    // Ola final.
    const flood = c.data.flood as Phaser.GameObjects.Graphics;
    flood.clear();
    if (c.data.level > 0) {
      const y = GAME_HEIGHT - c.data.level * (GAME_HEIGHT + 200);
      flood.fillStyle(GREEN, 0.25).fillRect(0, y, GAME_WIDTH, GAME_HEIGHT - y + 40);
      wave(flood, y, 40, 120, c.t / 60, 0xffffff, 8, 0.8);
    }
    // La corriente lo arrastra y suben burbujas.
    const hits = c.data.hits ?? 0;
    if (hits) {
      const bd = body(c.target);
      if (Math.random() < dt * 20) emit(c, glowTex(c.scene), bd.x + rand(-bd.w, bd.w), bd.feet - rand(0, bd.h), { vy: -rand(100, 220), life: 0.8, scale: rand(0.2, 0.4), tint: WATER, add: true });
    }
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, { x: Math.sin(c.t / 260) * 12 * Math.min(1, hits / 2), angle: Math.sin(c.t / 300) * 5 * Math.min(1, hits / 2), y: -Math.abs(Math.sin(c.t / 340)) * 10, tint: since < 120 ? 0xffffff : 0xb9ffe0, fill: since < 120 });
  },
  note(c, x, y, hit, final) {
    return hit ? orb(c, x, y, final ? WATER : GREEN, final ? 50 : 28) : spark(c, x, y, WATER);
  },
  fly(c, x, y, age, final) {
    comet(c, x, y + Math.sin(age * 9) * 24, Math.random() < 0.5 ? GREEN : WATER, final ? 1.3 : 0.8, 0.45);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    c.data.thump = 1;
    c.fx.ring(x, GROUND_Y, GREEN, 260, 0.4);
    burst(c, x, y, WATER, 10, 600);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // La ola sube y barre la pantalla.
    scene.tweens.add({ targets: c.data, level: 1, duration: 520, ease: 'Cubic.easeIn' });
    scene.time.delayedCall(420, () => {
      colorFlash(scene, 'burn', 400, 0.6);
      shockwave(scene, 0.6, 900);
      burst(c, t.x, t.y, WATER, 50, 1500);
      for (let k = 0; k < 5; k++) c.fx.ring(t.x, t.y, k % 2 ? WATER : GREEN, 240 + k * 170, 0.5);
      c.fx.hit(t.x, t.y, GREEN, true);
      scene.cameras.main.shake(700, 0.03);
      slam(scene, GAME_WIDTH / 2, 420, '¡TUM-TUM!', '#2ecc71', 170);
    });
  },
};
