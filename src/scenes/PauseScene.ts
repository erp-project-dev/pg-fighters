import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { Audio } from '../systems/Audio';
import { Input } from '../systems/Input';
import { Menu, footer, text } from '../ui/ui';
import type { FightData } from './FightScene';

/** El laboratorio de sprites se abre con ?sprites en la URL. */
const LAB = new URLSearchParams(location.search).has('sprites');

const MOVES_LIST: [string, string][] = [
  ['PUÑO / PATADA', 'CLIC IZQ / CLIC DER'],
  ['PODER', 'S → D + CLIC IZQ'],
  ['UPPERCUT', 'D → S → S+D + CLIC IZQ'],
  ['ULTIMATE (barra llena)', 'E'],
  ['BARRIDA', 'S + CLIC DER'],
  ['DASH / ATRÁS', 'D D / A A'],
  ['BLOQUEAR', 'mantener A'],
];


/** Pausa sobre la pelea: continuar, reiniciar, cambiar de luchador o salir. Muestra la lista de movimientos. */
export class PauseScene extends Phaser.Scene {
  private input2!: Input;
  private menu!: Menu;
  private fight!: FightData;

  constructor() {
    super(SCENES.Pause);
  }

  init(data: { fight: FightData }) {
    this.fight = data.fight;
  }

  create() {
    this.sound.pauseAll();
    this.input2 = new Input(this);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg, 0.78).setOrigin(0);
    text(this, 140, 200, 'PAUSA', { size: 170, italic: true, weight: '900', color: CSS.lime, origin: [0, 0.5] });
    this.menu = new Menu(this, [
      { label: 'SEGUIR PELEANDO', onSelect: () => this.resume() },
      { label: 'REINICIAR PELEA', onSelect: () => this.leave(SCENES.Fight, this.fight) },
      ...(this.fight.story ? [] : [{ label: 'CAMBIAR LUCHADOR', onSelect: () => this.leave(SCENES.Select, { last: this.fight.p1, mode: this.fight.training ? 'training' : 'arcade' }) }]),
      ...(LAB ? [{ label: 'LABORATORIO', onSelect: () => this.leave(SCENES.Lab, { char: this.fight.p1 }) }] : []),
      { label: this.fight.story ? 'MENÚ (PROGRESO GUARDADO)' : 'MENÚ PRINCIPAL', onSelect: () => this.leave(SCENES.Title, { skipPress: true }) },
    ], 170, 400, 84, 52, 'left');

    const px = 1040;
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 0.95).fillRect(px, 150, 760, 700);
    g.fillStyle(COLORS.lime, 1).fillRect(px, 150, 760, 6);
    text(this, px + 40, 205, 'MOVIMIENTOS  ·  MIRANDO A LA DERECHA', { size: 30, italic: true, weight: '900', origin: [0, 0.5], spacing: 2 });
    MOVES_LIST.forEach(([name, input], i) => {
      const y = 290 + i * 76;
      text(this, px + 40, y, name, { size: 30, weight: '800', color: CSS.lime, origin: [0, 0.5] });
      text(this, px + 720, y, input, { size: 30, weight: '700', origin: [1, 0.5] });
    });
    footer(this, 'W S  ELEGIR      ENTER  CONFIRMAR      ESC  CONTINUAR');
  }

  private resume(): void {
    this.sound.resumeAll();
    this.scene.resume(SCENES.Fight);
    this.scene.resume(SCENES.Hud);
    this.scene.resume(SCENES.TrainingHud);
    this.scene.stop();
  }

  private leave(key: string, data?: object): void {
    this.sound.resumeAll();
    if (key !== SCENES.Fight) Audio.stopMusic(300);
    this.scene.stop(SCENES.Hud);
    this.scene.stop(SCENES.TrainingHud);
    this.scene.stop(SCENES.Fight);
    this.scene.start(key, data);
  }

  update() {
    const i = this.input2;
    if (i.justDown('up')) this.menu.move(-1);
    if (i.justDown('down')) this.menu.move(1);
    if (i.justDown('confirm')) this.menu.select();
    if (i.justDown('back')) this.resume();
  }
}
