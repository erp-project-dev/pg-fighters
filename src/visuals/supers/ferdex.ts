import Phaser from 'phaser';
import { GAME_WIDTH } from '../../config';
import { chest, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, bolt, burst, colorFlash, comet, glowTex, jag, lensVignette, markHit, rays, shockwave, shot, spark, pickTex, victim } from './energy';

const RED = 0xe63a2e;
const GOLD = 0xffcc4d;
const ICE = 0xa8e4ff;

/**
 * FERDEX · LA BENDICIÓN DE CURCUMAN: rayos rojos y dorados giran detrás de él, la pantalla late en rojo
 * y cae una nieve de chispas blancas. Dispara estrellas de energía roja que congelan al rival.
 * Remate: un rayo cae del cielo y quiebra el hielo.
 */
export const ferdex: SuperShow = {
  spin: 900,
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(g);
    Object.assign(c.data, { g });
  },
  update(c: ShowCtx, dt: number) {
    const p = chest(c.owner);
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    rays(g, p.x, p.y - 60, 16, 1800, c.t / 1600, RED, 0.12, 0.09);
    rays(g, p.x, p.y - 60, 16, 1800, c.t / 1600 + Math.PI / 16, GOLD, 0.07, 0.04);
    const vig = lensVignette(c, 0x6a0000);
    if (vig) vig.strength = 0.3 + Math.max(0, Math.sin(c.t / 160)) * 0.25;
    // Invierno eterno: nieve de chispas.
    if (Math.random() < dt * 50) emit(c, glowTex(c.scene), rand(-100, GAME_WIDTH), -20, { vx: rand(30, 120), vy: rand(150, 320), life: 4, scale: rand(0.15, 0.4), tint: 0xffffff, add: true, alpha: 0.8 });
    // El rival se congela: cada golpe lo deja más azul y más quieto.
    const frozen = Math.min(1, (c.data.hits ?? 0) / 4);
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, { tint: since < 100 ? 0xffffff : ICE, fill: since < 100, x: rand(-2, 2) * (1 - frozen) + (since < 150 ? rand(-6, 6) : 0) });
  },
  note(c, x, y, hit, final) {
    return hit ? shot(c, pickTex(c.scene), x, y, final ? 0xff5040 : RED, final ? 1.6 : 1) : spark(c, x, y, RED);
  },
  fly(c, x, y, _age, final) {
    comet(c, x, y, Math.random() < 0.6 ? RED : GOLD, final ? 1.3 : 0.8);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, ICE, 10, 600);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // Rayo de Curcuman desde el cielo.
    const sky = scene.add.graphics().setDepth(47).setBlendMode(ADD);
    let life = 1;
    const ev = scene.time.addEvent({ delay: 30, repeat: 12, callback: () => {
      sky.clear();
      life -= 0.08;
      for (let k = 0; k < 2; k++) bolt(sky, jag(t.x + rand(-60, 60), -40, t.x, t.y, 12, 60), k ? GOLD : RED, 8, life);
    } });
    scene.time.delayedCall(420, () => { ev.remove(); sky.destroy(); });
    colorFlash(scene, 'negative', 220);
    veil(scene, 0xffffff, 0.7, 80, 10, 420, 48);
    shockwave(scene, 0.6, 800);
    burst(c, t.x, t.y, ICE, 50, 1500);
    burst(c, t.x, t.y, 0xffffff, 30, 1000);
    for (let k = 0; k < 5; k++) c.fx.ring(t.x, t.y, k % 2 ? GOLD : RED, 240 + k * 180, 0.5);
    c.fx.hit(t.x, t.y, RED, true);
    scene.cameras.main.shake(700, 0.03);
    slam(scene, GAME_WIDTH / 2, 420, '¡POR CURCUMAN!', '#e76f51', 130);
  },
};
