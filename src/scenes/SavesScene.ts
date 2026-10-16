import Phaser from 'phaser';
import { COLORS, CSS, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS } from '../data/fighters';
import { Audio, MUSIC } from '../systems/Audio';
import { addPortrait } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import { levelLabel } from '../systems/Ranking';
import { SAVE_SLOTS, StoryRun, isDone, type StoryState } from '../systems/StoryRun';
import { fitText, footer, goTo, scanlines, speedStripes, stageBackdrop, text } from '../ui/ui';

const CARD_W = 500;
const CARD_H = 560;
const CARD_GAP = 50;
const CARD_Y = 560;
const cardX = (i: number) => GAME_WIDTH / 2 + (i - (SAVE_SLOTS - 1) / 2) * (CARD_W + CARD_GAP);

type Action = 'resume' | 'restart' | 'delete';
const LABEL: Record<Action, string> = { resume: 'CONTINUAR', restart: 'REINICIAR', delete: 'ELIMINAR' };

/** Partidas guardadas (como los espacios de un juego clásico): hasta SAVE_SLOTS historias, cada una con su personaje. */
export class SavesScene extends Phaser.Scene {
  private input2!: Input;
  private runs: StoryState[] = [];
  private slot = 0;
  private action = 0;
  private cards: Phaser.GameObjects.Graphics[] = [];
  private actions: Phaser.GameObjects.Text[][] = [];
  /** Confirmación de reiniciar o eliminar. */
  private ask: { box: Phaser.GameObjects.Container; items: Phaser.GameObjects.Text[]; index: number; action: Action } | null = null;
  private leaving = false;

  constructor() {
    super(SCENES.Saves);
  }

  create() {
    this.leaving = false;
    this.ask = null;
    this.cards = [];
    this.actions = [];
    this.runs = StoryRun.saved;
    this.slot = 0;
    this.action = 0;
    this.cameras.main.fadeIn(300, 11, 10, 14);
    Audio.music(this, MUSIC.menu, 0.35);
    stageBackdrop(this, 0.84);
    speedStripes(this, COLORS.lime, 0.03);
    this.input2 = new Input(this);
    text(this, GAME_WIDTH / 2, 110, 'PARTIDAS GUARDADAS', { size: 96, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true });
    text(this, GAME_WIDTH / 2, 185, `MODO HISTORIA  ·  ${this.runs.length}/${SAVE_SLOTS} ESPACIOS`, { size: 28, weight: '800', color: CSS.cream, origin: [0.5, 0.5], spacing: 6 });

    for (let i = 0; i < SAVE_SLOTS; i++) this.drawCard(i);
    footer(this, 'A D  PARTIDA      W S  ACCIÓN      ENTER  CONFIRMAR      ESC  VOLVER');
    scanlines(this, 0.06);
    this.refresh();
  }

  private optionsOf(r: StoryState): Action[] {
    return isDone(r) ? ['restart', 'delete'] : ['resume', 'restart', 'delete'];
  }

  private drawCard(i: number): void {
    const x = cardX(i);
    const top = CARD_Y - CARD_H / 2;
    const g = this.add.graphics();
    this.cards.push(g);
    text(this, x, top + 36, `ESPACIO ${i + 1}`, { size: 24, weight: '900', color: CSS.grey, origin: [0.5, 0.5], spacing: 4 });
    const r = this.runs[i];
    if (!r) {
      text(this, x, CARD_Y, 'VACÍO', { size: 56, italic: true, weight: '900', color: CSS.grey, origin: [0.5, 0.5] }).setAlpha(0.6);
      this.actions.push([]);
      return;
    }
    const def = FIGHTERS[r.player];
    addPortrait(this, def, x, top + 160, 180);
    fitText(text(this, x, top + 285, def.name, { size: 48, italic: true, weight: '900', color: def.css, origin: [0.5, 0.5] }), CARD_W - 40, 24);
    const done = isDone(r);
    text(this, x, top + 330, done ? 'COMPLETADO' : levelLabel({ level: r.index, total: r.rivals.length + 1 }), { size: 24, weight: '800', color: done ? '#4dff88' : CSS.cream, origin: [0.5, 0.5], spacing: 3 });
    text(this, x, top + 370, `${r.score.toLocaleString('es-PE')} PTS`, { size: 34, weight: '900', color: CSS.lime, origin: [0.5, 0.5] });
    const zone = this.add.zone(x, CARD_Y, CARD_W, CARD_H).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => this.pickSlot(i));
    const items = this.optionsOf(r).map((a, k) => {
      const t = text(this, x, top + 430 + k * 50, LABEL[a], { size: 34, italic: true, weight: '900', origin: [0.5, 0.5] });
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => {
        this.pickSlot(i);
        this.pickAction(k);
      });
      t.on('pointerdown', () => {
        this.pickSlot(i);
        this.pickAction(k);
        this.confirm();
      });
      return t;
    });
    this.actions.push(items);
  }

  private refresh(): void {
    this.cards.forEach((g, i) => {
      const on = i === this.slot && !!this.runs[i];
      const x = cardX(i) - CARD_W / 2;
      g.clear();
      g.fillStyle(on ? 0x2c3300 : 0x000000, on ? 0.85 : 0.6).fillRect(x, CARD_Y - CARD_H / 2, CARD_W, CARD_H);
      g.lineStyle(on ? 4 : 2, on ? COLORS.lime : COLORS.grey, on ? 1 : 0.5).strokeRect(x, CARD_Y - CARD_H / 2, CARD_W, CARD_H);
    });
    this.actions.forEach((items, i) =>
      items.forEach((t, k) => {
        const on = i === this.slot && k === this.action;
        t.setColor(on ? CSS.lime : i === this.slot ? CSS.cream : CSS.grey).setScale(on ? 1.1 : 1);
      }),
    );
  }

  private pickSlot(i: number): void {
    if (this.ask || i === this.slot || !this.runs[i]) return;
    Audio.blip(this);
    this.slot = i;
    this.action = Math.min(this.action, this.actions[i].length - 1);
    this.refresh();
  }

  private pickAction(k: number): void {
    if (this.ask || k === this.action) return;
    Audio.blip(this);
    this.action = k;
    this.refresh();
  }

  private confirm(): void {
    const r = this.runs[this.slot];
    if (!r || this.ask) return;
    const action = this.optionsOf(r)[this.action];
    if (action === 'resume') {
      this.leaving = true;
      Audio.blip(this, true);
      StoryRun.resume(r.player);
      goTo(this, SCENES.StoryProgress, {});
      return;
    }
    this.openAsk(action, r);
  }

  /** ¿Seguro? Reiniciar vuelve a cero su puntaje del ranking; eliminar lo quita. */
  private openAsk(action: Action, r: StoryState): void {
    Audio.blip(this, true);
    const name = FIGHTERS[r.player].name;
    const cx = GAME_WIDTH / 2;
    const cy = 540;
    const box = this.add.container(0, 0).setDepth(20);
    box.add(this.add.rectangle(0, 0, GAME_WIDTH, 2000, 0x000000, 0.6).setOrigin(0).setInteractive());
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.bg, 0.96).fillRect(cx - 460, cy - 220, 920, 440);
    panel.lineStyle(4, COLORS.red, 1).strokeRect(cx - 460, cy - 220, 920, 440);
    box.add(panel);
    const title = action === 'restart' ? `¿REINICIAR ${name}?` : `¿ELIMINAR ${name}?`;
    box.add(fitText(text(this, cx, cy - 150, title, { size: 64, italic: true, weight: '900', color: CSS.red, origin: [0.5, 0.5], shadow: true }), 860, 30));
    const note = action === 'restart'
      ? 'LA HISTORIA EMPIEZA DE CERO Y SU PUNTAJE EN EL RANKING VUELVE A 0'
      : 'LA HISTORIA SE BORRA Y DESAPARECE DEL RANKING';
    box.add(fitText(text(this, cx, cy - 80, note, { size: 22, weight: '800', color: CSS.cream, origin: [0.5, 0.5], spacing: 2 }), 860, 14));
    const items = [action === 'restart' ? 'REINICIAR' : 'ELIMINAR', 'CANCELAR'].map((label, k) => {
      const t = text(this, cx, cy + 20 + k * 90, label, { size: 50, italic: true, weight: '900', origin: [0.5, 0.5] });
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => this.pickAsk(k));
      t.on('pointerdown', () => {
        this.pickAsk(k);
        this.confirmAsk();
      });
      box.add(t);
      return t;
    });
    this.ask = { box, items, index: 1, action };
    this.pickAsk(1, true);
  }

  private pickAsk(k: number, silent = false): void {
    const a = this.ask;
    if (!a) return;
    if (k !== a.index && !silent) Audio.blip(this);
    a.index = k;
    a.items.forEach((t, j) => t.setColor(j === k ? (k === 0 ? CSS.red : CSS.lime) : CSS.cream).setScale(j === k ? 1.08 : 1));
  }

  private confirmAsk(): void {
    const a = this.ask;
    if (!a) return;
    const r = this.runs[this.slot];
    if (a.index === 1) return this.closeAsk();
    Audio.blip(this, true);
    if (a.action === 'restart') {
      this.leaving = true;
      StoryRun.start(r.player);
      goTo(this, SCENES.Story, { mode: 'prologue' }, 400);
      return;
    }
    StoryRun.remove(r.player);
    // Sin partidas, vuelve al menú; si quedan, se redibuja.
    if (!StoryRun.saved.length) {
      this.leaving = true;
      goTo(this, SCENES.Title, { skipPress: true });
    } else this.scene.restart();
  }

  private closeAsk(): void {
    this.ask?.box.destroy();
    this.ask = null;
    Audio.blip(this);
  }

  update() {
    const i = this.input2;
    if (this.leaving) return;
    if (this.ask) {
      if (i.justDown('up') || i.justDown('down') || i.justDown('left') || i.justDown('right')) this.pickAsk(1 - this.ask.index);
      if (i.justDown('confirm')) this.confirmAsk();
      if (i.justDown('back')) this.closeAsk();
      return;
    }
    if (i.justDown('back')) {
      this.leaving = true;
      Audio.blip(this, true);
      goTo(this, SCENES.Title, { skipPress: true });
      return;
    }
    const n = this.runs.length;
    if (i.justDown('left')) this.pickSlot((this.slot - 1 + n) % n);
    if (i.justDown('right')) this.pickSlot((this.slot + 1) % n);
    const m = this.actions[this.slot]?.length ?? 0;
    if (m && i.justDown('up')) this.pickAction((this.action - 1 + m) % m);
    if (m && i.justDown('down')) this.pickAction((this.action + 1) % m);
    if (i.justDown('confirm')) this.confirm();
  }
}
