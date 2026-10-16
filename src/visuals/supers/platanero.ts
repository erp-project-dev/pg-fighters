import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, rand, slam, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, colorFlash, echo, every, lensColor, markHit, pixelFlash, shockwave, spark, squareTex, victim } from './energy';

const MONO = 'Menlo, Consolas, "Courier New", monospace';
const YELLOW = 0xe8c547;

/** Franja de estática: rayitas blancas y grises que tiemblan. */
const staticShot = (c: ShowCtx, x: number, y: number, size: number): Phaser.GameObjects.Container => {
  const bits = [];
  for (let i = 0; i < 6; i++) {
    bits.push(c.scene.add.image(rand(-30, 30) * size, (i - 2.5) * 9 * size, squareTex(c.scene)).setBlendMode(ADD)
      .setTint(i % 2 ? 0xffffff : YELLOW).setScale(rand(2, 5) * size, 0.3 * size));
  }
  return c.scene.add.container(x, y, bits);
};

/**
 * PLATANERO · EL CURSO COMPLETO EN VHS: la imagen se vuelve una cinta vieja (ruido, líneas de tracking,
 * colores corridos y saltos); dispara franjas de estática. El rival se rebobina: retrocede a saltos,
 * dejando copias hacia adelante. Remate: estática total… y STOP.
 */
export const platanero: SuperShow = {
  lift: 90,
  start(c: ShowCtx) {
    const noise = c.scene.add.graphics();
    const osd = c.scene.add.text(80, 70, '▶ PLAY', { fontFamily: MONO, fontSize: '54px', fontStyle: 'bold', color: '#ffffff' }).setShadow(3, 3, '#000000', 0);
    c.front.add([noise, osd]);
    Object.assign(c.data, { noise, osd });
  },
  update(c: ShowCtx) {
    const g = c.data.noise as Phaser.GameObjects.Graphics;
    const blackout = c.data.blackout as boolean;
    // Ruido: se redibuja a 20 fps, como una cinta.
    if (every(c, 'noiseAt', 50)) {
      g.clear();
      const n = blackout ? 900 : 140;
      for (let i = 0; i < n; i++) g.fillStyle(Math.random() < 0.5 ? 0xffffff : 0x000000, blackout ? 0.9 : rand(0.05, 0.25)).fillRect(rand(0, GAME_WIDTH), rand(0, GAME_HEIGHT), rand(2, blackout ? 40 : 8), rand(2, 4));
      // Línea de tracking que baja por la pantalla.
      const ty = (c.t * 0.4) % (GAME_HEIGHT + 200) - 100;
      for (let k = 0; k < 6; k++) g.fillStyle(0xffffff, 0.08).fillRect(0, ty + k * 7, GAME_WIDTH, rand(2, 5));
      g.fillStyle(0xffffff, 0.18).fillRect(0, ty + 20, GAME_WIDTH, 3);
    }
    // Colores corridos: copias roja y azul.
    if (every(c, 'bleedAt', 90)) for (const f of [c.owner, c.target]) {
      echo(c.scene, f.sprite, { dx: -10, color: 0xff3355, alpha: 0.25, ms: 100 });
      echo(c.scene, f.sprite, { dx: 10, color: 0x3366ff, alpha: 0.25, ms: 100 });
    }
    const cm = lensColor(c);
    if (cm) {
      cm.colorMatrix.desaturate();
      cm.colorMatrix.contrast(0.25, true);
      cm.colorMatrix.alpha = 0.55;
    }
    // Rebobinado: retrocede a saltos y deja copias hacia adelante.
    const since = c.t - (c.data.hitAt ?? -9999);
    const rew = since < 500;
    (c.data.osd as Phaser.GameObjects.Text).setText(blackout ? '■ STOP' : rew ? '◀◀ REW' : '▶ PLAY').setVisible(Math.floor(c.t / 400) % 4 !== 3);
    if (rew && every(c, 'rewAt', 60)) echo(c.scene, c.target.sprite, { dx: -c.owner.facing * 50, color: 0xdddddd, alpha: 0.35, ms: 200, add: false });
    const jump = Math.floor(c.t / 70) % 5 === 0 ? 14 : 0;
    victim(c, rew
      ? { x: c.owner.facing * (Math.floor((since / 500) * 6) * 12), y: -jump, tint: Math.floor(c.t / 60) % 2 ? 0xffffff : 0xb0b0b0, fill: Math.floor(c.t / 60) % 2 === 1 }
      : { y: -jump * 0.5 });
  },
  note(c, x, y, hit, final) {
    return hit ? staticShot(c, x, y, final ? 1.6 : 1) : spark(c, x, y, YELLOW);
  },
  fly(c, _x, _y, _age, _final, obj) {
    obj.setAngle(0);
    for (const b of (obj as Phaser.GameObjects.Container).list as Phaser.GameObjects.Image[]) if (Math.random() < 0.4) b.setX(rand(-36, 36));
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, 0xffffff, 10, 600, squareTex(c.scene));
    pixelFlash(c.scene, 6, 140);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // Estática total… y la imagen vuelve de golpe.
    c.data.blackout = true;
    colorFlash(scene, 'gray', 500);
    scene.time.delayedCall(360, () => {
      c.data.blackout = false;
      pixelFlash(scene, 30, 500);
      shockwave(scene, 0.5, 800);
      for (let k = 0; k < 4; k++) c.fx.ring(t.x, t.y, k % 2 ? 0xffffff : YELLOW, 240 + k * 170, 0.5);
      c.fx.hit(t.x, t.y, YELLOW, true);
      scene.cameras.main.shake(500, 0.024);
      slam(scene, GAME_WIDTH / 2, 420, '■ STOP', '#f2d24e', 170, 0);
    });
  },
};
