import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, emit, pick, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, aura, body, burst, colorFlash, comet, crossTex, glowTex, lensColor, markHit, shockwave, shot, spark, victim } from './energy';

const PURPLE = 0x7b2cbf;
const HOLY = 0xfff1c9;
/** Tonos de la neblina: de violeta a casi negro. */
const FOG = [0x5a189a, 0x7b2cbf, 0x3c096c, 0x240046];

/** Bocanada de aire denso y morado que flota despacio. */
const fog = (c: ShowCtx, x: number, y: number, life: number) =>
  emit(c, glowTex(c.scene), x, y, {
    vx: rand(-50, 50), vy: rand(-35, 15), spin: rand(-20, 20), life, scale: rand(7, 15), grow: rand(0.5, 1.5),
    tint: pick(FOG), add: Math.random() < 0.25, alpha: rand(0.32, 0.55), layer: 'back',
  });

/**
 * TOXICITY · EXCOMUNIÓN TOTAL: un aire denso y morado llena el fondo y la envuelve un aura oscura (su lado
 * poseído) mientras la pantalla se oscurece;
 * lanza cruces de luz. Remate (si conecta): una cruz de luz gigante queda marcada sobre el cuerpo del rival.
 */
export const toxicity: SuperShow = {
  start(c: ShowCtx) {
    // El aire ya arranca cargado: una primera capa de neblina morada.
    for (let i = 0; i < 45; i++) fog(c, rand(0, GAME_WIDTH), rand(0, GAME_HEIGHT), rand(0.5, 2.6));
  },
  update(c: ShowCtx, dt: number) {
    const u = Math.min(1, c.t / c.duration);
    // Aire denso y morado que se arremolina despacio y se va espesando.
    if (Math.random() < dt * (30 + u * 30)) fog(c, rand(-100, GAME_WIDTH + 100), rand(0, GAME_HEIGHT), rand(2, 3.4));
    // Neblina baja delante, pegada al piso.
    if (Math.random() < dt * 10) emit(c, glowTex(c.scene), rand(0, GAME_WIDTH), GAME_HEIGHT - rand(40, 160), {
      vx: rand(-60, 60), vy: rand(-15, 5), life: 2.6, scale: rand(5, 9), tint: pick(FOG), add: false, alpha: rand(0.25, 0.4),
    });
    // Poseída: un aura oscura que late alrededor de ella.
    aura(c, Math.floor(c.t / 160) % 2 ? 0xb15cff : 0x5a189a, 90, 0.12 + u * 0.1, 0.5 + u * 0.25);
    // La pantalla se oscurece en morado.
    const cm = lensColor(c);
    if (cm) {
      // Penumbra morada: más oscuro y con un tinte violeta suave (sin volverse azul).
      cm.colorMatrix.brightness(0.92 - u * 0.12);
      cm.colorMatrix.multiply([1.05, 0, 0, 0, 10, 0, 0.82, 0, 0, 0, 0, 0, 1.08, 0, 15, 0, 0, 0, 1, 0], true);
      cm.colorMatrix.alpha = 0.55;
    }
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, { tint: since < 140 ? HOLY : 0xd9c2ff, fill: since < 140, y: since < 250 ? -14 : 0, x: since < 200 ? rand(-5, 5) : 0 });
  },
  note(c, x, y, hit, final) {
    return hit ? shot(c, crossTex(c.scene), x, y, final ? HOLY : Math.random() < 0.5 ? 0xc89bff : HOLY, final ? 1.9 : 1.25) : spark(c, x, y, HOLY);
  },
  fly(c, x, y, age, final, obj) {
    // La cruz vuela derecha, latiendo.
    obj.setAngle(0).setScale((final ? 1.9 : 1.25) * (1 + Math.sin(age * 20) * 0.08));
    comet(c, x, y, Math.random() < 0.5 ? PURPLE : HOLY, final ? 1.2 : 0.7);
  },
  impact(c, x, y, final) {
    markHit(c, final);
    burst(c, x, y, HOLY, 10, 600);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    const b = body(c.target);
    // Cruz de luz gigante marcada sobre el cuerpo del rival, con resplandor y destellos.
    const cross = scene.add.graphics().setDepth(47).setBlendMode(ADD);
    const glow = scene.add.image(b.x, b.top + b.h * 0.42, glowTex(scene)).setDepth(46).setBlendMode(ADD).setTint(HOLY).setScale(0).setAlpha(0.9);
    const cx = b.x;
    const cy = b.top + b.h * 0.42;
    const v = b.h * 1.45;
    const hz = b.h * 0.5;
    const st = { k: 0, pulse: 0 };
    const draw = () => {
      const vv = v * st.k;
      const hh = hz * st.k;
      const p = 1 + Math.sin(st.pulse) * 0.12;
      cross.clear();
      for (const [w, col, a] of [[150, PURPLE, 0.12], [100, 0xc89bff, 0.18], [60, HOLY, 0.35], [30, HOLY, 0.7], [12, 0xffffff, 1]] as const) {
        const ww = w * p;
        cross.fillStyle(col, a).fillRect(cx - ww / 2, cy - vv * 0.36, ww, vv).fillRect(cx - hh, cy - vv * 0.14 - ww / 2, hh * 2, ww);
      }
    };
    scene.tweens.add({ targets: st, k: 1, duration: 220, ease: 'Back.easeOut', onUpdate: draw });
    scene.tweens.add({ targets: st, pulse: Math.PI * 6, duration: 1100, onUpdate: draw });
    scene.tweens.add({ targets: glow, scale: 14, duration: 260, ease: 'Cubic.easeOut' });
    scene.tweens.add({ targets: [cross, glow], alpha: 0, delay: 950, duration: 450, onComplete: () => { cross.destroy(); glow.destroy(); } });
    // Destellos que salen de los cuatro brazos.
    for (const [ex, ey] of [[cx, cy - v * 0.36], [cx, cy + v * 0.64], [cx - hz, cy - v * 0.14], [cx + hz, cy - v * 0.14]]) burst(c, ex, ey, HOLY, 12, 700);
    burst(c, cx, cy - v * 0.14, 0xffffff, 30, 1300);
    colorFlash(scene, 'burn', 700);
    veil(scene, HOLY, 0.35, 80, 20, 400, 46);
    shockwave(scene, 0.55, 900);
    for (let k = 0; k < 5; k++) c.fx.ring(t.x, t.y, k % 2 ? PURPLE : HOLY, 240 + k * 170, 0.5);
    c.fx.hit(t.x, t.y, HOLY, true);
    scene.cameras.main.shake(700, 0.03);
    slam(scene, GAME_WIDTH / 2, 420, '¡EXCOMULGADO!', '#ffd166', 130);
  },
};
