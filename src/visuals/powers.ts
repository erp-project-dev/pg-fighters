import Phaser from 'phaser';
import type { PowerLook } from '../data/powers';
import { tex } from './supers/kit';

/** Dibujo de un proyectil: el objeto, cuánto gira (grados/s) y si apunta hacia donde va. */
export interface LookObj {
  obj: Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Container;
  spin: number;
  aim: boolean;
}

/** Radio de referencia de las texturas (la escala sale de radio / BASE). */
const BASE = 52;

const glow = (g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, color: number) => {
  for (let k = r; k > r * 0.4; k -= r / 8) g.fillStyle(color, 0.08).fillCircle(cx, cy, k);
};

const star = (cx: number, cy: number, outer: number, inner: number, n: number, rot = -Math.PI / 2) => {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 ? inner : outer;
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return pts;
};

/** Texturas en blanco y gris para teñirlas con el color de cada luchador (las que tienen color propio no se tiñen). */
const TEX: Partial<Record<PowerLook, (s: Phaser.Scene) => string>> = {
  note: (s) => tex(s, 'pw-note', 120, 140, (g) => {
    glow(g, 50, 100, 46, 0xffffff);
    g.fillStyle(0xffffff, 1).fillEllipse(48, 108, 62, 46).fillRect(70, 18, 12, 92);
    g.fillTriangle(82, 18, 116, 48, 82, 58);
  }),
  wave: (s) => tex(s, 'pw-wave', 140, 70, (g) => {
    for (const [w, a] of [[16, 0.25], [6, 1]] as const) {
      g.lineStyle(w, 0xffffff, a);
      g.beginPath();
      for (let x = 0; x <= 140; x += 5) g.lineTo(x, 35 + Math.sin(x / 11) * 22);
      g.strokePath();
    }
  }),
  pick: (s) => tex(s, 'pw-pick', 100, 110, (g) => {
    glow(g, 50, 52, 50, 0xffd23f);
    g.fillStyle(0xa8780a, 1).fillPoints([new Phaser.Math.Vector2(50, 104), new Phaser.Math.Vector2(8, 30), new Phaser.Math.Vector2(28, 8), new Phaser.Math.Vector2(72, 8), new Phaser.Math.Vector2(92, 30)], true);
    g.fillStyle(0xffd23f, 1).fillPoints([new Phaser.Math.Vector2(50, 96), new Phaser.Math.Vector2(14, 31), new Phaser.Math.Vector2(31, 13), new Phaser.Math.Vector2(69, 13), new Phaser.Math.Vector2(86, 31)], true);
    g.fillStyle(0xfff1a8, 1).fillCircle(40, 30, 7);
  }),
  meteor: (s) => tex(s, 'pw-meteor', 110, 110, (g) => {
    glow(g, 55, 55, 54, 0xff7a2b);
    g.fillStyle(0xffd166, 1).fillCircle(55, 55, 26);
    g.fillStyle(0xffffff, 1).fillCircle(50, 50, 11);
  }),
  tray: (s) => tex(s, 'pw-tray', 130, 100, (g) => {
    g.fillStyle(0xffffff, 1).fillEllipse(65, 78, 128, 32);
    g.fillStyle(0xd9dde3, 1).fillEllipse(65, 74, 96, 20);
    g.fillStyle(0xc0c6cf, 1).fillEllipse(65, 52, 96, 76);
    g.fillStyle(0xe8ecf1, 1).fillEllipse(54, 40, 40, 28);
    g.fillStyle(0x8a9099, 1).fillCircle(65, 12, 8);
  }),
  kiss: (s) => tex(s, 'pw-kiss', 110, 100, (g) => {
    glow(g, 55, 50, 50, 0xff8fab);
    g.fillStyle(0xff4d79, 1).fillCircle(38, 40, 22).fillCircle(72, 40, 22).fillTriangle(17, 48, 93, 48, 55, 88);
    g.fillStyle(0xffffff, 0.8).fillCircle(31, 33, 7);
  }),
  redStar: (s) => tex(s, 'pw-redstar', 120, 120, (g) => {
    glow(g, 60, 60, 58, 0xffd166);
    g.fillStyle(0xd62828, 1).fillPoints(star(60, 62, 52, 21, 5), true);
    g.lineStyle(5, 0xffd166, 1).strokePoints(star(60, 62, 52, 21, 5), true);
  }),
  miniNote: (s) => tex(s, 'pw-mininote', 70, 80, (g) => {
    glow(g, 30, 56, 26, 0xffee32);
    g.fillStyle(0xffffff, 1).fillEllipse(28, 62, 32, 24).fillRect(40, 10, 7, 50).fillTriangle(47, 10, 66, 26, 47, 32);
  }),
  flask: (s) => tex(s, 'pw-flask', 90, 120, (g) => {
    glow(g, 45, 74, 44, 0x8ecae6);
    g.fillStyle(0xbfe9ff, 0.95).fillCircle(45, 78, 32).fillRect(36, 20, 18, 40);
    g.fillStyle(0x8a5a2b, 1).fillRect(34, 8, 22, 14);
    g.fillStyle(0xffd166, 1).fillRect(41, 64, 8, 28).fillRect(31, 72, 28, 8);
  }),
  book: (s) => tex(s, 'pw-book', 140, 110, (g) => {
    g.fillStyle(0x5a1a1a, 1).fillRoundedRect(6, 6, 128, 98, 8);
    g.fillStyle(0x3a0f0f, 1).fillRect(6, 6, 20, 98);
    g.fillStyle(0xe0b862, 1).fillRect(40, 30, 80, 8).fillRect(40, 48, 60, 6).fillRect(40, 78, 80, 4);
    g.fillStyle(0xf4ead5, 1).fillRect(130, 12, 6, 86);
  }),
  pearl: (s) => tex(s, 'pw-pearl', 110, 110, (g) => {
    glow(g, 55, 55, 54, 0x2fd08f);
    g.fillStyle(0x19b37a, 1).fillCircle(55, 55, 26);
    g.lineStyle(4, 0xffd166, 1).strokeCircle(55, 55, 26);
    g.fillStyle(0xd8fff0, 1).fillCircle(48, 48, 10);
  }),
  star8: (s) => tex(s, 'pw-star8', 120, 120, (g) => {
    glow(g, 60, 60, 58, 0x5c9dff);
    g.fillStyle(0xe0b862, 1).fillPoints(star(60, 60, 52, 30, 8), true);
    g.fillStyle(0x5c9dff, 1).fillCircle(60, 60, 18);
  }),
  firefly: (s) => tex(s, 'pw-firefly', 90, 90, (g) => {
    for (let r = 44; r > 6; r -= 4) g.fillStyle(0xffe9a8, 0.09).fillCircle(45, 45, r);
    g.fillStyle(0xffffff, 1).fillCircle(45, 45, 9);
  }),
  like: (s) => tex(s, 'pw-like', 100, 100, (g) => {
    for (let r = 50; r > 30; r -= 5) g.fillStyle(0xff7ad9, 0.08).fillCircle(50, 50, r);
    g.fillStyle(0xff3fa4, 1).fillRoundedRect(14, 14, 72, 72, 18);
    g.fillStyle(0xffffff, 1).fillCircle(39, 44, 11).fillCircle(61, 44, 11).fillTriangle(28, 49, 72, 49, 50, 72);
  }),
  phoenix: (s) => tex(s, 'pw-phoenix', 130, 110, (g) => {
    // Llama en forma de ala: núcleo blanco, capas celeste, rosa y blanco hacia atrás.
    for (let r = 50; r > 20; r -= 6) g.fillStyle(0x5bcefa, 0.07).fillCircle(78, 55, r);
    const wing = (dy: number, w: number, color: number) =>
      g.fillStyle(color, 1).fillTriangle(100, 55, 10, 55 + dy - w, 30, 55 + dy + w * 0.3);
    wing(-26, 18, 0x5bcefa);
    wing(26, -18, 0xf5a9b8);
    wing(0, 12, 0xffffff);
    g.fillStyle(0xffffff, 1).fillCircle(96, 55, 16);
    g.fillStyle(0x5bcefa, 1).fillCircle(98, 55, 8);
  }),
  banana: (s) => tex(s, 'pw-banana', 120, 90, (g) => {
    for (let r = 44; r > 18; r -= 6) g.fillStyle(0xffe14d, 0.08).fillCircle(60, 45, r);
    const arc = (r: number, w: number, c: number) => {
      g.lineStyle(w, c, 1);
      g.beginPath();
      g.arc(60, -10, r, Math.PI * 0.2, Math.PI * 0.8);
      g.strokePath();
    };
    arc(66, 24, 0x8a6a10);
    arc(66, 18, 0xffd84a);
    arc(70, 5, 0xfff3a8);
    g.fillStyle(0x4a3a10, 1).fillCircle(18, 30, 6).fillCircle(102, 30, 5);
  }),
  darkOrb: (s) => tex(s, 'pw-darkorb', 120, 120, (g) => {
    glow(g, 60, 60, 58, 0xff173d);
    g.fillStyle(0x12000a, 1).fillCircle(60, 60, 30);
    g.lineStyle(5, 0xff173d, 1).strokeCircle(60, 60, 31);
    g.lineStyle(3, 0x6a00ff, 0.9).strokeCircle(60, 60, 22);
  }),
  shriek: (s) => tex(s, 'pw-shriek', 120, 120, (g) => {
    for (const [r, c] of [[52, 0xff173d], [38, 0x6a00ff], [24, 0xff173d]] as const) g.lineStyle(6, c, 0.9).strokeCircle(60, 60, r);
    g.fillStyle(0xffd0d8, 1).fillCircle(60, 60, 9);
  }),
};

/** Looks blancos que se tiñen con el color del luchador. */
const TINTED: PowerLook[] = ['note', 'wave', 'miniNote'];

const CODE_TOKENS = ['</>', '{ }', 'fork()', '0x1F', '=>'];

/** Crea el dibujo de un proyectil de radio `r` (los rayos se dibujan aparte, en el propio proyectil). */
export const buildLook = (scene: Phaser.Scene, look: PowerLook, color: number, r: number, x: number, y: number): LookObj => {
  if (look === 'code') {
    const t = scene.add.text(x, y, CODE_TOKENS[Math.floor(Math.random() * CODE_TOKENS.length)], {
      fontFamily: 'Menlo, Consolas, "Courier New", monospace', fontSize: `${Math.round(r * 1.1)}px`, fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setStroke('#ff2d45', 6).setShadow(0, 0, '#ff2d45', 18, true, true);
    return { obj: t, spin: 0, aim: false };
  }
  if (look === 'lick' || look === 'cheque') {
    const label = look === 'lick' ? '♪ 1' : '$ 1 000 000';
    const bg = look === 'lick' ? 0xff7a2b : 0x2f7a4f;
    const t = scene.add.text(0, 0, label, { fontFamily: 'Barlow Condensed, sans-serif', fontSize: `${Math.round(r * (look === 'lick' ? 0.9 : 0.55))}px`, fontStyle: 'italic 900', color: look === 'lick' ? '#111111' : '#ecd08a' }).setOrigin(0.5);
    const g = scene.add.graphics();
    const w = t.width + 18;
    const h = t.height + 6;
    g.fillStyle(bg, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 8).lineStyle(3, 0x000000, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    return { obj: scene.add.container(x, y, [g, t]), spin: 0, aim: false };
  }
  const key = TEX[look]?.(scene) ?? TEX.darkOrb!(scene);
  const img = scene.add.image(x, y, key).setScale(r / BASE);
  if (TINTED.includes(look)) img.setTint(color);
  if (['meteor', 'kiss', 'redStar', 'pearl', 'star8', 'firefly', 'darkOrb', 'shriek', 'miniNote', 'wave'].includes(look)) img.setBlendMode(Phaser.BlendModes.ADD);
  const spin = look === 'banana' ? 720 : look === 'pick' ? 900 : look === 'book' ? 360 : look === 'tray' ? 0 : look === 'redStar' ? 400 : look === 'star8' ? 300 : look === 'flask' ? 420 : 0;
  return { obj: img, spin, aim: look === 'wave' };
};
