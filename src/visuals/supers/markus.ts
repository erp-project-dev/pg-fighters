import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, emit, rand, slam, tex, veil, type NoteObj, type ShowCtx, type SuperShow } from './kit';
import { ADD, body, colorFlash, glowTex, lensBarrel, markHit, ringTex, shockPose, shockwave, spark, spinX, victim, zapArcs } from './energy';

const GOLD = 0xe0b862;
const BLUE = 0x5c9dff;

/** Estrella de ocho puntas de luz (dos cuadrados cruzados) con anillos. */
const arabesqueTex = (scene: Phaser.Scene, key: string, size: number, color: number, accent: number) =>
  tex(scene, key, size, size, (g) => {
    const c = size / 2;
    const r = size * 0.42;
    const square = (rot: number, k = 1) => {
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < 4; i++) pts.push(new Phaser.Math.Vector2(c + Math.cos(rot + (i / 4) * Math.PI * 2) * r * k, c + Math.sin(rot + (i / 4) * Math.PI * 2) * r * k));
      return pts;
    };
    g.lineStyle(size / 60, color, 0.9).strokePoints(square(0), true).strokePoints(square(Math.PI / 4), true);
    g.lineStyle(size / 90, accent, 0.9).strokeCircle(c, c, r * 0.7).strokeCircle(c, c, r * 1.05);
    g.lineStyle(size / 120, color, 0.7).strokePoints(square(Math.PI / 8, 0.55), true);
  });

/** Tornado de energía: aros de luz apilados, más anchos arriba; `fly` los hace girar. */
const tornado = (c: ShowCtx, x: number, y: number, size: number): Phaser.GameObjects.Container => {
  const rings: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < 9; i++) {
    const k = i / 8;
    rings.push(c.scene.add.image(0, 70 * size - i * 20 * size, ringTex(c.scene)).setBlendMode(ADD)
      .setTint(i % 2 ? GOLD : BLUE).setScale((0.35 + k * 1.1) * size, (0.12 + k * 0.25) * size).setAlpha(0.85));
  }
  return c.scene.add.container(x, y, [c.scene.add.image(0, 0, glowTex(c.scene)).setTint(GOLD).setBlendMode(ADD).setScale(4 * size), ...rings]);
};

/**
 * MARKUS · KABOOOM ORIENTAL: el aire ondula como calor de desierto, arabescos de luz giran detrás de él
 * y lanza tornados de arena dorada. Cada tornado atrapa al rival, que gira y se electrocuta en azul.
 * Remate: onda expansiva que deforma la pantalla.
 */
export const markus: SuperShow = {
  start(c: ShowCtx) {
    const big = c.scene.add.image(0, 0, arabesqueTex(c.scene, 'sx-arab-big', 620, GOLD, BLUE)).setBlendMode(ADD).setScale(0).setAlpha(0.6);
    const small = c.scene.add.image(0, 0, arabesqueTex(c.scene, 'sx-arab-small', 360, BLUE, GOLD)).setBlendMode(ADD).setScale(0).setAlpha(0.7);
    const zap = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add([big, small]);
    c.front.add(zap);
    c.scene.tweens.add({ targets: big, scale: 1, duration: 420, ease: 'Back.easeOut' });
    c.scene.tweens.add({ targets: small, scale: 1, delay: 120, duration: 420, ease: 'Back.easeOut' });
    Object.assign(c.data, { big, small, zap });
  },
  update(c: ShowCtx, dt: number) {
    const p = chest(c.owner);
    const beat = 1 + Math.sin(c.t / 120) * 0.04;
    (c.data.big as Phaser.GameObjects.Image).setPosition(p.x, p.y - 40).setAngle(c.t / 30).setScale(beat);
    (c.data.small as Phaser.GameObjects.Image).setPosition(p.x, p.y - 40).setAngle(-c.t / 18);
    // Calor de desierto: la pantalla entera respira.
    const barrel = lensBarrel(c);
    if (barrel) barrel.amount = 1 + Math.sin(c.t / 170) * 0.015;
    // Tormenta de arena: chispas doradas que cruzan en remolino.
    if (Math.random() < dt * 70) {
      const dir = c.owner.facing;
      emit(c, glowTex(c.scene), dir > 0 ? -40 : GAME_WIDTH + 40, rand(80, GAME_HEIGHT - 80), {
        vx: dir * rand(700, 1300), vy: rand(-120, 120), life: 2.2, scale: rand(0.2, 0.6), tint: Math.random() < 0.8 ? GOLD : BLUE, add: true, layer: 'back', alpha: rand(0.4, 0.9),
      });
    }
    // El rival atrapado gira dentro del tornado y lo recorren rayos azules.
    const zap = c.data.zap as Phaser.GameObjects.Graphics;
    zap.clear();
    const since = c.t - (c.data.hitAt ?? -9999);
    const caught = Math.max(0, 1 - since / 700);
    if (caught > 0) {
      zapArcs(zap, c.target, BLUE, 5, 3);
      const b = body(c.target);
      for (let i = 0; i < 3; i++) {
        const a = c.t / 90 + i * 2.1;
        emit(c, glowTex(c.scene), b.x + Math.cos(a) * b.w * 1.4, b.feet - b.h * (0.2 + 0.3 * i), { life: 0.3, scale: 0.6, grow: -1.5, tint: GOLD, add: true });
      }
    }
    const shock = shockPose(c.t, BLUE, caught);
    victim(c, caught > 0 ? { ...shock, sx: spinX(c.t, 3), y: -50 * caught + (shock.y ?? 0) } : null);
  },
  note(c, x, y, hit, final) {
    return hit ? tornado(c, x, y, final ? 1.9 : 1.25) : spark(c, x, y, GOLD);
  },
  fly(c, x, y, age, final, obj: NoteObj) {
    // De pie (sin vaivén) y con sus aros girando como un embudo.
    obj.setAngle(0);
    const rings = (obj as Phaser.GameObjects.Container).list as Phaser.GameObjects.Image[];
    rings.forEach((r, i) => i && r.setX(Math.sin(age * 22 + i * 0.7) * 10 * i * 0.4));
    if (Math.random() < 0.8) {
      const a = age * 20 + rand(0, Math.PI * 2);
      emit(c, glowTex(c.scene), x + Math.cos(a) * 100, y + rand(-80, 60), { vx: -Math.sin(a) * 200, vy: -rand(80, 220), life: 0.4, scale: final ? 0.7 : 0.45, grow: -1, tint: Math.random() < 0.7 ? GOLD : BLUE, add: true });
    }
  },
  impact(c, x, y, final) {
    markHit(c, final);
    c.fx.ring(x, y, BLUE, 180, 0.3);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    colorFlash(scene, 'burn', 500);
    shockwave(scene, 0.85, 1000);
    veil(scene, 0xffffff, 0.6, 90);
    for (let k = 0; k < 7; k++) scene.time.delayedCall(k * 70, () => c.fx.ring(t.x, t.y, k % 2 ? GOLD : BLUE, 240 + k * 180, 0.55));
    c.fx.hit(t.x, t.y, BLUE, true);
    c.fx.hit(t.x, t.y, GOLD, true);
    scene.cameras.main.shake(700, 0.03);
    slam(scene, GAME_WIDTH / 2, 420, '¡KABOOOOM!', '#5c9dff', 190, -3);
  },
};
