import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS, tintOf, type FighterId } from '../data/fighters';
import type { StageId } from '../data/stages';
import { Audio, MUSIC } from '../systems/Audio';
import { artScale } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import type { CpuLevel } from '../systems/Settings';
import { Menu, fitText, footer, goTo, scanlines, speedStripes, stageBackdrop, text } from '../ui/ui';
import type { MatchStats } from './FightScene';

interface ResultsData {
  p1: FighterId;
  p2: FighterId;
  stage?: StageId;
  difficulty?: CpuLevel;
  playerWon: boolean;
  stats: MatchStats;
}

/** Fin de la partida: ganador, su frase, estadísticas y revancha. */
export class ResultsScene extends Phaser.Scene {
  private input2!: Input;
  private menu!: Menu;

  constructor() {
    super(SCENES.Results);
  }

  create(data: ResultsData) {
    this.cameras.main.fadeIn(400, 11, 10, 14);
    Audio.music(this, MUSIC.menu, 0.35);
    stageBackdrop(this, 0.75);
    speedStripes(this, data.playerWon ? COLORS.lime : COLORS.red, 0.04);
    this.input2 = new Input(this);

    const winner = FIGHTERS[data.playerWon ? data.p1 : data.p2];
    const fig = this.add.image(560, GAME_HEIGHT + 20, winner.art.texture, `${winner.art.prefix}idle`).setScale(artScale(this, winner) * 1.8).setTint(tintOf(winner));
    fig.setX(300).setAlpha(0);
    this.tweens.add({ targets: fig, x: 560, alpha: 1, duration: 500, ease: 'Cubic.easeOut' });

    const x = 1040;
    text(this, x, 150, data.playerWon ? '¡GANASTE!' : 'TE NOQUEARON', { size: 150, italic: true, weight: '900', color: data.playerWon ? CSS.lime : CSS.red, origin: [0, 0.5], stroke: '#000000' });
    fitText(text(this, x, 270, `${winner.name} GANA LA PELEA`, { size: 44, italic: true, weight: '900', origin: [0, 0.5], shadow: true }), 800, 26);
    fitText(text(this, x, 312, `"${winner.win}"`, { size: 34, font: 'body', weight: '600', color: winner.css, origin: [0, 0], shadow: true, wrap: 800 }), 800, 24, 80);

    const s = data.stats;
    const rows: [string, string][] = [
      ['RONDAS', `${s.roundsWon} - ${s.roundsLost}`],
      ['COMBO MÁXIMO', s.maxCombo ? `${s.maxCombo} HITS` : '—'],
      ['PERFECTS', String(s.perfects)],
      ['DURACIÓN', `${Math.floor(s.seconds / 60)}:${String(s.seconds % 60).padStart(2, '0')}`],
    ];
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 0.9).fillRect(x, 400, 760, rows.length * 58 + 30);
    rows.forEach(([k, v], i) => {
      const y = 445 + i * 58;
      text(this, x + 30, y, k, { size: 30, weight: '700', color: CSS.grey, origin: [0, 0.5], spacing: 2 });
      text(this, x + 730, y, v, { size: 36, weight: '900', origin: [1, 0.5] });
    });

    this.menu = new Menu(this, [
      { label: 'REVANCHA', onSelect: () => goTo(this, SCENES.Versus, { p1: data.p1, p2: data.p2, stage: data.stage, difficulty: data.difficulty }) },
      { label: 'CAMBIAR LUCHADOR', onSelect: () => goTo(this, SCENES.Select, { last: data.p1 }) },
      { label: 'MENÚ PRINCIPAL', onSelect: () => goTo(this, SCENES.Title, { skipPress: true }) },
    ], x + 30, 760, 76, 48, 'left');
    footer(this, 'W S  ELEGIR      ENTER  CONFIRMAR');
    scanlines(this, 0.06);
  }

  update() {
    const i = this.input2;
    if (i.justDown('up')) this.menu.move(-1);
    if (i.justDown('down')) this.menu.move(1);
    if (i.justDown('confirm')) this.menu.select();
  }
}
