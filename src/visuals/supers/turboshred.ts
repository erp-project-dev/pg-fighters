import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, burst, colorFlash, comet, echo, every, lensColor, markHit, missile, shockwave, spark, victim } from './energy';

const YELLOW = 0xffee32;

/**
 * TURBOSHRED · METRÓNOMO EN HUELGA: líneas de velocidad cada vez más rápidas, él deja copias de sí mismo
 * y el mundo se pone lento (todo pierde color menos él). El rival se mueve en cámara lenta con estela.
 * Remate: el tiempo se detiene en gris, cien trazos amarillos lo cruzan y el tiempo vuelve de golpe.
 */
export const turboshred: SuperShow = {
  aim: true,
  start(c: ShowCtx) {
    const lines = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(lines);
    Object.assign(c.data, { lines });
  },
  update(c: ShowCtx) {
    const o = c.owner;
    const u = Math.min(1, c.t / c.duration);
    const speed = 2 + u * 8;
    const lines = c.data.lines as Phaser.GameObjects.Graphics;
    lines.clear();
    for (let i = 0; i < 34; i++) {
      const y = ((i * 97 + c.t * 0.05) % (GAME_HEIGHT - 80)) + 20;
      const span = GAME_WIDTH + 800;
      const x = (((i * 331 + c.t * speed * o.facing) % span) + span) % span - 400;
      lines.lineStyle(i % 3 ? 2 : 6, i % 4 ? YELLOW : 0xffffff, i % 3 ? 0.2 : 0.4).lineBetween(x, y, x - o.facing * (220 + u * 500), y);
    }
    // Copias de sí mismo, cada vez más seguidas.
    if (every(c, 'ghostAt', 90 - u * 50)) echo(c.scene, o.sprite, { dx: -o.facing * rand(20, 80), color: YELLOW, alpha: 0.45, ms: 220 });
    // El mundo pierde el color (cámara lenta); él sigue brillando con sus copias.
    const cm = lensColor(c);
    if (cm && !c.data.frozen) {
      cm.colorMatrix.desaturate();
      cm.colorMatrix.alpha = Math.min(0.55, u * 0.8);
    }
    // El rival, lento: deja estela y se estira hacia atrás.
    if (every(c, 'trailAt', 110)) echo(c.scene, c.target.sprite, { dx: c.owner.facing * 30, color: 0xb8b8b8, alpha: 0.3, ms: 500, add: false });
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, c.data.frozen ? { tint: 0xd8d8d8 } : { x: Math.sin(c.t / 400) * 6, sx: 1 + Math.max(0, 1 - since / 300) * 0.12, tint: since < 120 ? 0xffffff : undefined, fill: since < 120 });
  },
  note(c, x, y, hit, final) {
    return hit ? missile(c, x, y, YELLOW, final ? 40 : 22) : spark(c, x, y, YELLOW);
  },
  fly(c, x, y, _age, final) {
    comet(c, x, y, final ? 0xffffff : YELLOW, final ? 1 : 0.55, 0.2);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    c.fx.ring(x, y, YELLOW, 140, 0.2);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // Tiempo detenido: gris total y quietud.
    c.data.frozen = true;
    colorFlash(scene, 'gray', 900);
    const cuts = scene.add.graphics().setDepth(47).setBlendMode(ADD);
    const strokes: { x0: number; y0: number; x1: number; y1: number }[] = [];
    for (let i = 0; i < 18; i++) {
      scene.time.delayedCall(i * 26, () => {
        const a = rand(0, Math.PI);
        const len = rand(500, 1100);
        strokes.push({ x0: t.x - Math.cos(a) * len, y0: t.y - Math.sin(a) * len * 0.6, x1: t.x + Math.cos(a) * len, y1: t.y + Math.sin(a) * len * 0.6 });
        cuts.clear();
        for (const s of strokes) cuts.lineStyle(16, YELLOW, 0.3).lineBetween(s.x0, s.y0, s.x1, s.y1).lineStyle(4, 0xffffff, 1).lineBetween(s.x0, s.y0, s.x1, s.y1);
      });
    }
    // …y el tiempo vuelve: todos los golpes a la vez.
    scene.time.delayedCall(520, () => {
      c.data.frozen = false;
      scene.tweens.add({ targets: cuts, alpha: 0, duration: 260, onComplete: () => cuts.destroy() });
      veil(scene, YELLOW, 0.5, 60, 10, 380, 48);
      shockwave(scene, 0.6, 800);
      for (let i = 0; i < 5; i++) c.fx.ring(t.x, t.y, i % 2 ? 0xffffff : YELLOW, 200 + i * 160, 0.4 + i * 0.1);
      c.fx.hit(t.x, t.y, YELLOW, true);
      burst(c, t.x, t.y, YELLOW, 40, 1500);
      scene.cameras.main.shake(500, 0.026);
      slam(scene, t.x, t.y - 300, '¿ESO ERA LENTO?', '#ffee32', 100);
    });
  },
};
