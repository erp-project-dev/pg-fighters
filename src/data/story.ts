import type { FighterId } from "./fighters";

/**
 * Modo historia "EL ACOPLE": la escena del rock peruano se volvió hater de la noche a la mañana.
 * Encaras a tus amigos uno por uno; cada victoria libera a uno y te da una pista sobre la entidad.
 * Todo el texto del modo vive aquí. `{name}` se reemplaza por el nombre del luchador elegido.
 */

/** Prólogo: un panel por línea. */
export const PROLOGUE: string[] = [
  "Lima. La escena del rock peruano siempre fue una familia: ruidosa, disfuncional… pero familia.",
  "Hasta que una noche, sin aviso, todos empezaron a odiarse.",
  "Comentarios a las 3:33 de la madrugada. Críticas sin sentido. Envidia pura. Amigos de toda la vida convertidos en haters.",
  "{name} no entiende qué está pasando. Pero sabe una cosa: hay que encararlos. Uno por uno.",
];

/** Amigos que encaras antes del jefe: elegidos al azar, sin repetir, al empezar la partida. */
export const STORY_RIVALS = 12;

/** Pistas sobre la entidad, en orden de avance (la n-ésima victoria da la pista n). Una por rival. */
export const CLUES: string[] = [
  "Todo empezó la misma noche. Todos estábamos ensayando con los amplis prendidos.",
  "Antes de mi primer comentario de odio escuché un zumbido agudo. Como un acople.",
  "Todos los comentarios salieron a las 3:33 de la madrugada. Dicen que en la selva, a esa misma hora, el agua del río empezó a vibrar.",
  "Mientras más criticábamos, más fuerte sonaba el zumbido. Como si se alimentara.",
  "La envidia no era nuestra. Era como si alguien la subiera de volumen dentro de la cabeza.",
  "Hasta los instrumentos lo sintieron. Una guitarra vendida al peso en Marketplace despertó esa misma noche… odiando.",
  "Esa misma noche se cortaron todas las transmisiones en vivo a la vez. En todas quedó el mismo pitido.",
  "El zumbido no viene de un ampli. Viene de todos los amplis a la vez.",
  "En un foro viejo hablan de una entidad que nace del feedback y vive del odio. La llaman El Acople.",
  "Cada amigo que liberas lo debilita. Ya se dio cuenta. Está nervioso.",
  "El viejo depósito de equipos de sonido. Nadie lo usa hace años… pero tiene luz.",
  "Está ahí, dentro del ampli más grande. Te está esperando.",
];

export interface StoryLine {
  /** `boss` = El Acople, `player` = el luchador elegido. */
  speaker: "boss" | "player" | "narrator";
  text: string;
}

/** Revelación antes de la pelea final. */
export const REVEAL: StoryLine[] = [
  {
    speaker: "narrator",
    text: "El viejo depósito. Cientos de amplificadores encendidos, sin nadie que los toque. Un zumbido agudo sube desde el centro.",
  },
  {
    speaker: "boss",
    text: "¿Creíste que la envidia era de ellos? Yo solo le subí el volumen.",
  },
  {
    speaker: "boss",
    text: "Cada crítica a las 3:33 me hizo más grande. Y tú me los estás quitando.",
  },
  { speaker: "player", text: "{quote}" },
];

/** Final común al vencer a El Acople. */
export const FINALE: string[] = [
  "El chillido se apaga.",
  "Por toda Lima, los amplis se quedan en silencio… y luego vuelven a sonar. Esta vez, juntos.",
];

/** Epílogo de cada luchador elegible. */
export const EPILOGUES: Partial<Record<FighterId, string>> = {
  erp: "ERP Project vuelve a su cuarto, cierra el editor de código y graba un solo de pocas notas, todas con lenguaje. Los que lo odiaban lo escuchan a escondidas. Siguen sin pensar como él. Igual le dan like.",
  mayin:
    "MayinBlues vuelve a su barrio y toca un blues en la esquina, frente a todos sus amigos. Alguien le ofrece una sexta cuerda. La rechaza con dignidad y se queda para la pollada.",
  george:
    "George reúne a la escena para un ensayo general, con himno incluido. Por primera vez en años, todo suena afinado. Igual le dice a alguien «cuidado ese bend». Pero lo dice con cariño, y con la gorra puesta.",
  pepper:
    "Pepper graba un disco en vivo con todos los liberados. Lo mezcla durante seis meses. Dice que todavía le falta producción.",
  slandor:
    "Slandor salvó la escena por mérito propio. Llama a papá para contarle. Papá ya lo sabía: había comprado los derechos de transmisión.",
  pentalick:
    "Pentalick celebra con un concierto épico. En el bis, por un instante, casi toca un sexto lick. Nadie está seguro. Él lo niega.",
  mimetico:
    "Mimético organiza un festival de la reconciliación. El afiche es igualito al de otro festival. Él dice que es influencia.",
  clavito:
    'Clavito le pone nombre a su género: "acople-tón". La escena entera lo odia… con cariño, esta vez.',
  chantal:
    'Chantal vuelve al bar y sirve una ronda para todos. En la cuenta, al final, dice: "plato de licks, cortesía de la casa".',
  jeanpierre:
    "Jean-Pierre vuelve a Europa con una historia nueva para contar. Allá nadie le cree. Pero aplauden igual, por educación.",
  ferdex:
    "Ferdex da un discurso de tres horas sobre la unidad de la escena. Al final, todos juran haber visto a Curcuman en la última fila.",
  turboshred:
    "Turboshred toca el solo de la victoria tan rápido que termina antes de empezar. El público lo aplaude por adelantado, por si acaso.",
  rematada:
    "La Rematada salvó la escena, pero no olvida. MayinBlues le ofrece cuerdas nuevas como disculpa: cinco. Ella las acepta… y sigue planeando su destierro. Con paciencia. Como un buen blues.",
  escalas:
    "Doctor Escalas escribe su cuarto libro: «El Acople: anatomía de un feedback». Es su primer bestseller sin secretos de guitarra. Igual trae un capítulo de escalas, por si acaso.",
  tayloy:
    "TayLoy vuelve con el clan con la verdad entera: el último falso profeta era un ampli con resentimiento. Los maestros de la Púa de Jade lo nombran guardián del honor. Él solo pide un metrónomo más rápido.",
  jesex:
    "Jesex celebra comprando el viejo depósito de equipos de sonido. Ahora es la sede número cuarenta de la Escuela del Rock. La matrícula es gratis. El acople, dicen, toca en la banda de los viernes.",
  markus:
    "Markus enseña sus escalas orientales a toda la escena. Por primera vez, todos tocan algo distinto a la pentatónica. El primer ensayo termina en un acorde tan fuerte que se escucha en toda Lima: KABOOOM.",
  kimberly:
    "Kimberly sube un video de la pelea final: once millones de vistas. En los comentarios todos preguntan lo mismo: «¿Pero tocó?». Ella responde con un código de descuento.",
  nosu:
    "NOSU produce el disco de reconciliación de toda la escena. Lo afina, lo cuadra y lo masteriza en treinta segundos. Es perfecto. Nadie lo escucha dos veces. Por primera vez, NOSU anota un error que no sabe corregir.",
  ricardo:
    "Ricardo graba su primer disco con su nombre en la portada. Es rock de raíz, crudo y honesto. En los créditos de cada canción dice lo mismo: Ricardo.",
  platanero:
    "Platanero relanza su curso en VHS como «edición de coleccionista». Vende tres copias: dos se las compra la abuela. Su legado queda en VHS, por si te quieres reír de lo mal que enseñaba.",
  virrey:
    "El Virrey devuelve la puerta de todos los shows. Toda, no la mitad. Después se encierra en su casona a componer su primera canción propia. Le cobra tributo a su propia inspiración. Ella no paga.",
  inti:
    "Inti toca al amanecer en lo alto de la ciudadela, frente a toda la escena. El sol sale justo en el último acorde. Él jura que no lo ensayó. Nadie le cree, y a nadie le importa.",
  amu:
    "Amu vuelve al río con la escena entera en un peque-peque que se hunde un poco. Esa noche, el manguaré suena en la orilla y toda Lima lo escucha. Por fin le hacen caso.",
  toxicity:
    "Por primera vez una banda le pide a Toxicity que se quede. Dura tres ensayos. Es su récord. Lo celebra rezando, con rabia.",
};

/** Los escenarios rotan en este orden durante la historia (se repiten si hace falta). El jefe pelea en `ampli`. */
export const STORY_STAGE_ROTATION = [
  "barrio",
  "metro",
  "bar",
  "tienda",
  "festival",
  "azotea",
  "tomate",
  "biblioteca",
  "chino",
  "mall",
  "arenal",
  "casona",
  "ciudadela",
  "rio",
  "laboratorio",
] as const;
export const BOSS_STAGE = "ampli" as const;
