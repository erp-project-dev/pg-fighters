import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, colorFlash, echo, every, lensBarrel, markHit, shockwave, spark, victim } from './energy';

const GREEN = 0x4dff88;

/** Silueta de luz del propio Mimético (su cuadro actual), lista para salir volando. */
const silhouette = (c: ShowCtx, x: number, y: number, scale: number) => {
  const s = c.owner.sprite;
  return c.scene.add.image(x, y, s.texture.key, s.frame.name).setFlipX(s.flipX).setScale(s.scaleX * scale)
    .setTint(GREEN).setTintMode(Phaser.TintModes.FILL).setBlendMode(ADD).setAlpha(0.85);
};

/**
 * MIMÉTICO · COPIA EXACTA: una barra de luz verde escanea la pantalla y todo deja copias fantasma;
 * dispara siluetas verdes de sí mismo. El rival deja copias que lo imitan con retraso.
 * Remate: decenas de copias verdes de Mimético convergen sobre el rival.
 */
export const mimetico: SuperShow = {
  aim: false,
  start(c: ShowCtx) {
    const scan = c.scene.add.graphics().setBlendMode(ADD);
    c.front.add(scan);
    Object.assign(c.data, { scan });
  },
  update(c: ShowCtx) {
    // Barra de fotocopiadora que va y viene por toda la pantalla.
    const g = c.data.scan as Phaser.GameObjects.Graphics;
    g.clear();
    const x = (Math.sin(c.t / 380) * 0.5 + 0.5) * GAME_WIDTH;
    for (let k = 0; k < 6; k++) g.fillStyle(GREEN, k === 0 ? 0.5 : 0.06).fillRect(x - 6 - k * 22, 0, 12 + k * 44, GAME_HEIGHT);
    // Imagen repetida: un leve abombado que respira.
    const b = lensBarrel(c);
    if (b) b.amount = 1 + Math.sin(c.t / 200) * 0.018;
    // Todo deja copias: él a los lados, el rival detrás con retraso.
    if (every(c, 'copyAt', 120)) {
      echo(c.scene, c.owner.sprite, { dx: rand(-160, 160), color: GREEN, alpha: 0.35, ms: 380 });
      if (c.data.hits) for (let i = 1; i <= 3; i++) echo(c.scene, c.target.sprite, { dx: c.owner.facing * i * 40, color: GREEN, alpha: 0.4 - i * 0.1, ms: 160 + i * 80 });
    }
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, { tint: since < 150 ? GREEN : 0xc8ffd8, fill: since < 150, x: since < 200 ? rand(-6, 6) : 0 });
  },
  note(c, x, y, hit, final) {
    return hit ? silhouette(c, x, y, final ? 0.75 : 0.45) : spark(c, x, y, GREEN);
  },
  fly(c, _x, _y, _age, _final, obj) {
    obj.setAngle(0);
    if (every(c, 'flyEcho', 40)) {
      const img = obj as Phaser.GameObjects.Image;
      const ghost = c.scene.add.image(img.x, img.y, img.texture.key, img.frame.name).setFlipX(img.flipX).setScale(img.scaleX)
        .setTint(GREEN).setTintMode(Phaser.TintModes.FILL).setBlendMode(ADD).setAlpha(0.35).setDepth(31);
      c.scene.tweens.add({ targets: ghost, alpha: 0, duration: 220, onComplete: () => ghost.destroy() });
    }
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, GREEN, 12, 600);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // Decenas de copias convergen desde todos lados.
    const s = c.owner.sprite;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const copy = scene.add.image(t.x + Math.cos(a) * 1100, t.y + Math.sin(a) * 700, s.texture.key, s.frame.name)
        .setScale(s.scaleX * 0.6).setFlipX(Math.cos(a) > 0).setTint(GREEN).setTintMode(Phaser.TintModes.FILL).setBlendMode(ADD).setAlpha(0.7).setDepth(47);
      scene.tweens.add({ targets: copy, x: t.x, y: t.y, alpha: 0.2, delay: i * 12, duration: 340, ease: 'Cubic.easeIn', onComplete: () => copy.destroy() });
    }
    scene.time.delayedCall(380, () => {
      colorFlash(scene, 'negative', 300, 0.6);
      veil(scene, GREEN, 0.4, 80, 20, 400, 48);
      shockwave(scene, 0.6, 800);
      for (let k = 0; k < 5; k++) c.fx.ring(t.x, t.y, GREEN, 240 + k * 180, 0.5);
      c.fx.hit(t.x, t.y, GREEN, true);
      scene.cameras.main.shake(500, 0.024);
      slam(scene, GAME_WIDTH / 2, 420, '¡COPIADO!', '#4dff88', 180, -4);
    });
  },
};
