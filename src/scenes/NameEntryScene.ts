import Phaser from 'phaser';
import { COLORS, CSS, GAME_WIDTH, SCENES } from '../config';
import { Audio } from '../systems/Audio';
import { NAME_MAX, Ranking } from '../systems/Ranking';
import { footer, goTo, logo, scanlines, speedStripes, stageBackdrop, text } from '../ui/ui';

const ALLOWED = /^[A-Z0-9ÑÁÉÍÓÚÜ .\-_]$/;

const clean = (s: string) => s.toUpperCase().split('').filter((c) => ALLOWED.test(c)).join('').trim().slice(0, NAME_MAX);

/** Historia, después de conectar: el nickname con el que sales en el ranking (se recuerda el último). */
export class NameEntryScene extends Phaser.Scene {
  private name = '';
  private field!: Phaser.GameObjects.Text;
  private warn!: Phaser.GameObjects.Text;
  private leaving = false;

  constructor() {
    super(SCENES.NameEntry);
  }

  init() {
    this.name = clean(Ranking.savedName);
    this.leaving = false;
  }

  create() {
    this.cameras.main.fadeIn(300, 11, 10, 14);
    stageBackdrop(this, 0.8);
    speedStripes(this, COLORS.lime, 0.03);
    const cx = GAME_WIDTH / 2;

    logo(this, cx, 300, 0.7);
    text(this, cx, 470, 'TU NICKNAME', { size: 72, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true });
    text(this, cx, 535, 'Así sales en el ranking', { size: 28, weight: '700', color: CSS.grey, origin: [0.5, 0.5], spacing: 2 });

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.75).fillRect(cx - 520, 600, 1040, 160);
    g.lineStyle(4, COLORS.lime, 1).strokeRect(cx - 520, 600, 1040, 160);
    this.field = text(this, cx, 680, '', { size: 104, italic: true, weight: '900', color: CSS.cream, origin: [0.5, 0.5], spacing: 6 });
    this.warn = text(this, cx, 810, `Hasta ${NAME_MAX} letras o números`, { size: 26, weight: '700', color: CSS.grey, origin: [0.5, 0.5], spacing: 2 });
    footer(this, 'A-Z  ESCRIBIR      BACKSPACE  BORRAR      ENTER  CONTINUAR      ESC  MENÚ');
    scanlines(this, 0.06);
    this.refresh();
    this.time.addEvent({ delay: 450, loop: true, callback: () => this.refresh() });

    const onKey = (e: KeyboardEvent) => this.key(e);
    window.addEventListener('keydown', onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', onKey));
  }

  private refresh(): void {
    const cursor = this.name.length < NAME_MAX && Math.floor(this.time.now / 450) % 2 === 0 ? '_' : ' ';
    this.field.setText(this.name + cursor);
  }

  private key(e: KeyboardEvent): void {
    if (this.leaving) return;
    if (e.key === 'Enter') return this.confirm();
    if (e.key === 'Escape') return this.leave(SCENES.Title, { skipPress: true });
    if (e.key === 'Backspace') {
      e.preventDefault();
      this.name = this.name.slice(0, -1);
    } else {
      const ch = e.key.toUpperCase();
      if (ch.length !== 1 || !ALLOWED.test(ch) || this.name.length >= NAME_MAX) return;
      if (ch === ' ' && (!this.name || this.name.endsWith(' '))) return;
      this.name += ch;
    }
    Audio.blip(this);
    this.refresh();
  }

  private leave(key: string, data?: object): void {
    this.leaving = true;
    Audio.blip(this, true);
    goTo(this, key, data);
  }

  private confirm(): void {
    const name = this.name.trim();
    if (!name) {
      this.warn.setText('Escribe un nickname').setColor(CSS.red);
      this.cameras.main.shake(120, 0.004);
      return;
    }
    Ranking.savedName = name;
    this.leave(SCENES.Select, { mode: 'story' });
  }
}
