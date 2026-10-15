import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import type { FighterId } from '../data/fighters';
import { STAGES, STAGE_ORDER, type StageId } from '../data/stages';
import { Audio, MUSIC } from '../systems/Audio';
import type { Difficulty } from '../systems/Settings';
import { Input } from '../systems/Input';
import { buildStage, hasStageArt } from '../systems/StageArt';
import { fitText, footer, goTo, scanlines, text } from '../ui/ui';

export interface StageSelectData {
  p1: FighterId;
  p2: FighterId;
  training?: boolean;
  /** Dificultad elegida para la CPU (arcade). */
  difficulty?: Difficulty;
  last?: StageId;
}

const CARD_W = 206;
const CARD_H = 116;
const CARD_GAP = 14;
/** Dos filas de tarjetas (escenarios + aleatorio), mitad y mitad. */
const PER_ROW = Math.ceil((STAGE_ORDER.length + 1) / 2);
const ROW_Y = [760, 760 + CARD_H + CARD_GAP];
/** Última opción: escenario al azar. */
const RANDOM = 'random';
type Option = StageId | typeof RANDOM;

/** Elegir escenario: el fondo del escenario resaltado ocupa la pantalla y abajo están las tarjetas. */
export class StageSelectScene extends Phaser.Scene {
  private input2!: Input;
  private data0!: StageSelectData;
  private options: Option[] = [...STAGE_ORDER, RANDOM];
  private index = 0;
  private locked = false;
  private preview: Phaser.GameObjects.Container | null = null;
  private shade!: Phaser.GameObjects.Rectangle;
  private cursor!: Phaser.GameObjects.Graphics;
  private name!: Phaser.GameObjects.Text;
  private place!: Phaser.GameObjects.Text;
  private number!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.StageSelect);
  }

  create(data: StageSelectData) {
    this.data0 = data;
    this.locked = false;
    this.preview = null;
    this.cameras.main.fadeIn(250, 11, 10, 14);
    Audio.music(this, MUSIC.menu, 0.35);
    this.input2 = new Input(this);

    this.shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg, 0.35).setOrigin(0).setDepth(1);
    const top = this.add.graphics().setDepth(2);
    top.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.85, 0.85, 0, 0).fillRect(0, 0, GAME_WIDTH, 360);
    top.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.9, 0.9).fillRect(0, 560, GAME_WIDTH, GAME_HEIGHT - 560);
    text(this, GAME_WIDTH / 2, 70, 'ELIGE ESCENARIO', { size: 92, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true }).setDepth(3);
    this.number = text(this, 80, 300, '', { size: 34, weight: '800', origin: [0, 0.5], spacing: 6 }).setDepth(3);
    this.name = text(this, 80, 380, '', { size: 120, italic: true, weight: '900', origin: [0, 0.5], stroke: '#000000' }).setDepth(3);
    this.place = text(this, 80, 470, '', { size: 34, weight: '700', origin: [0, 0.5], spacing: 5, shadow: true }).setDepth(3);

    this.options.forEach((opt, i) => {
      const { x, y: cardY } = this.slotPos(i);
      const left = x - CARD_W / 2;
      const topY = cardY - CARD_H / 2;
      const frame = this.add.graphics().setDepth(3);
      frame.fillStyle(COLORS.panel, 1).fillRect(left, topY, CARD_W, CARD_H);
      if (opt === RANDOM) {
        text(this, x, cardY - 12, '?', { size: 90, italic: true, weight: '900', color: '#3a3940', origin: [0.5, 0.5] }).setDepth(4);
      } else {
        const stage = STAGES[opt];
        // Miniatura: el escenario completo a escala (misma proporción 16:9 que la tarjeta).
        buildStage(this, stage, false).setDepth(4).setScale(CARD_W / GAME_WIDTH).setPosition(left, topY);
        if (!hasStageArt(this, stage)) {
          const b = this.add.graphics().setDepth(5);
          b.fillStyle(0x000000, 0.75).fillRect(left + CARD_W - 92, topY + 6, 86, 22);
          text(this, left + CARD_W - 49, topY + 17, 'SIN ARTE', { size: 14, weight: '800', color: CSS.rust, origin: [0.5, 0.5], spacing: 2 }).setDepth(6);
        }
      }
      const band = this.add.graphics().setDepth(5);
      band.fillStyle(0x000000, 0.8).fillRect(left, topY + CARD_H - 32, CARD_W, 32);
      const label = opt === RANDOM ? 'ALEATORIO' : STAGES[opt].name;
      fitText(text(this, x, topY + CARD_H - 16, label, { size: 18, weight: '800', origin: [0.5, 0.5], spacing: 1 }).setDepth(6), CARD_W - 14, 11);
      const zone = this.add.zone(x, cardY, CARD_W, CARD_H).setInteractive({ useHandCursor: true }).setDepth(7);
      zone.on('pointerover', () => this.pick(i));
      zone.on('pointerdown', () => {
        this.pick(i);
        this.confirm();
      });
    });
    this.cursor = this.add.graphics().setDepth(8);

    const start = data.last ? this.options.indexOf(data.last) : 0;
    this.pick(Math.max(0, start), true);
    footer(this, 'W A S D  ELEGIR      ENTER  CONFIRMAR      ESC  VOLVER').setDepth(900);
    scanlines(this, 0.05);
  }

  private pick(i: number, silent = false): void {
    if (this.locked) return;
    if (i !== this.index && !silent) Audio.blip(this);
    this.index = i;
    const opt = this.options[i];

    if (this.preview) {
      this.tweens.killTweensOf(this.preview.list);
      this.preview.destroy();
    }
    this.preview = null;
    if (opt === RANDOM) {
      this.number.setText('STAGE ??').setColor(CSS.grey);
      this.name.setText('ALEATORIO').setColor(CSS.cream).setFontSize(120);
      this.place.setText('QUE DECIDA LA CALLE').setColor(CSS.grey);
    } else {
      const s = STAGES[opt];
      this.preview = buildStage(this, s).setDepth(0).setAlpha(0);
      this.tweens.add({ targets: this.preview, alpha: 1, duration: 200 });
      this.number.setText(`STAGE ${s.number}`).setColor(s.css);
      this.name.setText(s.name).setColor(CSS.cream).setFontSize(120);
      fitText(this.name, GAME_WIDTH - 160, 60);
      this.place.setText(s.place).setColor(s.css);
    }

    const { x, y } = this.slotPos(i);
    this.cursor.clear();
    this.cursor.lineStyle(6, COLORS.lime, 1).strokeRect(x - CARD_W / 2 - 5, y - CARD_H / 2 - 5, CARD_W + 10, CARD_H + 10);
  }

  /** Centro de la tarjeta `i`: filas de PER_ROW centradas (la de abajo puede tener una menos). */
  private slotPos(i: number): { x: number; y: number; row: number } {
    const row = Math.floor(i / PER_ROW);
    const count = Math.min(PER_ROW, this.options.length - row * PER_ROW);
    const col = i - row * PER_ROW;
    return { x: GAME_WIDTH / 2 + (col - (count - 1) / 2) * (CARD_W + CARD_GAP), y: ROW_Y[row], row };
  }

  /** W S: salta a la tarjeta más cercana de la otra fila. */
  private moveRow(): void {
    const cur = this.slotPos(this.index);
    let best = this.index;
    let bestDx = Infinity;
    this.options.forEach((_, i) => {
      const p = this.slotPos(i);
      if (p.row !== cur.row && Math.abs(p.x - cur.x) < bestDx) {
        bestDx = Math.abs(p.x - cur.x);
        best = i;
      }
    });
    this.pick(best);
  }

  private move(dir: number): void {
    this.pick((this.index + dir + this.options.length) % this.options.length);
  }

  private confirm(): void {
    if (this.locked) return;
    this.locked = true;
    const opt = this.options[this.index];
    const stage: StageId = opt === RANDOM ? Phaser.Utils.Array.GetRandom(STAGE_ORDER) : opt;
    Audio.tone(this, 660, 0.25, 'sawtooth', 0.06);
    this.cameras.main.flash(180, 223, 255, 0);
    if (opt === RANDOM) {
      // Muestra cuál tocó antes de salir.
      this.index = STAGE_ORDER.indexOf(stage);
      this.locked = false;
      this.pick(this.index, true);
      this.locked = true;
    }
    const { p1, p2, training, difficulty } = this.data0;
    this.time.delayedCall(700, () => goTo(this, training ? SCENES.Fight : SCENES.Versus, { p1, p2, stage, training, difficulty }, 300));
  }

  update() {
    if (this.locked) return;
    const i = this.input2;
    if (i.justDown('left')) this.move(-1);
    if (i.justDown('right')) this.move(1);
    if (i.justDown('up') || i.justDown('down')) this.moveRow();
    if (i.justDown('confirm')) this.confirm();
    if (i.justDown('back')) goTo(this, SCENES.Select, { last: this.data0.p1, mode: this.data0.training ? 'training' : 'arcade' });
  }
}
