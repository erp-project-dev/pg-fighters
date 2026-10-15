import Phaser from 'phaser';
import { GAME_WIDTH, GROUND_Y } from '../config';
import { MOVES, type MoveDef } from '../data/moves';
import type { ShotSpec } from '../data/powers';
import type { Fx } from '../systems/Fx';
import { buildLook, type LookObj } from '../visuals/powers';
import type { Fighter } from './Fighter';

const BASE_RADIUS = 52;
/** Gravedad de los poderes que botan o caen en arco (px/s²). */
const GRAVITY = 2600;
/** Duración del rayo encendido y de su desvanecido (s). */
const BEAM_ON = 0.12;
const BEAM_FADE = 0.22;

/**
 * Poder básico (↓ ↘ → + P): un disparo de `ShotSpec` (data/powers.ts). Sale del puño, deja su cola
 * de partículas y se mueve según su comportamiento: recto, onda, bote, arco, bumerán, trampa, rayo…
 */
export class Projectile {
  x: number;
  z: number;
  vx: number;
  radius: number;
  readonly move: MoveDef;
  alive = true;
  private vz = 0;
  private baseZ: number;
  private readonly x0: number;
  private readonly dir: 1 | -1;
  private readonly speed: number;
  private age = 0;
  private look: LookObj | null = null;
  private g: Phaser.GameObjects.Graphics;
  /** Todavía no salió (ráfagas). */
  private dormant: boolean;
  private hitsLeft: number;
  /** Tras pegar, no vuelve a tocar hasta este momento (bumerán). */
  private cooldown = 0;
  private returning = false;
  private hoverUntil = -1;
  private exploding = -1;
  /** Rayos: momento en que se encendió (s) y si ya pegó. */
  private beamAt = -1;
  private spent = false;

  constructor(
    private scene: Phaser.Scene,
    private fx: Fx,
    readonly owner: Fighter,
    readonly spec: ShotSpec,
    readonly color: number,
  ) {
    this.move = MOVES.special;
    this.dir = owner.facing;
    this.radius = BASE_RADIUS * (spec.size ?? 1);
    this.speed = owner.def.stats.projectileSpeed * (spec.speed ?? 1);
    const fist = this.fist();
    this.x = this.x0 = fist.x;
    this.z = this.baseZ = fist.z;
    this.vx = this.dir * (spec.beam ? 1 : this.speed);
    this.hitsLeft = spec.hits ?? 1;
    this.dormant = !!spec.delay || spec.fork === -1;
    this.g = scene.add.graphics().setDepth(30).setBlendMode(Phaser.BlendModes.ADD);
    if (!spec.delay) this.launch();
  }

  /** Puño del luchador en la pose del poder (proporcional a su altura). */
  private fist(): { x: number; z: number } {
    const o = this.owner;
    const h = o.def.art.height;
    return { x: o.x + o.facing * h * 0.34, z: o.z + h * 0.58 };
  }

  /** Sale del puño: aparece el dibujo y, según el tipo, su velocidad inicial. */
  private launch(): void {
    if (this.spec.delay) {
      const fist = this.fist();
      this.x = fist.x;
      this.z = this.baseZ = fist.z;
    }
    if (this.spec.fork !== -1) this.dormant = false;
    if (this.spec.beam || this.dormant) return;
    if (this.spec.arc) {
      // Calcula el arco para caer sobre el pecho del rival.
      const t = this.owner.opponent;
      const dx = t.x - this.x;
      const T = Phaser.Math.Clamp(Math.abs(dx) / 620, 0.55, 1.15);
      this.vx = dx / T;
      this.vz = (t.z + 260 - this.z + 0.5 * GRAVITY * T * T) / T;
    }
    if (this.spec.bounce) this.vz = 500;
    if (this.spec.accel) this.radius *= 0.7;
    this.look = buildLook(this.scene, this.spec.look, this.color, this.radius, this.x, this.y);
    this.look.obj.setDepth(31);
    if (!this.dormant) this.fx.ring(this.x, this.y, this.color, this.radius * 1.6, 0.22);
  }

  get y(): number {
    return GROUND_Y - this.z;
  }

  /** Daño completo antes de defensas. */
  get damage(): number {
    return this.move.damage * this.owner.def.stats.damage * (this.spec.damage ?? 1);
  }

  /** Rayos y explosiones no chocan con otros poderes. */
  get clashes(): boolean {
    return !this.dormant && !this.spec.beam && this.exploding < 0;
  }

  /** Sigue girando alrededor de su dueño (escudo de Kimberly). */
  get orbiting(): boolean {
    return !!this.spec.orbit && this.alive && this.age * 1000 < this.spec.orbit;
  }

  /** Escudo roto: los corazones se apagan con un destello. */
  shatter(): void {
    this.fx.hit(this.x, this.y, this.color, false);
    this.destroy();
  }

  get pierce(): boolean {
    return !!this.spec.pierce;
  }

  private revived = false;

  /**
   * Perdió un choque. Si puede renacer (Ricardo), revive una vez en el mismo lugar con un destello
   * y devuelve true; si no, se destruye.
   */
  lose(): boolean {
    if (this.spec.revive && !this.revived) {
      this.revived = true;
      this.cooldown = this.age + 0.2;
      for (let k = 0; k < 3; k++) this.fx.ring(this.x, this.y, k % 2 ? 0xffffff : this.color, this.radius * (1.2 + k * 0.6), 0.4);
      this.look?.obj.setScale((this.look.obj.scaleX || 1) * 1.15);
      return true;
    }
    this.destroy();
    return false;
  }

  /** Largo del rayo encendido. */
  private get reach(): number {
    if (this.spec.range) return this.spec.range;
    return this.dir > 0 ? GAME_WIDTH + 200 - this.x0 : this.x0 + 200;
  }

  /** ¿Toca a `f`? Compara con el cuerpo del rival (las piernas no cuentan: saltar a tiempo lo esquiva). */
  touches(f: Fighter): boolean {
    if (this.dormant || this.spent || this.age < this.cooldown) return false;
    const body = f.crouching ? 300 : 440;
    const inBand = (z: number, r: number) => z + r * 0.5 > f.z + 120 && z - r * 0.5 < f.z + body;
    if (this.spec.beam) {
      if (this.beamAt < 0 || this.age - this.beamAt > BEAM_ON) return false;
      const dx = (f.x - this.x0) * this.dir;
      return dx > -40 && dx < this.reach + 55 && inBand(this.z, this.radius * 1.4);
    }
    if (Math.abs(f.x - this.x) >= this.radius + 55) return false;
    return inBand(this.z, this.radius);
  }

  /**
   * Pegó (o lo bloquearon). Devuelve false si el poder debe desaparecer.
   * El bumerán puede pegar otra vez; los rayos se quedan en pantalla desvaneciéndose.
   */
  onHit(): boolean {
    this.hitsLeft--;
    if (this.spec.explode && this.exploding < 0) this.burst();
    if (this.spec.beam) {
      this.spent = true;
      return true;
    }
    if (this.hitsLeft > 0) {
      this.cooldown = this.age + 0.35;
      return true;
    }
    return false;
  }

  /** KABOOM: el poder se convierte en un área por un instante. */
  private burst(): void {
    this.exploding = this.age;
    this.radius = this.spec.explode ?? this.radius;
    for (let k = 0; k < 3; k++) this.fx.ring(this.x, this.y, k % 2 ? 0xe0b862 : this.color, this.radius * (0.6 + k * 0.35), 0.4);
    this.fx.hit(this.x, this.y, this.color, true);
    this.scene.cameras.main.shake(180, 0.008);
    this.look?.obj.setVisible(false);
  }

  update(dt: number): void {
    this.age += dt;
    const s = this.spec;
    if (this.dormant) {
      if (s.delay && this.age * 1000 >= s.delay) this.launch();
      else if (s.fork === -1 && this.age * 1000 >= (s.split ?? 0)) {
        // La otra mitad del fork aparece donde va la primera.
        this.dormant = false;
        this.x = this.x0 + this.dir * this.speed * this.age;
        this.look = buildLook(this.scene, s.look, this.color, this.radius, this.x, this.y);
        this.look.obj.setDepth(31);
        this.fx.ring(this.x, this.y, this.color, this.radius * 1.4, 0.2);
      }
      if (this.dormant) return;
    }
    const t = this.age - (s.delay ?? 0) / 1000;

    if (s.beam) return this.updateBeam(t);
    if (this.exploding >= 0) {
      if (this.age - this.exploding > 0.15) this.destroy();
      return;
    }

    if (s.orbit && t * 1000 < s.orbit) {
      // Escudo: gira alrededor del luchador (choca con los poderes rivales y pega si el rival se acerca).
      const o = this.owner;
      const ang = (s.phase ?? 0) * Math.PI * 2 + t * 5;
      this.x = o.x + Math.cos(ang) * 150;
      this.z = o.z + o.def.art.height * 0.55 + Math.sin(ang) * 95;
      this.vx = o.facing;
    } else if (this.hoverUntil >= 0) {
      // Trampa: se queda servida, meciéndose, hasta que se acaba el tiempo.
      this.z = this.baseZ + Math.sin(this.age * 5) * 12;
      if (this.age > this.hoverUntil) this.destroy();
    } else {
      if (s.orbit && Math.abs(this.vx) <= 1) {
        // Termina el escudo: sale disparado hacia donde mira el luchador.
        this.vx = this.owner.facing * this.speed;
        this.baseZ = this.z;
      }
      if (s.accel) {
        const k = Math.min(1, t / 1.1);
        this.vx = this.dir * this.owner.def.stats.projectileSpeed * Phaser.Math.Linear(s.speed ?? 0.3, s.accel, k);
        this.radius = BASE_RADIUS * (s.size ?? 1) * Phaser.Math.Linear(0.7, 1.3, k);
        this.look?.obj.setScale(this.radius / BASE_RADIUS);
      }
      if (s.homing) {
        // Gira suavemente hacia el pecho del rival.
        const target = this.owner.opponent;
        const tx = target.x - this.x;
        const tz = target.z + 260 - this.z;
        const d = Math.hypot(tx, tz) || 1;
        const k = Math.min(1, s.homing * dt);
        this.vx += ((tx / d) * this.speed - this.vx) * k;
        this.vz += ((tz / d) * this.speed - this.vz) * k;
      }
      if (s.boomerang) {
        const a = (this.speed * this.speed) / (2 * s.boomerang);
        this.vx -= this.dir * a * dt;
        if (!this.returning && this.vx * this.dir < 0) {
          this.returning = true;
          this.cooldown = 0; // a la vuelta puede volver a pegar
        }
        if (this.returning && (this.x - this.owner.x) * this.dir < 0) return this.destroy();
      }
      if (s.bounce || s.arc) this.vz -= GRAVITY * dt;
      if (s.climb) this.vz = s.climb;
      if (!s.wave && !s.fork) this.z += this.vz * dt;
      if (s.bounce && this.z < this.radius * 0.9 + 60) {
        this.z = this.radius * 0.9 + 60;
        this.vz = 900;
        this.fx.dust(this.x, GROUND_Y, this.dir, 3);
      }
      if (s.arc && this.z < 40) {
        // El frasco se rompe contra el piso.
        this.fx.hit(this.x, GROUND_Y - 30, this.color, false);
        return this.destroy();
      }
      if (s.wave) {
        const settle = s.wave.settle ? Math.max(0, 1 - t / s.wave.settle) : 1;
        this.z = this.baseZ + Math.sin(t * s.wave.freq) * s.wave.amp * settle;
      }
      if (s.fork && t * 1000 > (s.split ?? 0)) this.z += (this.baseZ + s.fork * 90 - this.z) * Math.min(1, dt * 10);
      this.x += this.vx * dt;
      if (s.range && Math.abs(this.x - this.x0) >= s.range) {
        if (s.hover) {
          this.hoverUntil = this.age + s.hover / 1000;
          this.vx = 0;
          this.baseZ = this.z;
        } else if (s.explode) this.burst();
        else return this.destroy();
      }
    }
    if ((s.life && t > s.life) || this.x < -200 || this.x > GAME_WIDTH + 200 || this.z > 1300) return this.destroy();

    if (Math.random() < 0.9) this.fx.trail(this.x - Math.sign(this.vx || this.dir) * this.radius * 0.6, this.y, this.color, this.radius);
    const obj = this.look?.obj;
    if (!obj) return;
    obj.setPosition(this.x, this.y);
    if (this.look!.spin) obj.setAngle(obj.angle + this.look!.spin * this.dir * dt);
    else if (this.look!.aim) obj.setAngle(Phaser.Math.RadToDeg(Math.atan2(-this.vz, this.vx)));
    if (obj instanceof Phaser.GameObjects.Image) obj.setFlipX(this.vx < 0 && !this.look!.spin);
  }

  /** Rayos (láser, latigazo, feedback): cargan en el puño, se encienden un instante y se desvanecen. */
  private updateBeam(t: number): void {
    const s = this.spec;
    const g = this.g;
    g.clear();
    const fist = this.fist();
    if (this.beamAt < 0) {
      this.x = fist.x;
      this.z = this.baseZ = fist.z;
      const k = Math.min(1, t / ((s.beam ?? 200) / 1000));
      g.fillStyle(this.color, 0.25 + k * 0.4).fillCircle(this.x, this.y, this.radius * (0.4 + k * 0.6));
      g.fillStyle(0xffffff, 0.8).fillCircle(this.x, this.y, this.radius * 0.35 * k);
      if (k >= 1) {
        this.beamAt = this.age;
        this.scene.cameras.main.shake(90, 0.004);
      }
      return;
    }
    const on = this.age - this.beamAt;
    if (on > BEAM_ON + BEAM_FADE) return this.destroy();
    const fade = on < BEAM_ON ? 1 : 1 - (on - BEAM_ON) / BEAM_FADE;
    const len = this.reach * (s.look === 'lash' ? Math.min(1, on / 0.06) : 1);
    const x1 = this.x0 + this.dir * len;
    const h = this.radius * 1.4;
    if (s.look === 'laser') {
      // Barras de ecualizador formando el rayo.
      for (let x = 0; x < len; x += 34) {
        const bar = h * (0.5 + 0.5 * Math.abs(Math.sin(x * 0.05 + this.age * 40)));
        const c = x / len < 0.6 ? 0x4dff88 : x / len < 0.85 ? 0xffe14d : 0xff3b3b;
        g.fillStyle(c, 0.85 * fade).fillRect(this.x0 + this.dir * x - 13, this.y - bar / 2, 26, bar);
      }
      g.fillStyle(0xffffff, 0.6 * fade).fillRect(Math.min(this.x0, x1), this.y - 4, len, 8);
    } else if (s.look === 'lash') {
      // Cuerda que latiguea con una chispa en la punta.
      g.lineStyle(14, this.color, 0.35 * fade);
      g.beginPath();
      for (let i = 0; i <= 24; i++) {
        const k = i / 24;
        g.lineTo(this.x0 + this.dir * len * k, this.y + Math.sin(k * Math.PI * 3 + this.age * 60) * 14 * (1 - k));
      }
      g.strokePath();
      g.lineStyle(4, 0xf2d0a0, fade).lineBetween(this.x0, this.y, x1, this.y);
      g.fillStyle(0xffffff, fade).fillCircle(x1, this.y, 12);
    } else {
      // Feedback: rayo rojo y violeta vibrando.
      for (const [w, c, a] of [[h * 1.6, 0x6a00ff, 0.3], [h, 0xff173d, 0.7], [h * 0.3, 0xffffff, 1]] as const) {
        g.fillStyle(c, a * fade).fillRect(Math.min(this.x0, x1), this.y - w / 2 + Math.sin(this.age * 80) * 4, len, w);
      }
    }
    if (on < BEAM_ON && Math.random() < 0.8) this.fx.trail(x1, this.y, this.color, this.radius);
  }

  destroy(): void {
    this.alive = false;
    this.g.destroy();
    this.look?.obj.destroy();
  }
}
