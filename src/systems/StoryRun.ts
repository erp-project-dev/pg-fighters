import { ROSTER, type FighterId } from '../data/fighters';
import type { StageId } from '../data/stages';
import { BOSS_STAGE, STORY_RIVALS, STORY_STAGE_ROTATION } from '../data/story';
import type { MatchStats } from '../scenes/FightScene';
import { Ranking } from './Ranking';
import { CONTINUE_PENALTY, fightScore, type FightScore } from './Score';
import type { CpuLevel } from './Settings';

export const BOSS: FighterId = 'acople';
/** Nivel del último amigo antes del jefe (1 = difícil). */
const STORY_PEAK = 0.9;

export interface StoryState {
  /** Nombre del jugador en el ranking. */
  name: string;
  player: FighterId;
  /** Amigos a encarar, en orden (al azar y sin repetir). */
  rivals: FighterId[];
  /** Pelea actual (0 = primera). Primero los amigos de `rivals`; la última, El Acople. */
  index: number;
  /** Amigos liberados (en orden). */
  freed: FighterId[];
  stats: { seconds: number; maxCombo: number; perfects: number; continues: number };
  score: number;
  /** Desglose de la última pelea ganada (se muestra en la pantalla siguiente). */
  lastFight?: FightScore;
  /** Último guardado (ms). */
  updatedAt?: number;
}

/** Valida una partida guardada. */
const restore = (raw: StoryState | null): StoryState | null => {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.rivals)) return null;
  if (!ROSTER.includes(raw.player) || !(raw.index >= 0 && raw.index <= raw.rivals.length)) return null;
  raw.score ??= 0;
  return raw;
};

/** Sorteo de amigos para una partida nueva: STORY_RIVALS del roster, sin el elegido ni repetidos. */
export const drawRivals = (player: FighterId, exclude: FighterId[] = []): FighterId[] => {
  const pool = ROSTER.filter((id) => id !== player && !exclude.includes(id));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, STORY_RIVALS);
};

/** Partida en curso del modo historia. Se guarda solo en Firestore, en la cuenta (anónima) del jugador. */
export const StoryRun = {
  state: null as StoryState | null,

  start(player: FighterId, name: string): void {
    this.state = { name, player, rivals: drawRivals(player), index: 0, freed: [], stats: { seconds: 0, maxCombo: 0, perfects: 0, continues: 0 }, score: 0 };
    this.save();
  },

  get opponents(): FighterId[] {
    return this.state ? [...this.state.rivals, BOSS] : [];
  },

  get opponent(): FighterId {
    return this.opponents[this.state!.index];
  },

  get isBossFight(): boolean {
    return this.opponent === BOSS;
  },

  /** Número de amigos (sin contar al jefe). */
  get friends(): number {
    return this.opponents.length - 1;
  },

  /** Escenario de la pelea actual: rotan en orden y el jefe tiene el suyo. */
  get stage(): StageId {
    if (this.isBossFight) return BOSS_STAGE;
    return STORY_STAGE_ROTATION[this.state!.index % STORY_STAGE_ROTATION.length];
  },

  /**
   * Rampa de dificultad: el primer amigo pelea en fácil y cada uno es un poco más duro, hasta quedar
   * justo debajo de difícil (STORY_PEAK). El Acople pelea en difícil con su vida, furia y stats de jefe.
   */
  get difficulty(): CpuLevel {
    if (this.isBossFight) return 'hard';
    const k = this.friends > 1 ? this.state!.index / (this.friends - 1) : 1;
    return STORY_PEAK * k ** 1.15;
  },

  /** Ganaste la pelea actual: libera al amigo (si no es el jefe) y avanza. */
  win(match: MatchStats): void {
    const s = this.state!;
    s.lastFight = fightScore(match, s.index, this.isBossFight);
    s.score += s.lastFight.total;
    if (!this.isBossFight) s.freed.push(this.opponent);
    s.stats.seconds += match.seconds;
    s.stats.maxCombo = Math.max(s.stats.maxCombo, match.maxCombo);
    s.stats.perfects += match.perfects;
    s.index++;
    this.save();
    this.submit();
  },

  /** Reintentar cuesta puntos. */
  addContinue(): void {
    const s = this.state!;
    s.stats.continues++;
    s.score = Math.max(0, s.score - CONTINUE_PENALTY);
    this.save();
    this.submit();
  },

  /** Sube la partida al ranking (queda solo si es el mejor puntaje de ese nombre). */
  submit(): void {
    const s = this.state;
    if (!s?.name) return;
    void Ranking.submit({ name: s.name, score: s.score, level: s.index, total: this.opponents.length, fighter: s.player, updatedAt: Date.now() });
  },

  get finished(): boolean {
    return !!this.state && this.state.index >= this.opponents.length;
  },

  /** Sube la partida a la cuenta. Las del laboratorio (sin nombre) solo viven en memoria. */
  save(): void {
    const s = this.state;
    if (!s?.name) return;
    s.updatedAt = Date.now();
    void Ranking.saveProgress(s);
  },

  /**
   * Con la sesión iniciada: trae la partida de la cuenta. Devuelve true si cargó una partida que no
   * estaba en memoria. Falla (lanza) si no se pudo leer Firestore, para no empezar una partida nueva
   * encima de la guardada.
   */
  async sync(): Promise<boolean> {
    if (!Ranking.user) return false;
    const had = !!this.state;
    this.state = restore(await Ranking.loadProgress<StoryState>());
    return !had && !!this.state;
  },

  clear(): void {
    if (this.state?.name) void Ranking.clearProgress();
    this.state = null;
  },
};
