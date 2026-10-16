import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../../config';
import type { Fighter, VictimPose } from '../../entities/Fighter';
import { emit, rand, tex, type ShowCtx } from './kit';

/**
 * Efectos de energía pura para los súper: luz, partículas, rayos, ondas y filtros de cámara.
 * Nada de objetos dibujados: todo es blanco (se tiñe con el color de cada luchador) y se suma con ADD.
 */

export const ADD = Phaser.BlendModes.ADD;
export const TAU = Math.PI * 2;
type G = Phaser.GameObjects.Graphics;
type V = Phaser.Math.Vector2;

// ───────────────────────────── Texturas (blancas, para teñir) ─────────────────────────────

/** Resplandor suave y redondo. */
export const glowTex = (s: Phaser.Scene) =>
  tex(s, 'en-glow', 64, 64, (g) => {
    for (let r = 32; r > 1; r -= 2) g.fillStyle(0xffffff, 0.07).fillCircle(32, 32, r);
  });

/** Núcleo de plasma: halo y centro muy brillante. */
export const coreTex = (s: Phaser.Scene) =>
  tex(s, 'en-core', 96, 96, (g) => {
    for (let r = 48; r > 14; r -= 3) g.fillStyle(0xffffff, 0.06).fillCircle(48, 48, r);
    g.fillStyle(0xffffff, 0.8).fillCircle(48, 48, 15);
    g.fillStyle(0xffffff, 1).fillCircle(48, 48, 9);
  });

/** Estela larga con la cabeza a la derecha (origen 0.9 = la punta). */
export const streakTex = (s: Phaser.Scene) =>
  tex(s, 'en-streak', 256, 40, (g) => {
    for (let i = 0; i <= 24; i++) {
      const k = i / 24;
      g.fillStyle(0xffffff, 0.02 + k * 0.1).fillEllipse(20 + k * 210, 20, 30 + k * 30, 6 + k * 26);
    }
    g.fillStyle(0xffffff, 0.9).fillEllipse(222, 20, 40, 10);
  });

/** Aro de luz. */
export const ringTex = (s: Phaser.Scene) =>
  tex(s, 'en-ring', 128, 128, (g) => {
    for (let w = 14; w > 2; w -= 3) g.lineStyle(w, 0xffffff, 0.12).strokeCircle(64, 64, 54);
    g.lineStyle(3, 0xffffff, 1).strokeCircle(64, 64, 54);
  });

/** Píxel cuadrado con borde brillante. */
export const squareTex = (s: Phaser.Scene) =>
  tex(s, 'en-sq', 24, 24, (g) => {
    g.fillStyle(0xffffff, 0.35).fillRect(0, 0, 24, 24);
    g.fillStyle(0xffffff, 1).fillRect(4, 4, 16, 16);
  });

/** Media luna de corte (tajo), abierta hacia la derecha. */
export const crescentTex = (s: Phaser.Scene) =>
  tex(s, 'en-cres', 160, 160, (g) => {
    for (let w = 26; w > 2; w -= 4) {
      g.lineStyle(w, 0xffffff, w < 8 ? 1 : 0.12);
      g.beginPath();
      g.arc(60, 80, 62, -1.25, 1.25);
      g.strokePath();
    }
  });

/** Estrella de energía de `n` puntas. */
export const starTex = (s: Phaser.Scene, n = 5) =>
  tex(s, `en-star${n}`, 96, 96, (g) => {
    for (let r = 46; r > 20; r -= 4) g.fillStyle(0xffffff, 0.05).fillCircle(48, 48, r);
    g.fillStyle(0xffffff, 1).fillPoints(starPts(48, 48, 40, 15, n), true);
  });

/** Púa de luz (triángulo redondeado con brillo), punta hacia abajo. */
export const pickTex = (s: Phaser.Scene) =>
  tex(s, 'en-pick', 96, 104, (g) => {
    for (let r = 48; r > 24; r -= 4) g.fillStyle(0xffffff, 0.05).fillCircle(48, 48, r);
    const pts = (k: number) => [
      new Phaser.Math.Vector2(48, 48 + 48 * k), new Phaser.Math.Vector2(48 - 38 * k, 48 - 14 * k), new Phaser.Math.Vector2(48 - 26 * k, 48 - 36 * k),
      new Phaser.Math.Vector2(48 + 26 * k, 48 - 36 * k), new Phaser.Math.Vector2(48 + 38 * k, 48 - 14 * k),
    ];
    g.fillStyle(0xffffff, 0.55).fillPoints(pts(0.95), true);
    g.fillStyle(0xffffff, 1).fillPoints(pts(0.62), true);
  });

/** Cruz de luz (brazo vertical más largo). */
export const crossTex = (s: Phaser.Scene) =>
  tex(s, 'en-cross', 96, 128, (g) => {
    for (let w = 26; w > 8; w -= 6) {
      g.fillStyle(0xffffff, 0.12).fillRect(48 - w / 2 - 4, 4, w + 8, 120).fillRect(8, 40 - w / 2 - 4, 80, w + 8);
    }
    g.fillStyle(0xffffff, 1).fillRect(42, 10, 12, 108).fillRect(14, 34, 68, 12);
  });

/** Destello de cuatro puntas (brillo, chispa de lujo). */
export const glintTex = (s: Phaser.Scene) =>
  tex(s, 'en-glint', 96, 96, (g) => {
    for (let r = 20; r > 2; r -= 3) g.fillStyle(0xffffff, 0.08).fillCircle(48, 48, r);
    g.fillStyle(0xffffff, 1).fillPoints(starPts(48, 48, 46, 5, 4), true);
  });

export const starPts = (cx: number, cy: number, outer: number, inner: number, n: number, rot = -Math.PI / 2): V[] => {
  const out: V[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * TAU;
    const r = i % 2 ? inner : outer;
    out.push(new Phaser.Math.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return out;
};

// ───────────────────────────── Proyectiles ─────────────────────────────

const img = (s: Phaser.Scene, key: string, color: number, scale: number) =>
  s.add.image(0, 0, key).setTint(color).setScale(scale).setBlendMode(ADD);

/** Orbe de plasma: halo de color y centro blanco. */
export const orb = (c: ShowCtx, x: number, y: number, color: number, r: number) =>
  c.scene.add.container(x, y, [img(c.scene, glowTex(c.scene), color, (r * 3) / 32), img(c.scene, coreTex(c.scene), 0xffffff, r / 30)]);

/** Misil de energía: estela de color con la punta blanca (usar con `aim`). */
export const missile = (c: ShowCtx, x: number, y: number, color: number, r: number) => {
  const tail = img(c.scene, streakTex(c.scene), color, r / 14).setOrigin(0.9, 0.5);
  const head = img(c.scene, coreTex(c.scene), 0xffffff, r / 34);
  return c.scene.add.container(x, y, [img(c.scene, glowTex(c.scene), color, r / 12), tail, head]);
};

/** Imagen suelta de una textura de energía. */
export const shot = (c: ShowCtx, key: string, x: number, y: number, color: number, scale: number) =>
  c.scene.add.image(x, y, key).setTint(color).setScale(scale).setBlendMode(ADD);

/** Chispa chica para las notas que no golpean (adorno que sube y se apaga). */
export const spark = (c: ShowCtx, x: number, y: number, color: number) => shot(c, glowTex(c.scene), x, y, color, rand(0.4, 0.8));

/** Estela de partículas detrás de un proyectil. */
export const comet = (c: ShowCtx, x: number, y: number, color: number, size = 1, life = 0.35) => {
  emit(c, glowTex(c.scene), x + rand(-6, 6), y + rand(-6, 6), { life, scale: size * rand(0.7, 1.2), grow: -size * 2, tint: color, add: true });
};

// ───────────────────────────── Dibujo (Graphics) ─────────────────────────────

/** Rayo quebrado entre dos puntos. */
export const jag = (x0: number, y0: number, x1: number, y1: number, steps = 9, amp = 40): V[] => {
  const out = [new Phaser.Math.Vector2(x0, y0)];
  for (let i = 1; i < steps; i++) {
    const k = i / steps;
    out.push(new Phaser.Math.Vector2(x0 + (x1 - x0) * k + rand(-amp, amp), y0 + (y1 - y0) * k + rand(-amp, amp)));
  }
  out.push(new Phaser.Math.Vector2(x1, y1));
  return out;
};

/** Rayo con halo de color y centro blanco. */
export const bolt = (g: G, p: V[], color: number, width = 3, alpha = 1) => {
  g.lineStyle(width * 5, color, 0.22 * alpha).strokePoints(p);
  g.lineStyle(width * 2, color, 0.6 * alpha).strokePoints(p);
  g.lineStyle(width, 0xffffff, alpha).strokePoints(p);
};

/** Caja aproximada del cuerpo de un luchador (para chispas y descargas sobre él). */
export const body = (f: Fighter) => {
  const h = f.def.art.height;
  const feet = GROUND_Y - f.z - f.visualLift;
  return { x: f.x, top: feet - h, feet, w: h * 0.36, h };
};

/** Descargas eléctricas cortas sobre el cuerpo del luchador. */
export const zapArcs = (g: G, f: Fighter, color: number, n = 3, width = 2) => {
  const b = body(f);
  for (let i = 0; i < n; i++) {
    const x0 = b.x + rand(-b.w, b.w);
    const y0 = rand(b.top, b.feet - 20);
    bolt(g, jag(x0, y0, x0 + rand(-b.w, b.w), y0 + rand(-b.h * 0.35, b.h * 0.35), 5, 18), color, width);
  }
};

/** Punto `k` (0..1) del contorno de un corazón de tamaño `r` (punta abajo). */
export const heartAt = (k: number, r: number) => {
  const a = k * TAU;
  return { x: (16 * Math.sin(a) ** 3) * r / 16, y: -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * r / 16 };
};

/** Haces de luz que salen de un punto (abanico de sol, aura). */
export const rays = (g: G, x: number, y: number, n: number, len: number, rot: number, color: number, alpha: number, width = 0.12) => {
  g.fillStyle(color, alpha);
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU;
    g.fillTriangle(x, y, x + Math.cos(a - width) * len, y + Math.sin(a - width) * len, x + Math.cos(a + width) * len, y + Math.sin(a + width) * len);
  }
};

/** Bordes de la pantalla que se cierran en un color. */
export const frame = (g: G, color: number, alpha: number, layers = 6) => {
  for (let k = 0; k < layers; k++) {
    const w = 40 + k * 30;
    g.lineStyle(w, color, alpha * (1 - k / (layers + 1))).strokeRect(-60 + w / 2, -60 + w / 2, GAME_WIDTH + 120 - w, GAME_HEIGHT + 120 - w);
  }
};

/** Línea ondulada de lado a lado de la pantalla. */
export const wave = (g: G, y0: number, amp: number, len: number, phase: number, color: number, width: number, alpha: number, x0 = -40, x1 = GAME_WIDTH + 40) => {
  g.lineStyle(width, color, alpha);
  g.beginPath();
  for (let x = x0; x <= x1; x += 14) {
    const y = y0 + Math.sin(x / len + phase) * amp;
    if (x === x0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.strokePath();
};

/** Espiral de `arms` brazos alrededor de un punto. */
export const spiral = (g: G, x: number, y: number, arms: number, r: number, rot: number, color: number, width: number, alpha: number, turns = 1.4) => {
  for (let a = 0; a < arms; a++) {
    g.lineStyle(width, color, alpha);
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const k = i / 40;
      const ang = rot + (a / arms) * TAU + k * turns * TAU;
      const px = x + Math.cos(ang) * r * k;
      const py = y + Math.sin(ang) * r * k * 0.8;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.strokePath();
  }
};

// ───────────────────────────── Copias del sprite ─────────────────────────────

/** Copia de luz del sprite (desplazada), que se desvanece: fantasmas, RGB partido, imágenes residuales. */
export const echo = (
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  o: { dx?: number; dy?: number; color: number; alpha?: number; ms?: number; grow?: number; depth?: number; add?: boolean },
) => {
  const g = scene.add.image(sprite.x + (o.dx ?? 0), sprite.y + (o.dy ?? 0), sprite.texture.key, sprite.frame.name);
  g.setOrigin(sprite.originX, sprite.originY).setScale(sprite.scaleX, sprite.scaleY).setFlipX(sprite.flipX).setAngle(sprite.angle);
  g.setDepth(o.depth ?? sprite.depth - 0.5).setAlpha(o.alpha ?? 0.5).setTint(o.color).setTintMode(Phaser.TintModes.FILL);
  if (o.add !== false) g.setBlendMode(ADD);
  const grow = o.grow ?? 0;
  scene.tweens.add({ targets: g, alpha: 0, scaleX: sprite.scaleX * (1 + grow), scaleY: sprite.scaleY * (1 + grow), duration: o.ms ?? 220, onComplete: () => g.destroy() });
  return g;
};

// ───────────────────────────── Reacciones del rival ─────────────────────────────

/** Electrocutado: tiembla y parpadea entre blanco, el color de la descarga y su color normal. */
export const shockPose = (t: number, color: number, power = 1): VictimPose => {
  const k = Math.floor(t / 45) % 3;
  return {
    x: rand(-8, 8) * power, y: rand(-3, 3) * power, angle: rand(-5, 5) * power,
    ...(k === 0 ? { tint: 0xffffff, fill: true } : k === 1 ? { tint: color, fill: true } : {}),
  };
};

/** Gira sobre su eje vertical (se aplana y se da vuelta), `rps` vueltas por segundo. */
export const spinX = (t: number, rps: number) => {
  const c = Math.cos((t / 1000) * rps * TAU);
  return Math.abs(c) < 0.12 ? 0.12 * Math.sign(c || 1) : c;
};

/** Vale 1 justo al golpear y baja a 0 en `ms`. */
export const decay = (t: number, at: number | undefined, ms: number) => (at === undefined ? 0 : Math.max(0, 1 - (t - at) / ms));

// ───────────────────────────── Filtros de cámara (WebGL) ─────────────────────────────

type Filters = NonNullable<Phaser.Cameras.Scene2D.Camera['filters']>['internal'];

const filters = (scene: Phaser.Scene): Filters | null =>
  scene.sys.renderer.type === Phaser.WEBGL ? scene.cameras.main.filters?.internal ?? null : null;

/** Filtro persistente durante el solo; se quita solo al terminar. */
const persistent = <F extends Phaser.Filters.Controller>(c: ShowCtx, key: string, make: (list: Filters) => F): F | null => {
  if (key in c.data) return c.data[key];
  const list = filters(c.scene);
  const f = list ? make(list) : null;
  c.data[key] = f;
  if (f && list) c.cleanup.push(() => list.remove(f));
  return f;
};

/** Matriz de color de toda la pantalla (gris, negativo, saturación…); `colorMatrix.alpha` es cuánto se mezcla. */
export const lensColor = (c: ShowCtx) => persistent(c, '__lensColor', (l) => l.addColorMatrix());
/** Abombado de la pantalla (1 = nada). */
export const lensBarrel = (c: ShowCtx) => persistent(c, '__lensBarrel', (l) => l.addBarrel(1));
/** Pixelado de la pantalla (`active` para prenderlo). */
export const lensPixel = (c: ShowCtx) => persistent(c, '__lensPixel', (l) => { const f = l.addPixelate(0); f.active = false; return f; });
/** Viñeta de color en los bordes. */
export const lensVignette = (c: ShowCtx, color: number) =>
  persistent(c, '__lensVignette', (l) => { const f = l.addVignette(0.5, 0.5, 0.9, 0); f.color.setFromRGB(Phaser.Display.Color.IntegerToRGB(color)); return f; });

/** Cuánto deforman la pantalla las ondas expansivas y los pixelados (1 = valores de cada show). */
const DISTORT = 0.6;

/** Onda expansiva que abomba toda la pantalla y rebota. */
export const shockwave = (scene: Phaser.Scene, amount = 0.35, ms = 700) => {
  const list = filters(scene);
  if (!list) return;
  const f = list.addBarrel(1 + amount * DISTORT);
  scene.tweens.add({ targets: f, amount: 1, duration: ms, ease: 'Elastic.easeOut', easeParams: [1.2, 0.35], onComplete: () => list.remove(f) });
};

/** Destello de color de toda la pantalla que se desvanece (negativo, gris, quemado…). */
export const colorFlash = (scene: Phaser.Scene, kind: 'negative' | 'gray' | 'burn' | 'hue' | 'saturate', ms = 400, peak = 1) => {
  const list = filters(scene);
  if (!list) return;
  const f = list.addColorMatrix();
  const m = f.colorMatrix;
  if (kind === 'negative') m.negative();
  else if (kind === 'gray') m.grayscale(1);
  else if (kind === 'burn') m.brightness(2.2);
  else if (kind === 'hue') m.hue(180);
  else m.saturate(2.5);
  m.alpha = peak;
  scene.tweens.add({ targets: m, alpha: 0, duration: ms, ease: 'Quad.easeIn', onComplete: () => list.remove(f) });
};

/** Pixelado que se va limpiando. */
export const pixelFlash = (scene: Phaser.Scene, amount = 24, ms = 500) => {
  const list = filters(scene);
  if (!list) return;
  const f = list.addPixelate(amount * DISTORT);
  scene.tweens.add({ targets: f, amount: 0, duration: ms, ease: 'Quad.easeIn', onComplete: () => list.remove(f) });
};

/** Partículas que nacen en el borde de la pantalla y vuelan hacia un punto (absorción). */
export const suck = (c: ShowCtx, x: number, y: number, color: number, dist = [380, 640], speed = 760, layer: 'back' | 'front' = 'back') => {
  const a = rand(0, TAU);
  const d = rand(dist[0], dist[1]);
  emit(c, glowTex(c.scene), x + Math.cos(a) * d, y + Math.sin(a) * d, {
    vx: -Math.cos(a) * speed, vy: -Math.sin(a) * speed, life: d / speed, scale: rand(0.5, 1.2), tint: color, add: true, layer,
  });
};

/** Estallido de partículas desde un punto. */
export const burst = (c: ShowCtx, x: number, y: number, color: number, n = 24, speed = 900, key?: string, layer: 'back' | 'front' = 'front') => {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const s = speed * rand(0.35, 1);
    emit(c, key ?? glowTex(c.scene), x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.4, 0.9), scale: rand(0.5, 1.3), grow: -0.8, tint: color, add: true, layer });
  }
};

// ───────────────────────────── Ritmo del show ─────────────────────────────

/** true cada `ms` (por clave): para soltar anillos, rayos o ecos a intervalos. */
export const every = (c: ShowCtx, key: string, ms: number): boolean => {
  if (c.t - (c.data[key] ?? -Infinity) < ms) return false;
  c.data[key] = c.t;
  return true;
};

/** Anota el golpe (para las reacciones) y devuelve cuántos van. */
export const markHit = (c: ShowCtx, final: boolean): number => {
  c.data.hitAt = c.t;
  c.data.hits = (c.data.hits ?? 0) + 1;
  if (final) c.data.finalAt = c.t;
  return c.data.hits;
};

/** Desde el primer golpe hasta un rato después del remate, el rival lleva esta pose; luego vuelve a la normal. */
export const victim = (c: ShowCtx, pose: VictimPose | null, after = 650): void => {
  const fin = c.data.finalAt as number | undefined;
  c.target.fxPose = c.data.hits && !(fin !== undefined && c.t - fin > after) ? pose : null;
};

/** Aura del que toca: copias de luz de su sprite que se agrandan. */
export const aura = (c: ShowCtx, color: number, ms = 140, grow = 0.12, alpha = 0.35) => {
  if (every(c, '__aura', ms)) echo(c.scene, c.owner.sprite, { color, alpha, grow, ms: 360 });
};
