import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS, type FighterDef } from '../data/fighters';
import { STAGES } from '../data/stages';
import { EPILOGUES, FINALE } from '../data/story';
import { Audio, MUSIC } from '../systems/Audio';
import { addPortrait, artScale, bustKey } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import { Ranking } from '../systems/Ranking';
import { buildStage } from '../systems/StageArt';
import { StoryRun, drawRivals, type StoryState } from '../systems/StoryRun';
import { fitText, footer, goTo, scanlines, text } from '../ui/ui';
import type { FightData } from './FightScene';

const TYPE_MS = 28;
type Step = 'victory' | 'parade' | 'epilogue' | 'results' | 'end';
const STEPS: Step[] = ['victory', 'parade', 'epilogue', 'results', 'end'];

/** Partida de muestra para ver el final desde el laboratorio (no se guarda ni va al ranking). */
export const demoEnding = (player: FighterDef['id']): StoryState => {
  const rivals = drawRivals(player);
  return {
    name: '',
    player,
    rivals,
    index: rivals.length + 1,
    freed: rivals,
    stats: { seconds: 1234, maxCombo: 17, perfects: 3, continues: 1 },
    score: 54321,
  };
};

/**
 * Final del modo historia, en cinco momentos (ENTER completa o avanza, ESC salta todo): la victoria,
 * el desfile de los amigos liberados, el epílogo del luchador, la tarjeta de resultados y el FIN.
 */
export class EndingScene extends Phaser.Scene {
  private input2!: Input;
  private run!: StoryState;
  /** Desde el laboratorio: al terminar vuelve a la práctica. */
  private lab: FightData | null = null;
  private step = 0;
  private layer!: Phaser.GameObjects.Container;
  /** Animación del momento actual: ENTER la completa antes de avanzar. */
  private skipAnim: (() => void) | null = null;
  private typing: { t: Phaser.GameObjects.Text; full: string; start: number } | null = null;
  private leaving = false;

  constructor() {
    super(SCENES.Ending);
  }

  init(data: { lab?: FightData }) {
    this.lab = data?.lab ?? null;
    this.step = 0;
    this.leaving = false;
    this.skipAnim = null;
    this.typing = null;
  }

  private get player(): FighterDef {
    return FIGHTERS[this.run.player];
  }

  create() {
    if (!StoryRun.state) {
      this.scene.start(SCENES.Title, { skipPress: true });
      return;
    }
    this.run = StoryRun.state;
    this.input2 = new Input(this);
    buildStage(this, STAGES.festival, true);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setOrigin(0);
    this.layer = this.add.container(0, 0);
    footer(this, 'ENTER  SIGUIENTE      ESC  SALTAR').setDepth(30);
    scanlines(this, 0.05);
    Audio.music(this, MUSIC.menu, 0.35);
    this.show();
  }

  private fill(s: string): string {
    return s.replace('{name}', this.player.name).replace('{quote}', this.player.quote);
  }

  /** Arma el momento actual (limpia el anterior). */
  private show(): void {
    this.layer.removeAll(true);
    this.skipAnim = null;
    this.typing = null;
    const step = STEPS[this.step];
    if (step === 'victory') this.victory();
    else if (step === 'parade') this.parade();
    else if (step === 'epilogue') this.epilogue();
    else if (step === 'results') this.results();
    else this.end();
  }

  /** 1. El golpe final: destello, acorde y el título. */
  private victory(): void {
    this.cameras.main.flash(700, 255, 255, 255);
    this.cameras.main.shake(300, 0.006);
    [220, 277, 330, 440].forEach((f) => Audio.tone(this, f, 1.2, 'sawtooth', 0.04));
    const title = text(this, GAME_WIDTH / 2, 400, '¡LIMA SUENA DE NUEVO!', { size: 120, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true });
    fitText(title, GAME_WIDTH - 160, 60);
    title.setScale(2.2).setAlpha(0);
    this.layer.add(title);
    const tw = this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 520, ease: 'Back.easeOut' });
    const lines = FINALE.map((l, i) => {
      const t = text(this, GAME_WIDTH / 2, 580 + i * 64, this.fill(l), { size: 36, weight: '700', color: CSS.cream, origin: [0.5, 0.5], wrap: 1500 }).setAlpha(0);
      this.layer.add(t);
      this.tweens.add({ targets: t, alpha: 1, duration: 500, delay: 700 + i * 900 });
      return t;
    });
    this.skipAnim = () => {
      tw.complete();
      for (const t of lines) {
        this.tweens.killTweensOf(t);
        t.setAlpha(1);
      }
    };
  }

  /** 2. Los amigos liberados van apareciendo en arco alrededor del luchador. */
  private parade(): void {
    const p = this.player;
    const fig = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 70, p.art.texture, `${p.art.prefix}idle`).setOrigin(0.5, 1);
    fig.setScale(artScale(this, p) * 1.3);
    const glow = this.add.image(fig.x, fig.y, p.art.texture, `${p.art.prefix}idle`).setOrigin(0.5, 1).setScale(fig.scale * 1.04);
    glow.setTint(p.color).setTintMode(Phaser.TintModes.FILL).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
    this.layer.add([glow, fig]);
    this.tweens.add({ targets: [glow, fig], y: '-=10', duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const freed = this.run.freed;
    const head = text(this, GAME_WIDTH / 2, 90, `AMIGOS LIBERADOS  ${freed.length}/${this.run.rivals.length}`, { size: 54, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true });
    this.layer.add(head);
    const n = freed.length;
    const pending = new Set<number>();
    const reveal = (i: number) => {
      if (!pending.delete(i)) return;
      const def = FIGHTERS[freed[i]];
      const a = Phaser.Math.DegToRad(Phaser.Math.Linear(192, 348, n > 1 ? i / (n - 1) : 0.5));
      const friend = this.add.container(GAME_WIDTH / 2 + Math.cos(a) * 780, 700 + Math.sin(a) * 470);
      friend.add(this.add.circle(0, 0, 74, def.color, 0.35).setStrokeStyle(4, def.color, 1));
      friend.add(addPortrait(this, def, 0, 0, 130));
      friend.add(fitText(text(this, 0, 88, def.name, { size: 18, weight: '900', color: def.css, origin: [0.5, 0.5], spacing: 1 }), 170, 12));
      this.layer.add(friend);
      friend.setScale(0.2);
      this.tweens.add({ targets: friend, scale: 1, duration: 260, ease: 'Back.easeOut' });
      Audio.tone(this, 440 + i * 40, 0.12, 'square', 0.03);
    };
    const timers = freed.map((_, i) => {
      pending.add(i);
      return this.time.delayedCall(250 + i * 180, () => reveal(i));
    });
    this.skipAnim = () => {
      timers.forEach((t) => t.remove());
      [...pending].forEach(reveal);
    };
  }

  /** 3. Epílogo: el busto del luchador y su texto escribiéndose. */
  private epilogue(): void {
    const p = this.player;
    const bust = bustKey(this, p);
    let art: Phaser.GameObjects.Image;
    if (bust) {
      art = this.add.image(480, GAME_HEIGHT - 60, bust).setOrigin(0.5, 1);
      art.setScale(820 / art.height);
    } else {
      art = this.add.image(480, GAME_HEIGHT - 60, p.art.texture, `${p.art.prefix}idle`).setOrigin(0.5, 1).setScale(artScale(this, p) * 1.3);
    }
    art.x -= 300;
    this.layer.add(art);
    this.tweens.add({ targets: art, x: 480, duration: 600, ease: 'Cubic.easeOut' });
    const box = this.add.graphics();
    box.fillStyle(0x000000, 0.82).fillRect(900, 230, 920, 620);
    box.lineStyle(3, p.color, 1).strokeRect(900, 230, 920, 620);
    const name = text(this, 940, 280, p.name, { size: 56, italic: true, weight: '900', color: p.css, origin: [0, 0.5], shadow: true });
    fitText(name, 840, 28);
    const full = this.fill(EPILOGUES[p.id] ?? '');
    const body = text(this, 940, 340, full, { size: 36, weight: '700', origin: [0, 0], wrap: 840 }).setLineSpacing(10);
    fitText(body, 840, 22, 480);
    body.setText('');
    this.layer.add([box, name, body]);
    this.typing = { t: body, full, start: this.time.now + 500 };
    this.skipAnim = () => {
      body.setText(full);
      this.typing = null;
    };
  }

  /** 4. Resultados: el puntaje sube y debajo las estadísticas (y el puesto en el ranking). */
  private results(): void {
    const s = this.run.stats;
    const cx = GAME_WIDTH / 2;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.86).fillRect(cx - 560, 170, 1120, 760);
    g.lineStyle(4, COLORS.lime, 1).strokeRect(cx - 560, 170, 1120, 760);
    this.layer.add(g);
    this.layer.add(text(this, cx, 240, 'HISTORIA COMPLETADA', { size: 64, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true }));
    this.layer.add(addPortrait(this, this.player, cx, 360, 130));
    const score = text(this, cx, 490, '0', { size: 110, italic: true, weight: '900', color: CSS.cream, origin: [0.5, 0.5], shadow: true });
    this.layer.add(score);
    this.layer.add(text(this, cx, 560, 'PUNTAJE FINAL', { size: 24, weight: '800', color: CSS.grey, origin: [0.5, 0.5], spacing: 6 }));
    const counter = { v: 0 };
    const tw = this.tweens.add({
      targets: counter, v: this.run.score, duration: 1400, ease: 'Cubic.easeOut',
      onUpdate: () => score.setText(Math.round(counter.v).toLocaleString('es-PE')),
      onComplete: () => Audio.tone(this, 880, 0.3, 'square', 0.05),
    });
    const time = `${Math.floor(s.seconds / 60)}:${String(s.seconds % 60).padStart(2, '0')}`;
    const rows: [string, string][] = [['TIEMPO', time], ['MEJOR COMBO', `${s.maxCombo}`], ['PERFECTS', `${s.perfects}`], ['CONTINUES', `${s.continues}`]];
    rows.forEach(([k, v], i) => {
      const x = cx - 420 + i * 280;
      this.layer.add(text(this, x, 650, k, { size: 22, weight: '800', color: CSS.grey, origin: [0.5, 0.5], spacing: 3 }));
      this.layer.add(text(this, x, 700, v, { size: 48, italic: true, weight: '900', color: CSS.cream, origin: [0.5, 0.5] }));
    });
    const rank = text(this, cx, 840, this.lab ? 'LABORATORIO  ·  NO VA AL RANKING' : 'BUSCANDO TU PUESTO…', { size: 34, italic: true, weight: '900', color: CSS.grey, origin: [0.5, 0.5], spacing: 2 });
    this.layer.add(rank);
    if (!this.lab) this.findRank(rank);
    this.skipAnim = () => tw.complete();
  }

  /** Puesto de esta historia en el ranking mundial (espera un poco: el puntaje recién se está subiendo). */
  private findRank(t: Phaser.GameObjects.Text): void {
    const player = this.run.player;
    this.time.delayedCall(1500, () =>
      Ranking.top(100).then(
        (list) => {
          if (!t.active) return;
          const i = list.findIndex((e) => e.fighter === player && Ranking.isMine(e.id));
          t.setText(i >= 0 ? `#${i + 1} DEL RANKING MUNDIAL` : 'FUERA DEL TOP 100').setColor(i >= 0 && i < 3 ? '#ffd84a' : CSS.lime);
        },
        () => t.active && t.setText('SIN CONEXIÓN CON EL RANKING'),
      ),
    );
  }

  /** 5. FIN. */
  private end(): void {
    const fin = text(this, GAME_WIDTH / 2, 470, 'FIN', { size: 220, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true }).setAlpha(0);
    const thanks = text(this, GAME_WIDTH / 2, 650, 'GRACIAS POR JUGAR', { size: 48, weight: '900', color: CSS.cream, origin: [0.5, 0.5], spacing: 10 }).setAlpha(0);
    this.layer.add([fin, thanks]);
    this.tweens.add({ targets: fin, alpha: 1, duration: 800 });
    this.tweens.add({ targets: thanks, alpha: 1, duration: 800, delay: 600 });
  }

  private next(): void {
    if (this.skipAnim) {
      const skip = this.skipAnim;
      this.skipAnim = null;
      skip();
      return;
    }
    Audio.blip(this, true);
    if (++this.step >= STEPS.length) return this.finish();
    this.show();
  }

  private finish(): void {
    if (this.leaving) return;
    this.leaving = true;
    StoryRun.clear();
    if (this.lab) return goTo(this, SCENES.Fight, this.lab, 500);
    goTo(this, StoryRun.saved.length ? SCENES.Saves : SCENES.Title, { skipPress: true }, 600);
  }

  update() {
    if (this.leaving || !this.layer) return;
    const ty = this.typing;
    if (ty) {
      const chars = Math.min(ty.full.length, Math.max(0, Math.floor((this.time.now - ty.start) / TYPE_MS)));
      if (chars !== ty.t.text.length) {
        ty.t.setText(ty.full.slice(0, chars));
        if (chars % 4 === 0) Audio.tone(this, 820, 0.02, 'square', 0.01);
      }
      if (chars >= ty.full.length) {
        this.typing = null;
        this.skipAnim = null;
      }
    }
    if (this.input2.justDown('confirm')) this.next();
    if (this.input2.justDown('back')) this.finish();
  }
}
