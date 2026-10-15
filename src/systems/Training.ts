import { SEQ, StepPlayer, type Step, type Cpu } from '../entities/Cpu';
import { MAX_METER, NO_INTENT, type Fighter, type Intent } from '../entities/Fighter';
import type { MoveDef } from '../data/moves';

/** Qué hace el muñeco del modo entrenamiento. */
export type DummyMode = 'stand' | 'crouch' | 'autoBlock' | 'block' | 'crouchBlock' | 'jump' | 'cpu';

const DUMMY_ORDER: DummyMode[] = ['stand', 'crouch', 'autoBlock', 'block', 'crouchBlock', 'jump', 'cpu'];
export const DUMMY_LABEL: Record<DummyMode, string> = {
  stand: 'QUIETO',
  crouch: 'AGACHADO',
  autoBlock: 'BLOQUEA TODO',
  block: 'BLOQUEO DE PIE',
  crouchBlock: 'BLOQUEO AGACHADO',
  jump: 'SALTA',
  cpu: 'CPU',
};

export const SPEEDS = [1, 0.5, 0.25];

export interface DemoCombo {
  name: string;
  /** Distancia inicial entre los luchadores. */
  gap: number;
  /** Llena la barra ULTIMATE antes de empezar. */
  meter?: boolean;
  steps: () => Step[];
}

const P = (ms = 140, dirs: Step['dirs'] = []): Step => ({ dirs, punch: true, ms });
const K = (ms = 140, dirs: Step['dirs'] = []): Step => ({ dirs, kick: true, ms });

/** Combos de demostración: el juego los ejecuta solo con el luchador del jugador. */
export const DEMOS: DemoCombo[] = [
  { name: 'IZQ · IZQ · DER', gap: 230, steps: () => [P(), P(), K(420)] },
  { name: 'S+IZQ · S+IZQ · S+DER', gap: 230, steps: () => [P(140, ['down']), P(140, ['down']), K(520, ['down'])] },
  { name: 'IZQ · IZQ · PODER', gap: 230, steps: () => [P(), P(40), { dirs: ['down'], ms: 30 }, { dirs: ['down', 'fwd'], ms: 30 }, P(60, ['fwd'])] },
  { name: 'SALTO DER · IZQ · IZQ · DER', gap: 430, steps: () => [{ dirs: ['up', 'fwd'], ms: 60 }, { dirs: [], ms: 380 }, K(320), P(), P(), K(420)] },
  { name: 'DASH · IZQ · IZQ · DER', gap: 620, steps: () => [{ dirs: ['fwd'], dash: true, ms: 240 }, P(), P(), K(420)] },
  { name: 'UPPERCUT', gap: 230, steps: () => SEQ.uppercut() },
  { name: 'ULTIMATE (E)', gap: 620, meter: true, steps: () => [{ dirs: [], super: true, ms: 80 }] },
  { name: 'IZQ · IZQ · ULTIMATE', gap: 230, meter: true, steps: () => [P(), P(80), { dirs: [], super: true, ms: 80 }] },
];

/** Entrada registrada para el historial (dirección absoluta en notación numérica). */
export interface InputEntry {
  dir: number;
  buttons: string;
  frames: number;
}

export interface MoveReport {
  move: MoveDef;
  result: 'hit' | 'block' | 'whiff';
  damage: number;
}

/** Estado y reglas del modo entrenamiento (la escena de pelea lo consulta cada frame). */
export class Training {
  dummy: DummyMode = 'stand';
  infiniteMeter = true;
  speedIndex = 0;
  boxes = false;
  inputLog: InputEntry[] = [];
  lastMove: MoveReport | null = null;
  combo = { hits: 0, damage: 0, best: 0 };
  demoName: string | null = null;
  private demo: StepPlayer;
  private demoStartAt = 0;
  private pendingDemo: DemoCombo | null = null;

  constructor(
    private p1: Fighter,
    private p2: Fighter,
    private cpu: Cpu,
  ) {
    this.demo = new StepPlayer(p1);
  }

  get speed(): number {
    return SPEEDS[this.speedIndex];
  }

  cycleDummy(dir = 1): void {
    const i = DUMMY_ORDER.indexOf(this.dummy);
    this.dummy = DUMMY_ORDER[(i + dir + DUMMY_ORDER.length) % DUMMY_ORDER.length];
  }

  cycleSpeed(): void {
    this.speedIndex = (this.speedIndex + 1) % SPEEDS.length;
  }

  /** Programa un combo de demostración (la escena reinicia posiciones antes). */
  startDemo(demo: DemoCombo, now: number): void {
    this.demo.clear();
    this.pendingDemo = demo;
    this.demoStartAt = now + 250;
    this.demoName = demo.name;
    if (demo.meter) this.p1.meter = MAX_METER;
  }

  stopDemo(): void {
    this.demo.clear();
    this.pendingDemo = null;
    this.demoName = null;
  }

  /** Intención del jugador; durante una demo la reemplaza el guion. */
  playerIntent(raw: Intent, now: number): Intent {
    if (this.pendingDemo && now >= this.demoStartAt) {
      this.demo.play(this.pendingDemo.steps(), now, true);
      this.pendingDemo = null;
    }
    if (this.pendingDemo) return NO_INTENT;
    if (this.demo.busy) return this.demo.intent(now);
    if (this.demoName && this.p1.free) this.demoName = null;
    return raw;
  }

  dummyIntent(now: number): Intent {
    const me = this.p2;
    const back = this.p1.x > me.x ? 'left' : 'right';
    switch (this.dummy) {
      case 'crouch': return { ...NO_INTENT, down: true };
      case 'block': return { ...NO_INTENT, [back]: true };
      case 'crouchBlock': return { ...NO_INTENT, [back]: true, down: true };
      case 'autoBlock': return { ...NO_INTENT, [back]: true, down: this.p1.move?.level === 'low' };
      case 'jump': return { ...NO_INTENT, up: true };
      case 'cpu': return this.cpu.intent(now);
      default: return NO_INTENT;
    }
  }

  /** Historial de entradas al estilo de los modos entrenamiento clásicos. */
  logInput(i: Intent): void {
    const h = (i.right ? 1 : 0) - (i.left ? 1 : 0);
    const v = i.down ? 0 : i.up ? 6 : 3;
    const dir = v + 2 + h;
    const buttons = [i.punch && 'IZQ', i.kick && 'DER', i.dash && 'DASH', i.super && 'E'].filter(Boolean).join('+');
    const top = this.inputLog[0];
    if (top && top.dir === dir && !buttons && !top.buttons) {
      top.frames++;
      return;
    }
    if (top && dir === 5 && !buttons && top.dir === 5 && !top.buttons) return;
    this.inputLog.unshift({ dir, buttons, frames: 1 });
    if (this.inputLog.length > 18) this.inputLog.pop();
  }

  onAttack(owner: Fighter, move: MoveDef): void {
    if (owner === this.p1) this.lastMove = { move, result: 'whiff', damage: 0 };
  }

  onImpact(attacker: Fighter, target: Fighter, move: MoveDef, result: 'hit' | 'block', damage: number): void {
    if (attacker !== this.p1) return;
    if (this.lastMove && (this.lastMove.move === move || move.id === 'superNote' || move.id === 'special')) {
      this.lastMove = { move: this.lastMove.move, result, damage: this.lastMove.damage + damage };
    }
    if (result !== 'hit') return;
    if (target.comboTaken <= 1) this.combo = { hits: 1, damage, best: this.combo.best };
    else this.combo = { hits: target.comboTaken, damage: this.combo.damage + damage, best: this.combo.best };
    this.combo.best = Math.max(this.combo.best, this.combo.hits);
  }

  /** Vida que se recarga al terminar cada combo y barra ULTIMATE infinita. */
  update(): void {
    for (const f of [this.p1, this.p2]) {
      if (f.hp < f.maxHp && f.comboTaken === 0 && (f.free || f.state === 'jump')) f.hp = f.maxHp;
    }
    if (this.infiniteMeter && this.p1.state !== 'attack') this.p1.meter = MAX_METER;
  }
}
