import type { FighterId } from './fighters';

/** Dibujo del proyectil (visuals/powers.ts). */
export type PowerLook =
  | 'code' | 'note' | 'wave' | 'laser' | 'pick' | 'lick' | 'meteor' | 'tray' | 'kiss' | 'redStar' | 'miniNote'
  | 'flask' | 'lash' | 'banana' | 'phoenix' | 'like' | 'book' | 'pearl' | 'cheque' | 'star8' | 'firefly' | 'darkOrb' | 'feedback' | 'shriek' | 'soundwave'
  | 'decree' | 'sun' | 'drum' | 'marble' | 'cross' | 'needle' | 'coin' | 'mirror' | 'ring' | 'dagger' | 'spear' | 'buster' | 'slash' | 'tornado';

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
  /** Si pega, jala un poco al rival hacia el que lo lanzó (px aproximados). */
  tug?: number;
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
  /** No lanza nada: por estos ms camina y golpea más rápido (Fighter.haste). */
  haste?: number;
  /** Multiplicador de velocidad según la vez que se lanza el poder (en ciclo): [1ª, 2ª, 3ª…] y vuelve a empezar. */
  speedCycle?: number[];
  /** Si pega, el que lo lanzó se cura esta fracción del daño. */
  drain?: number;
  /** Tributo: cada `every` aciertos de este poder, el disparo vuelve al que lo lanzó y lo cura `drain` × el daño. */
  tribute?: { every: number; drain: number };
  /** Si pega, el rival no puede usar su poder básico estos ms (no se acumula mientras dura). */
  silence?: number;
}

/** Poder básico de cada luchador. El Acople usa uno de sus tres al azar. */
export const POWERS: Partial<Record<FighterId, ShotSpec[]>> = {
  // Disparo de buster morado, recto y rapidísimo desde el puño: el poder más simple del juego.
  erp: [{ look: 'buster', color: 0x9b30ff, speed: 2.2, size: 1.3, damage: 0.85 }],
  // Onda afinada: va recta y corrige su altura hacia el pecho del rival. Si pega, silencia al rival 3 s.
  george: [{ look: 'wave', damage: 0.7, track: 2.2, silence: 3000 }],
  // Láser de ecualizador que cruza la pantalla. Manteniendo el clic se carga (hasta 2 s) y sale más grueso y fuerte.
  pepper: [{ look: 'laser', size: 0.6, damage: 0.75, beam: 260, charged: { size: 2.4, damage: 2, push: 2.5 } }],
  // Golpe de oro: su próximo golpe normal pega el doble (se gasta al conectar).
  slandor: [{ look: 'pick', empower: 2 }],
  // El lick que funciona: sube de nivel cada vez que pega (3 niveles); si falla, vuelve al 1.
  pentalick: [{ look: 'lick', size: 0.75, damage: 0.8, levels: 3 }],
  // Bandeja en bumerán, rápida: atraviesa poderes y pega a la ida y a la vuelta. Si el rival la esquiva, se rompe.
  chantal: [{ look: 'tray', speed: 2.4, size: 0.8, damage: 0.55, boomerang: 1000, hits: 2, pierce: true }],
  // Tres canicas seguidas y rápidas que van de frente ondulando arriba y abajo; cada una empuja un poco al rival.
  jeanpierre: [0, 60, 120].map((delay, i) => ({
    // Cada canica empuja un poco al rival hacia atrás.
    look: 'marble' as const, speed: 2, size: 0.42, damage: 0.32, delay, wave: { amp: i === 1 ? -70 : 70, freq: 11 }, push: 520,
  })),
  // MayinBlues y Ferdex no lanzan nada: su poder es una embestida (data/moveset.ts, `rush`).
  // Tempo imposible: no lanza nada; por 3 s camina y golpea más rápido (la recarga corre al terminar).
  turboshred: [{ look: 'miniNote', haste: 3000 }],
  // Cruz que crece hasta llegar al rival.
  toxicity: [{ look: 'cross', size: 0.55, damage: 1.1, grow: 5 }],
  // Latigazo de cuerda: si pega, jala al rival hacia ella.
  rematada: [{ look: 'lash', size: 0.7, damage: 1.2, beam: 120, range: 560, pull: true }],
  // Doctor Escalas no lanza nada: su poder es un contraataque (data/moveset.ts, `counter`).
  // Tres agujas de jade desde alturas distintas, apuntadas al rival.
  tayloy: [[0, 240], [70, 0], [140, -150]].map(([delay, aimed]) => ({ look: 'needle' as const, size: 0.5, damage: 0.35, delay, aimed })),
  // Moneda rápida: si pega, le roba un poco de vida al rival (se cura el 60 % del daño). Sale cada vez más rápida: normal, +10 % y +25 %, y vuelve a empezar.
  jesex: [{ look: 'coin', speed: 2.3, size: 0.5, damage: 0.7, drain: 0.6, speedCycle: [1, 1.1, 1.25] }],
  // Tornado de arena: avanza recto y, si pega, jala un poco al rival hacia Markus.
  markus: [{ look: 'tornado', speed: 1.3, size: 2.1, damage: 0.9, tall: 420, tug: 260 }],
  // Plátano que se arrastra por el piso hasta el rival y pega abajo.
  platanero: [{ look: 'banana', size: 0.6, damage: 0.7, low: true, seek: 3, life: 3.2 }],
  // Tres aros de corazón, de grande a pequeño, uno detrás de otro: pegan y empujan lejos.
  ricardo: [[0, 2.6, 0.45], [90, 1.9, 0.3], [180, 1.3, 0.2]].map(([delay, size, damage]) => ({ look: 'ring' as const, color: 0xb04dff, size, damage, delay, push: 1100 })),
  // Corazones de seguidores que giran a su alrededor como escudo y después salen disparados.
  kimberly: [0, 1 / 3, 2 / 3].map((phase) => ({ look: 'like' as const, size: 0.6, damage: 0.4, orbit: 2000, phase })),
  // Jaula de corrección: esfera enrejada que, si pega, encierra al rival un momento (se gasta al salir; mientras se recarga, esfera lisa).
  nosu: [{ look: 'soundwave', color: 0xb04dff, size: 0.9, damage: 0.45, cage: 1100 }],
  // Espejo que se queda delante: si un poder rival lo toca, lo copia y lo dispara de vuelta.
  mimetico: [{ look: 'mirror', size: 0.85, damage: 0.5, range: 380, hover: 1800, mirror: true }],
  // Corte de sable alto hacia el rival. Tributo: al tercer acierto, el corte vuelve a él y lo cura (FightScene.tribute).
  virrey: [{ look: 'slash', size: 0.48, damage: 0.9, speed: 1.5, tall: 240, tribute: { every: 3, drain: 0.8 } }],
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

/**
 * De dónde sale el poder: puño en la pose del poder, como fracción de la altura del luchador
 * ([adelante, arriba]). Por defecto [0.34, 0.58].
 */
const FIST: Partial<Record<FighterId, [number, number]>> = {
  // El Acople lanza con la mano abierta y el brazo alto, y su arte se ve más grande que su alto de guardia.
  acople: [0.38, 0.77],
  // ERP dispara el buster con el puño a la altura del pecho.
  erp: [0.36, 0.74],
};
export const powerFist = (id: FighterId): [number, number] => FIST[id] ?? [0.34, 0.58];

/** Disparos del poder de `id` (El Acople elige uno de los suyos). */
export const powerFor = (id: FighterId): ShotSpec[] => {
  if (id === 'acople') return ACOPLE_POWERS[Math.floor(Math.random() * ACOPLE_POWERS.length)];
  // Clavito: caos, cada vez distinto.
  if (id === 'clavito') return chaos();
  return POWERS[id] ?? POWERS.george!;
};
