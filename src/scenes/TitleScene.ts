import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS } from '../data/fighters';
import { Audio, MUSIC } from '../systems/Audio';
import { artScale } from '../systems/FighterArt';
import { Input } from '../systems/Input';
import { Ranking } from '../systems/Ranking';
import { StoryRun } from '../systems/StoryRun';
import { Profile, connectProfile } from './LoginScene';
import { Menu, footer, goTo, logo, scanlines, speedStripes, stageBackdrop, text } from '../ui/ui';

/** Pantalla de título: "PRESIONA ENTER" y luego el menú principal. */
export class TitleScene extends Phaser.Scene {
  private input2!: Input;
  private menu: Menu | null = null;
  private press!: Phaser.GameObjects.Text;
  private leaving = false;

  constructor() {
    super(SCENES.Title);
  }

  create(data: { skipPress?: boolean }) {
    this.menu = null;
    this.leaving = false;
    // Se carga Firebase de fondo mientras se ve el título (la conexión de la cuenta va antes del menú).
    Ranking.init().catch(() => undefined);
    this.cameras.main.fadeIn(400, 11, 10, 14);
    Audio.music(this, MUSIC.menu, 0.35);
    stageBackdrop(this, 0.68);
    speedStripes(this, COLORS.lime, 0.035);
    this.input2 = new Input(this);

    // Los dos luchadores a los lados, en silueta iluminada.
    const sides: [keyof typeof FIGHTERS, number, boolean][] = [['mayin', 330, false], ['erp', GAME_WIDTH - 330, true]];
    for (const [id, x, flip] of sides) {
      const def = FIGHTERS[id];
      const s = artScale(this, def) * 1.55;
      const glow = this.add.image(x, GAME_HEIGHT + 40, def.art.texture, `${def.art.prefix}idle`).setScale(s * 1.03).setFlipX(flip);
      glow.setTint(def.color).setTintMode(Phaser.TintModes.FILL).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
      const fig = this.add.image(x, GAME_HEIGHT + 40, def.art.texture, `${def.art.prefix}idle`).setScale(s).setFlipX(flip).setTint(0xffffff);
      this.tweens.add({ targets: [glow, fig], y: '-=12', duration: 1600 + (flip ? 300 : 0), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      fig.x += flip ? 260 : -260;
      glow.x = fig.x;
      this.tweens.add({ targets: [fig, glow], x, duration: 700, ease: 'Cubic.easeOut' });
    }

    const [pg, ft] = logo(this, GAME_WIDTH / 2, 330);
    for (const [i, t] of [pg, ft].entries()) {
      t.setScale(0.6).setAlpha(0);
      this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 420, delay: 150 + i * 120, ease: 'Back.easeOut' });
    }
    // Sello BETA en la esquina del logo: el juego todavía está en pruebas.
    const beta = this.add.container(GAME_WIDTH / 2 + ft.width / 2 - 40, ft.y + 18).setAngle(-8).setScale(0);
    beta.add(this.add.rectangle(0, 0, 190, 64, COLORS.red).setStrokeStyle(4, 0xffffff));
    beta.add(text(this, 0, 2, 'BETA', { size: 44, italic: true, weight: '900', color: '#ffffff', origin: [0.5, 0.5], spacing: 6 }));
    this.tweens.add({ targets: beta, scale: 1, duration: 360, delay: 520, ease: 'Back.easeOut' });
    text(this, GAME_WIDTH / 2, 600, 'VOL. 01  ·  BARRIO BRAVO  ·  LIMA', { size: 34, weight: '700', color: CSS.cream, origin: [0.5, 0.5], spacing: 8 });

    this.press = text(this, GAME_WIDTH / 2, 800, 'PRESIONA  ENTER', { size: 56, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], spacing: 4, shadow: true });
    this.tweens.add({ targets: this.press, alpha: 0.15, duration: 520, yoyo: true, repeat: -1 });
    text(this, 24, GAME_HEIGHT - 26, '© 2026 PG FIGHTERS', { size: 20, weight: '600', color: CSS.grey, origin: [0, 0.5], spacing: 2 });
    text(this, GAME_WIDTH - 24, GAME_HEIGHT - 26, `v${__APP_VERSION__} BETA`, { size: 20, weight: '600', color: CSS.grey, origin: [1, 0.5], spacing: 2 });
    scanlines(this, 0.08);

    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => this.openMenu());
    if (data?.skipPress) this.openMenu();
  }

  private openMenu(): void {
    if (this.menu || this.leaving) return;
    // Antes del menú: la cuenta y el nickname (una sola vez por sesión, salvo que se haya saltado).
    if (!StoryRun.ready && !Profile.guest) {
      this.leaving = true;
      Audio.blip(this, true);
      connectProfile(this);
      return;
    }
    Audio.blip(this, true);
    this.press.destroy();
    if (StoryRun.ready) {
      text(this, GAME_WIDTH - 24, 30, `JUGANDO COMO  ${StoryRun.name}`, { size: 24, weight: '800', color: CSS.lime, origin: [1, 0.5], spacing: 2 });
    }
    const saved = StoryRun.ready && StoryRun.saved.length > 0;
    // Sin perfil, la historia vuelve a pedir la conexión. CONTINUAR abre las partidas guardadas; NUEVA HISTORIA
    // elige luchador y queda deshabilitada con todos los espacios ocupados.
    const story = (resume: boolean) => () => {
      if (!StoryRun.ready) return connectProfile(this);
      if (resume) return goTo(this, SCENES.Saves);
      goTo(this, SCENES.Select, { mode: 'story', last: StoryRun.saved[0]?.player });
    };
    const box = this.add.graphics();
    box.fillStyle(COLORS.bg, 0.6).fillRect(GAME_WIDTH / 2 - 330, 640, 660, 385);
    this.menu = new Menu(this, [
      ...(saved ? [{ label: 'CONTINUAR HISTORIA', onSelect: story(true) }] : []),
      { label: saved ? 'NUEVA HISTORIA' : 'HISTORIA', onSelect: story(false), enabled: !(StoryRun.ready && StoryRun.full) },
      { label: 'VS CPU', onSelect: () => goTo(this, SCENES.Select) },
      { label: 'ENTRENAMIENTO', onSelect: () => goTo(this, SCENES.Select, { mode: 'training' }) },
      { label: 'RANKING', onSelect: () => goTo(this, SCENES.Ranking) },
      { label: 'CONTROLES', onSelect: () => goTo(this, SCENES.Controls) },
      { label: 'CRÉDITOS', onSelect: () => goTo(this, SCENES.Credits) },
    ], GAME_WIDTH / 2, 672, saved ? 46 : 52, 38);
    footer(this, 'W S  ELEGIR      A D  CAMBIAR      ENTER  CONFIRMAR');
  }

  update() {
    const i = this.input2;
    if (this.leaving) return;
    if (!this.menu) {
      if (i.justDown('confirm') || i.justDown('punch')) this.openMenu();
      return;
    }
    if (i.justDown('up')) this.menu.move(-1);
    if (i.justDown('down')) this.menu.move(1);
    if (i.justDown('left')) this.menu.side(-1);
    if (i.justDown('right')) this.menu.side(1);
    if (i.justDown('confirm')) this.menu.select();
  }
}
