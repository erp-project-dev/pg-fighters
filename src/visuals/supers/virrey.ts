import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { buildLook } from '../powers';
import { chest, dotTex, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';

const GOLD = 0xe0b53a;
const WINE = 0x8c0f22;

/** Tajo de sable: media luna dorada que se abre sobre (x, y) con el ángulo dado y se desvanece. */
const slash = (c: ShowCtx, x: number, y: number, angle: number, len: number, width: number, ms = 260): void => {
  const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD).setPosition(x, y).setAngle(angle);
  c.front.add(g);
  const arc = (w: number, color: number, alpha: number) => {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const k = i / 20;
      pts.push(new Phaser.Math.Vector2(-len / 2 + k * len, -Math.sin(k * Math.PI) * w));
    }
    for (let i = 20; i >= 0; i--) {
      const k = i / 20;
      pts.push(new Phaser.Math.Vector2(-len / 2 + k * len, -Math.sin(k * Math.PI) * w * 0.35));
    }
    g.fillStyle(color, alpha).fillPoints(pts, true);
  };
  arc(width * 1.4, GOLD, 0.25);
  arc(width, GOLD, 0.9);
  arc(width * 0.6, 0xffffff, 1);
  g.setScale(0.3, 1);
  c.scene.tweens.add({ targets: g, scaleX: 1, duration: 70, ease: 'Cubic.easeOut' });
  c.scene.tweens.add({ targets: g, alpha: 0, delay: 70, duration: ms, onComplete: () => g.destroy() });
};

/** Sello de la Corona: anillo con marcas y una corona al centro (detrás del Virrey). */
const drawSeal = (g: Phaser.GameObjects.Graphics, r: number, spin: number, alpha: number): void => {
  g.clear();
  g.lineStyle(10, GOLD, 0.35 * alpha).strokeCircle(0, 0, r);
  g.lineStyle(3, GOLD, 0.8 * alpha).strokeCircle(0, 0, r * 0.86);
  for (let i = 0; i < 24; i++) {
    const a = spin + (i / 24) * Math.PI * 2;
    const inner = i % 2 ? r * 0.88 : r * 0.8;
    g.lineStyle(i % 2 ? 2 : 4, GOLD, 0.7 * alpha).lineBetween(Math.cos(a) * inner, Math.sin(a) * inner, Math.cos(a) * r * 0.96, Math.sin(a) * r * 0.96);
  }
  // Corona: base y cinco puntas con perlas.
  const w = r * 0.9;
  const base = r * 0.25;
  g.fillStyle(GOLD, 0.45 * alpha).fillRect(-w / 2, base - r * 0.14, w, r * 0.14);
  const pts = [new Phaser.Math.Vector2(-w / 2, base - r * 0.14)];
  for (let i = 0; i <= 8; i++) pts.push(new Phaser.Math.Vector2(-w / 2 + (i / 8) * w, base - r * 0.14 - (i % 2 ? r * 0.18 : r * 0.45)));
  pts.push(new Phaser.Math.Vector2(w / 2, base - r * 0.14));
  g.fillStyle(GOLD, 0.35 * alpha).fillPoints(pts, true);
  g.fillStyle(WINE, 0.6 * alpha).fillCircle(0, base - r * 0.07, r * 0.05);
};

/**
 * EL VIRREY · EL TRIBUTO: la pantalla se oscurece en granate, detrás suyo gira el sello dorado de la Corona
 * y cada nota es un tajo de sable sobre el rival (cruzados, uno de cada lado). Remate: una X gigante de
 * dos tajos y POR DECRETO.
 */
export const virrey: SuperShow = {
  start(c: ShowCtx) {
    const dim = c.scene.add.rectangle(-60, -60, GAME_WIDTH + 120, GAME_HEIGHT + 120, WINE, 0).setOrigin(0);
    const o = chest(c.owner);
    const seal = c.scene.add.graphics().setPosition(o.x, o.y - 40).setBlendMode(Phaser.BlendModes.ADD);
    c.back.add([dim, seal]);
    Object.assign(c.data, { dim, seal, hits: 0 });
  },
  update(c: ShowCtx, dt: number) {
    const k = Math.min(1, c.t / 500);
    (c.data.dim as Phaser.GameObjects.Rectangle).setAlpha(0.22 * k);
    const o = chest(c.owner);
    const seal = c.data.seal as Phaser.GameObjects.Graphics;
    seal.setPosition(o.x, o.y - 40).setScale(0.6 + 0.4 * Phaser.Math.Easing.Back.Out(k));
    drawSeal(seal, 300, c.t / 1400, k * (0.85 + 0.15 * Math.sin(c.t / 120)));
    // Polvo de oro que sube.
    if (Math.random() < dt * 30) {
      emit(c, dotTex(c.scene), rand(0, GAME_WIDTH), GAME_HEIGHT + 10, { vy: -rand(80, 180), vx: rand(-20, 20), life: 3, scale: rand(0.3, 0.7), tint: GOLD, add: true, layer: 'back' });
    }
  },
  // Cada nota es un tajo de sable dorado (el mismo de su poder básico), más grande el que golpea.
  note(c, x, y, hit) {
    return buildLook(c.scene, 'slash', GOLD, hit ? 22 : 13, x, y).obj;
  },
  impact(c, x, y, final) {
    const t = chest(c.target);
    if (!final) {
      // Tajos cruzados, uno de cada lado.
      const n = (c.data.hits = (c.data.hits as number) + 1);
      slash(c, t.x, t.y, n % 2 ? -35 : 35, 340, 60);
      c.fx.hit(x, y, GOLD, false);
      return;
    }
    // Remate: una X gigante y POR DECRETO.
    veil(c.scene, GOLD, 0.28, 120);
    c.scene.cameras.main.shake(320, 0.016);
    slash(c, t.x, t.y, -40, 760, 120, 520);
    c.scene.time.delayedCall(110, () => slash(c, t.x, t.y, 40, 760, 120, 520));
    c.fx.hit(t.x, t.y, GOLD, true);
    for (let k = 0; k < 3; k++) c.fx.ring(t.x, t.y, k % 2 ? WINE : GOLD, 200 + k * 130, 0.5);
    slam(c.scene, t.x, t.y - 320, 'POR DECRETO', '#e0b53a', 120, -8);
  },
};
