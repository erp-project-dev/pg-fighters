import Phaser from 'phaser';
import { COLORS, CSS, GAME_WIDTH, SCENES } from '../config';
import { Audio, MUSIC } from '../systems/Audio';
import { Input } from '../systems/Input';
import { Ranking } from '../systems/Ranking';
import { StoryRun } from '../systems/StoryRun';
import { footer, goTo, logo, scanlines, speedStripes, stageBackdrop, text } from '../ui/ui';

export const Profile = {
  /** Se saltó la conexión (sin internet o sin nickname): el menú no la vuelve a pedir; la historia sí. */
  guest: false,
};

/** Al abrir el menú y al entrar a la historia sin perfil: conecta la cuenta anónima y pide el nickname si no tiene. */
export const connectProfile = (scene: Phaser.Scene): void => goTo(scene, SCENES.Login);

/** Conexión de la cuenta: sin login, entra con la sesión del navegador o crea una cuenta anónima, y trae su perfil. */
export class LoginScene extends Phaser.Scene {
  private input2!: Input;
  private status!: Phaser.GameObjects.Text;
  private busy = false;
  private leaving = false;

  constructor() {
    super(SCENES.Login);
  }

  init() {
    this.busy = false;
    this.leaving = false;
  }

  create() {
    this.cameras.main.fadeIn(300, 11, 10, 14);
    Audio.music(this, MUSIC.menu, 0.35);
    stageBackdrop(this, 0.8);
    speedStripes(this, COLORS.lime, 0.03);
    this.input2 = new Input(this);
    const cx = GAME_WIDTH / 2;
    logo(this, cx, 300, 0.7);
    text(this, cx, 500, 'TU CUENTA', { size: 72, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true });
    this.status = text(this, cx, 640, 'CONECTANDO…', { size: 40, italic: true, weight: '900', color: CSS.grey, origin: [0.5, 0.5], spacing: 2 });
    footer(this, 'ENTER  REINTENTAR      ESC  JUGAR SIN CONEXIÓN');
    scanlines(this, 0.06);
    this.connect();
  }

  private connect(): void {
    if (this.busy || this.leaving) return;
    this.busy = true;
    this.status.setText('CONECTANDO…').setColor(CSS.grey);
    Ranking.signIn().then(
      () => this.sys.isActive() && void this.done(),
      (e: { code?: string }) => {
        console.warn('[ranking] cuenta anónima', e);
        this.busy = false;
        if (!this.sys.isActive()) return;
        this.status.setText(`Sin conexión (${e.code ?? 'error'}). ENTER para reintentar.`).setColor(CSS.red);
      },
    );
  }

  /** Ya con sesión: trae el perfil (nickname y partidas). Sin nickname, lo pide; si no, al menú. */
  private async done(): Promise<void> {
    if (this.leaving) return;
    this.leaving = true;
    if (!StoryRun.loaded) {
      this.status.setText('Buscando tu perfil…').setColor(CSS.grey);
      try {
        await StoryRun.sync();
      } catch (e) {
        console.warn('[progreso] no se pudo leer', e);
        if (!this.sys.isActive()) return;
        this.leaving = false;
        this.busy = false;
        this.status.setText('No se pudo traer tu perfil. ENTER para reintentar.').setColor(CSS.red);
        return;
      }
    }
    if (!this.sys.isActive()) return;
    if (StoryRun.name) goTo(this, SCENES.Title, { skipPress: true });
    else goTo(this, SCENES.NameEntry);
  }

  update() {
    if (this.leaving) return;
    if (this.input2.justDown('confirm')) this.connect();
    if (this.input2.justDown('back')) {
      this.leaving = true;
      Profile.guest = true;
      goTo(this, SCENES.Title, { skipPress: true });
    }
  }
}
