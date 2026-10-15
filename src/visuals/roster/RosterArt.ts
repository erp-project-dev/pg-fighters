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
    const visualScale = def && metadata?.visualHeight ? metadata.visualHeight / def.art.height : 1;
    for (const [pose, scale] of Object.entries(metadata?.scales ?? {})) {
      poseScale.set(`${texture}/${id}-${pose}`, scale * visualScale);
    }
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
        if (id === 'acople' || id === 'rematada') portrait.add('face', 0, 0, 0, 512, 512);
        else portrait.add('face', 0, 100, 0, 340, 340);
      }
    }
  }
}
