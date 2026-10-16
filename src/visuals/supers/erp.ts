import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, emit, pick, rand, slam, veil, type NoteObj, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, colorFlash, echo, every, lensColor, markHit, pixelFlash, shockwave, spark, squareTex, victim } from './energy';

const RED = 0xff2b4a;
const CYAN = 0x2bf0ff;

/** Ráfaga de glitch: racimo de píxeles rojos y blancos que tiemblan. */
const glitchShot = (c: ShowCtx, x: number, y: number, size: number): Phaser.GameObjects.Container => {
  const bits = [];
  for (let i = 0; i < 7; i++) {
    bits.push(c.scene.add.image(rand(-22, 22) * size, rand(-22, 22) * size, squareTex(c.scene)).setBlendMode(ADD)
      .setTint(i === 0 ? 0xffffff : i % 3 ? RED : CYAN).setScale(rand(0.8, 2.2) * size, rand(0.5, 1.4) * size));
  }
  return c.scene.add.container(x, y, bits);
};

/**
 * ERP PROJECT · STACK OVERFLOW: la imagen se descuadra en franjas de glitch, los colores se separan
 * (copias roja y cian de los dos luchadores) y dispara ráfagas de píxeles. El rival se rompe en franjas
 * como imagen corrupta. Remate: la pantalla se cuelga en gris… y estalla en píxeles rojos.
 */
export const erp: SuperShow = {
  lift: 70,
  spread: 1.6,
  start(c: ShowCtx) {
    const bands = c.scene.add.graphics().setBlendMode(ADD);
    c.front.add(bands);
    Object.assign(c.data, { bands });
  },
  update(c: ShowCtx, dt: number) {
    const u = Math.min(1, c.t / c.duration);
    // Franjas horizontales de glitch, cada vez más.
    const g = c.data.bands as Phaser.GameObjects.Graphics;
    if (every(c, 'bandAt', 60)) {
      g.clear();
      const n = 3 + Math.floor(u * 10);
      for (let i = 0; i < n; i++) {
        const y = rand(0, GAME_HEIGHT);
        const h = rand(4, 10 + u * 50);
        g.fillStyle(pick([RED, CYAN, 0xffffff]), rand(0.05, 0.12 + u * 0.12)).fillRect(rand(-200, 400), y, rand(600, GAME_WIDTH), h);
      }
      // Bloques sueltos de píxeles.
      for (let i = 0; i < 4 + u * 12; i++) g.fillStyle(pick([RED, CYAN]), 0.3).fillRect(rand(0, GAME_WIDTH), rand(0, GAME_HEIGHT), rand(10, 60), rand(10, 30));
    }
    // Colores separados: copias roja y cian desplazadas de los dos luchadores.
    if (every(c, 'splitAt', 70)) {
      const d = 8 + u * 22;
      for (const f of [c.owner, c.target]) {
        echo(c.scene, f.sprite, { dx: -d, color: RED, alpha: 0.35, ms: 110 });
        echo(c.scene, f.sprite, { dx: d, color: CYAN, alpha: 0.35, ms: 110 });
      }
    }
    // La pantalla se va corriendo de color a medida que avanza el solo.
    const cm = lensColor(c);
    if (cm) {
      cm.colorMatrix.hue(Math.sin(c.t / 70) * 25 * u);
      cm.colorMatrix.alpha = 0.6;
    }
    if (Math.random() < dt * 30) emit(c, squareTex(c.scene), rand(0, GAME_WIDTH), -20, { vy: rand(300, 700), life: 2, scale: rand(0.4, 1), tint: pick([RED, CYAN]), add: true, layer: 'back', alpha: 0.6 });
    // El rival se rompe en saltos: se corre de lado a saltos y parpadea en rojo.
    const since = c.t - (c.data.hitAt ?? -9999);
    const step = Math.floor(c.t / 55);
    victim(c, since < 380
      ? { x: ((step * 7) % 3 - 1) * 26, y: ((step * 5) % 3 - 1) * 8, sx: step % 4 === 0 ? 1.12 : 1, ...(step % 2 ? { tint: RED, fill: true } : {}) }
      : { x: step % 9 === 0 ? 10 : 0 });
  },
  note(c, x, y, hit, final) {
    return hit ? glitchShot(c, x, y, final ? 1.6 : 1) : spark(c, x, y, pick([RED, CYAN]));
  },
  fly(c, x, y, _age, final, obj: NoteObj) {
    obj.setAngle(0);
    for (const b of (obj as Phaser.GameObjects.Container).list as Phaser.GameObjects.Image[]) if (Math.random() < 0.3) b.setPosition(rand(-26, 26), rand(-26, 26));
    if (Math.random() < 0.7) emit(c, squareTex(c.scene), x + rand(-20, 20), y + rand(-20, 20), { life: 0.3, scale: final ? 1 : 0.6, grow: -2, tint: pick([RED, CYAN, 0xffffff]), add: true });
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, RED, 12, 700, squareTex(c.scene));
    pixelFlash(c.scene, final ? 30 : 10, final ? 700 : 160);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // La pantalla se cuelga (gris, quieta) y luego revienta.
    colorFlash(scene, 'gray', 700);
    scene.time.delayedCall(260, () => {
      shockwave(scene, 0.6, 800);
      veil(scene, RED, 0.45, 60, 10, 420, 48);
      for (let i = 0; i < 4; i++) c.fx.ring(t.x, t.y, i % 2 ? CYAN : RED, 220 + i * 180, 0.45 + i * 0.1);
      c.fx.hit(t.x, t.y, RED, true);
      scene.cameras.main.shake(600, 0.028);
      slam(scene, GAME_WIDTH / 2, 420, 'STACK OVERFLOW', '#ff2b4a', 140, 0);
    });
    burst(c, t.x, t.y, RED, 80, 1400, squareTex(c.scene));
  },
};
