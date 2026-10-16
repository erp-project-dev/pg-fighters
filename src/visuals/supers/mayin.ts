import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, emit, rand, slam, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, comet, glowTex, lensVignette, markHit, orb, shockwave, spark, victim, wave } from './energy';

const BLUE = 0x3a7bff;
const PALE = 0x9cc4ff;
const STRINGS = 5;

/**
 * MAYINBLUES · EL ÚLTIMO BLUES: cinco haces de luz azul cruzan la pantalla como cuerdas y vibran con cada nota;
 * una bruma azul respira lenta. Lanza ondas azules anchas y el rival se pone pesado y se hunde.
 * Remate: un bend eterno estira la pantalla y una ola de energía azul la barre de lado a lado.
 */
export const mayin: SuperShow = {
  spread: 0.6,
  start(c: ShowCtx) {
    const strings = c.scene.add.graphics().setBlendMode(ADD);
    const sweep = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(strings);
    c.front.add(sweep);
    Object.assign(c.data, { strings, sweep, pluck: [0, 0, 0, 0, 0] as number[] });
  },
  update(c: ShowCtx, dt: number) {
    const g = c.data.strings as Phaser.GameObjects.Graphics;
    const pluck = c.data.pluck as number[];
    g.clear();
    for (let i = 0; i < STRINGS; i++) {
      pluck[i] = Math.max(0, pluck[i] - dt * 1.6);
      const y = 260 + i * 110;
      const amp = 4 + pluck[i] * 60;
      wave(g, y, amp, 70 + i * 12, c.t / (60 - i * 6), BLUE, 18, 0.12 + pluck[i] * 0.2);
      wave(g, y, amp, 70 + i * 12, c.t / (60 - i * 6), PALE, 3, 0.35 + pluck[i] * 0.5);
    }
    // Bruma azul que respira.
    if (Math.random() < dt * 8) emit(c, glowTex(c.scene), rand(0, GAME_WIDTH), rand(200, GAME_HEIGHT), { vx: rand(-40, 40), vy: rand(-30, -10), life: 3, scale: rand(6, 12), tint: BLUE, add: true, alpha: 0.12, layer: 'back' });
    const vig = lensVignette(c, 0x001040);
    if (vig) vig.strength = 0.35 + Math.sin(c.t / 500) * 0.08;
    // Ola final.
    const sweep = c.data.sweep as Phaser.GameObjects.Graphics;
    sweep.clear();
    if (c.data.waveX !== undefined) {
      const x = c.data.waveX as number;
      for (let k = 0; k < 8; k++) sweep.fillStyle(k < 2 ? 0xffffff : BLUE, 0.08 + (k < 2 ? 0.3 : 0)).fillRect(x - c.owner.facing * k * 40 - 30, 0, 60, GAME_HEIGHT);
    }
    // El rival, pesado de tristeza: se tiñe de azul, se encoge y se hunde despacio.
    const hits = c.data.hits ?? 0;
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, { tint: since < 140 ? 0xffffff : 0x7d9cff, fill: since < 140, y: hits * 3, sy: 1 - hits * 0.015, sx: 1 + hits * 0.01, angle: -hits * 1.2 });
  },
  note(c, x, y, hit, final) {
    (c.data.pluck as number[])[Math.floor(rand(0, STRINGS))] = 1;
    return hit ? orb(c, x, y, BLUE, final ? 60 : 38) : spark(c, x, y, PALE);
  },
  fly(c, x, y, age, final) {
    comet(c, x, y + Math.sin(age * 10) * 20, BLUE, final ? 1.8 : 1.2, 0.5);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, BLUE, 10, 500);
    shockwave(c.scene, final ? 0.5 : 0.08, final ? 1400 : 400);
    if (!final) return;
    const t = chest(c.target);
    (c.data.pluck as number[]).fill(1.4);
    const from = c.owner.x;
    c.data.waveX = from;
    c.scene.tweens.add({ targets: c.data, waveX: from + c.owner.facing * GAME_WIDTH * 1.1, duration: 700, ease: 'Sine.easeIn' });
    for (let k = 0; k < 5; k++) c.scene.time.delayedCall(k * 120, () => c.fx.ring(t.x, t.y, k % 2 ? PALE : BLUE, 260 + k * 160, 0.6));
    c.fx.hit(t.x, t.y, BLUE, true);
    c.scene.cameras.main.shake(500, 0.02);
    slam(c.scene, GAME_WIDTH / 2, 420, 'EL ÚLTIMO BLUES', '#3a7bff', 140, -4);
  },
};
