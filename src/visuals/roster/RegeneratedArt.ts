import Phaser from 'phaser';
import { FIGHTERS, type FighterDef } from '../../data/fighters';
import { poseScale } from '../../systems/AnimeAtlas';

/** Only complete, reviewed source sets belong here. Load pages for the active fighters. */
export const REGENERATED_ART_IDS: readonly string[] = ['nosu', 'george', 'virrey', 'inti', 'amu', 'mimetico'];

export interface AnimationMetadata {
  animationVersion: 2;
  complete: boolean;
  scales: Record<string, number>;
  phaseFrames: Record<string, Partial<Record<'startup' | 'active' | 'recovery', [number, number]>>>;
}

/**
 * Correcciones de tamaño por pose, encima de metadata.json: algunas hojas se dibujaron más grandes o más
 * chicas que la guardia. Medido comparando el tamaño de la cabeza de cada pose con la de `idle` (la base)
 * y revisado a ojo en el laboratorio de sprites. 1 = sin cambio.
 */
const POSE_SCALE_FIX: Partial<Record<string, Record<string, number>>> = {
  george: {
    // Agachado: las hojas vinieron ~10–25 % más grandes.
    crouch: 0.91, crouchBlock: 0.9, crouchHurt: 0.79, crouchPunch: 0.84,
    // De pie y en el aire: algunas vinieron ~5–10 % más chicas (o más grandes, como el dash y el puño aéreo).
    punch: 1.08, kick: 1.1, uppercut: 1.1, win: 1.1, super: 1.1, special: 1.07, sweep: 1.05,
    walk: 1.05, walkBack: 1.08, airKick: 1.03, backdash: 1.03, airPunch: 0.89, dash: 0.96,
    // En el piso (la cabeza se mide peor acostado: ajustado a ojo).
    knockdown: 1.03, down: 1.16, getup: 1.08,
  },
};

const originals = new Map<string, FighterDef['art']>();
const textureKey = (id: string) => `regenerated-${id}`;

export function preloadRegeneratedArt(scene: Phaser.Scene, ids: string[]): void {
  const active = new Set(ids);
  for (const id of REGENERATED_ART_IDS) {
    const key = textureKey(id);
    const def = Object.values(FIGHTERS).find((fighter) => fighter.id === id);
    if (!active.has(id)) {
      if (def && originals.has(id)) def.art = { ...originals.get(id)! };
      if (scene.textures.exists(key)) scene.textures.remove(key);
      continue;
    }
    if (scene.textures.exists(key)) continue;
    const root = `assets/characters/${id}/animations`;
    scene.load.multiatlas(key, `${root}/atlas.json`, root);
    if (!scene.cache.json.exists(`${key}-meta`)) scene.load.json(`${key}-meta`, `${root}/metadata.json`);
  }
}

export function registerRegeneratedArt(scene: Phaser.Scene, ids: string[]): void {
  for (const id of ids) {
    if (!REGENERATED_ART_IDS.includes(id)) continue;
    const key = textureKey(id);
    const metadata = scene.cache.json.get(`${key}-meta`) as AnimationMetadata | undefined;
    if (!metadata?.complete || !scene.textures.exists(key) || !scene.textures.get(key).has(`${id}-idle`)) continue;
    const def = Object.values(FIGHTERS).find((fighter) => fighter.id === id);
    if (!def) continue;
    if (!originals.has(id)) originals.set(id, { ...def.art });
    const fix = POSE_SCALE_FIX[id] ?? {};
    for (const [pose, scale] of Object.entries(metadata.scales)) {
      // Las claves son la pose ("hurt") o un cuadro ("hurt-3"): la corrección va por pose.
      poseScale.set(`${key}/${id}-${pose}`, scale * (fix[pose.replace(/-\d+$/, '')] ?? 1));
    }
    def.art = { ...def.art, texture: key, prefix: `${id}-`, placeholder: false, tint: undefined };
  }
}

export function animationMetadata(scene: Phaser.Scene, def: FighterDef): AnimationMetadata | undefined {
  if (!def.art.texture.startsWith('regenerated-')) return undefined;
  return scene.cache.json.get(`${def.art.texture}-meta`) as AnimationMetadata | undefined;
}
