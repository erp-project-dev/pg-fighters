import type { FighterId } from './fighters';
import { CHAIN_FINISHER, MOVES, type MoveDef, type MoveId } from './moves';

/** Rasgo fijo del luchador en sus golpes básicos (no se activa con ningún comando). */
export interface Trait {
  name: string;
  desc: string;
}

/** Lo que hace distinto a cada luchador en sus golpes: ajustes a los golpes comunes y reglas propias. */
export interface Kit {
  /** Cambios sobre los golpes comunes (data/moves.ts). */
  moves?: Partial<Record<MoveId, Partial<MoveDef>>>;
  /** Golpes de la cadena; el último tumba (por defecto CHAIN_FINISHER). */
  chain?: number;
  /** Recarga del poder básico (ms). */
  powerCooldown?: number;
  /** Golpes que aguantan un impacto sin cortarse (armadura). */
  armor?: MoveId[];
  /** Puede lanzar el poder otra vez aunque el anterior siga en pantalla (solo espera la recarga). */
  multi?: boolean;
}

/** Qué hace el poder básico de cada uno (pausa y selección de personaje). Usar `powerInfo`. */
const POWER_INFO: Partial<Record<FighterId, string>> = {
  erp: 'Ráfaga de dos disparos de buster: sale casi al instante, vuela muy rápido y recarga enseguida. Pega poco.',
  mayin: 'Nota bomba: cae al piso y explota en área al rato (hasta bloqueando pasa un poco). Si impacta directo, explota al instante y pega más.',
  george: 'Onda afinada: va recta y corrige su altura hacia el rival (si salta, sube; si se agacha, baja).',
  pepper: 'Láser de ecualizador que cruza toda la pantalla. Mantén el clic para cargarlo (hasta 2 s): sale más grueso, pega más y empuja lejos.',
  slandor: 'Golpe de oro: tu próximo golpe normal (puño, patada, barrida o aéreo) pega el doble. Se gasta al pegar; si fallas o te lo bloquean, lo conservas. Lo pierdes si te pegan o a los 5 s.',
  pentalick: 'El lick que funciona: cada vez que pega, el siguiente sale más grande y pega más (hasta nivel 3). Si falla o te lo bloquean, vuelve al nivel 1.',
  mimetico: 'Espejo que se queda delante un rato: si un poder rival lo toca, lo copia y te lo devuelve.',
  clavito: 'Caos: de 2 a 5 meteoritos con ángulos al azar. Nadie sabe qué viene, ni él.',
  chantal: 'Bandeja en bumerán, muy rápida: atraviesa los poderes y pega a la ida y a la vuelta.',
  jeanpierre: 'Tres canicas rápidas que salen abiertas y curvan hacia el rival.',
  ferdex: 'Dos estrellas que tira al piso y rebotan hacia el rival.',
  turboshred: 'Tres parejas de notitas, una encima de la otra. Salen lentas y de golpe disparan rapidísimo.',
  toxicity: 'Cruz que crece cada vez más hasta llegar al rival.',
  rematada: 'Latigazo de cuerda: si pega, jala al rival hasta tenerlo a distancia de golpe.',
  escalas: 'Libro-muro: vuela un poco y se planta 3 s en el piso, frenando los poderes del rival.',
  tayloy: 'Tres agujas de jade desde alturas distintas, directo al rival.',
  jesex: 'Moneda rapidísima: si pega, pega dos veces.',
  markus: 'Estrella que avanza por el piso, sube hacia el rival y explota.',
  platanero: 'Plátano que se arrastra por el piso hasta el rival: solo se bloquea agachado, se esquiva saltando.',
  ricardo: 'Tres ondas de audio en aros verticales, de grande a pequeña: pegan y empujan lejos al rival.',
  kimberly: 'Corazones que giran como escudo y después salen disparados.',
  nosu: 'Jaula: una esfera enrejada que, si pega, encierra al rival un momento (no se mueve ni bloquea). Tu primer golpe la rompe. Se gasta al salir y tarda 5 s en volver (mientras, sale una esfera lisa que solo pega); cuando está lista, flota una esferita junto a NOSU.',
  virrey: 'Tres cortes de sable altos, seguidos, hacia el rival: el primero normal, el segundo rápido y el tercero rapidísimo.',
  inti: 'Sol que se carga girando a tu alrededor (sin pegar) y luego sale disparado al rival. Puedes cargar varios: solo esperas la recarga.',
  amu: 'Lanza de chonta rapidísima. Si pega, el veneno pega enseguida otra vez (no se bloquea).',
  acople: 'Uno de sus tres poderes robados, al azar.',
};

/** Sin poder propio todavía se usa el de Mayin (data/powers.ts), y también su descripción. */
export const powerInfo = (id: FighterId): string => POWER_INFO[id] ?? POWER_INFO.mayin!;

export const TRAITS: Partial<Record<FighterId, Trait>> = {
  erp: { name: 'DEDOS RÁPIDOS', desc: 'Jab más rápido y cadena de hasta 4 golpes.' },
  mayin: { name: 'PESO PESADO', desc: 'Su patada aguanta un golpe sin cortarse.' },
  nosu: { name: 'CORRECCIÓN A DISTANCIA', desc: 'Barrida con más alcance.' },
};

const KITS: Partial<Record<FighterId, Kit>> = {
  erp: {
    moves: { jab: { startup: 45 }, special: { startup: 100, recovery: 300, push: 220 } },
    chain: 4,
    powerCooldown: 900,
  },
  mayin: { armor: ['kick'] },
  nosu: { moves: { sweep: { reach: 400 } } },
  inti: { multi: true, powerCooldown: 1000 },
};

export const kitOf = (id: FighterId): Kit => KITS[id] ?? {};

/** Golpes de la cadena de `id` (el último tumba). */
export const chainOf = (id: FighterId): number => kitOf(id).chain ?? CHAIN_FINISHER;

const cache = new Map<FighterId, Record<MoveId, MoveDef>>();

/** El golpe `move` tal como lo hace `id` (con sus ajustes). Siempre devuelve el mismo objeto. */
export const moveFor = (id: FighterId, move: MoveId): MoveDef => {
  let set = cache.get(id);
  if (!set) {
    const tweaks = kitOf(id).moves ?? {};
    set = Object.fromEntries(
      (Object.keys(MOVES) as MoveId[]).map((m) => [m, tweaks[m] ? { ...MOVES[m], ...tweaks[m] } : MOVES[m]]),
    ) as Record<MoveId, MoveDef>;
    cache.set(id, set);
  }
  return set[move];
};
