import Phaser from 'phaser';

export type Action = 'left' | 'right' | 'up' | 'down' | 'punch' | 'kick' | 'dash' | 'super' | 'confirm' | 'back' | 'pause';

/** Teclas físicas (KeyboardEvent.code) → acciones. Una tecla puede servir en menús y en pelea. */
const BINDINGS: Record<string, Action[]> = {
  ArrowLeft: ['left'],
  KeyA: ['left'],
  ArrowRight: ['right'],
  KeyD: ['right'],
  ArrowUp: ['up'],
  KeyW: ['up'],
  ArrowDown: ['down'],
  KeyS: ['down'],
  KeyJ: ['punch', 'confirm'],
  KeyK: ['kick'],
  Space: ['dash', 'confirm'],
  KeyL: ['dash'],
  KeyE: ['super'],
  Enter: ['confirm'],
  NumpadEnter: ['confirm'],
  Escape: ['back', 'pause'],
  Backspace: ['back'],
  KeyP: ['pause'],
};

const CAPTURED = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Backspace']);

/**
 * Teclas físicas apretadas ahora mismo, en todo el juego. Se registran una sola vez para que
 * una tecla mantenida desde la pantalla anterior (o durante el anuncio de la ronda) cuente
 * apenas empieza la pelea.
 */
const heldCodes = new Set<string>();
window.addEventListener('keydown', (e) => {
  if (CAPTURED.has(e.code)) e.preventDefault();
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

  constructor(scene: Phaser.Scene, mouseAttacks = false) {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      for (const a of BINDINGS[e.code] ?? []) this.pressed.add(a);
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
    for (const code of heldCodes) if (BINDINGS[code]?.includes(a)) return true;
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
