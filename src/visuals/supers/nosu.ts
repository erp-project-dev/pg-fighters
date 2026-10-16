import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { SOLOS } from '../../data/solos';
import { chest, emit, slam, veil, type ShowCtx, type SuperShow } from './kit';
import { ADD, colorFlash, lensPixel, markHit, shockwave, shot, spark, squareTex, victim } from './energy';

const MAGENTA = 0xff2ba6;
const CELL = 60;
const snap = (v: number) => Math.round(v / CELL) * CELL;
const MONO = 'Menlo, Consolas, "Courier New", monospace';
const BAR = { x: GAME_WIDTH / 2 - 450, y: 250, w: 900, h: 36 };
const SEGMENTS = 25;
/** Golpes del solo: cada uno que conecta llena una parte de la barra. */
const totalHits = (c: ShowCtx) => SOLOS[c.owner.def.superMove.solo].notes.filter((n) => n.hit).length || 1;
/** Lo que va "corrigiendo" mientras carga. */
const FIXES = ['cuantizando el ritmo', 'afinando a 440 Hz', 'quitando el feeling', 'borrando notas fuera de escala', 'comprimiendo la dinámica', 'alineando a la grilla', 'subiendo el volumen'];

/**
 * NOSU · LARGA VIDA AL CÓDIGO: una grilla de neón cubre la pantalla y todo se mueve a saltos exactos;
 * dispara cubos de luz que avanzan casilla por casilla. El rival se "cuantiza": se mueve a saltos y la
 * pantalla se va pixelando. Remate: el rival se desarma en cuadrados que se ordenan en la grilla.
 */
export const nosu: SuperShow = {
  start(c: ShowCtx) {
    const grid = c.scene.add.graphics().setBlendMode(ADD);
    c.back.add(grid);
    // Barra de carga: CORRIGIENDO… con su porcentaje y lo que va arreglando.
    const bar = c.scene.add.graphics();
    const label = c.scene.add.text(BAR.x, BAR.y - 62, '', { fontFamily: MONO, fontSize: '44px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 6 });
    const pct = c.scene.add.text(BAR.x + BAR.w, BAR.y - 62, '', { fontFamily: MONO, fontSize: '44px', fontStyle: 'bold', color: '#ff2ba6', stroke: '#000000', strokeThickness: 6 }).setOrigin(1, 0);
    const status = c.scene.add.text(BAR.x, BAR.y + BAR.h + 14, '', { fontFamily: MONO, fontSize: '28px', color: '#ffc4e6', stroke: '#000000', strokeThickness: 5 });
    c.front.add([bar, label, pct, status]);
    Object.assign(c.data, { grid, bar, label, pct, status, progress: 0 });
  },
  update(c: ShowCtx) {
    const g = c.data.grid as Phaser.GameObjects.Graphics;
    g.clear();
    const beat = Math.floor(c.t / 125);
    for (let x = 0; x <= GAME_WIDTH; x += CELL) g.lineStyle(x % (CELL * 4) ? 1 : 3, MAGENTA, x % (CELL * 4) ? 0.15 : 0.3).lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y <= GAME_HEIGHT; y += CELL) g.lineStyle(y % (CELL * 4) ? 1 : 3, MAGENTA, y % (CELL * 4) ? 0.15 : 0.3).lineBetween(0, y, GAME_WIDTH, y);
    // Celdas que se encienden en secuencia, como un secuenciador.
    for (let i = 0; i < 18; i++) {
      const col = (beat + i * 7) % Math.floor(GAME_WIDTH / CELL);
      const row = (i * 5 + Math.floor(beat / 4)) % Math.floor(GAME_HEIGHT / CELL);
      g.fillStyle(i % 3 ? MAGENTA : 0xffffff, 0.22).fillRect(col * CELL + 2, row * CELL + 2, CELL - 4, CELL - 4);
    }
    // Progreso: solo avanza con los golpes que conectan (todos = 100 %).
    const done = c.data.finalAt !== undefined;
    const goal = (c.data.hits ?? 0) / totalHits(c);
    c.data.progress += (goal - c.data.progress) * 0.35;
    // El acercamiento nunca llega solo: sin esto se queda en 99,9 % y falta el último segmento.
    if (Math.abs(goal - c.data.progress) < 0.002) c.data.progress = goal;
    const shown = Math.round(c.data.progress * 100);
    const perfect = done && (c.data.hits ?? 0) >= totalHits(c);
    const bar = c.data.bar as Phaser.GameObjects.Graphics;
    bar.clear();
    bar.fillStyle(0x000000, 0.6).fillRect(BAR.x - 8, BAR.y - 8, BAR.w + 16, BAR.h + 16);
    bar.lineStyle(3, MAGENTA, 1).strokeRect(BAR.x - 8, BAR.y - 8, BAR.w + 16, BAR.h + 16);
    const seg = BAR.w / SEGMENTS;
    for (let i = 0; i < Math.floor(c.data.progress * SEGMENTS); i++) bar.fillStyle(i % 2 ? MAGENTA : 0xff5fbf, 1).fillRect(BAR.x + i * seg + 2, BAR.y, seg - 4, BAR.h);
    (c.data.label as Phaser.GameObjects.Text).setText(perfect ? 'CORREGIDO' : done ? 'CORRECCIÓN INCOMPLETA' : `CORRIGIENDO${'.'.repeat(1 + (Math.floor(c.t / 250) % 3))}`);
    (c.data.pct as Phaser.GameObjects.Text).setText(`${shown}%`);
    (c.data.status as Phaser.GameObjects.Text).setText(perfect ? '> 0 errores. Hit listo.' : done ? `> quedan ${totalHits(c) - (c.data.hits ?? 0)} errores sin corregir` : `> ${FIXES[Math.floor(c.t / 260) % FIXES.length]}`);
    // La pantalla se cuantiza: pixelado a saltos, cada vez más grueso.
    const px = lensPixel(c);
    if (px) {
      const hits = c.data.hits ?? 0;
      px.active = hits > 0 && c.data.finalAt === undefined;
      px.amount = Math.min(4, hits) * (beat % 2 ? 0.7 : 0.4);
    }
    // El rival, cuantizado: salta de casilla en casilla.
    const since = c.t - (c.data.hitAt ?? -9999);
    victim(c, { x: since < 400 ? ((beat % 3) - 1) * CELL * 0.4 : 0, y: since < 400 ? -(beat % 2) * CELL * 0.3 : 0, tint: since < 120 ? MAGENTA : 0xffc4e6, fill: since < 120 });
  },
  note(c, x, y, hit, final) {
    return hit ? shot(c, squareTex(c.scene), x, y, final ? 0xffffff : MAGENTA, final ? 3.6 : 2.2) : spark(c, x, y, MAGENTA);
  },
  fly(c, x, y, _age, _final, obj) {
    // Avanza pegado a la grilla.
    obj.setAngle(0).setPosition(snap(x), snap(y));
  },
  impact(c, x, y, final) {
    markHit(c, final);
    c.fx.ring(snap(x), snap(y), MAGENTA, 140, 0.25);
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // Se desarma en cuadrados que vuelan a ordenarse en la grilla.
    for (let i = 0; i < 48; i++) {
      const tx = snap(t.x + ((i % 8) - 3.5) * CELL * 1.6);
      const ty = snap(t.y - 300 + Math.floor(i / 8) * CELL);
      emit(c, squareTex(c.scene), t.x, t.y, { vx: (tx - t.x) * 2.2, vy: (ty - t.y) * 2.2, life: 0.75, scale: 2.4, tint: i % 4 ? MAGENTA : 0xffffff, add: true });
    }
    colorFlash(scene, 'negative', 260, 0.7);
    veil(scene, MAGENTA, 0.4, 80, 20, 400, 48);
    shockwave(scene, 0.5, 800);
    for (let k = 0; k < 4; k++) c.fx.ring(t.x, t.y, MAGENTA, 240 + k * 170, 0.5);
    c.fx.hit(t.x, t.y, MAGENTA, true);
    scene.cameras.main.shake(500, 0.022);
    const hits = c.data.hits ?? 0;
    slam(scene, GAME_WIDTH / 2, 420, hits >= totalHits(c) ? 'ERROR CORREGIDO' : `CORREGIDO AL ${Math.round((hits / totalHits(c)) * 100)}%`, '#ff2ba6', 120);
  },
};
