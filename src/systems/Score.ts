import type { MatchStats } from '../scenes/FightScene';

/** Lo que cuesta cada ¿CONTINUAR? en la historia. */
export const CONTINUE_PENALTY = 500;

export interface FightScore {
  /** Renglones del desglose: [concepto, puntos]. */
  lines: [string, number][];
  multiplier: number;
  total: number;
}

/**
 * Puntaje de una pelea ganada de la historia. Suma victoria, vida, perfects, 2-0, combo y rapidez,
 * y lo multiplica según la dificultad del rival (el jefe vale el triple).
 */
export const fightScore = (s: MatchStats, index: number, boss: boolean): FightScore => {
  const lines: [string, number][] = [
    ['VICTORIA', 1000],
    ['VIDA RESTANTE', Math.round(1000 * s.hpLeft)],
    ['PERFECTS', 500 * s.perfects],
    ['SIN PERDER ROUND', s.roundsLost === 0 ? 500 : 0],
    ['MEJOR COMBO', 100 * s.maxCombo],
    ['RAPIDEZ', Math.max(0, Math.round((90 - s.fightSeconds) * 10))],
  ];
  const multiplier = boss ? 3 : index >= 8 ? 2 : index >= 4 ? 1.5 : 1;
  const total = Math.round(lines.reduce((sum, [, pts]) => sum + pts, 0) * multiplier);
  return { lines: lines.filter(([, pts]) => pts > 0), multiplier, total };
};
