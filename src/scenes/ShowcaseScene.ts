import Phaser from 'phaser';
import { COLORS, CSS, GAME_WIDTH, SCENES } from '../config';
import { SEQ } from '../entities/Cpu';
import { FIGHTERS, ROSTER } from '../data/fighters';
import { SOLOS, SOLO_LABEL } from '../data/solos';
import { Audio } from '../systems/Audio';
import type { DemoCombo } from '../systems/Training';
import { bottomOf, fitText, text } from '../ui/ui';
import type { FightData, FightScene } from './FightScene';

const PANEL_X = GAME_WIDTH - 560;
const PANEL_W = 520;

/**
 * Vitrina de especiales del laboratorio: el luchador contra un muñeco quieto y botones para ver
 * al instante su poder, uppercut y súper (con su solo). Usa la pelea real por debajo.
 */
export class ShowcaseScene extends Phaser.Scene {
  private fight!: FightScene;
  private data0!: FightData;

  constructor() {
    super(SCENES.Showcase);
  }

  init(data: { fight: FightScene; data: FightData }) {
    this.fight = data.fight;
    this.data0 = data.data;
  }

  create() {
    const def = FIGHTERS[this.data0.p1];
    const solo = SOLOS[def.superMove.solo];
    const demos: [string, string, DemoCombo][] = [
      ['1', `PODER · ${def.moves.special}`, { name: 'poder', gap: 700, steps: () => SEQ.special() }],
      ['2', `UPPERCUT · ${def.moves.uppercut}`, { name: 'uppercut', gap: 230, steps: () => SEQ.uppercut() }],
      ['3', `ULTIMATE · ${def.moves.super}`, { name: 'super', gap: 620, meter: true, steps: () => SEQ.super() }],
      ['4', 'COMBO · P · P · ULTIMATE', { name: 'combo', gap: 230, meter: true, steps: () => [{ dirs: [], punch: true, ms: 140 }, { dirs: [], punch: true, ms: 80 }, ...SEQ.super()] }],
    ];

    // Panel de alto variable: cada línea se apila bajo la anterior (los nombres largos ocupan dos líneas).
    const g = this.add.graphics();
    const x = PANEL_X + 24;
    const w = PANEL_W - 48;
    let y = 222;
    const add = (str: string, o: Parameters<typeof text>[4], gap: number) => {
      const t = text(this, x, y, str, { origin: [0, 0], wrap: w, ...o });
      y = bottomOf(t) + gap;
      return t;
    };
    add('LAB · ESPECIALES', { size: 26, weight: '900', italic: true, color: CSS.lime, spacing: 2 }, 10);
    fitText(add(`${def.number}  ${def.name}`, { size: 40, weight: '900', italic: true }, 8), w, 26);
    add(`Poder: ${def.special}  ·  Solo: ${SOLO_LABEL[solo.style]}`, { size: 20, font: 'body', weight: '600', color: def.css }, 22);

    demos.forEach(([key, label, demo], i) => {
      const t = add(`[${key}]  ${label}`, { size: 23, weight: '800' }, 14);
      const run = () => {
        this.fight.playDemo(demo);
        Audio.blip(this, true);
      };
      t.setInteractive({ useHandCursor: true }).on('pointerdown', run);
      this.input.keyboard!.on(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][i]}`, run);
    });
    y += 16;

    const nav: [string, string, () => void][] = [
      ['C', 'SIGUIENTE LUCHADOR', () => this.fight.showcaseFighter(ROSTER[(ROSTER.indexOf(this.data0.p1) + 1) % ROSTER.length])],
      ['R', 'REINICIAR POSICIÓN', () => this.fight.resetPositions()],
      ['ESC', 'VOLVER AL LABORATORIO', () => this.fight.backToLab()],
    ];
    nav.forEach(([key, label, fn]) => {
      const t = add(`[${key}]  ${label}`, { size: 21, weight: '700', color: CSS.grey }, 10);
      t.setInteractive({ useHandCursor: true }).on('pointerdown', fn);
      if (key !== 'ESC') this.input.keyboard!.on(`keydown-${key}`, fn);
    });

    g.fillStyle(COLORS.bg, 0.82).fillRect(PANEL_X, 200, PANEL_W, y - 200 + 14);
    g.fillStyle(def.color, 1).fillRect(PANEL_X, 200, PANEL_W, 5);
  }
}
