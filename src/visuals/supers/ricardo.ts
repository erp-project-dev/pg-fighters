import Phaser from 'phaser';
import { GAME_WIDTH } from '../../config';
import { chest, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, colorFlash, comet, every, glowTex, heartAt, lensColor, markHit, orb, shockwave, spark, victim, wave } from './energy';

const SKY = 0xb04dff;
const PINK = 0xff5fc8;

/**
 * RICARDO · MI PROPIO SONIDO: todo empieza apagado y gris (las canciones ajenas) y cada golpe le devuelve
 * color a la pantalla. Lanza ondas moradas cada vez más fuertes; el rival se queda gris, sin color.
 * Remate: un corazón de luz gigante se enciende sobre el rival y explota devolviendo todo el color.
 */
export const ricardo: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(g);
    Object.assign(c.data, { g, color: 0 });
  },
  update(c: ShowCtx) {
    const hits = c.data.hits ?? 0;
    // El color vuelve de a poco con cada golpe.
    const target = c.data.finalAt !== undefined ? 1 : Math.min(0.75, hits * 0.1);
    c.data.color += (target - c.data.color) * 0.08;
    const cm = lensColor(c);
    if (cm) {
      cm.colorMatrix.grayscale(1);
      cm.colorMatrix.alpha = 1 - c.data.color;
    }
    // Ondas celestes que salen de él, más grandes con cada golpe.
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    const p = chest(c.owner);
    for (let i = 0; i < 4; i++) wave(g, p.y + (i - 1.5) * 90, 20 + hits * 6, 80, c.t / 70 + i, SKY, 4 + hits, 0.15 + c.data.color * 0.4, Math.min(p.x, c.target.x), Math.max(p.x, c.target.x));
    if (every(c, 'ringAt', 360)) c.fx.ring(p.x, p.y, SKY, 220 + hits * 30, 0.5);
    // El rival se queda gris.
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, { tint: since < 120 ? SKY : 0x8a8a8a, fill: since < 120, x: since < 180 ? (Math.floor(c.t / 40) % 2 ? 8 : -8) : 0 });
  },
  note(c, x, y, hit, final) {
    return hit ? orb(c, x, y, SKY, final ? 56 : 22 + (c.data.hits ?? 0) * 4) : spark(c, x, y, SKY);
  },
  fly(c, x, y, age, final) {
    comet(c, x, y + Math.sin(age * 16) * 12, SKY, final ? 1.4 : 0.8 + (c.data.hits ?? 0) * 0.05);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, SKY, 10, 600);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // Corazón de luz que crece sobre el rival…
    const heart = scene.add.graphics().setDepth(47).setBlendMode(ADD);
    const st = { r: 40 };
    const draw = () => {
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= 60; i++) {
        const p = heartAt(i / 60, st.r);
        pts.push(new Phaser.Math.Vector2(t.x + p.x, t.y + p.y));
      }
      heart.clear();
      heart.fillStyle(PINK, 0.18).fillPoints(pts, true);
      heart.lineStyle(30, SKY, 0.25).strokePoints(pts, true);
      heart.lineStyle(8, 0xffffff, 0.95).strokePoints(pts, true);
    };
    scene.tweens.add({
      targets: st, r: 260, duration: 380, ease: 'Back.easeOut', onUpdate: draw,
      onComplete: () => {
        // …y explota: partículas que salen con forma de corazón.
        heart.destroy();
        for (let i = 0; i < 90; i++) {
          const p = heartAt(i / 90, 1);
          const sp = rand(900, 1300);
          emit(c, glowTex(scene), t.x + p.x * 200, t.y + p.y * 200, { vx: p.x * sp, vy: p.y * sp, life: 0.8, scale: rand(0.6, 1.2), grow: -0.9, tint: i % 3 ? SKY : PINK, add: true });
        }
        colorFlash(scene, 'saturate', 1000);
        veil(scene, PINK, 0.5, 100, 20, 500, 48);
        shockwave(scene, 0.7, 900);
        for (let k = 0; k < 6; k++) c.fx.ring(t.x, t.y, k % 2 ? PINK : SKY, 240 + k * 170, 0.5 + k * 0.08);
        c.fx.hit(t.x, t.y, SKY, true);
        scene.cameras.main.shake(600, 0.026);
        slam(scene, GAME_WIDTH / 2, 420, 'ESTE SOY YO', '#c77dff', 150);
      },
    });
  },
};
