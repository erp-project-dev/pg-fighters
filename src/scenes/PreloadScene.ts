import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { Audio, loadAudio } from '../systems/Audio';
import { registerAnimeAtlases } from '../systems/AnimeAtlas';
import { preloadRosterArt, registerRosterArt } from '../visuals/roster/RosterArt';
import { STAGES } from '../data/stages';
import { FIGHTERS, defaultOpponent } from '../data/fighters';
import { configureAcopleCave } from '../visuals/AcopleCave';
import { text } from '../ui/ui';

/** Pantalla de carga: todo el contenido se carga antes del título. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Preload);
  }

  preload() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const barW = 820;
    text(this, cx, cy - 90, 'PG FIGHTERS', { size: 120, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5] });
    const bar = this.add.graphics();
    const pct = text(this, cx, cy + 80, 'CARGANDO  0%', { size: 30, weight: '700', origin: [0.5, 0.5], spacing: 4 });
    this.load.on(Phaser.Loader.Events.PROGRESS, (v: number) => {
      bar.clear();
      bar.fillStyle(COLORS.dark, 1).fillRect(cx - barW / 2, cy + 20, barW, 16);
      bar.fillStyle(COLORS.lime, 1).fillRect(cx - barW / 2, cy + 20, barW * v, 16);
      pct.setText(`CARGANDO  ${Math.round(v * 100)}%`);
    });

    this.load.image('game-cover', 'assets/pg-fighters-og.jpg');
    this.load.image('bar', 'assets/barrio-anime.png');
    this.load.image('pata-base', 'assets/pata-anime.png');
    this.load.image('edu-base', 'assets/edu-anime.png');
    this.load.image('pata-extra', 'assets/pata-extra-anime.png');
    this.load.image('edu-extra', 'assets/edu-extra-anime.png');
    this.load.image('pata-low', 'assets/pata-low-anime.png');
    this.load.image('edu-low', 'assets/edu-low-anime.png');
    this.load.image('pata-dash', 'assets/pata-dash-anime.png');
    this.load.image('edu-dash', 'assets/edu-dash-anime.png');
    for (const id of ['mayin', 'erp']) {
      this.load.image(`super-cutin-${id}`, `assets/portrait-${id}.png`);
      this.load.image(`super-sheet-${id}`, `assets/super-${id}.png`);
    }
    // Fondos de escenarios con imagen (los demás usan el fondo provisional de systems/StageArt.ts).
    for (const s of Object.values(STAGES)) {
      configureAcopleCave(s);
      if (s.image) this.load.image(s.texture, s.image);
    }
    preloadRosterArt(this);
    loadAudio(this);
  }

  create() {
    registerAnimeAtlases(this);
    registerRosterArt(this);
    // Sombra suave bajo los luchadores.
    const g = this.add.graphics();
    for (let i = 0; i < 7; i++) g.fillStyle(0x000000, 0.12).fillEllipse(110, 22, 220 - i * 26, 44 - i * 5);
    g.generateTexture('shadow', 220, 44);
    g.destroy();
    Audio.init(this);
    // ?lab abre la práctica directa (?lab=<id> elige luchador); ?sprites, el laboratorio de sprites.
    const query = new URLSearchParams(location.search);
    const pick = (key: string) => Object.values(FIGHTERS).find((def) => def.id === query.get(key))?.id;
    if (query.has('lab')) {
      const p1 = pick('lab') ?? 'erp';
      this.scene.start(SCENES.Fight, { p1, p2: defaultOpponent(p1), training: true, lab: true, stage: 'barrio' });
    } else if (query.has('sprites')) {
      const char = pick('sprites');
      this.scene.start(SCENES.Lab, char ? { char } : {});
    } else this.scene.start(SCENES.Disclaimer);
  }
}
