import { superMotion } from '../visuals/supers/choreography';
import Phaser from 'phaser';
import { FONTS, GROUND_Y } from '../config';
import { SOLOS, type SoloDef } from '../data/solos';
import { hasOwnArt } from '../systems/FighterArt';
import type { Fx } from '../systems/Fx';
import { pts } from '../ui/ui';
import { powerFor, type PowerLook } from '../data/powers';
import { buildLook } from '../visuals/powers';
import { SHOWS } from '../visuals/supers';
import { stepBits, type NoteObj, type ShowCtx, type SuperShow } from '../visuals/supers/kit';
import type { Fighter } from './Fighter';

/**
 * Golpe de una nota. Devuelve true si la nota se consume (impacto o bloqueo)
 * y false si el rival es intocable en ese momento (la nota se desvanece).
 */
export type NoteStrike = (owner: Fighter, x: number, y: number, damage: number, final: boolean) => boolean;

interface FlyingNote {
  obj: NoteObj;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  hit: boolean;
  final: boolean;
  spent: boolean;
}

const GLYPHS = ['♪', '♫', '♬', '♩'];

/**
 * Actuación del súper: el luchador toca la guitarra y las notas salen volando hacia el rival.
 * Arte opcional (si no existe, se dibuja un marcador provisional por código):
 *  - pose `<prefijo>super` / `super-0..n` en el atlas del luchador (ya con la guitarra en la mano),
 *  - textura `super-guitar-<id>` (guitarra sola; origen en el punto donde se sujeta),
 *  - textura `super-note-<id>` (nota musical).
 */
export class GuitarSolo {
  readonly solo: SoloDef;
  /** ms reales transcurridos desde el inicio del solo. */
  private t = 0;
  private next = 0;
  private notes: FlyingNote[] = [];
  private guitar: Phaser.GameObjects.Container | null = null;
  private strings: Phaser.GameObjects.Graphics | null = null;
  private pluck = 0;
  /** Súper animado propio del luchador (visuals/supers); sin él, notas musicales. */
  private show: SuperShow | null;
  private ctx: ShowCtx | null = null;

  constructor(
    private scene: Phaser.Scene,
    private fx: Fx,
    readonly owner: Fighter,
    private strike: NoteStrike,
  ) {
    this.solo = SOLOS[owner.def.superMove.solo];
    if (!hasOwnArt(scene, owner.def, 'super')) this.guitar = this.buildGuitar();
    this.show = SHOWS[owner.def.id] ?? null;
    if (this.show) {
      const back = scene.add.container(0, 0).setDepth(19.5).setAlpha(0);
      const front = scene.add.container(0, 0).setDepth(30).setAlpha(0);
      scene.tweens.add({ targets: [back, front], alpha: 1, duration: 220 });
      this.ctx = { scene, fx, owner, target: owner.opponent, back, front, t: 0, duration: this.solo.duration, data: {}, bits: [] };
      this.show.start?.(this.ctx);
    }
  }

  get finished(): boolean {
    return this.t >= this.solo.duration && !this.notes.some((n) => n.hit && !n.spent);
  }

  /** Punto desde donde salen las notas (cuerpo de la guitarra). */
  private get source(): { x: number; y: number } {
    const o = this.owner;
    if (o.def.superMove.solo === 'feedback') return { x: o.x, y: GROUND_Y - o.z - o.def.art.height * 0.7 - 24 };
    return { x: o.x + o.facing * 40, y: GROUND_Y - o.z - o.visualLift - o.def.art.height * 0.4 };
  }

  update(realMs: number, dt: number): void {
    this.t += realMs;
    // Reloj real del solo: anima la pose del súper aunque haya hitstop.
    this.owner.soloVisualTime = this.t;
    this.owner.soloPluck = this.pluck;
    const notes = this.solo.notes;
    while (this.next < notes.length && notes[this.next].t <= this.t) this.spawn(notes[this.next++]);
    this.pluck = Math.max(0, this.pluck - realMs / 180);
    this.owner.visualLift = superMotion(this.owner.def.id, this.t, this.solo.duration, this.pluck,
      this.owner.soloFinalAt === null ? null : this.t - this.owner.soloFinalAt).lift;
    this.owner.sync();
    this.updateGuitar();
    if (this.show && this.ctx) {
      this.ctx.t = this.t;
      this.show.update?.(this.ctx, dt);
      stepBits(this.ctx, dt);
    }

    const target = this.owner.opponent;
    for (const n of this.notes) {
      n.age += dt;
      if (n.hit && !n.spent) {
        // Las notas que golpean persiguen el pecho del rival.
        const tx = target.x;
        const ty = GROUND_Y - target.z - target.def.art.height * 0.6;
        const dx = tx - n.x;
        const dy = ty - n.y;
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, 5 * dt);
        n.vx += ((dx / d) * this.solo.speed - n.vx) * k;
        n.vy += ((dy / d) * this.solo.speed - n.vy) * k;
        if (d < 110) {
          n.spent = true;
          if (n.final) this.owner.soloFinalAt = this.t;
          const landed = this.strike(this.owner, n.x, n.y, this.solo.damage, n.final);
          n.life = n.age + (landed ? 0 : 0.3);
          if (landed) {
            this.fx.ring(n.x, n.y, this.owner.def.color, 120, 0.25);
            if (this.ctx) this.show?.impact?.(this.ctx, n.x, n.y, n.final);
          }
        }
      } else if (!n.hit) {
        n.vy -= 120 * dt;
      }
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      const wobble = n.hit ? Math.sin(n.age * 14) * this.solo.wobble * 0.3 : 0;
      const fade = Math.min(1, (n.life - n.age) / 0.25);
      const spin = this.show?.spin;
      n.obj.setPosition(n.x, n.y + wobble).setAlpha(Math.max(0, fade)).setAngle(spin ? n.age * spin * this.owner.facing : Math.sin(n.age * 9) * 20);
      if (this.owner.def.superMove.solo === 'feedback') {
        const size = n.final ? 1.1 : n.hit ? 0.72 : 0.38;
        n.obj.setScale(size * (1 + Math.sin(n.age * 24) * 0.08));
      }
      if (n.hit && !n.spent && Math.random() < 0.7) this.fx.trail(n.x, n.y + wobble, this.owner.def.color, 34);
      if (n.age >= n.life) n.spent = true;
    }
    for (const n of this.notes) if (n.age >= n.life) n.obj.destroy();
    this.notes = this.notes.filter((n) => n.age < n.life);
  }

  private spawn(note: SoloDef['notes'][number]): void {
    const { x, y } = this.source;
    const o = this.owner;
    this.pluck = 1;
    const key = `super-note-${o.def.id}`;
    const big = note.hit ? (this.solo.guitar === 'hollow' ? 1.5 : 1.15) : 0.8;
    const custom = this.ctx ? this.show?.note?.(this.ctx, x, y, !!note.hit, !!note.final, this.next - 1) ?? this.powerNote(x, y, !!note.hit) : null;
    const obj = o.def.superMove.solo === 'feedback' ? this.buildOrb(x, y, !!note.hit, !!note.final) : custom ? custom : this.scene.textures.exists(key)
      ? this.scene.add.image(x, y, key).setScale(big)
      : this.scene.add.text(x, y, GLYPHS[(note.midi + note.t) % GLYPHS.length], {
          fontFamily: FONTS.body,
          fontSize: `${Math.round(64 * big)}px`,
          color: note.hit ? '#ffffff' : o.def.css,
          stroke: '#000000',
          strokeThickness: 6,
        }).setOrigin(0.5).setShadow(0, 0, o.def.css, 18, true, true);
    obj.setDepth(32);
    const spread = (Math.random() - 0.5) * 0.6;
    const n: FlyingNote = {
      obj, x, y, age: 0, hit: !!note.hit, final: !!note.final, spent: false,
      vx: note.hit ? o.facing * this.solo.speed * 0.6 : o.facing * (60 + Math.random() * 160),
      vy: note.hit ? spread * 400 : -220 - Math.random() * 200,
      life: note.hit ? 3 : 0.9,
    };
    this.notes.push(n);
    if (note.hit) this.fx.ring(x, y, o.def.color, 90, 0.18);
  }

  /**
   * Proyectil del ultimate = el dibujo del poder básico del luchador (Mimético, el del rival).
   * Los rayos no tienen dibujo suelto: se usa una onda o un orbe. MayinBlues sigue con sus notas.
   */
  private powerNote(x: number, y: number, hit: boolean): NoteObj | null {
    const o = this.owner;
    if (o.def.id === 'mayin') return null;
    const raw = powerFor(o.def.id)[0].look;
    const look: PowerLook = raw === 'laser' || raw === 'lash' ? 'wave' : raw === 'feedback' ? 'darkOrb' : raw;
    const color = o.def.id === 'mimetico' ? 0x4dff88 : o.def.color;
    return buildLook(this.scene, look, color, hit ? 40 : 20, x, y).obj;
  }

  /** Orbes del núcleo del jefe: halo rojo, corona y centro incandescente. */
  private buildOrb(x: number, y: number, hit: boolean, final: boolean): Phaser.GameObjects.Image {
    const key = 'acople-energy-orb';
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.add.graphics();
      for (let radius = 60; radius >= 22; radius -= 4) {
        g.fillStyle(0xff173d, 0.035).fillCircle(64, 64, radius);
      }
      g.fillStyle(0xbb092d, 0.9).fillCircle(64, 64, 22);
      g.lineStyle(3, 0xff5272, 0.95).strokeCircle(64, 64, 24);
      g.fillStyle(0xff3755, 1).fillCircle(64, 64, 17);
      g.fillStyle(0xffb6c2, 1).fillCircle(64, 64, 10);
      g.fillStyle(0xfff5f7, 1).fillCircle(62, 61, 5);
      g.generateTexture(key, 128, 128);
      g.destroy();
    }
    return this.scene.add.image(x, y, key)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(final ? 1.1 : hit ? 0.72 : 0.38);
  }

  // ───────────────────────────── Guitarra provisional ─────────────────────────────

  private buildGuitar(): Phaser.GameObjects.Container {
    const id = this.owner.def.id;
    const inner = this.scene.add.container(0, 0);
    if (this.scene.textures.exists(`super-guitar-${id}`)) {
      inner.add(this.scene.add.image(0, 0, `super-guitar-${id}`));
    } else {
      const g = this.scene.add.graphics();
      this.drawGuitar(g);
      this.strings = this.scene.add.graphics();
      inner.add([g, this.strings]);
    }
    const c = this.scene.add.container(0, 0, [inner]).setDepth(25);
    // Entrada: la saca girando.
    inner.setScale(0.2).setAngle(-160);
    this.scene.tweens.add({ targets: inner, scale: 1, angle: 0, duration: 260, ease: 'Back.easeOut' });
    return c;
  }

  /** Marcador provisional: shred = cuerpo puntiagudo negro; blues = caja semi-hueca sunburst. Mástil hacia +x. */
  private drawGuitar(g: Phaser.GameObjects.Graphics): void {
    const accent = this.owner.def.color;
    if (this.solo.guitar === 'pointy') {
      g.fillStyle(0x111111, 1).fillPoints(pts([
        { x: -80, y: -42 }, { x: 25, y: -52 }, { x: 70, y: -24 }, { x: 50, y: 0 }, { x: 70, y: 24 }, { x: 25, y: 52 }, { x: -80, y: 42 }, { x: -96, y: 0 },
      ]), true);
      g.lineStyle(4, accent, 1).strokePoints(pts([
        { x: -80, y: -42 }, { x: 25, y: -52 }, { x: 70, y: -24 }, { x: 50, y: 0 }, { x: 70, y: 24 }, { x: 25, y: 52 }, { x: -80, y: 42 }, { x: -96, y: 0 },
      ]), true);
      g.fillStyle(0x2a2a2a, 1).fillRect(-45, -14, 16, 28).fillRect(-5, -14, 16, 28);
      g.fillStyle(0x3b2414, 1).fillRect(55, -9, 250, 18);
      g.fillStyle(0x111111, 1).fillPoints(pts([{ x: 300, y: -12 }, { x: 370, y: -26 }, { x: 352, y: 4 }, { x: 300, y: 12 }]), true);
    } else {
      g.fillStyle(0x3a1a08, 1).fillEllipse(-22, 0, 168, 142).fillEllipse(50, 0, 124, 112);
      g.fillStyle(0xc8661e, 1).fillEllipse(-22, 0, 150, 124).fillEllipse(50, 0, 108, 96);
      g.fillStyle(0xf2a13b, 1).fillEllipse(-10, 0, 90, 70);
      g.lineStyle(4, 0x1a0b03, 1).strokeEllipse(-55, -30, 10, 34).strokeEllipse(-55, 30, 10, 34);
      g.fillStyle(0x2a1408, 1).fillRect(-30, -12, 12, 24);
      g.fillStyle(0x3b2414, 1).fillRect(80, -10, 230, 20);
      g.fillStyle(0x2a1408, 1).fillRect(306, -16, 56, 32);
      g.lineStyle(3, accent, 1).strokeRect(306, -16, 56, 32);
    }
  }

  private updateGuitar(): void {
    if (!this.guitar) return;
    const o = this.owner;
    const rate = this.solo.guitar === 'pointy' ? 0.03 : 0.012;
    this.guitar
      .setPosition(o.x + o.facing * 10, GROUND_Y - o.z - o.visualLift - o.def.art.height * 0.4)
      .setScale(o.facing, 1)
      .setAngle(-24 * o.facing + Math.sin(this.t * rate) * 3 * o.facing);
    const s = this.strings;
    if (!s) return;
    s.clear();
    const n = this.solo.strings;
    const span = this.solo.guitar === 'pointy' ? 14 : 16;
    for (let i = 0; i < n; i++) {
      const y = -span / 2 + (span * i) / (n - 1);
      const amp = 0.4 + this.pluck * 2.5;
      s.lineStyle(1.5, 0xe8e8e8, 0.9);
      s.beginPath();
      s.moveTo(-50, y);
      for (let x = -50; x <= 330; x += 38) s.lineTo(x, y + Math.sin(x * 0.2 + this.t * 0.09 + i) * amp);
      s.strokePath();
    }
  }

  destroy(): void {
    this.owner.soloVisualTime = null;
    this.owner.soloFinalAt = null;
    this.owner.soloPluck = 0;
    if (this.ctx) {
      const { back, front } = this.ctx;
      this.scene.tweens.add({ targets: [back, front], alpha: 0, duration: 260, onComplete: () => { back.destroy(); front.destroy(); } });
      this.scene.tweens.add({ targets: this.owner, visualLift: 0, duration: 240, ease: 'Quad.easeIn' });
      this.ctx = null;
    }
    for (const n of this.notes) n.obj.destroy();
    this.notes = [];
    if (this.guitar) {
      const g = this.guitar;
      this.scene.tweens.add({ targets: g, alpha: 0, scale: 0.6, duration: 180, onComplete: () => g.destroy() });
      this.guitar = null;
    }
  }
}
