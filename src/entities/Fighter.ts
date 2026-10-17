import { attackFrameIndex } from '../visuals/roster/AnimationTiming';
import { animationMetadata } from '../visuals/roster/RegeneratedArt';
import Phaser from 'phaser';
import { GROUND_Y, STAGE_LEFT, STAGE_RIGHT } from '../config';
import { tintOf, type FighterDef } from '../data/fighters';
import { CHAIN_FINISHER_BONUS, MOVES, comboScale, type MoveDef, type MoveId } from '../data/moves';
import { chainOf, kitOf, moveFor } from '../data/moveset';
import { POWERS, powerFist } from '../data/powers';
import { SOLOS } from '../data/solos';
import { superMotion } from '../visuals/supers/choreography';
import { artScale, poseFrames, resolvePose, type Pose } from '../systems/FighterArt';
import type { Fx } from '../systems/Fx';

/** Lo que un controlador (jugador o CPU) pide en este frame. Direcciones absolutas. */
export interface Intent {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  punch: boolean;
  kick: boolean;
  dash: boolean;
  /** Botón de súper (E): sale con la barra llena. */
  super: boolean;
  /** Puño mantenido (clic izquierdo apretado): carga los poderes que se cargan (Pepper). */
  punchHeld?: boolean;
}

export const NO_INTENT: Intent = { left: false, right: false, up: false, down: false, punch: false, kick: false, dash: false, super: false };

export type FighterState = 'intro' | 'idle' | 'walk' | 'crouch' | 'jump' | 'dash' | 'attack' | 'hurt' | 'block' | 'knockdown' | 'down' | 'getup' | 'win' | 'ko';

/** Servicios que la escena de pelea ofrece a los luchadores. */
export interface Arena {
  readonly now: number;
  readonly fx: Fx;
  spawnProjectile(owner: Fighter): void;
  hasProjectile(owner: Fighter): boolean;
  /** Pide permiso para el ultimate: manda el primero; responder al del rival provoca un choque (como MvC). */
  requestUltimate(owner: Fighter): boolean;
  /** Retrato a pantalla completa (congela la pelea). */
  superCutIn(owner: Fighter): void;
  /** Empieza el solo de guitarra tras el retrato. */
  startSolo(owner: Fighter): void;
  onDash(owner: Fighter): void;
  onAttack(owner: Fighter, move: MoveDef): void;
  /** Contraataque de `owner` (le pegaron en guardia): reaparece junto a `attacker` y le devuelve el golpe. */
  counter(owner: Fighter, attacker: Fighter): void;
}

export type HitResult = 'hit' | 'block' | 'whiff';

/** Golpes normales (no poderes, uppercut ni ultimate): los que carga el golpe de oro. */
export const isNormal = (move: MoveDef): boolean =>
  move.id === 'jab' || move.id === 'kick' || move.id === 'crouchJab' || move.id === 'sweep' || move.id === 'airPunch' || move.id === 'airKick';

const GRAVITY = 4300;
const JUMP_VZ = 1600;
const JUMP_VX = 430;
/** Uppercut: sube ~360 px en arco y vuelve al suelo en ~0,6 s (gravedad propia, más rápida que el salto). */
const UPPERCUT_VZ = 2400;
const UPPERCUT_VX = 380;
const UPPERCUT_GRAVITY = 8000;
const MAX_HP = 1000;
export const MAX_METER = 100;
/** Recarga del poder básico (ms): evita lanzarlo una y otra vez sin parar. */
export const POWER_COOLDOWN = 1400;
/** Carga máxima de los poderes que se cargan manteniendo el clic (ms). */
export const CHARGE_MS = 2000;
/** Una pulsación espera hasta este tiempo a que el luchador quede libre (p. ej. durante la recuperación de un golpe). */
const BUFFER_MS = 260;
/** Con arte de un solo cuadro, el golpe vuelve a la guardia pasada esta fracción de la recuperación. */
const RETRACT_AT = 0.45;
const DOUBLE_TAP_MS = 260;
const DASH_MS = 260;
const BACKDASH_MS = 300;
/** Ritmo general de desplazamiento: multiplica la velocidad de caminar y del dash de cada luchador. */
const WALK_MUL = 1.35;
/** Caminar hacia atrás es algo más lento que hacia adelante (como en los juegos de pelea). */
const BACK_WALK = 0.85;
/** Tempo imposible: caminar más rápido y golpes más cortos (multiplicadores). */
const HASTE_WALK = 1.4;
const HASTE_ATTACK = 0.72;
const DASH_MUL = 1.25;
const BACKDASH_MUL = 0.9;
/** Rozamiento durante el dash (más bajo = recorre más). */
const DASH_FRICTION = 2.5;
/** Distancia de un paso al caminar: un cuadro de la animación por paso (así los pies no patinan). */
const STEP_PX = 105;
/** Altura del saltito del dash hacia atrás. */
const BACKDASH_HOP = 42;
const DASH_COOLDOWN_MS = 140;
const DOWN_MS = 620;
const GETUP_MS = 400;
const LAND_MS = 60;

/** Dirección en notación numérica de los juegos de pelea, relativa a hacia dónde mira (6 = adelante). */
type Dir = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Secuencias de los especiales. Cada paso admite varias direcciones (más permisivo para teclado). */
const MOTIONS = {
  uppercut: { steps: [[6], [2, 1], [3]] as Dir[][], window: 500 },
  special: { steps: [[2], [3, 6]] as Dir[][], window: 420 },
};

/** Reacción visual del rival durante un súper: desplaza, gira, estira y tiñe el sprite sin tocar su cuerpo. */
export interface VictimPose {
  x?: number;
  y?: number;
  angle?: number;
  sx?: number;
  sy?: number;
  tint?: number;
  /** Tinte plano (silueta de un color) en vez de multiplicar. */
  fill?: boolean;
  alpha?: number;
}

export class Fighter {
  x: number;
  z = 0;
  vx = 0;
  vz = 0;
  facing: 1 | -1;
  hp = MAX_HP;
  /** Vida máxima (el jefe de la historia tiene más). */
  readonly maxHp: number = MAX_HP;
  /** Jefe enfurecido (segunda fase): más rápido y pega más. */
  rage = false;
  /** Reloj real del solo del jefe: su movimiento no se congela con el hitstop. */
  soloVisualTime: number | null = null;
  soloFinalAt: number | null = null;
  /** Elevación solo visual (px) durante el súper: el luchador flota mientras toca. */
  visualLift = 0;
  /** Rasgueo del solo (1 justo al sonar una nota, baja a 0): mueve la pose fija del súper. */
  soloPluck = 0;
  /** Pose solo visual que le impone el súper del rival (giro, temblor, color…). */
  fxPose: VictimPose | null = null;
  /** Tinte forzado (p. ej. amigo en "modo hater" en la historia). */
  tintOverride: number | null = null;
  meter = 0;
  /** Vida mínima tras un golpe (1 en entrenamiento: nadie cae K.O.). */
  minHp = 0;
  state: FighterState = 'intro';
  stateStart = 0;
  stateUntil = 0;
  move: MoveDef | null = null;
  moveStart = 0;
  /** El golpe actual ya conectó (impacto o bloqueo). */
  moveConnected = false;
  /** El golpe actual ya resolvió su impacto (no vuelve a pegar). */
  moveDone = false;
  /** Tempo imposible (Turboshred): hasta este momento camina y golpea más rápido. */
  hasteUntil = 0;
  /** Silenciado (onda de George): hasta este momento no puede usar su poder básico. */
  silencedUntil = 0;
  /** La embestida ya frenó (al conectar o al terminar su fase activa). */
  private rushStopped = false;
  private rushRingAt = 0;
  private lastHasteGhost = 0;
  private moveSpawned = false;
  /** Poder que se carga: momento en que empezó a cargar (-1 = no carga) y carga al soltar (0–1). */
  private chargeFrom = -1;
  private chargeStep = 0;
  shotCharge = 0;
  chainCount = 0;
  /** El golpe actual es el remate de una cadena (tumba y pega más). */
  finisher = false;
  private airAttackUsed = false;
  /** El golpe actual ya aguantó su impacto (armadura). */
  private armorUsed = false;
  invulnUntil = 0;
  /** Momento desde el que se puede volver a lanzar el poder básico. */
  powerReadyAt = 0;
  /**
   * Bloqueo trabado: se activa cuando el rival lanza su ultimate. Mantener ATRÁS durante el retrato no
   * cuenta; hay que soltar y volver a presionar para bloquear.
   */
  blockLocked = false;
  flashUntil = 0;
  /** Nivel del lick de Pentalick (0 = primero): sube con cada lick que pega. */
  lickLevel = 0;
  /** Aciertos acumulados del poder con tributo (El Virrey): cada tercero roba vida. */
  tributeHits = 0;
  /** Veces que lanzó su poder en la ronda (para los que cambian cada tantas, como la moneda de Jesex). */
  powerCasts = 0;
  /** Golpe de oro cargado (Slandor): multiplicador del próximo golpe normal que conecte (0 = sin cargar). */
  gold = 0;
  /** El golpe de oro se apaga solo en este momento. */
  goldUntil = 0;
  /** Envenenado (lanza de Amu): se ve medio verde hasta este momento. */
  poisonUntil = 0;
  /** Jaula de NOSU: vuelve a estar lista en este momento (mientras tanto dispara la esfera lisa). */
  cageReadyAt = 0;
  /** Golpes seguidos recibidos (para el contador de combo del rival). */
  comboTaken = 0;
  intent: Intent = NO_INTENT;
  opponent!: Fighter;

  readonly sprite: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Image;
  private scale: number;
  private pose: Pose = 'idle';
  private poseStart = 0;
  /** Golpe cuya animación se está mostrando (cada golpe nuevo la reinicia, aunque repita la pose). */
  private animMove = -1;
  /** Distancia caminada desde que empezó a caminar (sincroniza pasos y rebote). */
  private strideDist = 0;
  private tokens: { d: Dir; t: number }[] = [];
  private buffer: { btn: 'punch' | 'kick'; t: number } | null = null;
  private dashReadyAt = 0;
  /** Entrada a escena con dash desde fuera de la pantalla (al empezar la ronda). */
  private entrance: { from: number; to: number; start: number; ms: number } | null = null;
  private lastGhost = 0;

  constructor(
    private scene: Phaser.Scene,
    private arena: Arena,
    readonly def: FighterDef,
    x: number,
    facing: 1 | -1,
    readonly side: 0 | 1,
  ) {
    this.x = x;
    this.facing = facing;
    this.maxHp = def.boss?.hp ?? MAX_HP;
    this.hp = this.maxHp;
    this.scale = artScale(scene, def);
    this.shadow = scene.add.image(x, GROUND_Y, 'shadow').setDepth(15);
    this.sprite = scene.add.sprite(x, GROUND_Y, def.art.texture, `${def.art.prefix}idle`).setDepth(20);
    this.sync();
  }

  get now(): number {
    return this.arena.now;
  }

  get grounded(): boolean {
    return this.z <= 0 && this.vz <= 0;
  }

  get alive(): boolean {
    return this.hp > 0;
  }

  get crouching(): boolean {
    return this.state === 'crouch' || (this.state === 'block' && this.intent.down) || (this.state === 'attack' && (this.move?.id === 'crouchJab' || this.move?.id === 'sweep'));
  }

  /** Recarga del poder básico de este luchador (ms). */
  get powerCooldown(): number {
    return kitOf(this.def.id).powerCooldown ?? POWER_COOLDOWN;
  }

  /** Carga del poder básico (0 = recién lanzado o con el escudo activo, 1 = listo). */
  get powerCharge(): number {
    return this.powerReadyAt <= this.now ? 1 : Math.max(0, 1 - (this.powerReadyAt - this.now) / this.powerCooldown);
  }

  get invulnerable(): boolean {
    return this.now < this.invulnUntil || this.state === 'down' || this.state === 'getup' || this.state === 'ko' || this.state === 'win' || this.state === 'intro';
  }

  get hasted(): boolean {
    return this.now < this.hasteUntil;
  }

  get silenced(): boolean {
    return this.now < this.silencedUntil;
  }

  /** Tempo imposible por `ms`: la recarga del poder empieza recién al terminar. */
  haste(ms: number): void {
    this.hasteUntil = this.now + ms;
    this.powerReadyAt = Infinity;
  }

  /** En guardia de contraataque (fase activa). */
  get countering(): boolean {
    return this.state === 'attack' && !!this.move?.counter && this.phase !== 'recovery';
  }

  /** Fase del golpe actual. */
  get phase(): 'startup' | 'active' | 'recovery' | null {
    if (this.state !== 'attack' || !this.move) return null;
    const e = this.now - this.moveStart;
    const m = this.move;
    if (e < m.startup) return 'startup';
    if (m.air ? !this.grounded : e < m.startup + m.active) return 'active';
    return 'recovery';
  }

  /** Puede actuar libremente (caminar, saltar, atacar). */
  get free(): boolean {
    return this.state === 'idle' || this.state === 'walk' || this.state === 'crouch';
  }

  /** Distancia horizontal al rival. */
  get distance(): number {
    return Math.abs(this.opponent.x - this.x);
  }

  setState(state: FighterState, ms = 0): void {
    if (this.state !== state) this.stateStart = this.now;
    this.state = state;
    this.stateUntil = this.now + ms;
  }

  /** Coloca al luchador para empezar una ronda. */
  reset(x: number, facing: 1 | -1): void {
    this.x = x;
    this.z = this.vx = this.vz = 0;
    this.facing = facing;
    this.hp = this.maxHp;
    this.powerReadyAt = 0;
    this.hasteUntil = 0;
    this.silencedUntil = 0;
    this.blockLocked = false;
    this.rage = false;
    this.move = null;
    this.buffer = null;
    this.tokens = [];
    this.comboTaken = 0;
    this.chainCount = 0;
    this.invulnUntil = 0;
    this.poisonUntil = 0;
    this.gold = 0;
    this.lickLevel = 0;
    this.tributeHits = 0;
    this.powerCasts = 0;
    this.cageReadyAt = 0;
    this.entrance = null;
    this.sprite.setAlpha(1).setTint(this.tintOverride ?? tintOf(this.def));
    this.setState('intro');
    this.sync();
  }

  // ───────────────────────────── Entrada ─────────────────────────────

  private dirOf(i: Intent): Dir {
    const fwd = this.facing === 1 ? i.right : i.left;
    const back = this.facing === 1 ? i.left : i.right;
    const h = fwd && !back ? 1 : back && !fwd ? -1 : 0;
    const row = i.down ? 0 : i.up ? 6 : 3;
    return (row + 2 + h) as Dir;
  }

  /** Registra la dirección; devuelve true si se acaba de hacer un doble toque (dash). */
  private record(i: Intent): 'dash' | 'backdash' | null {
    const d = this.dirOf(i);
    const last = this.tokens[this.tokens.length - 1];
    if (last?.d === d) return null;
    this.tokens.push({ d, t: this.now });
    if (this.tokens.length > 20) this.tokens.shift();
    const n = this.tokens.length;
    if ((d === 6 || d === 4) && n >= 3) {
      const [a, b] = [this.tokens[n - 3], this.tokens[n - 2]];
      if (a.d === d && b.d === 5 && this.now - a.t < DOUBLE_TAP_MS) return d === 6 ? 'dash' : 'backdash';
    }
    return null;
  }

  private matches(name: keyof typeof MOTIONS): boolean {
    const { steps, window } = MOTIONS[name];
    let i = this.tokens.length - 1;
    let firstT = this.now;
    for (let s = steps.length - 1; s >= 0; s--) {
      while (i >= 0 && !steps[s].includes(this.tokens[i].d)) {
        // Entre pasos se toleran otras direcciones, pero el último paso debe ser reciente.
        if (s === steps.length - 1 && this.now - this.tokens[i].t > 200) return false;
        i--;
      }
      if (i < 0) return false;
      firstT = this.tokens[i].t;
      i--;
    }
    return this.now - firstT <= window;
  }

  /** Procesa la intención del controlador para este frame. */
  control(intent: Intent): void {
    this.intent = intent;
    // Tras el retrato del ultimate rival hay que soltar la dirección para volver a bloquear.
    if (this.blockLocked && !intent.left && !intent.right) this.blockLocked = false;
    if (this.state === 'intro' || this.state === 'win' || this.state === 'ko') return;
    const tap = this.record(intent);

    if (intent.punch || intent.kick) this.buffer = { btn: intent.punch ? 'punch' : 'kick', t: this.now };
    if (this.buffer && this.now - this.buffer.t > BUFFER_MS) this.buffer = null;

    // Súper con su botón: libre, o cancelando un golpe que conectó.
    const canCancel = this.state === 'attack' && this.moveConnected && !!this.move?.cancel && this.phase !== 'startup';
    if (intent.super && !this.silenced && this.meter >= MAX_METER && this.grounded && (this.free || canCancel) && this.arena.requestUltimate(this)) {
      this.buffer = null;
      this.startMove(MOVES.super, false);
      return;
    }

    if (this.buffer) {
      if (this.free || (this.state === 'jump' && !this.airAttackUsed)) {
        if (this.tryAttack(this.buffer.btn, false)) this.buffer = null;
      } else if (this.state === 'attack' && this.moveConnected && this.phase !== 'startup') {
        if (this.tryAttack(this.buffer.btn, true)) this.buffer = null;
      } else if (this.state === 'dash' && this.now - this.stateStart > 60 && this.vx * this.facing > 0) {
        // Dash + golpe: conserva parte del impulso.
        const keep = this.vx * 0.45;
        if (this.tryAttack(this.buffer.btn, false)) {
          this.buffer = null;
          this.vx = keep;
        }
      }
    }

    if (!this.free) return;
    const wantsDash = intent.dash ? (this.dirOf(intent) % 3 === 1 ? 'backdash' : 'dash') : tap;
    if (wantsDash && this.now >= this.dashReadyAt && this.grounded) {
      this.dash(wantsDash === 'backdash');
      return;
    }
    if (intent.up && this.grounded) {
      const h = (intent.right ? 1 : 0) - (intent.left ? 1 : 0);
      this.vz = JUMP_VZ;
      this.vx = h * JUMP_VX;
      this.z = 1;
      this.airAttackUsed = false;
      this.setState('jump');
      this.arena.fx.dust(this.x, GROUND_Y, h || this.facing, 5);
      return;
    }
    if (intent.down) {
      if (this.state !== 'crouch') this.setState('crouch');
      this.vx = 0;
      return;
    }
    const h = (intent.right ? 1 : 0) - (intent.left ? 1 : 0);
    if (h) {
      const forward = h === this.facing;
      this.vx = h * this.def.stats.walk * WALK_MUL * (forward ? 1 : BACK_WALK) * (this.rage ? 1.25 : 1) * (this.hasted ? HASTE_WALK : 1);
      if (this.state !== 'walk') this.setState('walk');
    } else if (this.state !== 'idle') {
      this.setState('idle');
    }
  }

  private dash(back: boolean): void {
    this.setState('dash', back ? BACKDASH_MS : DASH_MS);
    this.vx = (back ? -BACKDASH_MUL : 1) * this.facing * this.def.stats.dash * DASH_MUL * (this.rage ? 1.15 : 1);
    if (back) this.invulnUntil = this.now + 120;
    this.dashReadyAt = this.stateUntil + DASH_COOLDOWN_MS;
    this.arena.fx.dust(this.x, GROUND_Y, back ? -this.facing : this.facing, 10);
    this.arena.onDash(this);
  }

  /** Elige y arranca el golpe según botón, postura y movimientos de palanca. */
  private tryAttack(btn: 'punch' | 'kick', cancel: boolean): boolean {
    let id: MoveId | null = null;
    const air = this.state === 'jump' || !this.grounded;
    if (air) {
      if (this.airAttackUsed || cancel) return false;
      id = btn === 'kick' ? 'airKick' : 'airPunch';
    } else if (btn !== 'kick' && this.matches('uppercut')) {
      id = 'uppercut';
    } else if (btn !== 'kick' && this.matches('special') && (kitOf(this.def.id).multi || !this.arena.hasProjectile(this)) && !this.gold && this.now >= this.powerReadyAt && !this.silenced) {
      id = 'special';
    } else if (this.intent.down) {
      id = btn === 'kick' ? 'sweep' : 'crouchJab';
    } else {
      id = btn === 'kick' ? 'kick' : 'jab';
    }

    const special = id === 'special' || id === 'uppercut';
    if (cancel) {
      const current = this.move!;
      if (special ? !current.cancel : !current.chain?.includes(id) || this.chainCount >= chainOf(this.def.id)) return false;
    }
    this.startMove(moveFor(this.def.id, id), cancel && !special);
    return true;
  }

  /** Golpe del contraataque (FightScene.counter): pose de puño, sin zona de golpe propia (el daño ya lo aplica la escena). */
  playCounterStrike(): void {
    this.startMove({ ...moveFor(this.def.id, 'jab'), id: 'special', pose: 'punch', startup: 0, active: 140, recovery: 320, reach: 0, lunge: 0 }, false);
    this.moveSpawned = true;
    // Guardia exitosa: 0,5 s extra de recarga respecto a una guardia sin respuesta.
    this.powerReadyAt = this.now + this.powerCooldown + 500;
  }

  private startMove(move: MoveDef, chained: boolean): void {
    // Con el tempo imposible, los golpes salen y se recuperan más rápido (el ultimate no).
    if (this.hasted && move.id !== 'super') move = { ...move, startup: move.startup * HASTE_ATTACK, active: move.air ? move.active : move.active * HASTE_ATTACK, recovery: move.recovery * HASTE_ATTACK };
    this.chainCount = chained ? this.chainCount + 1 : 1;
    this.finisher = chained && this.chainCount >= chainOf(this.def.id);
    this.move = move;
    this.armorUsed = false;
    this.moveStart = this.now;
    this.moveConnected = false;
    this.moveDone = false;
    this.moveSpawned = false;
    this.rushStopped = false;
    this.chargeFrom = -1;
    this.chargeStep = 0;
    this.shotCharge = 0;
    if (move.air) this.airAttackUsed = true;
    if (!move.air) this.vx = this.grounded ? this.facing * (move.lunge ?? 0) : this.vx;
    if (move.invuln) this.invulnUntil = this.now + move.invuln;
    if (move.id === 'super') {
      this.meter = 0;
      // Cancelado desde un golpe que conectó: el rival queda atrapado hasta que llegan las notas.
      const o = this.opponent;
      if (o.state === 'hurt') o.stateUntil = Math.max(o.stateUntil, this.now + move.startup + 900);
      this.arena.superCutIn(this);
    }
    this.setState('attack', 99999);
    this.arena.onAttack(this, move);
  }

  // ───────────────────────────── Impactos ─────────────────────────────

  /** ¿Este golpe cuerpo a cuerpo puede impactar ahora? */
  get hitboxActive(): boolean {
    return this.phase === 'active' && !this.moveDone && !!this.move && this.move.reach > 0;
  }

  /** Comprueba alcance y altura contra el rival. */
  inReach(target: Fighter): boolean {
    const m = this.move!;
    const ahead = (target.x - this.x) * this.facing;
    if (ahead < -40 || ahead > m.reach) return false;
    if (m.air) return Math.abs(this.z - target.z) < 300;
    return target.z < (m.antiAir ? 520 : 220);
  }

  /** Daño final de un golpe de este luchador contra `target`. */
  damageAgainst(target: Fighter, move: MoveDef, hitNumber: number): number {
    const bonus = this.finisher && this.move === move ? CHAIN_FINISHER_BONUS : 1;
    const gold = this.gold && isNormal(move) ? this.gold : 1;
    return Math.round(move.damage * this.def.stats.damage * (this.rage ? 1.15 : 1) * target.def.stats.defense * comboScale(hitNumber) * bonus * gold);
  }

  /** ¿Está bloqueando un golpe de `level` que viene desde `fromX`? */
  blocks(level: MoveDef['level'], fromX: number): boolean {
    if (!this.grounded || this.blockLocked) return false;
    if (!(this.free || this.state === 'block')) return false;
    const back = fromX > this.x ? this.intent.left : this.intent.right;
    if (!back) return false;
    if (level === 'low') return this.intent.down;
    if (level === 'high') return !this.intent.down;
    return true;
  }

  /**
   * Recibe un golpe. `dir` = sentido del empuje. `chip` = fracción del daño que pasa al bloquear.
   * Devuelve el resultado y el daño aplicado.
   */
  receive(attacker: Fighter, move: MoveDef, opts: { dir: 1 | -1; chip?: number; fromX: number; finisher?: boolean; damage?: number; unblockable?: boolean }): { result: HitResult; damage: number } {
    if (this.invulnerable) return { result: 'whiff', damage: 0 };
    const armored = this.absorb(attacker, move, opts.damage);
    if (armored) return armored;
    // Contraataque: recibe el daño igual (no es invulnerable), pero no se corta y devuelve el golpe.
    if (this.countering && this.phase === 'active' && move.id !== 'superNote' && attacker !== this) {
      const damage = Math.round(opts.damage ?? attacker.damageAgainst(this, move, 1));
      if (this.hp - damage > this.minHp) {
        // Sin destello blanco: así no se confunde con el rival golpeado en el contraataque.
        this.hp -= damage;
        this.meter = Math.min(MAX_METER, this.meter + move.meter / 2);
        attacker.meter = Math.min(MAX_METER, attacker.meter + move.meter);
        this.arena.counter(this, attacker);
        return { result: 'hit', damage };
      }
    }

    if (!opts.unblockable && this.blocks(move.level, opts.fromX)) {
      const chip = Math.round((opts.damage ?? move.damage) * (opts.chip ?? 0));
      this.hp = Math.max(1, this.hp - chip); // el bloqueo no remata
      this.setState('block', move.blockstun);
      this.vx = opts.dir * move.push * 1.15;
      this.meter = Math.min(MAX_METER, this.meter + 3);
      attacker.meter = Math.min(MAX_METER, attacker.meter + move.meter / 2);
      return { result: 'block', damage: chip };
    }

    // Golpe de oro: se pierde si le pegan limpio.
    if (this.gold) this.loseGold();
    const juggling = this.state === 'hurt' || this.state === 'knockdown';
    this.comboTaken = juggling ? this.comboTaken + 1 : 1;
    const damage = Math.round(opts.damage !== undefined
      ? opts.damage * comboScale(this.comboTaken)
      : attacker.damageAgainst(this, move, this.comboTaken));
    this.hp = Math.max(this.minHp, this.hp - damage);
    this.flashUntil = this.now + 70;
    this.move = null;
    this.buffer = null;
    this.meter = Math.min(MAX_METER, this.meter + move.meter / 2);
    attacker.meter = Math.min(MAX_METER, attacker.meter + move.meter);

    const knock = move.knockdown || opts.finisher || !this.grounded || this.hp <= 0;
    if (knock) {
      this.setState('knockdown', 99999);
      this.vx = opts.dir * (move.push * 0.8 + 240);
      this.vz = move.id === 'uppercut' ? 1750 : 1050;
      this.z = Math.max(this.z, 1);
    } else {
      this.setState('hurt', move.hitstun);
      this.vx = opts.dir * move.push;
    }
    return { result: 'hit', damage };
  }

  /**
   * Armadura (Mayin): durante un golpe con armadura aguanta un impacto sin cortarse.
   * Recibe el daño igual, pero sigue con su golpe. No aguanta las notas del ultimate ni un golpe que lo deja K.O.
   */
  private absorb(attacker: Fighter, move: MoveDef, fixed?: number): { result: HitResult; damage: number } | null {
    const m = this.move;
    if (this.state !== 'attack' || !m || this.armorUsed || move.id === 'superNote' || this.phase === 'recovery') return null;
    if (!kitOf(this.def.id).armor?.includes(m.id)) return null;
    const damage = fixed !== undefined ? fixed : attacker.damageAgainst(this, move, 1);
    if (this.hp - damage <= this.minHp) return null;
    this.armorUsed = true;
    this.hp -= damage;
    this.flashUntil = this.now + 90;
    this.meter = Math.min(MAX_METER, this.meter + move.meter / 2);
    attacker.meter = Math.min(MAX_METER, attacker.meter + move.meter);
    this.arena.fx.ring(this.x, GROUND_Y - this.z - this.def.art.height * 0.5, 0xffb347, 150, 0.25);
    return { result: 'hit', damage };
  }

  get chargeable(): boolean {
    return !!POWERS[this.def.id]?.some((s) => s.charged);
  }

  /**
   * Carga del poder (Pepper): sigue cargando mientras el clic está apretado y no pasaron CHARGE_MS.
   * Brillo en el puño que crece; destello al llegar al máximo. Devuelve true mientras siga cargando.
   */
  private holdCharge(now: number): boolean {
    if (this.chargeFrom < 0) this.chargeFrom = now;
    const k = Math.min(1, (now - this.chargeFrom) / CHARGE_MS);
    this.shotCharge = k;
    if (!this.intent.punchHeld || k >= 1) return false;
    const h = this.def.art.height;
    const [fx, fz] = powerFist(this.def.id);
    const x = this.x + this.facing * h * fx;
    const y = GROUND_Y - this.z - h * fz;
    if (Math.random() < 0.8) this.arena.fx.trail(x, y, this.def.color, 18 + 50 * k);
    // Cada cuarto de carga, un anillo (el último, blanco: carga completa).
    const step = Math.floor(k * 4);
    if (step > this.chargeStep) this.arena.fx.ring(x, y, step >= 3 ? 0xffffff : this.def.color, 50 + step * 25, 0.2);
    this.chargeStep = step;
    return true;
  }

  /** Carga el golpe de oro por `ms` (Slandor). */
  chargeGold(mult: number, ms: number): void {
    this.gold = mult;
    this.goldUntil = this.now + ms;
  }

  /** Se apaga el golpe de oro sin usarlo (le pegaron o se acabó el tiempo). */
  private loseGold(): void {
    this.gold = 0;
    this.arena.fx.ring(this.x, GROUND_Y - this.z - this.def.art.height * 0.5, 0x8a7a40, 120, 0.25);
  }

  /** Empuje al rival contra la pared: retrocede el atacante. */
  pushback(amount: number): void {
    this.vx -= this.facing * amount;
  }

  // ───────────────────────────── Simulación ─────────────────────────────

  /** Entra a escena con un dash desde `from` hasta su posición actual, empezando dentro de `delay` ms. */
  dashIn(from: number, delay: number, ms = 420): void {
    this.entrance = { from, to: this.x, start: this.now + delay, ms };
    this.x = from;
    this.sync();
  }

  get entering(): boolean {
    return this.entrance !== null;
  }

  update(dt: number): void {
    const now = this.now;

    if (this.entrance) {
      const e = this.entrance;
      const t = Phaser.Math.Clamp((now - e.start) / e.ms, 0, 1);
      const k = 1 - (1 - t) ** 3;
      this.x = e.from + (e.to - e.from) * k;
      if (t > 0 && t < 1 && now - this.lastGhost > 35) {
        if (this.lastGhost < e.start) this.arena.onDash(this);
        this.lastGhost = now;
        this.arena.fx.ghost(this.sprite, this.def.color, 0.45);
      }
      if (t >= 1) {
        this.entrance = null;
        this.x = e.to;
        this.arena.fx.dust(this.x, GROUND_Y, this.facing, 12);
      }
      this.sync();
      return;
    }

    // Golpes: proyectiles, impulso del uppercut y fin del golpe.
    if (this.state === 'attack' && this.move) {
      const m = this.move;
      const e = now - this.moveStart;
      if (!this.moveSpawned && e >= m.startup && m.id === 'special' && this.chargeable && this.holdCharge(now)) {
        // Cargando: el golpe se queda en su pose hasta soltar el clic.
        this.moveStart = now - m.startup;
      } else if (!this.moveSpawned && e >= m.startup) {
        this.moveSpawned = true;
        if (m.id === 'special') {
          this.powerReadyAt = now + this.powerCooldown;
          if (m.rush) {
            this.vx = this.facing * m.rush.speed;
            this.arena.onDash(this);
            this.arena.fx.dust(this.x, GROUND_Y, this.facing, 12);
          } else if (m.counter) {
            // La recarga recién corre cuando termina la guardia (ver más abajo).
            this.powerReadyAt = Infinity;
          } else this.arena.spawnProjectile(this);
        }
        if (m.id === 'super') this.arena.startSolo(this);
        if (m.id === 'uppercut') {
          // Salto alto en arco: sube y avanza, y cae un poco más adelante.
          this.vz = UPPERCUT_VZ;
          this.z = 1;
          this.vx = this.facing * UPPERCUT_VX;
        }
      }
      // Guardia de contraataque: páginas de luz que giran a su alrededor mientras espera el golpe.
      if (m.counter && this.phase === 'active' && now - this.lastGhost > 70) {
        this.lastGhost = now;
        this.arena.fx.ghost(this.sprite, 0xe0b862, 0.4, 200, 0.05);
        const a = now / 120;
        const h = this.def.art.height;
        this.arena.fx.trail(this.x + Math.cos(a) * h * 0.32, GROUND_Y - this.z - h * (0.5 + Math.sin(a) * 0.3), 0xe0b862, 30);
      }
      // Embestida: aura de ataque al prepararla (para que se lea como golpe, no como un dash normal).
      if (m.rush && !this.moveSpawned && now - this.lastGhost > 40) {
        this.lastGhost = now;
        this.arena.fx.ghost(this.sprite, m.rush.trail, 0.6, 220, 0.05);
      }
      // Mantiene la velocidad mientras está activa; frena en seco al conectar o al terminar.
      if (m.rush && this.moveSpawned && !this.rushStopped) {
        if (this.phase === 'active' && !this.moveDone) {
          this.vx = this.facing * m.rush.speed;
          if (now - this.lastGhost > 28) {
            this.lastGhost = now;
            // Estela detrás, aura encendida alrededor del cuerpo y chispas en el frente del golpe.
            this.arena.fx.ghost(this.sprite, m.rush.trail, 0.55, 260);
            this.arena.fx.ghost(this.sprite, 0xffffff, 0.35, 140, 0.04);
            const front = this.x + this.facing * this.def.art.height * 0.28;
            const y = GROUND_Y - this.z - this.def.art.height * 0.55;
            for (let k = 0; k < 3; k++) this.arena.fx.trail(front + Phaser.Math.Between(-20, 20), y + Phaser.Math.Between(-90, 90), m.rush.trail, 46);
          }
          if (now - this.rushRingAt > 90) {
            this.rushRingAt = now;
            this.arena.fx.ring(this.x + this.facing * this.def.art.height * 0.3, GROUND_Y - this.z - this.def.art.height * 0.55, m.rush.trail, 120, 0.18);
          }
        } else {
          this.rushStopped = true;
          this.vx *= 0.12;
        }
      }
      const total = m.startup + m.active + m.recovery;
      if (!m.air && e >= total && this.grounded) {
        this.move = null;
        this.setState(this.intent.down ? 'crouch' : 'idle');
      }
    }

    // Poderes con recarga diferida (guardia, velocidad): empieza a correr cuando termina su efecto.
    if (this.powerReadyAt === Infinity && !this.countering && !this.hasted && !this.arena.hasProjectile(this)) this.powerReadyAt = now + this.powerCooldown;
    // Tempo imposible: estela amarilla de copias y viento que lo atraviesa mientras dura.
    if (this.hasted) {
      if (now - this.lastHasteGhost > 55) {
        this.lastHasteGhost = now;
        this.arena.fx.ghost(this.sprite, 0xffee32, 0.4, 220);
      }
      const h = this.def.art.height;
      // Rayas de viento que salen de atrás y lo pasan en la dirección en que se mueve, también al saltar y caer
      // (en pantalla, y crece hacia abajo: subir es vy negativo). Quieto, apuntan hacia donde mira.
      const sx = this.vx;
      const sy = this.grounded ? 0 : -this.vz;
      const speed = Math.hypot(sx, sy);
      const moving = speed > 50;
      const ux = moving ? sx / speed : this.facing;
      const uy = moving ? sy / speed : 0;
      for (let i = 0; i < (moving ? 3 : 2); i++) {
        if (Math.random() > dt * 40) continue;
        // Punto al azar sobre el cuerpo, corrido hacia atrás del movimiento.
        const back = Phaser.Math.Between(Math.round(h * 0.1), Math.round(h * 0.5));
        const side = Phaser.Math.Between(-Math.round(h * 0.35), Math.round(h * 0.35));
        const cx = this.x;
        const cy = GROUND_Y - this.z - h * 0.5;
        const x = cx - ux * back - uy * side;
        const y = cy - uy * back + ux * side;
        const v = Phaser.Math.Between(moving ? 2600 : 1600, moving ? 3600 : 2400);
        this.arena.fx.wind(x, y, ux * v, uy * v, Math.random() < 0.6 ? 0xffffff : 0xffee32, Phaser.Math.Between(2, 5));
      }
      // Polvo a los pies al correr.
      if (moving && this.grounded && Math.random() < dt * 12) this.arena.fx.dust(this.x, GROUND_Y, this.facing, 2);
    }

    if (this.state === 'dash' && now >= this.stateUntil) {
      // El dash frena en seco (sin seguir patinando en guardia) con un leve aplastamiento al caer.
      this.vx *= 0.15;
      this.setState('idle', LAND_MS);
    } else if ((this.state === 'hurt' || this.state === 'block') && now >= this.stateUntil) {
      this.setState('idle');
    } else if (this.state === 'down' && now >= this.stateUntil) {
      this.setState('getup', GETUP_MS);
    } else if (this.state === 'getup' && now >= this.stateUntil) {
      this.invulnUntil = now + 120;
      this.setState('idle');
    }
    if (this.state !== 'hurt' && this.state !== 'knockdown' && this.state !== 'down') this.comboTaken = 0;

    // Física
    if (this.state === 'walk' && this.grounded) this.strideDist += Math.abs(this.vx * dt);
    this.x += this.vx * dt;
    if (this.z > 0 || this.vz > 0) {
      this.vz -= (this.state === 'attack' && this.move?.id === 'uppercut' ? UPPERCUT_GRAVITY : GRAVITY) * dt;
      this.z += this.vz * dt;
      if (this.z <= 0) this.land();
    } else if (this.state !== 'walk') {
      const friction = this.state === 'dash' ? DASH_FRICTION : 9;
      this.vx *= Math.max(0, 1 - friction * dt);
    }
    this.x = Phaser.Math.Clamp(this.x, STAGE_LEFT, STAGE_RIGHT);

    // Mira al rival cuando puede girarse.
    if (this.grounded && (this.free || this.state === 'getup' || this.state === 'intro')) {
      this.facing = this.opponent.x >= this.x ? 1 : -1;
    }

    // Golpe de oro cargado: chispas doradas que suben; se apaga solo al cumplir su tiempo.
    if (this.gold && now >= this.goldUntil) this.loseGold();
    if (this.gold && Math.random() < dt * 14) {
      this.arena.fx.rise(this.x + Phaser.Math.Between(-60, 60), GROUND_Y - this.z - Phaser.Math.Between(80, this.def.art.height), 0xffd23f);
    }
    if (this.state === 'dash' && now - this.lastGhost > 40) {
      this.lastGhost = now;
      this.arena.fx.ghost(this.sprite, this.def.color, 0.45);
    }
    if (this.state === 'attack' && this.move?.id === 'super' && this.phase === 'startup' && now - this.lastGhost > 50) {
      this.lastGhost = now;
      this.arena.fx.ghost(this.sprite, this.def.color, 0.6, 320);
    }
    this.sync();
  }

  private land(): void {
    this.z = 0;
    this.vz = 0;
    if (this.state === 'knockdown') {
      this.arena.fx.dust(this.x, GROUND_Y, this.vx > 0 ? -1 : 1, 14);
      this.scene.cameras.main.shake(90, 0.004);
      this.vx *= 0.4;
      if (this.alive) this.setState('down', DOWN_MS);
      else this.setState('ko', 99999);
    } else if (this.state === 'jump' || (this.state === 'attack' && this.move?.air)) {
      this.move = null;
      this.vx = 0;
      this.setState('idle', LAND_MS);
      this.arena.fx.dust(this.x, GROUND_Y, this.facing, 4);
    } else if (this.state === 'attack' && this.move?.id === 'uppercut') {
      // La recuperación del uppercut corre al caer.
      this.vx = 0;
    }
  }

  /** Termina el súper cuando acaba el solo. */
  endSuper(): void {
    if (this.move?.id !== 'super') return;
    this.move = null;
    this.invulnUntil = this.now + 150;
    this.setState('idle');
  }

  /** Pose de victoria / derrota al terminar la ronda. */
  celebrate(): void {
    this.move = null;
    this.vx = 0;
    this.setState('win', 99999);
  }

  // ───────────────────────────── Dibujo ─────────────────────────────

  /** Cuadros de arte propio que tiene una pose de golpe (0 = simulada). */
  private attackFrames(pose: Pose): number {
    return poseFrames(this.scene, this.def, pose).length;
  }

  private currentPose(): Pose {
    switch (this.state) {
      case 'intro': return this.entrance && this.now >= this.entrance.start ? 'dash' : 'intro';
      case 'win': return 'win';
      case 'ko': return 'ko';
      case 'walk': return this.vx * this.facing > 0 ? 'walk' : 'walkBack';
      case 'crouch': return 'crouch';
      case 'jump': return this.vz > 0 ? 'jump' : 'fall';
      case 'dash': return this.vx * this.facing > 0 ? 'dash' : 'backdash';
      case 'attack': {
        const m = this.move;
        if (!m) return 'idle';
        // Arte de un solo cuadro: a mitad de la recuperación vuelve a la guardia (si no, parece congelado).
        if (!m.air && m.id !== 'super' && this.phase === 'recovery' && this.attackFrames(m.pose) <= 1) {
          const intoRecovery = this.now - this.moveStart - m.startup - m.active;
          if (intoRecovery > m.recovery * RETRACT_AT) return this.intent.down ? 'crouch' : 'idle';
        }
        return m.pose;
      }
      case 'hurt': return this.intent.down ? 'crouchHurt' : 'hurt';
      case 'block': return this.intent.down ? 'crouchBlock' : 'block';
      case 'knockdown': return 'knockdown';
      case 'down': return 'down';
      case 'getup': return 'getup';
      default: return 'idle';
    }
  }

  sync(): void {
    const now = this.now;
    const pose = this.currentPose();
    const newMove = this.state === 'attack' && this.moveStart !== this.animMove;
    if (pose !== this.pose || newMove) {
      if (pose === 'walk' || pose === 'walkBack') this.strideDist = 0;
      this.pose = pose;
      this.poseStart = now;
      if (this.state === 'attack') this.animMove = this.moveStart;
    }
    const t = now - this.poseStart;
    const regenerated = !!animationMetadata(this.scene, this.def);
    // Golpes en el suelo: la animación sigue las fases del golpe (preparación → impacto → recuperación)
    // en vez de repetirse en bucle; así cada golpe se ve completo y termina limpio.
    const m = this.state === 'attack' ? this.move : null;
    const phased = !!m && !m.air && m.id !== 'super' && pose === m.pose;
    const frames = phased ? this.attackFrames(pose) : 0;
    let visualTime = t;
    // Caminar: el cuadro avanza con la distancia recorrida (un cuadro por paso).
    const walking = pose === 'walk' || pose === 'walkBack';
    const steps = this.strideDist / STEP_PX;
    if (walking) visualTime = (Math.floor(steps) % Math.max(1, poseFrames(this.scene, this.def, pose).length)) * (1000 / 12) + 1;
    if (phased && frames > 1) {
      const FRAME = 1000 / 12;
      let index = this.phase === 'startup' ? 0 : this.phase === 'active' ? Math.min(frames - 1, Math.ceil((frames - 1) / 2)) : frames - 1;
      const metadata = animationMetadata(this.scene, this.def);
      if (metadata && m && this.phase) {
        index = attackFrameIndex(now - this.moveStart, this.phase, m, frames, metadata.phaseFrames[pose]);
      }
      visualTime = index * FRAME + 1;
    }
    const loops = !phased && !(regenerated && m?.air) && pose !== 'dash' && pose !== 'backdash' && pose !== 'knockdown' && pose !== 'getup' && pose !== 'ko';
    const r = resolvePose(this.scene, this.def, pose, visualTime, loops);
    if (this.sprite.frame.name !== r.frame) this.sprite.setFrame(r.frame);

    let sx = r.sx;
    let sy = r.sy;
    let ox = 0;
    let oy = r.dy;
    let angle = r.angle;
    const breathing = pose === 'idle' || pose === 'crouch' || pose === 'intro' || pose === 'block' || pose === 'crouchBlock';
    if (breathing && !regenerated) sy *= 1 + Math.sin(now / 240 + this.side) * 0.014;
    if (walking && !regenerated) {
      // Un rebote por paso, en sincronía con el cambio de cuadro, e inclinación según la dirección.
      const stepPhase = steps % 1;
      oy -= Math.sin(stepPhase * Math.PI) * 9;
      angle += pose === 'walk' ? 2.5 : -3;
      sy *= 1 - Math.sin(stepPhase * Math.PI) * 0.012;
    }
    if (!regenerated && (pose === 'backdash' || pose === 'dash')) {
      const p = Phaser.Math.Clamp((now - this.stateStart) / (pose === 'dash' ? DASH_MS : BACKDASH_MS), 0, 1);
      if (pose === 'backdash') {
        // Saltito hacia atrás: arco, inclinado hacia atrás y enderezándose al caer.
        oy -= Math.sin(p * Math.PI) * BACKDASH_HOP;
        angle -= 10 * (1 - p);
      } else {
        // Dash adelante: inclinado y estirado en el impulso.
        angle += 6 * (1 - p);
        sx *= 1 + 0.05 * (1 - p);
      }
    }
    if (this.state === 'hurt' && t < 140) ox = Math.sin(now * 0.09) * 7;
    if (!regenerated && this.state === 'attack' && this.phase === 'active' && !this.move?.air) sx *= 1.03;
    // Golpe de un solo cuadro: breve preparación hacia atrás antes del impacto.
    if (phased && frames <= 1 && this.phase === 'startup') {
      sx *= 0.95;
      angle -= 5;
    }
    if (this.state === 'attack' && this.phase === 'startup' && this.move?.id === 'super') ox = Math.sin(now * 0.12) * 4;
    if (pose === 'win' && !regenerated) oy -= Math.abs(Math.sin(now / 180)) * 18;
    // Uppercut en el aire: se inclina hacia adelante al subir y se endereza al caer.
    if (!regenerated && this.state === 'attack' && this.move?.id === 'uppercut' && !this.grounded) angle += Phaser.Math.Clamp(this.vz / 290, -3, 8);
    if (pose === 'super' && this.soloVisualTime !== null) {
      const t = this.soloVisualTime;
      const motion = superMotion(this.def.id, t, SOLOS[this.def.superMove.solo].duration,
        this.soloPluck, this.soloFinalAt === null ? null : t - this.soloFinalAt);
      ox += motion.x * this.facing;
      oy += motion.y;
      angle += motion.angle;
      sx *= motion.sx;
      sy *= motion.sy;
    }
    // Patada voladora: arco visual mientras dura la embestida (el cuerpo sigue en el piso).
    const rush = this.state === 'attack' ? this.move?.rush : undefined;
    if (rush?.hop && this.move) {
      const k = Phaser.Math.Clamp((now - this.moveStart - this.move.startup) / this.move.active, 0, 1);
      oy -= Math.sin(k * Math.PI) * rush.hop;
    }
    const fp = this.fxPose;
    if (fp) {
      ox += fp.x ?? 0;
      oy += fp.y ?? 0;
      angle += fp.angle ?? 0;
      sx *= fp.sx ?? 1;
      sy *= fp.sy ?? 1;
    }
    // El jefe pisa el mismo suelo que los demás, pero ondula como una señal.
    if (this.def.boss && pose !== 'down' && pose !== 'ko' && pose !== 'knockdown') sx *= 1 + Math.sin(now / 90) * 0.012;
    oy -= this.visualLift;
    // Aterrizaje: aplastamiento breve.
    if (!regenerated && this.state === 'idle' && now < this.stateUntil) sy *= 0.94;

    this.sprite
      .setScale(this.scale * sx, this.scale * sy)
      .setFlipX(this.facing < 0)
      .setAngle(angle * this.facing)
      .setPosition(this.x + ox, GROUND_Y - this.z + oy)
      .setDepth(this.state === 'attack' ? 22 : 20);

    if (now < this.flashUntil) this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (now < this.poisonUntil) this.sprite.setTint(0x9dff6a).setTintMode(Phaser.TintModes.MULTIPLY);
    else if (this.state === 'block') this.sprite.setTint(0x9cc8ff).setTintMode(Phaser.TintModes.MULTIPLY);
    // Golpe de oro: dorado, y parpadea el último segundo antes de apagarse.
    else if (this.gold && !(this.goldUntil - now < 1000 && Math.floor(now / 90) % 2 === 0)) this.sprite.setTint(0xffe27a).setTintMode(Phaser.TintModes.MULTIPLY);
    else if (this.def.boss && this.def.art.placeholder) {
      // Entidad de sonido: silueta de luz (cian; roja al enfurecerse) que flota.
      this.sprite.setTint(this.rage ? 0xff4d6d : this.def.color).setTintMode(Phaser.TintModes.FILL);
    } else this.sprite.setTint(this.tintOverride ?? tintOf(this.def)).setTintMode(Phaser.TintModes.MULTIPLY);
    if (fp?.tint !== undefined) this.sprite.setTint(fp.tint).setTintMode(fp.fill ? Phaser.TintModes.FILL : Phaser.TintModes.MULTIPLY);
    const blink = this.state === 'getup' && Math.floor(now / 70) % 2 === 0;
    this.sprite.setAlpha(fp?.alpha ?? (blink ? 0.5 : this.def.boss && this.def.art.placeholder ? 0.86 : 1));

    const k = Phaser.Math.Clamp(1 - this.z / 600, 0.45, 1);
    this.shadow.setPosition(this.x, GROUND_Y + 6).setScale(k * (pose === 'down' || pose === 'ko' ? 1.8 : 1.1), k).setAlpha(0.75 * k);
  }

  destroy(): void {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
