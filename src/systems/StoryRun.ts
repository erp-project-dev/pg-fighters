import { ROSTER, type FighterId } from '../data/fighters';
import type { StageId } from '../data/stages';
import { BOSS_STAGE, STORY_RIVALS, STORY_STAGE_ROTATION } from '../data/story';
import type { MatchStats } from '../scenes/FightScene';
import { Ranking } from './Ranking';
import { CONTINUE_PENALTY, fightScore, type FightScore } from './Score';
import type { CpuLevel } from './Settings';

export const BOSS: FighterId = 'acople';
/** Historias guardadas por cuenta (como los espacios de un juego clásico): cada una, un personaje y su fila del ranking. */
export const SAVE_SLOTS = 3;
/** Nivel del último amigo antes del jefe (1 = difícil). */
const STORY_PEAK = 0.9;
/** Dificultad de la CPU contra El Acople (1 = difícil: era imposible ganarle). */
const BOSS_LEVEL = 0.8;

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

type Runs = Partial<Record<FighterId, StoryState>>;

/** Documento `progress/<uid>`: nickname fijo de la cuenta y una historia por personaje (abiertas y completadas). */
interface Profile {
  name?: string;
  runs?: Runs;
  /** Formato anterior: una sola partida. */
  run?: StoryState | null;
}

/** Historia terminada (le ganó al jefe). */
export const isDone = (r: StoryState): boolean => r.index >= r.rivals.length + 1;

/** Lee el perfil. De los formatos viejos (partida suelta o `run`) queda esa partida en su personaje. */
const readProfile = (raw: (Profile & Partial<StoryState>) | null): { name: string; runs: Runs } => {
  const list = [...Object.values(raw?.runs ?? {}), raw?.run, raw?.player ? (raw as StoryState) : null];
  const runs: Runs = {};
  for (const r of list.map((x) => restore(x ?? null))) {
    if (r && (runs[r.player]?.updatedAt ?? -1) < (r.updatedAt ?? 0)) runs[r.player] = r;
  }
  return { name: (raw?.name ?? '').trim(), runs };
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
 * Modo historia: el perfil de la cuenta (anónima) del jugador, con su nickname fijo y una historia por personaje
 * (empezar otra con el mismo la reemplaza), y la partida que se está jugando. Se guarda solo en Firestore.
 * Cada historia tiene su fila en el ranking: reiniciarla la vuelve a cero y eliminarla la quita.
 */
export const StoryRun = {
  /** Partida que se está jugando. */
  state: null as StoryState | null,
  /** Nickname de la cuenta ('' = todavía no lo eligió). No se cambia una vez elegido. */
  name: '',
  /** Historias guardadas de la cuenta, una por personaje (las completadas quedan para su fila del ranking). */
  runs: {} as Runs,
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

  /** Historia guardada de `player` (abierta o completada). */
  runOf(player: FighterId): StoryState | undefined {
    return this.runs[player];
  },

  /** Historias guardadas (abiertas y completadas), la última jugada primero. */
  get saved(): StoryState[] {
    return Object.values(this.runs)
      .filter((r): r is StoryState => !!r)
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  },

  /** Ya se usaron todos los espacios: una historia nueva tiene que reemplazar otra. */
  get full(): boolean {
    return this.saved.length >= SAVE_SLOTS;
  },

  /** Historia nueva con `player` (reemplaza la suya y su fila del ranking). `keep = false`: solo en memoria (laboratorio). */
  start(player: FighterId, keep = true): void {
    if (keep && this.runs[player]) void Ranking.remove(player);
    this.state = { name: keep ? this.name : '', player, rivals: drawRivals(player), index: 0, freed: [], stats: { seconds: 0, maxCombo: 0, perfects: 0, continues: 0 }, score: 0 };
    this.save();
  },

  /** Retoma la historia de `player`. */
  resume(player: FighterId): boolean {
    const r = this.runs[player];
    this.state = r && !isDone(r) ? r : null;
    return !!this.state;
  },

  /** Elimina la historia de `player` y su fila del ranking. */
  remove(player: FighterId): void {
    if (!this.runs[player]) return;
    delete this.runs[player];
    if (this.state?.player === player) this.state = null;
    void Ranking.remove(player);
    this.persist();
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
   * justo debajo de difícil (STORY_PEAK). El Acople pelea un poco por debajo de eso (BOSS_LEVEL): su vida,
   * furia y stats de jefe ya lo hacen duro.
   */
  get difficulty(): CpuLevel {
    if (this.isBossFight) return BOSS_LEVEL;
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

  /** Sube la partida a su fila del ranking (cuenta + personaje). */
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
    this.runs[s.player] = s;
    this.persist();
  },

  /** Sube el perfil entero (nickname y partida). */
  persist(): void {
    if (!this.loaded) return;
    // Sin el desglose de la última pelea: solo se muestra al ganarla, y sus renglones son listas dentro de
    // una lista, que Firestore rechaza (con eso no se guardaba el avance después de la primera victoria).
    const runs = Object.fromEntries(Object.entries(this.runs).map(([id, r]) => [id, { ...r, lastFight: undefined }]));
    void Ranking.saveProgress({ name: this.name, runs });
  },

  /** Trae el perfil de la cuenta conectada. Falla (lanza) si no se pudo leer Firestore, para no pisar lo guardado. */
  async sync(): Promise<void> {
    if (!Ranking.user) return;
    const profile = readProfile(await Ranking.loadProgress<Profile & Partial<StoryState>>());
    this.name = profile.name;
    this.runs = profile.runs;
    if (this.state?.name) this.state = this.runs[this.state.player] ?? null;
    this.loaded = true;
  },

  /** Historia terminada: sale de la partida en juego. Queda cerrada en el perfil (su fila del ranking sigue). */
  clear(): void {
    this.state = null;
  },
};
