import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, emit, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, colorFlash, comet, glintTex, glowTex, lensColor, markHit, missile, shockwave, spark, victim } from './energy';

const GOLD = 0xd9b45a;
const BRIGHT = 0xffe9a8;

/**
 * JESEX · GIRA MUNDIAL: la pantalla se baña en dorado, brillos de lujo la cruzan y cae escarcha;
 * dispara cometas dorados de estela larga. El rival queda dorado y encandilado.
 * Remate: una lluvia de cometas dorados desde arriba.
 */
export const jesex: SuperShow = {
  aim: true,
  spread: 1.5,
  update(c: ShowCtx, dt: number) {
    const cm = lensColor(c);
    if (cm) {
      cm.colorMatrix.sepia();
      cm.colorMatrix.brightness(1.15, true);
      cm.colorMatrix.alpha = Math.min(0.65, c.t / 1200);
    }
    if (Math.random() < dt * 35) emit(c, glowTex(c.scene), rand(0, GAME_WIDTH), -20, { vx: rand(-30, 30), vy: rand(120, 260), life: 4, scale: rand(0.15, 0.35), tint: BRIGHT, add: true });
    if (Math.random() < dt * 14) emit(c, glintTex(c.scene), rand(0, GAME_WIDTH), rand(0, GAME_HEIGHT), { life: 0.6, scale: rand(0.4, 1.1), grow: -1.2, spin: 120, tint: 0xffffff, add: true });
    // Cometa que cruza el fondo de vez en cuando.
    if (Math.random() < dt * 3) {
      const y = rand(80, 500);
      for (let i = 0; i < 12; i++) emit(c, glowTex(c.scene), -40 - i * 30, y + i * 4, { vx: 1600, vy: 60, life: 1.6, scale: 1 - i * 0.07, tint: GOLD, add: true, layer: 'back' });
    }
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, { tint: since < 160 ? 0xffffff : BRIGHT, fill: since < 160 || Math.floor(c.t / 120) % 5 === 0, x: since < 200 ? rand(-6, 6) : 0 });
  },
  note(c, x, y, hit, final) {
    return hit ? missile(c, x, y, final ? 0xffffff : GOLD, final ? 46 : 30) : spark(c, x, y, BRIGHT);
  },
  fly(c, x, y, _age, final) {
    comet(c, x, y, GOLD, final ? 1.6 : 1.1, 0.6);
    if (Math.random() < 0.25) emit(c, glintTex(c.scene), x, y, { life: 0.3, scale: 0.4, grow: -1, tint: 0xffffff, add: true });
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, GOLD, 12, 700, glintTex(c.scene));
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // Lluvia de cometas dorados sobre el rival.
    for (let i = 0; i < 14; i++) {
      scene.time.delayedCall(i * 35, () => {
        const sx = t.x + rand(-500, 500);
        const trail = scene.add.graphics().setDepth(47).setBlendMode(ADD);
        const st = { k: 0 };
        scene.tweens.add({
          targets: st, k: 1, duration: 220, ease: 'Quad.easeIn',
          onUpdate: () => {
            const hx = sx + (t.x - sx) * st.k;
            const hy = -60 + (t.y + 60) * st.k;
            trail.clear().lineStyle(18, GOLD, 0.3).lineBetween(sx, -60, hx, hy).lineStyle(5, 0xffffff, 0.9).lineBetween(sx + (hx - sx) * 0.6, -60 + (hy + 60) * 0.6, hx, hy);
          },
          onComplete: () => { trail.destroy(); c.fx.hit(t.x + rand(-40, 40), t.y + rand(-40, 40), GOLD, i % 3 === 0); },
        });
      });
    }
    scene.time.delayedCall(520, () => {
      colorFlash(scene, 'burn', 600);
      veil(scene, BRIGHT, 0.6, 100, 20, 500, 48);
      shockwave(scene, 0.6, 900);
      burst(c, t.x, t.y, GOLD, 50, 1400, glintTex(scene));
      scene.cameras.main.shake(600, 0.026);
      slam(scene, GAME_WIDTH / 2, 420, 'PAGADO', '#ff3b3b', 170, -14);
    });
  },
};
