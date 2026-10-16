import Phaser from 'phaser';
import { COLORS, CSS, GAME_WIDTH, SCENES } from '../config';
import { Input } from '../systems/Input';
import { footer, goTo, keycap, stageBackdrop, text } from '../ui/ui';

/** [acción, teclas] — las teclas separadas por espacio se dibujan como keycaps; "/" y "+" se dibujan como texto. */
const BASICS: [string, string][] = [
  ['Izquierda', 'A'],
  ['Derecha', 'D'],
  ['Saltar', 'W'],
  ['Agacharse', 'S'],
  ['Bloquear (alejarse)', 'A'],
  ['Puño', 'CLIC-IZQ'],
  ['Patada', 'CLIC-DER'],
  ['Dash', 'D D'],
  ['Dash atrás', 'A A'],
  ['Ultimate', 'E'],
  ['Confirmar', 'ENTER'],
  ['Pausa / Volver', 'ESC'],
];

const SPECIALS: [string, string, string][] = [
  ['PODER', 'S → D + CLIC IZQ', 'Propio de cada luchador: disparo, embestida, trampa… (ver Pausa).'],
  ['UPPERCUT', 'D → S → S+D + CLIC IZQ', 'Antiaéreo invulnerable al arrancar.'],
  ['ULTIMATE', 'E', 'Barra llena. El remate solo sale si el último golpe acierta.'],
  ['BARRIDA', 'S + CLIC DER', 'Tumba. Solo se bloquea agachado.'],
  ['CADENA', 'IZQ · IZQ · DER', 'Tres clics: el tercero tumba.'],
  ['CANCELAR', 'IZQ → PODER', 'Si el golpe conecta, enlaza el poder.'],
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
      const y = 284 + i * 50;
      text(this, 116, y, label.toUpperCase(), { size: 30, weight: '700', origin: [0, 0.5] });
      let x = 764;
      for (const k of keys.split(' ').reverse()) {
        if (k === '/' || k === '+') {
          const t = text(this, x, y, k, { size: 28, color: CSS.grey, origin: [1, 0.5] });
          x -= t.width - (t.padding.left ?? 0) * 2 + 6;
          continue;
        }
        const cap = keycap(this, 0, y, k, 22);
        cap.container.x = x - cap.width / 2;
        x -= cap.width + 8;
      }
    });

    text(this, 116, 896, 'Mirando a la izquierda: bloquear, dash y dash atrás invierten A y D.', { size: 22, font: 'body', color: '#b9b6aa', origin: [0, 0.5] });

    panel(840, 1000, 'ESPECIALES  ·  MIRANDO A LA DERECHA');
    SPECIALS.forEach(([name, input, desc], i) => {
      const y = 310 + i * 88;
      text(this, 876, y - 14, name, { size: 34, italic: true, weight: '900', color: CSS.lime, origin: [0, 0.5] });
      text(this, 876, y + 22, desc, { size: 22, font: 'body', color: '#b9b6aa', origin: [0, 0.5] });
      text(this, 1804, y, input, { size: 34, weight: '800', origin: [1, 0.5], spacing: 2 });
    });

    footer(this, 'ESC  VOLVER');
    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => goTo(this, SCENES.Title, { skipPress: true }));
  }

  update() {
    if (this.input2.justDown('back') || this.input2.justDown('confirm')) goTo(this, SCENES.Title, { skipPress: true });
  }
}
