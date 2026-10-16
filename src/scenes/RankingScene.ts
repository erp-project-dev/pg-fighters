import Phaser from 'phaser';
import { COLORS, CSS, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS } from '../data/fighters';
import { Audio, MUSIC } from '../systems/Audio';
import { addPortrait } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import { Ranking, levelLabel, type RankEntry } from '../systems/Ranking';
import { fitText, footer, goTo, scanlines, speedStripes, stageBackdrop, text } from '../ui/ui';

const TOP = 20;
/** Una sola tabla centrada: puesto, jugador, personaje, avance y puntaje. */
const TABLE_W = 1400;
const TABLE_X = (GAME_WIDTH - TABLE_W) / 2;
const HEAD_Y = 236;
const ROW_Y = 258;
const ROW_H = 37;
/** Columnas (desde el borde izquierdo de la tabla). */
const COL = { rank: 70, portrait: 110, player: 150, fighter: 560, level: 900, score: TABLE_W - 30 };

/** Top 20 global del modo historia: nombre, personaje, nivel alcanzado y puntaje. */
export class RankingScene extends Phaser.Scene {
  private input2!: Input;
  private status!: Phaser.GameObjects.Text;
  private leaving = false;

  constructor() {
    super(SCENES.Ranking);
  }

  create() {
    this.leaving = false;
    this.cameras.main.fadeIn(300, 11, 10, 14);
    Audio.music(this, MUSIC.menu, 0.35);
    stageBackdrop(this, 0.84);
    speedStripes(this, COLORS.lime, 0.03);
    this.input2 = new Input(this);
    text(this, GAME_WIDTH / 2, 110, 'RANKING', { size: 110, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true });
    text(this, GAME_WIDTH / 2, 185, 'MODO HISTORIA  ·  TOP 20 MUNDIAL', { size: 28, weight: '800', color: CSS.cream, origin: [0.5, 0.5], spacing: 6 });
    this.status = text(this, GAME_WIDTH / 2, 560, 'CARGANDO…', { size: 48, italic: true, weight: '900', color: CSS.grey, origin: [0.5, 0.5] });
    footer(this, 'ENTER ESC  VOLVER');
    scanlines(this, 0.06);

    Ranking.top(TOP).then(
      (list) => this.sys.isActive() && this.show(list),
      () => this.sys.isActive() && this.status.setText('SIN CONEXIÓN CON EL RANKING').setColor(CSS.red),
    );
  }

  private show(list: RankEntry[]): void {
    if (!list.length) {
      this.status.setText('TODAVÍA NO HAY PUNTAJES. ¡SÉ EL PRIMERO!').setColor(CSS.cream);
      return;
    }
    this.status.destroy();
    const head = { size: 20, weight: '800', color: CSS.grey, spacing: 3 } as const;
    text(this, TABLE_X + COL.rank, HEAD_Y, '#', { ...head, origin: [1, 0.5] });
    text(this, TABLE_X + COL.player, HEAD_Y, 'JUGADOR', { ...head, origin: [0, 0.5] });
    text(this, TABLE_X + COL.fighter, HEAD_Y, 'PERSONAJE', { ...head, origin: [0, 0.5] });
    text(this, TABLE_X + COL.level, HEAD_Y, 'AVANCE', { ...head, origin: [0, 0.5] });
    text(this, TABLE_X + COL.score, HEAD_Y, 'PUNTOS', { ...head, origin: [1, 0.5] });
    list.forEach((e, i) => {
      const x = TABLE_X;
      const y = ROW_Y + i * ROW_H + ROW_H / 2;
      const mine = Ranking.isMine(e.id);
      const podium = ['#ffd84a', '#d9d9e0', '#e0955a'][i] ?? CSS.cream;
      const g = this.add.graphics();
      g.fillStyle(mine ? 0x2c3300 : 0x000000, mine ? 0.85 : i % 2 ? 0.45 : 0.6).fillRect(x, y - ROW_H / 2 + 2, TABLE_W, ROW_H - 4);
      if (mine) g.lineStyle(2, COLORS.lime, 1).strokeRect(x, y - ROW_H / 2 + 2, TABLE_W, ROW_H - 4);
      text(this, x + COL.rank, y, `${i + 1}`, { size: 26, italic: true, weight: '900', color: podium, origin: [1, 0.5] });
      const def = FIGHTERS[e.fighter];
      if (def) addPortrait(this, def, x + COL.portrait, y, ROW_H - 6);
      fitText(text(this, x + COL.player, y, e.name, { size: 26, italic: true, weight: '900', color: mine ? CSS.lime : CSS.cream, origin: [0, 0.5] }), 380, 16);
      if (def) fitText(text(this, x + COL.fighter, y, def.name, { size: 22, weight: '800', color: def.css, origin: [0, 0.5], spacing: 1 }), 320, 14);
      text(this, x + COL.level, y, levelLabel(e), { size: 20, weight: '800', color: e.level >= e.total ? '#4dff88' : CSS.grey, origin: [0, 0.5], spacing: 2 });
      text(this, x + COL.score, y, e.score.toLocaleString('es-PE'), { size: 28, weight: '900', color: CSS.lime, origin: [1, 0.5] });
    });
  }

  update() {
    if (this.leaving) return;
    if (this.input2.justDown('confirm') || this.input2.justDown('back')) {
      this.leaving = true;
      Audio.blip(this, true);
      goTo(this, SCENES.Title, { skipPress: true });
    }
  }
}
