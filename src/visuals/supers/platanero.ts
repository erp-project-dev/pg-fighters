import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { chest, emit, floatText, pick, rand, slam, tex, type ShowCtx, type SuperShow } from './kit';

const MONO = 'Menlo, Consolas, "Courier New", monospace';

const bananaTex = (scene: Phaser.Scene) =>
  tex(scene, 'sx-banana', 120, 90, (g) => {
    const arc = (r: number, w: number, c: number) => {
      g.lineStyle(w, c, 1);
      g.beginPath();
      g.arc(60, -10, r, Math.PI * 0.2, Math.PI * 0.8);
      g.strokePath();
    };
    arc(66, 24, 0x8a6a10);
    arc(66, 18, 0xffd84a);
    arc(70, 5, 0xfff3a8);
    g.fillStyle(0x4a3a10, 1).fillCircle(18, 30, 6).fillCircle(102, 30, 5);
  });

const LESSONS = ['LECCIÓN 1: AFINAR (OPCIONAL)', 'LECCIÓN 2: ¿ESTO ERA DO?', 'LECCIÓN 3: REBOBINA', 'LECCIÓN 4: PÁGAME', 'LECCIÓN 5: YA NO HAY LECCIÓN 5'];

/**
 * EL PLATANERO · EL CURSO COMPLETO EN VHS: la pantalla se vuelve una cinta vieja (tracking, PLAY y
 * contador), se rebobina sola, llueven plátanos y los golpes son plátanos. Remate: STOP.
 */
export const platanero: SuperShow = {
  lift: 90,
  spin: 720,
  start(c: ShowCtx) {
    bananaTex(c.scene);
    const noise = c.scene.add.graphics();
    const osd = c.scene.add.text(110, 120, '', { fontFamily: MONO, fontSize: '40px', fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 6);
    const lesson = c.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 230, '', { fontFamily: MONO, fontSize: '34px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#1a1a7a', padding: { x: 14, y: 6 } }).setOrigin(0.5).setVisible(false);
    c.front.add([noise, osd, lesson]);
    Object.assign(c.data, { noise, osd, lesson, rewindAt: 900, rewinding: 0, lessonAt: 0, k: 0 });
  },
  update(c: ShowCtx, dt: number) {
    const t = c.t;
    // Rebobinada de la cinta cada tanto: todo se sacude y salta el "REW".
    if (t > c.data.rewindAt && t < c.duration - 400) {
      c.data.rewindAt = t + rand(1100, 1600);
      c.data.rewinding = t + 260;
      c.scene.cameras.main.shake(220, 0.006);
    }
    const rewinding = t < c.data.rewinding;
    // Indicador de la cinta y contador (horas:minutos:segundos de "clase").
    const secs = Math.floor(t / 40);
    const counter = `${String(Math.floor(secs / 3600)).padStart(1, '0')}:${String(Math.floor(secs / 60) % 60).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
    (c.data.osd as Phaser.GameObjects.Text).setText(`${rewinding ? '◀◀ REW' : Math.floor(t / 500) % 2 ? '▶ PLAY' : '▶'}\n${counter}`);
    // Título de la "lección" que va cambiando.
    if (t - c.data.lessonAt > 900) {
      c.data.lessonAt = t;
      (c.data.lesson as Phaser.GameObjects.Text).setText(LESSONS[c.data.k++ % LESSONS.length]).setVisible(true);
    }
    // Tracking: franjas de ruido que suben, más fuertes al rebobinar.
    const g = c.data.noise as Phaser.GameObjects.Graphics;
    g.clear();
    const bands = rewinding ? 14 : 4;
    for (let i = 0; i < bands; i++) {
      const y = (t * 0.35 + i * 197 + (rewinding ? rand(0, 400) : 0)) % GAME_HEIGHT;
      g.fillStyle(0xffffff, rewinding ? rand(0.08, 0.2) : 0.05).fillRect(rand(-60, 0), y, GAME_WIDTH + 60, rewinding ? rand(6, 30) : 3);
    }
  },
  impact(c, x, y, final) {
    if (!final) return void (Math.random() < 0.4 && floatText(c, x, y - 50, pick(['¡ESO NO!', 'OTRA VEZ', 'CASI', '¿DO?']), '#f2d24e', 28));
    const t = chest(c.target);
    c.fx.hit(t.x, t.y, 0xe8c547, true);
    c.scene.cameras.main.shake(320, 0.016);
    slam(c.scene, t.x, t.y - 300, '■ STOP', '#f2d24e', 150, 0);
  },
};
