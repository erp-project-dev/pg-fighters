import Phaser from 'phaser';
import { poseScale } from './AnimeAtlas';
import { initialsOf, type FighterDef } from '../data/fighters';
import { FONTS } from '../config';

/**
 * Poses que pide el juego. Cada personaje puede aportar un frame por pose (`<prefijo><pose>`)
 * o una animación (`<prefijo><pose>-0`, `-1`, ...; 12 fps). Las poses que falten se simulan
 * con la más cercana deformada (tabla FALLBACK), así que el arte se puede ir completando por partes.
 * El ancla del frame debe estar en los pies (pivot del atlas); si no hay pivot, se usa (0.5, 0.97).
 */
export const POSES = [
  'idle', 'walk', 'walkBack', 'crouch', 'jump', 'fall', 'dash', 'backdash',
  'punch', 'kick', 'crouchPunch', 'sweep', 'airPunch', 'airKick',
  'special', 'uppercut', 'super',
  'hurt', 'crouchHurt', 'block', 'crouchBlock', 'knockdown', 'down', 'getup',
  'intro', 'win', 'ko',
] as const;
export type Pose = (typeof POSES)[number];

interface Fallback {
  base: Pose;
  sx?: number;
  sy?: number;
  /** Grados, en el sentido de mirar a la derecha. */
  angle?: number;
  /** Desplazamiento vertical extra (px de pantalla). */
  dy?: number;
}

const FALLBACK: Partial<Record<Pose, Fallback>> = {
  walk: { base: 'idle' },
  walkBack: { base: 'idle', angle: -3 },
  crouch: { base: 'idle', sx: 1.06, sy: 0.72 },
  jump: { base: 'idle', sy: 0.9, angle: -6 },
  fall: { base: 'idle', sy: 0.95, angle: 5 },
  dash: { base: 'idle', angle: 10 },
  backdash: { base: 'hurt', angle: -6 },
  crouchPunch: { base: 'punch', sx: 1.04, sy: 0.72 },
  sweep: { base: 'kick', sx: 1.08, sy: 0.6, dy: 4 },
  airPunch: { base: 'punch', angle: 10, sy: 0.92 },
  airKick: { base: 'kick', angle: 16, sy: 0.92 },
  special: { base: 'punch', sx: 1.05 },
  uppercut: { base: 'punch', angle: -42, sy: 1.04 },
  super: { base: 'idle' },
  crouchHurt: { base: 'hurt', sy: 0.74 },
  block: { base: 'hurt', angle: 4 },
  crouchBlock: { base: 'hurt', sy: 0.72, angle: 4 },
  knockdown: { base: 'hurt', angle: -48 },
  down: { base: 'hurt', angle: -90, dy: -40 },
  getup: { base: 'hurt', angle: -28, sy: 0.85 },
  intro: { base: 'idle' },
  win: { base: 'punch', angle: -55 },
  ko: { base: 'hurt', angle: -90, dy: -40 },
};

export interface ResolvedPose {
  frame: string;
  sx: number;
  sy: number;
  angle: number;
  dy: number;
}

const FPS = 12;

/** Busca frames de una pose: animación (`pose-0..n`) o frame único. */
const framesFor = (texture: Phaser.Textures.Texture, prefix: string, pose: Pose): string[] => {
  const anim: string[] = [];
  for (let i = 0; texture.has(`${prefix}${pose}-${i}`); i++) anim.push(`${prefix}${pose}-${i}`);
  if (anim.length) return anim;
  return texture.has(`${prefix}${pose}`) ? [`${prefix}${pose}`] : [];
};

/** Frame y deformación para una pose en el instante `t` (ms desde que empezó la pose). */
export const resolvePose = (scene: Phaser.Scene, def: FighterDef, pose: Pose, t: number, loop = true): ResolvedPose => {
  const texture = scene.textures.get(def.art.texture);
  let p: Pose = pose;
  const out: ResolvedPose = { frame: '', sx: 1, sy: 1, angle: 0, dy: 0 };
  for (let guard = 0; guard < 4; guard++) {
    const frames = framesFor(texture, def.art.prefix, p);
    if (frames.length) {
      const fps = p === 'super' && def.superMove.solo === 'blues' ? 6 : FPS;
      const dash = pose === 'dash' || pose === 'backdash' ? pose : null;
      const duration = dash === 'dash' ? 210 : 250;
      const progress = Math.max(0, Math.min(1, (loop ? t % duration : t) / duration));
      const i = dash ? Math.min(Math.floor(progress * frames.length), frames.length - 1) : Math.floor((t / 1000) * fps);
      out.frame = frames[dash ? i : loop ? i % frames.length : Math.min(i, frames.length - 1)];
      const scale=poseScale.get(`${def.art.texture}/${out.frame}`)??1;
      out.sx*=scale;out.sy*=scale;
      return out;
    }
    const fb = FALLBACK[p];
    if (!fb) break;
    out.sx *= fb.sx ?? 1;
    out.sy *= fb.sy ?? 1;
    out.angle += fb.angle ?? 0;
    out.dy += fb.dy ?? 0;
    p = fb.base;
  }
  out.frame = `${def.art.prefix}idle`;
  return out;
};

/** Frames de una pose en el atlas del luchador (vacío si la pose se simula). */
export const poseFrames = (scene: Phaser.Scene, def: FighterDef, pose: Pose) =>
  framesFor(scene.textures.get(def.art.texture), def.art.prefix, pose);

/** Cadena de simulación de una pose sin arte propio (p. ej. sweep → kick). Vacía si tiene arte. */
export const fallbackChain = (scene: Phaser.Scene, def: FighterDef, pose: Pose): Pose[] => {
  const chain: Pose[] = [];
  let p: Pose = pose;
  for (let guard = 0; guard < 4 && !poseFrames(scene, def, p).length; guard++) {
    const fb = FALLBACK[p];
    if (!fb) break;
    p = fb.base;
    chain.push(p);
  }
  return chain;
};

/** ¿La pose tiene arte propio? (para decidir efectos procedurales extra). */
export const hasOwnArt = (scene: Phaser.Scene, def: FighterDef, pose: Pose) =>
  framesFor(scene.textures.get(def.art.texture), def.art.prefix, pose).length > 0;

/** Escala para que la guardia mida `def.art.height` px. */
export const artScale = (scene: Phaser.Scene, def: FighterDef) => {
  const frame = scene.textures.getFrame(def.art.texture, `${def.art.prefix}idle`);
  return def.art.height / (frame?.realHeight ?? 500);
};

/** Textura del retrato en busto (public/assets/portrait-<id>.png, mirando a la derecha), si existe. */
export const bustKey = (scene: Phaser.Scene, def: FighterDef): string | null => {
  const key = `super-cutin-${def.id}`;
  return scene.textures.exists(key) ? key : null;
};

/**
 * Icono con la cara: frame `face` del retrato en busto; si no, frame `portrait` del atlas;
 * si no, recorte de la guardia. Los retratos miran a la derecha: `flip` los pone mirando a la izquierda
 * (para el lado derecho de la pantalla, mirando hacia el centro).
 */
export const addPortrait = (scene: Phaser.Scene, def: FighterDef, x: number, y: number, size: number, flip = false): Phaser.GameObjects.Image | Phaser.GameObjects.Container => {
  if (def.art.placeholder && !bustKey(scene, def)) return placeholderPortrait(scene, def, x, y, size);
  const bust = bustKey(scene, def);
  if (bust && scene.textures.get(bust).has('face')) {
    const img = scene.add.image(x, y, bust, 'face').setOrigin(0.5).setFlipX(flip);
    return img.setScale(size / Math.max(img.width, img.height));
  }
  const texture = scene.textures.get(def.art.texture);
  if (texture.has(`${def.art.prefix}portrait`)) {
    const img = scene.add.image(x, y, def.art.texture, `${def.art.prefix}portrait`).setOrigin(0.5).setFlipX(flip);
    return img.setScale(size / Math.max(img.width, img.height));
  }
  const f = def.art.face;
  const img = scene.add.image(x, y, def.art.texture, `${def.art.prefix}idle`).setOrigin(0, 0);
  img.setCrop(f.x, f.y, f.w, f.h);
  const s = size / f.w;
  img.setScale(s).setPosition(x - (f.x + f.w / 2) * s, y - (f.y + f.h / 2) * s);
  return img;
};

/** Retrato provisional (personaje sin arte todavía): cuadro de su color con sus iniciales. */
const placeholderPortrait = (scene: Phaser.Scene, def: FighterDef, x: number, y: number, size: number) => {
  const g = scene.add.graphics();
  const h = size / 2;
  g.fillStyle(0x111015, 1).fillRect(-h, -h, size, size);
  g.fillStyle(def.color, 0.55).fillTriangle(-h, h, h, -h, h, h);
  g.lineStyle(Math.max(2, size / 40), def.color, 1).strokeRect(-h, -h, size, size);
  const label = scene.add.text(0, -size * 0.04, initialsOf(def), {
    fontFamily: FONTS.head, fontSize: `${Math.round(size * 0.5)}px`, fontStyle: 'italic 900', color: '#ffffff', stroke: '#000000', strokeThickness: Math.max(3, size / 25),
  }).setOrigin(0.5);
  const parts: Phaser.GameObjects.GameObject[] = [g, label];
  if (size >= 120) {
    parts.push(scene.add.text(0, h - size * 0.12, 'ARTE PENDIENTE', { fontFamily: FONTS.head, fontSize: `${Math.round(size * 0.075)}px`, fontStyle: '800', color: '#ffffffaa' }).setOrigin(0.5));
  }
  return scene.add.container(x, y, parts);
};
