import Phaser from 'phaser';
import { GAME_WIDTH } from '../../config';
import { chest, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, colorFlash, comet, every, markHit, orb, shockwave, spark, victim } from './energy';

/** Los cinco licks, siempre en el mismo orden. */
const FIVE = [0xff7a2b, 0xffd23f, 0x4dff88, 0x3a86ff, 0xff3fa4];

/**
 * PENTALICK · COMBO INFINITO DE CINCO LICKS: cinco anillos de colores salen de él en secuencia y se repiten,
 * cada vuelta más rápido; dispara cinco orbes en el mismo orden. El rival queda en loop: repite exactamente
 * el mismo retroceso. Remate: los cinco colores se juntan en una sola explosión.
 */
export const pentalick: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(g);
    Object.assign(c.data, { g, lap: 0, shot: 0 });
  },
  update(c: ShowCtx) {
    const p = chest(c.owner);
    const u = Math.min(1, c.t / c.duration);
    // Cinco anillos en secuencia, cada vuelta más rápida.
    if (every(c, 'ringAt', 200 - u * 110)) {
      const i = c.data.lap++ % 5;
      c.fx.ring(p.x, p.y, FIVE[i], 320 + i * 40, 0.6);
    }
    // Cinco carriles de luz que bajan detrás de él.
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    for (let i = 0; i < 5; i++) {
      const x = p.x - 360 + i * 180;
      g.fillStyle(FIVE[i], 0.07).fillRect(x - 30, 0, 60, 1080);
      const y = ((c.t * (0.6 + u) + i * 216) % 1080);
      g.fillStyle(FIVE[i], 0.5).fillRect(x - 30, y, 60, 24);
    }
    // En loop: el mismo retroceso de 300 ms, una y otra vez.
    const loop = ((c.t - (c.data.firstHit ?? 0)) % 300) / 300;
    const back = Math.sin(loop * Math.PI);
    victim(c, { x: c.owner.facing * back * 24, angle: -back * 8, tint: FIVE[(c.data.hits ?? 1) % 5], fill: loop < 0.12 });
  },
  note(c, x, y, hit, final) {
    if (!hit) return spark(c, x, y, FIVE[Math.floor(c.t / 100) % 5]);
    const color = final ? 0xffffff : FIVE[c.data.shot++ % 5];
    const o = orb(c, x, y, color, final ? 52 : 30);
    o.setData('color', color);
    return o;
  },
  fly(c, x, y, _age, _final, obj) {
    comet(c, x, y, obj.getData('color') as number, 0.9);
  },
  impact(c, x, y, final) {
    if (!c.data.hits) c.data.firstHit = c.t;
    const n = markHit(c, final);
    c.fx.ring(x, y, FIVE[n % 5], 180, 0.3);
    if (!final) return;
    const t = chest(c.target);
    FIVE.forEach((col, i) => c.scene.time.delayedCall(i * 60, () => {
      c.fx.ring(t.x, t.y, col, 260 + i * 150, 0.6);
      burst(c, t.x, t.y, col, 16, 1100);
    }));
    c.scene.time.delayedCall(320, () => {
      colorFlash(c.scene, 'hue', 600);
      veil(c.scene, 0xffffff, 0.6, 80, 20, 400, 48);
      shockwave(c.scene, 0.6, 800);
      c.fx.hit(t.x, t.y, 0xffffff, true);
      c.scene.cameras.main.shake(500, 0.024);
      slam(c.scene, GAME_WIDTH / 2, 420, 'LICK 1 (OTRA VEZ)', '#ff7a2b', 110);
    });
  },
};
