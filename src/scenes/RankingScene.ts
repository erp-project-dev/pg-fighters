import Phaser from 'phaser';
import { COLORS, CSS, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS } from '../data/fighters';
import { Audio, MUSIC } from '../systems/Audio';
import { addPortrait } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import { Ranking, levelLabel, type RankEntry } from '../systems/Ranking';
import { fitText, footer, goTo, scanlines, speedStripes, stageBackdrop, text } from '../ui/ui';

const TOP = 20;
const PER_COL = 10;
const COL_W = 860;
const COL_X = [(GAME_WIDTH - COL_W * 2 - 60) / 2, (GAME_WIDTH - COL_W * 2 - 60) / 2 + COL_W + 60];
const ROW_Y = 250;
const ROW_H = 70;

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
    const me = Ranking.user?.uid;
    list.forEach((e, i) => {
      const x = COL_X[Math.floor(i / PER_COL)];
      const y = ROW_Y + (i % PER_COL) * ROW_H + ROW_H / 2;
      const mine = e.id === me;
      const podium = ['#ffd84a', '#d9d9e0', '#e0955a'][i] ?? CSS.cream;
      const g = this.add.graphics();
      g.fillStyle(mine ? 0x2c3300 : 0x000000, mine ? 0.85 : 0.6).fillRect(x, y - ROW_H / 2 + 4, COL_W, ROW_H - 8);
      if (mine) g.lineStyle(2, COLORS.lime, 1).strokeRect(x, y - ROW_H / 2 + 4, COL_W, ROW_H - 8);
      text(this, x + 60, y, `${i + 1}`, { size: 40, italic: true, weight: '900', color: podium, origin: [1, 0.5] });
      const def = FIGHTERS[e.fighter];
      if (def) addPortrait(this, def, x + 110, y, ROW_H - 14);
      const name = text(this, x + 160, y - 2, e.name, { size: 36, italic: true, weight: '900', color: mine ? CSS.lime : CSS.cream, origin: [0, 0.5] });
      fitText(name, 300, 20);
      text(this, x + 480, y, levelLabel(e), { size: 22, weight: '800', color: e.level >= e.total ? '#4dff88' : CSS.grey, origin: [0, 0.5], spacing: 2 });
      text(this, x + COL_W - 20, y, e.score.toLocaleString('es-PE'), { size: 38, weight: '900', color: CSS.lime, origin: [1, 0.5] });
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
