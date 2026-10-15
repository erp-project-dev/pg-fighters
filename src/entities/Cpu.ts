import type { CpuLevel, Difficulty } from '../systems/Settings';
import { MAX_METER, NO_INTENT, type Fighter, type Intent } from './Fighter';
import type { Projectile } from './Projectile';

export type Rel = 'fwd' | 'back' | 'up' | 'down';

/** Un paso de entrada: direcciones mantenidas `ms` milisegundos; los botones se pulsan al empezar el paso. */
export interface Step {
  dirs: Rel[];
  punch?: boolean;
  kick?: boolean;
  dash?: boolean;
  super?: boolean;
  ms: number;
}

interface Profile {
  react: [number, number];
  block: number;
  antiAir: number;
  dodge: number;
  special: number;
  aggro: number;
  combo: number;
  punish: number;
}

const PROFILES: Record<Difficulty, Profile> = {
  easy: { react: [420, 650], block: 0.2, antiAir: 0.12, dodge: 0.2, special: 0.2, aggro: 0.45, combo: 0.25, punish: 0.15 },
  normal: { react: [230, 380], block: 0.5, antiAir: 0.45, dodge: 0.5, special: 0.32, aggro: 0.6, combo: 0.6, punish: 0.5 },
  hard: { react: [120, 220], block: 0.78, antiAir: 0.75, dodge: 0.75, special: 0.38, aggro: 0.7, combo: 0.9, punish: 0.85 },
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Perfil intermedio entre fácil (0) y difícil (1). */
const blend = (k: number): Profile => {
  const a = PROFILES.easy;
  const b = PROFILES.hard;
  const t = Math.min(1, Math.max(0, k));
  return {
    react: [lerp(a.react[0], b.react[0], t), lerp(a.react[1], b.react[1], t)],
    block: lerp(a.block, b.block, t),
    antiAir: lerp(a.antiAir, b.antiAir, t),
    dodge: lerp(a.dodge, b.dodge, t),
    special: lerp(a.special, b.special, t),
    aggro: lerp(a.aggro, b.aggro, t),
    combo: lerp(a.combo, b.combo, t),
    punish: lerp(a.punish, b.punish, t),
  };
};

const F = 34; // ~2 frames por dirección en los movimientos de palanca

/** Secuencias reutilizables (también las usan los combos de demostración del entrenamiento). */
export const SEQ = {
  special: (): Step[] => [{ dirs: ['down'], ms: F }, { dirs: ['down', 'fwd'], ms: F }, { dirs: ['fwd'], ms: F }, { dirs: ['fwd'], punch: true, ms: 60 }],
  uppercut: (): Step[] => [{ dirs: ['fwd'], ms: F }, { dirs: ['down'], ms: F }, { dirs: ['down', 'fwd'], punch: true, ms: 60 }],
  /** Botón de súper (E). */
  super: (): Step[] => [{ dirs: [], super: true, ms: 80 }],
  hold: (dirs: Rel[], ms: number): Step[] => [{ dirs, ms }],
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Ejecuta una lista de pasos como pulsaciones (direcciones relativas a hacia dónde mira el luchador). */
export class StepPlayer {
  private queue: Step[] = [];
  private stepStart = 0;
  private stepFired = false;

  constructor(private self: Fighter) {}

  get busy(): boolean {
    return this.queue.length > 0;
  }

  play(steps: Step[], now: number, interrupt = false): void {
    if (interrupt || !this.queue.length) {
      this.queue = [...steps];
      this.stepStart = now;
      this.stepFired = false;
    }
  }

  clear(): void {
    this.queue = [];
  }

  /** Intención de este frame (direcciones absolutas). */
  intent(now: number): Intent {
    let step = this.queue[0];
    while (step && now - this.stepStart >= step.ms) {
      this.queue.shift();
      this.stepStart = now;
      this.stepFired = false;
      step = this.queue[0];
    }
    if (!step) return NO_INTENT;
    const fwd = this.self.facing === 1 ? 'right' : 'left';
    const back = fwd === 'right' ? 'left' : 'right';
    const out: Intent = { ...NO_INTENT };
    for (const d of step.dirs) {
      if (d === 'fwd') out[fwd] = true;
      else if (d === 'back') out[back] = true;
      else out[d] = true;
    }
    if (!this.stepFired) {
      this.stepFired = true;
      out.punch = !!step.punch;
      out.kick = !!step.kick;
      out.dash = !!step.dash;
      out.super = !!step.super;
    }
    return out;
  }
}

/** CPU: decide un plan cada cierto tiempo de reacción y lo ejecuta como pulsaciones, igual que un jugador. */
export class Cpu {
  private steps: StepPlayer;
  private nextThink = 0;
  private seenMove = 0;
  /** Golpes recientes del rival (para notar cuando repite lo mismo) y último golpe ya castigado. */
  private history: { id: string; t: number }[] = [];
  private punished = 0;
  private seenJump = 0;
  private seenProjectiles = new WeakSet<Projectile>();
  private p: Profile;

  constructor(
    private self: Fighter,
    private projectiles: () => Projectile[],
    difficulty: CpuLevel,
  ) {
    this.p = typeof difficulty === 'number' ? blend(difficulty) : PROFILES[difficulty];
    this.steps = new StepPlayer(self);
  }

  private plan(steps: Step[], now: number, interrupt = false): void {
    this.steps.play(steps, now, interrupt);
  }

  intent(now: number): Intent {
    const me = this.self;
    const op = me.opponent;
    if (me.state === 'intro' || me.state === 'win' || me.state === 'ko') return NO_INTENT;
    this.react(now);
    if (!this.steps.busy && now >= this.nextThink && (me.free || me.state === 'jump')) {
      this.think(now);
      this.nextThink = now + rand(...this.p.react);
    }
    // Mientras recibe golpes o bloquea, sigue cubriéndose si sabe.
    if (!this.steps.busy && (me.state === 'block' || me.state === 'hurt') && Math.random() < this.p.block) {
      this.plan(SEQ.hold(op.crouching ? ['back', 'down'] : ['back'], 220), now);
    }
    return this.steps.intent(now);
  }

  /** Reacciones inmediatas: bloquear, antiaéreo, esquivar proyectiles. */
  /** Cuántas veces repitió el rival este mismo golpe en los últimos 3 s. */
  private spam(id: string, now: number): number {
    this.history = this.history.filter((h) => now - h.t < 3000);
    return this.history.filter((h) => h.id === id).length;
  }

  private react(now: number): void {
    const me = this.self;
    const op = me.opponent;
    if (!(me.free || me.state === 'block')) return;
    const dist = me.distance;

    // Golpe lento del rival que falló o le bloquearon: castigo apenas se pueda (más seguro si lo viene repitiendo).
    if (op.phase === 'recovery' && op.move && op.move.recovery >= 200 && op.moveStart !== this.punished && dist < 420) {
      this.punished = op.moveStart;
      const chance = Math.min(0.95, this.p.punish + 0.15 * this.spam(op.move.id, now));
      if (Math.random() < chance) {
        const wait = me.state === 'block' ? Math.max(0, me.stateUntil - me.now) + 20 : 0;
        const approach: Step[] = dist > 260 ? [{ dirs: ['fwd'], dash: true, ms: 140 }] : [];
        this.plan([...SEQ.hold([], wait), ...approach, ...this.combo()], now, true);
        return;
      }
    }

    // Golpe del rival a la vista: bloquear (agachado si es barrida).
    if (op.state === 'attack' && op.move && op.moveStart !== this.seenMove && dist < op.move.reach + 120) {
      this.seenMove = op.moveStart;
      this.history.push({ id: op.move.id, t: now });
      // Si repite el mismo golpe, la CPU lo lee y se cubre cada vez más.
      const block = Math.min(0.95, this.p.block + 0.15 * Math.max(0, this.spam(op.move.id, now) - 1));
      if (op.move.id !== 'special' && op.move.id !== 'super' && Math.random() < block) {
        const low = op.move.level === 'low';
        this.plan(SEQ.hold(low ? ['back', 'down'] : ['back'], op.move.startup + op.move.active + 140), now, true);
        return;
      }
    }

    // Salto del rival que viene encima: antiaéreo o cubrirse.
    if (op.state === 'jump' && op.stateStart !== this.seenJump && dist < 520 && (op.x - me.x) * op.vx < 0) {
      this.seenJump = op.stateStart;
      if (Math.random() < this.p.antiAir) {
        this.plan([...SEQ.hold([], rand(140, 260)), ...SEQ.uppercut()], now, true);
      } else if (Math.random() < this.p.block) {
        this.plan(SEQ.hold(['back'], 650), now, true);
      }
      return;
    }

    // Proyectil en camino: saltarlo, bloquearlo o contrarrestar.
    for (const pr of this.projectiles()) {
      if (pr.owner === me || this.seenProjectiles.has(pr)) continue;
      const gap = (me.x - pr.x) * Math.sign(pr.vx);
      if (gap < 0 || gap > 650) continue;
      this.seenProjectiles.add(pr);
      const r = Math.random();
      if (r < this.p.dodge * 0.55) this.plan([{ dirs: ['up', 'fwd'], ms: 80 }, ...SEQ.hold([], 420), { dirs: [], kick: true, ms: 50 }], now, true);
      else if (r < this.p.dodge) this.plan(SEQ.hold(['back'], 700), now, true);
      return;
    }
  }

  private think(now: number): void {
    const me = this.self;
    const op = me.opponent;
    const dist = me.distance;
    const r = Math.random();
    const aggro = this.p.aggro;

    // Rival recuperándose de un golpe fallado: castigo.
    if (op.phase === 'recovery' && dist < 380 && Math.random() < this.p.punish) {
      this.plan(dist > 260 ? [{ dirs: ['fwd'], dash: true, ms: 120 }, ...this.combo()] : this.combo(), now);
      return;
    }
    if (op.state === 'down' || op.state === 'getup') {
      this.plan(dist > 320 ? SEQ.hold(['fwd'], 260) : SEQ.hold(['back'], 200), now);
      return;
    }
    if (me.meter >= MAX_METER && dist < 1100 && r < 0.35) {
      this.plan(SEQ.super(), now);
      return;
    }

    if (dist > 640) {
      if (r < this.p.special && !this.projectiles().some((p) => p.owner === me)) this.plan(SEQ.special(), now);
      else if (r < this.p.special + 0.2 * aggro) this.plan([{ dirs: ['fwd'], dash: true, ms: 260 }], now);
      else if (r < this.p.special + 0.3 * aggro) this.plan(this.jumpIn(), now);
      else this.plan(SEQ.hold(['fwd'], rand(250, 520)), now);
    } else if (dist > 330) {
      if (r < aggro * 0.35) this.plan(SEQ.hold(['fwd'], rand(150, 320)), now);
      else if (r < aggro * 0.55) this.plan(this.jumpIn(), now);
      else if (r < aggro * 0.75) this.plan([{ dirs: ['fwd'], dash: true, ms: 120 }, { dirs: [], punch: true, ms: 60 }, ...this.combo().slice(1)], now);
      else if (r < aggro * 0.75 + this.p.special * 0.5 && !this.projectiles().some((p) => p.owner === me)) this.plan(SEQ.special(), now);
      else if (r < 0.9) this.plan(SEQ.hold(['back'], rand(200, 400)), now);
      else this.plan(SEQ.hold([], rand(150, 300)), now);
    } else {
      if (r < aggro * 0.7) this.plan(this.combo(), now);
      else if (r < aggro * 0.85) this.plan([{ dirs: ['down'], kick: true, ms: 120 }], now);
      else if (r < 0.88) this.plan(SEQ.hold(op.state === 'attack' ? ['back'] : ['back', 'down'], rand(250, 450)), now);
      else this.plan([{ dirs: ['back'], dash: true, ms: 300 }], now);
    }
  }

  /** Cadena de golpes; con más habilidad la remata con el especial. */
  private combo(): Step[] {
    const skill = Math.random() < this.p.combo;
    const r = Math.random();
    if (r < 0.35) return [{ dirs: [], punch: true, ms: 150 }, { dirs: [], punch: true, ms: 150 }, { dirs: [], kick: true, ms: 200 }];
    if (r < 0.6) return [{ dirs: ['down'], punch: true, ms: 140 }, { dirs: ['down'], punch: true, ms: 140 }, { dirs: ['down'], kick: true, ms: 220 }];
    if (skill) return [{ dirs: [], punch: true, ms: 140 }, { dirs: [], punch: true, ms: 60 }, ...SEQ.special()];
    return [{ dirs: [], punch: true, ms: 150 }, { dirs: [], kick: true, ms: 200 }];
  }

  private jumpIn(): Step[] {
    return [{ dirs: ['up', 'fwd'], ms: 60 }, ...SEQ.hold([], rand(260, 380)), { dirs: [], kick: true, ms: 300 }, ...this.combo().slice(0, 2)];
  }
}
