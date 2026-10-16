import type { Pose } from '../systems/FighterArt';

export type MoveId = 'jab' | 'kick' | 'crouchJab' | 'sweep' | 'airPunch' | 'airKick' | 'special' | 'uppercut' | 'super' | 'superNote';

/**
 * Altura del golpe:
 *  - high: ataques aéreos, se bloquean de pie.
 *  - mid: se bloquean de pie o agachado.
 *  - low: la barrida, solo agachado.
 */
export type HitLevel = 'high' | 'mid' | 'low';

export interface MoveDef {
  id: MoveId;
  pose: Pose;
  /** Tiempos en ms: arranque, golpe activo y recuperación. */
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  /** Alcance centro a centro (px). */
  reach: number;
  level: HitLevel;
  hitstun: number;
  blockstun: number;
  /** Empuje del rival (px/s). */
  push: number;
  hitstop: number;
  /** Súper barra ganada al conectar. */
  meter: number;
  knockdown?: boolean;
  /** Golpe aéreo: activo hasta caer. */
  air?: boolean;
  /** Alcanza a rivales en el aire (antiaéreo). */
  antiAir?: boolean;
  /** Impulso hacia adelante al arrancar (px/s). */
  lunge?: number;
  /**
   * Embestida (poder básico cuerpo a cuerpo): al terminar la preparación sale disparado a `speed` px/s mientras
   * dura la fase activa y frena en seco al conectar o al acabarse. `hop`: arco visual (px), sin despegar del piso.
   */
  rush?: { speed: number; hop?: number; trail: number };
  /**
   * Contraataque (poder básico): mientras está activo, si le pegan recibe el daño igual (no es invulnerable)
   * pero no se corta: reaparece junto al atacante y le devuelve un golpe que tumba (FightScene.counter).
   */
  counter?: boolean;
  /** Invulnerable durante los primeros ms del movimiento. */
  invuln?: number;
  /** Puede cancelarse en otro normal (cadena) al conectar. */
  chain?: MoveId[];
  /** Puede cancelarse en especiales al conectar. */
  cancel?: boolean;
  sfx: 'punch' | 'kick';
}

export const MOVES: Record<MoveId, MoveDef> = {
  jab: {
    id: 'jab', pose: 'punch', startup: 60, active: 80, recovery: 140, damage: 50, reach: 265, level: 'mid',
    hitstun: 280, blockstun: 190, push: 300, hitstop: 70, meter: 5, lunge: 120, chain: ['jab', 'kick', 'crouchJab'], cancel: true, sfx: 'punch',
  },
  kick: {
    id: 'kick', pose: 'kick', startup: 115, active: 90, recovery: 330, damage: 85, reach: 345, level: 'mid',
    hitstun: 340, blockstun: 200, push: 420, hitstop: 95, meter: 8, lunge: 80, cancel: true, sfx: 'kick',
  },
  crouchJab: {
    id: 'crouchJab', pose: 'crouchPunch', startup: 55, active: 70, recovery: 130, damage: 40, reach: 250, level: 'mid',
    hitstun: 260, blockstun: 180, push: 260, hitstop: 65, meter: 4, chain: ['crouchJab', 'sweep', 'jab'], cancel: true, sfx: 'punch',
  },
  sweep: {
    id: 'sweep', pose: 'sweep', startup: 125, active: 100, recovery: 400, damage: 80, reach: 330, level: 'low',
    hitstun: 0, blockstun: 240, push: 380, hitstop: 90, meter: 8, knockdown: true, sfx: 'kick',
  },
  airPunch: {
    id: 'airPunch', pose: 'airPunch', startup: 60, active: 600, recovery: 0, damage: 65, reach: 250, level: 'high',
    hitstun: 320, blockstun: 220, push: 260, hitstop: 75, meter: 5, air: true, sfx: 'punch',
  },
  airKick: {
    id: 'airKick', pose: 'airKick', startup: 90, active: 600, recovery: 0, damage: 85, reach: 300, level: 'high',
    hitstun: 360, blockstun: 240, push: 300, hitstop: 90, meter: 7, air: true, sfx: 'kick',
  },
  /** ↓ ↘ → + golpe: proyectil (el impacto lo resuelve entities/Projectile.ts). */
  special: {
    id: 'special', pose: 'special', startup: 180, active: 0, recovery: 430, damage: 110, reach: 0, level: 'mid',
    hitstun: 420, blockstun: 300, push: 380, hitstop: 100, meter: 10, sfx: 'punch',
  },
  /** D → S → S+D + clic izquierdo: antiaéreo invulnerable al arrancar. Muy castigable si falla. */
  uppercut: {
    id: 'uppercut', pose: 'uppercut', startup: 55, active: 230, recovery: 450, damage: 130, reach: 245, level: 'mid',
    hitstun: 0, blockstun: 260, push: 260, hitstop: 120, meter: 12, knockdown: true, antiAir: true, invuln: 180, sfx: 'punch',
  },
  /**
   * Botón E con la barra llena: retrato a pantalla completa y solo de guitarra.
   * El luchador queda tocando (invulnerable) hasta que la escena termina el solo (Fighter.endSuper).
   */
  super: {
    id: 'super', pose: 'super', startup: 120, active: 99999, recovery: 0, damage: 0, reach: 0, level: 'mid',
    hitstun: 0, blockstun: 0, push: 0, hitstop: 0, meter: 0, invuln: 99999, sfx: 'kick',
  },
  /** Cada nota del solo que golpea. El daño sale de data/solos.ts. */
  superNote: {
    id: 'superNote', pose: 'super', startup: 0, active: 0, recovery: 0, damage: 0, reach: 0, level: 'mid',
    hitstun: 850, blockstun: 260, push: 140, hitstop: 45, meter: 0, sfx: 'punch',
  },
};

/** Escalado de daño dentro de un combo (golpe 1, 2, 3...). */
export const comboScale = (hitNumber: number) => Math.max(0.45, 1 - 0.12 * (hitNumber - 1));

/** El tercer normal de una cadena tumba y pega más. */
export const CHAIN_FINISHER = 3;
export const CHAIN_FINISHER_BONUS = 1.3;
