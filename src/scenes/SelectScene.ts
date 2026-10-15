import Phaser from 'phaser';
import { COLORS, CSS, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS, ROSTER, randomOpponent, tintOf, type FighterDef, type FighterId } from '../data/fighters';
import { Audio, MUSIC } from '../systems/Audio';
import { addPortrait, artScale, bustKey } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import { Ranking } from '../systems/Ranking';
import { StoryRun } from '../systems/StoryRun';
import { footer, goTo, pts, scanlines, speedStripes, stageBackdrop, text } from '../ui/ui';

/** Roster en cuadrícula por filas (estilo Marvel vs Capcom 3): casillas inclinadas, filas alternadas. */
const SLOT = 98;
const SLOT_GAP = 12;
const SKEW = 14;
/** Dos filas: se reparten mitad y mitad según el tamaño del roster. */
const PER_ROW = Math.ceil(ROSTER.length / 2);
const ROW_Y = [850, 952];
/** Ficha del jugador (columna izquierda). */
const INFO_X = 60;
const INFO_W = 600;
/** Figuras: jugador al centro-izquierda, CPU a la derecha. */
const P1_X = 930;
const CPU_X = 1560;
const FIG_Y = 800;
/** Alto del retrato en busto en la selección. */
const BUST_H = 560;

interface Figure {
  fig: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
}

/** Selección de personaje: roster completo, ficha satírica del luchador resaltado y rival de la CPU al azar. */
export class SelectScene extends Phaser.Scene {
  private input2!: Input;
  private index = 0;
  private locked = false;
  private training = false;
  private story = false;
  private cursor!: Phaser.GameObjects.Graphics;
  private p1Fig!: Figure;
  private cpuFig!: Figure;
  private cpuMystery!: Phaser.GameObjects.Text;
  private cpuName!: Phaser.GameObjects.Text;
  private cpuTag!: Phaser.GameObjects.Text;
  private pending!: Phaser.GameObjects.Text;
  private info!: {
    number: Phaser.GameObjects.Text;
    name: Phaser.GameObjects.Text;
    tag: Phaser.GameObjects.Text;
    bio: Phaser.GameObjects.Text;
    quote: Phaser.GameObjects.Text;
    style: Phaser.GameObjects.Text;
    moves: Phaser.GameObjects.Text;
    bars: Phaser.GameObjects.Graphics;
    labels: Phaser.GameObjects.Text[];
  };

  constructor() {
    super(SCENES.Select);
  }

  create(data: { last?: FighterId; mode?: 'arcade' | 'training' | 'story' }) {
    this.training = data?.mode === 'training';
    this.story = data?.mode === 'story';
    this.locked = false;
    this.cameras.main.fadeIn(300, 11, 10, 14);
    Audio.music(this, MUSIC.menu, 0.35);
    stageBackdrop(this, 0.8);
    speedStripes(this, COLORS.lime, 0.03);
    this.input2 = new Input(this);

    text(this, GAME_WIDTH / 2, 62, 'ELIGE TU LUCHADOR', { size: 84, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true });
    text(this, GAME_WIDTH / 2, 128, this.story ? 'MODO HISTORIA  ·  LIBERA A LA ESCENA DEL ODIO' : this.training ? 'MODO ENTRENAMIENTO  ·  SIN TIEMPO NI K.O.' : 'ARCADE  ·  1 JUGADOR VS CPU  ·  MEJOR DE 3', { size: 24, weight: '700', origin: [0.5, 0.5], spacing: 5 });

    // Figuras (detrás de los textos)
    this.p1Fig = this.makeFigure(P1_X, false);
    this.cpuFig = this.makeFigure(CPU_X, true);
    this.cpuMystery = text(this, CPU_X, 520, '?', { size: 320, italic: true, weight: '900', color: '#2b2a30', origin: [0.5, 0.5] });
    text(this, (P1_X + CPU_X) / 2 + 10, 520, 'VS', { size: 120, italic: true, weight: '900', color: CSS.rust, origin: [0.5, 0.5], shadow: true });
    this.pending = text(this, P1_X, FIG_Y - 20, 'ARTE PENDIENTE', { size: 22, weight: '800', color: CSS.rust, origin: [0.5, 0.5], spacing: 3, shadow: true });

    // CPU: nombre y título arriba a la derecha
    text(this, GAME_WIDTH - 60, 200, 'CPU', { size: 26, weight: '800', color: CSS.grey, origin: [1, 0.5], spacing: 4 });
    this.cpuName = text(this, GAME_WIDTH - 60, 252, '???', { size: 64, italic: true, weight: '900', color: '#4a4942', origin: [1, 0.5], shadow: true });
    this.cpuTag = text(this, GAME_WIDTH - 60, 300, '', { size: 22, weight: '700', origin: [1, 0.5], spacing: 3 });

    // Ficha del jugador
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.bg, 0.72).fillRect(INFO_X - 24, 168, INFO_W + 48, 630);
    text(this, INFO_X, 200, '1P', { size: 26, weight: '800', color: CSS.lime, origin: [0, 0.5], spacing: 4 });
    this.info = {
      number: text(this, INFO_X + 60, 200, '', { size: 26, weight: '800', color: CSS.grey, origin: [0, 0.5], spacing: 3 }),
      name: text(this, INFO_X, 256, '', { size: 70, italic: true, weight: '900', origin: [0, 0.5], shadow: true }),
      tag: text(this, INFO_X, 310, '', { size: 24, weight: '800', origin: [0, 0.5], spacing: 3 }),
      bio: text(this, INFO_X, 340, '', { size: 23, font: 'body', weight: '500', color: '#d6d3c7', origin: [0, 0], wrap: INFO_W }).setLineSpacing(4),
      quote: text(this, INFO_X, 0, '', { size: 28, italic: true, weight: '800', color: CSS.lime, origin: [0, 0], wrap: INFO_W }),
      style: text(this, INFO_X, 0, '', { size: 21, weight: '800', origin: [0, 0], spacing: 2 }),
      moves: text(this, INFO_X, 0, '', { size: 20, font: 'body', weight: '600', color: '#cfccc0', origin: [0, 0], wrap: INFO_W }).setLineSpacing(4),
      bars: this.add.graphics(),
      labels: ['POTENCIA', 'VELOCIDAD', 'ALCANCE', 'TÉCNICA'].map((l) => text(this, 0, 0, l, { size: 17, weight: '700', color: CSS.grey, origin: [0, 0.5], spacing: 2 })),
    };

    // Roster en cuadrícula por filas
    ROSTER.forEach((id, i) => {
      const { x, y } = this.slotPos(i);
      const def = FIGHTERS[id];
      const g = this.add.graphics();
      g.fillStyle(COLORS.panel, 1).fillPoints(pts(this.tile(x, y, 0)), true);
      g.fillStyle(def.color, 0.35).fillPoints(pts(this.tile(x, y, 0)), true);
      addPortrait(this, def, x, y, SLOT - 2 * SKEW - 4);
      const frame = this.add.graphics();
      frame.lineStyle(3, def.color, 0.9).strokePoints(pts(this.tile(x, y, 0)), true);
      frame.fillStyle(0x000000, 0.8).fillRect(x - SLOT / 2 + SKEW, y + SLOT / 2 - 20, 30, 18);
      text(this, x - SLOT / 2 + SKEW + 15, y + SLOT / 2 - 11, def.number, { size: 14, weight: '800', color: def.css, origin: [0.5, 0.5] });
      const zone = this.add.zone(x, y, SLOT, SLOT).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.pick(i));
      zone.on('pointerdown', () => {
        this.pick(i);
        this.confirm();
      });
    });
    this.cursor = this.add.graphics().setDepth(5);

    const start = data?.last ? ROSTER.indexOf(data.last) : 0;
    this.pick(Math.max(0, start), true);
    this.hideCpu();
    footer(this, '← → ↑ ↓  ELEGIR      ENTER  CONFIRMAR      ESC  VOLVER');
    scanlines(this, 0.06);
  }

  /** Fila y columna de cada casilla: filas de PER_ROW, centradas; la fila de abajo queda corrida media casilla. */
  private slotPos(i: number): { x: number; y: number; row: number } {
    const row = Math.floor(i / PER_ROW);
    const count = Math.min(PER_ROW, ROSTER.length - row * PER_ROW);
    const col = i - row * PER_ROW;
    const x = GAME_WIDTH / 2 + (col - (count - 1) / 2) * (SLOT + SLOT_GAP);
    return { x, y: ROW_Y[row] ?? ROW_Y[0] + row * (SLOT + 6), row };
  }

  /** Casilla inclinada (paralelogramo) centrada en (x, y), agrandada `pad` px. */
  private tile(x: number, y: number, pad: number): { x: number; y: number }[] {
    const h = SLOT / 2 + pad;
    return [
      { x: x - h + SKEW, y: y - h }, { x: x + h + SKEW, y: y - h },
      { x: x + h - SKEW, y: y + h }, { x: x - h - SKEW, y: y + h },
    ];
  }

  private makeFigure(x: number, flip: boolean): Figure {
    const def = FIGHTERS.mayin;
    const glow = this.add.image(x, FIG_Y, def.art.texture, `${def.art.prefix}idle`).setFlipX(flip);
    glow.setTintMode(Phaser.TintModes.FILL).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
    const fig = this.add.image(x, FIG_Y, def.art.texture, `${def.art.prefix}idle`).setFlipX(flip);
    return { fig, glow };
  }

  /** Retrato en busto (los retratos miran a la derecha; el de la CPU se voltea) o, sin retrato, la guardia de cuerpo entero. */
  private showFigure(f: Figure, def: FighterDef, flip: boolean, hidden = false): void {
    const bust = bustKey(this, def);
    for (const img of [f.fig, f.glow]) {
      const k = img === f.glow ? 1.03 : 1;
      if (bust) {
        img.setTexture(bust).setOrigin(0.5, 1);
        img.setScale((BUST_H / img.frame.realHeight) * k);
      } else {
        img.setTexture(def.art.texture, `${def.art.prefix}idle`).setScale(artScale(this, def) * 1.1 * k);
      }
      img.setFlipX(flip);
    }
    f.glow.setTint(def.color).setVisible(!hidden);
    f.fig.setTint(hidden ? 0x000000 : tintOf(def)).setAlpha(hidden ? 0.7 : 1);
  }

  /** Ficha del luchador resaltado: se actualiza al moverse por el roster. */
  private showInfo(def: FighterDef): void {
    const i = this.info;
    i.number.setText(`Nº ${def.number}`);
    i.name.setText(def.name);
    i.tag.setText(def.tag).setColor(def.css);
    i.bio.setText(def.bio);
    let y = i.bio.y + i.bio.height - (i.bio.padding.top ?? 0) * 2 + 14;
    i.quote.setText(`«${def.quote}»`).setY(y);
    y += i.quote.height - (i.quote.padding.top ?? 0) * 2 + 12;
    i.style.setText(`ESTILO: ${def.style}`).setColor(def.css).setY(y);
    y += 34;
    i.moves.setText(`PODER: ${def.moves.special}  ·  ↓↘→ + P\nULTIMATE: ${def.moves.super}  ·  E`).setY(y);
    y += i.moves.height - (i.moves.padding.top ?? 0) * 2 + 18;

    const g = i.bars;
    g.clear();
    const stats = [def.rating.potencia, def.rating.velocidad, def.rating.alcance, def.rating.tecnica];
    stats.forEach((v, k) => {
      const bx = INFO_X + (k % 2) * 300;
      const by = y + Math.floor(k / 2) * 30;
      for (let s = 0; s < 5; s++) g.fillStyle(s < v ? def.color : 0x2a2930, 1).fillRect(bx + s * 24, by, 20, 12);
      i.labels[k].setPosition(bx + 5 * 24 + 4, by + 6);
    });
  }

  private hideCpu(): void {
    this.showFigure(this.cpuFig, FIGHTERS.erp, true, true);
    this.cpuFig.glow.setVisible(false);
    this.cpuMystery.setVisible(true);
    this.cpuName.setText('???').setColor('#4a4942');
    this.cpuTag.setText('');
  }

  private pick(i: number, silent = false): void {
    if (this.locked) return;
    if (i !== this.index && !silent) Audio.blip(this);
    this.index = i;
    const def = FIGHTERS[ROSTER[i]];
    this.showFigure(this.p1Fig, def, false);
    this.showInfo(def);
    this.pending.setVisible(!!def.art.placeholder && !bustKey(this, def));
    this.p1Fig.fig.setX(P1_X - 40);
    this.tweens.add({ targets: [this.p1Fig.fig, this.p1Fig.glow], x: P1_X, duration: 160, ease: 'Cubic.easeOut' });

    const { x, y } = this.slotPos(i);
    const g = this.cursor;
    g.clear();
    g.lineStyle(6, COLORS.lime, 1).strokePoints(pts(this.tile(x, y, 5)), true);
    // Etiqueta 1P al costado izquierdo (arriba taparía la otra fila).
    g.fillStyle(COLORS.lime, 1).fillRect(x - SLOT / 2 - SKEW - 52, y - 14, 44, 28);
    this.children.getByName('cursor-label')?.destroy();
    text(this, x - SLOT / 2 - SKEW - 30, y, '1P', { size: 22, weight: '900', color: CSS.dark, origin: [0.5, 0.5] }).setName('cursor-label').setDepth(6);
  }

  private move(dir: number): void {
    this.pick((this.index + dir + ROSTER.length) % ROSTER.length);
  }

  /** ↑ ↓: salta a la casilla más cercana de la otra fila. */
  private moveRow(dir: number): void {
    const rows = Math.ceil(ROSTER.length / PER_ROW);
    const cur = this.slotPos(this.index);
    const target = (cur.row + dir + rows) % rows;
    let best = this.index;
    let bestDx = Infinity;
    ROSTER.forEach((_, i) => {
      const p = this.slotPos(i);
      if (p.row === target && Math.abs(p.x - cur.x) < bestDx) {
        bestDx = Math.abs(p.x - cur.x);
        best = i;
      }
    });
    this.pick(best);
  }

  private confirm(): void {
    if (this.locked) return;
    this.locked = true;
    const p1 = ROSTER[this.index];
    if (this.story) {
      // Historia: sin rival al azar (la cuenta y el nickname ya se eligieron antes); empieza el prólogo.
      StoryRun.start(p1, Ranking.savedName);
      Audio.tone(this, 660, 0.25, 'sawtooth', 0.06);
      this.cameras.main.flash(180, 223, 255, 0);
      this.tweens.add({ targets: this.p1Fig.fig, scale: this.p1Fig.fig.scale * 1.06, duration: 120, yoyo: true });
      this.time.delayedCall(700, () => goTo(this, SCENES.Story, { mode: 'prologue' }, 400));
      return;
    }
    const p2 = randomOpponent(p1);
    const cpu = FIGHTERS[p2];
    Audio.tone(this, 660, 0.25, 'sawtooth', 0.06);
    this.cameras.main.flash(180, 223, 255, 0);
    this.tweens.add({ targets: this.p1Fig.fig, scale: this.p1Fig.fig.scale * 1.06, duration: 120, yoyo: true });
    // Revela al rival de la CPU (al azar).
    this.time.delayedCall(350, () => {
      this.cpuMystery.setVisible(false);
      this.showFigure(this.cpuFig, cpu, true);
      this.cpuName.setText(cpu.name).setColor(CSS.cream);
      this.cpuTag.setText(cpu.tag).setColor(cpu.css);
      this.cpuFig.fig.setX(CPU_X + 60);
      this.tweens.add({ targets: [this.cpuFig.fig, this.cpuFig.glow], x: CPU_X, duration: 200, ease: 'Cubic.easeOut' });
      Audio.tone(this, 220, 0.3, 'sawtooth', 0.06);
    });
    this.time.delayedCall(1500, () => goTo(this, SCENES.StageSelect, { p1, p2, training: this.training }, 300));
  }

  update() {
    const i = this.input2;
    if (this.locked) return;
    if (i.justDown('left')) this.move(-1);
    if (i.justDown('right')) this.move(1);
    if (i.justDown('up')) this.moveRow(-1);
    if (i.justDown('down')) this.moveRow(1);
    if (i.justDown('confirm')) this.confirm();
    if (i.justDown('back')) goTo(this, SCENES.Title, { skipPress: true });
  }
}
