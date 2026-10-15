import type { FighterId } from '../../data/fighters';

/** Visual offsets only: never move a fighter's collision body. Angles face right. */
export interface SuperMotion { x: number; y: number; angle: number; sx: number; sy: number; lift: number }
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => { const k = clamp(n); return k * k * (3 - 2 * k); };

/** Each performer has its own rhythm, anticipation and final accent. */
export function superMotion(id: FighterId, t: number, duration: number, pluck: number, finalAge: number | null): SuperMotion {
  const enter = ease(t / 280);
  const charge = 1 - ease(t / 380);
  const u = clamp(t / duration);
  const p = pluck * enter;
  // Anticipate the last chord even when the final projectile is still in flight.
  const lastChord = Math.sin(ease((u - 0.87) / 0.13) * Math.PI / 2) * 0.65;
  const end = finalAge === null ? lastChord : Math.exp(-finalAge / 180);
  const settle = finalAge === null ? 1 : 1 - ease(finalAge / 600);
  const m: SuperMotion = { x: 0, y: 0, angle: 0, sx: 1, sy: 1, lift: 0 };
  switch (id) {
    case 'erp': // Quick downstrokes, planted feet; blackout recoil.
      m.angle = -7 * charge + p * 4 + end * 7; m.x = -12 * charge + p * 9; break;
    case 'mayin': // Slow blues bend, broad and heavy.
      m.angle = Math.sin(t / 440) * 3 - p * 4 - end * 9; m.y = p * 5;
      m.sx += p * 0.018; m.sy -= p * 0.012; break;
    case 'george': // An exact, restrained correction.
      m.angle = -4 * charge + p * 0.7 + end * 4; m.x = -8 * charge + end * 12; break;
    case 'pepper': // Compression and release.
      m.sy -= p * 0.045 + charge * 0.025; m.sx += p * 0.025;
      m.angle = -3 * charge + end * 7; m.y = p * 6; break;
    case 'slandor': // Leisurely flourish, unfazed by the falling safe.
      m.angle = -6 * charge + Math.sin(t / 550) * 2 - end * 5; m.x = Math.sin(t / 700) * 5; break;
    case 'pentalick': { // Five identical accents; second pass speeds up.
      const beat = Math.max(0, Math.sin(t / (u < 0.5 ? 100 : 75))) ** 6;
      m.angle = -6 * charge + beat * 7; m.x = beat * 10; m.sy -= beat * 0.025; m.y = end * 10; break;
    }
    case 'mimetico': // Stadium power stance and final bow.
      m.angle = Math.sin(t / 230) * 5 + end * 15 - charge * 9;
      m.y = -Math.abs(Math.sin(t / 230)) * 9 * enter; m.sx += p * 0.025; break;
    case 'clavito': { // Dembow bounce, suspension before the drop.
      const beat = Math.max(0, Math.sin(t * Math.PI / 150));
      m.y = beat * 11 * enter + end * 18; m.sy -= beat * 0.035;
      m.angle = Math.sin(t / 190) * 4 + end * 10; break;
    }
    case 'chantal': // Serving gesture: draw back, present, return.
      m.x = -18 * charge + p * 18; m.angle = -8 * charge + p * 6 + end * 10; break;
    case 'jeanpierre': // Three-beat waltz followed by a bow.
      m.x = Math.sin(t / 300) * 12; m.angle = Math.sin(t / 300) * 4 + end * 16;
      m.y = -Math.abs(Math.sin(t / 150)) * 4; break;
    case 'ferdex': // Invocation rises in deliberate steps, then gives the command.
      m.lift = 35 * ease(u * 3); m.angle = -10 * charge - Math.sin(t / 330) * 2 + end * 12;
      m.sx += p * 0.015; break;
    case 'turboshred': { // Burst / hold rhythm instead of continuous wobble.
      const burst = Math.sin(t / 48) > 0.55 ? 1 : 0;
      m.x = burst * (12 + u * 18); m.angle = -12 * charge + burst * 7 + end * 13;
      m.sy -= burst * 0.018; break;
    }
    case 'toxicity': // Solemn ascent and abrupt sentence.
      m.lift = 65 * enter; m.angle = -8 * charge + p * 1.5 + end * 16;
      m.y = Math.sin(t / 550) * 3; break;
    case 'rematada': // Build string tension, recoil on release.
      m.x = -25 * u * settle + end * 28; m.angle = -12 * u * settle + end * 17;
      m.sx += 0.045 * u * settle - end * 0.055; m.sy -= 0.025 * u * settle;
      m.x += Math.sin(t / 22) * p * 3; break;
    case 'escalas': { // Three chapters; each gets a deliberate accent.
      const chapter = Math.floor(u * 3);
      m.angle = -6 * charge + Math.sin(t / 420) * 1.5 + p * (2 + chapter) + end * 10;
      m.x = p * (4 + chapter * 3); break;
    }
    case 'tayloy': // Concentration, levitation, release of the dragon.
      m.lift = 45 * ease(t / 600); m.angle = -9 * charge + p * 2 + end * 13;
      m.x = -10 * charge + end * 18; break;
    case 'jesex': // Relaxed arena performer with an extravagant final accent.
      m.angle = Math.sin(t / 370) * 3 - charge * 6 + end * 11; m.x = Math.sin(t / 500) * 8;
      m.sx += p * 0.018; break;
    case 'markus': // Geometric patterns compress before the explosive chord.
      m.angle = -9 * charge - 5 * u * settle + end * 18;
      m.sx -= u * 0.025 * settle; m.sy += u * 0.02 * settle;
      m.x = -u * 12 * settle + end * 22; break;
    case 'platanero': // Continuous, calm ascension with an open final chord.
      m.lift = 120 * ease(t / 900); m.y = Math.sin(t / 600) * 5;
      m.angle = -3 * enter - end * 5; m.sx += end * 0.025; break;
    case 'acople': // An unstable core inhaling energy before the feedback release.
      m.lift = 50 * enter; m.angle = Math.sin(t / 115) * (2 + u * 3);
      m.sx += Math.sin(t / 70) * 0.025 + end * 0.09;
      m.sy -= Math.sin(t / 70) * 0.02 + end * 0.05;
      m.x = Math.sin(t / 45) * u * 5; break;
  }
  m.x *= enter; m.y *= enter; m.angle *= enter;
  return m;
}
