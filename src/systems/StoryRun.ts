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

/** Documento `progress/<uid>`: nickname fijo de la cuenta y su partida de la historia (una sola). */
interface Profile {
  name?: string;
  run?: StoryState | null;
  /** Formato anterior: una partida por personaje. */
  runs?: Partial<Record<FighterId, StoryState>>;
}

/** Lee el perfil. De los formatos viejos (partida suelta o una por personaje) queda la última jugada. */
const readProfile = (raw: (Profile & Partial<StoryState>) | null): { name: string; run: StoryState | null } => {
  const list = raw?.player ? [raw as StoryState] : raw?.run !== undefined ? [raw.run] : Object.values(raw?.runs ?? {});
  const runs = list.map((r) => restore(r ?? null)).filter((r): r is StoryState => !!r);
  runs.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  return { name: (raw?.name ?? '').trim(), run: runs[0] ?? null };
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

/**
 * Modo historia: el perfil de la cuenta (anónima) del jugador, con su nickname fijo y su partida guardada
 * (una sola: empezar otra la reemplaza), y la partida que se está jugando. Se guarda solo en Firestore.
 */
export const StoryRun = {
  /** Partida que se está jugando. */
  state: null as StoryState | null,
  /** Nickname de la cuenta ('' = todavía no lo eligió). No se cambia una vez elegido. */
  name: '',
  /** Partida guardada de la cuenta (null = no tiene). */
  run: null as StoryState | null,
  /** Ya se trajo el perfil de la cuenta en esta sesión. */
  loaded: false,

  /** Con cuenta y nickname: se puede jugar la historia. */
  get ready(): boolean {
    return this.loaded && !!this.name;
  },

  /** Elige el nickname (una sola vez) y lo guarda en la cuenta. */
  setName(name: string): void {
    if (this.name) return;
    this.name = name;
    this.persist();
  },

  /** Partida nueva con `player` (reemplaza la guardada). `keep = false`: solo en memoria (laboratorio). */
  start(player: FighterId, keep = true): void {
    this.state = { name: keep ? this.name : '', player, rivals: drawRivals(player), index: 0, freed: [], stats: { seconds: 0, maxCombo: 0, perfects: 0, continues: 0 }, score: 0 };
    this.save();
  },

  /** Retoma la partida guardada. */
  resume(): boolean {
    this.state = this.run;
    return !!this.state;
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

  /** Guarda la partida en la cuenta. Las del laboratorio (sin nombre) solo viven en memoria. */
  save(): void {
    const s = this.state;
    if (!s?.name) return;
    s.updatedAt = Date.now();
    this.run = s;
    this.persist();
  },

  /** Sube el perfil entero (nickname y partida). */
  persist(): void {
    if (!this.loaded) return;
    // Sin el desglose de la última pelea: solo se muestra al ganarla, y sus renglones son listas dentro de
    // una lista, que Firestore rechaza (con eso no se guardaba el avance después de la primera victoria).
    const run = this.run && { ...this.run, lastFight: undefined };
    void Ranking.saveProgress({ name: this.name, run });
  },

  /** Trae el perfil de la cuenta conectada. Falla (lanza) si no se pudo leer Firestore, para no pisar lo guardado. */
  async sync(): Promise<void> {
    if (!Ranking.user) return;
    const profile = readProfile(await Ranking.loadProgress<Profile & Partial<StoryState>>());
    this.name = profile.name;
    this.run = profile.run;
    if (this.state?.name) this.state = this.run;
    this.loaded = true;
  },

  /** Historia terminada: se borra la partida (el puntaje ya quedó en el ranking). */
  clear(): void {
    const s = this.state;
    this.state = null;
    if (!s?.name) return;
    this.run = null;
    this.persist();
  },
};
