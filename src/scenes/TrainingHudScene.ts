import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { Audio } from '../systems/Audio';
import { DEMOS, DUMMY_LABEL } from '../systems/Training';
import { text } from '../ui/ui';
import type { FightScene } from './FightScene';

const ARROWS: Record<number, string> = { 1: 'S+A', 2: 'S', 3: 'S+D', 4: 'A', 5: '•', 6: 'D', 7: 'W+A', 8: 'W', 9: 'W+D' };
const FRAME_MS = 1000 / 60;
const frames = (ms: number) => `${Math.round(ms / FRAME_MS)}f`;

const PANEL_X = GAME_WIDTH - 470;
const PANEL_W = 430;

/** Capa del modo entrenamiento: historial de entradas, opciones del muñeco, combos demo y datos del último golpe. */
export class TrainingHudScene extends Phaser.Scene {
  private fight!: FightScene;
  private history: Phaser.GameObjects.Text[] = [];
  private options: Phaser.GameObjects.Text[] = [];
  private demoTexts: Phaser.GameObjects.Text[] = [];
  private frameText: Phaser.GameObjects.Text | null = null;
  private comboText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super(SCENES.TrainingHud);
  }

  init(data: { fight: FightScene }) {
    this.fight = data.fight;
    this.frameText = this.comboText = null;
    this.history = [];
    this.options = [];
    this.demoTexts = [];
  }

  create() {
    // Historial de entradas
    const hg = this.add.graphics();
    hg.fillStyle(COLORS.bg, 0.6).fillRect(24, 220, 250, 650);
    text(this, 40, 240, 'ENTRADAS', { size: 22, weight: '800', color: CSS.lime, origin: [0, 0.5], spacing: 3 });
    for (let i = 0; i < 18; i++) {
      this.history.push(text(this, 40, 280 + i * 33, '', { size: 22, weight: '800', origin: [0, 0.5] }).setAlpha(1 - i * 0.04));
    }

    // Opciones
    const pg = this.add.graphics();
    pg.fillStyle(COLORS.bg, 0.72).fillRect(PANEL_X, 220, PANEL_W, 650);
    pg.fillStyle(COLORS.lime, 1).fillRect(PANEL_X, 220, PANEL_W, 4);
    text(this, PANEL_X + 20, 248, 'ENTRENAMIENTO', { size: 30, italic: true, weight: '900', color: CSS.lime, origin: [0, 0.5] });
    const opts: [string, () => void][] = [
      ['Q', () => this.fight.training!.cycleDummy()],
      ['I', () => { const t = this.fight.training!; t.infiniteMeter = !t.infiniteMeter; }],
      ['T', () => this.fight.training!.cycleSpeed()],
      ['G', () => { const t = this.fight.training!; t.boxes = !t.boxes; }],
      ['R', () => { this.fight.training!.stopDemo(); this.fight.resetPositions(); }],
    ];
    opts.forEach(([key, action], i) => {
      const t = text(this, PANEL_X + 20, 300 + i * 40, '', { size: 24, weight: '700', origin: [0, 0.5] });
      t.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.run(action));
      this.input.keyboard!.on(`keydown-${key}`, () => this.run(action));
      this.options.push(t);
    });

    text(this, PANEL_X + 20, 520, 'COMBOS DEMO', { size: 24, weight: '800', color: CSS.lime, origin: [0, 0.5], spacing: 2 });
    DEMOS.forEach((demo, i) => {
      const t = text(this, PANEL_X + 20, 558 + i * 36, `[${i + 1}]  ${demo.name}`, { size: 24, weight: '700', origin: [0, 0.5] });
      t.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.run(() => this.fight.playDemo(demo)));
      this.input.keyboard!.on(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'][i]}`, () => this.run(() => this.fight.playDemo(demo)));
      this.demoTexts.push(t);
    });

    // Datos del último golpe y del combo
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bg, 0.7).fillRect(GAME_WIDTH / 2 - 560, GAME_HEIGHT - 168, 1120, 92);
    this.frameText = text(this, GAME_WIDTH / 2, GAME_HEIGHT - 142, '', { size: 26, weight: '700', origin: [0.5, 0.5] });
    this.comboText = text(this, GAME_WIDTH / 2, GAME_HEIGHT - 102, '', { size: 26, weight: '800', color: CSS.lime, origin: [0.5, 0.5] });
  }

  private run(action: () => void): void {
    if (!this.fight.training || this.fight.phase !== 'fight' || !this.sys.isActive() || !this.fight.sys.isActive()) return;
    action();
    Audio.blip(this, true);
  }

  update() {
    const t = this.fight.training;
    if (!t) return;
    t.inputLog.forEach((e, i) => {
      const row = this.history[i];
      if (!row) return;
      row.setText(`${ARROWS[e.dir]} ${e.buttons}`.padEnd(10) + (e.frames > 1 ? `  ${Math.min(e.frames, 99)}` : ''));
      row.setColor(e.buttons ? CSS.lime : CSS.cream);
    });
    for (let i = t.inputLog.length; i < this.history.length; i++) this.history[i].setText('');

    const labels = [
      `[Q]  MUÑECO: ${DUMMY_LABEL[t.dummy]}`,
      `[I]  ULTIMATE INFINITO: ${t.infiniteMeter ? 'SÍ' : 'NO'}`,
      `[T]  VELOCIDAD: ${Math.round(t.speed * 100)}%`,
      `[G]  CAJAS DE GOLPE: ${t.boxes ? 'SÍ' : 'NO'}`,
      '[R]  REINICIAR POSICIÓN',
    ];
    this.options.forEach((o, i) => o.setText(labels[i]));
    this.demoTexts.forEach((d, i) => d.setColor(t.demoName === DEMOS[i].name ? CSS.lime : CSS.cream));

    if (!this.frameText || !this.comboText) return;
    const m = t.lastMove;
    if (m) {
      const mv = m.move;
      const active = mv.air ? 'hasta caer' : mv.id === 'special' ? 'proyectil' : mv.active >= 9999 ? 'solo de guitarra' : frames(mv.active);
      const result = m.result === 'hit' ? 'GOLPE' : m.result === 'block' ? 'BLOQUEADO' : 'FALLÓ';
      this.frameText.setText(`${mv.id.toUpperCase()}   arranque ${frames(mv.startup)} · activo ${active} · recuperación ${frames(mv.recovery)}   ›  ${result}${m.damage ? ` (${m.damage})` : ''}`);
    } else this.frameText.setText('Pega para ver los datos del golpe');
    const c = t.combo;
    this.comboText.setText(c.hits ? `COMBO: ${c.hits} ${c.hits === 1 ? 'GOLPE' : 'GOLPES'} · ${c.damage} DE DAÑO     MEJOR: ${c.best}` : `MEJOR COMBO: ${c.best}`);
  }
}
