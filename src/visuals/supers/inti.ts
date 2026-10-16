import Phaser from 'phaser';
import { GAME_WIDTH, GROUND_Y } from '../../config';
import { chest, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, colorFlash, comet, glowTex, lensColor, markHit, orb, rays, ringTex, shockwave, spark, victim } from './energy';

const SUN = 0xff9f1c;
const GOLD = 0xffd166;

/**
 * INTI · PACHACUTI ("el mundo se da vuelta"): un eclipse apaga el escenario y luego sale un sol gigante de luz
 * detrás de él. Dispara discos solares que queman al rival. Remate (solo si conecta): el mundo se da vuelta
 * un instante y una llamarada solar blanquea la pantalla.
 */
export const inti: SuperShow = {
  spin: 400,
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(ADD);
    const moon = c.scene.add.graphics();
    c.back.add([g, moon]);
    Object.assign(c.data, { g, moon, spin: 0 });
    const cam = c.scene.cameras.main;
    c.cleanup.push(() => cam.setRotation(0));
  },
  update(c: ShowCtx, dt: number) {
    const u = Math.min(1, c.t / c.duration);
    const sun = { x: c.owner.x - c.owner.facing * 120, y: 330 };
    // Eclipse (primer tercio): todo se oscurece y queda un anillo de corona.
    const eclipse = Math.max(0, 1 - u / 0.33);
    const rise = Math.min(1, Math.max(0, (u - 0.25) / 0.25));
    const cm = lensColor(c);
    if (cm) {
      cm.colorMatrix.brightness(0.35 + 0.65 * (1 - eclipse) + rise * 0.15);
      cm.colorMatrix.alpha = 1;
    }
    c.data.spin += dt * (0.3 + u * 2.4);
    const g = c.data.g as Phaser.GameObjects.Graphics;
    const moon = c.data.moon as Phaser.GameObjects.Graphics;
    g.clear();
    moon.clear();
    const r = 150 + rise * 120;
    rays(g, sun.x, sun.y, 18, 1600 * (0.3 + rise * 0.7), c.data.spin, SUN, 0.06 + rise * 0.1, 0.07);
    rays(g, sun.x, sun.y, 9, 1100 * (0.3 + rise * 0.7), -c.data.spin * 0.7, GOLD, 0.05 + rise * 0.08, 0.05);
    for (let k = 6; k > 0; k--) g.fillStyle(k % 2 ? SUN : GOLD, 0.08 + rise * 0.08).fillCircle(sun.x, sun.y, r + k * 40);
    g.fillStyle(0xfff4d6, 0.4 + rise * 0.6).fillCircle(sun.x, sun.y, r);
    if (eclipse > 0) moon.fillStyle(0x000000, eclipse * 0.95).fillCircle(sun.x + (1 - eclipse) * 80, sun.y, r * 1.02);
    // Chispas de fuego que suben del piso.
    if (Math.random() < dt * 50) emit(c, glowTex(c.scene), rand(0, GAME_WIDTH), GROUND_Y + 40, { vy: -rand(300, 700), life: 1.6, scale: rand(0.3, 0.8), grow: -0.3, tint: Math.random() < 0.6 ? SUN : GOLD, add: true, layer: 'back' });
    // El rival se quema: parpadea en naranja y tiembla con el calor.
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, { x: rand(-3, 3), sy: 1 + Math.sin(c.t / 50) * 0.02, tint: since < 160 ? 0xffffff : 0xffb36b, fill: since < 160 });
  },
  note(c, x, y, hit, final) {
    if (!hit) return spark(c, x, y, SUN);
    const disc = orb(c, x, y, SUN, final ? 48 : 30);
    disc.add(c.scene.add.image(0, 0, ringTex(c.scene)).setTint(GOLD).setBlendMode(ADD).setScale(final ? 1.1 : 0.7));
    return disc;
  },
  fly(c, x, y, _age, final) {
    comet(c, x, y, Math.random() < 0.5 ? SUN : GOLD, final ? 1.4 : 0.9);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, SUN, 14, 700);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // Pachacuti (solo si el remate conecta): el mundo da una vuelta rápida y cae la llamarada.
    const cam = scene.cameras.main;
    scene.tweens.add({ targets: cam, rotation: Math.PI, duration: 260, ease: 'Cubic.easeOut' });
    scene.tweens.add({ targets: cam, rotation: 0, delay: 420, duration: 260, ease: 'Cubic.easeIn' });
    scene.time.delayedCall(300, () => {
      colorFlash(scene, 'burn', 700);
      veil(scene, 0xfff4d6, 0.8, 140, 20, 600, 48);
      shockwave(scene, 0.7, 900);
      for (let k = 0; k < 6; k++) c.fx.ring(t.x, t.y, k % 2 ? GOLD : SUN, 260 + k * 180, 0.5 + k * 0.1);
      c.fx.hit(t.x, t.y, SUN, true);
      burst(c, t.x, t.y, GOLD, 50, 1400);
      scene.cameras.main.shake(700, 0.03);
      slam(scene, GAME_WIDTH / 2, 420, 'PACHACUTI', '#ff9f1c', 170, 0);
    });
  },
};
