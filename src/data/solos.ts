import { comboScale } from './moves';

/** Solo del súper de cada luchador (FighterDef.superMove.solo). */
export type SoloStyle =
  | 'shred' | 'blues' | 'fusion' | 'sub' | 'three' | 'lickA' | 'lickB'
  | 'dembow' | 'andean' | 'musette' | 'latin' | 'sweep' | 'tritone' | 'sixth' | 'treatise' | 'jade' | 'jetset' | 'maqam' | 'ascension' | 'roots' | 'viral'
  /** El Acople: arpegios disminuidos. */
  | 'feedback';

/** Descripción corta de cada solo (laboratorio). */
export const SOLO_LABEL: Record<SoloStyle, string> = {
  shred: 'Shred en Mi menor armónica',
  blues: 'Blues en La de cinco cuerdas',
  fusion: 'Fraseo de jazz fusión',
  sub: 'Notas súper graves',
  three: 'Tres notas y ya',
  lickA: 'Lick de metal con nota pedal',
  lickB: 'Otro lick de metal (galope)',
  dembow: 'Reggaetón: sinte sobre dembow',
  andean: 'Huayno andino',
  musette: 'Vals musette francés',
  latin: 'Montuno de latin jazz con clave',
  sweep: 'Barridos técnicos de arpeggios',
  tritone: 'Tritonos satánicos y metal',
  sixth: 'Blues con la sexta cuerda (la que Mayin nunca usó)',
  treatise: 'Preludio barroco de manual, nota por nota',
  jade: 'Shred pentatónico milenario del clan de la Púa de Jade',
  roots: 'Riff de rock and roll de raíz, en La, con dobles cuerdas',
  viral: 'Melodía pop pegajosa de 15 segundos, perfecta para reels',
  jetset: 'Rock de estadio con bends de millonario',
  maqam: 'Maqam Hiyaz con segunda aumentada y remate explosivo',
  ascension: 'Lección de VHS: melodía lenta… que nunca termina de afinar',
  feedback: 'Arpegios de séptima disminuida en Mi',
};

/** Timbre del "amplificador" sintetizado (systems/Licks.ts). */
export type SoloTone = 'heavy' | 'chug' | 'smooth' | 'warm' | 'clean' | 'sub' | 'synth';

export interface SoloNote {
  /** Momento (ms desde que empieza el solo). */
  t: number;
  /** Nota MIDI (69 = La 440). */
  midi: number;
  /** Notas extra que suenan a la vez (intervalos en semitonos sobre `midi`). */
  chord?: number[];
  /** Duración (ms). */
  len: number;
  /** Esta nota sale disparada y golpea al rival. */
  hit?: boolean;
  /** Último golpe: tumba. */
  final?: boolean;
  /** Entra deslizando desde un tono abajo / sube un tono al final. */
  slide?: boolean;
  bend?: boolean;
}

/** Percusión sintetizada que acompaña algunos solos. */
export interface SoloDrum {
  t: number;
  kind: 'kick' | 'snare' | 'clave';
}

export interface SoloDef {
  style: SoloStyle;
  /** Duración total de la actuación (ms reales). */
  duration: number;
  notes: SoloNote[];
  drums?: SoloDrum[];
  /** Daño de cada nota que golpea (antes de escalado de combo y defensas). Se calcula para que el total sea parejo. */
  damage: number;
  tone: SoloTone;
  /** Forma de onda del sintetizador (sierra = guitarra saturada). */
  wave: OscillatorType;
  /** Vibrato en todas las notas (fuelle de acordeón), como fracción de la frecuencia. */
  vibrato?: number;
  /** Guitarra provisional dibujada por código: eléctrica puntiaguda o caja hueca. */
  guitar: 'pointy' | 'hollow';
  strings: number;
  /** Velocidad de las notas que golpean (px/s) y su ondulación (px). */
  speed: number;
  wobble: number;
}

/** Daño total aproximado de cualquier súper antes de los multiplicadores del luchador. */
const SUPER_TOTAL = 330;

/**
 * Notación compacta: [nota | acorde | null (silencio), duración en ms, marcas].
 * Marcas: h = golpea, f = último golpe (tumba), s = slide, b = bend, l = ligado (suena toda la duración).
 */
type Item = [number | number[] | null, number, string?];

const phrase = (items: Item[], start = 0): SoloNote[] => {
  const notes: SoloNote[] = [];
  let t = start;
  for (const [n, dur, flags = ''] of items) {
    if (n !== null) {
      const [midi, ...rest] = Array.isArray(n) ? n : [n];
      notes.push({
        t,
        midi,
        chord: rest.length ? rest.map((m) => m - midi) : undefined,
        len: flags.includes('l') || flags.includes('f') ? Math.max(dur, 160) : dur * 0.9,
        hit: flags.includes('h') || flags.includes('f'),
        final: flags.includes('f'),
        slide: flags.includes('s'),
        bend: flags.includes('b'),
      });
    }
    t += dur;
  }
  return notes;
};

/** Marca como golpe cada `n` notas y la última como remate (para escalas largas). */
const hitsEvery = (notes: SoloNote[], n: number): SoloNote[] => {
  notes.forEach((note, i) => (note.hit = i % n === n - 1));
  Object.assign(notes[notes.length - 1], { hit: true, final: true });
  return notes;
};

type Base = Omit<SoloDef, 'duration' | 'damage' | 'notes'>;

/** Arma el solo: duración según la última nota y daño por nota según cuántas golpean. */
const solo = (base: Base, notes: SoloNote[]): SoloDef => {
  const last = notes.reduce((m, n) => Math.max(m, n.t + n.len), 0);
  const hits = notes.filter((n) => n.hit).length;
  let scale = 0;
  for (let k = 1; k <= hits; k++) scale += comboScale(k);
  return { ...base, notes, duration: last + 150, damage: Math.round(SUPER_TOTAL / Math.max(scale, 1)) };
};

const ELECTRIC = { guitar: 'pointy', strings: 6, wave: 'sawtooth' } as const;

// ─────────────────────────────── Melodías ───────────────────────────────

/** ERP PROJECT: barrido en Mi menor armónica, dos octavas arriba y abajo. */
const shred = (): SoloNote[] => {
  const scale = [64, 66, 67, 69, 71, 72, 75];
  const up: number[] = [];
  for (let o = 0; o < 2; o++) for (const n of scale) up.push(n + o * 12);
  up.push(88);
  const run = [...up, ...up.slice(0, -1).reverse(), ...up.slice(4, 12)];
  const notes = hitsEvery(run.map((midi, i) => ({ t: i * 52, midi, len: 70 })), 4);
  notes.push({ t: run.length * 52 + 40, midi: 76, len: 520 });
  return notes;
};

/** MAYINBLUES: lick de blues en La con slides y bends sobre la quinta cuerda al aire. */
const blues = (): SoloNote[] => [
  { t: 0, midi: 45, len: 900 },
  { t: 240, midi: 69, len: 260, slide: true },
  { t: 480, midi: 72, len: 300, hit: true, bend: true },
  { t: 760, midi: 69, len: 220 },
  { t: 940, midi: 67, len: 320, hit: true },
  { t: 1240, midi: 64, len: 260, slide: true },
  { t: 1460, midi: 67, len: 260, hit: true },
  { t: 1700, midi: 69, len: 360, bend: true },
  { t: 1980, midi: 76, len: 300, hit: true, slide: true },
  { t: 2200, midi: 81, len: 700, hit: true, final: true, bend: true },
];

/** GEORGE: fraseo de jazz fusión en Re dórico, con cromatismos ligados y una nota final "bien afinada". */
const fusion = (): SoloNote[] => phrase([
  [62, 90], [64, 90], [65, 90, 'h'], [67, 90], [69, 90], [72, 90, 'h'], [71, 90], [69, 90],
  [68, 90, 'h'], [67, 90], [65, 90], [64, 90, 'h'], [62, 90], [61, 90], [62, 180, 'hl'], [null, 90],
  [74, 75], [73, 75], [72, 75, 'h'], [70, 75], [69, 75], [67, 75, 'h'], [66, 75], [65, 75],
  [64, 150, 'h'], [69, 120], [76, 140, 'hs'], [74, 700, 'fb'],
]);

/** PEPPER: notas súper graves, lentas y con todo el peso del sub. */
const sub = (): SoloNote[] => phrase([
  [28, 320, 'hl'], [28, 160], [31, 320, 'hl'], [28, 160], [26, 320, 'hl'], [24, 480, 'hls'],
  [23, 160], [24, 160], [[28, 35], 800, 'f'],
]);

/** SLANDOR: tres notas y ya. Para qué más. */
const three = (): SoloNote[] => phrase([
  [[64, 71], 480, 'hl'], [[67, 74], 480, 'hl'], [[76, 83], 900, 'fb'],
]);

/** PENTALICK: lick de metal con nota pedal en Mi (el de siempre, el que funciona). */
const lickA = (): SoloNote[] => {
  const cell = [64, 72, 64, 71, 64, 69, 64, 67];
  const items: Item[] = [...cell, ...cell].map((m, i): Item => [m, 72, i % 4 === 3 ? 'h' : '']);
  items.push([[64, 71], 140, 'h'], [76, 700, 'fb']);
  return phrase(items);
};

/** MIMÉTICO: otro lick de metal: galope en La y subida a la octava (influencia, no copia). */
const lickB = (): SoloNote[] => {
  const items: Item[] = [];
  for (const root of [45, 45, 48, 50]) items.push([[root, root + 7], 150, 'h'], [root, 75], [root, 75]);
  [69, 72, 74, 75, 76, 79, 81].forEach((m, i) => items.push([m, 70, i === 3 ? 'h' : '']));
  items.push([[81, 88], 700, 'fb']);
  return phrase(items);
};

/** CLAVITO: "metal urbano": melodía de sinte sobre ritmo dembow. */
const dembow = (): SoloNote[] => phrase([
  [76, 300, 'h'], [74, 150], [72, 300], [74, 150, 'h'], [72, 300], [69, 300, 'h'], [null, 150],
  [67, 150], [69, 300, 'h'], [72, 150], [74, 300, 'h'], [76, 150], [79, 600, 'fs'],
]);
const dembowDrums = (until: number): SoloDrum[] => {
  const drums: SoloDrum[] = [];
  for (let t = 0; t < until; t += 1200) {
    drums.push({ t, kind: 'kick' }, { t: t + 450, kind: 'snare' }, { t: t + 600, kind: 'kick' }, { t: t + 900, kind: 'snare' });
  }
  return drums;
};

/** CHANTAL: melodía andina en pentatónica con ritmo de huayno (largo-corto). */
const andean = (): SoloNote[] => {
  const melody = [64, 67, 69, 71, 69, 67, 64, 62, 64, 67, 71, 74, 71, 69, 67, 69, 64, 76];
  const notes: SoloNote[] = [];
  let t = 0;
  melody.forEach((midi, i) => {
    notes.push({ t, midi, len: i % 2 ? 110 : 200, hit: i % 3 === 2, slide: i % 4 === 0 });
    t += i % 2 ? 100 : 190;
  });
  Object.assign(notes[notes.length - 1], { len: 600, hit: true, final: true });
  return notes;
};

/** JEAN-PIERRE: vals musette a la francesa (largo-corto, con fuelle de acordeón). */
const musette = (): SoloNote[] => phrase([
  [76, 440, 'h'], [75, 220], [76, 440, 'h'], [79, 220], [77, 440, 'h'], [76, 220],
  [74, 440, 'h'], [72, 220], [71, 440, 'h'], [69, 220], [68, 220, 'h'], [69, 220], [72, 220],
  [[76, 81], 800, 'f'],
]);

/** FERDEX: montuno de latin jazz en Do menor sobre clave 3-2, y acorde final menor séptima. */
const LATIN_STEP = 125;
const latin = (): SoloNote[] => {
  const hitsAt = new Set([0, 5, 8, 13]);
  const positions = [0, 2, 3, 5, 6, 8, 10, 11, 13, 14];
  const pitches = [72, 79, 75, 79, 74, 79, 77, 79, 75, 74];
  const notes: SoloNote[] = [];
  for (let bar = 0; bar < 2; bar++) {
    positions.forEach((p, i) => {
      notes.push({ t: (bar * 16 + p) * LATIN_STEP, midi: pitches[i] - bar * 2, len: LATIN_STEP * 0.9, hit: hitsAt.has(p) });
    });
  }
  notes.push({ t: 32 * LATIN_STEP, midi: 60, chord: [3, 7, 10, 14], len: 800, hit: true, final: true });
  return notes;
};
const claveDrums = (): SoloDrum[] => {
  const drums: SoloDrum[] = [];
  for (let bar = 0; bar < 2; bar++) for (const p of [0, 3, 6, 10, 12]) drums.push({ t: (bar * 16 + p) * LATIN_STEP, kind: 'clave' });
  return drums;
};

/** TURBOSHRED: barridos técnicos de arpegios a velocidad absurda (La m, Fa, Do, Sol, Mi). */
const sweep = (): SoloNote[] => {
  const chords = [
    [57, 60, 64, 69, 72, 76, 81], [53, 57, 60, 65, 69, 72, 77], [48, 52, 55, 60, 64, 67, 72],
    [55, 59, 62, 67, 71, 74, 79], [52, 56, 59, 64, 68, 71, 76],
  ];
  const run: number[] = [];
  for (const c of chords) run.push(...c, ...c.slice(1, -1).reverse());
  const notes = hitsEvery(run.map((midi, i) => ({ t: i * 42, midi, len: 60 })), 6);
  notes.push({ t: run.length * 42 + 40, midi: 81, len: 600, bend: true });
  return notes;
};

/** TOXICITY: tritonos ("el intervalo del diablo") bajando como órgano maldito, y luego metal. */
const tritone = (): SoloNote[] => phrase([
  [[52, 58], 480, 'hl'], [[51, 57], 480, 'hl'], [[50, 56], 480, 'hl'], [[49, 55], 480, 'hl'],
  [40, 90], [41, 90], [46, 90, 'h'], [40, 90], [41, 90], [46, 90], [52, 90, 'h'], [58, 90], [64, 90], [70, 90, 'h'],
  [[76, 82], 800, 'fb'],
]);

/** LA REMATADA: el blues de Mayin, pero con la sexta cuerda que él nunca quiso usar (Mi grave al aire). */
const sixth = (): SoloNote[] => phrase([
  [40, 360, 'hl'], [40, 180], [43, 180, 'h'], [45, 180], [46, 180, 's'], [47, 360, 'hl'],
  [64, 160, 's'], [67, 160], [69, 220, 'hb'], [67, 160], [64, 160, 'h'], [62, 160], [64, 260, 'hs'],
  [[40, 47, 52], 220, 'h'], [[40, 47, 52], 220, 'h'], [[40, 47, 52, 56], 900, 'fb'],
]);

/** DOCTOR ESCALAS: preludio barroco de libro (arpegios tipo Bach), cada compás una lección. */
const treatise = (): SoloNote[] => {
  const bars = [
    [48, 52, 55, 60, 64, 55, 60, 64], [48, 50, 57, 62, 65, 57, 62, 65],
    [47, 50, 55, 62, 65, 55, 62, 65], [48, 52, 55, 60, 64, 55, 60, 64],
    [45, 52, 57, 64, 69, 57, 64, 69],
  ];
  const notes = hitsEvery(bars.flat().map((midi, i) => ({ t: i * 92, midi, len: 120 })), 5);
  notes.push({ t: bars.flat().length * 92 + 60, midi: 48, chord: [7, 12, 16, 19], len: 800 });
  return notes;
};

/** TAYLOY: pentatónica china (modo gong) a velocidad de clan, subiendo y bajando dos octavas. */
const jade = (): SoloNote[] => {
  const scale = [62, 64, 66, 69, 71];
  const up: number[] = [];
  for (let o = 0; o < 3; o++) for (const n of scale) up.push(n + o * 12);
  const run = [...up, ...up.slice(0, -1).reverse(), ...up.slice(5)];
  const notes = hitsEvery(run.map((midi, i) => ({ t: i * 46, midi, len: 64 })), 5);
  notes.push({ t: run.length * 46 + 40, midi: 86, len: 620, bend: true });
  return notes;
};

/** JESEX: rock de estadio sin apuro, con bends largos y un acorde final que paga él. */
const jetset = (): SoloNote[] => phrase([
  [[52, 59, 64], 260, 'h'], [[55, 62, 67], 260], [[57, 64, 69], 360, 'h'],
  [69, 180, 'b'], [72, 180], [74, 240, 'hb'], [76, 180], [74, 180, 's'], [72, 240, 'h'],
  [79, 420, 'hbl'], [76, 180], [74, 180], [72, 180, 'h'], [69, 300, 's'],
  [[52, 59, 64, 68], 900, 'fb'],
]);

/** MARKUS: maqam Hiyaz en Mi (Mi Fa Sol# La Si Do Re) con adornos, y un acorde grave que revienta. */
const maqam = (): SoloNote[] => phrase([
  [64, 220, 'h'], [65, 110, 's'], [68, 330, 'l'], [69, 160], [68, 160], [65, 160, 'h'], [64, 400, 'bl'],
  [71, 140], [72, 140, 's'], [74, 140], [72, 140, 'h'], [71, 140], [69, 140], [68, 140, 's'], [65, 140, 'h'], [64, 300, 'b'],
  [76, 110], [77, 110, 's'], [80, 110], [81, 110, 'h'], [80, 110], [77, 110], [76, 260, 'hb'],
  [null, 160], [[40, 47, 52, 56], 1000, 'f'],
]);

/** EL PLATANERO: melodía lenta y luminosa en Re mayor que sube de a poco, con notas largas y ligadas. */
const ascension = (): SoloNote[] => phrase([
  [[50, 57, 62, 66], 420, 'hl'], [69, 280, 's'], [71, 280], [74, 420, 'hl'],
  [[55, 62, 67, 71], 420, 'hl'], [76, 280, 's'], [78, 280], [81, 420, 'hbl'],
  [[57, 64, 69, 73], 360, 'hl'], [83, 240], [85, 240, 's'], [86, 480, 'hbl'],
  [[50, 57, 62, 66, 69, 74], 1100, 'f'],
]);

/** RICARDO: rock and roll de raíz en La, con dobles cuerdas y un remate abierto (su propio sonido). */
const roots = (): SoloNote[] => phrase([
  [[57, 64], 180, 'h'], [[57, 66], 180], [[57, 64], 180, 'h'], [[57, 66], 180], [[57, 67], 180, 'h'], [[57, 66], 180],
  [69, 140], [72, 140, 's'], [74, 140], [72, 140, 'h'], [69, 280, 'b'],
  [[62, 69], 180, 'h'], [[62, 71], 180], [[62, 69], 180, 'h'], [[62, 71], 180],
  [76, 140], [79, 140, 'h'], [81, 280, 'hb'], [79, 140], [76, 140], [74, 280, 'h'],
  [[45, 52, 57, 61, 64], 900, 'f'],
]);

/** KIMBERLY: melodía pop pegajosa en Mi mayor, corta y repetida, pensada para un reel. */
const viral = (): SoloNote[] => phrase([
  [76, 180, 'h'], [76, 180], [80, 180], [83, 360, 'hl'], [81, 180], [80, 180, 'h'], [78, 360, 'l'],
  [76, 180, 'h'], [76, 180], [80, 180], [83, 360, 'hl'], [85, 180, 'h'], [83, 180], [80, 360, 's'],
  [[64, 68, 71, 76], 800, 'f'],
]);

/** EL ACOPLE: barridos fluidos de Mi disminuido a semicorcheas (~234 BPM).
 * Mantiene 41 notas y 11 impactos; el remate deja respirar el acorde. */
export const ACOPLE_NOTE_MS = 64;
const diminished = (): SoloNote[] => {
  const arpeggio = [52, 55, 58, 61, 64, 67, 70, 73, 76, 73, 70, 67, 64, 61, 58, 55];
  const notes: SoloNote[] = Array.from({ length: 40 }, (_, i) => ({
    t: i * ACOPLE_NOTE_MS,
    midi: arpeggio[i % arpeggio.length],
    len: 80,
  }));
  notes.push({ t: 40 * ACOPLE_NOTE_MS, midi: 40, chord: [3, 6, 9, 12], len: 700 });
  return hitsEvery(notes, 4);
};

export const SOLOS: Record<SoloStyle, SoloDef> = {
  shred: solo({ style: 'shred', tone: 'heavy', ...ELECTRIC, speed: 1500, wobble: 30 }, shred()),
  blues: solo({ style: 'blues', tone: 'warm', wave: 'sawtooth', guitar: 'hollow', strings: 5, speed: 820, wobble: 70 }, blues()),
  fusion: solo({ style: 'fusion', tone: 'smooth', ...ELECTRIC, speed: 1250, wobble: 45 }, fusion()),
  sub: solo({ style: 'sub', tone: 'sub', ...ELECTRIC, strings: 4, speed: 760, wobble: 15 }, sub()),
  three: solo({ style: 'three', tone: 'heavy', ...ELECTRIC, speed: 900, wobble: 25 }, three()),
  lickA: solo({ style: 'lickA', tone: 'chug', ...ELECTRIC, speed: 1250, wobble: 20 }, lickA()),
  lickB: solo({ style: 'lickB', tone: 'chug', ...ELECTRIC, speed: 1200, wobble: 25 }, lickB()),
  dembow: { ...solo({ style: 'dembow', tone: 'synth', ...ELECTRIC, wave: 'square', speed: 1000, wobble: 55 }, dembow()), drums: dembowDrums(3400) },
  andean: solo({ style: 'andean', tone: 'clean', wave: 'triangle', guitar: 'hollow', strings: 6, speed: 950, wobble: 50 }, andean()),
  musette: solo({ style: 'musette', tone: 'clean', wave: 'square', vibrato: 0.009, guitar: 'hollow', strings: 6, speed: 900, wobble: 60 }, musette()),
  latin: { ...solo({ style: 'latin', tone: 'clean', wave: 'triangle', guitar: 'hollow', strings: 6, speed: 1050, wobble: 40 }, latin()), drums: claveDrums() },
  sweep: solo({ style: 'sweep', tone: 'heavy', ...ELECTRIC, speed: 1500, wobble: 35 }, sweep()),
  tritone: solo({ style: 'tritone', tone: 'heavy', ...ELECTRIC, speed: 1000, wobble: 40 }, tritone()),
  sixth: solo({ style: 'sixth', tone: 'warm', wave: 'sawtooth', guitar: 'hollow', strings: 6, speed: 880, wobble: 65 }, sixth()),
  treatise: solo({ style: 'treatise', tone: 'clean', wave: 'triangle', guitar: 'hollow', strings: 6, speed: 900, wobble: 25 }, treatise()),
  jade: solo({ style: 'jade', tone: 'heavy', ...ELECTRIC, speed: 1450, wobble: 45 }, jade()),
  jetset: solo({ style: 'jetset', tone: 'warm', ...ELECTRIC, speed: 1000, wobble: 50 }, jetset()),
  maqam: solo({ style: 'maqam', tone: 'warm', wave: 'sawtooth', guitar: 'hollow', strings: 6, speed: 950, wobble: 60 }, maqam()),
  ascension: solo({ style: 'ascension', tone: 'smooth', wave: 'triangle', guitar: 'pointy', strings: 6, speed: 780, wobble: 70 }, ascension()),
  roots: solo({ style: 'roots', tone: 'heavy', ...ELECTRIC, speed: 1100, wobble: 40 }, roots()),
  viral: solo({ style: 'viral', tone: 'clean', wave: 'triangle', guitar: 'pointy', strings: 6, speed: 950, wobble: 50 }, viral()),
  feedback: solo({ style: 'feedback', tone: 'heavy', vibrato: 0, ...ELECTRIC, speed: 1250, wobble: 60 }, diminished()),
};
