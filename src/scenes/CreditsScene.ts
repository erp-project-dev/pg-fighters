import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { Audio, MUSIC } from '../systems/Audio';
import { Input } from '../systems/Input';
import { footer, goTo, logo, scanlines, speedStripes, stageBackdrop, text } from '../ui/ui';
import { DISCLAIMER } from './DisclaimerScene';

type Line = [kind: 'title' | 'big' | 'body' | 'gap', str?: string];

const CREDITS: Line[] = [
  ['title', '¿POR QUÉ "PG"?'],
  ['big', 'PG FIGHTERS = PERU GUITAR FIGHTERS'],
  ['body', 'Creado para la comunidad de Peru Guitar: los que afinan antes de criticar, los que critican sin afinar y los que solo vienen por los memes.'],
  ['gap'],
  ['title', 'UN JUEGO DE'],
  ['big', 'ERP PROJECT'],
  ['body', 'Hecho en sus ratos libres y de hueveo intenso. Full bajada de pepa.'],
  ['body', 'Entre ensayo y ensayo, a altas horas de la noche y con el ampli al mínimo para no despertar al vecino (que igual golpeó la pared).'],
  ['gap'],
  ['title', 'DESARROLLO'],
  ['big', 'CLAUDE'],
  ['body', 'Generación de la lógica del juego.'],
  ['big', 'CODEX'],
  ['body', 'Por los increíbles assets.'],
  ['gap'],
  ['title', 'PRODUCCIÓN MUSICAL'],
  ['big', 'SUNO'],
  ['body', 'Por la música que suena en cada pelea.'],
  ['gap'],
  ['title', 'AGRADECIMIENTOS'],
  ['body', 'A la comunidad de Peru Guitar, por sus licks, sus debates eternos sobre afinación y su amor por la guitarra.'],
  ['body', 'A la escena peruana, que sigue haciendo bulla aunque nadie le pague el pasaje.'],
  ['body', 'Y a ti, por jugar. Si te reíste aunque sea una vez: misión cumplida.'],
  ['gap'],
  ['body', 'Ningún amplificador resultó dañado en la creación de este juego. Bueno, solo uno: el que se convirtió en El Acople.'],
  ['gap'],
  ['title', 'AVISO LEGAL'],
  ...DISCLAIMER.map((line): Line => ['body', line]),
  ['gap'],
  ['big', '¡GRACIAS, PERU GUITAR!'],
  ['title', 'LARGA VIDA A LA ESCENA'],
];

/** Créditos: suben solos como en los arcades. ENTER/ESC vuelve al menú; W S adelanta o retrocede. */
export class CreditsScene extends Phaser.Scene {
  private input2!: Input;
  private roll!: Phaser.GameObjects.Container;
  private height = 0;

  constructor() {
    super(SCENES.Credits);
  }

  create() {
    this.cameras.main.fadeIn(300, 11, 10, 14);
    Audio.music(this, MUSIC.menu, 0.35);
    stageBackdrop(this, 0.78, 'game-cover');
    speedStripes(this, COLORS.lime, 0.03);
    this.input2 = new Input(this);

    const cx = GAME_WIDTH / 2;
    // El fondo queda fijo mientras el logo y los créditos se desplazan.
    this.roll = this.add.container(0, 0);
    const [pg, ft] = logo(this, cx, 230, 0.8);
    this.roll.add([pg, ft]);
    let y = 470;
    for (const [kind, str = ''] of CREDITS) {
      if (kind === 'gap') {
        y += 70;
        continue;
      }
      const t =
        kind === 'title' ? text(this, cx, y, str, { size: 34, weight: '800', color: CSS.grey, origin: [0.5, 0], spacing: 8 })
        : kind === 'big' ? text(this, cx, y, str, { size: 64, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0], shadow: true, align: 'center', wrap: 1500 })
        : text(this, cx, y, str, { size: 34, font: 'body', weight: '500', color: CSS.cream, origin: [0.5, 0], align: 'center', wrap: 1300 });
      this.roll.add(t);
      y += t.height - (t.padding.top ?? 0) * 2 + (kind === 'title' ? 10 : 26);
    }
    this.height = y;

    // Franjas para que el texto entre y salga suave.
    const fade = this.add.graphics();
    fade.fillGradientStyle(COLORS.bg, COLORS.bg, COLORS.bg, COLORS.bg, 1, 1, 0, 0).fillRect(0, 0, GAME_WIDTH, 140);
    fade.fillGradientStyle(COLORS.bg, COLORS.bg, COLORS.bg, COLORS.bg, 0, 0, 1, 1).fillRect(0, GAME_HEIGHT - 200, GAME_WIDTH, 200);
    footer(this, 'W S  ADELANTAR / RETROCEDER      ENTER ESC  VOLVER');
    scanlines(this, 0.06);
  }

  update(_: number, delta: number) {
    const i = this.input2;
    if (i.justDown('back') || i.justDown('confirm')) {
      Audio.blip(this, true);
      goTo(this, SCENES.Title, { skipPress: true });
      return;
    }
    const speed = i.isDown('down') ? 420 : i.isDown('up') ? -300 : 70;
    this.roll.y -= (speed * delta) / 1000;
    // Al terminar, vuelve a empezar desde abajo.
    if (this.roll.y < -this.height) this.roll.y = GAME_HEIGHT * 0.6;
    if (this.roll.y > 0) this.roll.y = 0;
  }
}
