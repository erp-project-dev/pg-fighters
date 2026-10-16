import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, colorFlash, comet, crescentTex, glowTex, markHit, shockwave, shot, spark, victim } from './energy';

const JADE = 0x19b37a;
const LIGHT = 0x8dffd0;
const GOLD = 0xffd166;

interface Cut { x0: number; y0: number; x1: number; y1: number }

/**
 * TAYLOY · EL HONOR DE LA PÚA DE JADE: un dragón de luz (una cinta larga de energía jade con cabeza brillante)
 * se enrosca alrededor del rival, cada vez más cerca; lanza medias lunas de corte y al rival le quedan los
 * tajos de luz congelados encima. Remate: el dragón choca contra él y todos los tajos estallan a la vez.
 */
export const tayloy: SuperShow = {
  aim: true,
  start(c: ShowCtx) {
    const dragon = c.scene.add.graphics().setBlendMode(ADD);
    const cuts = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(dragon);
    c.front.add(cuts);
    Object.assign(c.data, { dragon, cuts, list: [] as Cut[] });
  },
  update(c: ShowCtx, dt: number) {
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, { tint: since < 100 ? 0xffffff : 0xc8ffe8, fill: since < 100, x: since < 150 ? rand(-8, 8) : 0 });
    // Tajos congelados sobre el rival.
    const cuts = c.data.cuts as Phaser.GameObjects.Graphics;
    cuts.clear();
    if (c.data.finalAt === undefined) {
      const t = chest(c.target);
      for (const s of c.data.list as Cut[]) {
        cuts.lineStyle(14, JADE, 0.3).lineBetween(t.x + s.x0, t.y + s.y0, t.x + s.x1, t.y + s.y1);
        cuts.lineStyle(3, 0xffffff, 0.95).lineBetween(t.x + s.x0, t.y + s.y0, t.x + s.x1, t.y + s.y1);
      }
    }
    // Dragón de luz: se enrosca alrededor del rival, cada vez más cerca, hasta chocar con él en el remate.
    const g = c.data.dragon as Phaser.GameObjects.Graphics;
    g.clear();
    if (c.data.finalAt !== undefined) return;
    const tc = chest(c.target);
    const u = Math.min(1, c.t / c.duration);
    const reach = 820 * (1 - u) + 60;
    const at = (s: number) => ({
      x: tc.x + Math.cos(s * 2.4) * reach * (1 + Math.sin(s * 1.3) * 0.15),
      y: Math.min(tc.y + Math.sin(s * 2.4) * reach * 0.55, GAME_HEIGHT - 120),
    });
    const head = c.t / 600;
    for (let i = 40; i >= 0; i--) {
      const p = at(head - i * 0.03);
      const k = 1 - i / 40;
      const r = 10 + k * 34;
      g.fillStyle(JADE, 0.05 + k * 0.08).fillCircle(p.x, p.y, r * 2);
      g.fillStyle(i % 4 === 0 ? GOLD : LIGHT, 0.25 + k * 0.4).fillCircle(p.x, p.y, r * 0.45);
    }
    const hp = at(head);
    g.fillStyle(0xffffff, 0.9).fillCircle(hp.x, hp.y, 24);
    c.data.head = hp;
    if (Math.random() < dt * 60) emit(c, glowTex(c.scene), hp.x + rand(-30, 30), hp.y + rand(-30, 30), { vx: rand(-80, 80), vy: rand(-180, -40), life: 0.8, scale: rand(0.3, 0.7), grow: -0.5, tint: Math.random() < 0.7 ? JADE : GOLD, add: true, layer: 'back' });
  },
  note(c, x, y, hit, final) {
    return hit ? shot(c, crescentTex(c.scene), x, y, final ? GOLD : JADE, final ? 1.2 : 0.7) : spark(c, x, y, JADE);
  },
  fly(c, x, y, _age, final) {
    comet(c, x, y, final ? GOLD : LIGHT, final ? 1 : 0.6, 0.25);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    const a = rand(0, Math.PI);
    const len = rand(110, 190);
    (c.data.list as Cut[]).push({ x0: -Math.cos(a) * len, y0: -Math.sin(a) * len, x1: Math.cos(a) * len, y1: Math.sin(a) * len });
    burst(c, x, y, JADE, 10, 600);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // El dragón choca contra el rival…
    const hp = (c.data.head as { x: number; y: number } | undefined) ?? t;
    burst(c, hp.x, hp.y, JADE, 30, 1200);
    // …y todos los tajos estallan a la vez.
    for (const s of c.data.list as Cut[]) {
      burst(c, t.x + s.x0, t.y + s.y0, JADE, 8, 900);
      burst(c, t.x + s.x1, t.y + s.y1, GOLD, 8, 900);
    }
    colorFlash(scene, 'burn', 500);
    veil(scene, LIGHT, 0.45, 80, 20, 400, 48);
    shockwave(scene, 0.6, 850);
    for (let k = 0; k < 5; k++) c.fx.ring(t.x, t.y, k % 2 ? GOLD : JADE, 240 + k * 170, 0.5);
    c.fx.hit(t.x, t.y, JADE, true);
    scene.cameras.main.shake(600, 0.026);
    slam(scene, GAME_WIDTH / 2, 420, '¡HONOR!', '#2fd08f', 180);
  },
};
