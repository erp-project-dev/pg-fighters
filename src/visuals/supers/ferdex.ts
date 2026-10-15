import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config";
import { chest, slam, tex, veil, type ShowCtx, type SuperShow } from "./kit";

const raysTex = (scene: Phaser.Scene) =>
  tex(scene, "sx-rays", 1000, 1000, (g) => {
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * Math.PI * 2;
      const a1 = a0 + Math.PI / 16;
      g.fillStyle(i % 2 ? 0xffd166 : 0xd62828, 0.28).fillTriangle(
        500,
        500,
        500 + Math.cos(a0) * 700,
        500 + Math.sin(a0) * 700,
        500 + Math.cos(a1) * 700,
        500 + Math.sin(a1) * 700,
      );
    }
  });

/** FERDEX · LA BENDICIÓN DE CURCUMAN: rayos rojos y dorados de afiche giran detrás de él y la pantalla late en rojo; remate: un rayo cae del cielo. */
export const ferdex: SuperShow = {
  start(c: ShowCtx) {
    const tint = c.scene.add
      .rectangle(-60, -60, GAME_WIDTH + 120, GAME_HEIGHT + 120, 0xd62828, 0)
      .setOrigin(0);
    const rays = c.scene.add
      .image(0, 0, raysTex(c.scene))
      .setScale(0.2)
      .setBlendMode(Phaser.BlendModes.ADD);
    const rays2 = c.scene.add
      .image(0, 0, raysTex(c.scene))
      .setScale(0.2)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.5);
    c.back.add([tint, rays, rays2]);
    c.scene.tweens.add({
      targets: rays,
      scale: 1.6,
      duration: 450,
      ease: "Back.easeOut",
    });
    c.scene.tweens.add({
      targets: rays2,
      scale: 0.8,
      duration: 450,
      ease: "Back.easeOut",
    });
    Object.assign(c.data, { tint, rays, rays2 });
  },
  update(c: ShowCtx) {
    const p = chest(c.owner);
    (c.data.tint as Phaser.GameObjects.Rectangle).setAlpha(
      (0.1 + Math.sin(c.t / 140) * 0.04) * Math.min(1, c.t / 500),
    );
    (c.data.rays as Phaser.GameObjects.Image)
      .setPosition(p.x, p.y - 60)
      .setAngle(c.t / 40);
    (c.data.rays2 as Phaser.GameObjects.Image)
      .setPosition(p.x, p.y - 60)
      .setAngle(-c.t / 25);
  },
  impact(c, x, y, final) {
    if (!final) return;
    const scene = c.scene;
    const t = chest(c.target);
    // Un rayo dorado cae del cielo sobre el rival.
    const bolt = scene.add
      .graphics()
      .setDepth(49)
      .setBlendMode(Phaser.BlendModes.ADD);
    const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(t.x, -20)];
    for (let i = 1; i < 9; i++)
      pts.push(
        new Phaser.Math.Vector2(
          t.x + (Math.random() - 0.5) * 110,
          ((t.y + 20) * i) / 9,
        ),
      );
    pts.push(new Phaser.Math.Vector2(t.x, t.y));
    bolt
      .lineStyle(30, 0xffd166, 0.35)
      .strokePoints(pts)
      .lineStyle(9, 0xffffff, 1)
      .strokePoints(pts);
    scene.tweens.add({
      targets: bolt,
      alpha: 0,
      duration: 420,
      onComplete: () => bolt.destroy(),
    });
    veil(scene, 0xffffff, 0.7, 80);
    c.fx.hit(t.x, t.y, 0xffd166, true);
    scene.cameras.main.shake(380, 0.02);
    slam(scene, t.x, t.y - 300, "¡POR CURCUMAN!", "#e76f51", 120);
  },
};
