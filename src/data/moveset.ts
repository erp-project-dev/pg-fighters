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
  erp: 'Buster: un disparo recto y rapidísimo desde el puño. Simple y confiable.',
  mayin: 'Embestida: cruza más de media pantalla con la panza por delante, pegado al piso; sirve para acercarte y empuja lejos al rival. Se esquiva saltando; si te la bloquean, quedas vendido un momento.',
  george: 'Onda afinada: va recta y corrige su altura hacia el rival. Si pega, lo silencia 3 s: no puede usar su poder. Pega poco.',
  pepper: 'Láser de ecualizador que cruza toda la pantalla. Mantén el clic para cargarlo (hasta 2 s): sale más grueso, pega más y empuja lejos.',
  slandor: 'Golpe de oro: tu próximo golpe normal (puño, patada, barrida o aéreo) pega el doble. Se gasta al pegar; si fallas o te lo bloquean, lo conservas. Lo pierdes si te pegan o a los 5 s.',
  pentalick: 'El lick que funciona: cada vez que pega, el siguiente sale más grande y pega más (hasta nivel 3). Si falla o te lo bloquean, vuelve al nivel 1.',
  mimetico: 'Espejo que se queda delante un rato: si un poder rival lo toca, lo copia y te lo devuelve.',
  clavito: 'Caos: de 2 a 5 meteoritos con ángulos al azar. Nadie sabe qué viene, ni él.',
  chantal: 'Bandeja en bumerán, muy rápida y de largo alcance: atraviesa los poderes y pega a la ida y a la vuelta. Si el rival la esquiva, se rompe y no vuelve.',
  jeanpierre: 'Tres canicas seguidas y rápidas que van de frente ondulando; cada una hace retroceder un poco al rival.',
  ferdex: 'Puño volador: cruza más de media pantalla pegado al piso, puño por delante, dejando una cola roja; sirve para acercarte. Se para con un antiaéreo; si te la bloquean, quedas vendido un momento.',
  turboshred: 'Tempo imposible: por 3 s caminas y golpeas más rápido, envuelto en viento. No pega por sí solo. La recarga empieza al terminar.',
  toxicity: 'Cruz que crece cada vez más hasta llegar al rival.',
  rematada: 'Latigazo de cuerda: si pega, jala al rival hasta tenerlo a distancia de golpe.',
  escalas: 'Contraataque: se pone en guardia un momento. Si le pegan (golpe o poder), recibe el daño igual pero no se corta: aparece junto al atacante y le devuelve un golpe que tumba. Si nadie ataca, queda expuesto. Recarga larga, que empieza al terminar la guardia.',
  tayloy: 'Tres agujas de jade desde alturas distintas, directo al rival.',
  jesex: 'Moneda rápida: si pega, le roba un poco de vida al rival. Cada moneda sale más rápida que la anterior (+10 % y +25 %), y a la cuarta vuelve a empezar.',
  markus: 'Tornado de arena: avanza recto y, si pega, jala un poco al rival hacia ti. Recarga larga.',
  platanero: 'Plátano que se arrastra por el piso hasta el rival: solo se bloquea agachado, se esquiva saltando.',
  ricardo: 'Tres aros de corazón, de grande a pequeño: pegan y empujan lejos al rival.',
  kimberly: 'Corazones que giran como escudo y después salen disparados.',
  nosu: 'Jaula: una esfera enrejada que, si pega, encierra al rival un momento (no se mueve ni bloquea). Tu primer golpe la rompe. Se gasta al salir y tarda 5 s en volver (mientras, sale una esfera lisa que solo pega); cuando está lista, flota una esferita junto a NOSU.',
  virrey: 'Corte de sable alto hacia el rival. Tributo: al tercer acierto, el corte vuelve a ti con su tributo y te cura.',
  inti: 'Sol que se carga girando a tu alrededor (sin pegar) y luego sale disparado al rival. Puedes cargar varios: solo esperas la recarga.',
  amu: 'Lanza de chonta rapidísima. Si pega, el veneno pega enseguida otra vez (no se bloquea).',
  acople: 'Uno de sus tres poderes robados, al azar.',
};

/** Sin poder propio todavía se usa el de George (data/powers.ts), y también su descripción. */
export const powerInfo = (id: FighterId): string => POWER_INFO[id] ?? POWER_INFO.george!;

/** Qué hace el ultimate de cada uno (pausa). Corto: el panel de movimientos tiene poco alto. Usar `superInfo`. */
const SUPER_INFO: Partial<Record<FighterId, string>> = {
  erp: 'La imagen se descuadra en glitch y lanza ráfagas de píxeles. Remate: la pantalla se cuelga y revienta.',
  mayin: 'Cinco cuerdas de luz azul vibran y el rival se hunde de tristeza. Remate: una ola azul barre la pantalla.',
  george: 'Ondas desafinadas que se van enderezando; el rival se ve doble. Remate: todo queda afinado a 0 cents.',
  pepper: 'Barras de espectro gigantes y cada golpe aplasta al rival. Remate: todo se satura en rojo, CLIP.',
  slandor: 'Rayos dorados que van convirtiendo al rival en estatua de oro. Remate: estallido dorado.',
  pentalick: 'Cinco orbes de colores, siempre en el mismo orden; el rival queda en loop. Remate: los cinco a la vez.',
  mimetico: 'Lanza copias verdes de sí mismo y todo deja fantasmas. Remate: decenas de copias caen sobre el rival.',
  clavito: 'Láseres de discoteca y todo rebota con el beat. Remate: silencio, negro… y el drop.',
  chantal: 'Espirales de luz y discos que giran; el rival queda dando vueltas. Remate: la espiral se cierra y estalla.',
  jeanpierre: 'Cintas de luz celeste y el rival gira como en un vals. Remate: estallido azul, blanco y rojo.',
  ferdex: 'Púas rojas que giran y congelan al rival bajo la nieve. Remate: el rayo de Curcuman rompe el hielo.',
  turboshred: 'Todo va en cámara lenta menos él. Remate: el tiempo se detiene y cien cortes caen de golpe.',
  toxicity: 'Aire morado y denso, aura de poseída y cruces de luz. Remate: una cruz gigante sobre el rival.',
  rematada: 'Una cuerda de energía la une al rival y lo electrocuta. Remate: ¡TWANG!, la cuerda lo lanza.',
  escalas: 'Escalas de luz recorren la pantalla y marcan al rival. Remate: tres impactos seguidos y FIN.',
  tayloy: 'Tajos de jade y un dragón de luz que se enrosca en el rival. Remate: el dragón choca y todo estalla.',
  jesex: 'Todo se baña en oro y lanza cometas dorados. Remate: lluvia de cometas sobre el rival.',
  markus: 'Tornados de arena que atrapan y electrocutan al rival. Remate: ¡KABOOOM! que deforma la pantalla.',
  platanero: 'La imagen se vuelve VHS y el rival se rebobina. Remate: estática total y STOP.',
  ricardo: 'Todo empieza gris y cada golpe le devuelve color. Remate: un corazón de luz gigante explota.',
  kimberly: 'Transmisión EN VIVO con likes que suben de a millones. Remate: se cae la señal y vuelve con todo.',
  nosu: 'CORRIGIENDO…: la barra solo avanza con los golpes que aciertan. Remate: CORREGIDO, o lo que alcanzó.',
  virrey: 'Todo se vuelve oro frío y le drena la energía al rival. Remate: absorción total, POR DECRETO.',
  inti: 'Eclipse y sol gigante; discos solares queman al rival. Remate: el mundo se da vuelta y cae la llamarada.',
  amu: 'El río sube y la corriente arrastra al rival. Remate: una ola verde barre la pantalla.',
  acople: 'Misiles de plasma que persiguen y electrocutan, y la pantalla se agrieta. Remate: FEEDBACK TOTAL.',
};

/** Descripción del ultimate (con la barra llena). */
export const superInfo = (id: FighterId): string => `Barra ULTIMATE llena. ${SUPER_INFO[id] ?? ''}`.trim();

export const TRAITS: Partial<Record<FighterId, Trait>> = {
  erp: { name: 'DEDOS RÁPIDOS', desc: 'Jab más rápido y cadena de hasta 4 golpes.' },
  mayin: { name: 'PESO PESADO', desc: 'Su patada aguanta un golpe sin cortarse.' },
  nosu: { name: 'CORRECCIÓN A DISTANCIA', desc: 'Barrida con más alcance.' },
};

/**
 * Recarga del poder básico (ms) según lo fuerte o útil que es; por defecto POWER_COOLDOWN (1,4 s).
 * Los de efecto (guardia, velocidad) cuentan desde que el efecto termina.
 */
const COOLDOWNS: Partial<Record<FighterId, number>> = {
  erp: 1000,
  george: 1800,
  slandor: 2000,
  mimetico: 2000,
  clavito: 1600,
  chantal: 1800,
  jeanpierre: 1800,
  ferdex: 1400,
  turboshred: 4500,
  rematada: 1800,
  escalas: 4000,
  jesex: 2000,
  markus: 2600,
  platanero: 1600,
  ricardo: 1600,
  kimberly: 2200,
  virrey: 1600,
  inti: 1300,
  amu: 1800,
};

const KITS: Partial<Record<FighterId, Kit>> = {
  erp: {
    moves: { jab: { startup: 45 }, special: { startup: 100, recovery: 300, push: 220 } },
    chain: 4,
  },
  // Embestida: cruza más de media pantalla con la panza por delante (sirve para acercarse). Si lo bloquean, queda vendido.
  mayin: {
    armor: ['kick'],
    moves: { special: { pose: 'dash', startup: 150, active: 460, recovery: 460, reach: 190, damage: 110, push: 900, hitstun: 420, blockstun: 220, rush: { speed: 2600, trail: 0x3a7bff } } },
  },
  // Puño volador: se lanza pegado al piso con el puño por delante, cruzando más de media pantalla, con cola roja.
  ferdex: {
    moves: { special: { pose: 'punch', startup: 140, active: 460, recovery: 440, reach: 230, damage: 105, push: 600, hitstun: 420, blockstun: 220, sfx: 'punch', rush: { speed: 2600, trail: 0xe63a2e } } },
  },
  nosu: { moves: { sweep: { reach: 400 } } },
  // "Eso está en el capítulo tres": guardia de contraataque. La recarga empieza cuando termina la guardia.
  escalas: {
    moves: { special: { pose: 'block', startup: 70, active: 650, recovery: 420, reach: 0, damage: 0, counter: true } },
  },
  inti: { multi: true },
};

export const kitOf = (id: FighterId): Kit => {
  const kit = KITS[id] ?? {};
  return COOLDOWNS[id] ? { ...kit, powerCooldown: kit.powerCooldown ?? COOLDOWNS[id] } : kit;
};

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
