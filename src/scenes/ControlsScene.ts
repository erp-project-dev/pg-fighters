import Phaser from 'phaser';
import { COLORS, CSS, GAME_WIDTH, SCENES } from '../config';
import { Input } from '../systems/Input';
import { footer, goTo, keycap, stageBackdrop, text } from '../ui/ui';

/** [acción, teclas] — las teclas separadas por espacio se dibujan como keycaps; "/" separa alternativas. */
const BASICS: [string, string][] = [
  ['Moverse', 'A D / ← →'],
  ['Saltar', 'W / ↑'],
  ['Agacharse', 'S / ↓'],
  ['Bloquear', 'ATRÁS'],
  ['Puño', 'J / CLIC-IZQ'],
  ['Patada', 'K / CLIC-DER'],
  ['Dash', 'ESPACIO / →→'],
  ['Ultimate', 'E'],
  ['Pausa', 'ESC'],
];

const SPECIALS: [string, string, string][] = [
  ['PODER', '↓ ↘ → + P', 'Proyectil. Mirando a la izquierda: ↓ ↙ ← + P'],
  ['UPPERCUT', '→ ↓ ↘ + P', 'Antiaéreo invulnerable al arrancar. Si falla, te castigan.'],
  ['ULTIMATE', 'E', 'Solo con la barra ULTIMATE llena. Retrato y solo de guitarra.'],
  ['BARRIDA', '↓ + K', 'Tumba. Solo se bloquea agachado.'],
  ['CADENA', 'P P K', 'Tres golpes seguidos: el tercero tumba.'],
  ['CANCELAR', 'P → PODER', 'Si el golpe conecta, enlázalo con un especial.'],
];

export class ControlsScene extends Phaser.Scene {
  private input2!: Input;

  constructor() {
    super(SCENES.Controls);
  }

  create() {
    this.cameras.main.fadeIn(250, 11, 10, 14);
    stageBackdrop(this, 0.82);
    this.input2 = new Input(this);
    text(this, GAME_WIDTH / 2, 90, 'MANUAL DE SUPERVIVENCIA', { size: 84, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5] });

    const panel = (x: number, w: number, title: string) => {
      const g = this.add.graphics();
      g.fillStyle(COLORS.panel, 0.92).fillRect(x, 170, w, 760);
      g.fillStyle(COLORS.lime, 1).fillRect(x, 170, w, 6);
      text(this, x + 36, 222, title, { size: 40, italic: true, weight: '900', origin: [0, 0.5], spacing: 2 });
    };

    panel(80, 720, 'BÁSICOS');
    BASICS.forEach(([label, keys], i) => {
      const y = 300 + i * 70;
      text(this, 116, y, label.toUpperCase(), { size: 34, weight: '700', origin: [0, 0.5] });
      let x = 764;
      for (const k of keys.split(' ').reverse()) {
        if (k === '/') {
          const t = text(this, x, y, '/', { size: 28, color: CSS.grey, origin: [1, 0.5] });
          x -= t.width - (t.padding.left ?? 0) * 2 + 6;
          continue;
        }
        const cap = keycap(this, 0, y, k, 22);
        cap.container.x = x - cap.width / 2;
        x -= cap.width + 8;
      }
    });

    panel(840, 1000, 'ESPECIALES  ·  MIRANDO A LA DERECHA');
    SPECIALS.forEach(([name, input, desc], i) => {
      const y = 310 + i * 88;
      text(this, 876, y - 14, name, { size: 34, italic: true, weight: '900', color: CSS.lime, origin: [0, 0.5] });
      text(this, 876, y + 22, desc, { size: 22, font: 'body', color: '#b9b6aa', origin: [0, 0.5] });
      text(this, 1804, y, input, { size: 40, weight: '800', origin: [1, 0.5], spacing: 2 });
    });

    footer(this, 'ESC  VOLVER');
    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => goTo(this, SCENES.Title, { skipPress: true }));
  }

  update() {
    if (this.input2.justDown('back') || this.input2.justDown('confirm')) goTo(this, SCENES.Title, { skipPress: true });
  }
}
