import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { Audio } from '../systems/Audio';
import { Input } from '../systems/Input';
import { Menu, footer, text } from '../ui/ui';
import { FIGHTERS, type FighterDef } from '../data/fighters';
import { TRAITS, powerInfo } from '../data/moveset';
import type { FightData } from './FightScene';

/** El laboratorio de sprites se abre con ?sprites en la URL. */
const LAB = new URLSearchParams(location.search).has('sprites');

/** [tipo, entrada, nombre, qué hace] de cada movimiento propio del luchador. */
const movesOf = (def: FighterDef): [string, string, string, string][] => {
  const trait = TRAITS[def.id];
  return [
    ['PODER', 'S → D + CLIC IZQ', def.moves.special, powerInfo(def.id)],
    ['UPPERCUT', 'D → S → S+D + CLIC IZQ', def.moves.uppercut, 'Antiaéreo invulnerable al arrancar.'],
    ['ULTIMATE', 'E', def.moves.super, 'Con la barra ULTIMATE llena.'],
    ...(trait ? [['RASGO', '', trait.name, trait.desc] as [string, string, string, string]] : []),
  ];
};


/** Pausa sobre la pelea: continuar, reiniciar, cambiar de luchador o salir. Muestra los movimientos de tu luchador. */
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
    g.fillStyle(COLORS.panel, 0.95).fillRect(px, 150, 760, 760);
    g.fillStyle(COLORS.lime, 1).fillRect(px, 150, 760, 6);
    const def = FIGHTERS[this.fight.p1];
    text(this, px + 40, 200, `MOVIMIENTOS  ·  ${def.name}`, { size: 30, italic: true, weight: '900', origin: [0, 0.5], spacing: 2 });
    text(this, px + 40, 236, 'Mirando a la derecha', { size: 20, font: 'body', color: CSS.grey, origin: [0, 0.5] });
    let y = 272;
    for (const [kind, input, name, desc] of movesOf(def)) {
      text(this, px + 40, y + 12, kind, { size: 20, weight: '800', color: CSS.grey, origin: [0, 0.5], spacing: 3 });
      if (input) text(this, px + 720, y + 12, input, { size: 24, weight: '700', origin: [1, 0.5] });
      const n = text(this, px + 40, y + 30, name, { size: 30, italic: true, weight: '900', color: CSS.lime, origin: [0, 0], wrap: 680 });
      y = n.y + n.height + 4;
      const d = text(this, px + 40, y, desc, { size: 21, font: 'body', color: '#cfccc0', origin: [0, 0], wrap: 680 }).setLineSpacing(3);
      y = d.y + d.height + 22;
    }
    text(this, px + 40, 876, 'Golpes básicos, barrida, cadena y dash: menú CONTROLES.', { size: 20, font: 'body', color: CSS.grey, origin: [0, 0.5] });
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
