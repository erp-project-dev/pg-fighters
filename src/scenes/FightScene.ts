import { preloadRegeneratedArt, registerRegeneratedArt } from '../visuals/roster/RegeneratedArt';
import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, GROUND_Y, ROUNDS_TO_WIN, ROUND_SECONDS, SCENES, STAGE_LEFT, STAGE_RIGHT } from '../config';
import { Cpu } from '../entities/Cpu';
import { GuitarSolo, type NoteResult } from '../entities/GuitarSolo';
import { Fighter, MAX_METER, NO_INTENT, isNormal, type Arena, type Intent } from '../entities/Fighter';
import { Projectile, drawCage } from '../entities/Projectile';
import { buildLook } from '../visuals/powers';
import { dialogFor } from '../data/dialogs';
import { FIGHTERS, type FighterId } from '../data/fighters';
import { POWERS, powerFor } from '../data/powers';

import { STAGES, type StageId } from '../data/stages';
import { MOVES, type MoveDef } from '../data/moves';
import { moveFor } from '../data/moveset';
import { Audio } from '../systems/Audio';
import { Fx } from '../systems/Fx';
import { buildStage } from '../systems/StageArt';
import { Input } from '../systems/Input';
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
  /** Laboratorio (?lab): práctica directa; ESC abre el menú para cambiar luchadores y escenario. */
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

type Phase = 'intro' | 'fight' | 'ko' | 'over';

/** Duración del choque de ultimates (ms) y apretadas por segundo de la CPU (fácil → difícil). */

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
/** Duración del golpe de oro de Slandor sin usarlo (ms). */
const GOLD_MS = 5000;
/** Radio de la esferita que avisa que la jaula de NOSU está lista (px). */
const CAGE_ICON_R = 26;
/** La esfera que pegó tarda esto en crecer hasta envolver al rival (s). */
const CAGE_GROW_S = 0.18;

export class FightScene extends Phaser.Scene implements Arena {
  now = 0;
  fx!: Fx;
  p1!: Fighter;
  p2!: Fighter;
  projectiles: Projectile[] = [];
  /** Jaula lista: esferita junto a NOSU (por lado) y si estaba lista el frame anterior (para el aviso). */
  private cageIcons: (Phaser.GameObjects.Graphics | null)[] = [null, null];
  private cageWasReady = [true, true];
  /** Nota tachada sobre la cabeza del silenciado. */
  private silenceIcon: Phaser.GameObjects.Graphics | null = null;
  /** Rivales encerrados en la jaula de NOSU. */
  private cages: { target: Fighter; color: number; until: number; hp: number; g: Phaser.GameObjects.Graphics; t: number; from: number }[] = [];
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
    this.cages = [];
    this.cageIcons = [null, null];
    this.cageWasReady = [true, true];
    this.silenceIcon = null;
    this.timeScale = 1;
    this.hitstopUntil = 0;
    this.now = 0;
    this.stats = { maxCombo: 0, perfects: 0, roundsWon: 0, roundsLost: 0, seconds: 0, fightSeconds: 0, hpLeft: 0 };
  }

  preload() {
    preloadRegeneratedArt(this, [this.data0.p1, this.data0.p2]);
  }

  create() {
    registerRegeneratedArt(this, [this.data0.p1, this.data0.p2]);
    this.cameras.main.fadeIn(300, 11, 10, 14);
    // Un súper interrumpido (revancha, salir) no debe dejar filtros ni la cámara girada.
    this.cameras.main.filters?.internal.clear();
    this.cameras.main.setRotation(0);
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
    if (this.data0.training) {
      this.training = new Training(this.p1, this.p2, this.cpu);
      this.p1.minHp = this.p2.minHp = 1;
    }

    this.scene.launch(SCENES.Hud, { fight: this });
    // Laboratorio: sin panel de entrenamiento (la vida y la barra infinitas siguen activas).
    if (this.training && !this.data0.lab) this.scene.launch(SCENES.TrainingHud, { fight: this });
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
    this.ultOwner = null;
    this.endSolo();
    for (const p of this.projectiles) p.destroy();
    this.clearCages();
    this.projectiles = [];
    this.p1.reset(START_X[0], 1);
    this.p2.reset(START_X[1], -1);
    this.timer = ROUND_SECONDS;
    this.phase = 'intro';
    this.timeScale = 1;
    // Cada uno entra con un dash desde su lado de la pantalla.
    this.p1.dashIn(-220, 200);
    this.p2.dashIn(GAME_WIDTH + 220, 320);
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
        goTo(this, boss ? SCENES.Ending : SCENES.StoryProgress, boss ? {} : { justFreed: beaten }, 500);
      } else goTo(this, SCENES.Continue, {}, 500);
      return;
    }
    goTo(this, SCENES.Results, { ...this.data0, playerWon: side === 0, stats: this.stats }, 500);
  }

  // ───────────────────────────── Arena (servicios a luchadores) ─────────────────────────────

  spawnProjectile(owner: Fighter): void {
    // Cada uno tiene su poder (data/powers.ts): Mimético copia el del rival y El Acople elige uno de sus tres.
    const color = owner.def.id === 'mimetico' ? 0x4dff88 : owner.def.color;
    // Golpe de oro (Slandor): no lanza nada, carga su próximo golpe normal.
    const empower = powerFor(owner.def.id).find((s) => s.empower)?.empower;
    if (empower) {
      owner.chargeGold(empower, GOLD_MS);
      const cy = GROUND_Y - owner.z - owner.def.art.height * 0.55;
      for (let k = 0; k < 3; k++) this.fx.ring(owner.x, cy, k === 1 ? COLORS.white : 0xffd23f, 110 + k * 90, 0.3);
      Audio.tone(this, 990, 0.25, 'triangle', 0.06);
      return;
    }
    const shots = powerFor(owner.def.id);
    // Tempo imposible (Turboshred): no lanza nada, se acelera.
    const haste = shots.find((s) => s.haste)?.haste;
    if (haste) {
      owner.haste(haste);
      const cy = GROUND_Y - owner.z - owner.def.art.height * 0.55;
      for (let k = 0; k < 3; k++) this.fx.ring(owner.x, cy, k === 1 ? COLORS.white : 0xffee32, 120 + k * 90, 0.3);
      this.fx.ghost(owner.sprite, 0xffee32, 0.7, 320, 0.15);
      Audio.tone(this, 1180, 0.2, 'square', 0.05);
      return;
    }
    owner.powerCasts++;
    for (const base of shots) {
      // Lick de Pentalick: cada nivel sale más grande y pega más.
      const lvl = base.levels ? owner.lickLevel : 0;
      let spec = base.levels ? { ...base, level: lvl, size: (base.size ?? 1) * (1 + 0.3 * lvl), damage: (base.damage ?? 1) * (1 + 0.5 * lvl) } : base;
      // Velocidad en ciclo (monedas de Jesex): cada lanzamiento un poco más rápido, y vuelve a empezar.
      if (spec.speedCycle) spec = { ...spec, speed: (spec.speed ?? 1) * spec.speedCycle[(owner.powerCasts - 1) % spec.speedCycle.length] };
      this.projectiles.push(new Projectile(this, this.fx, owner, spec, spec.color ?? color));
    }
    Audio.sfx(this, 'swing', 0.7, 0.85);
    Audio.tone(this, 260, 0.3, 'sawtooth', 0.05);
  }

  /**
   * Contraataque (Doctor Escalas): la pelea se congela un instante, reaparece junto al atacante (estela dorada)
   * y le devuelve un golpe que tumba y no se bloquea.
   */
  counter(owner: Fighter, attacker: Fighter): void {
    const GOLD = 0xe0b862;
    const side = Math.sign(owner.x - attacker.x) || -attacker.facing;
    const from = owner.x;
    // A distancia de puñetazo (sin montarse sobre el rival); si la pared no deja, del otro lado.
    const gap = 250;
    let to = attacker.x + side * gap;
    if (to < STAGE_LEFT || to > STAGE_RIGHT) to = attacker.x - side * gap;
    to = Phaser.Math.Clamp(to, STAGE_LEFT, STAGE_RIGHT);
    const h = owner.def.art.height;
    const y = GROUND_Y - owner.z - h * 0.55;
    // Estela de páginas de luz del punto de partida al de llegada.
    for (let i = 0; i <= 8; i++) this.fx.ring(from + ((to - from) * i) / 8, y, i % 2 ? COLORS.white : GOLD, 60, 0.25);
    this.fx.ghost(owner.sprite, GOLD, 0.6, 300, 0.1);
    owner.x = to;
    owner.facing = (attacker.x >= to ? 1 : -1) as 1 | -1;
    owner.vx = 0;
    owner.playCounterStrike();
    const dir = owner.facing;
    const res = attacker.receive(owner, { ...moveFor(owner.def.id, 'special'), counter: false, knockdown: true, damage: 115, push: 520, hitstop: 160 }, {
      dir, fromX: owner.x, unblockable: true, damage: Math.round(115 * owner.def.stats.damage * attacker.def.stats.defense),
    });
    const hx = attacker.x - dir * 40;
    const hy = GROUND_Y - attacker.z - attacker.def.art.height * 0.55;
    if (res.result !== 'whiff') {
      this.impact(owner, attacker, moveFor(owner.def.id, 'kick'), res.result, res.damage, hx, hy, { heavy: true });
      for (let k = 0; k < 3; k++) this.fx.ring(hx, hy, k === 1 ? COLORS.white : GOLD, 120 + k * 90, 0.35);
    }
    this.hitstopUntil = this.time.now + 220;
    this.cameras.main.flash(120, 255, 240, 200);
    this.hud.announce('¡CAPÍTULO TRES!', { size: 90, ms: 800, color: '#e0b862' });
    Audio.tone(this, 880, 0.18, 'triangle', 0.06);
  }

  hasProjectile(owner: Fighter): boolean {
    return this.projectiles.some((p) => p.owner === owner && p.alive);
  }

  /**
   * Regla de ultimates, como en Marvel vs. Capcom: manda el primero. Mientras está en curso, el ultimate
   * del rival no sale (y no gasta su barra).
   */
  requestUltimate(owner: Fighter): boolean {
    if (this.phase !== 'fight' || this.ultOwner) return false;
    this.ultOwner = owner;
    return true;
  }

  /** Súper, paso 1: se congela la pelea, se va el HUD y entra el retrato a pantalla completa. */
  superCutIn(owner: Fighter): void {
    // El rival no puede quedarse bloqueando desde antes: tiene que soltar y volver a presionar atrás.
    owner.opponent.blockLocked = true;
    this.scene.setVisible(false, SCENES.Hud);
    if (this.training) this.scene.setVisible(false, SCENES.TrainingHud);
    Audio.boost(true);
    this.scene.pause();
    this.scene.launch(SCENES.SuperCutIn, { def: owner.def, side: owner.side, onDone: () => this.scene.resume() });
  }

  /** Súper, paso 2: escenario en penumbra y solo de guitarra. */
  startSolo(owner: Fighter): void {
    this.endSolo();
    this.solo = new GuitarSolo(this, this.fx, owner, (o, x, y, damage, final) => this.noteStrike(o, x, y, damage, final));
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
    Audio.boost(false);
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
  private noteStrike(owner: Fighter, x: number, y: number, damage: number, final: boolean): NoteResult {
    const target = owner.opponent;
    if (target.invulnerable) return 'miss';
    const dir = (target.x >= owner.x ? 1 : -1) as 1 | -1;
    const move = MOVES.superNote;
    const res = target.receive(owner, move, {
      dir,
      fromX: owner.x,
      chip: 0.25,
      finisher: final,
      damage: Math.round(damage * owner.def.stats.damage * target.def.stats.defense),
    });
    if (res.result === 'whiff') return 'miss';
    this.impact(owner, target, move, res.result, res.damage, x, y, { projectile: true, heavy: final });
    // Sin guitarra sintetizada: cada nota que pega suma un golpe grave para que pese.
    Audio.sfx(this, 'kick', final ? 0.8 : 0.45, final ? 0.6 : 0.75);
    if (final) this.hitstopUntil = this.time.now + 160;
    return res.result === 'hit' ? 'hit' : 'block';
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
      punchHeld: this.input.activePointer.leftButtonDown(),
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
    this.updateCages(realDt);
    this.fx.update(realDt);
    this.drawAuras(time);
    this.drawCageIcons(time);
    this.drawSilence(time);
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
      this.impact(a, b, move, result, damage, b.x - a.facing * 45, GROUND_Y - b.z - (SPARK_HEIGHT[move.id] ?? 300), { heavy: finisher || (result === 'hit' && !!a.gold && isNormal(move)) });
      if (result === 'hit' && a.gold && isNormal(move)) {
        // Golpe de oro: se gasta al pegar (si se lo bloquean, lo conserva), con estallido dorado.
        const y = GROUND_Y - b.z - (SPARK_HEIGHT[move.id] ?? 300);
        for (let k = 0; k < 3; k++) this.fx.ring(b.x, y, k === 1 ? COLORS.white : 0xffd23f, 90 + k * 70, 0.3);
        this.fx.hit(b.x, y, 0xffd23f, true);
        Audio.tone(this, 1320, 0.2, 'triangle', 0.06);
        a.gold = 0;
      }
    }
  }

  /** Jaula de NOSU: encierra a `target` (si quedó de pie) por `ms`. */
  private cage(target: Fighter, color: number, ms: number, from: number): void {
    if (target.state !== 'hurt') return;
    target.setState('hurt', ms);
    target.vx = 0;
    const g = this.add.graphics().setDepth(25).setBlendMode(Phaser.BlendModes.ADD);
    this.cages.push({ target, color, until: target.now + ms, hp: target.hp, g, t: 0, from });
    const y = GROUND_Y - target.z - target.def.art.height * 0.5;
    for (let k = 0; k < 3; k++) this.fx.ring(target.x, y, k === 1 ? COLORS.white : color, 160 + k * 90, 0.3);
    this.cameras.main.shake(140, 0.006);
    Audio.tone(this, 660, 0.12, 'square', 0.05);
  }

  /**
   * Jaulas abiertas: la esfera que pegó crece hasta envolver al encerrado y lo sigue; se rompe con el
   * primer golpe que recibe o al acabarse el tiempo.
   */
  private updateCages(realDt: number): void {
    this.cages = this.cages.filter((c) => {
      const f = c.target;
      const h = f.def.art.height;
      const y = GROUND_Y - f.z - h * 0.5;
      const broken = f.hp < c.hp || f.state !== 'hurt';
      if (broken || f.now >= c.until) {
        for (let k = 0; k < (broken ? 4 : 2); k++) this.fx.ring(f.x, y, k % 2 ? COLORS.white : c.color, 140 + k * 80, 0.25);
        if (broken) this.fx.hit(f.x, y, c.color, false);
        c.g.destroy();
        return false;
      }
      c.t += realDt;
      // Últimos 300 ms: parpadea, la reja está por abrirse.
      const fading = c.until - f.now < 300 && Math.floor(c.t * 14) % 2 === 0;
      const grow = Phaser.Math.Easing.Back.Out(Math.min(1, c.t / CAGE_GROW_S));
      drawCage(c.g.clear(), f.x, y, Phaser.Math.Linear(c.from, h * 0.5, grow), Phaser.Math.Linear(c.from, h * 0.6, grow), c.color, c.t, fading ? 0.35 : 1);
      return true;
    });
  }

  /**
   * Jaula lista: una esferita con rejas flota junto al hombro de NOSU. Al dispararla desaparece y, al
   * recargarse, reaparece con un destello y un "ding" (el rival también la ve venir).
   */
  private drawCageIcons(time: number): void {
    for (const f of [this.p1, this.p2]) {
      if (!POWERS[f.def.id]?.some((s) => s.cage)) continue;
      const g = (this.cageIcons[f.side] ??= this.add.graphics().setDepth(24).setBlendMode(Phaser.BlendModes.ADD));
      g.clear();
      const ready = f.now >= f.cageReadyAt;
      const h = f.def.art.height;
      const x = f.x - f.facing * h * 0.3;
      const y = GROUND_Y - f.z - h * 0.82 + Math.sin(time / 300) * 8;
      if (ready && !this.cageWasReady[f.side] && this.phase === 'fight') {
        for (let k = 0; k < 2; k++) this.fx.ring(x, y, k ? COLORS.white : f.def.color, 60 + k * 40, 0.25);
        Audio.tone(this, 1320, 0.12, 'triangle', 0.05);
      }
      this.cageWasReady[f.side] = ready;
      if (!ready || this.solo || f.state === 'ko' || this.phase === 'over') continue;
      drawCage(g, x, y, CAGE_ICON_R, CAGE_ICON_R, f.def.color, time / 1000, 0.9);
    }
  }

  /** El que lanzó se cura `amount` (sin pasar su vida máxima): chispas doradas del rival hacia él. */
  private drain(owner: Fighter, target: Fighter, amount: number): void {
    owner.hp = Math.min(owner.maxHp, owner.hp + amount);
    const from = GROUND_Y - target.z - target.def.art.height * 0.55;
    const to = GROUND_Y - owner.z - owner.def.art.height * 0.55;
    for (let i = 0; i < 6; i++) {
      const k = i / 5;
      this.fx.trail(target.x + (owner.x - target.x) * k, from + (to - from) * k, 0xffd23f, 40);
    }
    this.fx.ring(owner.x, to, 0x6dff8a, 140, 0.3);
    Audio.tone(this, 1046, 0.15, 'triangle', 0.05);
  }

  /**
   * Tributo (El Virrey): una copia dorada del corte sale del rival y vuelve volando hacia él (lo sigue si se mueve);
   * al alcanzarlo se cura `amount`.
   */
  private tribute(p: Projectile, amount: number): void {
    const owner = p.owner;
    const look = buildLook(this, p.spec.look, 0xffd23f, p.radius, p.x, p.y).obj.setDepth(31).setAlpha(0.95);
    const from = { x: p.x, y: p.y };
    const st = { k: 0 };
    this.tweens.add({
      targets: st, k: 1, duration: 420, ease: 'Cubic.easeIn',
      onUpdate: () => {
        const to = { x: owner.x, y: GROUND_Y - owner.z - owner.def.art.height * 0.55 };
        const x = from.x + (to.x - from.x) * st.k;
        const y = from.y + (to.y - from.y) * st.k - Math.sin(st.k * Math.PI) * 120;
        look.setPosition(x, y).setAngle(st.k * 720 * Math.sign(from.x - to.x || 1));
        this.fx.trail(x, y, 0xffd23f, 34);
      },
      onComplete: () => {
        look.destroy();
        if (this.phase === 'over') return;
        owner.hp = Math.min(owner.maxHp, owner.hp + amount);
        const y = GROUND_Y - owner.z - owner.def.art.height * 0.55;
        for (let k = 0; k < 3; k++) this.fx.ring(owner.x, y, k === 1 ? COLORS.white : 0xffd23f, 110 + k * 80, 0.35);
        this.fx.ghost(owner.sprite, 0xffd23f, 0.6, 320, 0.1);
        Audio.tone(this, 1046, 0.2, 'triangle', 0.06);
      },
    });
  }

  /** Silencio (George): `target` no puede usar su poder básico por `ms`; la recarga del que lo lanzó espera a que termine. */
  private silence(owner: Fighter, target: Fighter, ms: number): void {
    target.silencedUntil = target.now + ms;
    owner.powerReadyAt = Math.max(owner.powerReadyAt, owner.now + ms + owner.powerCooldown * 0.5);
    const y = GROUND_Y - target.z - target.def.art.height - 40;
    for (let k = 0; k < 2; k++) this.fx.ring(target.x, y, k ? COLORS.white : 0x9b7bff, 80 + k * 50, 0.3);
    this.hud.announce('¡DESAFINADO!', { size: 80, ms: 700, color: '#9b7bff' });
  }

  /** Silenciado: una nota tachada flota sobre la cabeza mientras dura. */
  private drawSilence(time: number): void {
    const g = (this.silenceIcon ??= this.add.graphics().setDepth(24));
    g.clear();
    for (const f of [this.p1, this.p2]) {
      if (!f.silenced || this.solo || f.state === 'ko') continue;
      const x = f.x;
      const y = GROUND_Y - f.z - f.def.art.height - 50 + Math.sin(time / 250) * 6;
      const left = (f.silencedUntil - f.now) / 3000;
      g.fillStyle(0x000000, 0.55).fillCircle(x, y, 34);
      g.lineStyle(5, 0x9b7bff, 1).strokeCircle(x, y, 34);
      // Nota musical.
      g.fillStyle(0xffffff, 1).fillEllipse(x - 6, y + 10, 18, 13).fillRect(x + 1, y - 18, 4, 28);
      g.fillTriangle(x + 5, y - 18, x + 17, y - 10, x + 5, y - 6);
      // Tachada.
      g.lineStyle(6, 0xff3b4e, 1).lineBetween(x - 24, y + 24, x + 24, y - 24);
      // Tiempo que le queda.
      g.lineStyle(4, 0xffffff, 0.8);
      g.beginPath();
      g.arc(x, y, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, left));
      g.strokePath();
    }
  }

  private clearCages(): void {
    for (const c of this.cages) c.g.destroy();
    this.cages = [];
  }

  private resolveProjectiles(): void {
    const list = this.projectiles;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (!a.alive || !b.alive || a.owner === b.owner || !a.clashes || !b.clashes) continue;
        if (Math.abs(a.x - b.x) > a.radius + b.radius || Math.abs(a.z - b.z) > a.zReach + b.zReach) continue;
        // Libro-muro de Escalas: frena cualquier poder y sigue en pie.
        if (a.walled !== b.walled) {
          const [wall, shot] = a.walled ? [a, b] : [b, a];
          this.fx.hit((wall.x + shot.x) / 2, shot.y, COLORS.white, false);
          shot.lose();
          continue;
        }
        // Espejo de Mimético: copia el poder que lo toca y lo dispara de vuelta.
        if (a.spec.mirror !== b.spec.mirror) {
          const [mirror, shot] = a.spec.mirror ? [a, b] : [b, a];
          this.reflect(mirror, shot);
          continue;
        }
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
      // Jesex: la moneda le roba un poco de vida al rival.
      if (result === 'hit' && p.spec.drain) this.drain(p.owner, target, Math.round(damage * p.spec.drain));
      // El Virrey: al tercer acierto, el corte vuelve a él con el tributo.
      if (result === 'hit' && p.spec.tribute && ++p.owner.tributeHits % p.spec.tribute.every === 0) {
        this.tribute(p, Math.round(damage * p.spec.tribute.drain));
      }
      // George: la onda afinada lo deja sin poder un rato (no se acumula mientras dura).
      if (result === 'hit' && p.spec.silence && !target.silenced) this.silence(p.owner, target, p.spec.silence);
      const hx = p.spec.beam ? target.x - dir * 40 : p.x;
      if (result === 'hit' && p.spec.poison) this.poison(p.owner, target, p.move, p.spec.poison, p.damage);
      // Lick de Pentalick: sube de nivel si pega; si se lo bloquean, vuelve al 1.
      if (p.spec.levels) p.owner.lickLevel = result === 'hit' ? Math.min(p.spec.levels - 1, p.owner.lickLevel + 1) : 0;
      if (result === 'hit' && p.spec.tug) {
        // Tornado de Markus: jala un poco al rival hacia él (el rozamiento lo frena tras unos `tug` px).
        target.vx = -Math.sign(target.x - p.owner.x) * p.spec.tug * 9;
      }
      if (result === 'hit' && p.spec.pull) {
        // Latigazo de Rematada: lo jala hasta quedar a distancia de golpe (el rozamiento lo frena ahí).
        const gap = target.x - p.owner.x;
        target.vx = -Math.sign(gap) * Math.max(0, Math.abs(gap) - 230) * 9;
      }
      if (!p.onHit()) p.destroy();
      this.impact(p.owner, target, p.move, result, damage, hx, p.y, { projectile: true, heavy: true });
      if (result === 'hit' && p.caging) this.cage(target, p.color, p.spec.cage!, p.radius * 1.15);
    }
  }

  /** Veneno (lanza de Amu): burbujas verdes sobre el rival y, al rato, un golpe extra que no se bloquea. */
  private poison(owner: Fighter, target: Fighter, move: MoveDef, spec: { delay: number; damage: number }, base: number): void {
    const POISON = 0x7dff3a;
    const bubbles = 6;
    for (let k = 0; k < bubbles; k++) {
      this.time.delayedCall(k * 60, () => this.fx.rise(target.x + Phaser.Math.Between(-50, 50), GROUND_Y - target.z - Phaser.Math.Between(150, 380), POISON));
    }
    this.time.delayedCall(spec.delay, () => {
      if (this.phase !== 'fight' || !target.alive) return;
      const dir = (target.x >= owner.x ? 1 : -1) as 1 | -1;
      // Golpe corto: casi no aturde, para que el rival se recupere rápido.
      const sting = { ...move, push: 40, hitstun: 140, knockdown: false };
      const res = target.receive(owner, sting, {
        dir,
        fromX: owner.x,
        unblockable: true,
        damage: Math.round(base * spec.damage * target.def.stats.defense),
      });
      if (res.result === 'whiff') return;
      target.poisonUntil = target.now + 220;
      this.fx.hit(target.x, GROUND_Y - target.z - 260, POISON, false);
      this.impact(owner, target, sting, res.result, res.damage, target.x, GROUND_Y - target.z - 260, { projectile: true });
    });
  }

  /** El espejo se rompe y devuelve una copia del poder rival, desde donde estaba el espejo. */
  private reflect(mirror: Projectile, shot: Projectile): void {
    const { delay: _d, fork: _f, split: _s, orbit: _o, phase: _p, ...spec } = shot.spec;
    const copy = new Projectile(this, this.fx, mirror.owner, spec, mirror.color);
    copy.placeAt(mirror.x, mirror.z);
    this.projectiles.push(copy);
    this.fx.hit(mirror.x, mirror.y, COLORS.white, true);
    Audio.sfx(this, 'punch', 0.6, 1.3);
    shot.destroy();
    mirror.shatter();
  }

  /** Feedback de un impacto: hitstop, chispas, sonido, sacudida, combo y empuje en la esquina. */
  private impact(a: Fighter, b: Fighter, move: MoveDef, result: 'hit' | 'block', damage: number, x: number, y: number, opts: { projectile?: boolean; heavy?: boolean } = {}): void {
    const projectile = !!opts.projectile;
    this.training?.onImpact(a, b, move, result, damage);
    // Un golpe sin bloquear rompe el escudo de corazones (Kimberly): si no, sería imbatible de cerca.
    if (result === 'hit') for (const p of this.projectiles) if (p.owner === b && p.orbiting && !p.spec.charge) p.shatter();
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
    this.ultOwner = null;
    for (const p of this.projectiles) p.destroy();
    this.clearCages();
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

  /** Laboratorio: menú de luchadores y escenario encima de la pelea pausada. */
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
