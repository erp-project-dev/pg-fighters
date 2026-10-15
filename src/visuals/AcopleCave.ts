import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { StageDef } from '../data/stages';

/** Keep the story-owned stage ID and music; replace its provisional scenery. */
export function configureAcopleCave(stage: StageDef): void {
  if (stage.texture !== 'stage-ampli') return;
  stage.name = 'LA CUEVA DEL ACOPLE';
  stage.place = 'UNA CUEVA MÍSTICA QUE RESPIRA ROCK';
  stage.image = 'assets/stages/acople-cave.png';
  stage.color = 0xe83240;
  stage.css = '#e83240';
}

/** A slow red breath, contained in the stage so thumbnails stay still. */
export function addAcopleCaveBreath(scene: Phaser.Scene, container: Phaser.GameObjects.Container): void {
  const glow = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  for (let i = 8; i > 0; i--) {
    glow.fillStyle(0xe83240, 0.008);
    glow.fillEllipse(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.28, 85 + i * 48, 110 + i * 42);
    glow.fillEllipse(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.79, 480 + i * 75, 25 + i * 12);
  }
  container.add(glow);
  scene.tweens.add({ targets: glow, alpha: { from: 0.2, to: 0.9 }, duration: 1600,
    yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  glow.once(Phaser.GameObjects.Events.DESTROY, () => scene.tweens.killTweensOf(glow));
}
