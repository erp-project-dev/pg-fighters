import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS, ROSTER, tintOf, type FighterDef, type FighterId } from '../data/fighters';
import { Audio, MUSIC } from '../systems/Audio';
import { addPortrait, artScale, bustKey } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import { levelLabel } from '../systems/Ranking';
import { DIFFICULTY_LABEL, Settings, type Difficulty } from '../systems/Settings';
import { StoryRun } from '../systems/StoryRun';
import { bottomOf, fitText, footer, goTo, pts, scanlines, speedStripes, stageBackdrop, text } from '../ui/ui';

/** Roster en cuadrícula al centro (estilo Marvel vs Capcom): casillas cuadradas en columnas. */
const SLOT = 112;
const SLOT_GAP = 10;
/** Inclinación de las casillas (0 = cuadradas). */
const SKEW = 0;
/** Última casilla: luchador al azar (para ti o para el rival de la CPU). */
const RANDOM = 'random';
type Slot = FighterId | typeof RANDOM;
const SLOTS: Slot[] = [...ROSTER, RANDOM];
const COLS = 5;
/** Centro de la primera fila de la cuadrícula. */
const GRID_TOP = 262;
/** Cada lado (jugador a la izquierda, rival a la derecha): retrato, nombre, título y lore, centrados en su columna. */
const SIDE_W = 560;
const P1_X = (GAME_WIDTH / 2 - (COLS * (SLOT + SLOT_GAP)) / 2) / 2;
const CPU_X = GAME_WIDTH - P1_X;
/** Placa P1 / CPU: su borde de arriba alineado con el de la cuadrícula. */
const BADGE_Y = GRID_TOP - SLOT / 2 + 36;
/** Pie del retrato. */
const FIG_Y = 748;
/** Alto del retrato en busto en la selección. */
const BUST_H = 440;
const NAME_Y = 788;
const NAME_SIZE = 52;
const TAG_Y = 830;
/** El lore arranca aquí y no baja de LORE_BOTTOM (si no entra, se achica la letra). */
const LORE_Y = 858;
const LORE_BOTTOM = 1012;
const LORE_SIZE = 19;
/** Aleatorio: barra ancha debajo de la cuadrícula (los 25 luchadores forman un 5×5 exacto). */
const ROSTER_ROWS = Math.ceil(ROSTER.length / COLS);
const RANDOM_H = 96;
const RANDOM_Y = GRID_TOP + (ROSTER_ROWS - 1) * (SLOT + SLOT_GAP) + SLOT / 2 + 14 + RANDOM_H / 2;
const DIFFICULTIES: { id: Difficulty; note: string }[] = [
  { id: 'easy', note: 'PARA CALENTAR LOS DEDOS' },
  { id: 'normal', note: 'PELEA PAREJA' },
  { id: 'hard', note: 'SIN PIEDAD' },
];

/** Fases de la selección: tu luchador, el rival de la CPU y la dificultad (historia: continuar o empezar de nuevo). */
type Phase = 'p1' | 'cpu' | 'difficulty' | 'run';

/** Últimos luchadores que tocaron al azar (el tuyo y el del rival), para no repetirlos en la siguiente pelea. */
let lastRandom: FighterId | null = null;
let lastRandomP1: FighterId | null = null;

interface Figure {
  fig: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
}

/** Un lado de la pantalla: placa, retrato y, debajo, nombre, título y lore (todo en `box`). */
interface Side {
  x: number;
  box: Phaser.GameObjects.Container;
  figure: Figure;
  label: Phaser.GameObjects.Text;
  name: Phaser.GameObjects.Text;
  tag: Phaser.GameObjects.Text;
  lore: Phaser.GameObjects.Text;
}

/**
 * Selección de personaje: roster en cuadrícula al centro; a la izquierda tu luchador y a la derecha el rival
 * de la CPU (elegido o al azar), cada uno con su retrato, nombre y lore. Después, la dificultad.
 */
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
  private p1Side!: Side;
  private cpuSide!: Side;
  private cpuMystery!: Phaser.GameObjects.Text;
  private p1Mystery!: Phaser.GameObjects.Text;
  private pending!: Phaser.GameObjects.Text;

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
    text(this, GAME_WIDTH / 2, 128, this.story ? 'MODO HISTORIA  ·  LIBERA A LA ESCENA DEL ODIO' : this.training ? 'MODO ENTRENAMIENTO  ·  SIN TIEMPO NI K.O.' : 'VS CPU  ·  MEJOR DE 3', { size: 24, weight: '700', origin: [0.5, 0.5], spacing: 5 });

    // Los dos lados: tú a la izquierda, el rival a la derecha.
    this.p1Side = this.makeSide(P1_X, false, 'P1', COLORS.lime);
    this.cpuSide = this.makeSide(CPU_X, true, 'CPU', COLORS.red);
    this.cpuMystery = text(this, CPU_X, FIG_Y - BUST_H / 2, '?', { size: 280, italic: true, weight: '900', color: '#2b2a30', origin: [0.5, 0.5] });
    this.p1Mystery = text(this, P1_X, FIG_Y - BUST_H / 2, '?', { size: 280, italic: true, weight: '900', color: '#2b2a30', origin: [0.5, 0.5] }).setVisible(false);
    this.pending = text(this, P1_X, FIG_Y - 20, 'ARTE PENDIENTE', { size: 22, weight: '800', color: CSS.rust, origin: [0.5, 0.5], spacing: 3, shadow: true });
    // Van con su columna cuando se centra.
    this.cpuSide.box.addAt(this.cpuMystery, 2);
    this.p1Side.box.addAt(this.p1Mystery, 2);
    this.p1Side.box.add(this.pending);

    // Roster en cuadrícula por filas
    SLOTS.forEach((id, i) => {
      const { x, y } = this.slotPos(i);
      const g = this.add.graphics();
      g.fillStyle(COLORS.panel, 1).fillPoints(pts(this.slotRect(i, 0)), true);
      const frame = this.add.graphics();
      if (id === RANDOM) {
        text(this, x, y, '?  ALEATORIO', { size: 46, italic: true, weight: '900', color: CSS.grey, origin: [0.5, 0.5], spacing: 4 });
        frame.lineStyle(3, COLORS.grey, 0.9).strokePoints(pts(this.slotRect(i, 0)), true);
      } else {
        const def = FIGHTERS[id];
        g.fillStyle(def.color, 0.35).fillPoints(pts(this.slotRect(i, 0)), true);
        addPortrait(this, def, x, y, SLOT - 2 * SKEW - 4);
        frame.lineStyle(3, def.color, 0.9).strokePoints(pts(this.slotRect(i, 0)), true);
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
      dim.fillStyle(0x000000, 0.7).fillPoints(pts(this.slotRect(i, 0)), true);
      this.dims.push(dim);
      const size = this.slotSize(i);
      const zone = this.add.zone(x, y, size.w, size.h).setInteractive({ useHandCursor: true });
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

  /** Casilla que no se puede elegir: tu propio luchador al elegir el rival. */
  private disabled(i: number): boolean {
    return this.phase !== 'p1' && SLOTS[i] === this.p1;
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

  /** Fila y columna de cada casilla: filas de COLS centradas en la pantalla; el aleatorio, una barra debajo. */
  private slotPos(i: number): { x: number; y: number; row: number } {
    if (SLOTS[i] === RANDOM) return { x: GAME_WIDTH / 2, y: RANDOM_Y, row: ROSTER_ROWS };
    const row = Math.floor(i / COLS);
    const count = Math.min(COLS, SLOTS.length - row * COLS);
    const col = i - row * COLS;
    const x = GAME_WIDTH / 2 + (col - (count - 1) / 2) * (SLOT + SLOT_GAP);
    return { x, y: GRID_TOP + row * (SLOT + SLOT_GAP), row };
  }

  /** Tamaño de la casilla `i` (el aleatorio es una barra del ancho de la cuadrícula). */
  private slotSize(i: number): { w: number; h: number } {
    return SLOTS[i] === RANDOM ? { w: COLS * (SLOT + SLOT_GAP) - SLOT_GAP, h: RANDOM_H } : { w: SLOT, h: SLOT };
  }

  /** Casilla `i` (paralelogramo si SKEW > 0), agrandada `pad` px. */
  private slotRect(i: number, pad: number): { x: number; y: number }[] {
    const { x, y } = this.slotPos(i);
    const { w, h } = this.slotSize(i);
    const hw = w / 2 + pad;
    const hh = h / 2 + pad;
    return [
      { x: x - hw + SKEW, y: y - hh }, { x: x + hw + SKEW, y: y - hh },
      { x: x + hw - SKEW, y: y + hh }, { x: x - hw - SKEW, y: y + hh },
    ];
  }

  private makeFigure(x: number, flip: boolean): Figure {
    const def = FIGHTERS.mayin;
    const glow = this.add.image(x, FIG_Y, def.art.texture, `${def.art.prefix}idle`).setFlipX(flip);
    glow.setTintMode(Phaser.TintModes.FILL).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
    const fig = this.add.image(x, FIG_Y, def.art.texture, `${def.art.prefix}idle`).setFlipX(flip);
    return { fig, glow };
  }

  /** Columna de un lado: placa (P1 / CPU) arriba, retrato y, debajo, nombre, título y lore centrados. */
  private makeSide(x: number, flip: boolean, label: string, color: number): Side {
    const figure = this.makeFigure(x, flip);
    // Placa inclinada del color del lado, con el texto oscuro encima: se lee de un vistazo quién es quién.
    const y = BADGE_Y;
    const w = label.length > 2 ? 190 : 150;
    const h = 72;
    const badge = this.add.graphics();
    badge.fillStyle(0x000000, 0.5).fillPoints(pts([
      { x: x - w / 2 + 14 + 6, y: y - h / 2 + 6 }, { x: x + w / 2 + 14 + 6, y: y - h / 2 + 6 },
      { x: x + w / 2 - 14 + 6, y: y + h / 2 + 6 }, { x: x - w / 2 - 14 + 6, y: y + h / 2 + 6 },
    ]), true);
    badge.fillStyle(color, 1).fillPoints(pts([
      { x: x - w / 2 + 14, y: y - h / 2 }, { x: x + w / 2 + 14, y: y - h / 2 },
      { x: x + w / 2 - 14, y: y + h / 2 }, { x: x - w / 2 - 14, y: y + h / 2 },
    ]), true);
    const side: Side = {
      x,
      box: this.add.container(0, 0),
      figure,
      label: text(this, x, y, label, { size: 60, italic: true, weight: '900', color: CSS.dark, origin: [0.5, 0.5], spacing: 4 }),
      name: text(this, x, NAME_Y, '', { size: NAME_SIZE, italic: true, weight: '900', origin: [0.5, 0.5], shadow: true }),
      tag: text(this, x, TAG_Y, '', { size: 18, weight: '800', origin: [0.5, 0.5], spacing: 3 }),
      lore: text(this, x, LORE_Y, '', { size: LORE_SIZE, font: 'body', weight: '500', color: '#d6d3c7', origin: [0.5, 0], align: 'center', wrap: SIDE_W, shadow: true }).setLineSpacing(4),
    };
    side.box.add([figure.glow, figure.fig, badge, side.label, side.name, side.tag, side.lore]);
    return side;
  }



  /** Nombre, título y lore de un lado (sin luchador: solo el nombre y el título dados). */
  private showText(side: Side, name: string, nameColor: string, tag: string, tagColor: string, lore: string): void {
    fitText(side.name.setFontSize(NAME_SIZE).setText(name).setColor(nameColor), SIDE_W, 32);
    side.tag.setText(tag).setColor(tagColor);
    // Lore largo: se achica la letra hasta que no baje del límite (por encima de los controles).
    let size = LORE_SIZE;
    side.lore.setFontSize(size).setText(lore);
    while (bottomOf(side.lore) > LORE_BOTTOM && size > 14) side.lore.setFontSize(--size);
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
    // El retrato es arte final: sin tinte (el tinte de color es solo para los cuerpos provisionales).
    f.fig.setTint(hidden ? 0x000000 : bust ? 0xffffff : tintOf(def)).setAlpha(hidden ? 0.7 : 1);
  }

  private hideCpu(): void {
    this.showFigure(this.cpuSide.figure, FIGHTERS.erp, true, true);
    this.cpuSide.figure.glow.setVisible(false);
    this.cpuMystery.setVisible(true);
    // Mientras no hay rival, una pista de qué toca (para que el lado no quede vacío).
    this.showText(this.cpuSide, '???', CSS.grey, this.phase === 'cpu' ? 'ELIGE A TU RIVAL' : 'TU RIVAL VA DESPUÉS', CSS.grey, '');
  }

  /** Muestra al rival de la CPU (con un pequeño desliz al cambiar). */
  private showCpu(def: FighterDef): void {
    this.cpuMystery.setVisible(false);
    const f = this.cpuSide.figure;
    this.showFigure(f, def, true);
    this.showText(this.cpuSide, def.name, CSS.cream, def.tag, def.css, def.bio);
    this.tweens.killTweensOf([f.fig, f.glow]);
    f.fig.setX(CPU_X + 40);
    this.tweens.add({ targets: [f.fig, f.glow], x: CPU_X, duration: 160, ease: 'Cubic.easeOut' });
  }

  /** Marco inclinado alrededor de la casilla `i` con su etiqueta (1P a la izquierda, CPU a la derecha). */
  private drawCursor(g: Phaser.GameObjects.Graphics, i: number, cpu: boolean): void {
    const { x, y } = this.slotPos(i);
    const color = cpu ? COLORS.red : COLORS.lime;
    const name = cpu ? 'cursor-cpu' : 'cursor-1p';
    g.clear();
    g.lineStyle(6, color, 1).strokePoints(pts(this.slotRect(i, cpu ? 7 : 3)), true);
    // Etiqueta en la esquina de arriba (P1 a la izquierda, CPU a la derecha) para no tapar casillas vecinas.
    const size = this.slotSize(i);
    const w = cpu ? 50 : 36;
    const lx = cpu ? x + size.w / 2 - w : x - size.w / 2;
    const ly = y - size.h / 2;
    g.fillStyle(color, 1).fillRect(lx, ly, w, 22);
    this.children.getByName(name)?.destroy();
    text(this, lx + w / 2, ly + 11, cpu ? 'CPU' : 'P1', { size: 17, weight: '900', color: CSS.dark, origin: [0.5, 0.5] }).setName(name).setDepth(6);
  }

  private pick(i: number, silent = false): void {
    if (this.locked || this.phase === 'difficulty' || this.phase === 'run') return;
    if (i !== this.index && !silent) Audio.blip(this);
    this.index = i;
    const slot = SLOTS[i];
    if (this.phase === 'cpu') {
      if (slot === RANDOM) {
        this.hideCpu();
        this.showText(this.cpuSide, 'ALEATORIO', CSS.cream, 'QUE DECIDA LA CALLE', CSS.grey, '');
      } else {
        this.showCpu(FIGHTERS[slot]);
      }
      this.drawCursor(this.cursor, i, true);
      return;
    }
    if (slot === RANDOM) {
      this.showFigure(this.p1Side.figure, FIGHTERS.erp, false, true);
      this.p1Side.figure.glow.setVisible(false);
      this.p1Mystery.setVisible(true);
      this.pending.setVisible(false);
      this.showText(this.p1Side, 'ALEATORIO', CSS.cream, 'QUE DECIDA LA CALLE', CSS.grey, '');
      this.drawCursor(this.cursor, i, false);
      return;
    }
    this.p1Mystery.setVisible(false);
    const def = FIGHTERS[slot];
    if (this.story) this.cpuSide.tag.setText('PARTIDA NUEVA').setColor(CSS.grey);
    const f = this.p1Side.figure;
    this.showFigure(f, def, false);
    this.showText(this.p1Side, def.name, CSS.cream, def.tag, def.css, def.bio);
    this.pending.setVisible(!!def.art.placeholder && !bustKey(this, def));
    f.fig.setX(P1_X - 40);
    this.tweens.add({ targets: [f.fig, f.glow], x: P1_X, duration: 160, ease: 'Cubic.easeOut' });
    this.drawCursor(this.cursor, i, false);
  }

  /** A D: siguiente casilla elegible. */
  private move(dir: number): void {
    let i = this.index;
    do i = (i + dir + SLOTS.length) % SLOTS.length;
    while (this.disabled(i));
    this.pick(i);
  }

  /** W S: salta a la casilla elegible más cercana de la fila de arriba o de abajo. */
  private moveRow(dir: number): void {
    const rows = Math.ceil(SLOTS.length / COLS);
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
    if (slot !== RANDOM) return this.lockP1(slot);
    // Aleatorio: sortea, muestra cuál tocó (el cursor salta a su casilla) y sigue tras una pausa.
    const pool = ROSTER.filter((f) => f !== lastRandomP1);
    lastRandomP1 = Phaser.Utils.Array.GetRandom(pool);
    this.pick(ROSTER.indexOf(lastRandomP1), true);
    this.locked = true;
    Audio.tone(this, 660, 0.25, 'sawtooth', 0.06);
    this.time.delayedCall(700, () => {
      this.locked = false;
      this.lockP1(lastRandomP1!);
    });
  }

  /** Fija tu luchador y pasa a elegir al rival (en la historia, a la partida). */
  private lockP1(slot: FighterId): void {
    this.p1 = slot;
    Audio.tone(this, 660, 0.25, 'sawtooth', 0.06);
    this.cameras.main.flash(180, 223, 255, 0);
    this.tweens.add({ targets: this.p1Side.figure.fig, scale: this.p1Side.figure.fig.scale * 1.06, duration: 120, yoyo: true });
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
    this.tweens.add({ targets: this.cpuSide.figure.fig, scale: this.cpuSide.figure.fig.scale * 1.06, duration: 120, yoyo: true });
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
