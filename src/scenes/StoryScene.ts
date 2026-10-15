import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS, type FighterDef } from '../data/fighters';
import { STAGES } from '../data/stages';
import { BOSS_STAGE, EPILOGUES, FINALE, PROLOGUE, REVEAL, type StoryLine } from '../data/story';
import { Audio, MUSIC } from '../systems/Audio';
import { addPortrait } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import { buildStage } from '../systems/StageArt';
import { BOSS, StoryRun } from '../systems/StoryRun';
import { fitText, footer, goTo, scanlines, text } from '../ui/ui';

export type StoryMode = 'prologue' | 'reveal' | 'finale';

const TYPE_MS = 30;
const BOX_W = 1400;
const BOX_X = (GAME_WIDTH - BOX_W) / 2;
const BOX_Y = 640;
const BOX_H = 300;

/**
 * Escenas de texto del modo historia: prólogo, revelación del jefe y final (con el epílogo del luchador
 * y el resumen). Paneles que se escriben letra por letra: ENTER completa o avanza, ESC salta todo.
 */
export class StoryScene extends Phaser.Scene {
  private input2!: Input;
  private mode: StoryMode = 'prologue';
  private lines: StoryLine[] = [];
  private index = 0;
  private full = '';
  private shown = 0;
  private lineStart = 0;
  private body!: Phaser.GameObjects.Text;
  private speakerName!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private portrait: Phaser.GameObjects.GameObject | null = null;
  private leaving = false;

  constructor() {
    super(SCENES.Story);
  }

  init(data: { mode?: StoryMode }) {
    this.mode = data?.mode ?? 'prologue';
    this.index = 0;
    this.leaving = false;
    this.portrait = null;
  }

  private get player(): FighterDef {
    return FIGHTERS[StoryRun.state!.player];
  }

  create() {
    if (!StoryRun.state) {
      this.scene.start(SCENES.Title, { skipPress: true });
      return;
    }
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.input2 = new Input(this);
    const p = this.player;
    const fill = (s: string) => s.replace('{name}', p.name).replace('{quote}', p.quote);

    if (this.mode === 'prologue') {
      this.lines = PROLOGUE.map((t) => ({ speaker: 'narrator', text: fill(t) }));
      Audio.music(this, MUSIC.menu, 0.3);
    } else if (this.mode === 'reveal') {
      this.lines = REVEAL.map((l) => ({ ...l, text: fill(l.text) }));
      Audio.stopMusic(800);
    } else {
      const epilogue = EPILOGUES[p.id] ?? '';
      this.lines = [...FINALE, epilogue].map((t) => ({ speaker: 'narrator', text: fill(t) }));
      this.lines.push({ speaker: 'narrator', text: this.summary() });
      Audio.music(this, MUSIC.menu, 0.35);
    }

    // Fondo: el barrio para el prólogo, el interior del ampli para la revelación, el festival al final.
    const stage = STAGES[this.mode === 'reveal' ? BOSS_STAGE : this.mode === 'finale' ? 'festival' : 'barrio'];
    buildStage(this, stage, true);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, this.mode === 'reveal' ? 0.45 : 0.62).setOrigin(0);

    const title = this.mode === 'prologue' ? 'MODO HISTORIA' : this.mode === 'reveal' ? 'LA VERDAD' : 'EPÍLOGO';
    text(this, GAME_WIDTH / 2, 80, title, { size: 64, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true });
    text(this, GAME_WIDTH / 2, 138, 'EL ACOPLE', { size: 26, weight: '800', color: CSS.cream, origin: [0.5, 0.5], spacing: 8 });

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.82).fillRect(BOX_X, BOX_Y, BOX_W, BOX_H);
    g.lineStyle(3, COLORS.lime, 0.9).strokeRect(BOX_X, BOX_Y, BOX_W, BOX_H);
    this.speakerName = text(this, BOX_X + 40, BOX_Y + 40, '', { size: 34, italic: true, weight: '900', origin: [0, 0.5] });
    this.body = text(this, BOX_X + 40, BOX_Y + 80, '', { size: 40, weight: '700', origin: [0, 0], wrap: BOX_W - 80 }).setLineSpacing(8);
    this.hint = text(this, BOX_X + BOX_W - 30, BOX_Y + BOX_H - 28, '▶ ENTER', { size: 22, weight: '800', color: CSS.lime, origin: [1, 0.5], spacing: 2 });
    this.tweens.add({ targets: this.hint, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
    footer(this, 'ENTER  SIGUIENTE      ESC  SALTAR');
    scanlines(this, 0.05);
    this.showLine();
  }

  private summary(): string {
    const s = StoryRun.state!.stats;
    const time = `${Math.floor(s.seconds / 60)}:${String(s.seconds % 60).padStart(2, '0')}`;
    const score = StoryRun.state!.score.toLocaleString('es-PE');
    return `FIN.  Puntaje final: ${score}  ·  Amigos liberados: ${StoryRun.friends}/${StoryRun.friends}  ·  Tiempo: ${time}  ·  Mejor combo: ${s.maxCombo}  ·  Perfects: ${s.perfects}  ·  Continues: ${s.continues}`;
  }

  private showLine(): void {
    const line = this.lines[this.index];
    this.full = line.text;
    this.shown = 0;
    this.lineStart = this.time.now;
    this.body.setText('');
    this.portrait?.destroy();
    this.portrait = null;
    const speaker = line.speaker === 'boss' ? FIGHTERS[BOSS] : line.speaker === 'player' ? this.player : null;
    // Con retrato, el texto se corre a la derecha.
    const tx = speaker ? BOX_X + 260 : BOX_X + 40;
    this.body.setX(tx).setWordWrapWidth(BOX_W - (tx - BOX_X) - 40, true);
    this.speakerName.setX(tx).setText(speaker ? speaker.name : '').setColor(speaker?.css ?? CSS.cream);
    if (speaker) this.portrait = addPortrait(this, speaker, BOX_X + 130, BOX_Y + BOX_H / 2, 190, false);
    // La frase completa debe caber en el cuadro.
    this.body.setFontSize(40).setText(this.full);
    fitText(this.body, BOX_W - (tx - BOX_X) - 40, 26, BOX_H - 120);
    this.body.setText('');
    this.hint.setVisible(false);
    if (line.speaker === 'boss') {
      this.cameras.main.shake(200, 0.004);
      Audio.tone(this, 70, 0.5, 'sawtooth', 0.06);
    }
  }

  private advance(): void {
    if (this.shown < this.full.length) {
      this.lineStart = -1e9; // completa la frase
      return;
    }
    this.index++;
    if (this.index >= this.lines.length) this.finish();
    else this.showLine();
  }

  private finish(): void {
    if (this.leaving) return;
    this.leaving = true;
    const run = StoryRun;
    if (this.mode === 'prologue') goTo(this, SCENES.StoryProgress, {}, 400);
    else if (this.mode === 'reveal') {
      goTo(this, SCENES.Versus, { p1: run.state!.player, p2: BOSS, stage: BOSS_STAGE, story: true, difficulty: run.difficulty }, 400);
    } else {
      run.clear();
      goTo(this, SCENES.Title, { skipPress: true }, 600);
    }
  }

  update() {
    if (this.leaving || !this.body) return;
    const chars = Math.min(this.full.length, Math.max(0, Math.floor((this.time.now - this.lineStart) / TYPE_MS)));
    if (chars !== this.shown) {
      this.shown = chars;
      this.body.setText(this.full.slice(0, chars));
      if (chars % 4 === 0 && chars < this.full.length) Audio.tone(this, 820, 0.02, 'square', 0.01);
      if (chars >= this.full.length) this.hint.setVisible(true);
    }
    if (this.input2.justDown('confirm')) this.advance();
    if (this.input2.justDown('back')) this.finish();
  }
}
