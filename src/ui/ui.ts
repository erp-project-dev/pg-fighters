import Phaser from 'phaser';
import { COLORS, CSS, FONTS, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { Audio } from '../systems/Audio';

/** fillPoints/strokePoints de Phaser 4 tipan Vector2[], pero aceptan cualquier {x, y}. */
export const pts = (list: { x: number; y: number }[]) => list as unknown as Phaser.Math.Vector2[];

export interface TextOpts {
  size?: number;
  color?: string;
  font?: keyof typeof FONTS;
  weight?: '400' | '500' | '600' | '700' | '800' | '900';
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  wrap?: number;
  origin?: [number, number];
  /** Sombra dura desplazada (estilo arcade). */
  shadow?: boolean;
  /** Halo difuso del color indicado. */
  glow?: string;
  stroke?: string;
  spacing?: number;
}

/** Texto HD. Por defecto Barlow Condensed 800. */
export const text = (scene: Phaser.Scene, x: number, y: number, str: string, o: TextOpts = {}) => {
  const size = o.size ?? 32;
  const font = o.font ?? 'head';
  const weight = o.weight ?? (font === 'head' ? '800' : '500');
  const t = scene.add.text(x, y, str, {
    fontFamily: FONTS[font],
    fontSize: `${size}px`,
    fontStyle: `${o.italic ? 'italic ' : ''}${weight}`,
    color: o.color ?? CSS.cream,
    align: o.align ?? 'left',
    wordWrap: o.wrap ? { width: o.wrap, useAdvancedWrap: true } : undefined,
    stroke: o.stroke,
    strokeThickness: o.stroke ? Math.max(4, Math.round(size / 9)) : 0,
    letterSpacing: o.spacing ?? 0,
    padding: { x: Math.round(size * 0.35), y: Math.round(size * 0.2) },
  });
  if (o.glow) t.setShadow(0, 0, o.glow, Math.round(size * 0.45), !!o.stroke, true);
  else if (o.shadow) t.setShadow(Math.max(3, size / 16), Math.max(3, size / 16), '#000000', 0, true, true);
  const [ox, oy] = o.origin ?? [0, 0];
  // Compensa el padding para que (x, y) marque el borde visible.
  const pl = t.padding.left ?? 0;
  const pt = t.padding.top ?? 0;
  t.setOrigin(ox, oy).setPosition(x - pl * (1 - 2 * ox), y - pt * (1 - 2 * oy));
  return t;
};

/** Ancho visible del texto (sin el margen interno que deja espacio al halo). */
export const visibleWidth = (t: Phaser.GameObjects.Text) => t.width - (t.padding.left ?? 0) - (t.padding.right ?? 0);

/** Borde inferior visible de un texto con origen arriba (para apilar textos de alto variable). */
export const bottomOf = (t: Phaser.GameObjects.Text) => t.y + t.height - (t.padding.bottom ?? 0);

/** Achica la fuente hasta que el texto quepa en `maxW` (y en `maxH` si se indica), sin bajar de `minSize`. */
export const fitText = (t: Phaser.GameObjects.Text, maxW: number, minSize: number, maxH = Infinity) => {
  let size = parseInt(String(t.style.fontSize), 10);
  const visibleH = () => t.height - (t.padding.top ?? 0) - (t.padding.bottom ?? 0);
  while (size > minSize && (visibleWidth(t) > maxW + 1 || visibleH() > maxH)) {
    size -= 2;
    t.setFontSize(size);
  }
  return t;
};

/** Fondo del bar a pantalla completa, oscurecido. */
export const stageBackdrop = (scene: Phaser.Scene, shade = 0.55, texture = 'bar') => {
  const art = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, texture);
  art.setScale(Math.max(GAME_WIDTH / art.width, GAME_HEIGHT / art.height));
  scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg, shade).setOrigin(0);
  return art;
};

/** Franjas diagonales animadas (fondo de menús). */
export const speedStripes = (scene: Phaser.Scene, color: number = COLORS.lime, alpha = 0.05) => {
  const g = scene.add.graphics();
  let offset = 0;
  const draw = () => {
    g.clear();
    g.fillStyle(color, alpha);
    for (let x = -GAME_HEIGHT + (offset % 140); x < GAME_WIDTH; x += 140) {
      g.fillPoints(pts([
        { x, y: GAME_HEIGHT },
        { x: x + 46, y: GAME_HEIGHT },
        { x: x + 46 + GAME_HEIGHT * 0.6, y: 0 },
        { x: x + GAME_HEIGHT * 0.6, y: 0 },
      ]), true);
    }
  };
  draw();
  scene.time.addEvent({ delay: 33, loop: true, callback: () => { offset += 1.2; draw(); } });
  return g;
};

/** Barrido horizontal tipo scanline (textura del CRT). */
export const scanlines = (scene: Phaser.Scene, alpha = 0.12) => {
  const g = scene.add.graphics().setDepth(1000);
  g.fillStyle(0x000000, alpha);
  for (let y = 0; y < GAME_HEIGHT; y += 4) g.fillRect(0, y, GAME_WIDTH, 2);
  return g;
};

export interface MenuItem {
  label: string | (() => string);
  enabled?: boolean;
  onSelect?: () => void;
  /** Para opciones con A D. */
  onSide?: (dir: number) => void;
}

/** Lista vertical: W S y Enter, o ratón (hover + clic). A D cambia las opciones con valor. */
export class Menu {
  index = 0;
  private texts: Phaser.GameObjects.Text[] = [];
  private marker: Phaser.GameObjects.Graphics;

  constructor(
    private scene: Phaser.Scene,
    private items: MenuItem[],
    private x: number,
    y: number,
    spacing = 70,
    private size = 46,
    private align: 'left' | 'center' = 'center',
  ) {
    this.marker = scene.add.graphics();
    items.forEach((item, i) => {
      const t = text(scene, x, y + i * spacing, '', { size, italic: true, weight: '900', origin: [align === 'center' ? 0.5 : 0, 0.5], spacing: 1 });
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => {
        if (item.enabled === false || this.index === i) return;
        this.index = i;
        Audio.blip(scene);
        this.refresh();
      });
      t.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.rightButtonDown()) return;
        this.index = i;
        if (item.onSide) item.onSide(1);
        this.select();
      });
      this.texts.push(t);
    });
    this.index = Math.max(0, items.findIndex((it) => it.enabled !== false));
    this.refresh();
  }

  move(dir: number): void {
    const n = this.items.length;
    let i = this.index;
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n;
      if (this.items[i].enabled !== false) break;
    }
    if (i !== this.index) Audio.blip(this.scene);
    this.index = i;
    this.refresh();
  }

  side(dir: number): void {
    const item = this.items[this.index];
    if (!item.onSide) return;
    item.onSide(dir);
    Audio.blip(this.scene, true);
    this.refresh();
  }

  select(): void {
    const item = this.items[this.index];
    if (item.enabled === false) return;
    if (item.onSelect) {
      Audio.blip(this.scene, true);
      item.onSelect();
    }
    this.refresh();
  }

  refresh(): void {
    this.marker.clear();
    this.texts.forEach((t, i) => {
      const it = this.items[i];
      const sel = i === this.index;
      const label = typeof it.label === 'function' ? it.label() : it.label;
      t.setText(it.onSide ? (sel ? `◀  ${label}  ▶` : label) : label);
      t.setColor(it.enabled === false ? '#4a4942' : sel ? CSS.dark : CSS.cream);
      if (sel) {
        const pad = t.padding.left ?? 0;
        const w = t.width - pad * 2 + 60;
        const h = this.size * 1.25;
        const left = this.align === 'center' ? this.x - w / 2 : this.x - 30;
        this.marker.fillStyle(COLORS.lime, 1);
        this.marker.fillPoints(pts([
          { x: left + 14, y: t.y - h / 2 },
          { x: left + w + 14, y: t.y - h / 2 },
          { x: left + w - 14, y: t.y + h / 2 },
          { x: left - 14, y: t.y + h / 2 },
        ]), true);
      }
    });
  }
}

/** Tecla dibujada como "keycap". Devuelve el contenedor centrado en (x, y) y su ancho. */
export const keycap = (scene: Phaser.Scene, x: number, y: number, key: string, size = 22, color: number = COLORS.lime) => {
  const label = text(scene, 0, 0, key, { size, weight: '700', origin: [0.5, 0.5], color: CSS.cream });
  const w = Math.max(size * 1.8, label.width - (label.padding.left ?? 0) * 2 + size * 1.1);
  const h = size * 1.7;
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.5).fillRoundedRect(-w / 2, -h / 2 + 4, w, h, 5);
  g.fillStyle(COLORS.panel, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 5);
  g.lineStyle(2, color, 0.85).strokeRoundedRect(-w / 2, -h / 2, w, h, 5);
  return { container: scene.add.container(x, y, [g, label]), width: w };
};

/**
 * Barra inferior de ayuda. Grupos separados por 4+ espacios; en cada grupo,
 * teclas separadas por espacio y la acción tras 2 espacios: 'ENTER  ELEGIR      ESC  VOLVER'.
 */
export const footer = (scene: Phaser.Scene, str: string, y = GAME_HEIGHT - 48) => {
  const row = scene.add.container(0, y);
  let x = 0;
  for (const group of str.trim().split(/\s{4,}/)) {
    const [keys, ...rest] = group.split(/\s{2,}/);
    for (const k of keys.split(/\s+/)) {
      const cap = keycap(scene, 0, 0, k);
      cap.container.x = x + cap.width / 2;
      row.add(cap.container);
      x += cap.width + 6;
    }
    const label = text(scene, x + 6, 0, rest.join(' '), { size: 24, weight: '600', color: '#c9c6b8', origin: [0, 0.5], spacing: 1.5 });
    row.add(label);
    x += 6 + label.width - (label.padding.left ?? 0) * 2 + 46;
  }
  const w = x - 46;
  const back = scene.add.graphics();
  back.fillStyle(COLORS.bg, 0.75).fillRect(-30, -28, w + 60, 56);
  row.addAt(back, 0);
  row.x = GAME_WIDTH / 2 - w / 2;
  row.setDepth(900);
  return row;
};

const leaving = new WeakSet<Phaser.Scene>();

/** Fundido de salida y cambio de escena (ignora llamadas repetidas durante el fundido). */
export const goTo = (scene: Phaser.Scene, key: string, data?: object, ms = 260) => {
  if (leaving.has(scene)) return;
  leaving.add(scene);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => leaving.delete(scene));
  scene.cameras.main.fadeOut(ms, 11, 10, 14);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(key, data));
};

/** Logo PG FIGHTERS. */
export const logo = (scene: Phaser.Scene, x: number, y: number, scale = 1) => {
  const pg = text(scene, x, y + 20 * scale, 'PG', { size: 270 * scale, italic: true, weight: '900', color: CSS.cream, origin: [0.5, 1], shadow: true });
  const fighters = text(scene, x, y - 30 * scale, 'FIGHTERS', { size: 190 * scale, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0], glow: '#dfff0066' });
  return [pg, fighters];
};
