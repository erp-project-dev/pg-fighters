import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS, type FighterId } from '../data/fighters';
import { STAGES } from '../data/stages';
import { CLUES } from '../data/story';
import { Audio, MUSIC } from '../systems/Audio';
import { addPortrait, bustKey } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import { BOSS, StoryRun } from '../systems/StoryRun';
import { bottomOf, fitText, footer, goTo, scanlines, speedStripes, stageBackdrop, text } from '../ui/ui';

const TILE = 150;
const TILE_GAP = 12;
const GRID_X = 70;
const GRID_Y = 250;
const COLS = 4;
const CLUE_X = 790;
const CLUE_W = 1070;
const TYPE_MS = 26;

/**
 * "EXPEDIENTE ACOPLE": progreso del modo historia. Si viene de una victoria, primero muestra al amigo
 * liberado con su disculpa; luego la red de amigos (hater / liberado) y las pistas sobre la entidad.
 */
export class StoryProgressScene extends Phaser.Scene {
  private input2!: Input;
  private justFreed: FighterId | null = null;
  private step: 'liberation' | 'file' = 'file';
  private layer: Phaser.GameObjects.GameObject[] = [];
  private typing: { t: Phaser.GameObjects.Text; full: string; start: number } | null = null;
  private leaving = false;

  constructor() {
    super(SCENES.StoryProgress);
  }

  init(data: { justFreed?: FighterId }) {
    this.justFreed = data?.justFreed ?? null;
    this.step = this.justFreed ? 'liberation' : 'file';
    this.layer = [];
    this.typing = null;
    this.leaving = false;
  }

  create() {
    if (!StoryRun.state) {
      this.scene.start(SCENES.Title, { skipPress: true });
      return;
    }
    this.cameras.main.fadeIn(300, 11, 10, 14);
    Audio.music(this, MUSIC.menu, 0.32);
    stageBackdrop(this, 0.86);
    speedStripes(this, 0x7a2bd6, 0.035);
    this.input2 = new Input(this);
    footer(this, 'ENTER  CONTINUAR      ESC  MENÚ (SE GUARDA)');
    scanlines(this, 0.05);
    if (this.step === 'liberation') this.showLiberation();
    else this.showFile();
  }

  private add2<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.layer.push(o);
    return o;
  }

  private clearLayer(): void {
    for (const o of this.layer) o.destroy();
    this.layer = [];
    this.typing = null;
  }

  private type(t: Phaser.GameObjects.Text, full: string): void {
    t.setText(full);
    this.typing = { t, full, start: this.time.now };
    t.setText('');
  }

  // ───────────────────────────── Liberación ─────────────────────────────

  private showLiberation(): void {
    const def = FIGHTERS[this.justFreed!];
    const cx = GAME_WIDTH / 2;
    const bust = bustKey(this, def);
    if (bust) {
      const img = this.add2(this.add.image(560, 900, bust).setOrigin(0.5, 1));
      img.setScale(620 / img.frame.realHeight);
      img.setTint(0x5b3a7a);
      this.tweens.addCounter({ from: 0, to: 1, duration: 700, onUpdate: (tw) => img.setTint(Phaser.Display.Color.GetColor(
        Math.round(0x5b + (0xff - 0x5b) * tw.getValue()!), Math.round(0x3a + (0xff - 0x3a) * tw.getValue()!), Math.round(0x7a + (0xff - 0x7a) * tw.getValue()!))) });
    } else {
      this.add2(addPortrait(this, def, 560, 560, 460));
    }
    const stamp = this.add2(text(this, 560, 300, '¡LIBERADO!', { size: 110, italic: true, weight: '900', color: '#4dff88', origin: [0.5, 0.5], stroke: '#000000' }));
    stamp.setAngle(-8).setScale(2.4).setAlpha(0);
    this.tweens.add({ targets: stamp, scale: 1, alpha: 1, duration: 260, delay: 500, ease: 'Back.easeOut', onStart: () => {
      this.cameras.main.shake(180, 0.006);
      Audio.tone(this, 660, 0.2, 'square', 0.05);
      this.time.delayedCall(100, () => Audio.tone(this, 990, 0.3, 'square', 0.05));
    } });

    const g = this.add2(this.add.graphics());
    g.fillStyle(0x000000, 0.82).fillRect(cx + 40, 380, 860, 300);
    g.lineStyle(3, def.color, 1).strokeRect(cx + 40, 380, 860, 300);
    this.add2(text(this, cx + 80, 420, def.name, { size: 44, italic: true, weight: '900', color: def.css, origin: [0, 0.5] }));
    this.add2(text(this, cx + 80, 466, 'VUELVE A SER ÉL MISMO', { size: 22, weight: '800', color: CSS.grey, origin: [0, 0.5], spacing: 3 }));
    const line = this.add2(text(this, cx + 80, 500, `«${def.freed}»`, { size: 40, weight: '800', origin: [0, 0], wrap: 780 }));
    fitText(line, 780, 26, 160);
    this.showFightScore(cx + 40, 710, 860);
    // Si ya se pasó a la siguiente pantalla, el texto ya no existe.
    this.time.delayedCall(700, () => { if (line.active && this.step === 'liberation') this.type(line, `«${def.freed}»`); });
  }

  /** Desglose del puntaje de la pelea recién ganada. */
  private showFightScore(x: number, y: number, w: number): void {
    const s = StoryRun.state!;
    const fight = s.lastFight;
    if (!fight) return;
    const g = this.add2(this.add.graphics());
    g.fillStyle(0x000000, 0.82).fillRect(x, y, w, 265);
    g.lineStyle(3, COLORS.lime, 1).strokeRect(x, y, w, 265);
    this.add2(text(this, x + 40, y + 34, 'PUNTOS DE LA PELEA', { size: 28, italic: true, weight: '900', color: CSS.lime, origin: [0, 0.5], spacing: 2 }));
    if (fight.multiplier > 1) {
      this.add2(text(this, x + w - 40, y + 34, `DIFICULTAD ×${fight.multiplier}`, { size: 24, weight: '900', color: CSS.rust, origin: [1, 0.5], spacing: 2 }));
    }
    fight.lines.forEach(([label, pts], i) => {
      const lx = x + 40 + (i % 2) * (w / 2 - 20);
      const ly = y + 78 + Math.floor(i / 2) * 32;
      this.add2(text(this, lx, ly, label, { size: 20, weight: '700', color: CSS.grey, origin: [0, 0.5], spacing: 1 }));
      this.add2(text(this, lx + w / 2 - 80, ly, `+${pts.toLocaleString('es-PE')}`, { size: 22, weight: '800', origin: [1, 0.5] }));
    });
    const gain = this.add2(text(this, x + 40, y + 222, `+${fight.total.toLocaleString('es-PE')}`, { size: 64, italic: true, weight: '900', color: CSS.lime, origin: [0, 0.5], shadow: true }));
    gain.setScale(1.6).setAlpha(0);
    this.tweens.add({ targets: gain, scale: 1, alpha: 1, duration: 280, delay: 900, ease: 'Back.easeOut' });
    this.add2(text(this, x + w - 40, y + 222, `TOTAL  ${s.score.toLocaleString('es-PE')}`, { size: 36, weight: '900', origin: [1, 0.5], spacing: 2 }));
  }

  // ───────────────────────────── Expediente ─────────────────────────────

  private showFile(): void {
    const run = StoryRun;
    const s = run.state!;
    const friends = run.opponents.filter((id) => id !== BOSS);
    const freed = new Set(s.freed);

    this.add2(text(this, GRID_X, 120, 'EXPEDIENTE ACOPLE', { size: 72, italic: true, weight: '900', color: CSS.lime, origin: [0, 0.5], shadow: true }));
    this.add2(text(this, CLUE_X + CLUE_W + 24, 120, `${s.name ? `${s.name}  ·  ` : ''}PUNTAJE ${s.score.toLocaleString('es-PE')}`, { size: 36, italic: true, weight: '900', origin: [1, 0.5], spacing: 2 }));
    // Barra de amigos liberados
    const bar = this.add2(this.add.graphics());
    const total = friends.length;
    bar.fillStyle(0x2a2930, 1).fillRect(GRID_X, 175, 640, 18);
    bar.fillStyle(0x4dff88, 1).fillRect(GRID_X, 175, (640 * s.freed.length) / total, 18);
    this.add2(text(this, GRID_X + 660, 184, `AMIGOS LIBERADOS ${s.freed.length}/${total}`, { size: 24, weight: '800', origin: [0, 0.5], spacing: 2 }));

    // Red de amigos
    friends.forEach((id, i) => {
      const def = FIGHTERS[id];
      const x = GRID_X + (i % COLS) * (TILE + TILE_GAP) + TILE / 2;
      const y = GRID_Y + Math.floor(i / COLS) * (TILE + TILE_GAP) + TILE / 2;
      const isFree = freed.has(id);
      const isNext = !isFree && i === s.index;
      const g = this.add2(this.add.graphics());
      g.fillStyle(COLORS.panel, 1).fillRect(x - TILE / 2, y - TILE / 2, TILE, TILE);
      this.add2(addPortrait(this, def, x, y, TILE - 8));
      const over = this.add2(this.add.graphics());
      if (!isFree) over.fillStyle(0x2a0a40, 0.62).fillRect(x - TILE / 2, y - TILE / 2, TILE, TILE);
      over.lineStyle(isNext ? 6 : 2, isNext ? COLORS.lime : isFree ? 0x4dff88 : 0x6a1b9a, 1).strokeRect(x - TILE / 2, y - TILE / 2, TILE, TILE);
      const label = isFree ? 'LIBERADO' : isNext ? 'SIGUIENTE' : 'HATER';
      const color = isFree ? '#4dff88' : isNext ? CSS.lime : '#ff3b6b';
      const stamp = this.add2(text(this, x, y + TILE / 2 - 18, label, { size: 20, weight: '900', color, origin: [0.5, 0.5], stroke: '#000000', spacing: 2 }));
      if (id === this.justFreed) {
        stamp.setScale(2).setAlpha(0);
        this.tweens.add({ targets: stamp, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
      }
      if (isNext) this.tweens.add({ targets: over, alpha: 0.5, duration: 450, yoyo: true, repeat: -1 });
    });

    // Casilla del jefe: misterio hasta tener todas las pistas
    const known = s.freed.length >= total;
    const by = GRID_Y + Math.ceil(friends.length / COLS) * (TILE + TILE_GAP) + 8;
    const bw = COLS * (TILE + TILE_GAP) - TILE_GAP;
    const bg = this.add2(this.add.graphics());
    bg.fillStyle(known ? 0x06222a : 0x111015, 1).fillRect(GRID_X, by, bw, 110);
    bg.lineStyle(3, known ? 0x7df9ff : 0x3a3940, 1).strokeRect(GRID_X, by, bw, 110);
    this.add2(text(this, GRID_X + bw / 2, by + 55, known ? 'EL ACOPLE' : '? ? ?', { size: 64, italic: true, weight: '900', color: known ? '#7df9ff' : '#3a3940', origin: [0.5, 0.5], shadow: known }));

    // Pistas
    const p = this.add2(this.add.graphics());
    p.fillStyle(0x000000, 0.7).fillRect(CLUE_X - 24, GRID_Y - 24, CLUE_W + 48, 720);
    this.add2(text(this, CLUE_X, GRID_Y + 6, 'PISTAS', { size: 34, italic: true, weight: '900', color: CSS.lime, origin: [0, 0.5], spacing: 2 }));
    let y = GRID_Y + 40;
    CLUES.forEach((clue, i) => {
      const have = i < s.freed.length;
      const isNew = have && i === s.freed.length - 1 && !!this.justFreed;
      const t = this.add2(text(this, CLUE_X, y, have ? `${i + 1}. ${clue}` : `${i + 1}. ${'▒'.repeat(28)}`, {
        size: 21, font: 'body', weight: have ? '600' : '500', color: isNew ? CSS.lime : have ? CSS.cream : '#4a4942', origin: [0, 0], wrap: CLUE_W,
      }));
      y = bottomOf(t) + 8;
      if (isNew) this.type(t, `${i + 1}. ${clue}`);
    });

    // Próxima pelea
    if (!run.finished) {
      const opp = FIGHTERS[run.opponent];
      const stage = STAGES[run.stage];
      const next = run.isBossFight ? 'PELEA FINAL: EL ACOPLE  ·  EL INTERIOR DEL AMPLI' : `PRÓXIMA PELEA ${s.index + 1}/${total}:  ${opp.name}  ·  ${stage.name}`;
      fitText(this.add2(text(this, GAME_WIDTH / 2, GAME_HEIGHT - 118, next, { size: 34, weight: '900', italic: true, color: CSS.cream, origin: [0.5, 0.5], shadow: true })), GAME_WIDTH - 120, 20);
    }
  }

  private next(): void {
    if (this.leaving) return;
    if (this.typing && this.typing.t.text.length < this.typing.full.length) {
      this.typing.start = -1e9;
      return;
    }
    if (this.step === 'liberation') {
      this.step = 'file';
      this.clearLayer();
      this.showFile();
      return;
    }
    this.leaving = true;
    const run = StoryRun;
    if (run.isBossFight) goTo(this, SCENES.Story, { mode: 'reveal' }, 400);
    else goTo(this, SCENES.Versus, { p1: run.state!.player, p2: run.opponent, stage: run.stage, story: true, difficulty: run.difficulty }, 300);
  }

  update() {
    if (this.typing) {
      const { t, full, start } = this.typing;
      const n = Math.min(full.length, Math.max(0, Math.floor((this.time.now - start) / TYPE_MS)));
      if (t.text.length !== n) {
        t.setText(full.slice(0, n));
        if (n % 4 === 0 && n < full.length) Audio.tone(this, 820, 0.02, 'square', 0.01);
      }
    }
    if (this.leaving) return;
    if (this.input2.justDown('confirm')) this.next();
    if (this.input2.justDown('back')) {
      this.leaving = true;
      goTo(this, SCENES.Title, { skipPress: true });
    }
  }
}
