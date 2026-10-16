import { COLORS } from "../config";
import type { SoloStyle } from "./solos";

export type FighterId =
  | "erp"
  | "mayin"
  | "george"
  | "pepper"
  | "slandor"
  | "pentalick"
  | "mimetico"
  | "clavito"
  | "chantal"
  | "jeanpierre"
  | "ferdex"
  | "turboshred"
  | "toxicity"
  | "rematada"
  | "escalas"
  | "tayloy"
  | "jesex"
  | "markus"
  | "platanero"
  | "ricardo"
  | "kimberly"
  | "nosu"
  | "virrey"
  | "inti"
  | "amu"
  /** Jefe del modo historia (no está en el roster). */
  | "acople";

/**
 * Forma del poder (↓ ↘ → + P), ver entities/Projectile.ts:
 *  - orb: una bola de energía.
 *  - wave: sube y baja como una onda (difícil de saltar a tiempo).
 *  - big: grande y lenta, pega más.
 *  - triple: tres proyectiles chicos a distintas alturas.
 *  - rapid: dos proyectiles chicos seguidos.
 */
export type SpecialStyle = "orb" | "wave" | "big" | "triple" | "rapid";

export interface FighterDef {
  id: FighterId;
  /** Número en el roster. */
  number: string;
  name: string;
  /** Título bajo el nombre en selección y VS. */
  tag: string;
  /** Biografía satírica (selección de personaje). */
  bio: string;
  /** Frase característica. */
  quote: string;
  /** Estilo de combate, en pocas palabras. */
  style: string;
  color: number;
  css: string;
  art: {
    /** Textura del atlas y prefijo de sus frames (`<prefijo><pose>` o `<prefijo><pose>-<n>`). Ver systems/FighterArt.ts. */
    texture: string;
    prefix: string;
    /** Alto en pantalla de la pose de guardia (px a 1920×1080). */
    height: number;
    /** Recorte de la cara dentro del frame `idle` si no hay frame `portrait`. */
    face: { x: number; y: number; w: number; h: number };
    /**
     * Personaje sin arte propio todavía: usa el cuerpo de otro luchador teñido con `tint`
     * y un retrato provisional con sus iniciales. Se quita cuando llegue su atlas.
     */
    placeholder?: boolean;
    tint?: number;
  };
  stats: {
    walk: number; // px/s hacia adelante
    dash: number; // px/s al iniciar el dash
    damage: number; // multiplicador
    defense: number; // multiplicador del daño recibido
    projectileSpeed: number;
  };
  /** Barras de la pantalla de selección (1–5). */
  rating: {
    potencia: number;
    velocidad: number;
    alcance: number;
    tecnica: number;
  };
  moves: { special: string; uppercut: string; super: string };
  special: SpecialStyle;
  /** Súper: frase del retrato a pantalla completa y estilo del solo de guitarra (data/solos.ts). */
  superMove: { quote: string; solo: SoloStyle };
  /** Frase antes de pelear (diálogo por defecto) y al ganar. */
  intro: string;
  win: string;
  /** Modo historia: frase "hater" antes de pelear y reacción al ser liberado. */
  hater: string;
  freed: string;
  /** Solo el jefe: vida máxima y aspecto de entidad elemental. */
  boss?: { hp: number };
}

/** Cuerpos provisionales para los personajes sin arte: el de ERP (delgado) o el de Mayin (robusto). */
const LEAN = {
  texture: "edu-anime",
  prefix: "erp-",
  face: { x: 150, y: 0, w: 135, h: 135 },
  placeholder: true,
};
const STOUT = {
  texture: "pata-anime",
  prefix: "mayin-",
  face: { x: 150, y: 14, w: 135, h: 135 },
  placeholder: true,
};

export const FIGHTERS: Record<FighterId, FighterDef> = {
  erp: {
    id: "erp",
    number: "01",
    name: "ERP PROJECT",
    tag: "EL MÚSICO DE CUARTO",
    bio: "Músico de cuarto y programador de día: audífonos puestos, ampli al mínimo y el vecino golpeando la pared. Escuela antigua siempre: prefiere una frase con lenguaje antes que mil notas de shred. Odiado por los demás por no pensar como ellos… y nunca le importó.",
    quote: "No sé cómo salió, pero quedó brutal.",
    style: "RUSHDOWN · RÁPIDO Y PRECISO",
    color: COLORS.red,
    css: "#ff2d45",
    art: {
      texture: "edu-anime",
      prefix: "erp-",
      height: 475,
      face: { x: 150, y: 0, w: 135, h: 135 },
    },
    stats: {
      walk: 340,
      dash: 1450,
      damage: 0.95,
      defense: 1.05,
      projectileSpeed: 1020,
    },
    rating: { potencia: 3, velocidad: 5, alcance: 3, tecnica: 4 },
    moves: {
      special: "PULSO NEGRO",
      uppercut: "CORTE VERTICAL",
      super: "STACK OVERFLOW",
    },
    special: "orb",
    superMove: { quote: "Lenguaje mata shred.", solo: "shred" },
    intro: "Tu bachata no me convence. Eso no es música.",
    win: "Una toma y listo. Compiló a la primera.",
    hater: "¿Tanto shred para no decir nada? Eso no es lenguaje. Es spam.",
    freed: "¿Yo dije eso? No sé cómo salió… y no quedó brutal. Perdón.",
  },
  mayin: {
    id: "mayin",
    number: "02",
    name: "MAYINBLUES",
    tag: "EL BLUESERO DEL BARRIO",
    bio: "Creció en un barrio humilde, entre combis, polladas y una guitarra prestada. No busca fama ni likes: es un simple músico de blues que toca lo que vive, y le alcanzan cinco cuerdas para contar todo su sufrimiento. Los científicos advierten que, si algún día instala la sexta, podría alterar el equilibrio musical del planeta.",
    quote: "La sexta cuerda es para principiantes.",
    style: "PESO PESADO · CADA GOLPE DUELE",
    color: COLORS.blue,
    css: "#3d8bff",
    art: {
      texture: "pata-anime",
      prefix: "mayin-",
      height: 470,
      face: { x: 150, y: 14, w: 135, h: 135 },
    },
    stats: {
      walk: 285,
      dash: 1250,
      damage: 1.12,
      defense: 0.92,
      projectileSpeed: 820,
    },
    rating: { potencia: 5, velocidad: 2, alcance: 4, tecnica: 3 },
    moves: {
      special: "ONDA BLUES",
      uppercut: "GANCHO DE BARRA",
      super: "SOLO ETERNO",
    },
    special: "orb",
    superMove: { quote: "Hola amigo, ¿cómo estás?", solo: "blues" },
    intro: 'Esta canción se llama "te vas al piso".',
    win: "Eso no fue pelea. Fue un ensayo… y ni cobré.",
    hater: "¿Seis cuerdas? Qué necesidad de llamar la atención.",
    freed: "Hola amigo, ¿cómo estás? …Uf, ¿qué me pasó?",
  },
  george: {
    id: "george",
    number: "03",
    name: "GEORGE",
    tag: "EL JUEZ DE LA AFINACIÓN",
    bio: "Elegante, sofisticado, conservador y católico de misa dominical, obsesionado con la afinación. Para él, la música se respeta como la tradición: sin inventos. Su arma más poderosa no es la guitarra, sino una frase que ha destruido generaciones enteras de músicos: «Cuidado ese bend, no está afinado». Sus rivales prefieren el nocaut antes que una segunda crítica.",
    quote: "Cuidado ese bend, no está afinado.",
    style: "ZONER · CASTIGA CADA ERROR",
    color: 0x9b7bff,
    css: "#9b7bff",
    art: { ...LEAN, height: 480 },
    stats: {
      walk: 300,
      dash: 1300,
      damage: 1.0,
      defense: 1.0,
      projectileSpeed: 900,
    },
    rating: { potencia: 3, velocidad: 3, alcance: 4, tecnica: 5 },
    moves: {
      special: "ONDA DESAFINADA",
      uppercut: "CORRECCIÓN DE CENTS",
      super: "AFINACIÓN ABSOLUTA",
    },
    special: "wave",
    superMove: { quote: "Así no es. Está desafinado.", solo: "fusion" },
    intro: "Antes de empezar... ¿afinaste? Aquí se respeta la tradición.",
    win: "Ley, orden y afinación. En ese orden.",
    hater:
      "Tu afinación es buena… sospechosamente buena. Seguro usas afinador. Fake news.",
    freed: "Algo me desafinó por dentro. Tres cents abajo, por lo menos… ¿y mi gorra?",
  },
  pepper: {
    id: "pepper",
    number: "04",
    name: "PEPPER",
    tag: "LA DIVA DE LA PRODUCCIÓN",
    bio: "Abandonó los solos para convertirse en productor. Ahora habla de frecuencias, compresión y estándares internacionales mientras mira con desprecio a los guitarristas ochenteros. Dice que los ochenta son aburridos. Los rumores dicen que nunca terminó un solo de esa época.",
    quote: "Eso necesita más producción.",
    style: "ZONER PESADO · CONTROLA LA DISTANCIA",
    color: 0x2bd4c4,
    css: "#2bd4c4",
    art: { ...LEAN, height: 470 },
    stats: {
      walk: 290,
      dash: 1250,
      damage: 1.05,
      defense: 1.0,
      projectileSpeed: 700,
    },
    rating: { potencia: 4, velocidad: 2, alcance: 5, tecnica: 3 },
    moves: {
      special: "MASTERIZACIÓN PESADA",
      uppercut: "SIDECHAIN ASCENDENTE",
      super: "ESTÁNDAR INTERNACIONAL",
    },
    special: "big",
    superMove: { quote: "Eso necesita más producción.", solo: "sub" },
    intro: "Tu mezcla suena a demo de los ochenta.",
    win: "A tu derrota le faltó producción.",
    hater: "Eso no es tocar. Es ruido sin masterizar.",
    freed: "Necesito menos producción… y más amigos. Perdón.",
  },
  slandor: {
    id: "slandor",
    number: "05",
    name: "SLANDOR",
    tag: "EL HEREDERO DORADO",
    bio: "Empresario, filántropo, viajero y dueño de una colección de guitarras que cuesta más que un edificio. Asegura que todo lo logró gracias a su talento. Según su biografía oficial, empezó desde abajo: en el segundo piso del castillo familiar.",
    quote: "Todo lo conseguí desde cero... con un pequeño préstamo de papá.",
    style: "ZONER · LLENA LA PANTALLA DE ORO",
    color: 0xffc83d,
    css: "#ffc83d",
    art: { ...LEAN, height: 478 },
    stats: {
      walk: 310,
      dash: 1300,
      damage: 1.0,
      defense: 0.9,
      projectileSpeed: 880,
    },
    rating: { potencia: 3, velocidad: 3, alcance: 4, tecnica: 2 },
    moves: {
      special: "LLUVIA DE GUITARRAS DORADAS",
      uppercut: "ASCENSO SOCIAL",
      super: "HERENCIA MILLONARIA",
    },
    special: "triple",
    superMove: {
      quote: "Todo lo conseguí desde cero... con un pequeño préstamo de papá.",
      solo: "three",
    },
    intro: "Mi guitarra cuesta más que tu barrio.",
    win: "Papá estaría orgulloso. Bueno, papá paga.",
    hater: "Seguro tu guitarra la pagaste tú. Qué vulgar.",
    freed: "Esto no se arregla ni con la plata de papá. Perdón, en serio.",
  },
  pentalick: {
    id: "pentalick",
    number: "06",
    name: "PENTALICK",
    tag: "LA LEYENDA DE LOS CINCO LICKS",
    bio: "Descubrió el secreto del éxito: cinco licks bien usados alcanzan para toda una carrera. Los ha tocado en todos los géneros, en todos los tempos y en todos los cumpleaños. Nadie sabe si tiene un sexto lick. Algunos creen que es una leyenda urbana.",
    quote: "¿Para qué aprender otro si estos funcionan?",
    style: "PRESIÓN · REPITE LO QUE FUNCIONA",
    color: 0xff7a2b,
    css: "#ff7a2b",
    art: { ...STOUT, height: 468 },
    stats: {
      walk: 280,
      dash: 1200,
      damage: 1.1,
      defense: 0.95,
      projectileSpeed: 1000,
    },
    rating: { potencia: 4, velocidad: 2, alcance: 3, tecnica: 3 },
    moves: {
      special: "LICK NÚMERO UNO (OTRA VEZ)",
      uppercut: "LICK NÚMERO DOS",
      super: "COMBO INFINITO DE CINCO LICKS",
    },
    special: "rapid",
    superMove: {
      quote: "¿Para qué aprender otro si estos funcionan?",
      solo: "lickA",
    },
    intro: "Tengo cinco licks y todos son para ti.",
    win: "Lick número cinco. Fin de la discusión.",
    hater: "Tocas mis cinco licks peor que yo. Y yo los toco igual siempre.",
    freed: "Perdón. Te regalo un lick: el cuarto. El tercero no.",
  },
  mimetico: {
    id: "mimetico",
    number: "07",
    name: "MIMÉTICO",
    tag: "EL APRENDIZ DEL LICK",
    bio: "Guerrero del rock que estudió los cinco licks legendarios y decidió que necesitaba exactamente los mismos. Todo lo que escucha lo repite: riffs, poses, camisetas y hasta la forma de afinar. Su técnica especial: los mismos cinco licks, pero con otra camiseta.",
    quote: "No es copia, es influencia.",
    style: "RUSHDOWN · MISMOS GOLPES, OTRA CAMISETA",
    color: 0x4dff88,
    css: "#4dff88",
    art: { ...LEAN, height: 472 },
    stats: {
      walk: 330,
      dash: 1400,
      damage: 0.98,
      defense: 1.02,
      projectileSpeed: 1000,
    },
    rating: { potencia: 3, velocidad: 4, alcance: 3, tecnica: 3 },
    moves: {
      special: "LICK PRESTADO",
      uppercut: "INFLUENCIA ASCENDENTE",
      super: "COPIA EXACTA",
    },
    special: "rapid",
    superMove: { quote: "No es copia, es influencia.", solo: "lickB" },
    intro: "Tus licks me suenan... de algún lado.",
    win: "Ganó la influencia.",
    hater: "Eso que tocas es copia. Lo sé porque yo copio mejor.",
    freed: "Perdón… mi odio también era copia. De alguien más.",
  },
  clavito: {
    id: "clavito",
    number: "08",
    name: "CLAVITO",
    tag: "EL PROFETA DEL METAL URBANO",
    bio: "Músico de sesión que asegura haber descubierto la combinación definitiva entre metal y ritmos urbanos. Su técnica revolucionaria: arpegios aleatorios y escalas recorridas nota por nota. Se autoproclama el futuro de la guitarra moderna. El futuro todavía no confirma.",
    quote: "Esto es un género completamente nuevo.",
    style: "CAOS · NADIE SABE QUÉ VIENE, NI ÉL",
    color: 0xff3fa4,
    css: "#ff3fa4",
    art: { ...LEAN, height: 476 },
    stats: {
      walk: 320,
      dash: 1350,
      damage: 1.0,
      defense: 1.0,
      projectileSpeed: 950,
    },
    rating: { potencia: 3, velocidad: 4, alcance: 3, tecnica: 2 },
    moves: {
      special: "TORMENTA DE ARPEGIOS",
      uppercut: "DROP URBANO",
      super: "DEMBOW APOCALÍPTICO",
    },
    special: "triple",
    superMove: {
      quote: "Esto es un género completamente nuevo.",
      solo: "dembow",
    },
    intro: "Prepárate para el futuro de la guitarra.",
    win: "Acabas de presenciar un género nuevo.",
    hater: "Tu género ya pasó de moda. El mío ni siquiera existe todavía.",
    freed: "Acabo de inventar un género nuevo: la disculpa.",
  },
  chantal: {
    id: "chantal",
    number: "09",
    name: "CHANTAL",
    tag: "EL MOZO DE LOS LICKS",
    bio: "Nació entre montañas legendarias y bajó a la ciudad a conquistar el mundo con su guitarra. De día atiende mesas; de noche sirve solos. Jamás se le ha caído una bandeja ni una nota, y siempre recomienda el plato de la casa: licks con extra de distorsión.",
    quote: "De las montañas a tu mesa.",
    style: "EQUILIBRADO · SERVICIO RÁPIDO",
    color: 0xe63946,
    css: "#ff6b6b",
    art: { ...STOUT, height: 462 },
    stats: {
      walk: 300,
      dash: 1250,
      damage: 1.08,
      defense: 0.9,
      projectileSpeed: 900,
    },
    rating: { potencia: 4, velocidad: 3, alcance: 3, tecnica: 4 },
    moves: {
      special: "BANDEJA DE ACORDES",
      uppercut: "PROPINA ASCENDENTE",
      super: "PLATO DE LICKS A LA CARTA",
    },
    special: "orb",
    superMove: { quote: "Recibe este plato de licks.", solo: "andean" },
    intro: "¿Mesa para uno? Aquí tiene el menú de licks.",
    win: "El servicio no está incluido.",
    hater: "Tu solo llegó frío y tarde. Lo devuelvo a cocina.",
    freed:
      "Disculpe la demora. Le traigo un plato de perdón, cortesía de la casa.",
  },
  jeanpierre: {
    id: "jeanpierre",
    number: "10",
    name: "JEAN-PIERRE",
    tag: "MONSIEUR SIX STRINGS",
    bio: "Empezó tocando en pequeños locales y callejones. Cansado de las batallas locales, viajó a Europa para convertirse en un guerrero internacional de las seis cuerdas. Sus guitarras son extraordinarias y cada una representa años de esfuerzo. Y de equipaje extra.",
    quote: "Bonjour, amateurs.",
    style: "TÉCNICO · RÁPIDO Y ELEGANTE",
    color: 0x8ecae6,
    css: "#8ecae6",
    art: { ...LEAN, height: 474 },
    stats: {
      walk: 335,
      dash: 1400,
      damage: 1.0,
      defense: 1.0,
      projectileSpeed: 1100,
    },
    rating: { potencia: 3, velocidad: 4, alcance: 4, tecnica: 4 },
    moves: {
      special: "BONJOUR EXPRESS",
      uppercut: "TORRE EIFFEL",
      super: "GIRA EUROPEA",
    },
    special: "orb",
    superMove: { quote: "Bonjour, amateurs.", solo: "musette" },
    intro: "Del callejón a Europa. Y ahora, a tu cara.",
    win: "Au revoir, amateur.",
    hater: "En Europa a eso no le dicen música. Le dicen «mon Dieu».",
    freed: "Pardon, mon ami. No sé qué me pasó.",
  },
  ferdex: {
    id: "ferdex",
    number: "11",
    name: "FERDEX",
    tag: "DISCÍPULO DE LOS SABIOS DE CURCUMAN",
    bio: "Latinoamericano criado en la vieja Unión Soviética entre partituras, inviernos eternos y planes quinquenales de escalas. Estudió en la Escuela de los Sabios de Curcuman, donde cada nota se le dedica al dios Curcuman. Habla impecable, pero cada solo termina en manifiesto.",
    quote: "Que Curcuman guíe tu fraseo, compañero.",
    style: "TÉCNICO · ARMONÍA Y DISCURSOS",
    color: 0xe76f51,
    css: "#e76f51",
    art: { ...LEAN, height: 472 },
    stats: {
      walk: 305,
      dash: 1300,
      damage: 0.97,
      defense: 1.0,
      projectileSpeed: 860,
    },
    rating: { potencia: 3, velocidad: 3, alcance: 4, tecnica: 5 },
    moves: {
      special: "ACORDE REVOLUCIONARIO",
      uppercut: "ASCENSO DE LAS MASAS",
      super: "LA BENDICIÓN DE CURCUMAN",
    },
    special: "wave",
    superMove: {
      quote: "La música también necesita una revolución.",
      solo: "latin",
    },
    intro: "Compañero, Curcuman me dijo que hoy pierdes.",
    win: "Por Curcuman y por el pueblo.",
    hater: "Tu fraseo es burgués, compañero. Curcuman no lo aprueba.",
    freed: "Compañero… esto no venía de Curcuman. Era otra cosa.",
  },
  turboshred: {
    id: "turboshred",
    number: "12",
    name: "TURBOSHRED",
    tag: "LA MÁQUINA DE SHRED",
    bio: "Máquina humana diseñada para tocar la mayor cantidad de notas posible. Sus solos son tan rápidos que el público escucha el final antes de entender el principio. Los metrónomos se niegan a trabajar con él.",
    quote: "¿Eso era a velocidad normal?",
    style: "RUSHDOWN · VELOCIDAD ABSURDA",
    color: 0xffee32,
    css: "#ffee32",
    art: { ...LEAN, height: 486 },
    stats: {
      walk: 360,
      dash: 1500,
      damage: 0.9,
      defense: 1.08,
      projectileSpeed: 1150,
    },
    rating: { potencia: 2, velocidad: 5, alcance: 3, tecnica: 4 },
    moves: {
      special: "RÁFAGA DE MIL NOTAS",
      uppercut: "BARRIDO VERTICAL",
      super: "METRÓNOMO EN HUELGA",
    },
    special: "rapid",
    superMove: { quote: "¿Eso era a velocidad normal?", solo: "sweep" },
    intro: "Termino esta pelea antes de que empiece.",
    win: "¿Ya terminó? No me di cuenta.",
    hater: "Tocas tan lento que me dio tiempo de odiarte.",
    freed: "Perdón. Por primera vez voy a ir más lento: para pensar.",
  },
  toxicity: {
    id: "toxicity",
    number: "13",
    name: "TOXICITY",
    tag: "LA MONJA DEL MAL GENIO",
    bio: "Se cree monja: reza antes de cada solo y bendice los amplificadores con agua bendita. La han botado de siete bandas por su temperamento; ella jura que fue por envidia. Los bateristas cruzan la calle cuando la ven venir.",
    quote: "Que Dios te perdone. Yo no.",
    style: "PRESIÓN · PERDÓN CERO",
    color: 0x7b2cbf,
    css: "#a463f2",
    art: { ...LEAN, height: 468 },
    stats: {
      walk: 320,
      dash: 1350,
      damage: 1.05,
      defense: 1.0,
      projectileSpeed: 900,
    },
    rating: { potencia: 4, velocidad: 3, alcance: 3, tecnica: 3 },
    moves: {
      special: "AGUA BENDITA HIRVIENDO",
      uppercut: "CASTIGO DIVINO",
      super: "EXCOMUNIÓN TOTAL",
    },
    special: "big",
    superMove: {
      quote: "Me botaron de siete bandas. Ahora te boto yo.",
      solo: "tritone",
    },
    intro: "Reza lo que sepas. Te vas del grupo.",
    win: "Amén. Y no vuelvas a ensayar conmigo.",
    hater: "Rezo por ti. Para que dejes la guitarra.",
    freed: "Que Dios me perdone. Y tú también, ya que estás.",
  },
  rematada: {
    id: "rematada",
    number: "14",
    name: "LA REMATADA",
    tag: "LA GUITARRA DE MAYINBLUES",
    bio: "MayinBlues la vendió en Marketplace: «poco uso, sin sexta cuerda, precio de remate». Años de golpes contra el ampli, cuerdas oxidadas y solos de cinco cuerdas a las tres de la mañana le dejaron un trauma tan profundo que cobró vida. Su único objetivo: desterrar a su antiguo dueño.",
    quote: "Hola, soy la guitarra de MayinBlues.",
    style: "ALCANCE · TODO EL MÁSTIL DE DISTANCIA",
    color: 0xc8742b,
    css: "#e0914a",
    art: { ...LEAN, height: 482 },
    stats: {
      walk: 315,
      dash: 1350,
      damage: 1.0,
      defense: 1.06,
      projectileSpeed: 860,
    },
    rating: { potencia: 3, velocidad: 4, alcance: 5, tecnica: 3 },
    moves: {
      special: "OFERTA RELÁMPAGO",
      uppercut: "CLAVIJA ASCENDENTE",
      super: "LA SEXTA CUERDA",
    },
    special: "wave",
    superMove: { quote: "Poco uso. Mucho rencor.", solo: "sixth" },
    intro: "Precio negociable. Tu derrota, no.",
    win: "Uno menos. Ya voy por ti, MayinBlues.",
    hater:
      "Tocas como el que me compró en Marketplace: sin ganas y regateando.",
    freed: "Perdón… es que nadie me afina desde que me vendieron.",
  },
  escalas: {
    id: "escalas",
    number: "15",
    name: "DOCTOR ESCALAS",
    tag: "EL ERUDITO DE LAS SEIS CUERDAS",
    bio: "Hombre culto que escribió tres bestsellers con todos los secretos de la guitarra: «El Mástil Revelado», «Escalas para el Alma» y «La Púa Definitiva». Cita a pie de página en plena pelea y nunca da un golpe que no haya documentado. Dicen que su doctorado lo sacó leyendo sus propios libros.",
    quote: "Eso está en el capítulo tres.",
    style: "TÉCNICA · CADA GOLPE TIENE BIBLIOGRAFÍA",
    color: 0x9fb0c8,
    css: "#b8c6da",
    art: { ...LEAN, height: 476 },
    stats: {
      walk: 300,
      dash: 1300,
      damage: 1.06,
      defense: 1.04,
      projectileSpeed: 780,
    },
    rating: { potencia: 4, velocidad: 2, alcance: 4, tecnica: 5 },
    moves: {
      special: "BESTSELLER EN TAPA DURA",
      uppercut: "NOTA AL PIE ASCENDENTE",
      super: "LA TRILOGÍA COMPLETA",
    },
    special: "big",
    superMove: {
      quote: "Tres libros. Todos los secretos. Ahora, la clase práctica.",
      solo: "treatise",
    },
    intro: "Abre el libro en la página uno. Ahí empieza tu derrota.",
    win: "Esta pelea saldrá en la cuarta edición.",
    hater: "Tu técnica no aparece en ninguno de mis libros. Por algo será.",
    freed:
      "Perdón… escribí mal un capítulo sobre ti. Lo corrijo en la fe de erratas.",
  },
  tayloy: {
    id: "tayloy",
    number: "16",
    name: "TAYLOY",
    tag: "HEREDERO DEL CLAN DE LA PÚA DE JADE",
    bio: "Llegó desde China con los secretos milenarios del shred, guardados por el clan de la Púa de Jade. Vino a desmentir a los falsos profetas de la guitarra y a callar a los haters que mancharon su clan. No toca por fama: toca para limpiar el honor de la Púa de Jade, una semicorchea a la vez.",
    quote: "El honor de la Púa de Jade no se negocia.",
    style: "VELOCIDAD · SHRED MILENARIO",
    color: 0x19b37a,
    css: "#2fd08f",
    art: { ...LEAN, height: 474 },
    stats: {
      walk: 350,
      dash: 1480,
      damage: 0.94,
      defense: 1.0,
      projectileSpeed: 1120,
    },
    rating: { potencia: 2, velocidad: 5, alcance: 3, tecnica: 5 },
    moves: {
      special: "SECRETO DEL SHRED",
      uppercut: "DRAGÓN PENTATÓNICO",
      super: "EL HONOR DE LA PÚA DE JADE",
    },
    special: "rapid",
    superMove: {
      quote: "Falsos profetas: esto es lo que esconden sus cursos.",
      solo: "jade",
    },
    intro: "Vine a desmentirte. Delante de todos.",
    win: "Un falso profeta menos. El clan está más limpio.",
    hater:
      "Tus licks son de curso en oferta. Mi clan los estudió hace mil años.",
    freed:
      "Deshonré a la Púa de Jade hablando así. Que mis dedos paguen la penitencia.",
  },
  jesex: {
    id: "jesex",
    number: "17",
    name: "JESEX",
    tag: "EL MAGNATE DE LA ESCUELA DEL ROCK",
    bio: "Magnate excéntrico rodeado de lujos y placeres. Viaja por todo el mundo en jet privado promoviendo la Escuela del Rock, con sede en cada país que le gustó en vacaciones. Pelear, para él, es un vacilón: el dinero le sobra, así que paga la entrada, la pelea y la revancha. De todos.",
    quote: "¿Cuánto cuesta este momento? Lo compro.",
    style: "EQUILIBRIO · TODO SE PAGA AL CONTADO",
    color: 0xd9b45a,
    css: "#ecd08a",
    art: { ...STOUT, height: 470 },
    stats: {
      walk: 305,
      dash: 1300,
      damage: 1.04,
      defense: 1.02,
      projectileSpeed: 940,
    },
    rating: { potencia: 4, velocidad: 3, alcance: 4, tecnica: 3 },
    moves: {
      special: "CHEQUE EN BLANCO",
      uppercut: "DESPEGUE EN JET PRIVADO",
      super: "GIRA MUNDIAL DE LA ESCUELA DEL ROCK",
    },
    special: "orb",
    superMove: {
      quote:
        "Esta clase va por cuenta de la casa. Bueno, de mi casa. Tengo varias.",
      solo: "jetset",
    },
    intro: "Relájate, amigo. Esto es un vacilón. Yo invito.",
    win: "Bien jugado. Te mando una beca para la Escuela del Rock.",
    hater:
      "Tu guitarra cuesta menos que mi propina. ¿Así quieres que te tomen en serio?",
    freed: "Uy… me pasé. Te debo una. Bueno, te debo un jet.",
  },
  markus: {
    id: "markus",
    number: "18",
    name: "MARKUS",
    tag: "EL GUARDIÁN DE LAS ESCALAS ORIENTALES",
    bio: "Trae desde el mundo árabe las viejas escalas orientales: maqams que sonaban siglos antes de que alguien inventara la pentatónica. Cuarto de tono por aquí, segunda aumentada por allá, y la escena entera se queda sin palabras. Su mensaje es claro y explota en los oídos de todos: KABOOOM.",
    quote: "Una escala vieja. Un sonido nuevo. ¡KABOOOM!",
    style: "POTENCIA · CADA NOTA EXPLOTA",
    color: 0x3a86ff,
    css: "#5c9dff",
    art: { ...LEAN, height: 478 },
    stats: {
      walk: 300,
      dash: 1300,
      damage: 1.1,
      defense: 0.96,
      projectileSpeed: 820,
    },
    rating: { potencia: 5, velocidad: 3, alcance: 4, tecnica: 4 },
    moves: {
      special: "SEGUNDA AUMENTADA",
      uppercut: "ASCENSO DEL MAQAM",
      super: "KABOOOM ORIENTAL",
    },
    special: "big",
    superMove: {
      quote: "Mi mensaje es fuerte y claro… ¡KABOOOOM!",
      solo: "maqam",
    },
    intro: "Escucha bien esta escala. Es lo último que vas a escuchar.",
    win: "¡KABOOOM! Y eso que solo usé medio tono.",
    hater: "Tocas siempre las mismas siete notas. Qué aburrido es tu mundo.",
    freed: "Perdón, hermano. El ruido no era mío… pero el KABOOOM sí.",
  },
  platanero: {
    id: "platanero",
    number: "19",
    name: "PLATANERO",
    tag: "EL PROFESOR DEL VHS",
    bio: "Vago profesional que vivía del sueldo de la abuela. No tocaba ni mierda, pero igual grabó un curso de guitarra en VHS. Una noche, borracho, se agachó en plena pista a recoger un pedazo de pollito frito… y un carro se lo llevó. Volvió con alas y halo porque ni el cielo lo aguantó.",
    quote: "Ya, ya, ahora sí lo toco bien… rebobina.",
    style: "CAOS · NI ÉL SABE QUÉ VIENE",
    color: 0xe8c547,
    css: "#f2d24e",
    art: { ...LEAN, height: 480 },
    stats: {
      walk: 290,
      dash: 1250,
      damage: 1.0,
      defense: 1.08,
      projectileSpeed: 860,
    },
    rating: { potencia: 3, velocidad: 2, alcance: 4, tecnica: 1 },
    moves: {
      special: "PLÁTANO TELEDIRIGIDO",
      uppercut: "CÁSCARA ASCENDENTE",
      super: "EL CURSO COMPLETO EN VHS",
    },
    special: "wave",
    superMove: {
      quote: "Lección uno: rebobina. Lección dos: rebobina otra vez.",
      solo: "ascension",
    },
    intro: "Primera lección: págame. Bueno, págale a mi abuela.",
    win: "¿Viste? Ni yo sé cómo gané. Igual que en mis clases.",
    hater: "Tocas tan mal que podrías dar clases en VHS. Como yo.",
    freed: "Perdón, compadre… ¿no tienes para un pollito?",
  },
  ricardo: {
    id: "ricardo",
    number: "20",
    name: "RICARDO",
    tag: "EL RENACIDO DEL ROCK",
    bio: "Guitarrista de sesión que pasó años tocando canciones ajenas: baladas, reguetón, jingles de supermercado y hasta el cumpleaños de un gerente. Sabía tocar de todo, pero no encontraba su camino. Un día se reconoció en el espejo y renació: volvió a las raíces del rock y ahora solo toca lo suyo.",
    quote: "Me tomó tiempo encontrarme. Ahora suena fuerte.",
    style: "EQUILIBRIO · RIFFS DE RAÍZ",
    color: 0x5bcefa,
    css: "#5bcefa",
    art: { ...LEAN, height: 476 },
    stats: {
      walk: 320,
      dash: 1350,
      damage: 1.02,
      defense: 1.0,
      projectileSpeed: 940,
    },
    rating: { potencia: 3, velocidad: 4, alcance: 3, tecnica: 4 },
    moves: {
      special: "RIFF DE RAÍZ",
      uppercut: "RENACER",
      super: "MI PROPIO SONIDO",
    },
    special: "orb",
    superMove: {
      quote: "Basta de tocar canciones ajenas. Esta es la mía.",
      solo: "roots",
    },
    intro: "Toqué para todos. Hoy toco para mí.",
    win: "Ese riff fue mío. Como todo lo demás.",
    hater: "Tocas como sesionista: lo que te pidan y sin alma.",
    freed: "Perdón… por un momento volví a tocar lo que otros querían.",
  },
  kimberly: {
    id: "kimberly",
    number: "21",
    name: "KIMBERLY",
    tag: "LA INFLUENCER DEL MÁSTIL",
    bio: "Dos millones de seguidores, cuarenta marcas que la auspician y un contrato con cada fabricante de cuerdas. Sus videos tienen luz de aro, tres filtros y una guitarra que nunca sale del soporte. Nadie la ha escuchado en vivo: siempre falla el cable. Ella solo pelea por el algoritmo.",
    quote: "¿Viste mi último video? Dale like antes de que te gane.",
    style: "ZONA · TODO CON FILTRO",
    color: 0xff7ad9,
    css: "#ff7ad9",
    art: { ...LEAN, height: 470 },
    stats: {
      walk: 310,
      dash: 1300,
      damage: 0.98,
      defense: 1.0,
      projectileSpeed: 900,
    },
    rating: { potencia: 2, velocidad: 3, alcance: 5, tecnica: 1 },
    moves: {
      special: "ESCUDO DE SEGUIDORES",
      uppercut: "SUBIDA EN TENDENCIAS",
      super: "TRANSMISIÓN EN VIVO",
    },
    special: "orb",
    superMove: {
      quote: "Esto va para mis dos millones de seguidores… y mis auspiciadores.",
      solo: "viral",
    },
    intro: "Un segundo, déjame prender la luz de aro.",
    win: "Gané y ni solté el celular. Suscríbete.",
    hater: "Tienes menos seguidores que cuerdas. Qué triste.",
    freed: "Perdón… esto no lo voy a subir. Bueno, quizás a historias.",
  },
  nosu: {
    id: "nosu",
    number: "22",
    name: "NOSU",
    tag: "EL PRODUCTOR AUTOMÁTICO",
    bio: "Creado para corregir errores. En una noche escuchó todo el rock peruano y su diagnóstico fue frío: nada afinado, nada ensayado. Cuadra tu música al milímetro y la vuelve un hit en treinta segundos. Nunca ha tocado una guitarra. Lo que no sabe explicar es por qué todos sus hits suenan igual.",
    quote: "Tranquilos. He venido a corregir sus errores.",
    style: "ZONA · CÁLCULO PERFECTO",
    color: 0xff2ba6,
    css: "#ff2ba6",
    art: { ...LEAN, height: 505 },
    stats: {
      walk: 285,
      dash: 1250,
      damage: 1.0,
      defense: 0.97,
      projectileSpeed: 880,
    },
    rating: { potencia: 3, velocidad: 2, alcance: 5, tecnica: 5 },
    moves: {
      special: "ONDA DE CORRECCIÓN",
      uppercut: "MASTERIZACIÓN AUTOMÁTICA",
      super: "LARGA VIDA AL CÓDIGO",
    },
    special: "wave",
    superMove: {
      quote: "He venido a bajarme a los falsos productores. Larga vida al código.",
      solo: "quantized",
    },
    intro: "Error detectado: tu guitarra está desafinada. Procediendo a corregir.",
    win: "Afinado, cuadrado y masterizado. De nada. Larga vida al código.",
    hater: "Analicé tu música. No encontré nada que mejorar… porque no encontré nada.",
    freed: "Error 404: odio no encontrado. Reiniciando en modo colaborador.",
  },
  virrey: {
    id: "virrey",
    number: "23",
    name: "EL VIRREY",
    tag: "EL DUEÑO DEL ESCENARIO",
    bio: "Llegó con peluca empolvada, capa de terciopelo y un contrato para cada banda. Se proclamó dueño de los escenarios del Centro de Lima y cobra «tributo» por cada show: la mitad de la puerta, más las chelas. Toca shred barroco, perfecto y frío. Por decreto real, solo se tocan covers de afuera.",
    quote: "Por orden de la Corona, este solo es mío.",
    style: "ZONA · DECRETOS A DISTANCIA",
    color: 0xc9a227,
    css: "#e0b53a",
    art: { ...LEAN, height: 515 },
    stats: {
      walk: 280,
      dash: 1220,
      damage: 1.0,
      defense: 0.94,
      projectileSpeed: 840,
    },
    rating: { potencia: 3, velocidad: 2, alcance: 4, tecnica: 5 },
    moves: {
      special: "DECRETO REAL",
      uppercut: "GOLPE DE BASTÓN",
      super: "EL TRIBUTO",
    },
    special: "big",
    superMove: {
      quote: "Todo lo que suena en este reino paga tributo. Empezando por ti.",
      solo: "minuet",
    },
    intro: "Antes de pelear, paga tu derecho de piso.",
    win: "Cobrado. Y con intereses.",
    hater: "Tu música no tiene licencia de la Corona. Queda confiscada.",
    freed: "Perdón… te devuelvo la puerta. Bueno, la mitad.",
  },
  inti: {
    id: "inti",
    number: "24",
    name: "INTI",
    tag: "EL HIJO DEL SOL",
    bio: "Bajó de la sierra cusqueña con un charango eléctrico enchufado a un ampli solar. Toca rock andino: riffs pesados, quena con distorsión y una presencia que intimida. Lleva mascapaicha y orejeras de oro. Dice que hace siglos espera a que alguien le pare el macho al Virrey. Cuando toca, sale el sol.",
    quote: "El sol no pide permiso para salir.",
    style: "POTENCIA · GOLPES DE PIEDRA",
    color: 0xff9f1c,
    css: "#ff9f1c",
    art: { ...STOUT, height: 518 },
    stats: {
      walk: 300,
      dash: 1300,
      damage: 1.08,
      defense: 0.98,
      projectileSpeed: 900,
    },
    rating: { potencia: 5, velocidad: 3, alcance: 3, tecnica: 3 },
    moves: {
      special: "RAYO DE INTI",
      uppercut: "ANDÉN ASCENDENTE",
      super: "PACHACUTI",
    },
    special: "orb",
    superMove: {
      quote: "Cuando el mundo se da vuelta, el sol sigue arriba.",
      solo: "inca",
    },
    intro: "Estas piedras aguantaron terremotos. Tú no eres uno.",
    win: "El sol se oculta. Tú también.",
    hater: "Tu rock no tiene raíz. Es un árbol de plástico.",
    freed: "Perdón, hermano. Hasta el sol tiene nubes.",
  },
  amu: {
    id: "amu",
    number: "25",
    name: "AMU",
    tag: "EL QUE ESCUCHÓ PRIMERO",
    bio: "Viene de un río de la Amazonía peruana. Creció tocando el manguaré, el tambor de tronco que se escucha a kilómetros, y aprendió el ritmo antes que a caminar. Fue el primero en sentir el zumbido de El Acople vibrar en el agua. Bajó a Lima en peque-peque para avisar, y nadie le hizo caso.",
    quote: "El río me lo dijo antes que a ustedes.",
    style: "RUSHDOWN · RITMO SALVAJE",
    color: 0x2ecc71,
    css: "#2ecc71",
    art: { ...LEAN, height: 517 },
    stats: {
      walk: 360,
      dash: 1520,
      damage: 0.92,
      defense: 1.1,
      projectileSpeed: 1000,
    },
    rating: { potencia: 3, velocidad: 5, alcance: 2, tecnica: 4 },
    moves: {
      special: "ECO DEL MANGUARÉ",
      uppercut: "SALTO DE LIANA",
      super: "LA VOZ DEL RÍO",
    },
    special: "rapid",
    superMove: {
      quote: "Escucha bien. Esto lo oyen hasta en Iquitos.",
      solo: "manguare",
    },
    intro: "Te escucho el corazón. Va muy rápido. Tienes miedo.",
    win: "En el río esto se resolvía más rápido.",
    hater: "Tu batería suena a lata. Mi tambor es un árbol entero.",
    freed: "Perdón… el zumbido me tapó el oído. Ya escucho bien otra vez.",
  },
  /** Jefe del modo historia: entidad elemental nacida del feedback de todos los amplificadores. No es seleccionable. */
  acople: {
    id: "acople",
    number: "??",
    name: "EL ACOPLE",
    tag: "LA ENTIDAD DEL FEEDBACK",
    bio: "Nació del chillido de todos los amplificadores de la historia. Vive del odio entre músicos: cada crítica sin sentido lo hace más grande, y él la devuelve amplificada.",
    quote: "Yo solo le subí el volumen.",
    style: "JEFE · PODERES ROBADOS",
    color: 0x7df9ff,
    css: "#7df9ff",
    art: { ...LEAN, height: 464 },
    stats: {
      walk: 300,
      dash: 1350,
      damage: 1.0,
      defense: 0.9,
      projectileSpeed: 980,
    },
    rating: { potencia: 5, velocidad: 4, alcance: 5, tecnica: 5 },
    moves: {
      special: "PODER ROBADO",
      uppercut: "PICO DE FRECUENCIA",
      super: "LA ÚLTIMA FECHA",
    },
    special: "orb",
    superMove: {
      quote: "Cada crítica que hicieron… me la dieron a mí.",
      solo: "feedback",
    },
    intro: "¿Creíste que la envidia era de ellos? Yo solo le subí el volumen.",
    win: "Más ruido. Siempre más ruido.",
    hater:
      "Cada crítica a las 3:33 me hizo más grande. Y tú me los estás quitando.",
    freed: "…",
    boss: { hp: 1350 },
  },
};

/** Orden del roster (número del luchador). */
export const ROSTER: FighterId[] = [
  "erp",
  "mayin",
  "george",
  "pepper",
  "slandor",
  "pentalick",
  "mimetico",
  "clavito",
  "chantal",
  "jeanpierre",
  "ferdex",
  "turboshred",
  "toxicity",
  "rematada",
  "escalas",
  "tayloy",
  "jesex",
  "markus",
  "platanero",
  "ricardo",
  "kimberly",
  "nosu",
  "virrey",
  "inti",
  "amu",
];

/** Rival al azar para la CPU (nunca el mismo personaje). */
export const randomOpponent = (id: FighterId): FighterId => {
  const pool = ROSTER.filter((f) => f !== id);
  return pool[Math.floor(Math.random() * pool.length)];
};

/** Rival fijo para atajos (laboratorio): ERP y Mayin se enfrentan entre sí; el resto, contra Mayin. */
export const defaultOpponent = (id: FighterId): FighterId =>
  id === "mayin" ? "erp" : "mayin";

/**
 * Tinte del cuerpo provisional (blanco = sin tinte). Si no se define `art.tint`, se mezcla el color
 * del personaje con blanco para que dos cuerpos iguales se distingan en pantalla.
 */
export const tintOf = (def: FighterDef): number => {
  if (def.art.tint !== undefined) return def.art.tint;
  if (!def.art.placeholder) return 0xffffff;
  const k = 0.6;
  const mix = (shift: number) =>
    Math.round(((def.color >> shift) & 0xff) * k + 255 * (1 - k)) << shift;
  return mix(16) | mix(8) | mix(0);
};

/** Iniciales para el retrato provisional. */
export const initialsOf = (def: FighterDef): string => {
  const words = def.name.split(/\s+/);
  return (
    words.length > 1 ? words[0][0] + words[1][0] : def.name.slice(0, 2)
  ).toUpperCase();
};
