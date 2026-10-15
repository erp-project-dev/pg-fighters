import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, floatText, pick, rand, type ShowCtx, type SuperShow } from './kit';

const MONO = 'Menlo, Consolas, "Courier New", monospace';

/** Código que llueve en pantalla: mitad programación, mitad música. */
const CODE = [
  'while (true) shred();', 'if (rival.afinado) throw new Error();', 'tempo = 240; // bpm', 'for (n of escala) play(n);',
  'await solo.render();', 'distorsion.gain = 11;', 'const riff = [E, G, A, Bb];', 'ampli.volume = Infinity;',
  'midi.noteOn(64, 127);', 'buffer.overflow();', 'rival.hp -= Number.MAX_VALUE;', 'git push --force',
  'sudo rm -rf /rival', 'metronomo.sync(cpu);', 'delete rival.ego;', '0xFF 0x3C 0x90 0x7F', '01001110 01001111',
  'npm run shred', 'latency: 0ms', 'catch (e) { tocarMasFuerte(); }', 'eq.boost(80, "Hz");', 'compile --release',
];
const TOKENS = ['</>', '{ }', '0x7F', 'NaN', '=>', '[]', '404', '&&', '#!', '01'];
const WARNINGS = ['⚠ BUFFER OVERFLOW', '⚠ CPU 100%', '⚠ CLIPPING', '⚠ STACK OVERFLOW', '⚠ MEMORY LEAK', '⚠ LATENCIA CRÍTICA'];

interface Line {
  t: Phaser.GameObjects.Text;
  vy: number;
}

const code = (scene: Phaser.Scene, x: number, y: number, str: string, size: number, color: string) =>
  scene.add.text(x, y, str, { fontFamily: MONO, fontSize: `${size}px`, fontStyle: 'bold', color }).setOrigin(0.5);

/**
 * ERP PROJECT · STACK OVERFLOW (tecnología + música): la pantalla se pone en rojo, llueve código, saltan
 * alertas del sistema y el remate revienta en glitch.
 */
export const erp: SuperShow = {
  lift: 70,
  start(c: ShowCtx) {
    const red = c.scene.add.rectangle(-60, -60, GAME_WIDTH + 120, GAME_HEIGHT + 120, 0xb0001a, 0).setOrigin(0);
    const glitch = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(red);
    c.front.add(glitch);
    Object.assign(c.data, { red, glitch, lines: [] as Line[], lineAt: 0, warnAt: 500, glitchAt: 0 });
  },
  update(c: ShowCtx, dt: number) {
    // La pantalla se va poniendo roja y late.
    (c.data.red as Phaser.GameObjects.Rectangle).setAlpha((0.18 + Math.sin(c.t / 90) * 0.06) * Math.min(1, c.t / 600));
    // Lluvia de código (detrás de los luchadores) y ráfagas que salen de su guitarra.
    if (c.t - c.data.lineAt > 35) {
      c.data.lineAt = c.t;
      const t = code(c.scene, rand(40, GAME_WIDTH - 40), -20, pick(CODE), rand(18, 30), pick(['#ff4d5e', '#ffffff', '#ff8a96', '#7dffb0']));
      t.setAlpha(rand(0.45, 0.9));
      c.back.add(t);
      (c.data.lines as Line[]).push({ t, vy: rand(380, 900) });
    }
    for (const l of c.data.lines as Line[]) l.t.y += l.vy * dt;
    c.data.lines = (c.data.lines as Line[]).filter((l) => (l.t.y > GAME_HEIGHT + 40 ? (l.t.destroy(), false) : true));
    // Alertas del sistema alrededor de él
    if (c.t > c.data.warnAt && c.t < c.duration - 300) {
      c.data.warnAt = c.t + rand(450, 700);
      const p = chest(c.owner);
      floatText(c, p.x + rand(-320, 320), p.y - rand(150, 330), pick(WARNINGS), '#ff4d5e', 30);
    }
    // Glitch: franjas desplazadas rojas y cian
    const g = c.data.glitch as Phaser.GameObjects.Graphics;
    if (c.t - c.data.glitchAt > 120) {
      c.data.glitchAt = c.t;
      g.clear();
      for (let i = 0; i < 5; i++) {
        const y = rand(0, GAME_HEIGHT);
        const h = rand(4, 26);
        g.fillStyle(Math.random() < 0.5 ? 0xff1f3d : 0x3dfff0, rand(0.08, 0.22)).fillRect(rand(-200, 200), y, GAME_WIDTH, h);
      }
    }
  },
  note(c, x, y, hit) {
    const t = code(c.scene, x, y, pick(TOKENS), hit ? 46 : 22, hit ? '#ffffff' : '#ff8a96');
    t.setStroke('#b0001a', hit ? 8 : 4).setShadow(0, 0, '#ff1f3d', 16, true, true);
    return t;
  },
  impact(c, x, y, final) {
    if (!final) return void floatText(c, x, y - 50, pick(['SEGFAULT', 'NULL', '404', 'TIMEOUT']), '#ffffff', 28);
    // Remate: el golpe final con un estallido de glitch.
    const t = chest(c.target);
    c.fx.hit(t.x, t.y, 0xff1f3d, true);
    for (let k = 0; k < 3; k++) c.fx.ring(t.x, t.y, k % 2 ? 0x3dfff0 : 0xff1f3d, 180 + k * 120, 0.4);
    c.scene.cameras.main.shake(320, 0.016);
  },
};
