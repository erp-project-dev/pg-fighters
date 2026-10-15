import type { FighterId } from './fighters';

/** Dibujo del proyectil (visuals/powers.ts). */
export type PowerLook =
  | 'code' | 'note' | 'wave' | 'laser' | 'pick' | 'lick' | 'meteor' | 'tray' | 'kiss' | 'redStar' | 'miniNote'
  | 'flask' | 'lash' | 'banana' | 'phoenix' | 'like' | 'book' | 'pearl' | 'cheque' | 'star8' | 'firefly' | 'darkOrb' | 'feedback' | 'shriek';

/**
 * Un disparo del poder básico (↓ ↘ → + P). Las velocidades y tamaños multiplican los valores base
 * (velocidad del luchador `stats.projectileSpeed`, radio 52 px, daño del golpe `special`).
 */
export interface ShotSpec {
  look: PowerLook;
  speed?: number;
  size?: number;
  damage?: number;
  /** Sale este tiempo después (ráfagas), siempre desde el puño. */
  delay?: number;
  /** Velocidad vertical constante (px/s): abanico. */
  climb?: number;
  /** Onda vertical: amplitud (px), frecuencia y segundos hasta enderezarse (0 = nunca). */
  wave?: { amp: number; freq: number; settle?: number };
  /** Avanza dando botes en el piso. */
  bounce?: boolean;
  /** Cae en arco sobre el rival. */
  arc?: boolean;
  /** Persigue al rival (fuerza de giro). */
  homing?: number;
  /** Sale lento y acelera hasta `accel` × la velocidad, creciendo. */
  accel?: number;
  /** Va y vuelve (distancia de ida en px). */
  boomerang?: number;
  /** Distancia máxima (px) antes de detenerse, explotar o desaparecer. */
  range?: number;
  /** Al llegar a `range` se queda flotando estos ms (trampa). */
  hover?: number;
  /** Al tocar o al llegar a `range` explota en un área de este radio (px). */
  explode?: number;
  /** Gana todos los choques de poderes y sigue de largo. */
  pierce?: boolean;
  /** Si lo destruyen en un choque, renace una vez y sigue. */
  revive?: boolean;
  /** Gira alrededor del luchador estos ms (escudo) y luego sale disparado; `phase` reparte el ángulo inicial (0–1). */
  orbit?: number;
  phase?: number;
  /** Dardo: crece en el puño estos ms y sale disparado hacia el pecho del rival dejando una cola de láser. */
  dart?: number;
  /** Rayo instantáneo: carga estos ms y cruza (hasta `range` o toda la pantalla). */
  beam?: number;
  /** Se divide: los dos disparos viajan juntos y se separan arriba/abajo a los `split` ms. */
  fork?: 1 | -1;
  split?: number;
  /** Puede pegar dos veces (bumerán: ida y vuelta). */
  hits?: number;
  knockdown?: boolean;
  /** Barra ULTIMATE que le roba al rival si pega. */
  steal?: number;
  /** Vida máxima (s). */
  life?: number;
}

/** Poder básico de cada luchador. Mimético copia el del rival; El Acople usa uno de sus tres al azar. */
export const POWERS: Partial<Record<FighterId, ShotSpec[]>> = {
  // Código que se bifurca (fork) a medio camino.
  erp: [
    { look: 'code', speed: 1.05, size: 0.8, damage: 0.55, fork: 1, split: 230 },
    { look: 'code', speed: 1.05, size: 0.8, damage: 0.55, fork: -1, split: 230 },
  ],
  // Nota gorda que avanza dando botes.
  mayin: [{ look: 'note', speed: 0.62, size: 1.15, damage: 1.25, bounce: true }],
  // Onda que se va afinando.
  george: [{ look: 'wave', speed: 0.9, damage: 1, wave: { amp: 130, freq: 9, settle: 0.9 } }],
  // Láser de ecualizador que cruza la pantalla.
  pepper: [{ look: 'laser', size: 0.6, damage: 0.75, beam: 260 }],
  // Púa dorada en bumerán: pega a la ida y a la vuelta.
  slandor: [{ look: 'pick', speed: 1.25, size: 0.75, damage: 0.6, boomerang: 720, hits: 2 }],
  // El mismo lick tres veces.
  pentalick: [0, 150, 300].map((delay) => ({ look: 'lick' as const, speed: 1.05, size: 0.65, damage: 0.4, delay })),
  // Tres meteoritos en abanico.
  clavito: [330, 0, -330].map((climb) => ({ look: 'meteor' as const, size: 0.6, damage: 0.45, climb })),
  // Bandeja que queda servida en el aire (trampa).
  chantal: [{ look: 'tray', speed: 0.8, size: 0.9, damage: 0.9, range: 520, hover: 2000 }],
  // Beso volador express: el más rápido.
  jeanpierre: [{ look: 'kiss', speed: 1.75, size: 0.6, damage: 0.7 }],
  // Estrella que acelera y crece.
  ferdex: [{ look: 'redStar', speed: 0.3, size: 0.75, damage: 1.05, accel: 1.7 }],
  // Ametralladora de cinco notitas.
  turboshred: [0, 70, 140, 210, 280].map((delay) => ({ look: 'miniNote' as const, speed: 1.35, size: 0.45, damage: 0.25, delay })),
  // Agua bendita que cae en arco.
  toxicity: [{ look: 'flask', size: 0.8, damage: 1.15, arc: true }],
  // Latigazo de cuerda: corto, fuerte y tumba.
  rematada: [{ look: 'lash', size: 0.7, damage: 1.45, beam: 120, range: 560, knockdown: true }],
  // Libro de tapa dura: enorme, lento y el más pesado.
  escalas: [{ look: 'book', speed: 0.5, size: 1.7, damage: 1.5, knockdown: true }],
  // Perla de jade que atraviesa los poderes.
  tayloy: [{ look: 'pearl', speed: 1, size: 0.85, damage: 0.95, pierce: true }],
  // Cheque que compra barra del rival.
  jesex: [{ look: 'cheque', speed: 0.95, size: 0.8, damage: 0.6, steal: 30 }],
  // Estrella de 8 puntas que explota (KABOOM).
  markus: [{ look: 'star8', speed: 0.65, size: 1, damage: 1.1, range: 820, explode: 240 }],
  // Plátano que persigue al rival.
  platanero: [{ look: 'banana', speed: 0.7, size: 0.75, damage: 0.7, homing: 2.6, life: 3.2 }],
  // Riff de raíz que renace si lo destruyen.
  ricardo: [{ look: 'phoenix', speed: 1, size: 0.85, damage: 0.95, revive: true }],
  // Corazones de seguidores que giran a su alrededor como escudo y después salen disparados.
  kimberly: [0, 1 / 3, 2 / 3].map((phase) => ({ look: 'like' as const, speed: 1.1, size: 0.6, damage: 0.4, orbit: 2000, phase })),
};

/** Los tres poderes de El Acople (sale uno al azar cada vez). */
export const ACOPLE_POWERS: ShotSpec[][] = [
  // Orbe de energía oscura, pesado.
  [{ look: 'darkOrb', speed: 0.8, size: 1.3, damage: 1.3 }],
  // Bola de feedback que se carga en la mano y sale disparada hacia el rival con una cola de láser.
  [{ look: 'feedback', size: 0.7, damage: 0.95, dart: 260, speed: 3.2 }],
  // Chillido que persigue al rival.
  [{ look: 'shriek', speed: 0.85, size: 0.9, damage: 0.9, homing: 2.2, life: 2.8 }],
];

/** Disparos del poder de `id` contra `rival` (Mimético copia; El Acople elige uno de los suyos). */
export const powerFor = (id: FighterId, rival: FighterId): ShotSpec[] => {
  if (id === 'acople') return ACOPLE_POWERS[Math.floor(Math.random() * ACOPLE_POWERS.length)];
  if (id === 'mimetico') {
    if (rival === 'acople') return ACOPLE_POWERS[0];
    return POWERS[rival] ?? POWERS.mayin!;
  }
  return POWERS[id] ?? POWERS.mayin!;
};
