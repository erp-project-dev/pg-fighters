import { ULTIMATE_BODY_IDS } from './UltimateBodies';
import Phaser from 'phaser';
import { FIGHTERS, type FighterDef } from '../../data/fighters';
import { poseScale } from '../../systems/AnimeAtlas';

/** Visual-only asset catalog. Extra is ready for the gameplay owner's roster entry. */
export const ROSTER_ART_IDS = [
  'george', 'pepper', 'slandor', 'pentalick', 'mimetico', 'clavito',
  'chantal', 'jeanpierre', 'ferdex', 'turboshred', 'toxicity', 'rematada', 'acople',
  'markus', 'jesex', 'escalas', 'tayloy', 'platanero', 'kimberly', 'ricardo',
] as const;

/** Recorte cuadrado [x, y, lado] de la cara en el portrait de 512 px; por defecto [100, 0, 340]. */
const FACE_CROPS: Partial<Record<string, [number, number, number]>> = {
  acople: [0, 0, 512],
  rematada: [0, 0, 512],
  kimberly: [160, 70, 350],
  platanero: [140, 30, 360],
};

/**
 * Escala de la pose de victoria respecto de la guardia: algunas hojas la pintaron a otro tamaño.
 * Calculada para que la cabeza llegue a la altura de la guardia (la línea punteada del laboratorio):
 * alto de la guardia / (alto de la victoria − espacio sobre la cabeza), retocado a ojo (mimetico). Las reverencias van más bajas a propósito: chantal no se toca y jeanpierre solo sube un poco.
 */
const WIN_FIT: Partial<Record<string, number>> = {
  george: 0.74,
  slandor: 0.79,
  pentalick: 0.82,
  pepper: 0.86,
  ferdex: 0.94,
  turboshred: 1.01,
  kimberly: 1.03,
  markus: 1.05,
  escalas: 1.06,
  tayloy: 1.06,
  rematada: 1.08,
  toxicity: 1.11,
  platanero: 1.11,
  clavito: 1.12,
  mimetico: 1.12,
  jesex: 1.15,
  jeanpierre: 1.06,
  ricardo: 1.16,
};

/**
 * Ancla horizontal (0–1) que reemplaza la del atlas cuando quedó en un pie en vez del centro de los pies:
 * si no, el cuerpo salta al cambiar de pose (y lo que nace en esa pose, como el rayo del Acople, queda atrás).
 */
const PIVOT_X: Partial<Record<string, number>> = {
  'acople-idle': 0.49,
  'acople-intro': 0.49,
};

/** Alto visual (px) que reemplaza al de metadata.json: El Acople, ~11% más chico que su arte original (594). */
const VISUAL_HEIGHT: Partial<Record<string, number>> = { acople: 530 };

/** Alto de la pose de ultimate respecto de la guardia (la guitarra levantada suma un poco). */
const SUPER_HEIGHT = 1.05;

export function preloadRosterArt(scene: Phaser.Scene): void {
  for (const id of ROSTER_ART_IDS) {
    const root = `assets/characters/${id}`;
    // Siempre el atlas de siempre; el de cuerpos animados del ultimate se usa solo si ya existe.
    scene.load.atlas(`roster-${id}`, `${root}/atlas.png`, `${root}/atlas.json`);
    if (ULTIMATE_BODY_IDS.some((fighter) => fighter === id)) {
      scene.load.atlas(`roster-ult-${id}`, `assets/ultimate-bodies/${id}-atlas.png`, `assets/ultimate-bodies/${id}-atlas.json`);
    }
    scene.load.json(`roster-meta-${id}`, `${root}/metadata.json`);
    scene.load.image(`super-cutin-${id}`, `${root}/portrait.png`);
  }
}

/** Only replaces presentation references; preserves gameplay data and original fighters. */
export function registerRosterArt(scene: Phaser.Scene): void {
  const fighters = FIGHTERS as Partial<Record<string, FighterDef>>;
  for (const id of ROSTER_ART_IDS) {
    const usable = (key: string) => scene.textures.exists(key) && scene.textures.get(key).has(`${id}-idle`);
    const texture = usable(`roster-ult-${id}`) ? `roster-ult-${id}` : `roster-${id}`;
    if (!usable(texture)) continue;
    const def = fighters[id];
    const metadata = scene.cache.json.get(`roster-meta-${id}`) as { scales?: Record<string, number>; visualHeight?: number } | undefined;
    const visualHeight = VISUAL_HEIGHT[id] ?? metadata?.visualHeight;
    const visualScale = def && visualHeight ? visualHeight / def.art.height : 1;
    for (const [pose, scale] of Object.entries(metadata?.scales ?? {})) {
      poseScale.set(`${texture}/${id}-${pose}`, scale * visualScale);
    }
    for (const [name, x] of Object.entries(PIVOT_X)) {
      if (!name.startsWith(`${id}-`) || !scene.textures.get(texture).has(name)) continue;
      const frame = scene.textures.getFrame(texture, name);
      frame.customPivot = true;
      frame.pivotX = x!;
    }
    const winKey = `${texture}/${id}-win`;
    poseScale.set(winKey, (poseScale.get(winKey) ?? visualScale) * (WIN_FIT[id] ?? 1));
    // Ultimate: cada arte dibujó la pose tocando la guitarra a otro tamaño que la guardia. Se igualan
    // todos para que, al tocar, el luchador mida lo mismo que de pie (un poco más por la guitarra).
    const atlas = scene.textures.get(texture);
    const superFrames = [`${id}-super`, ...[0, 1, 2, 3].map((n) => `${id}-super-${n}`)].filter((f) => atlas.has(f));
    const baseSuper = (metadata?.scales?.super ?? 1) * visualScale;
    const idleHeight = atlas.get(`${id}-idle`).realHeight * (metadata?.scales?.idle ?? 1) * visualScale;
    const tallest = Math.max(...superFrames.map((f) => atlas.get(f).realHeight * baseSuper));
    const fit = superFrames.length ? (idleHeight * SUPER_HEIGHT) / tallest : 1;
    for (const f of superFrames) poseScale.set(`${texture}/${f}`, baseSuper * fit);
    if (def) {
      def.art = { ...def.art, texture, prefix: `${id}-`, placeholder: false, tint: undefined };
      if (id === 'acople') {
        def.color = 0xe83240;
        def.css = '#e83240';
      }
    }
    const portraitKey = `super-cutin-${id}`;
    if (scene.textures.exists(portraitKey)) {
      const portrait = scene.textures.get(portraitKey);
      if (!portrait.has('face')) {
        const [x, y, size] = FACE_CROPS[id] ?? [100, 0, 340];
        portrait.add('face', 0, x, y, size, size);
      }
    }
  }
}
