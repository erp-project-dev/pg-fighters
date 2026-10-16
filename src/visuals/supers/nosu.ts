import Phaser from 'phaser';
import { FONTS, GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, pick, rand, slam, veil, type ShowCtx, type SuperShow } from './kit';

const MONO = 'Menlo, Consolas, "Courier New", monospace';
const MAGENTA = 0xff2ba6;

/** Lo que la terminal "detecta" y corrige mientras suena el solo. */
const LOG = [
  '> analizando afinación…  ERROR',
  '> analizando ritmo…  BÁSICO',
  '> analizando solo…  NO ENSAYADO',
  '> analizando mezcla…  VOZ AL MÁXIMO',
  '> corrigiendo errores…',
];

/** Lecturas que aparecen flotando alrededor del rival. */
const READINGS = ['440 Hz', '-12 cents', '-31 cents', 'BPM 117.6', 'BPM 123.2', '3 RITMOS', 'CLIP +6 dB', '82 Hz', '196 Hz', 'DESAFINADO', 'FUERA DE TIEMPO', 'TONO: ???'];

/** Espectrograma: columnas que se desplazan hacia la izquierda. */
const SPEC_COLS = 64;
const SPEC_ROWS = 12;
const SPEC_H = 230;

/**
 * NOSU · LARGA VIDA AL CÓDIGO: la pantalla se vuelve un analizador. Rejilla de osciloscopio, la forma de
 * onda del solo cruzando la pantalla, una línea de escaneo que barre, espectrograma abajo y lecturas de
 * frecuencia, afinación y tempo sobre el rival; la terminal encuentra sus errores y la barra de corrección
 * llega al 100 %. Remate: ERROR CORREGIDO.
 */
export const nosu: SuperShow = {
  start(c: ShowCtx) {
    const scope = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    const term = c.scene.add.text(100, 110, '', { fontFamily: MONO, fontSize: '34px', fontStyle: 'bold', color: '#ff2ba6', lineSpacing: 8 }).setStroke('#000000', 6);
    const bar = c.scene.add.graphics();
    const pct = c.scene.add.text(100, 420, '', { fontFamily: FONTS.head, fontSize: '40px', fontStyle: 'italic 900', color: '#ffffff' }).setStroke('#000000', 6);
    const spec = Array.from({ length: SPEC_COLS }, () => Array.from({ length: SPEC_ROWS }, () => rand(0, 0.6)));
    c.back.add(scope);
    c.front.add([term, bar, pct]);
    Object.assign(c.data, { scope, term, bar, pct, spec, shiftAt: 0, tagAt: 0 });
  },
  update(c: ShowCtx) {
    const k = Math.min(1, c.t / c.duration);
    const g = c.data.scope as Phaser.GameObjects.Graphics;
    g.clear();
    // Rejilla de osciloscopio.
    for (let x = 0; x <= GAME_WIDTH; x += 120) g.fillStyle(MAGENTA, 0.07).fillRect(x, 0, 2, GAME_HEIGHT);
    for (let y = 0; y <= GAME_HEIGHT; y += 120) g.fillStyle(MAGENTA, 0.07).fillRect(0, y, GAME_WIDTH, 2);
    // Forma de onda: al principio sucia y torcida; a medida que corrige, se vuelve una senoide perfecta.
    const mid = GAME_HEIGHT * 0.42;
    const dirt = 1 - k;
    g.lineStyle(10, MAGENTA, 0.18);
    g.beginPath();
    const wave = (x: number) =>
      mid + Math.sin(x / 38 + c.t / 90) * 70 + dirt * (Math.sin(x / 9 + c.t / 23) * 40 + Math.sin(x / 3.1 - c.t / 13) * 18);
    for (let x = 0; x <= GAME_WIDTH; x += 8) g.lineTo(x, wave(x));
    g.strokePath();
    g.lineStyle(3, 0xffd8ef, 0.75);
    g.beginPath();
    for (let x = 0; x <= GAME_WIDTH; x += 8) g.lineTo(x, wave(x));
    g.strokePath();
    // Línea de escaneo que barre de izquierda a derecha.
    const sx = ((c.t / 900) % 1) * GAME_WIDTH;
    g.fillStyle(MAGENTA, 0.08).fillRect(sx - 120, 0, 120, GAME_HEIGHT);
    g.fillStyle(MAGENTA, 0.6).fillRect(sx, 0, 4, GAME_HEIGHT);
    // Espectrograma: avanza una columna cada 60 ms; los graves (abajo) más intensos.
    const spec = c.data.spec as number[][];
    if (c.t > c.data.shiftAt) {
      c.data.shiftAt = c.t + 60;
      spec.shift();
      spec.push(Array.from({ length: SPEC_ROWS }, (_, r) => Math.min(1, rand(0, 1) * (1 - r / SPEC_ROWS) * 1.4)));
    }
    const cw = GAME_WIDTH / SPEC_COLS;
    const ch = SPEC_H / SPEC_ROWS;
    spec.forEach((col, i) =>
      col.forEach((v, r) => {
        const color = v > 0.8 ? 0xff3b3b : v > 0.55 ? 0xffe14d : MAGENTA;
        g.fillStyle(color, 0.08 + v * 0.3).fillRect(i * cw + 1, GAME_HEIGHT - (r + 1) * ch, cw - 2, ch - 2);
      }),
    );
    // Lecturas sobre el rival, con su mira de análisis.
    const t = chest(c.target);
    const pulse = 0.5 + Math.sin(c.t / 110) * 0.5;
    g.lineStyle(3, MAGENTA, 0.4 + pulse * 0.4).strokeCircle(t.x, t.y, 150 + pulse * 20);
    g.lineStyle(2, MAGENTA, 0.5).lineBetween(t.x - 210, t.y, t.x - 120, t.y).lineBetween(t.x + 120, t.y, t.x + 210, t.y);
    g.lineBetween(t.x, t.y - 210, t.x, t.y - 120).lineBetween(t.x, t.y + 120, t.x, t.y + 210);
    if (c.t > c.data.tagAt) {
      c.data.tagAt = c.t + 260;
      const tag = c.scene.add.text(t.x + rand(-300, 300), t.y + rand(-280, 120), pick(READINGS), { fontFamily: MONO, fontSize: '30px', fontStyle: 'bold', color: '#ff2ba6' }).setOrigin(0.5).setStroke('#000000', 5);
      c.front.add(tag);
      c.scene.tweens.add({ targets: tag, y: tag.y - 70, alpha: 0, duration: 900, onComplete: () => tag.destroy() });
    }
    // Terminal: una línea más cada tramo del solo, y la barra de corrección llenándose.
    const lines = Math.min(LOG.length, 1 + Math.floor(k * LOG.length * 1.2));
    (c.data.term as Phaser.GameObjects.Text).setText(LOG.slice(0, lines).join('\n'));
    const b = c.data.bar as Phaser.GameObjects.Graphics;
    b.clear();
    b.fillStyle(0x000000, 0.7).fillRect(100, 380, 520, 30);
    b.fillStyle(MAGENTA, 1).fillRect(104, 384, 512 * k, 22);
    (c.data.pct as Phaser.GameObjects.Text).setText(`CORRECCIÓN ${Math.floor(k * 100)} %`);
  },
  impact(c, x, y, final) {
    if (!final) {
      c.fx.ring(x, y, MAGENTA, 90, 0.2);
      return;
    }
    const t = chest(c.target);
    veil(c.scene, MAGENTA, 0.25, 140);
    c.scene.cameras.main.shake(300, 0.014);
    c.fx.hit(t.x, t.y, MAGENTA, true);
    for (let k = 0; k < 3; k++) c.fx.ring(t.x, t.y, k % 2 ? 0xffffff : MAGENTA, 180 + k * 140, 0.5);
    (c.data.pct as Phaser.GameObjects.Text).setText('CORRECCIÓN 100 %');
    slam(c.scene, t.x, t.y - 300, 'ERROR CORREGIDO', '#ff2ba6', 110);
  },
};
