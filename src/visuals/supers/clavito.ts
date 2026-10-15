import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../../config';
import { chest, slam, veil, type ShowCtx, type SuperShow } from './kit';

const LIGHTS = [0xff3fa4, 0x3dd6ff, 0xffe14d, 0x7cff4d, 0xa36bff];

/** CLAVITO · DEMBOW APOCALÍPTICO: columnas de luz de colores que barren la pantalla y destellos al ritmo del beat; remate: el drop. */
export const clavito: SuperShow = {
  start(c: ShowCtx) {
    const g = c.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    c.back.add(g);
    Object.assign(c.data, { g, beatAt: 0, beat: 0 });
  },
  update(c: ShowCtx) {
    // Beat de dembow: cada golpe sacude un poco y cambia los colores.
    if (c.t - c.data.beatAt > 300) {
      c.data.beatAt = c.t;
      c.data.beat++;
      c.scene.cameras.main.shake(70, c.data.beat % 4 === 3 ? 0.006 : 0.003);
    }
    const sinceBeat = (c.t - c.data.beatAt) / 300;
    const g = c.data.g as Phaser.GameObjects.Graphics;
    g.clear();
    // Destello de pantalla completa que se apaga en cada beat
    g.fillStyle(LIGHTS[c.data.beat % LIGHTS.length], 0.12 * (1 - sinceBeat)).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // Columnas de luz que barren de lado a lado
    for (let i = 0; i < 6; i++) {
      const x = GAME_WIDTH / 2 + Math.sin(c.t / 420 + i * 1.3) * GAME_WIDTH * 0.55;
      const col = LIGHTS[(i + c.data.beat) % LIGHTS.length];
      g.fillStyle(col, 0.1).fillRect(x - 40, 0, 80, GAME_HEIGHT);
      g.fillStyle(col, 0.18).fillRect(x - 8, 0, 16, GAME_HEIGHT);
    }
  },
  impact(c, x, y, final) {
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    veil(scene, 0xffffff, 0.9, 120, 30, 300);
    scene.cameras.main.shake(500, 0.024);
    c.fx.hit(t.x, t.y, 0xff3fa4, true);
    // Onda que parte el piso hacia los dos lados
    const wave = scene.add.graphics().setDepth(47).setBlendMode(Phaser.BlendModes.ADD);
    const s = { k: 0 };
    scene.tweens.add({
      targets: s, k: 1, duration: 650, ease: 'Cubic.easeOut',
      onUpdate: () => {
        wave.clear();
        for (let r = 0; r < 3; r++) {
          const w = s.k * (900 - r * 200);
          wave.lineStyle(14 - r * 4, LIGHTS[r], 1 - s.k).strokeEllipse(t.x, GROUND_Y, w * 2, w * 0.22);
        }
      },
      onComplete: () => wave.destroy(),
    });
    slam(scene, t.x, t.y - 300, '¡DROP!', '#ff3fa4', 170);
  },
};
