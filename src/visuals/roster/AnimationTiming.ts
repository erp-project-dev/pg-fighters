type Phase = 'startup' | 'active' | 'recovery';
type Range = [number, number];

/** Visual sampling only: combat phase lengths and projectile release stay unchanged. */
export function attackFrameIndex(
  elapsed: number,
  phase: Phase,
  durations: Record<Phase, number>,
  frameCount: number,
  ranges?: Partial<Record<Phase, Range>>,
): number {
  const range = ranges?.[phase] ?? (phase === 'startup' ? [0, 1] : phase === 'active' ? [2, 4] : [5, 7]);
  const offset = phase === 'startup' ? 0 : phase === 'active' ? durations.startup : durations.startup + durations.active;
  const progress = Math.max(0, Math.min(0.999999, (elapsed - offset) / Math.max(1, durations[phase])));
  return Math.min(frameCount - 1, range[0] + Math.floor(progress * (range[1] - range[0] + 1)));
}
