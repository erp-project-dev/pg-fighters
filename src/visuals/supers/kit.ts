import Phaser from 'phaser';
import { FONTS, GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../../config';
import type { Fighter } from '../../entities/Fighter';
import type { Fx } from '../../systems/Fx';

/** Lo que vuela al rival en lugar de la nota musical. */
export type NoteObj = Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Container;

interface Bit {
  obj: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  spin: number;
  gravity: number;
  age: number;
  life: number;
  alpha: number;
  /** Cambio de escala por segundo (negativo = se encoge). */
  grow: number;
}

/** Estado de un súper en curso, compartido con el show del luchador. */
export interface ShowCtx {
  scene: Phaser.Scene;
  fx: Fx;
  owner: Fighter;
  target: Fighter;
  /** Capa detrás de los luchadores (sobre la penumbra) y capa delante. Se desvanecen al terminar el solo. */
  back: Phaser.GameObjects.Container;
  front: Phaser.GameObjects.Container;
  /** ms desde que empezó el solo y duración del solo. */
  t: number;
  duration: number;
  /** Estado propio de cada show. */
  data: Record<string, any>;
  bits: Bit[];
  /** Se ejecutan al terminar el solo (quitar filtros de cámara, devolver la rotación…). */
  cleanup: (() => void)[];
}

/**
 * Súper animado con efectos de Phaser (sin sprites nuevos). El solo de guitarra sigue marcando cuándo
 * sale cada golpe y cuánto daño hace; el show solo decide cómo se ve.
 */
export interface SuperShow {
  /** Cuánto se eleva el luchador (px) mientras toca; flota con la guitarra en la mano. Por defecto 80. */
  lift?: number;
  /** Giro de los proyectiles (grados/s). Sin esto, se mecen como notas. */
  spin?: number;
  /** Los proyectiles apuntan hacia donde vuelan (misiles, cometas). */
  aim?: boolean;
  /** Cuánto se abren al salir (1 = normal): más alto, curvas más amplias antes de buscar al rival. */
  spread?: number;
  start?(c: ShowCtx): void;
  update?(c: ShowCtx, dt: number): void;
  /** Proyectil de cada nota (`hit` = la que golpea). null = nota musical por defecto. */
  note?(c: ShowCtx, x: number, y: number, hit: boolean, final: boolean, i: number): NoteObj | null;
  /** Cada cuadro, por cada proyectil que golpea y sigue en vuelo (estelas, chispas). */
  fly?(c: ShowCtx, x: number, y: number, age: number, final: boolean, obj: NoteObj): void;
  /** Una nota acertó al rival (no se llama si la bloquea o es intocable); `final` es el remate. */
  impact?(c: ShowCtx, x: number, y: number, final: boolean): void;
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

/** Pecho de un luchador (a donde apuntan los golpes), contando lo que flota durante el súper. */
export const chest = (f: Fighter) => ({ x: f.x, y: GROUND_Y - f.z - f.visualLift - f.def.art.height * 0.6 });
/** Parte de arriba de la cabeza. */
export const head = (f: Fighter) => ({ x: f.x, y: GROUND_Y - f.z - f.visualLift - f.def.art.height });

/** Textura dibujada por código una sola vez y reutilizada (el origen de dibujo es la esquina superior izquierda). */
export const tex = (scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): string => {
  if (!scene.textures.exists(key)) {
    const g = scene.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }
  return key;
};

/** Punto suave (partículas, luces). */
export const dotTex = (scene: Phaser.Scene) =>
  tex(scene, 'sx-dot', 32, 32, (g) => {
    for (let r = 16; r > 2; r -= 2) g.fillStyle(0xffffff, 0.12).fillCircle(16, 16, r);
    g.fillStyle(0xffffff, 1).fillCircle(16, 16, 4);
  });

/** Papelito rectangular (confeti, billetes chicos). */
export const chipTex = (scene: Phaser.Scene) => tex(scene, 'sx-chip', 12, 18, (g) => g.fillStyle(0xffffff, 1).fillRect(0, 0, 12, 18));

export const text = (scene: Phaser.Scene, x: number, y: number, str: string, size: number, color: string, stroke = '#000000') =>
  scene.add.text(x, y, str, { fontFamily: FONTS.head, fontSize: `${size}px`, fontStyle: 'italic 900', color, stroke, strokeThickness: Math.max(4, size / 10) }).setOrigin(0.5);

/** Partícula con física simple (lluvia de monedas, confeti, pétalos, burbujas…). */
export const emit = (
  c: ShowCtx,
  key: string,
  x: number,
  y: number,
  o: { vx?: number; vy?: number; spin?: number; gravity?: number; life?: number; scale?: number; grow?: number; tint?: number; alpha?: number; add?: boolean; layer?: 'back' | 'front' } = {},
): Phaser.GameObjects.Image => {
  const obj = c.scene.add.image(x, y, key).setScale(o.scale ?? 1).setAngle(rand(0, 360));
  if (o.tint !== undefined) obj.setTint(o.tint);
  if (o.add) obj.setBlendMode(Phaser.BlendModes.ADD);
  obj.setAlpha(o.alpha ?? 1);
  (o.layer === 'back' ? c.back : c.front).add(obj);
  // Tope de partículas para equipos lentos: la más vieja se va primero.
  if (c.bits.length > 420) c.bits[0].age = c.bits[0].life;
  c.bits.push({ obj, vx: o.vx ?? 0, vy: o.vy ?? 0, spin: o.spin ?? 0, gravity: o.gravity ?? 0, age: 0, life: o.life ?? 3, alpha: o.alpha ?? 1, grow: o.grow ?? 0 });
  return obj;
};

export const stepBits = (c: ShowCtx, dt: number): void => {
  for (const b of c.bits) {
    b.age += dt;
    b.vy += b.gravity * dt;
    b.obj.x += b.vx * dt;
    b.obj.y += b.vy * dt;
    b.obj.angle += b.spin * dt;
    if (b.grow) b.obj.setScale(Math.max(0.01, b.obj.scaleX + b.grow * dt));
    const fade = Math.min(1, (b.life - b.age) / 0.4);
    b.obj.setAlpha(b.alpha * Math.max(0, fade));
    if (b.age >= b.life || b.obj.y > GAME_HEIGHT + 120 || b.obj.y < -300) b.age = Infinity;
  }
  for (const b of c.bits) if (b.age === Infinity) b.obj.destroy();
  c.bits = c.bits.filter((b) => b.age !== Infinity);
};

/** Texto que sube y se desvanece (dentro del show). */
export const floatText = (c: ShowCtx, x: number, y: number, str: string, color: string, size = 40): void => {
  const t = text(c.scene, x, y, str, size, color).setScale(0.4);
  c.front.add(t);
  c.scene.tweens.add({ targets: t, scale: 1, duration: 140, ease: 'Back.easeOut' });
  c.scene.tweens.add({ targets: t, y: y - 70, alpha: 0, delay: 300, duration: 450, onComplete: () => t.destroy() });
};

/**
 * Letrero gigante del remate ("¡GOOOL!", "FIN"…). Vive fuera del show: sigue en pantalla
 * aunque el solo ya haya terminado.
 */
export const slam = (scene: Phaser.Scene, x: number, y: number, str: string, color: string, size = 150, angle = -6): Phaser.GameObjects.Text => {
  const t = text(scene, x, y, str, size, color).setDepth(56).setAngle(angle).setScale(2.6).setAlpha(0);
  t.setShadow(0, 0, color, 30, true, true);
  scene.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: t, scale: 1.12, alpha: 0, delay: 900, duration: 380, onComplete: () => t.destroy() });
  return t;
};

/** Pantalla entera de un color que aparece y se va (fuera del show). */
export const veil = (scene: Phaser.Scene, color: number, alpha: number, hold: number, fadeIn = 60, fadeOut = 380, depth = 50): Phaser.GameObjects.Rectangle => {
  const r = scene.add.rectangle(-100, -100, GAME_WIDTH + 200, GAME_HEIGHT + 200, color, 1).setOrigin(0).setDepth(depth).setAlpha(0);
  scene.tweens.add({ targets: r, alpha, duration: fadeIn });
  scene.tweens.add({ targets: r, alpha: 0, delay: fadeIn + hold, duration: fadeOut, onComplete: () => r.destroy() });
  return r;
};

/** Fuegos artificiales: estallidos de colores escalonados alrededor de un punto. */
export const fireworks = (c: ShowCtx, x: number, y: number, colors: number[], n = 6, spread = 360): void => {
  for (let i = 0; i < n; i++) {
    c.scene.time.delayedCall(i * 110, () => {
      const px = x + rand(-spread / 2, spread / 2);
      const py = y + rand(-spread / 3, spread / 4);
      c.fx.hit(px, py, pick(colors), true);
      c.fx.ring(px, py, pick(colors), 140, 0.4);
    });
  }
};

/** Objeto que cae del cielo sobre `x` hasta `toY` y rebota (fuera del show). */
export const drop = (scene: Phaser.Scene, key: string, x: number, toY: number, scale: number, ms: number, onLand: () => void, delay = 0): void => {
  const img = scene.add.image(x, -300, key).setScale(scale).setDepth(48).setAngle(rand(-8, 8));
  scene.tweens.add({
    targets: img, y: toY, delay, duration: ms, ease: 'Quad.easeIn',
    onComplete: () => {
      onLand();
      scene.tweens.add({ targets: img, y: toY - 40, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
      scene.tweens.add({ targets: img, alpha: 0, delay: 520, duration: 320, onComplete: () => img.destroy() });
    },
  });
};

/** Etiqueta con fondo (para proyectiles con texto: "LICK 3", "OFERTA"…). */
export const tag = (scene: Phaser.Scene, x: number, y: number, str: string, bg: number, fg: string, size = 26): Phaser.GameObjects.Container => {
  const t = text(scene, 0, 0, str, size, fg, '#000000').setStroke('#000000', 4);
  const w = t.width + 24;
  const h = t.height + 6;
  const g = scene.add.graphics();
  g.fillStyle(bg, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 8);
  g.lineStyle(3, 0x000000, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
  return scene.add.container(x, y, [g, t]);
};
