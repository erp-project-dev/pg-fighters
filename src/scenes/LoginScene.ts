import Phaser from 'phaser';
import { COLORS, CSS, GAME_WIDTH, SCENES } from '../config';
import { Audio, MUSIC } from '../systems/Audio';
import { Input } from '../systems/Input';
import { Ranking } from '../systems/Ranking';
import { StoryRun } from '../systems/StoryRun';
import { footer, goTo, logo, scanlines, speedStripes, stageBackdrop, text } from '../ui/ui';

export type StoryEntry = 'new' | 'continue';

/** Entra a la historia siempre por aquí: conecta la cuenta anónima y sigue sola tras traer la partida. */
export const enterStory = (scene: Phaser.Scene, next: StoryEntry): void => goTo(scene, SCENES.Login, { next });

/** Conexión del modo historia: sin login, entra con la sesión del navegador o crea una cuenta anónima. */
export class LoginScene extends Phaser.Scene {
  private input2!: Input;
  private next: StoryEntry = 'new';
  private status!: Phaser.GameObjects.Text;
  private busy = false;
  private leaving = false;

  constructor() {
    super(SCENES.Login);
  }

  init(data: { next?: StoryEntry }) {
    this.next = data?.next ?? 'new';
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
    text(this, cx, 500, 'MODO HISTORIA', { size: 72, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5], shadow: true });
    this.status = text(this, cx, 640, 'CONECTANDO…', { size: 40, italic: true, weight: '900', color: CSS.grey, origin: [0.5, 0.5], spacing: 2 });
    footer(this, 'ENTER  REINTENTAR      ESC  VOLVER');
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

  /**
   * Ya con sesión. Si la partida no está en memoria, la trae de Firestore. Se continúa si lo pidió o si
   * llegó una partida guardada (primera entrada de la sesión: no se pisa sin querer con una nueva).
   */
  private async done(): Promise<void> {
    if (this.leaving) return;
    this.leaving = true;
    this.busy = true;
    let loaded = false;
    if (!StoryRun.state) {
      this.status.setText('Buscando tu partida…').setColor(CSS.grey);
      try {
        loaded = await StoryRun.sync();
      } catch (e) {
        console.warn('[progreso] no se pudo leer', e);
        if (!this.sys.isActive()) return;
        this.leaving = false;
        this.busy = false;
        this.status.setText('No se pudo traer tu partida. ENTER para reintentar.').setColor(CSS.red);
        return;
      }
    }
    if (!this.sys.isActive()) return;
    if ((this.next === 'continue' || loaded) && StoryRun.state) goTo(this, SCENES.StoryProgress, {});
    else goTo(this, SCENES.NameEntry);
  }

  update() {
    if (this.leaving) return;
    if (this.input2.justDown('confirm')) this.connect();
    if (this.input2.justDown('back')) {
      this.leaving = true;
      goTo(this, SCENES.Title, { skipPress: true });
    }
  }
}
