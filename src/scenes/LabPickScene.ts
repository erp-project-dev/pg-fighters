import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS, ROSTER, type FighterId } from '../data/fighters';
import { STAGE_ORDER, STAGES, type StageId } from '../data/stages';
import { Audio } from '../systems/Audio';
import { addPortrait } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import { buildStage } from '../systems/StageArt';
import { fitText, footer, text } from '../ui/ui';
import type { FightData } from './FightScene';

/** En el laboratorio también se puede jugar (y probar) con el jefe. */
const CHOICES: FighterId[] = [...ROSTER, 'acople'];
const GRID_Y = 320;
const FIGHTER = { cols: 7, w: 128, h: 128, gapX: 12, gapY: 42 };
const STAGE = { cols: 5, w: 300, h: 169, gapX: 16, gapY: 16 };

type Section = 'p1' | 'p2' | 'stage';
const SECTIONS: Section[] = ['p1', 'p2', 'stage'];
const LABELS: Record<Section, string> = { p1: 'TÚ', p2: 'RIVAL', stage: 'ESCENARIO' };
const TAB_X = [420, 860, 1300];

/**
 * Laboratorio: ESC durante la práctica abre este menú encima de la pelea. Se eligen tu luchador, el
 * rival y el escenario (ENTER pasa al siguiente; en el escenario, arranca la pelea) y ESC vuelve sin cambios.
 */
export class LabPickScene extends Phaser.Scene {
  private input2!: Input;
  private fight!: FightData;
  private sel!: { p1: FighterId; p2: FighterId; stage: StageId };
  private section: Section = 'p1';
  private index = 0;
  private grid: Phaser.GameObjects.GameObject[] = [];
  private tabs: Phaser.GameObjects.Text[] = [];
  private cursor!: Phaser.GameObjects.Graphics;

  constructor() {
    super(SCENES.LabPick);
  }

  init(data: { fight: FightData }) {
    this.fight = data.fight;
    this.sel = { p1: data.fight.p1, p2: data.fight.p2, stage: data.fight.stage ?? 'barrio' };
    this.section = 'p1';
  }

  create() {
    this.input2 = new Input(this);
    this.grid = [];
    this.tabs = [];
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg, 0.9).setOrigin(0);
    text(this, GAME_WIDTH / 2, 80, 'LABORATORIO', { size: 80, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true });

    // Pestañas: TÚ · RIVAL · ESCENARIO (clic para saltar) y PELEAR.
    SECTIONS.forEach((s, i) => {
      text(this, TAB_X[i], 165, LABELS[s], { size: 24, weight: '800', color: CSS.grey, origin: [0.5, 0.5], spacing: 3 });
      const t = text(this, TAB_X[i], 210, '', { size: 38, italic: true, weight: '900', origin: [0.5, 0.5] });
      t.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.setSection(s));
      this.tabs.push(t);
    });
    const play = text(this, 1680, 200, '▶ PELEAR', { size: 44, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5] });
    play.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.play());

    this.cursor = this.add.graphics().setDepth(10);
    footer(this, 'W A S D  ELEGIR      ENTER  OK      TAB  TÚ / RIVAL / ESCENARIO      ESC  VOLVER');

    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Tab' || e.repeat) return;
      e.preventDefault();
      this.setSection(SECTIONS[(SECTIONS.indexOf(this.section) + 1) % SECTIONS.length]);
    };
    window.addEventListener('keydown', onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', onKey));
    this.buildGrid();
  }

  private get layout() {
    return this.section === 'stage' ? STAGE : FIGHTER;
  }

  private get options(): readonly (FighterId | StageId)[] {
    return this.section === 'stage' ? STAGE_ORDER : CHOICES;
  }

  /** Centro de la casilla `i` (filas centradas). */
  private slot(i: number): { x: number; y: number } {
    const l = this.layout;
    const x0 = GAME_WIDTH / 2 - ((l.cols - 1) * (l.w + l.gapX)) / 2;
    return { x: x0 + (i % l.cols) * (l.w + l.gapX), y: GRID_Y + Math.floor(i / l.cols) * (l.h + l.gapY) + l.h / 2 };
  }

  private setSection(s: Section): void {
    if (s === this.section) return;
    Audio.blip(this);
    this.section = s;
    this.buildGrid();
  }

  private buildGrid(): void {
    for (const o of this.grid) o.destroy();
    this.grid = [];
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.grid.push(o);
      return o;
    };
    const { w, h } = this.layout;
    this.options.forEach((id, i) => {
      const { x, y } = this.slot(i);
      const g = add(this.add.graphics());
      if (this.section === 'stage') {
        const stage = STAGES[id as StageId];
        add(buildStage(this, stage, false).setScale(w / GAME_WIDTH).setPosition(x - w / 2, y - h / 2));
        g.setDepth(1).fillStyle(0x000000, 0.8).fillRect(x - w / 2, y + h / 2 - 34, w, 34);
        add(fitText(text(this, x, y + h / 2 - 17, stage.name, { size: 20, weight: '800', origin: [0.5, 0.5], spacing: 1 }).setDepth(2), w - 14, 12));
      } else {
        const def = FIGHTERS[id as FighterId];
        g.fillStyle(id === 'acople' ? 0x1a0610 : COLORS.panel, 1).fillRect(x - w / 2, y - h / 2, w, h);
        g.lineStyle(2, def.color, 0.8).strokeRect(x - w / 2, y - h / 2, w, h);
        add(addPortrait(this, def, x, y, w - 10));
        add(text(this, x, y + h / 2 + 18, def.name, { size: 20, weight: '800', color: id === 'acople' ? '#ff6b7a' : CSS.cream, origin: [0.5, 0.5] }));
      }
      const zone = add(this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(3));
      zone.on('pointerover', () => this.move(i - this.index));
      zone.on('pointerdown', () => {
        this.index = i;
        this.choose();
      });
    });
    this.index = Math.max(0, this.options.indexOf(this.sel[this.section]));
    this.refresh();
  }

  private move(d: number): void {
    const n = this.options.length;
    const next = (this.index + d + n) % n;
    if (next === this.index) return;
    this.index = next;
    Audio.blip(this);
    this.refresh();
  }

  private refresh(): void {
    SECTIONS.forEach((s, i) => {
      const value = s === 'stage' ? STAGES[this.sel.stage].name : FIGHTERS[this.sel[s]].name;
      fitText(this.tabs[i].setText(value).setFontSize(38), 420, 20).setColor(s === this.section ? CSS.lime : CSS.cream);
    });
    const { w, h } = this.layout;
    const g = this.cursor.clear();
    // Elegido (fino) y cursor (grueso).
    const chosen = this.slot(this.options.indexOf(this.sel[this.section]));
    g.lineStyle(3, COLORS.white, 0.9).strokeRect(chosen.x - w / 2 - 3, chosen.y - h / 2 - 3, w + 6, h + 6);
    const { x, y } = this.slot(this.index);
    g.lineStyle(6, this.section === 'p2' ? 0xff6b7a : COLORS.lime, 1).strokeRect(x - w / 2 - 8, y - h / 2 - 8, w + 16, h + 16);
  }

  /** Marca la casilla del cursor y pasa a la siguiente pestaña; en el escenario, arranca la pelea. */
  private choose(): void {
    const id = this.options[this.index];
    if (this.section === 'stage') {
      this.sel.stage = id as StageId;
      this.play();
      return;
    }
    this.sel[this.section] = id as FighterId;
    Audio.blip(this, true);
    this.section = this.section === 'p1' ? 'p2' : 'stage';
    this.buildGrid();
  }

  /** Reinicia la práctica con lo elegido. */
  private play(): void {
    Audio.blip(this, true);
    this.scene.stop(SCENES.Hud);
    this.scene.stop(SCENES.Fight);
    this.scene.start(SCENES.Fight, { ...this.fight, ...this.sel });
  }

  private resume(): void {
    this.scene.resume(SCENES.Fight);
    this.scene.resume(SCENES.Hud);
    this.scene.stop();
  }

  update() {
    const i = this.input2;
    const cols = this.layout.cols;
    if (i.justDown('left')) this.move(-1);
    if (i.justDown('right')) this.move(1);
    if (i.justDown('up')) this.move(-cols);
    if (i.justDown('down')) this.move(cols);
    if (i.justDown('confirm')) this.choose();
    if (i.justDown('back')) this.resume();
  }
}
