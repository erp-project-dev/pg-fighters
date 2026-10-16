import Phaser from 'phaser';
import type { PowerLook } from '../data/powers';
import { tex } from './supers/kit';

/** Dibujo de un proyectil: el objeto, cuánto gira (grados/s) y si apunta hacia donde va. */
export interface LookObj {
  obj: Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Container;
  spin: number;
  aim: boolean;
  /** Tiembla en su sitio (grados de vaivén) en vez de girar. */
  jitter?: number;
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
  tray: (s) => tex(s, 'pw-tray', 130, 60, (g) => {
    // Bandeja sola, sin tapa: borde, fondo y un reflejo.
    g.fillStyle(0x8a9099, 1).fillEllipse(65, 32, 128, 44);
    g.fillStyle(0xe8ecf1, 1).fillEllipse(65, 30, 120, 36);
    g.fillStyle(0xc0c6cf, 1).fillEllipse(65, 30, 96, 24);
    g.fillStyle(0xffffff, 0.8).fillEllipse(48, 25, 34, 8);
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
    // Corazón: halo rosa, borde oscuro, relleno rosa y un brillo blanco arriba a la izquierda.
    const heart = (r: number, cx = 50, cy = 52) => {
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const x = 16 * Math.sin(a) ** 3;
        const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
        pts.push(new Phaser.Math.Vector2(cx + (x * r) / 16, cy - (y * r) / 16));
      }
      return pts;
    };
    for (let r = 50; r > 30; r -= 5) g.fillStyle(0xff7ad9, 0.08).fillCircle(50, 50, r);
    g.fillStyle(0xb0136a, 1).fillPoints(heart(42), true);
    g.fillStyle(0xff3fa4, 1).fillPoints(heart(37), true);
    g.fillStyle(0xff8fd0, 1).fillPoints(heart(24, 50, 50), true);
    g.fillStyle(0xffffff, 0.95).fillEllipse(34, 36, 14, 10);
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
  soundwave: (s) => tex(s, 'pw-soundwave', 120, 140, (g) => {
    // Tres arcos de onda que se abren hacia adelante, con un brillo y bits de datos alrededor.
    const arc = (r: number, w: number, a: number) => {
      g.lineStyle(w, 0xffffff, a);
      g.beginPath();
      g.arc(-10, 70, r, -0.55, 0.55);
      g.strokePath();
    };
    for (const r of [52, 84, 116]) {
      arc(r, 18, 0.22);
      arc(r, 7, 1);
    }
    g.fillStyle(0xffffff, 0.85);
    for (const [x, y] of [[60, 18], [92, 34], [100, 104], [70, 122], [40, 40], [44, 100]]) g.fillRect(x, y, 8, 8);
  }),
  decree: (s) => tex(s, 'pw-decree', 130, 110, (g) => {
    // Pergamino enrollado en los extremos, con líneas de texto y el sello rojo de la Corona.
    glow(g, 65, 55, 54, 0xffd166);
    g.fillStyle(0xf3e2b3, 1).fillRect(22, 18, 86, 74);
    g.fillStyle(0xc9a227, 1).fillRoundedRect(10, 10, 22, 90, 10).fillRoundedRect(98, 10, 22, 90, 10);
    g.fillStyle(0x8a6a10, 1).fillRect(18, 4, 6, 102).fillRect(106, 4, 6, 102);
    g.fillStyle(0x6b4a2a, 1);
    for (const y of [30, 42, 54]) g.fillRect(38, y, 54, 4);
    g.fillStyle(0xb3122e, 1).fillCircle(65, 76, 12);
    g.fillStyle(0xff5a6e, 1).fillCircle(62, 73, 4);
  }),
  sun: (s) => tex(s, 'pw-sun', 130, 130, (g) => {
    // Disco de oro de Inti: rayos en punta, anillo y cara grabada.
    glow(g, 65, 65, 64, 0xff9f1c);
    g.fillStyle(0xffb703, 1).fillPoints(star(65, 65, 60, 38, 12), true);
    g.fillStyle(0xffd166, 1).fillCircle(65, 65, 36);
    g.lineStyle(4, 0xc77700, 1).strokeCircle(65, 65, 30);
    g.fillStyle(0xc77700, 1).fillRect(52, 56, 9, 5).fillRect(69, 56, 9, 5).fillRect(55, 74, 20, 4);
  }),
  drum: (s) => tex(s, 'pw-drum', 110, 110, (g) => {
    // Onda del manguaré: anillos de vibración verde y rojo achiote alrededor de un golpe de madera.
    for (const [r, c, a] of [[50, 0x2ecc71, 0.5], [38, 0xd9481e, 0.8], [26, 0x2ecc71, 0.9]] as const) g.lineStyle(6, c, a).strokeCircle(55, 55, r);
    g.fillStyle(0x7a4a22, 1).fillCircle(55, 55, 15);
    g.fillStyle(0xe9c48a, 1).fillCircle(51, 51, 6);
  }),
  marble: (s) => tex(s, 'pw-marble', 100, 100, (g) => {
    // Canica de vidrio: cuerpo celeste, remolino de color adentro y brillo.
    glow(g, 50, 50, 48, 0x9ad7ff);
    g.fillStyle(0x6fc3ff, 0.9).fillCircle(50, 50, 28);
    g.lineStyle(7, 0xff4d79, 1);
    g.beginPath();
    g.arc(50, 50, 15, 0.2, Math.PI * 1.3);
    g.strokePath();
    g.lineStyle(3, 0xffffff, 0.8).strokeCircle(50, 50, 28);
    g.fillStyle(0xffffff, 0.95).fillCircle(40, 39, 7);
  }),
  cross: (s) => tex(s, 'pw-cross', 110, 140, (g) => {
    // Cruz de luz con borde dorado.
    glow(g, 55, 62, 54, 0xbfe9ff);
    g.fillStyle(0xc9a227, 1).fillRect(41, 6, 28, 128).fillRect(9, 36, 92, 28);
    g.fillStyle(0xf4fbff, 1).fillRect(46, 11, 18, 118).fillRect(14, 41, 82, 18);
  }),
  needle: (s) => tex(s, 'pw-needle', 140, 40, (g) => {
    // Aguja de jade apuntando a la derecha (se gira hacia donde va).
    for (let k = 18; k > 4; k -= 3) g.fillStyle(0x2fd08f, 0.08).fillEllipse(70, 20, k * 7, k * 2);
    g.fillStyle(0x19b37a, 1).fillTriangle(8, 14, 8, 26, 136, 20);
    g.fillStyle(0xd8fff0, 1).fillTriangle(20, 18, 20, 22, 120, 20);
    g.fillStyle(0xffd166, 1).fillRect(4, 12, 8, 16);
  }),
  coin: (s) => tex(s, 'pw-coin', 100, 100, (g) => {
    // Moneda de oro con el signo de dólar.
    glow(g, 50, 50, 48, 0xffd166);
    g.fillStyle(0xb8860b, 1).fillCircle(50, 50, 32);
    g.fillStyle(0xffd23f, 1).fillCircle(50, 50, 27);
    g.lineStyle(3, 0xb8860b, 1).strokeCircle(50, 50, 21);
    g.fillStyle(0xb8860b, 1).fillRect(46, 32, 8, 36).fillRect(38, 38, 22, 6).fillRect(40, 47, 20, 6).fillRect(40, 56, 22, 6);
  }),
  mirror: (s) => tex(s, 'pw-mirror', 100, 140, (g) => {
    // Espejo de mano: marco verde, vidrio con reflejos y mango.
    glow(g, 50, 56, 50, 0x4dff88);
    g.fillStyle(0x1f7a46, 1).fillEllipse(50, 56, 78, 100);
    g.fillStyle(0xdff7ff, 1).fillEllipse(50, 56, 62, 84);
    g.fillStyle(0xffffff, 0.9).fillTriangle(30, 40, 44, 22, 40, 60);
    g.fillStyle(0xaee9ff, 0.8).fillTriangle(56, 80, 70, 58, 68, 88);
    g.fillStyle(0x1f7a46, 1).fillRect(44, 104, 12, 32);
  }),
  ring: (s) => tex(s, 'pw-ring', 120, 140, (g) => {
    // Aro de corazón (Ricardo): contorno de corazón con halo y un corazón fino adentro. Se tiñe de su color.
    const heart = (r: number) => {
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < 48; i++) {
        const t = (i / 48) * Math.PI * 2;
        const x = 16 * Math.sin(t) ** 3;
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        pts.push(new Phaser.Math.Vector2(60 + (x * r) / 16, 66 - (y * r) / 16));
      }
      return pts;
    };
    for (const [w, a] of [[16, 0.18], [9, 0.4], [5, 1]] as const) g.lineStyle(w, 0xffffff, a).strokePoints(heart(48), true);
    g.lineStyle(3, 0xffffff, 0.5).strokePoints(heart(30), true);
  }),
  dagger: (s) => tex(s, 'pw-dagger', 150, 50, (g) => {
    // Daga de la Corona apuntando a la derecha (se gira hacia donde va): hoja de plata, guarda y pomo de oro.
    for (let k = 20; k > 4; k -= 4) g.fillStyle(0xffe9a8, 0.07).fillEllipse(90, 25, k * 7, k * 2);
    g.fillStyle(0xc9ced6, 1).fillTriangle(52, 15, 52, 35, 146, 25);
    g.fillStyle(0xffffff, 1).fillTriangle(56, 22, 56, 26, 136, 25);
    g.fillStyle(0xc9a227, 1).fillRect(44, 6, 9, 38);
    g.fillStyle(0x6b1a2a, 1).fillRect(16, 19, 28, 12);
    g.fillStyle(0xc9a227, 1).fillCircle(12, 25, 8);
    g.fillStyle(0xb3122e, 1).fillCircle(48, 25, 4);
  }),
  spear: (s) => tex(s, 'pw-spear', 240, 64, (g) => {
    // Lanza de chonta apuntando a la derecha: asta gruesa de madera con franjas de achiote, plumas y punta de piedra.
    for (let k = 28; k > 6; k -= 5) g.fillStyle(0x2ecc71, 0.07).fillEllipse(130, 32, k * 9, k * 2);
    g.fillStyle(0x3a2410, 1).fillRect(20, 26, 172, 12);
    g.fillStyle(0x7a4a22, 1).fillRect(20, 28, 172, 6);
    g.fillStyle(0xd9481e, 1).fillRect(64, 25, 10, 14).fillRect(92, 25, 10, 14).fillRect(120, 25, 10, 14);
    g.fillStyle(0x2ecc71, 1).fillTriangle(2, 8, 34, 28, 16, 32).fillTriangle(2, 56, 34, 36, 16, 32);
    g.fillStyle(0xffe14d, 1).fillTriangle(10, 20, 30, 30, 18, 32).fillTriangle(10, 44, 30, 34, 18, 32);
    g.fillStyle(0x2b2b2b, 1).fillTriangle(186, 10, 186, 54, 238, 32);
    g.fillStyle(0xd0d0d0, 1).fillTriangle(192, 20, 192, 44, 228, 32);
    g.fillStyle(0xffffff, 0.9).fillTriangle(196, 26, 196, 32, 222, 32);
  }),
  buster: (s) => tex(s, 'pw-buster', 130, 90, (g) => {
    // Disparo de buster (mirando a la derecha): óvalo de energía morada con núcleo blanco y una estela corta atrás.
    for (let k = 0; k < 6; k++) g.fillStyle(0x9b30ff, 0.07).fillEllipse(62 - k * 4, 45, 120 - k * 10, 84 - k * 9);
    g.fillStyle(0x7a1fd6, 0.5).fillEllipse(34, 45, 46, 26).fillEllipse(18, 45, 26, 14);
    g.fillStyle(0xb44dff, 1).fillEllipse(74, 45, 74, 54);
    g.fillStyle(0xe2b8ff, 1).fillEllipse(78, 45, 52, 36);
    g.fillStyle(0xffffff, 1).fillEllipse(82, 43, 32, 20);
  }),
  slash: (s) => tex(s, 'pw-slash', 150, 520, (g) => {
    // Corte de sable (hacia la derecha): media luna alta y fina, filo blanco, borde dorado y halo.
    const crescent = (out: number, inn: number, shift: number, h: number) => {
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= 24; i++) {
        const a = -Math.PI / 2 + (i / 24) * Math.PI;
        pts.push(new Phaser.Math.Vector2(40 + Math.cos(a) * out, 260 + Math.sin(a) * h));
      }
      for (let i = 24; i >= 0; i--) {
        const a = -Math.PI / 2 + (i / 24) * Math.PI;
        pts.push(new Phaser.Math.Vector2(40 - shift + Math.cos(a) * inn, 260 + Math.sin(a) * h * 0.96));
      }
      return pts;
    };
    g.fillStyle(0xffe9a8, 0.18).fillPoints(crescent(104, 40, 14, 256), true);
    g.fillStyle(0xc9a227, 0.85).fillPoints(crescent(92, 54, 12, 244), true);
    g.fillStyle(0xfff6d8, 1).fillPoints(crescent(84, 62, 10, 236), true);
    g.fillStyle(0xffffff, 1).fillPoints(crescent(80, 70, 6, 228), true);
  }),
  tornado: (s) => tex(s, 'pw-tornado', 120, 160, (g) => {
    // Tornado de arena (Markus): embudo de aros dorados y azules, angosto abajo y ancho arriba, con halo.
    for (let r = 58; r > 20; r -= 6) g.fillStyle(0xe0b862, 0.04).fillEllipse(60, 80, r * 2, r * 2.6);
    for (let i = 0; i < 9; i++) {
      const k = i / 8;
      const y = 150 - k * 136;
      const w = 18 + k * 92;
      g.lineStyle(i % 3 === 0 ? 5 : 3, i % 2 ? 0x5c9dff : 0xe0b862, 0.95).strokeEllipse(60 + Math.sin(i * 1.3) * 6, y, w, 12 + k * 10);
    }
    g.fillStyle(0xfff1c9, 0.9).fillEllipse(60, 150, 16, 8);
  }),
  shriek: (s) => tex(s, 'pw-shriek', 120, 120, (g) => {
    for (const [r, c] of [[52, 0xff173d], [38, 0x6a00ff], [24, 0xff173d]] as const) g.lineStyle(6, c, 0.9).strokeCircle(60, 60, r);
    g.fillStyle(0xffd0d8, 1).fillCircle(60, 60, 9);
  }),
};

/** Looks blancos que se tiñen con el color del luchador. */
const TINTED: PowerLook[] = ['note', 'wave', 'miniNote', 'soundwave', 'ring'];

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
  if (['meteor', 'kiss', 'redStar', 'pearl', 'star8', 'firefly', 'darkOrb', 'shriek', 'miniNote', 'wave', 'soundwave', 'sun', 'marble', 'needle', 'ring', 'buster', 'slash', 'tornado'].includes(look)) img.setBlendMode(Phaser.BlendModes.ADD);
  const spin = look === 'banana' ? 720 : look === 'pick' ? 900 : look === 'book' ? 360 : look === 'tray' ? 0 : look === 'redStar' ? 400 : look === 'star8' ? 300 : look === 'flask' ? 420 : look === 'sun' ? 160 : look === 'marble' ? 540 : look === 'coin' ? 1080 : 0;
  return { obj: img, spin, aim: look === 'wave' || look === 'needle' || look === 'dagger' || look === 'spear', jitter: look === 'cross' ? 3 : look === 'tornado' ? 8 : 0 };
};
