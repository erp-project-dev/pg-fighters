export type Difficulty = 'easy' | 'normal' | 'hard';
/** Dificultad de la CPU: un nivel fijo o un punto entre fácil (0) y difícil (1), para la rampa del modo historia. */
export type CpuLevel = Difficulty | number;

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: 'FÁCIL', normal: 'NORMAL', hard: 'DIFÍCIL' };
const ORDER: Difficulty[] = ['easy', 'normal', 'hard'];
const KEY = 'pg-fighters-settings';

interface Data {
  difficulty: Difficulty;
}

/** La dificultad no se elige en el menú: siempre normal (la historia la ajusta sola por pelea). */
const load = (): Data => ({ difficulty: 'normal' });

/** Preferencias del jugador (se guardan en el navegador si se puede). */
export const Settings = {
  data: load(),
  save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* sin almacenamiento: solo dura la sesión */
    }
  },
  cycleDifficulty(dir: number): void {
    const i = ORDER.indexOf(this.data.difficulty);
    this.data.difficulty = ORDER[(i + dir + ORDER.length) % ORDER.length];
    this.save();
  },
};
