import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, ROUNDS_TO_WIN, SCENES } from '../config';
import { MAX_METER, type Fighter } from '../entities/Fighter';
import { addPortrait } from '../systems/FighterArt';
import { bottomOf, fitText, keycap, pts, text } from '../ui/ui';
import { Audio } from '../systems/Audio';
import type { DialogLine } from '../data/dialogs';
import type { FightScene } from './FightScene';

/** Layout superior: [retrato] [barra de vida] [reloj] [barra de vida] [retrato], con márgenes fijos. */
const GAP = 20;
const PORTRAIT = 104;
const PORTRAIT_X = 24;
const PORTRAIT_Y = 20;
const TIMER_W = 150;
const TIMER_H = 110;
const TIMER_Y = 18;
const SLANT = 18;
const BAR_H = 38;
const BAR_Y = 34;
/** Inicio de la barra de P1 (borde exterior) y ancho útil hasta el reloj. */
const BAR_X = PORTRAIT_X + PORTRAIT + GAP;
const BAR_W = GAME_WIDTH / 2 - TIMER_W / 2 - GAP - BAR_X - SLANT;
const NAME_Y = BAR_Y + BAR_H + 30;
const METER_W = 420;
const METER_Y = GAME_HEIGHT - 52;

interface AnnounceOpts {
  color?: string;
  size?: number;
  ms?: number;
  sub?: string;
}

/** Interfaz de la pelea en su propia escena (no la sacude la cámara del combate). */
export class HudScene extends Phaser.Scene {
  private fight!: FightScene;
  private g!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private meterLabels: Phaser.GameObjects.Text[] = [];
  private comboTexts: Phaser.GameObjects.Text[] = [];
  private announceGroup: Phaser.GameObjects.Text[] = [];
  /** Vida mostrada con retraso (barra roja de daño reciente). */
  private trail = [1000, 1000];
  private trailHold = [0, 0];
  /** Aviso "PULSA E" junto a la barra del jugador (late mientras el súper está listo). */
  private superPrompt!: Phaser.GameObjects.Container;
  private superFull = [false, false];
  /** Diálogo antes del ROUND 1. */
  private dialog: {
    lines: DialogLine[];
    index: number;
    lineStart: number;
    doneAt: number;
    body: Phaser.GameObjects.Text | null;
    hint: Phaser.GameObjects.Text | null;
    objs: Phaser.GameObjects.GameObject[];
    onDone: () => void;
  } | null = null;

  constructor() {
    super(SCENES.Hud);
  }

  init(data: { fight: FightScene }) {
    this.fight = data.fight;
    this.trail = [1000, 1000];
    this.announceGroup = [];
    this.comboTexts = [];
    this.meterLabels = [];
    this.superFull = [false, false];
    this.dialog = null;
  }

  create() {
    const f = this.fight;
    const top = this.add.graphics();
    top.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0).fillRect(0, 0, GAME_WIDTH, 200);
    this.g = this.add.graphics();

    for (const fighter of [f.p1, f.p2]) {
      const left = fighter.side === 0;
      const px = left ? PORTRAIT_X + PORTRAIT / 2 : GAME_WIDTH - PORTRAIT_X - PORTRAIT / 2;
      const py = PORTRAIT_Y + PORTRAIT / 2;
      const frame = this.add.graphics();
      frame.fillStyle(COLORS.panel, 1).fillRect(px - PORTRAIT / 2, PORTRAIT_Y, PORTRAIT, PORTRAIT);
      addPortrait(this, fighter.def, px, py, PORTRAIT - 4, !left);
      const border = this.add.graphics();
      border.lineStyle(3, fighter.def.color, 1).strokeRect(px - PORTRAIT / 2, PORTRAIT_Y, PORTRAIT, PORTRAIT);
      // Insignia 1P / CPU sobre el borde inferior del retrato.
      border.fillStyle(left ? COLORS.lime : COLORS.grey, 1).fillRect(px - 30, PORTRAIT_Y + PORTRAIT - 12, 60, 24);
      text(this, px, PORTRAIT_Y + PORTRAIT, left ? '1P' : this.fight.cpuBadge, { size: 20, weight: '900', color: CSS.dark, origin: [0.5, 0.5], spacing: 1 });
      const nameX = left ? BAR_X + 4 : GAME_WIDTH - BAR_X - 4;
      text(this, nameX, NAME_Y, fighter.def.name, { size: 38, italic: true, weight: '900', origin: [left ? 0 : 1, 0.5], shadow: true });
      this.meterLabels.push(text(this, left ? 60 : GAME_WIDTH - 60, METER_Y - 34, 'ULTIMATE', { size: 24, weight: '800', italic: true, origin: [left ? 0 : 1, 0.5], spacing: 2, shadow: true }));
      const comboX = this.fight.training ? 260 : 120;
      this.comboTexts.push(text(this, left ? comboX : GAME_WIDTH - comboX, 330, '', { size: 96, italic: true, weight: '900', color: CSS.lime, origin: [left ? 0 : 1, 0.5], stroke: '#000000' }).setAlpha(0));
    }

    // Tecla E gigante sobre la barra ULTIMATE del jugador.
    const cap = keycap(this, 0, 0, 'E', 46, COLORS.lime).container;
    const glow = this.add.graphics();
    glow.fillStyle(COLORS.lime, 0.25).fillCircle(0, 0, 70);
    const label = text(this, 64, -2, '¡ULTIMATE!', { size: 46, italic: true, weight: '900', color: CSS.lime, origin: [0, 0.5], stroke: '#000000' });
    this.superPrompt = this.add.container(110, METER_Y - 70, [glow, cap, label]).setVisible(false).setDepth(10);
    this.tweens.add({ targets: this.superPrompt, scale: 1.12, duration: 320, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: glow, alpha: 0.2, duration: 320, yoyo: true, repeat: -1 });

    const cx = GAME_WIDTH / 2;
    const box = this.add.graphics();
    box.fillStyle(COLORS.bg, 0.92).fillRect(cx - TIMER_W / 2, TIMER_Y, TIMER_W, TIMER_H);
    box.lineStyle(3, COLORS.lime, 1).strokeRect(cx - TIMER_W / 2, TIMER_Y, TIMER_W, TIMER_H);
    this.timerText = text(this, cx, TIMER_Y + TIMER_H / 2 - 2, '60', { size: 88, weight: '900', color: CSS.lime, origin: [0.5, 0.5] });
    this.roundText = text(this, cx, TIMER_Y + TIMER_H + 22, 'ROUND 1', { size: 24, weight: '700', origin: [0.5, 0.5], spacing: 3 });
  }

  update(_t: number, delta: number) {
    const f = this.fight;
    if (!f?.p1) return;
    const g = this.g;
    g.clear();
    const now = this.time.now;
    this.updateDialog(now);

    [f.p1, f.p2].forEach((fighter, i) => this.drawFighter(g, fighter, i, now, delta));

    const secs = Math.ceil(f.timer);
    this.timerText.setText(f.training ? '∞' : String(secs).padStart(2, '0'));
    this.timerText.setColor(!f.training && secs <= 10 && Math.floor(now / 250) % 2 === 0 ? CSS.red : CSS.lime);
    this.roundText.setText(f.training ? 'PRÁCTICA' : `ROUND ${f.round}`);
  }

  private drawFighter(g: Phaser.GameObjects.Graphics, fighter: Fighter, i: number, now: number, delta: number): void {
    const left = i === 0;
    // P1 se inclina hacia la derecha y P2 en espejo; ambas terminan a GAP px del reloj.
    const x0 = left ? BAR_X : GAME_WIDTH - BAR_X - BAR_W - SLANT;
    const hp = fighter.hp / fighter.maxHp;
    // La barra roja alcanza a la vida real tras un momento.
    if (fighter.hp < this.trail[i]) {
      if (now > this.trailHold[i]) this.trail[i] = Math.max(fighter.hp, this.trail[i] - delta * 0.6);
    } else this.trail[i] = fighter.hp;
    const trail = this.trail[i] / fighter.maxHp;

    const shape = (x: number, w: number) => left
      ? [{ x: x + SLANT, y: BAR_Y }, { x: x + w + SLANT, y: BAR_Y }, { x: x + w, y: BAR_Y + BAR_H }, { x, y: BAR_Y + BAR_H }]
      : [{ x, y: BAR_Y }, { x: x + w, y: BAR_Y }, { x: x + w + SLANT, y: BAR_Y + BAR_H }, { x: x + SLANT, y: BAR_Y + BAR_H }];
    const para = (x: number, w: number, color: number, alpha = 1) => {
      if (w <= 0) return;
      g.fillStyle(color, alpha);
      g.fillPoints(pts(shape(x, w)), true);
    };
    // Marco
    para(x0 - 6, BAR_W + 12, 0x000000, 0.85);
    para(x0, BAR_W, 0x3a2622, 1);
    // La vida se vacía hacia el centro (como los clásicos): P1 desde la derecha, P2 desde la izquierda.
    const low = hp < 0.3;
    const color = low && Math.floor(now / 160) % 2 === 0 ? COLORS.rust : low ? COLORS.red : COLORS.lime;
    if (left) {
      para(x0, BAR_W * trail, 0xff2d45, 0.9);
      para(x0, BAR_W * hp, color);
      para(x0, BAR_W * hp, 0xffffff, 0.18);
    } else {
      para(x0 + BAR_W * (1 - trail), BAR_W * trail, 0xff2d45, 0.9);
      para(x0 + BAR_W * (1 - hp), BAR_W * hp, color);
      para(x0 + BAR_W * (1 - hp), BAR_W * hp, 0xffffff, 0.18);
    }
    g.fillStyle(0xffffff, 0.25).fillRect(x0 + SLANT, BAR_Y + 4, BAR_W - SLANT, 3);
    g.lineStyle(3, COLORS.cream, 0.9).strokePoints(pts(shape(x0, BAR_W)), true);

    // Rondas ganadas: bajo la barra, del lado del reloj.
    for (let r = 0; r < ROUNDS_TO_WIN; r++) {
      const inner = left ? x0 + BAR_W - 16 : x0 + SLANT + 16;
      const wx = inner + (left ? -1 : 1) * r * 36;
      const won = r < this.fight.wins[i];
      g.fillStyle(won ? COLORS.lime : 0x000000, won ? 1 : 0.6).fillCircle(wx, NAME_Y, 12);
      g.lineStyle(3, won ? 0xffffff : COLORS.grey, 1).strokeCircle(wx, NAME_Y, 12);
    }

    // Súper barra
    const mx = left ? 60 : GAME_WIDTH - 60 - METER_W;
    const m = fighter.meter / MAX_METER;
    const full = fighter.meter >= MAX_METER;
    g.fillStyle(0x000000, 0.75).fillRect(mx - 4, METER_Y - 4, METER_W + 8, 30);
    g.fillStyle(0x24232a, 1).fillRect(mx, METER_Y, METER_W, 22);
    if (full) {
      // Barra llena: halo que late, color de lima y un destello que la recorre.
      const pulse = 0.5 + Math.sin(now / 110) * 0.5;
      for (let k = 3; k >= 1; k--) g.lineStyle(k * 5, COLORS.lime, 0.12 * pulse).strokeRect(mx - 4 - k * 3, METER_Y - 4 - k * 3, METER_W + 8 + k * 6, 30 + k * 6);
      g.fillStyle(COLORS.lime, 1).fillRect(mx, METER_Y, METER_W, 22);
      const sx = mx + ((now * 0.9) % (METER_W + 160)) - 80;
      g.fillStyle(0xffffff, 0.75).fillPoints(pts([
        { x: Math.max(mx, sx), y: METER_Y }, { x: Math.min(mx + METER_W, sx + 50), y: METER_Y },
        { x: Math.min(mx + METER_W, sx + 30), y: METER_Y + 22 }, { x: Math.max(mx, sx - 20), y: METER_Y + 22 },
      ]), true);
    } else if (left) g.fillStyle(fighter.def.color, 1).fillRect(mx, METER_Y, METER_W * m, 22);
    else g.fillStyle(fighter.def.color, 1).fillRect(mx + METER_W * (1 - m), METER_Y, METER_W * m, 22);
    for (let k = 1; k < 4; k++) g.fillStyle(0x000000, 0.5).fillRect(mx + (METER_W * k) / 4, METER_Y, 2, 22);
    // Recarga del poder básico: barra delgada debajo de la ULTIMATE, del color del luchador.
    const pc = fighter.powerCharge;
    const py = METER_Y + 28;
    g.fillStyle(0x000000, 0.7).fillRect(mx - 2, py - 2, METER_W + 4, 9);
    g.fillStyle(0x24232a, 1).fillRect(mx, py, METER_W, 5);
    const pw = METER_W * pc;
    g.fillStyle(pc >= 1 ? 0xffffff : fighter.def.color, pc >= 1 ? 0.9 : 0.75).fillRect(left ? mx : mx + METER_W - pw, py, pw, 5);
    this.meterLabels[i].setText(full ? (left ? '' : '¡CPU CON ULTIMATE!') : 'ULTIMATE').setColor(full ? CSS.lime : CSS.cream);

    // Al llenarse: aviso grande (para el jugador) y sonido.
    if (full && !this.superFull[i]) this.superReady(fighter);
    this.superFull[i] = full;
    if (left) this.superPrompt.setVisible(full && this.fight.phase === 'fight');
  }

  private superReady(fighter: Fighter): void {
    const left = fighter.side === 0;
    Audio.tone(this, left ? 660 : 330, 0.18, 'square', 0.04);
    this.time.delayedCall(90, () => Audio.tone(this, left ? 990 : 440, 0.25, 'square', 0.04));
    if (!left) return;
    const y = GAME_HEIGHT * 0.68;
    const band = this.add.graphics().setDepth(20);
    band.fillStyle(COLORS.lime, 1).fillPoints(pts([{ x: 0, y: y - 46 }, { x: 900, y: y - 46 }, { x: 860, y: y + 46 }, { x: 0, y: y + 46 }]), true);
    const msg = text(this, 40, y, '¡ULTIMATE LISTO!  PULSA', { size: 64, italic: true, weight: '900', color: CSS.dark, origin: [0, 0.5] }).setDepth(21);
    const cap = keycap(this, 0, y, 'E', 40, 0x000000).container.setDepth(21);
    cap.x = 40 + msg.width - (msg.padding.left ?? 0) * 2 + 50;
    const group = [band, msg, cap];
    for (const o of group) (o as Phaser.GameObjects.Components.Transform).x -= 960;
    this.tweens.add({ targets: group, x: '+=960', duration: 220, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: cap, scale: 1.2, duration: 200, yoyo: true, repeat: 3, delay: 220 });
    this.time.delayedCall(1500, () => {
      this.tweens.add({ targets: group, x: '-=960', alpha: 0, duration: 220, ease: 'Cubic.easeIn', onComplete: () => group.forEach((o) => o.destroy()) });
    });
  }

  // ───────────────────────────── Diálogo previo ─────────────────────────────

  get dialogActive(): boolean {
    return this.dialog !== null;
  }

  /** Muestra las líneas una tras otra en globos del lado de quien habla. */
  startDialog(lines: DialogLine[], onDone: () => void): void {
    if (!lines.length || !this.sys.isActive()) {
      onDone();
      return;
    }
    this.dialog = { lines, index: 0, lineStart: 0, doneAt: 0, body: null, hint: null, objs: [], onDone };
    this.showLine();
  }

  /** ENTER: termina de escribir la línea o pasa a la siguiente. */
  dialogAdvance(): void {
    const d = this.dialog;
    if (!d) return;
    if (!d.doneAt) {
      d.lineStart = -1e9; // completa el texto en el próximo frame
      return;
    }
    d.index++;
    if (d.index >= d.lines.length) this.endDialog();
    else this.showLine();
  }

  dialogSkip(): void {
    this.endDialog();
  }

  private endDialog(): void {
    const d = this.dialog;
    if (!d) return;
    this.dialog = null;
    const objs = d.objs;
    this.tweens.add({ targets: objs, alpha: 0, duration: 160, onComplete: () => objs.forEach((o) => o.destroy()) });
    d.onDone();
  }

  private showLine(): void {
    const d = this.dialog!;
    for (const o of d.objs) o.destroy();
    d.objs = [];
    const line = d.lines[d.index];
    const f = this.fight;
    const speaker = f.p1.def.id === line.speaker ? f.p1 : f.p2;
    const left = speaker.side === 0;
    const W = 880;
    const x = left ? 60 : GAME_WIDTH - 60 - W;
    const y = 210;
    const tx0 = left ? x + 190 : x + 30;
    // La línea se mide completa antes de escribirse: hasta 3 líneas (achicando la letra) y el globo crece si hace falta.
    const body = text(this, tx0, y + 66, line.text, { size: 44, weight: '800', origin: [0, 0], wrap: W - 230 }).setDepth(31);
    fitText(body, W - 230, 32, 150);
    const H = Math.max(180, bottomOf(body) - y + 26);
    body.setText('');
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0x000000, 0.88).fillRect(x, y, W, H);
    g.lineStyle(4, speaker.def.color, 1).strokeRect(x, y, W, H);
    // Cola del globo hacia el personaje que habla.
    const tx = Phaser.Math.Clamp(speaker.x, x + 60, x + W - 60);
    g.fillStyle(0x000000, 0.88).fillTriangle(tx - 26, y + H, tx + 26, y + H, tx + (left ? 10 : -10), y + H + 46);
    g.lineStyle(4, speaker.def.color, 1).lineBetween(tx - 26, y + H, tx + (left ? 10 : -10), y + H + 46).lineBetween(tx + 26, y + H, tx + (left ? 10 : -10), y + H + 46);
    g.fillStyle(0x000000, 1).fillRect(tx - 24, y + H - 3, 48, 6);
    const px = left ? x + 90 : x + W - 90;
    const face = addPortrait(this, speaker.def, px, y + H / 2, 140, !left).setDepth(31);
    const frame = this.add.graphics().setDepth(32);
    frame.lineStyle(3, speaker.def.color, 1).strokeRect(px - 70, y + H / 2 - 70, 140, 140);
    const name = text(this, tx0, y + 34, speaker.def.name, { size: 34, italic: true, weight: '900', color: speaker.def.css, origin: [0, 0.5], spacing: 1 }).setDepth(31);
    const hint = text(this, left ? x + W - 24 : x + W - 190, y + H - 26, '▶ ENTER', { size: 20, weight: '800', color: CSS.lime, origin: [1, 0.5], spacing: 2 }).setDepth(31).setVisible(false);
    d.objs = [g, face, frame, name, body, hint];
    d.body = body;
    d.hint = hint;
    d.lineStart = this.time.now;
    d.doneAt = 0;
    for (const o of d.objs) (o as unknown as Phaser.GameObjects.Components.AlphaSingle).setAlpha?.(0);
    this.tweens.add({ targets: d.objs, alpha: 1, duration: 140 });
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
    Audio.tone(this, left ? 520 : 440, 0.08, 'square', 0.03);
  }

  private updateDialog(now: number): void {
    const d = this.dialog;
    if (!d?.body) return;
    const full = d.lines[d.index].text;
    const chars = Math.min(full.length, Math.floor((now - d.lineStart) / 34));
    if (d.body.text.length !== chars) {
      d.body.setText(full.slice(0, chars));
      if (chars % 3 === 0 && chars < full.length) Audio.tone(this, 760 + (chars % 5) * 40, 0.025, 'square', 0.012);
    }
    if (chars >= full.length && !d.doneAt) {
      d.doneAt = now;
      d.hint?.setVisible(true);
    }
    // Si nadie toca nada, avanza solo.
    if (d.doneAt && now - d.doneAt > 1900) this.dialogAdvance();
  }

  /** Texto grande centrado (ROUND 1, ¡PELEA!, K.O.). */
  announce(str: string, o: AnnounceOpts = {}): void {
    if (!this.sys.isActive()) return;
    for (const t of this.announceGroup) t.destroy();
    this.announceGroup = [];
    const cy = GAME_HEIGHT * 0.4;
    const main = text(this, GAME_WIDTH / 2, cy, str, { size: o.size ?? 190, italic: true, weight: '900', color: o.color ?? CSS.lime, origin: [0.5, 0.5], stroke: '#000000' });
    main.setShadow(10, 10, '#000000', 0, true, true);
    this.announceGroup.push(main);
    main.setScale(1.8).setAlpha(0);
    this.tweens.add({ targets: main, scale: 1, alpha: 1, duration: 180, ease: 'Back.easeOut' });
    if (o.sub) {
      const sub = text(this, GAME_WIDTH / 2, cy + (o.size ?? 190) * 0.62, o.sub, { size: 70, italic: true, weight: '900', color: CSS.white, origin: [0.5, 0.5], glow: CSS.lime });
      sub.setAlpha(0);
      this.tweens.add({ targets: sub, alpha: 1, duration: 200, delay: 250 });
      this.announceGroup.push(sub);
    }
    const group = [...this.announceGroup];
    this.time.delayedCall(o.ms ?? 1000, () => {
      this.tweens.add({ targets: group, alpha: 0, duration: 200, onComplete: () => group.forEach((t) => t.destroy()) });
    });
  }

  combo(side: 0 | 1, hits: number): void {
    if (!this.sys.isActive()) return;
    const t = this.comboTexts[side];
    t.setText(`${hits} HITS`).setAlpha(1).setScale(1.4);
    this.tweens.killTweensOf(t);
    this.tweens.add({ targets: t, scale: 1, duration: 140, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, delay: 1100, duration: 250 });
  }

  /** Número de daño flotante (pequeño), útil para sentir cada golpe. */
  damage(side: 0 | 1, amount: number): void {
    if (!this.sys.isActive() || amount <= 0) return;
    this.trailHold[side] = this.time.now + 450;
  }
}
