import Phaser from 'phaser';
import { COLORS, CSS, GAME_WIDTH, SCENES } from '../config';
import { Input } from '../systems/Input';
import { footer, goTo, stageBackdrop, text } from '../ui/ui';

/** Texto del aviso (también va en los créditos). */
export const DISCLAIMER = [
  'PG Fighters es una obra de ficción paródica, sin fines de lucro. Sus personajes, nombres e historias son ficticios, y cualquier parecido con personas reales, vivas o fallecidas, o con hechos reales es pura coincidencia. Nada de su contenido constituye una afirmación de hecho sobre persona alguna ni pretende ofender, difamar o afectar el honor o la reputación de nadie.',
];

/** Se lee unos segundos antes del título, una vez por sesión. ENTER o clic para seguir. */
const SHOW_MS = 10000;

export class DisclaimerScene extends Phaser.Scene {
  private input2!: Input;
  private leaving = false;

  constructor() {
    super(SCENES.Disclaimer);
  }

  create() {
    this.leaving = false;
    this.cameras.main.setBackgroundColor(CSS.dark);
    this.cameras.main.fadeIn(500, 11, 10, 14);
    this.input2 = new Input(this);
    const cx = GAME_WIDTH / 2;
    stageBackdrop(this, 0.55, 'game-cover');
    const frame = this.add.graphics();
    text(this, cx, 350, 'AVISO LEGAL', { size: 64, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], spacing: 8 });
    let y = 430;
    for (const line of DISCLAIMER) {
      const t = text(this, cx, y, line, { size: 34, font: 'body', weight: '500', color: CSS.cream, origin: [0.5, 0], align: 'center', wrap: 1300 });
      y += t.height - (t.padding.top ?? 0) * 2 + 26;
    }
    // Marco alrededor del aviso: panel oscuro con borde lima y esquinas marcadas.
    const w = 1460;
    const top = 280;
    const h = y - top + 20;
    const left = cx - w / 2;
    frame.fillStyle(COLORS.panel, 0.8).fillRect(left, top, w, h);
    frame.lineStyle(4, COLORS.lime, 1).strokeRect(left, top, w, h);
    frame.lineStyle(2, COLORS.lime, 0.35).strokeRect(left + 14, top + 14, w - 28, h - 28);
    for (const [x, yy, dx, dy] of [[left, top, 1, 1], [left + w, top, -1, 1], [left, top + h, 1, -1], [left + w, top + h, -1, -1]] as const) {
      frame.fillStyle(COLORS.lime, 1).fillRect(x - (dx < 0 ? 40 : 0), yy - (dy < 0 ? 10 : 0), 40, 10).fillRect(x - (dx < 0 ? 10 : 0), yy - (dy < 0 ? 40 : 0), 10, 40);
    }
    footer(this, 'ENTER  CONTINUAR');
    this.time.delayedCall(SHOW_MS, () => this.leave());
    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => this.leave());
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    goTo(this, SCENES.Title, {}, 400);
  }

  update() {
    if (this.input2.justDown('confirm') || this.input2.justDown('back')) this.leave();
  }
}
