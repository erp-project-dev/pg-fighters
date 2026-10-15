import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, GROUND_Y, ROUNDS_TO_WIN, ROUND_SECONDS, SCENES, STAGE_LEFT, STAGE_RIGHT } from '../config';
import { Cpu } from '../entities/Cpu';
import { GuitarSolo } from '../entities/GuitarSolo';
import { Fighter, MAX_METER, NO_INTENT, type Arena, type Intent } from '../entities/Fighter';
import { Projectile } from '../entities/Projectile';
import { dialogFor } from '../data/dialogs';
import { FIGHTERS, type FighterId } from '../data/fighters';
import { powerFor } from '../data/powers';

import { STAGES, type StageId } from '../data/stages';
import { MOVES, type MoveDef } from '../data/moves';
import { Audio } from '../systems/Audio';
import { Fx } from '../systems/Fx';
import { buildStage } from '../systems/StageArt';
import { Input } from '../systems/Input';
import { playSolo } from '../systems/Licks';
import { Settings, type CpuLevel } from '../systems/Settings';
import { StoryRun } from '../systems/StoryRun';
import { Training, type DemoCombo } from '../systems/Training';
import { goTo } from '../ui/ui';
import type { HudScene } from './HudScene';

export interface FightData {
  p1: FighterId;
  p2: FighterId;
  /** Modo entrenamiento: muñeco, sin tiempo ni K.O. */
  training?: boolean;
  /** Escenario (por defecto, Barrio Bravo). */
  stage?: StageId;
  /** Vitrina del laboratorio: práctica sin anuncios ni panel de entrenamiento, con botones de especiales. */
  showcase?: boolean;
  /** Laboratorio (?lab): práctica directa; ESC abre el roster para cambiar de luchador al instante. */
  lab?: boolean;
  /** Pelea del modo historia (el rival está en "modo hater" o es el jefe). */
  story?: boolean;
  /** Dificultad de la CPU para esta pelea (si no, la de los ajustes). */
  difficulty?: CpuLevel;
}

export interface MatchStats {
  maxCombo: number;
  perfects: number;
  roundsWon: number;
  roundsLost: number;
  seconds: number;
  /** Segundos de pelea efectiva (reloj de los rounds, sin anuncios ni K.O.). */
  fightSeconds: number;
  /** Vida del jugador al final (0..1). */
  hpLeft: number;
}

type Phase = 'intro' | 'fight' | 'clash' | 'ko' | 'over';

/** Duración del choque de ultimates (ms) y apretadas por segundo de la CPU (fácil → difícil). */
const CLASH_MS = 1800;
const CLASH_CPU_RATE = [6, 13];

/** Separación mínima entre cuerpos en el suelo. */
const BODY_GAP = 130;
const START_X = [660, 1260];
/** Tiempo en pantalla del "¡PELEA!" (luego se desvanece y recién se puede pelear). */
const FIGHT_TEXT_MS = 650;


/** Altura (desde el suelo) donde salta la chispa según el golpe. */
const SPARK_HEIGHT: Record<string, number> = {
  jab: 340, kick: 300, crouchJab: 220, sweep: 70, airPunch: 320, airKick: 280, uppercut: 380,
};

/** La pelea: rondas, colisiones, impacto (hitstop, chispas, sacudida), KO y cámara lenta. */
export class FightScene extends Phaser.Scene implements Arena {
  now = 0;
  fx!: Fx;
  p1!: Fighter;
  p2!: Fighter;
  projectiles: Projectile[] = [];
  round = 1;
  wins = [0, 0];
  timer = ROUND_SECONDS;
  phase: Phase = 'intro';
  stats!: MatchStats;
  private data0!: FightData;
  private cpu!: Cpu;
  private input2!: Input;
  private hud!: HudScene;
  private hitstopUntil = 0;
  private timeScale = 1;
  private pending = { punch: false, kick: false, super: false };
  private dim!: Phaser.GameObjects.Rectangle;
  private neon!: Phaser.GameObjects.Rectangle;
  private matchStart = 0;
  /** Dueño del ultimate en curso (manda el primero). */
  private ultOwner: Fighter | null = null;
  /** Choque de ultimates en curso: apretadas de cada lado y barra de tira y afloja. */
  private clash: { a: Fighter; b: Fighter; score: [number, number]; until: number; cpuAcc: number; g: Phaser.GameObjects.Graphics } | null = null;
  /** Solo de guitarra del súper en curso. */
  private solo: GuitarSolo | null = null;
  /** Estado del modo entrenamiento (null en arcade). */
  training: Training | null = null;
  private boxes!: Phaser.GameObjects.Graphics;
  /** Último destello del aura de súper listo, por luchador. */
  private auraAt = [0, 0, 0];
  /** Etiqueta del rival en el HUD. */
  cpuBadge = 'CPU';

  constructor() {
    super(SCENES.Fight);
  }

  init(data: FightData) {
    this.data0 = data;
    this.round = 1;
    this.wins = [0, 0];
    this.projectiles = [];
    this.timeScale = 1;
    this.hitstopUntil = 0;
    this.now = 0;
    this.stats = { maxCombo: 0, perfects: 0, roundsWon: 0, roundsLost: 0, seconds: 0, fightSeconds: 0, hpLeft: 0 };
  }

  create() {
    this.cameras.main.fadeIn(300, 11, 10, 14);
    this.buildStage();
    this.fx = new Fx(this);
    this.p1 = new Fighter(this, this, FIGHTERS[this.data0.p1], START_X[0], 1, 0);
    this.p2 = new Fighter(this, this, FIGHTERS[this.data0.p2], START_X[1], -1, 1);
    this.p1.opponent = this.p2;
    this.p2.opponent = this.p1;
    this.cpu = new Cpu(this.p2, () => this.projectiles, this.data0.difficulty ?? Settings.data.difficulty);
    // Historia: el rival es un amigo en "modo hater" o el jefe.
    this.cpuBadge = this.data0.story ? (this.p2.def.boss ? 'JEFE' : 'HATER') : 'CPU';
    this.input2 = new Input(this, true);
    this.events.on(Phaser.Scenes.Events.RESUME, () => this.input2.reset());
    this.boxes = this.add.graphics().setDepth(60);
    this.training = null;
    if (this.data0.training || this.data0.showcase) {
      this.training = new Training(this.p1, this.p2, this.cpu);
      this.p1.minHp = this.p2.minHp = 1;
    }

    this.scene.launch(SCENES.Hud, { fight: this });
    if (this.data0.showcase) this.scene.launch(SCENES.Showcase, { fight: this, data: this.data0 });
    // Laboratorio: sin panel de entrenamiento (la vida y la barra infinitas siguen activas).
    else if (this.training && !this.data0.lab) this.scene.launch(SCENES.TrainingHud, { fight: this });
    this.hud = this.scene.get(SCENES.Hud) as HudScene;
    Audio.music(this, STAGES[this.data0.stage ?? 'barrio'].music, 0.42);
    this.matchStart = this.time.now;
    this.startRound();
  }

  private buildStage(): void {
    buildStage(this, STAGES[this.data0.stage ?? 'barrio']);
    // Parpadeo de luz ambiental.
    this.neon = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, STAGES[this.data0.stage ?? 'barrio'].color, 0).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD);
    this.time.addEvent({
      delay: 2600,
      loop: true,
      callback: () => this.tweens.add({ targets: this.neon, alpha: { from: 0.06, to: 0 }, duration: 90, yoyo: true, repeat: Phaser.Math.Between(1, 3) }),
    });
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.55, 0.55, 0, 0).fillRect(0, 0, GAME_WIDTH, 260);
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.5, 0.5).fillRect(0, GROUND_Y - 40, GAME_WIDTH, GAME_HEIGHT - GROUND_Y + 40);
    // Oscurece el escenario durante el súper.
    this.dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setOrigin(0).setDepth(18);
  }

  // ───────────────────────────── Rondas ─────────────────────────────

  private startRound(): void {
    this.cancelClash();
    this.ultOwner = null;
    this.endSolo();
    for (const p of this.projectiles) p.destroy();
    this.projectiles = [];
    this.p1.reset(START_X[0], 1);
    this.p2.reset(START_X[1], -1);
    this.timer = ROUND_SECONDS;
    this.phase = 'intro';
    this.timeScale = 1;
    // Cada uno entra con un dash desde su lado de la pantalla.
    this.p1.dashIn(-220, 200);
    this.p2.dashIn(GAME_WIDTH + 220, 320);
    if (this.data0.showcase) {
      this.time.delayedCall(800, () => this.resetPositions());
      return;
    }
    if (this.data0.lab) {
      // Laboratorio: sin anuncios, se prueba apenas terminan de entrar.
      this.time.delayedCall(550, () => this.resetPositions());
      return;
    }
    if (this.training) {
      // Igual que en arcade: nadie se mueve hasta que se anuncia el inicio.
      this.time.delayedCall(300, () => this.hud.announce('ENTRENAMIENTO', { size: 150, ms: 900 }));
      this.time.delayedCall(1300, () => {
        this.hud.announce('¡A PELEAR!', { ms: FIGHT_TEXT_MS, size: 200 });
        Audio.tone(this, 520, 0.35, 'sawtooth', 0.06);
      });
      this.time.delayedCall(1300 + FIGHT_TEXT_MS + 300, () => this.resetPositions());
      return;
    }
    // Antes del ROUND 1: diálogo entre los dos luchadores (en la historia, el rival habla como hater).
    const lines = this.round !== 1 || this.p2.def.boss ? []
      : this.data0.story ? [{ speaker: this.p2.def.id, text: this.p2.def.hater }, { speaker: this.p1.def.id, text: this.p1.def.quote }]
      : dialogFor(this.p1.def.id, this.p2.def.id);
    if (lines.length) this.time.delayedCall(950, () => this.hud.startDialog(lines, () => this.announceRound(250)));
    else this.announceRound();
  }

  /** "ROUND X" y luego "¡PELEA!": recién ahí se puede mover. */
  private announceRound(delay = 800): void {
    const final = this.wins[0] === ROUNDS_TO_WIN - 1 && this.wins[1] === ROUNDS_TO_WIN - 1;
    this.time.delayedCall(delay, () => {
      this.hud.announce(final ? 'ROUND FINAL' : `ROUND ${this.round}`, { color: '#e9e5d9', ms: 1100 });
      Audio.tone(this, 300, 0.25, 'sawtooth', 0.05);
    });
    this.time.delayedCall(delay + 1300, () => {
      this.hud.announce('¡PELEA!', { ms: FIGHT_TEXT_MS, size: 240 });
      Audio.tone(this, 520, 0.35, 'sawtooth', 0.06);
      this.cameras.main.shake(140, 0.004);
    });
    // Se pelea recién cuando el "¡PELEA!" ya se fue de la pantalla.
    this.time.delayedCall(delay + 1300 + FIGHT_TEXT_MS + 300, () => {
      this.phase = 'fight';
      this.p1.setState('idle');
      this.p2.setState('idle');
    });
  }

  private ko(winner: Fighter | null, kind: 'ko' | 'time'): void {
    if (this.phase !== 'fight') return;
    this.phase = 'ko';
    this.stats.fightSeconds += ROUND_SECONDS - this.timer;
    this.endSolo();
    if (kind === 'ko') {
      this.hitstopUntil = this.time.now + 380;
      this.timeScale = 0.3;
      this.cameras.main.flash(250, 255, 255, 255);
      this.cameras.main.shake(400, 0.012);
      this.cameras.main.zoomTo(1.06, 300, 'Sine.easeOut');
      this.hud.announce('K.O.', { color: '#ff2d45', size: 300, ms: 1500 });
      Audio.tone(this, 90, 0.9, 'sawtooth', 0.09);
      this.time.delayedCall(1300, () => {
        this.timeScale = 1;
        this.cameras.main.zoomTo(1, 400);
      });
    } else {
      this.hud.announce('¡TIEMPO!', { color: '#ec694c', ms: 1300 });
      Audio.tone(this, 200, 0.6, 'square', 0.06);
    }
    for (const f of [this.p1, this.p2]) {
      if (f.state === 'attack') f.setState('idle');
    }

    this.time.delayedCall(2100, () => {
      if (winner) {
        this.wins[winner.side]++;
        winner.celebrate();
        const perfect = winner.hp === winner.maxHp;
        if (winner === this.p1) {
          this.stats.roundsWon++;
          if (perfect) this.stats.perfects++;
        } else this.stats.roundsLost++;
        this.hud.announce(`${winner.def.name} GANA`, { size: 140, ms: 1800, sub: perfect ? 'PERFECT' : undefined, color: winner === this.p1 ? '#dfff00' : '#e9e5d9' });
        Audio.tone(this, winner === this.p1 ? 660 : 160, 0.5, 'sawtooth', 0.06);
      } else {
        this.hud.announce('EMPATE', { size: 180, ms: 1600 });
      }
    });

    this.time.delayedCall(4200, () => {
      const champion = this.wins.findIndex((w) => w >= ROUNDS_TO_WIN);
      if (champion >= 0) this.finishMatch(champion as 0 | 1);
      else {
        this.round++;
        this.startRound();
      }
    });
  }

  private finishMatch(side: 0 | 1): void {
    this.phase = 'over';
    this.stats.seconds = Math.round((this.time.now - this.matchStart) / 1000);
    this.stats.hpLeft = this.p1.hp / this.p1.maxHp;
    this.scene.stop(SCENES.Hud);
    if (this.data0.story) {
      // Historia: ganar libera al amigo (o derrota al jefe); perder lleva a ¿CONTINUAR?
      if (side === 0) {
        const beaten = this.p2.def.id;
        const boss = !!this.p2.def.boss;
        StoryRun.win(this.stats);
        goTo(this, boss ? SCENES.Story : SCENES.StoryProgress, boss ? { mode: 'finale' } : { justFreed: beaten }, 500);
      } else goTo(this, SCENES.Continue, {}, 500);
      return;
    }
    goTo(this, SCENES.Results, { ...this.data0, playerWon: side === 0, stats: this.stats }, 500);
  }

  // ───────────────────────────── Arena (servicios a luchadores) ─────────────────────────────

  spawnProjectile(owner: Fighter): void {
    // Cada uno tiene su poder (data/powers.ts): Mimético copia el del rival y El Acople elige uno de sus tres.
    const color = owner.def.id === 'mimetico' ? 0x4dff88 : owner.def.color;
    for (const spec of powerFor(owner.def.id, owner.opponent.def.id)) this.projectiles.push(new Projectile(this, this.fx, owner, spec, color));
    Audio.sfx(this, 'swing', 0.7, 0.85);
    Audio.tone(this, 260, 0.3, 'sawtooth', 0.05);
  }

  hasProjectile(owner: Fighter): boolean {
    return this.projectiles.some((p) => p.owner === owner && p.alive);
  }

  /**
   * Regla de ultimates, como en Marvel vs. Capcom: manda el primero; mientras está en curso el rival
   * no puede lanzar el suyo. Si el rival contesta con el suyo estando libre (o los dos a la vez), se
   * produce un choque: gana quien apriete más rápido y solo su ultimate sale.
   */
  requestUltimate(owner: Fighter): boolean {
    if (this.phase !== 'fight' || this.clash) return false;
    const current = this.ultOwner;
    if (!current) {
      this.ultOwner = owner;
      return true;
    }
    if (current === owner) return false;
    this.startClash(current, owner);
    return false;
  }

  private startClash(a: Fighter, b: Fighter): void {
    // Se cancela lo que estaba en curso del primero (retrato o solo); los dos gastan su barra.
    if (this.scene.isActive(SCENES.SuperCutIn) || this.scene.isPaused(SCENES.SuperCutIn)) this.scene.stop(SCENES.SuperCutIn);
    this.scene.resume();
    this.endSolo();
    a.endSuper();
    this.scene.setVisible(true, SCENES.Hud);
    if (this.training) this.scene.setVisible(true, SCENES.TrainingHud);
    Audio.duck(false);
    a.meter = b.meter = 0;
    this.ultOwner = null;
    this.phase = 'clash';
    const g = this.add.graphics().setDepth(55);
    this.clash = { a, b, score: [0, 0], until: this.time.now + CLASH_MS, cpuAcc: 0, g };
    this.cameras.main.flash(200, 255, 255, 255);
    this.cameras.main.shake(400, 0.012);
    this.cameras.main.zoomTo(1.08, 300, 'Sine.easeOut');
    this.fx.hit((a.x + b.x) / 2, GROUND_Y - 300, COLORS.white, true);
    this.hud.announce('¡CHOQUE DE ULTIMATES!', { size: 120, ms: 900 });
    this.time.delayedCall(700, () => this.clash && this.hud.announce('¡APRIETA!', { size: 150, ms: 700 }));
    Audio.tone(this, 180, 0.5, 'sawtooth', 0.08);
  }

  /** Cada frame del choque: apretadas del jugador, ritmo de la CPU y barra de tira y afloja. */
  private updateClash(realDt: number): void {
    const c = this.clash!;
    const i = this.input2;
    if (i.justDown('punch') || i.justDown('kick') || i.justDown('super') || i.justDown('confirm')) {
      c.score[this.p1.side]++;
      this.fx.ring(this.p1.x, GROUND_Y - 300, this.p1.def.color, 120, 0.2);
    }
    const lvl = this.data0.difficulty ?? Settings.data.difficulty;
    const k = typeof lvl === 'number' ? lvl : lvl === 'hard' ? 1 : lvl === 'normal' ? 0.5 : 0;
    c.cpuAcc += realDt * (CLASH_CPU_RATE[0] + (CLASH_CPU_RATE[1] - CLASH_CPU_RATE[0]) * k);
    while (c.cpuAcc >= 1) {
      c.cpuAcc--;
      c.score[this.p2.side]++;
      this.fx.ring(this.p2.x, GROUND_Y - 300, this.p2.def.color, 120, 0.2);
    }
    // Barra: el punto de choque se corre hacia el que va perdiendo.
    const diff = c.score[this.p1.side] - c.score[this.p2.side];
    const mid = GAME_WIDTH / 2 + Phaser.Math.Clamp(diff * 26, -420, 420);
    const g = c.g;
    const y = 300;
    g.clear();
    g.fillStyle(0x000000, 0.7).fillRect(GAME_WIDTH / 2 - 470, y - 26, 940, 52);
    g.fillStyle(this.p1.def.color, 1).fillRect(GAME_WIDTH / 2 - 460, y - 18, mid - (GAME_WIDTH / 2 - 460), 36);
    g.fillStyle(this.p2.def.color, 1).fillRect(mid, y - 18, GAME_WIDTH / 2 + 460 - mid, 36);
    g.fillStyle(0xffffff, 1).fillCircle(mid, y, 26 + Math.sin(this.time.now / 40) * 5);
    if (Math.random() < 0.6) this.fx.hit(mid, y, COLORS.white, false);
    if (this.time.now >= c.until) this.resolveClash();
  }

  /** Gana el que apretó más (empate: el que lanzó primero); su ultimate sale completo y el otro queda aturdido. */
  private resolveClash(): void {
    const c = this.clash!;
    const s1 = c.score[this.p1.side];
    const s2 = c.score[this.p2.side];
    const winner = s1 === s2 ? c.a : s1 > s2 ? this.p1 : this.p2;
    const loser = winner.opponent;
    this.cancelClash();
    this.cameras.main.zoomTo(1, 250);
    this.phase = 'fight';
    loser.setState('hurt', 900);
    loser.vx = -loser.facing * 500;
    this.ultOwner = winner;
    winner.forceUltimate();
  }

  private cancelClash(): void {
    if (!this.clash) return;
    this.clash.g.destroy();
    this.clash = null;
  }

  /** Súper, paso 1: se congela la pelea, se va el HUD y entra el retrato a pantalla completa. */
  superCutIn(owner: Fighter): void {
    // El rival no puede quedarse bloqueando desde antes: tiene que soltar y volver a presionar atrás.
    owner.opponent.blockLocked = true;
    this.scene.setVisible(false, SCENES.Hud);
    if (this.training) this.scene.setVisible(false, SCENES.TrainingHud);
    Audio.duck(true);
    this.scene.pause();
    this.scene.launch(SCENES.SuperCutIn, { def: owner.def, side: owner.side, onDone: () => this.scene.resume() });
  }

  /** Súper, paso 2: escenario en penumbra y solo de guitarra. */
  startSolo(owner: Fighter): void {
    this.endSolo();
    this.solo = new GuitarSolo(this, this.fx, owner, (o, x, y, damage, final) => this.noteStrike(o, x, y, damage, final));
    playSolo(this, this.solo.solo);
    this.tweens.killTweensOf(this.dim);
    this.tweens.add({ targets: this.dim, alpha: 0.55, duration: 200 });
    this.cameras.main.zoomTo(1.05, 400, 'Sine.easeOut');
  }

  /** Súper, paso 3: termina el solo y vuelve todo a la normalidad. */
  private endSolo(): void {
    if (!this.solo) return;
    this.ultOwner = null;
    this.solo.owner.endSuper();
    this.solo.destroy();
    this.solo = null;
    this.tweens.killTweensOf(this.dim);
    this.tweens.add({ targets: this.dim, alpha: 0, duration: 300 });
    this.cameras.main.zoomTo(1, 400);
    this.scene.setVisible(true, SCENES.Hud);
    if (this.training) this.scene.setVisible(true, SCENES.TrainingHud);
    Audio.duck(false);
  }

  /** Aura del color del luchador mientras tiene el súper listo (barra llena). */
  private drawAuras(time: number): void {
    if (this.solo || this.phase === 'over') return;
    // Aura de la entidad jefe (cian; roja al enfurecerse). Los amigos hater pelean sin efectos extra.
    if (this.p2.def.boss) {
      const f = this.p2;
      const color = f.rage ? 0xff4d6d : f.def.color;
      if (Math.random() < 0.8) this.fx.rise(f.x + (Math.random() - 0.5) * 150, GROUND_Y - f.z - Math.random() * f.def.art.height * 0.9, color);
      if (time - this.auraAt[2] > 90 && f.state !== 'ko') {
        this.auraAt[2] = time;
        this.fx.ghost(f.sprite, color, 0.5, 360, 0.05);
      }
    }
    if (this.phase !== 'fight') return;
    for (const f of [this.p1, this.p2]) {
      if (f.meter < MAX_METER || f.state === 'attack' || f.state === 'down' || f.state === 'ko') continue;
      const h = f.def.art.height;
      if (Math.random() < 0.5) this.fx.rise(f.x + (Math.random() - 0.5) * 140, GROUND_Y - f.z - Math.random() * h * 0.8, f.def.color);
      if (time - this.auraAt[f.side] > 140) {
        this.auraAt[f.side] = time;
        this.fx.ghost(f.sprite, f.def.color, 0.45, 320, 0.03);
      }
    }
  }

  /** Una nota del solo alcanza al rival. */
  private noteStrike(owner: Fighter, x: number, y: number, damage: number, final: boolean): boolean {
    const target = owner.opponent;
    if (target.invulnerable) return false;
    const dir = (target.x >= owner.x ? 1 : -1) as 1 | -1;
    const move = MOVES.superNote;
    const res = target.receive(owner, move, {
      dir,
      fromX: owner.x,
      chip: 0.25,
      finisher: final,
      damage: Math.round(damage * owner.def.stats.damage * target.def.stats.defense),
    });
    if (res.result === 'whiff') return false;
    this.impact(owner, target, move, res.result, res.damage, x, y, { projectile: true, heavy: final });
    if (final) this.hitstopUntil = this.time.now + 160;
    return true;
  }


  onDash(owner: Fighter): void {
    Audio.sfx(this, 'swing', 0.35, owner.vx * owner.facing > 0 ? 1.3 : 1.1);
  }

  onAttack(owner: Fighter, move: MoveDef): void {
    this.training?.onAttack(owner, move);
    if (move.id === 'special' || move.id === 'super') return;
    Audio.sfx(this, 'swing', 0.4, move.sfx === 'kick' ? 0.85 : 1.15);
  }

  // ───────────────────────────── Bucle ─────────────────────────────

  private playerIntent(): Intent {
    const i = this.input2;
    return {
      left: i.isDown('left'),
      right: i.isDown('right'),
      up: i.isDown('up'),
      down: i.isDown('down'),
      punch: this.pending.punch,
      kick: this.pending.kick,
      dash: false,
      super: this.pending.super,
    };
  }

  update(time: number, delta: number) {
    // Diálogo previo: ENTER avanza, ESC lo salta.
    if (this.hud?.dialogActive) {
      if (this.input2.justDown('confirm')) this.hud.dialogAdvance();
      else if (this.input2.justDown('back')) this.hud.dialogSkip();
    } else if (this.input2.justDown('pause') && this.data0.showcase) {
      this.backToLab();
      return;
    } else if (this.input2.justDown('pause') && !this.solo && (this.phase === 'fight' || this.phase === 'intro')) {
      if (this.data0.lab) this.openLabPick();
      else this.openPause();
      return;
    }

    // Las pulsaciones se acumulan durante el hitstop para no perderlas.
    this.pending.punch ||= this.input2.justDown('punch');
    this.pending.kick ||= this.input2.justDown('kick');
    this.pending.super ||= this.input2.justDown('super');

    const realDt = Math.min(delta, 40) / 1000;
    const frozen = time < this.hitstopUntil;
    const dt = frozen ? 0 : realDt * this.timeScale * (this.training?.speed ?? 1);
    this.now += dt * 1000;

    if (!frozen) {
      if (this.phase === 'fight' && this.training) {
        const intent = this.training.playerIntent(this.playerIntent(), this.now);
        this.training.logInput(intent);
        this.p1.control(intent);
        this.p2.control(this.training.dummyIntent(this.now));
      } else if (this.phase === 'fight') {
        this.p1.control(this.playerIntent());
        this.p2.control(this.cpu.intent(this.now));
        this.timer = Math.max(0, this.timer - dt);
      } else {
        this.p1.control(NO_INTENT);
        this.p2.control(NO_INTENT);
      }
      this.pending = { punch: false, kick: false, super: false };
    }

    this.p1.update(dt);
    this.p2.update(dt);
    if (dt > 0) {
      this.separate();
      for (const p of this.projectiles) p.update(dt);
      this.resolveHits();
      this.resolveProjectiles();
      this.projectiles = this.projectiles.filter((p) => p.alive);
    }
    if (this.clash) this.updateClash(realDt);
    this.fx.update(realDt);
    this.drawAuras(time);
    if (this.solo) {
      this.solo.update(realDt * 1000, dt);
      if (this.solo.finished) this.endSolo();
    }

    if (this.training) {
      this.training.update();
      this.drawBoxes();
    } else if (this.phase === 'fight') {
      // Segunda fase del jefe al quedar con la mitad de la vida.
      const boss = this.p2.def.boss ? this.p2 : null;
      if (boss && !boss.rage && boss.hp > 0 && boss.hp <= boss.maxHp / 2) {
        boss.rage = true;
        this.hud.announce('¡EL ACOPLE SE ENFURECE!', { size: 120, ms: 1300, color: '#ff4d6d' });
        this.cameras.main.shake(500, 0.01);
        this.cameras.main.flash(250, 255, 60, 90);
        Audio.tone(this, 60, 1.2, 'sawtooth', 0.09);
      }
      const dead1 = this.p1.hp <= 0;
      const dead2 = this.p2.hp <= 0;
      if (dead1 || dead2) this.ko(dead1 && dead2 ? null : dead1 ? this.p2 : this.p1, 'ko');
      else if (this.timer <= 0) this.ko(this.p1.hp === this.p2.hp ? null : this.p1.hp > this.p2.hp ? this.p1 : this.p2, 'time');
    }
  }

  /** Empuje entre cuerpos: no se atraviesan en el suelo (sí saltando por encima). */
  private separate(): void {
    const a = this.p1;
    const b = this.p2;
    if (a.z > 160 || b.z > 160 || a.state === 'down' || b.state === 'down' || a.state === 'ko' || b.state === 'ko') return;
    const dx = b.x - a.x;
    const gap = Math.abs(dx);
    if (gap >= BODY_GAP) return;
    const dir = dx === 0 ? (a.facing === 1 ? 1 : -1) : Math.sign(dx);
    const push = (BODY_GAP - gap) / 2;
    a.x -= dir * push;
    b.x += dir * push;
    // Contra la pared, el otro absorbe todo el empuje.
    for (const [f, o] of [[a, b], [b, a]] as const) {
      const clamped = Phaser.Math.Clamp(f.x, STAGE_LEFT, STAGE_RIGHT);
      if (clamped !== f.x) {
        o.x += clamped - f.x;
        f.x = clamped;
      }
    }
  }

  private resolveHits(): void {
    const pairs = [[this.p1, this.p2], [this.p2, this.p1]] as const;
    // Primero se decide quién conecta (permite intercambios), luego se aplica.
    const landing = pairs
      .filter(([a, b]) => a.hitboxActive && a.inReach(b))
      .map(([a, b]) => ({ a, b, move: a.move!, finisher: a.finisher }));
    for (const { a, b, move, finisher } of landing) {
      const { result, damage } = b.receive(a, move, { dir: a.facing, fromX: a.x, finisher });
      if (result === 'whiff') continue;
      a.moveDone = true;
      a.moveConnected = true;
      this.impact(a, b, move, result, damage, b.x - a.facing * 45, GROUND_Y - b.z - (SPARK_HEIGHT[move.id] ?? 300), { heavy: finisher });
    }
  }

  private resolveProjectiles(): void {
    const list = this.projectiles;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (!a.alive || !b.alive || a.owner === b.owner || !a.clashes || !b.clashes || Math.abs(a.x - b.x) > a.radius + b.radius) continue;
        this.fx.hit((a.x + b.x) / 2, a.y, COLORS.white, true);
        Audio.sfx(this, 'punch', 0.6, 0.7);
        // El que atraviesa poderes (TayLoy) gana el choque y sigue.
        if (!a.pierce || b.pierce) b.lose();
        if (!b.pierce || a.pierce) a.lose();
      }
    }
    for (const p of list) {
      const target = p.owner.opponent;
      if (!p.alive || !p.touches(target) || target.invulnerable) continue;
      const dir = (p.vx > 0 ? 1 : -1) as 1 | -1;
      const { result, damage } = target.receive(p.owner, p.move, {
        dir,
        fromX: p.x - dir * 10,
        chip: 0.2,
        finisher: !!p.spec.knockdown,
        damage: Math.round(p.damage * target.def.stats.defense),
      });
      if (result === 'whiff') continue;
      // Jesex: el cheque le compra barra ULTIMATE al rival.
      if (result === 'hit' && p.spec.steal) {
        const stolen = Math.min(target.meter, p.spec.steal);
        target.meter -= stolen;
        p.owner.meter = Math.min(MAX_METER, p.owner.meter + stolen);
      }
      const hx = p.spec.beam ? target.x - dir * 40 : p.x;
      if (!p.onHit()) p.destroy();
      this.impact(p.owner, target, p.move, result, damage, hx, p.y, { projectile: true, heavy: true });
    }
  }

  /** Feedback de un impacto: hitstop, chispas, sonido, sacudida, combo y empuje en la esquina. */
  private impact(a: Fighter, b: Fighter, move: MoveDef, result: 'hit' | 'block', damage: number, x: number, y: number, opts: { projectile?: boolean; heavy?: boolean } = {}): void {
    const projectile = !!opts.projectile;
    this.training?.onImpact(a, b, move, result, damage);
    // Un golpe sin bloquear rompe el escudo de corazones (Kimberly): si no, sería imbatible de cerca.
    if (result === 'hit') for (const p of this.projectiles) if (p.owner === b && p.orbiting) p.shatter();
    const heavy = move.knockdown || move.id === 'kick' || !!opts.heavy;
    if (result === 'block') {
      this.hitstopUntil = this.time.now + move.hitstop * 0.6;
      this.fx.block(x, y);
      Audio.sfx(this, 'swing', 0.5, 0.6);
      Audio.tone(this, 140, 0.08, 'square', 0.04);
    } else {
      this.hitstopUntil = this.time.now + move.hitstop + (opts.heavy ? 40 : 0);
      this.fx.hit(x, y, a.def.color, heavy);
      Audio.sfx(this, move.sfx, heavy ? 0.85 : 0.65, 0.9 + Math.random() * 0.2);
      Audio.tone(this, move.sfx === 'kick' ? 70 : 120, 0.12, 'sawtooth', 0.05);
      this.cameras.main.shake(heavy ? 160 : 80, heavy ? 0.008 : 0.003);
      if (b.comboTaken >= 2) {
        this.hud.combo(a.side, b.comboTaken);
        if (a === this.p1) this.stats.maxCombo = Math.max(this.stats.maxCombo, b.comboTaken);
      }
      this.hud.damage(b.side, damage);
    }
    const cornered = b.x <= STAGE_LEFT + 4 || b.x >= STAGE_RIGHT - 4;
    if (cornered && !projectile) a.pushback(move.push * 0.7);
  }

  // ───────────────────────────── Entrenamiento ─────────────────────────────

  /** Vuelve a colocar a los luchadores, separados `gap` px y listos para pelear. */
  resetPositions(gap = START_X[1] - START_X[0]): void {
    this.endSolo();
    this.cancelClash();
    this.ultOwner = null;
    for (const p of this.projectiles) p.destroy();
    this.projectiles = [];
    const mid = GAME_WIDTH / 2;
    this.p1.reset(mid - gap / 2, 1);
    this.p2.reset(mid + gap / 2, -1);
    this.p1.setState('idle');
    this.p2.setState('idle');
    this.phase = 'fight';
  }

  playDemo(demo: DemoCombo): void {
    if (!this.training || this.solo) return;
    this.resetPositions(demo.gap);
    this.training.startDemo(demo, this.now);
  }

  /** Cajas de golpe: cuerpo (verde), golpe activo (rojo), proyectiles. */
  private drawBoxes(): void {
    const g = this.boxes;
    g.clear();
    if (!this.training?.boxes) return;
    for (const f of [this.p1, this.p2]) {
      const h = f.def.art.height * (f.crouching ? 0.68 : 0.95);
      const top = GROUND_Y - f.z - h;
      g.lineStyle(3, f.invulnerable ? 0x5ad1ff : 0x4dff88, 0.9).strokeRect(f.x - 65, top, 130, h);
      g.fillStyle(0xffffff, 1).fillCircle(f.x, GROUND_Y - f.z, 6);
      if (f.hitboxActive && f.move) {
        const m = f.move;
        const cy = GROUND_Y - f.z - (SPARK_HEIGHT[m.id] ?? 300);
        const x0 = f.x - f.facing * 40;
        const x1 = f.x + f.facing * m.reach;
        const color = 0xff3b4e;
        g.fillStyle(color, 0.3).fillRect(Math.min(x0, x1), cy - 70, Math.abs(x1 - x0), 140);
        g.lineStyle(3, color, 1).strokeRect(Math.min(x0, x1), cy - 70, Math.abs(x1 - x0), 140);
      }
    }
    for (const p of this.projectiles) g.lineStyle(3, 0xff3b4e, 1).strokeCircle(p.x, p.y, p.radius);
  }

  /** Vitrina: reinicia con otro luchador. */
  showcaseFighter(p1: FighterId): void {
    this.scene.stop(SCENES.Hud);
    this.scene.stop(SCENES.Showcase);
    this.scene.start(SCENES.Fight, { ...this.data0, p1, p2: p1 === 'mayin' ? 'erp' : 'mayin' });
  }

  /** Vitrina: vuelve al laboratorio con el mismo personaje. */
  backToLab(): void {
    Audio.stopMusic(300);
    this.scene.stop(SCENES.Hud);
    this.scene.stop(SCENES.Showcase);
    this.scene.stop(SCENES.SuperCutIn);
    goTo(this, SCENES.Lab, { char: this.data0.p1, tab: 'specials' }, 200);
  }

  /** Laboratorio: roster encima de la pelea pausada. */
  private openLabPick(): void {
    this.scene.pause();
    this.scene.pause(SCENES.Hud);
    this.scene.launch(SCENES.LabPick, { fight: this.data0 });
  }

  private openPause(): void {
    this.scene.pause();
    this.scene.pause(SCENES.Hud);
    if (this.training) this.scene.pause(SCENES.TrainingHud);
    this.scene.launch(SCENES.Pause, { fight: this.data0 });
  }
}
