import Phaser from 'phaser';
import { CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS } from '../data/fighters';
import { Audio, MUSIC } from '../systems/Audio';
import { addPortrait } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import { StoryRun } from '../systems/StoryRun';
import { footer, goTo, scanlines, text } from '../ui/ui';

const SECONDS = 10;

/** ¿CONTINUAR? del modo historia: ENTER reintenta la misma pelea; si se acaba el tiempo o ESC, al menú (el progreso queda guardado). */
export class ContinueScene extends Phaser.Scene {
  private input2!: Input;
  private count = SECONDS;
  private number!: Phaser.GameObjects.Text;
  private leaving = false;

  constructor() {
    super(SCENES.Continue);
  }

  create() {
    if (!StoryRun.state) {
      this.scene.start(SCENES.Title, { skipPress: true });
      return;
    }
    this.count = SECONDS;
    this.leaving = false;
    this.cameras.main.fadeIn(300, 0, 0, 0);
    Audio.music(this, MUSIC.menu, 0.25);
    this.input2 = new Input(this);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x07060a, 1).setOrigin(0);

    const def = FIGHTERS[StoryRun.state!.player];
    const face = addPortrait(this, def, GAME_WIDTH / 2, 330, 300);
    if ('setTint' in face) (face as Phaser.GameObjects.Image).setTint(0x555555);
    text(this, GAME_WIDTH / 2, 560, '¿CONTINUAR?', { size: 150, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true });
    this.number = text(this, GAME_WIDTH / 2, 760, String(SECONDS), { size: 200, weight: '900', color: CSS.cream, origin: [0.5, 0.5] });
    text(this, GAME_WIDTH / 2, 900, `Rival: ${FIGHTERS[StoryRun.opponent].name}  ·  Tu progreso está guardado`, { size: 28, weight: '700', color: CSS.grey, origin: [0.5, 0.5], spacing: 2 });
    footer(this, 'ENTER  REINTENTAR      ESC  MENÚ');
    scanlines(this, 0.06);

    this.time.addEvent({
      delay: 1000,
      repeat: SECONDS,
      callback: () => {
        if (this.leaving) return;
        this.count--;
        if (this.count < 0) return this.quit();
        this.number.setText(String(this.count)).setScale(1.3);
        this.tweens.add({ targets: this.number, scale: 1, duration: 200 });
        Audio.tone(this, this.count <= 3 ? 330 : 520, 0.08, 'square', 0.04);
      },
    });
  }

  private retry(): void {
    if (this.leaving) return;
    this.leaving = true;
    StoryRun.addContinue();
    const run = StoryRun;
    goTo(this, SCENES.Fight, { p1: run.state!.player, p2: run.opponent, stage: run.stage, story: true, difficulty: run.difficulty }, 300);
  }

  private quit(): void {
    if (this.leaving) return;
    this.leaving = true;
    goTo(this, SCENES.Title, { skipPress: true }, 400);
  }

  update() {
    if (this.input2.justDown('confirm')) this.retry();
    if (this.input2.justDown('back')) this.quit();
  }
}
