import type { FighterId } from './fighters';

/** Dibujo del proyectil (visuals/powers.ts). */
export type PowerLook =
  | 'code' | 'note' | 'wave' | 'laser' | 'pick' | 'lick' | 'meteor' | 'tray' | 'kiss' | 'redStar' | 'miniNote'
  | 'flask' | 'lash' | 'banana' | 'phoenix' | 'like' | 'book' | 'pearl' | 'cheque' | 'star8' | 'firefly' | 'darkOrb' | 'feedback' | 'shriek' | 'soundwave'
  | 'decree' | 'sun' | 'drum' | 'marble' | 'cross' | 'needle' | 'coin' | 'mirror' | 'ring' | 'dagger' | 'spear' | 'buster' | 'slash';

/**
 * Un disparo del poder básico (↓ ↘ → + P). Las velocidades y tamaños multiplican los valores base
 * (velocidad común POWER_SPEED de entities/Projectile.ts, radio 52 px, daño del golpe `special`).
 * Todos los poderes avanzan a la misma velocidad: solo cambia `speed` en los que tienen que ser rápidos a propósito.
 */
export interface ShotSpec {
  look: PowerLook;
  /** Color propio del poder (estela y destellos); si no, el del luchador. */
  color?: number;
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
  /** Arranca casi quieto estos ms y luego sale disparado de golpe a su velocidad (`speed`). */
  windup?: number;
  /** Sale esta distancia más arriba (+) o más abajo (−) del puño (px). */
  dz?: number;
  /** Crece mientras avanza: llega a `grow` × su tamaño al alcanzar donde estaba el rival (o hasta que pega). */
  grow?: number;
  /** Va y vuelve (distancia de ida en px). */
  boomerang?: number;
  /** Distancia máxima (px) antes de detenerse, explotar o desaparecer. */
  range?: number;
  /** Al llegar a `range` se queda flotando estos ms (trampa); con `explode`, al final explota. */
  hover?: number;
  /** Al tocar o al llegar a `range` explota en un área de este radio (px). */
  explode?: number;
  /** Bomba: cae al piso y explota (`explode`) estos ms después de caer, salvo que pegue directo antes. */
  fuse?: number;
  /** Multiplicador del daño si pega directo, antes de explotar (bomba). */
  direct?: number;
  /**
   * Jaula: si pega limpio, encierra al rival estos ms (no se mueve ni bloquea). El primer golpe que recibe
   * dentro la rompe, y no se lo puede volver a encerrar enseguida (FightScene.cage).
   */
  cage?: number;
  /**
   * Se carga manteniendo el clic (hasta CHARGE_MS): al soltar sale con el tamaño, el daño y el empuje
   * multiplicados hasta estos valores según cuánto se cargó.
   */
  charged?: { size: number; damage: number; push: number };
  /** Velocidad vertical inicial (px/s): curvas y lanzamientos al piso. */
  vz0?: number;
  /** Se dirige solo en horizontal hacia el rival (fuerza de giro): bota o se arrastra hasta él. */
  seek?: number;
  /** Alto de la zona de golpe (px), para poderes altos y angostos como un corte de sable. */
  tall?: number;
  /** Sale apuntado en línea recta al pecho del rival, desde esta altura relativa al puño (px). */
  aimed?: number;
  /** Con `orbit`: se carga girando (crece, sin pegar ni chocar) y al terminar sale disparado al pecho del rival. */
  charge?: boolean;
  /** Viaja pegado al piso y sube hacia el rival (con `homing`) cuando está a esta distancia (px). */
  rise?: number;
  /** Se arrastra por el piso hasta el rival y pega abajo: solo se bloquea agachado, se esquiva saltando. */
  low?: boolean;
  /** Al pegar se queda pegado al rival y vuelve a pegar enseguida (con `hits: 2`). */
  stick?: boolean;
  /** Veneno: si pega (sin bloqueo), a los `delay` ms vuelve a pegar con `damage` × su daño. No se bloquea. */
  poison?: { delay: number; damage: number };
  /** Empuje propio al pegar (px/s): manda al rival hacia atrás. */
  push?: number;
  /** Con `low`: va rasante desde que sale (sin caer del puño), en línea recta. */
  skim?: boolean;
  /** Sube de nivel cada vez que pega (hasta `levels`); si falla o se lo bloquean, vuelve al 1 (FightScene). */
  levels?: number;
  /** Nivel con el que salió (0 = primero): más grande y pega más. Lo pone FightScene. */
  level?: number;
  /** Corrige su altura hacia el pecho del rival (fuerza), sin dejar de ir recto hacia adelante. */
  track?: number;
  /** Al llegar a `range` se planta parado en el piso estos ms: bloquea los poderes del rival y no pega. */
  wall?: number;
  /** Si pega, jala al rival hasta quedar a distancia de golpe. */
  pull?: boolean;
  /** No lanza nada: carga el próximo golpe normal, que pega `empower` × (se gasta al conectar). */
  empower?: number;
  /** Espejo: si un poder rival lo toca, lo copia y lo dispara de vuelta. */
  mirror?: boolean;
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

/** Poder básico de cada luchador. El Acople usa uno de sus tres al azar. */
export const POWERS: Partial<Record<FighterId, ShotSpec[]>> = {
  // Ráfaga de dos disparos de buster morados, muy rápidos (el golpe sale y recarga antes: data/moveset.ts).
  erp: [0, 110].map((delay) => ({ look: 'buster' as const, color: 0x9b30ff, speed: 1.8, size: 1.2, damage: 0.4, delay })),
  // Nota bomba: cae al piso y explota a los 1,5 s; si pega directo, explota al instante y pega más.
  mayin: [{ look: 'note', size: 1.1, damage: 1.05, fuse: 1500, explode: 230, direct: 1.25 }],
  // Onda afinada: va recta y corrige su altura hacia el pecho del rival.
  george: [{ look: 'wave', damage: 1, track: 2.2 }],
  // Láser de ecualizador que cruza la pantalla. Manteniendo el clic se carga (hasta 2 s) y sale más grueso y fuerte.
  pepper: [{ look: 'laser', size: 0.6, damage: 0.75, beam: 260, charged: { size: 2.4, damage: 2, push: 2.5 } }],
  // Golpe de oro: su próximo golpe normal pega el doble (se gasta al conectar).
  slandor: [{ look: 'pick', empower: 2 }],
  // El lick que funciona: sube de nivel cada vez que pega (3 niveles); si falla, vuelve al 1.
  pentalick: [{ look: 'lick', size: 0.75, damage: 0.8, levels: 3 }],
  // Bandeja en bumerán, rápida: atraviesa poderes y pega a la ida y a la vuelta.
  chantal: [{ look: 'tray', speed: 1.6, size: 0.8, damage: 0.55, boomerang: 640, hits: 2, pierce: true }],
  // Tres canicas rápidas que salen abiertas y curvan hacia el rival.
  jeanpierre: [[0, 500], [90, -350], [180, 150]].map(([delay, vz0]) => ({ look: 'marble' as const, speed: 1.35, size: 0.42, damage: 0.35, delay, vz0, homing: 2.4, life: 2.2 })),
  // Dos estrellas tiradas al piso que rebotan hacia el rival.
  ferdex: [0, 160].map((delay) => ({ look: 'redStar' as const, size: 0.5, damage: 0.5, delay, bounce: true, vz0: -700, seek: 2.5, life: 3 })),
  // Tres parejas de notitas pegadas, una encima de la otra, a la altura de la mano.
  // Salen casi quietas y de golpe disparan rapidísimo.
  turboshred: [0, 110, 220].flatMap((delay) => [24, -24].map((dz) => ({ look: 'miniNote' as const, size: 0.45, damage: 0.2, delay, speed: 2.4, windup: 450, dz }))),
  // Cruz que crece hasta llegar al rival.
  toxicity: [{ look: 'cross', size: 0.55, damage: 1.1, grow: 5 }],
  // Latigazo de cuerda: si pega, jala al rival hacia ella.
  rematada: [{ look: 'lash', size: 0.7, damage: 1.2, beam: 120, range: 560, pull: true }],
  // Libro-muro: vuela un poco y se planta parado en el piso 3 s, bloqueando los poderes del rival.
  escalas: [{ look: 'book', size: 1.1, damage: 1, range: 340, wall: 3000 }],
  // Tres agujas de jade desde alturas distintas, apuntadas al rival.
  tayloy: [[0, 240], [70, 0], [140, -150]].map(([delay, aimed]) => ({ look: 'needle' as const, size: 0.5, damage: 0.35, delay, aimed })),
  // Moneda rapidísima: si pega, pega dos veces.
  jesex: [{ look: 'coin', speed: 2.3, size: 0.45, damage: 0.45, hits: 2, stick: true }],
  // Estrella que avanza por el piso, sube hacia el rival y explota (KABOOM).
  markus: [{ look: 'star8', speed: 1.5, size: 0.9, damage: 1.1, rise: 520, homing: 3, explode: 240, life: 4.5 }],
  // Plátano que se arrastra por el piso hasta el rival y pega abajo.
  platanero: [{ look: 'banana', size: 0.6, damage: 0.7, low: true, seek: 3, life: 3.2 }],
  // Tres ondas de audio en aros verticales, de grande a pequeña, una detrás de otra: pegan y empujan lejos.
  ricardo: [[0, 1.8, 0.45], [90, 1.3, 0.3], [180, 0.85, 0.2]].map(([delay, size, damage]) => ({ look: 'ring' as const, color: 0xb04dff, size, damage, delay, push: 1100 })),
  // Corazones de seguidores que giran a su alrededor como escudo y después salen disparados.
  kimberly: [0, 1 / 3, 2 / 3].map((phase) => ({ look: 'like' as const, size: 0.6, damage: 0.4, orbit: 2000, phase })),
  // Jaula de corrección: esfera enrejada que, si pega, encierra al rival un momento (se gasta al salir; mientras se recarga, esfera lisa).
  nosu: [{ look: 'soundwave', color: 0xb04dff, size: 0.9, damage: 0.45, cage: 1100 }],
  // Espejo que se queda delante: si un poder rival lo toca, lo copia y lo dispara de vuelta.
  mimetico: [{ look: 'mirror', size: 0.85, damage: 0.5, range: 380, hover: 1800, mirror: true }],
  // Tres cortes de sable altos, seguidos, hacia el rival: normal, rápido y rapidísimo (los últimos alcanzan a los primeros).
  virrey: [[0, 1], [120, 1.5], [240, 2]].map(([delay, speed]) => ({ look: 'slash' as const, size: 0.6, damage: 0.38, delay, speed, tall: 320 })),
  // Sol que se carga girando a su alrededor (sin pegar) y luego sale disparado al rival. Puede tener varios (data/moveset.ts).
  inti: [{ look: 'sun', size: 0.8, damage: 0.9, orbit: 1200, charge: true }],
  // Lanza de chonta envenenada: sale rapidísima en línea recta y, si pega, el veneno pega enseguida otra vez.
  amu: [{ look: 'spear', speed: 1.7, size: 1.5, damage: 0.8, poison: { delay: 220, damage: 0.5 } }],
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

/** Clavito: de 2 a 5 meteoritos con ángulos y salidas al azar; el daño total es siempre parecido. */
const chaos = (): ShotSpec[] => {
  const count = 2 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, () => ({
    look: 'meteor' as const,
    size: 0.5 + Math.random() * 0.25,
    damage: 1.35 / count,
    climb: Math.round((Math.random() * 2 - 1) * 420),
    delay: Math.round(Math.random() * 220),
  }));
};

/** Disparos del poder de `id` (El Acople elige uno de los suyos). */
export const powerFor = (id: FighterId): ShotSpec[] => {
  if (id === 'acople') return ACOPLE_POWERS[Math.floor(Math.random() * ACOPLE_POWERS.length)];
  // Clavito: caos, cada vez distinto.
  if (id === 'clavito') return chaos();
  return POWERS[id] ?? POWERS.mayin!;
};
