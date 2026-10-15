import Phaser from 'phaser';
import { FONTS, GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, emit, rand, slam, tex, type ShowCtx, type SuperShow } from './kit';

const MONO = 'Menlo, Consolas, "Courier New", monospace';

/** Corazón suelto (se tiñe rosa o blanco). */
const heartTex = (scene: Phaser.Scene) =>
  tex(scene, 'sx-kim-heart', 64, 58, (g) => {
    g.fillStyle(0xffffff, 0.3).fillCircle(20, 20, 20).fillCircle(44, 20, 20).fillTriangle(1, 26, 63, 26, 32, 58);
    g.fillStyle(0xffffff, 1).fillCircle(21, 21, 15).fillCircle(43, 21, 15).fillTriangle(7, 27, 57, 27, 32, 52);
  });

/** Ícono de "like": cuadrado rosa con corazón blanco. */
const likeTex = (scene: Phaser.Scene) =>
  tex(scene, 'sx-kim-like', 80, 80, (g) => {
    g.fillStyle(0xff3fa4, 1).fillRoundedRect(4, 4, 72, 72, 18);
    g.fillStyle(0xffffff, 1).fillCircle(29, 34, 11).fillCircle(51, 34, 11).fillTriangle(18, 39, 62, 39, 40, 62);
  });

/** Un corazón o un like al azar. */
const heartOrLike = (c: ShowCtx) => (Math.random() < 0.5 ? likeTex(c.scene) : heartTex(c.scene));

/**
 * KIMBERLY · TRANSMISIÓN EN VIVO: un "LIVE" gigante late de fondo, "● LIVE" y el contador de espectadores, destellos de
 * luz de aro detrás de ella y corazones de likes que suben; remate: ¡GRACIAS POR EL LIKE!
 */
export const kimberly: SuperShow = {
  start(c: ShowCtx) {
    const ring = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    const live = c.scene.add.text(110, 110, '', { fontFamily: MONO, fontSize: '38px', fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 6);
    // "LIVE" gigante de fondo, rojo y latiendo, y la placa roja de transmisión arriba.
    const big = c.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, 'LIVE', { fontFamily: FONTS.head, fontSize: '520px', fontStyle: 'italic 900', color: '#ff2d55' }).setOrigin(0.5).setAlpha(0.3).setStroke('#ffffff', 14);
    const badge = c.scene.add.graphics();
    badge.fillStyle(0xff2d55, 1).fillRoundedRect(96, 96, 210, 64, 10);
    const badgeText = c.scene.add.text(201, 128, '● LIVE', { fontFamily: FONTS.head, fontSize: '44px', fontStyle: 'italic 900', color: '#ffffff' }).setOrigin(0.5);
    live.setPosition(100, 176);
    c.back.add([big, ring]);
    c.front.add([badge, badgeText, live]);
    Object.assign(c.data, { ring, live, big, badgeText, flashAt: 0 });
  },
  update(c: ShowCtx, dt: number) {
    const p = chest(c.owner);
    // Luz de aro: anillos blancos que laten detrás de ella, con un flash de vez en cuando.
    const g = c.data.ring as Phaser.GameObjects.Graphics;
    g.clear();
    const beat = 0.5 + Math.sin(c.t / 120) * 0.5;
    for (let k = 0; k < 3; k++) g.lineStyle(14 - k * 4, k === 1 ? 0xff7ad9 : 0xffffff, 0.12 + beat * 0.12).strokeCircle(p.x, p.y - 40, 190 + k * 26);
    g.fillStyle(0xffffff, 0.04 + beat * 0.03).fillCircle(p.x, p.y - 40, 180);
    if (c.t - c.data.flashAt > 650) {
      c.data.flashAt = c.t;
      g.fillStyle(0xffffff, 0.18).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    // "LIVE" de fondo latiendo, placa parpadeando y espectadores que no paran de subir.
    (c.data.big as Phaser.GameObjects.Text).setAlpha(0.28 + beat * 0.14).setScale(1 + beat * 0.03);
    (c.data.badgeText as Phaser.GameObjects.Text).setAlpha(Math.floor(c.t / 400) % 2 ? 1 : 0.45);
    const viewers = Math.floor(1200 + (c.t / c.duration) * 2_000_000 * Math.min(1, c.t / c.duration));
    (c.data.live as Phaser.GameObjects.Text).setText(`${viewers.toLocaleString('es-PE')} viendo`);
    // Likes y corazones que suben desde abajo, como en una transmisión en vivo
    if (Math.random() < dt * 30) {
      const key = heartOrLike(c);
      emit(c, key, p.x + rand(-380, 380), GAME_HEIGHT - rand(0, 80), { vy: -rand(220, 420), vx: rand(-40, 40), spin: rand(-60, 60), life: 2.4, scale: rand(0.4, 0.9), tint: key === 'sx-kim-heart' ? (Math.random() < 0.6 ? 0xff7ad9 : 0xffffff) : undefined });
    }
  },
  impact(c, x, y, final) {
    if (!final) return;
    const t = chest(c.target);
    c.fx.hit(t.x, t.y, 0xff7ad9, true);
    for (let k = 0; k < 3; k++) c.fx.ring(t.x, t.y, k % 2 ? 0xffffff : 0xff7ad9, 200 + k * 130, 0.5);
    c.scene.cameras.main.shake(300, 0.014);
    for (let i = 0; i < 40; i++) {
      const key = heartOrLike(c);
      emit(c, key, t.x, t.y, { vx: rand(-600, 600), vy: rand(-900, -200), gravity: 900, spin: rand(-300, 300), life: 1.6, scale: rand(0.5, 1), tint: key === 'sx-kim-heart' ? 0xff7ad9 : undefined });
    }
    slam(c.scene, t.x, t.y - 300, '¡GRACIAS POR EL LIKE!', '#ff7ad9', 96);
  },
};
