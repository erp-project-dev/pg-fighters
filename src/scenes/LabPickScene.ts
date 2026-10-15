import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS, ROSTER, type FighterId } from '../data/fighters';
import { STAGE_ORDER, STAGES, type StageId } from '../data/stages';
import { Audio } from '../systems/Audio';
import { addPortrait } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import { footer, text } from '../ui/ui';
import type { FightData } from './FightScene';

/** En el laboratorio también se puede jugar (y probar) con el jefe. */
const CHOICES: FighterId[] = [...ROSTER, 'acople'];
const COLS = 7;
const TILE = 128;
const GAP = 12;
const GRID_Y = 285;

type Target = 'p1' | 'p2';

/**
 * Laboratorio: ESC durante la práctica abre el roster encima de la pelea. ENTER (o clic) cambia al
 * luchador elegido y reinicia al instante; TAB alterna entre tu luchador y el rival.
 */
export class LabPickScene extends Phaser.Scene {
  private input2!: Input;
  private fight!: FightData;
  private target: Target = 'p1';
  private index = 0;
  private stage: StageId = 'barrio';
  private cursor!: Phaser.GameObjects.Graphics;
  private header!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.LabPick);
  }

  init(data: { fight: FightData }) {
    this.fight = data.fight;
    this.target = 'p1';
    this.stage = data.fight.stage ?? 'barrio';
    this.index = Math.max(0, CHOICES.indexOf(data.fight.p1));
  }

  create() {
    this.input2 = new Input(this);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg, 0.86).setOrigin(0);
    text(this, GAME_WIDTH / 2, 90, 'LABORATORIO', { size: 96, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true });
    this.header = text(this, GAME_WIDTH / 2, 185, '', { size: 34, weight: '800', origin: [0.5, 0.5], spacing: 2 });
    this.hint = text(this, GAME_WIDTH / 2, 235, '', { size: 26, weight: '700', color: CSS.grey, origin: [0.5, 0.5], spacing: 2 });

    const x0 = GAME_WIDTH / 2 - ((COLS - 1) * (TILE + GAP)) / 2;
    CHOICES.forEach((id, i) => {
      const def = FIGHTERS[id];
      const x = x0 + (i % COLS) * (TILE + GAP);
      const y = GRID_Y + Math.floor(i / COLS) * (TILE + GAP + 30) + TILE / 2;
      const g = this.add.graphics();
      g.fillStyle(id === 'acople' ? 0x1a0610 : COLORS.panel, 1).fillRect(x - TILE / 2, y - TILE / 2, TILE, TILE);
      g.lineStyle(2, def.color, 0.8).strokeRect(x - TILE / 2, y - TILE / 2, TILE, TILE);
      addPortrait(this, def, x, y, TILE - 10);
      text(this, x, y + TILE / 2 + 18, def.name, { size: 20, weight: '800', color: id === 'acople' ? '#ff6b7a' : CSS.cream, origin: [0.5, 0.5] });
      const zone = this.add.zone(x, y, TILE, TILE).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.move(i - this.index));
      zone.on('pointerdown', () => {
        this.index = i;
        this.apply();
      });
    });
    this.cursor = this.add.graphics();
    footer(this, 'W A S D  ELEGIR      ENTER  JUGAR      TAB  TÚ / RIVAL      F  ESCENARIO      V  SPRITES      M  MENÚ      ESC  VOLVER');

    // Teclas propias del laboratorio (no son acciones del juego).
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Tab') {
        e.preventDefault();
        this.target = this.target === 'p1' ? 'p2' : 'p1';
        this.index = Math.max(0, CHOICES.indexOf(this.fight[this.target]));
        Audio.blip(this);
        this.refresh();
      } else if (e.code === 'KeyF') {
        this.stage = STAGE_ORDER[(STAGE_ORDER.indexOf(this.stage) + 1) % STAGE_ORDER.length];
        Audio.blip(this);
        this.refresh();
      } else if (e.code === 'KeyV') this.leave(SCENES.Lab, { char: this.fight.p1 });
      else if (e.code === 'KeyM') this.leave(SCENES.Title, { skipPress: true });
    };
    window.addEventListener('keydown', onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', onKey));
    this.refresh();
  }

  private move(d: number): void {
    const n = CHOICES.length;
    const next = (this.index + d + n) % n;
    if (next === this.index) return;
    this.index = next;
    Audio.blip(this);
    this.refresh();
  }

  private refresh(): void {
    const p1 = FIGHTERS[this.fight.p1].name;
    const p2 = FIGHTERS[this.fight.p2].name;
    const mark = (t: Target, s: string) => (this.target === t ? `▶ ${s} ◀` : s);
    this.header.setText(`${mark('p1', `TÚ: ${p1}`)}      ${mark('p2', `RIVAL: ${p2}`)}      ESCENARIO: ${STAGES[this.stage].name}`);
    this.header.setColor(this.target === 'p1' ? CSS.lime : '#ff6b7a');
    this.hint.setText(this.target === 'p1' ? 'ELIGE TU LUCHADOR' : 'ELIGE AL RIVAL');
    const x0 = GAME_WIDTH / 2 - ((COLS - 1) * (TILE + GAP)) / 2;
    const x = x0 + (this.index % COLS) * (TILE + GAP);
    const y = GRID_Y + Math.floor(this.index / COLS) * (TILE + GAP + 30) + TILE / 2;
    this.cursor.clear().lineStyle(6, this.target === 'p1' ? COLORS.lime : 0xff6b7a, 1).strokeRect(x - TILE / 2 - 5, y - TILE / 2 - 5, TILE + 10, TILE + 10);
  }

  /** Reinicia la práctica con el luchador elegido (y el escenario actual). */
  private apply(): void {
    Audio.blip(this, true);
    this.leave(SCENES.Fight, { ...this.fight, [this.target]: CHOICES[this.index], stage: this.stage });
  }

  private resume(): void {
    this.scene.resume(SCENES.Fight);
    this.scene.resume(SCENES.Hud);
    this.scene.stop();
  }

  private leave(key: string, data: object): void {
    if (key !== SCENES.Fight) Audio.stopMusic(300);
    this.scene.stop(SCENES.Hud);
    this.scene.stop(SCENES.TrainingHud);
    this.scene.stop(SCENES.Fight);
    this.scene.start(key, data);
  }

  update() {
    const i = this.input2;
    if (i.justDown('left')) this.move(-1);
    if (i.justDown('right')) this.move(1);
    if (i.justDown('up')) this.move(-COLS);
    if (i.justDown('down')) this.move(COLS);
    if (i.justDown('confirm')) this.apply();
    if (i.justDown('back')) this.resume();
  }
}
