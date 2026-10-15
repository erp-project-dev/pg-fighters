import Phaser from 'phaser';
import { CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS, tintOf, type FighterId } from '../data/fighters';
import { STAGES, type StageId } from '../data/stages';
import { Audio } from '../systems/Audio';
import { artScale } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import type { CpuLevel } from '../systems/Settings';
import { buildStage } from '../systems/StageArt';
import { fitText, goTo, pts, scanlines, text } from '../ui/ui';

const DURATION = 3000;

interface VersusData {
  p1: FighterId;
  p2: FighterId;
  stage?: StageId;
  story?: boolean;
  difficulty?: CpuLevel;
}

/** Pantalla VS: los dos luchadores entran desde los lados y choca el "VS". */
export class VersusScene extends Phaser.Scene {
  private input2!: Input;
  private data0!: VersusData;

  constructor() {
    super(SCENES.Versus);
  }

  create(data: VersusData) {
    this.data0 = data;
    this.cameras.main.fadeIn(200, 11, 10, 14);
    Audio.stopMusic(600);
    const stage = STAGES[data.stage ?? 'barrio'];
    buildStage(this, stage, false);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0a0e, 0.85).setOrigin(0);
    this.input2 = new Input(this);

    const defs = [FIGHTERS[data.p1], FIGHTERS[data.p2]];
    // Dos mitades en diagonal con el color de cada luchador.
    const g = this.add.graphics();
    const skew = 140;
    g.fillStyle(defs[0].color, 0.28).fillPoints(pts([{ x: 0, y: 0 }, { x: GAME_WIDTH / 2 + skew, y: 0 }, { x: GAME_WIDTH / 2 - skew, y: GAME_HEIGHT }, { x: 0, y: GAME_HEIGHT }]), true);
    g.fillStyle(defs[1].color, 0.28).fillPoints(pts([{ x: GAME_WIDTH / 2 + skew, y: 0 }, { x: GAME_WIDTH, y: 0 }, { x: GAME_WIDTH, y: GAME_HEIGHT }, { x: GAME_WIDTH / 2 - skew, y: GAME_HEIGHT }]), true);
    g.lineStyle(10, 0xffffff, 0.9).lineBetween(GAME_WIDTH / 2 + skew, 0, GAME_WIDTH / 2 - skew, GAME_HEIGHT);

    defs.forEach((def, i) => {
      const left = i === 0;
      const x = left ? 520 : GAME_WIDTH - 520;
      const fig = this.add.image(left ? -400 : GAME_WIDTH + 400, GAME_HEIGHT + 30, def.art.texture, `${def.art.prefix}idle`);
      fig.setScale(artScale(this, def) * 1.75).setFlipX(!left).setTint(tintOf(def));
      this.tweens.add({ targets: fig, x, duration: 450, delay: 100 + i * 150, ease: 'Cubic.easeOut' });
      const nx = left ? 70 : GAME_WIDTH - 70;
      const name = fitText(text(this, nx, 150, def.name, { size: 130, italic: true, weight: '900', origin: [left ? 0 : 1, 0.5], stroke: '#000000' }), 800, 70);
      const tag = fitText(text(this, nx, 240, def.tag, { size: 32, weight: '800', color: def.css, origin: [left ? 0 : 1, 0.5], spacing: 4, shadow: true }), 800, 20);
      const quote = text(this, nx, 280, `"${data.story && !left ? def.hater : def.intro}"`, { size: 30, font: 'body', weight: '600', color: CSS.cream, origin: [left ? 0 : 1, 0], shadow: true, wrap: 720, align: left ? 'left' : 'right' });
      for (const [k, t] of [name, tag, quote].entries()) {
        t.setAlpha(0).x += left ? -80 : 80;
        this.tweens.add({ targets: t, alpha: 1, x: t.x + (left ? 80 : -80), duration: 300, delay: 350 + i * 150 + k * 80, ease: 'Cubic.easeOut' });
      }
    });

    const vs = text(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 'VS', { size: 300, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], stroke: '#000000' });
    vs.setShadow(14, 14, '#000000', 0, true, true).setScale(4).setAlpha(0);
    this.tweens.add({
      targets: vs, scale: 1, alpha: 1, duration: 260, delay: 650, ease: 'Quad.easeIn',
      onComplete: () => {
        this.cameras.main.shake(260, 0.012);
        Audio.sfx(this, 'kick', 0.9, 0.7);
        Audio.tone(this, 80, 0.6, 'sawtooth', 0.08);
      },
    });
    text(this, GAME_WIDTH / 2, GAME_HEIGHT - 60, `STAGE ${stage.number}  ·  ${stage.name}  ·  ${stage.place}`, { size: 30, weight: '700', origin: [0.5, 0.5], spacing: 6, shadow: true });
    scanlines(this, 0.06);

    this.time.delayedCall(DURATION, () => this.go());
  }

  private go(): void {
    goTo(this, SCENES.Fight, this.data0, 350);
  }

  update() {
    if (this.input2.justDown('confirm')) this.go();
  }
}
