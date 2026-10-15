import Phaser from 'phaser';
import { SCENES } from '../config';

/** Espera las fuentes antes de dibujar texto (máximo 4 s si no hay internet). */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Boot);
  }

  create() {
    const go = () => this.scene.start(SCENES.Preload);
    const fonts = Promise.all([
      document.fonts.load('italic 900 64px "Barlow Condensed"'),
      document.fonts.load('800 32px "Barlow Condensed"'),
      document.fonts.load('700 32px "Barlow Condensed"'),
      document.fonts.load('500 24px "Barlow"'),
      document.fonts.load('600 24px "Barlow"'),
    ]);
    const timeout = new Promise((r) => setTimeout(r, 4000));
    Promise.race([fonts, timeout]).then(go, go);
  }
}
