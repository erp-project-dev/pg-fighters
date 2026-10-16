import Phaser from 'phaser';

export type Action = 'left' | 'right' | 'up' | 'down' | 'punch' | 'kick' | 'super' | 'confirm' | 'back' | 'pause';

/**
 * Teclas físicas (KeyboardEvent.code) → acciones. Un solo esquema para todo el juego:
 * WASD (doble toque A A / D D = dash), clic izquierdo (puño), clic derecho (patada), E (ultimate), ENTER y ESC.
 */
const BINDINGS: Record<string, Action[]> = {
  KeyA: ['left'],
  KeyD: ['right'],
  KeyW: ['up'],
  KeyS: ['down'],
  KeyE: ['super'],
  Enter: ['confirm'],
  NumpadEnter: ['confirm'],
  Escape: ['back', 'pause'],
};

/** Flechas: solo en los menús (en la pelea se juega con WASD). */
const MENU_BINDINGS: Record<string, Action[]> = {
  ...BINDINGS,
  ArrowLeft: ['left'],
  ArrowRight: ['right'],
  ArrowUp: ['up'],
  ArrowDown: ['down'],
};

/**
 * Teclas físicas apretadas ahora mismo, en todo el juego. Se registran una sola vez para que
 * una tecla mantenida desde la pantalla anterior (o durante el anuncio de la ronda) cuente
 * apenas empieza la pelea.
 */
const heldCodes = new Set<string>();
window.addEventListener('keydown', (e) => {
  heldCodes.add(e.code);
});
window.addEventListener('keyup', (e) => heldCodes.delete(e.code));
window.addEventListener('blur', () => heldCodes.clear());

/**
 * Entrada por acciones: teclado + ratón (clic izquierdo = puño, derecho = patada).
 * `justDown` vale solo durante el frame en que se pulsó; se limpia tras cada update de la escena.
 */
export class Input {
  private pressed = new Set<Action>();
  private bindings: Record<string, Action[]>;

  /** `mouseAttacks`: la pelea (clic = puño / patada, sin flechas). Si no, un menú (también con flechas). */
  constructor(scene: Phaser.Scene, mouseAttacks = false) {
    const bindings = (this.bindings = mouseAttacks ? BINDINGS : MENU_BINDINGS);
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      for (const a of bindings[e.code] ?? []) this.pressed.add(a);
    };
    window.addEventListener('keydown', down);

    const pointer = (p: Phaser.Input.Pointer) => {
      if (!mouseAttacks) return;
      this.pressed.add(p.rightButtonDown() ? 'kick' : 'punch');
    };
    scene.input.mouse?.disableContextMenu();
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, pointer);

    const clear = () => this.pressed.clear();
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, clear);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', down);
      scene.input.off(Phaser.Input.Events.POINTER_DOWN, pointer);
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, clear);
    });
  }

  isDown(a: Action): boolean {
    for (const code of heldCodes) if (this.bindings[code]?.includes(a)) return true;
    return false;
  }

  justDown(a: Action): boolean {
    return this.pressed.has(a);
  }

  /** Olvida pulsaciones pendientes (al reanudar una escena pausada). */
  reset(): void {
    this.pressed.clear();
  }
}
