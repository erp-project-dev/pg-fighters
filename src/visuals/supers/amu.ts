import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, dotTex, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';

const GREEN = 0x2ecc71;
const ACHIOTE = 0xd9481e;
const WATER = 0x1b8a9e;

/**
 * AMU · LA VOZ DEL RÍO: el agua del río sube por la pantalla en olas y cada golpe del manguaré la hace
 * vibrar en anillos verdes y rojo achiote; luciérnagas suben del agua. Remate: el río entero retumba.
 */
export const amu: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics();
    const rings = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add([g, rings]);
    Object.assign(c.data, { g, rings, beats: [] as { t: number; color: number }[] });
  },
  update(c: ShowCtx, dt: number) {
    const k = Math.min(1, c.t / 1200);
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    // Dos capas de olas que suben hasta un tercio de la pantalla.
    for (const [depth, alpha, speed] of [[0, 0.35, 260], [40, 0.5, 190]] as const) {
      const top = GAME_HEIGHT - (GAME_HEIGHT * 0.32 * k) + depth;
      const pts: { x: number; y: number }[] = [{ x: 0, y: GAME_HEIGHT }];
      for (let x = 0; x <= GAME_WIDTH; x += 40) pts.push({ x, y: top + Math.sin(x / 120 + c.t / speed) * 18 });
      pts.push({ x: GAME_WIDTH, y: GAME_HEIGHT });
      g.fillStyle(WATER, alpha).fillPoints(pts as Phaser.Math.Vector2[], true);
    }
    // Anillos de vibración de cada golpe, que se abren desde Amu.
    const rings = c.data.rings as Phaser.GameObjects.Graphics;
    rings.clear();
    const p = chest(c.owner);
    const beats = c.data.beats as { t: number; color: number }[];
    for (const b of beats) {
      const age = (c.t - b.t) / 900;
      if (age > 1) continue;
      rings.lineStyle(10 * (1 - age), b.color, 0.7 * (1 - age)).strokeCircle(p.x, p.y, 60 + age * 900);
    }
    c.data.beats = beats.filter((b) => c.t - b.t < 900);
    if (Math.random() < dt * 35) emit(c, dotTex(c.scene), rand(0, GAME_WIDTH), GAME_HEIGHT - rand(0, 200), { vy: -rand(60, 160), vx: rand(-30, 30), life: 3, scale: rand(0.3, 0.7), tint: 0xc8ff6b, add: true, layer: 'back' });
  },
  impact(c, x, y, final) {
    const beats = c.data.beats as { t: number; color: number }[];
    beats.push({ t: c.t, color: beats.length % 2 ? ACHIOTE : GREEN });
    if (!final) {
      c.scene.cameras.main.shake(80, 0.004);
      return;
    }
    const t = chest(c.target);
    veil(c.scene, WATER, 0.35, 140);
    c.scene.cameras.main.shake(420, 0.022);
    c.fx.hit(t.x, t.y, GREEN, true);
    for (let k = 0; k < 4; k++) c.fx.ring(t.x, t.y, k % 2 ? ACHIOTE : GREEN, 200 + k * 140, 0.6);
    slam(c.scene, t.x, t.y - 300, '¡TUM-TUM!', '#2ecc71', 140);
  },
};
