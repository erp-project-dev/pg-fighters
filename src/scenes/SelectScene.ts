import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS, ROSTER, tintOf, type FighterDef, type FighterId } from '../data/fighters';
import { Audio, MUSIC } from '../systems/Audio';
import { addPortrait, artScale, bustKey } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import { levelLabel } from '../systems/Ranking';
import { DIFFICULTY_LABEL, Settings, type Difficulty } from '../systems/Settings';
import { StoryRun } from '../systems/StoryRun';
import { footer, goTo, pts, scanlines, speedStripes, stageBackdrop, text } from '../ui/ui';

/** Roster en cuadrícula por filas (estilo Marvel vs Capcom 3): casillas inclinadas, filas alternadas. */
const SLOT = 98;
const SLOT_GAP = 12;
const SKEW = 14;
/** Última casilla: rival al azar (solo al elegir el rival de la CPU). */
const RANDOM = 'random';
type Slot = FighterId | typeof RANDOM;
const SLOTS: Slot[] = [...ROSTER, RANDOM];
/** Dos filas: se reparten mitad y mitad según el tamaño del roster. */
const PER_ROW = Math.ceil(SLOTS.length / 2);
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
const DIFFICULTIES: { id: Difficulty; note: string }[] = [
  { id: 'easy', note: 'PARA CALENTAR LOS DEDOS' },
  { id: 'normal', note: 'PELEA PAREJA' },
  { id: 'hard', note: 'SIN PIEDAD' },
];

/** Fases de la selección: tu luchador, el rival de la CPU y la dificultad (historia: continuar o empezar de nuevo). */
type Phase = 'p1' | 'cpu' | 'difficulty' | 'run';

/** Último rival que tocó al azar, para no repetirlo en la siguiente pelea. */
let lastRandom: FighterId | null = null;

interface Figure {
  fig: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
}

/** Selección de personaje: roster completo, ficha satírica del luchador resaltado, rival de la CPU (elegido o al azar) y dificultad. */
export class SelectScene extends Phaser.Scene {
  private input2!: Input;
  private index = 0;
  private locked = false;
  private phase: Phase = 'p1';
  private p1: FighterId = ROSTER[0];
  private p2: FighterId = ROSTER[1];
  private title!: Phaser.GameObjects.Text;
  private footerRow: Phaser.GameObjects.Container | null = null;
  private dims: Phaser.GameObjects.Graphics[] = [];
  private p1Mark!: Phaser.GameObjects.Graphics;
  private diff: { box: Phaser.GameObjects.Container; items: Phaser.GameObjects.Text[]; marker: Phaser.GameObjects.Graphics; index: number } | null = null;
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
    this.phase = 'p1';
    this.dims = [];
    this.diff = null;
    this.footerRow = null;
    this.cameras.main.fadeIn(300, 11, 10, 14);
    Audio.music(this, MUSIC.menu, 0.35);
    stageBackdrop(this, 0.8);
    speedStripes(this, COLORS.lime, 0.03);
    this.input2 = new Input(this);

    this.title = text(this, GAME_WIDTH / 2, 62, 'ELIGE TU LUCHADOR', { size: 84, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true });
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
    SLOTS.forEach((id, i) => {
      const { x, y } = this.slotPos(i);
      const g = this.add.graphics();
      g.fillStyle(COLORS.panel, 1).fillPoints(pts(this.tile(x, y, 0)), true);
      const frame = this.add.graphics();
      if (id === RANDOM) {
        text(this, x, y, '?', { size: 70, italic: true, weight: '900', color: CSS.grey, origin: [0.5, 0.5] });
        frame.lineStyle(3, COLORS.grey, 0.9).strokePoints(pts(this.tile(x, y, 0)), true);
      } else {
        const def = FIGHTERS[id];
        g.fillStyle(def.color, 0.35).fillPoints(pts(this.tile(x, y, 0)), true);
        addPortrait(this, def, x, y, SLOT - 2 * SKEW - 4);
        frame.lineStyle(3, def.color, 0.9).strokePoints(pts(this.tile(x, y, 0)), true);
        frame.fillStyle(0x000000, 0.8).fillRect(x - SLOT / 2 + SKEW, y + SLOT / 2 - 20, 30, 18);
        text(this, x - SLOT / 2 + SKEW + 15, y + SLOT / 2 - 11, def.number, { size: 14, weight: '800', color: def.css, origin: [0.5, 0.5] });
        // Historia: el personaje de la partida guardada muestra en qué pelea va.
        const run = this.story && StoryRun.run?.player === id ? StoryRun.run : undefined;
        if (run) {
          const tag = levelLabel({ level: run.index, total: run.rivals.length + 1 }).replace('PELEA ', '');
          frame.fillStyle(COLORS.lime, 1).fillRect(x - 24, y - SLOT / 2, 48 + SKEW, 20);
          text(this, x + SKEW / 2, y - SLOT / 2 + 10, tag, { size: 14, weight: '900', color: CSS.dark, origin: [0.5, 0.5] }).setDepth(3);
        }
      }
      // Velo para las casillas que no se pueden elegir en la fase actual.
      const dim = this.add.graphics().setDepth(2);
      dim.fillStyle(0x000000, 0.7).fillPoints(pts(this.tile(x, y, 0)), true);
      this.dims.push(dim);
      const zone = this.add.zone(x, y, SLOT, SLOT).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => {
        if (!this.disabled(i)) this.pick(i);
      });
      zone.on('pointerdown', () => {
        if (this.disabled(i)) return;
        this.pick(i);
        this.confirm();
      });
    });
    this.p1Mark = this.add.graphics().setDepth(5);
    this.cursor = this.add.graphics().setDepth(5);

    const start = data?.last ? ROSTER.indexOf(data.last) : 0;
    this.refreshDims();
    this.pick(Math.max(0, start), true);
    this.hideCpu();
    this.setFooter();
    scanlines(this, 0.06);
  }

  /**
   * Casilla que no se puede elegir: el aleatorio al elegir tu luchador;
   * tu propio luchador al elegir el rival.
   */
  private disabled(i: number): boolean {
    const slot = SLOTS[i];
    if (this.phase !== 'p1') return slot === this.p1;
    return slot === RANDOM;
  }

  private refreshDims(): void {
    this.dims.forEach((d, i) => d.setVisible(this.disabled(i)));
  }

  private setFooter(): void {
    this.footerRow?.destroy();
    this.footerRow = this.phase === 'difficulty' || this.phase === 'run'
      ? footer(this, 'W S  ELEGIR      ENTER  CONFIRMAR      ESC  VOLVER')
      : footer(this, 'W A S D  ELEGIR      ENTER  CONFIRMAR      ESC  VOLVER');
    this.footerRow.setDepth(30);
  }

  /** Fila y columna de cada casilla: filas de PER_ROW, centradas; la fila de abajo queda corrida media casilla. */
  private slotPos(i: number): { x: number; y: number; row: number } {
    const row = Math.floor(i / PER_ROW);
    const count = Math.min(PER_ROW, SLOTS.length - row * PER_ROW);
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
    i.moves.setText(`PODER: ${def.moves.special}  ·  S → D + CLIC IZQ\nULTIMATE: ${def.moves.super}  ·  E`).setY(y);
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

  /** Muestra al rival de la CPU (con un pequeño desliz al cambiar). */
  private showCpu(def: FighterDef): void {
    this.cpuMystery.setVisible(false);
    this.showFigure(this.cpuFig, def, true);
    this.cpuName.setText(def.name).setColor(CSS.cream);
    this.cpuTag.setText(def.tag).setColor(def.css);
    this.tweens.killTweensOf([this.cpuFig.fig, this.cpuFig.glow]);
    this.cpuFig.fig.setX(CPU_X + 40);
    this.tweens.add({ targets: [this.cpuFig.fig, this.cpuFig.glow], x: CPU_X, duration: 160, ease: 'Cubic.easeOut' });
  }

  /** Marco inclinado alrededor de la casilla `i` con su etiqueta (1P a la izquierda, CPU a la derecha). */
  private drawCursor(g: Phaser.GameObjects.Graphics, i: number, cpu: boolean): void {
    const { x, y } = this.slotPos(i);
    const color = cpu ? COLORS.red : COLORS.lime;
    const name = cpu ? 'cursor-cpu' : 'cursor-1p';
    g.clear();
    g.lineStyle(6, color, 1).strokePoints(pts(this.tile(x, y, cpu ? 9 : 5)), true);
    // Etiqueta al costado (arriba taparía la otra fila).
    const w = cpu ? 64 : 44;
    const lx = cpu ? x + SLOT / 2 + SKEW + 8 : x - SLOT / 2 - SKEW - 8 - w;
    g.fillStyle(color, 1).fillRect(lx, y - 14, w, 28);
    this.children.getByName(name)?.destroy();
    text(this, lx + w / 2, y, cpu ? 'CPU' : '1P', { size: 22, weight: '900', color: CSS.dark, origin: [0.5, 0.5] }).setName(name).setDepth(6);
  }

  private pick(i: number, silent = false): void {
    if (this.locked || this.phase === 'difficulty' || this.phase === 'run') return;
    if (i !== this.index && !silent) Audio.blip(this);
    this.index = i;
    const slot = SLOTS[i];
    if (this.phase === 'cpu') {
      if (slot === RANDOM) {
        this.hideCpu();
        this.cpuName.setText('ALEATORIO').setColor(CSS.cream);
        this.cpuTag.setText('QUE DECIDA LA CALLE').setColor(CSS.grey);
      } else {
        this.showCpu(FIGHTERS[slot]);
      }
      this.drawCursor(this.cursor, i, true);
      return;
    }
    if (slot === RANDOM) return;
    const def = FIGHTERS[slot];
    if (this.story) {
      this.cpuTag.setText('PARTIDA NUEVA').setColor(CSS.grey);
    }
    this.showFigure(this.p1Fig, def, false);
    this.showInfo(def);
    this.pending.setVisible(!!def.art.placeholder && !bustKey(this, def));
    this.p1Fig.fig.setX(P1_X - 40);
    this.tweens.add({ targets: [this.p1Fig.fig, this.p1Fig.glow], x: P1_X, duration: 160, ease: 'Cubic.easeOut' });
    this.drawCursor(this.cursor, i, false);
  }

  /** A D: siguiente casilla elegible. */
  private move(dir: number): void {
    let i = this.index;
    do i = (i + dir + SLOTS.length) % SLOTS.length;
    while (this.disabled(i));
    this.pick(i);
  }

  /** W S: salta a la casilla elegible más cercana de la otra fila. */
  private moveRow(dir: number): void {
    const rows = Math.ceil(SLOTS.length / PER_ROW);
    const cur = this.slotPos(this.index);
    const target = (cur.row + dir + rows) % rows;
    let best = this.index;
    let bestDx = Infinity;
    SLOTS.forEach((_, i) => {
      const p = this.slotPos(i);
      if (p.row === target && !this.disabled(i) && Math.abs(p.x - cur.x) < bestDx) {
        bestDx = Math.abs(p.x - cur.x);
        best = i;
      }
    });
    this.pick(best);
  }

  private confirm(): void {
    if (this.locked) return;
    if (this.phase === 'p1') this.confirmP1();
    else if (this.phase === 'cpu') this.confirmCpu();
    else this.confirmChoice();
  }

  private confirmP1(): void {
    const slot = SLOTS[this.index];
    if (slot === RANDOM) return;
    this.p1 = slot;
    Audio.tone(this, 660, 0.25, 'sawtooth', 0.06);
    this.cameras.main.flash(180, 223, 255, 0);
    this.tweens.add({ targets: this.p1Fig.fig, scale: this.p1Fig.fig.scale * 1.06, duration: 120, yoyo: true });
    if (this.story) {
      // Historia: sin rival a elegir. Si ya hay una partida guardada, avisa que se borra.
      if (StoryRun.run) return this.openRunChoice();
      return this.storyGo(slot);
    }
    // Ahora toca elegir al rival de la CPU: tu casilla queda marcada y el cursor pasa a la CPU.
    this.phase = 'cpu';
    this.title.setText('ELIGE AL RIVAL').setColor(CSS.red);
    this.drawCursor(this.p1Mark, this.index, false);
    this.children.getByName('cursor-1p')?.setName('mark-1p');
    this.refreshDims();
    this.move(1);
  }

  /** Empieza una historia nueva con `player` (prólogo); reemplaza la partida guardada. */
  private storyGo(player: FighterId): void {
    this.locked = true;
    StoryRun.start(player);
    this.time.delayedCall(700, () => goTo(this, SCENES.Story, { mode: 'prologue' }, 400));
  }

  /** Historia nueva con una partida guardada: avisa que se borra. */
  private openRunChoice(): void {
    const run = StoryRun.run!;
    const where = `${FIGHTERS[run.player].name}  ·  ${levelLabel({ level: run.index, total: run.rivals.length + 1 })}  ·  ${run.score.toLocaleString('es-PE')} PTS`;
    this.openChoice('run', 'NUEVA HISTORIA', 'ESTO BORRARÁ CUALQUIER PROGRESO ACTUAL', [
      { label: 'EMPEZAR', note: `SE PIERDE: ${where}` },
      { label: 'CANCELAR', note: 'VUELVES A ELEGIR' },
    ], 1);
  }

  /** Rival al azar: nunca tu mismo luchador ni el que tocó al azar la vez anterior. */
  private randomRival(): FighterId {
    const pool = ROSTER.filter((f) => f !== this.p1 && f !== lastRandom);
    lastRandom = Phaser.Utils.Array.GetRandom(pool);
    return lastRandom;
  }

  private confirmCpu(): void {
    const slot = SLOTS[this.index];
    if (slot === this.p1) return;
    this.locked = true;
    const random = slot === RANDOM;
    this.p2 = random ? this.randomRival() : slot;
    Audio.tone(this, 220, 0.3, 'sawtooth', 0.06);
    this.cameras.main.flash(180, 255, 45, 69);
    if (random) {
      // Muestra cuál tocó y deja el cursor en su casilla.
      this.showCpu(FIGHTERS[this.p2]);
      this.drawCursor(this.cursor, ROSTER.indexOf(this.p2), true);
    }
    this.tweens.add({ targets: this.cpuFig.fig, scale: this.cpuFig.fig.scale * 1.06, duration: 120, yoyo: true });
    // En entrenamiento la CPU no pelea: no hay dificultad que elegir.
    if (this.training) {
      this.time.delayedCall(700, () => goTo(this, SCENES.StageSelect, { p1: this.p1, p2: this.p2, training: true }, 300));
      return;
    }
    this.time.delayedCall(random ? 900 : 450, () => {
      this.locked = false;
      this.openChoice('difficulty', 'DIFICULTAD', `${FIGHTERS[this.p1].name}  VS  ${FIGHTERS[this.p2].name}`,
        DIFFICULTIES.map((d) => ({ label: DIFFICULTY_LABEL[d.id], note: d.note })),
        Math.max(0, DIFFICULTIES.findIndex((d) => d.id === Settings.data.difficulty)));
    });
  }

  /** Panel de opciones sobre la selección: la dificultad (después de elegir a los dos luchadores) o, en la historia, qué hacer con la partida guardada. */
  private openChoice(phase: 'difficulty' | 'run', title: string, subtitle: string, options: { label: string; note: string }[], start: number): void {
    this.phase = phase;
    this.setFooter();
    const box = this.add.container(0, 0).setDepth(20);
    box.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    const cx = GAME_WIDTH / 2;
    const cy = 520;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.bg, 0.96).fillRect(cx - 420, cy - 270, 840, 540);
    panel.lineStyle(4, COLORS.lime, 1).strokeRect(cx - 420, cy - 270, 840, 540);
    box.add(panel);
    box.add(text(this, cx, cy - 210, title, { size: 72, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true }));
    box.add(text(this, cx, cy - 150, subtitle, { size: 24, weight: '800', color: CSS.grey, origin: [0.5, 0.5], spacing: 3 }));
    const marker = this.add.graphics();
    box.add(marker);
    const items = options.map((d, k) => {
      const y = cy - 50 + k * 110;
      const t = text(this, cx, y, d.label, { size: 54, italic: true, weight: '900', origin: [0.5, 0.5] });
      box.add(text(this, cx, y + 40, d.note, { size: 18, weight: '700', color: CSS.grey, origin: [0.5, 0.5], spacing: 3 }));
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => this.pickChoice(k));
      t.on('pointerdown', () => {
        this.pickChoice(k, true);
        this.confirmChoice();
      });
      box.add(t);
      return t;
    });
    box.setAlpha(0);
    this.tweens.add({ targets: box, alpha: 1, duration: 150 });
    this.diff = { box, items, marker, index: -1 };
    this.pickChoice(start, true);
  }

  private pickChoice(k: number, silent = false): void {
    const d = this.diff;
    if (!d || this.locked) return;
    if (k !== d.index && !silent) Audio.blip(this);
    d.index = k;
    d.items.forEach((t, j) => t.setColor(j === k ? CSS.lime : CSS.cream).setScale(j === k ? 1.08 : 1));
    const t = d.items[k];
    d.marker.clear();
    d.marker.fillStyle(COLORS.lime, 0.12).fillRect(GAME_WIDTH / 2 - 380, t.y - 42, 760, 104);
    d.marker.fillStyle(COLORS.lime, 1).fillRect(GAME_WIDTH / 2 - 380, t.y - 42, 10, 104);
  }

  private confirmChoice(): void {
    const d = this.diff;
    if (!d || this.locked) return;
    if (this.phase === 'run') return d.index === 0 ? this.storyGo(this.p1) : this.back();
    this.locked = true;
    const difficulty = DIFFICULTIES[d.index].id;
    Settings.data.difficulty = difficulty;
    Settings.save();
    Audio.tone(this, 660, 0.25, 'sawtooth', 0.06);
    this.cameras.main.flash(180, 223, 255, 0);
    this.time.delayedCall(500, () => goTo(this, SCENES.StageSelect, { p1: this.p1, p2: this.p2, difficulty }, 300));
  }

  /** ESC: deshace un paso (dificultad → rival → tu luchador → menú). */
  private back(): void {
    if (this.phase === 'run') {
      this.diff?.box.destroy();
      this.diff = null;
      this.phase = 'p1';
      this.setFooter();
      return;
    }
    if (this.phase === 'difficulty') {
      this.diff?.box.destroy();
      this.diff = null;
      this.phase = 'cpu';
      this.setFooter();
      return;
    }
    if (this.phase === 'cpu') {
      this.phase = 'p1';
      this.title.setText('ELIGE TU LUCHADOR').setColor(CSS.lime);
      this.p1Mark.clear();
      this.children.getByName('mark-1p')?.destroy();
      this.children.getByName('cursor-cpu')?.destroy();
      this.hideCpu();
      this.refreshDims();
      this.pick(ROSTER.indexOf(this.p1), true);
      return;
    }
    goTo(this, SCENES.Title, { skipPress: true });
  }

  update() {
    const i = this.input2;
    if (this.locked) return;
    if (i.justDown('back')) return this.back();
    if (this.phase === 'difficulty' || this.phase === 'run') {
      const n = this.diff!.items.length;
      if (i.justDown('up') || i.justDown('left')) this.pickChoice((this.diff!.index - 1 + n) % n);
      if (i.justDown('down') || i.justDown('right')) this.pickChoice((this.diff!.index + 1) % n);
      if (i.justDown('confirm')) this.confirmChoice();
      return;
    }
    if (i.justDown('left')) this.move(-1);
    if (i.justDown('right')) this.move(1);
    if (i.justDown('up')) this.moveRow(-1);
    if (i.justDown('down')) this.moveRow(1);
    if (i.justDown('confirm')) this.confirm();
  }
}
