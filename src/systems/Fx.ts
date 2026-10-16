import Phaser from 'phaser';
import { pts as toPoints } from '../ui/ui';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: number;
  gravity: number;
  kind: 'spark' | 'dot' | 'dust';
}

interface Burst {
  x: number;
  y: number;
  life: number;
  max: number;
  color: number;
  radius: number;
  kind: 'ring' | 'star';
  angle: number;
}

/** Efectos de combate dibujados por código en un Graphics (chispas, anillos, polvo). */
export class Fx {
  private g: Phaser.GameObjects.Graphics;
  private particles: Particle[] = [];
  private bursts: Burst[] = [];

  constructor(private scene: Phaser.Scene, depth = 40) {
    this.g = scene.add.graphics().setDepth(depth).setBlendMode(Phaser.BlendModes.ADD);
  }

  hit(x: number, y: number, color: number, big = false): void {
    const n = big ? 22 : 13;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (big ? 700 : 480) * (0.4 + Math.random());
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.24, max: 0.24, size: big ? 7 : 5, color: Math.random() < 0.5 ? 0xffffff : color, gravity: 900, kind: 'spark' });
    }
    this.bursts.push({ x, y, life: 0.16, max: 0.16, color: 0xffffff, radius: big ? 120 : 75, kind: 'star', angle: Math.random() * Math.PI });
    this.bursts.push({ x, y, life: 0.22, max: 0.22, color, radius: big ? 150 : 95, kind: 'ring', angle: 0 });
  }

  block(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particles.push({ x, y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: 0.18, max: 0.18, size: 4, color: 0x9fd0ff, gravity: 0, kind: 'dot' });
    }
    this.bursts.push({ x, y, life: 0.18, max: 0.18, color: 0x9fd0ff, radius: 80, kind: 'ring', angle: 0 });
  }

  dust(x: number, y: number, dir: number, amount = 8): void {
    for (let i = 0; i < amount; i++) {
      this.particles.push({ x: x + (Math.random() - 0.5) * 60, y: y - Math.random() * 10, vx: -dir * (80 + Math.random() * 220), vy: -40 - Math.random() * 120, life: 0.45, max: 0.45, size: 10 + Math.random() * 12, color: 0x8a7a6a, gravity: 200, kind: 'dust' });
    }
  }

  ring(x: number, y: number, color: number, radius = 160, life = 0.3): void {
    this.bursts.push({ x, y, life, max: life, color, radius, kind: 'ring', angle: 0 });
  }

  /** Estela de un proyectil. */
  trail(x: number, y: number, color: number, size: number): void {
    this.particles.push({ x: x + (Math.random() - 0.5) * size, y: y + (Math.random() - 0.5) * size, vx: 0, vy: (Math.random() - 0.5) * 60, life: 0.25, max: 0.25, size: size * 0.35, color, gravity: 0, kind: 'dot' });
  }

  /** Ráfaga de viento: una raya que pasa veloz (velocidad `vx`, `vy` en px/s) y se apaga. */
  wind(x: number, y: number, vx: number, vy: number, color: number, size = 3): void {
    this.particles.push({ x, y, vx, vy, life: 0.18, max: 0.18, size, color, gravity: 0, kind: 'spark' });
  }

  /** Chispa que sube (aura del súper listo). */
  rise(x: number, y: number, color: number): void {
    this.particles.push({ x, y, vx: (Math.random() - 0.5) * 40, vy: -260 - Math.random() * 220, life: 0.6, max: 0.6, size: 5 + Math.random() * 4, color, gravity: 0, kind: 'dot' });
  }

  /** Fantasma del sprite (dash, súper). */
  ghost(sprite: Phaser.GameObjects.Sprite, color: number, alpha = 0.55, ms = 220, grow = 0): void {
    const g = this.scene.add.image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name);
    g.setOrigin(sprite.originX, sprite.originY).setScale(sprite.scaleX, sprite.scaleY).setFlipX(sprite.flipX).setAngle(sprite.angle);
    g.setDepth(sprite.depth - 1).setAlpha(alpha).setTint(color).setTintMode(Phaser.TintModes.FILL).setBlendMode(Phaser.BlendModes.ADD);
    if (grow) g.setScale(sprite.scaleX * (1 + grow), sprite.scaleY * (1 + grow));
    this.scene.tweens.add({
      targets: g, alpha: 0, duration: ms, onComplete: () => g.destroy(),
      ...(grow ? { scaleX: sprite.scaleX * (1 + grow * 3), scaleY: sprite.scaleY * (1 + grow * 3) } : {}),
    });
  }

  update(dt: number): void {
    const g = this.g;
    g.clear();
    for (const p of this.particles) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const k = Math.max(0, p.life / p.max);
      if (p.kind === 'spark') {
        g.lineStyle(p.size * k + 1, p.color, k);
        g.lineBetween(p.x, p.y, p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      } else if (p.kind === 'dust') {
        g.fillStyle(p.color, 0.25 * k).fillCircle(p.x, p.y, p.size * (1.6 - k * 0.6));
      } else {
        g.fillStyle(p.color, k).fillCircle(p.x, p.y, p.size * k + 1);
      }
    }
    for (const b of this.bursts) {
      b.life -= dt;
      const k = Math.max(0, b.life / b.max);
      const r = b.radius * (1 - k * 0.6);
      if (b.kind === 'ring') {
        g.lineStyle(10 * k + 2, b.color, k).strokeCircle(b.x, b.y, r);
      } else {
        g.fillStyle(b.color, k);
        const pts: Phaser.Types.Math.Vector2Like[] = [];
        for (let i = 0; i < 16; i++) {
          const a = b.angle + (i / 16) * Math.PI * 2;
          const rr = i % 2 ? r * 0.25 : r * (0.6 + ((i * 7) % 5) * 0.1);
          pts.push({ x: b.x + Math.cos(a) * rr, y: b.y + Math.sin(a) * rr });
        }
        g.fillPoints(toPoints(pts), true);
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    this.bursts = this.bursts.filter((b) => b.life > 0);
  }
}
