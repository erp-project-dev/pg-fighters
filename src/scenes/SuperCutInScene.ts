import Phaser from 'phaser';
import { CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import type { FighterDef } from '../data/fighters';
import { addPortrait } from '../systems/FighterArt';
import { fitText, pts, text, visibleWidth } from '../ui/ui';

export interface CutInData {
  def: FighterDef;
  side: 0 | 1;
  onDone: () => void;
}

/** Duración mínima del retrato; con frases largas dura lo necesario para escribirla y leerla. */
const MIN_DURATION = 2300;
const TYPE_DELAY = 260;
const TYPE_MS = 34;
/** Tiempo de lectura una vez escrita la frase (ms por carácter, con un mínimo). */
const READ_MS = 30;
const MIN_READ = 1300;

/**
 * Retrato del súper a pantalla completa: fondo del color del personaje con líneas de velocidad,
 * la cara en grande, el nombre del súper y la frase célebre escribiéndose.
 * Arte opcional: textura `super-cutin-<id>` (busto mirando a la derecha, fondo transparente).
 * Si no existe, se usa el retrato del atlas.
 */
export class SuperCutInScene extends Phaser.Scene {
  private data0!: CutInData;
  private lines!: Phaser.GameObjects.Graphics;
  private elapsed = 0;
  private closing = false;
  private full = '';
  private quote!: Phaser.GameObjects.Text;
  private typed = 0;
  private skipTyping = false;

  constructor() {
    super(SCENES.SuperCutIn);
  }

  init(data: CutInData) {
    this.data0 = data;
    this.elapsed = 0;
    this.closing = false;
    this.typed = 0;
    this.skipTyping = false;
  }

  create() {
    const { def, side } = this.data0;
    const left = side === 0;
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;

    // Fondo: color del personaje, viñeta y franja diagonal.
    this.add.rectangle(0, 0, W, H, def.color, 1).setOrigin(0);
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.65, 0.1, 0.65, 0.1).fillRect(0, 0, W, H);
    this.lines = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    const band = this.add.graphics();
    band.fillStyle(0x000000, 0.82).fillPoints(pts(left
      ? [{ x: W * 0.42, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: W * 0.3, y: H }]
      : [{ x: 0, y: 0 }, { x: W * 0.58, y: 0 }, { x: W * 0.7, y: H }, { x: 0, y: H }]), true);

    // Retrato
    const px = left ? W * 0.24 : W * 0.76;
    const cutin = `super-cutin-${def.id}`;
    const portrait = this.textures.exists(cutin)
      ? this.add.image(px, H, cutin).setOrigin(0.5, 1).setScale(H * 0.95 / this.textures.getFrame(cutin).realHeight).setFlipX(!left)
      : addPortrait(this, def, px, H * 0.5, H * 0.78);
    const startX = portrait.x;
    portrait.x += left ? -W * 0.5 : W * 0.5;
    this.tweens.add({ targets: portrait, x: startX, duration: 240, ease: 'Cubic.easeOut' });
    this.full = `“${def.superMove.quote}”`;
    const duration = Math.max(MIN_DURATION, TYPE_DELAY + this.full.length * TYPE_MS + Math.max(MIN_READ, this.full.length * READ_MS));
    this.tweens.add({ targets: portrait, scale: portrait.scale * 1.05, duration, ease: 'Sine.easeOut' });

    // Textos
    const tx = left ? W * 0.5 : W * 0.06;
    const tw = W * 0.44;
    const name = text(this, tx, H * 0.3, def.moves.super, { size: 120, italic: true, weight: '900', color: CSS.lime, origin: [0, 0.5], stroke: '#000000' });
    const who = text(this, tx, H * 0.3 - 100, def.name, { size: 44, weight: '800', color: def.css, origin: [0, 0.5], spacing: 6 });
    const quote = text(this, tx, H * 0.5, '', { size: 78, italic: true, weight: '900', color: CSS.white, origin: [0, 0], wrap: tw, shadow: true });
    // Nombres de súper largos: se achican; si aun así no entran, pasan a dos líneas.
    fitText(name, tw, 56);
    if (visibleWidth(name) > tw) name.setWordWrapWidth(tw, true);
    // La frase se mide completa antes de escribirse, para que quepa hasta abajo.
    quote.setText(`“${def.superMove.quote}”`);
    fitText(quote, tw, 44, H * 0.42);
    quote.setText('');
    for (const t of [name, who]) {
      t.setAlpha(0).x += left ? 120 : -120;
      this.tweens.add({ targets: t, alpha: 1, x: t.x + (left ? -120 : 120), duration: 220, delay: 120, ease: 'Cubic.easeOut' });
    }
    this.quote = quote;

    this.cameras.main.flash(160, 255, 255, 255);
    this.time.delayedCall(duration - 220, () => this.close());
    // ENTER o clic: completa la frase al instante, o pasa al solo si ya está escrita.
    const skip = () => {
      if (this.typed < this.full.length) this.skipTyping = true;
      else this.close();
    };
    this.input.keyboard!.on('keydown-ENTER', skip);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, skip);
  }

  private close(): void {
    if (this.closing) return;
    this.closing = true;
    this.cameras.main.flash(200, 255, 255, 255);
    this.time.delayedCall(140, () => {
      this.data0.onDone();
      this.scene.stop();
    });
  }

  update(_t: number, delta: number) {
    this.elapsed += delta;
    // La frase se escribe letra por letra.
    const chars = this.skipTyping ? this.full.length : Math.max(0, Math.min(this.full.length, Math.floor((this.elapsed - TYPE_DELAY) / TYPE_MS)));
    if (chars !== this.typed) {
      this.typed = chars;
      this.quote.setText(this.full.slice(0, chars));
    }
    // Líneas de velocidad hacia el retrato.
    const g = this.lines;
    const left = this.data0.side === 0;
    const cx = left ? GAME_WIDTH * 0.24 : GAME_WIDTH * 0.76;
    const cy = GAME_HEIGHT * 0.5;
    g.clear();
    for (let k = 0; k < 46; k++) {
      const a = (k / 46) * Math.PI * 2 + Math.sin(this.elapsed * 0.002 + k) * 0.05;
      const r0 = 380 + ((k * 97 + this.elapsed * 1.6) % 500);
      const r1 = r0 + 260 + (k % 5) * 70;
      g.lineStyle(k % 3 === 0 ? 10 : 4, 0xffffff, 0.16);
      g.lineBetween(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    }
  }
}
