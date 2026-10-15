import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { FIGHTERS, ROSTER, defaultOpponent, tintOf, type FighterDef, type FighterId } from '../data/fighters';
import { MOVES, type MoveDef } from '../data/moves';
import { Audio } from '../systems/Audio';
import { POSES, artScale, fallbackChain, poseFrames, resolvePose, type Pose } from '../systems/FighterArt';
import { BOSS, StoryRun } from '../systems/StoryRun';
import { goTo, text } from '../ui/ui';

type Tab = 'sprites' | 'anim';

const FPS = 12;
const FRAME_MS = 1000 / 60;
const SPEEDS = [0.1, 0.25, 0.5, 1, 2];
const COLS = 7;
const CELL_W = GAME_WIDTH / COLS;
const GRID_TOP = 150;
const CELL_H = (GAME_HEIGHT - GRID_TOP - 20) / 4;
const CELL_SCALE = 0.34;
const STAGE_X = 900;
const STAGE_Y = 900;

interface Cell {
  pose: Pose;
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
}

/** Golpe que usa una pose (para dibujar su alcance). */
const moveForPose = (pose: Pose): MoveDef | undefined => Object.values(MOVES).find((m) => m.pose === pose && m.reach > 0);

/**
 * Laboratorio de sprites (se abre con ?lab en la URL):
 *  1. SPRITES: todas las poses de un personaje, marcando cuáles tienen arte propio y cuáles se simulan.
 *  2. ANIMACIÓN: reproductor cuadro por cuadro con velocidad, volteo, fantasma, ancla, alcance y datos.
 *  3. ENTRENAMIENTO: abre la pelea de práctica con el personaje elegido.
 * Usa el mismo resolvePose que la pelea: lo que se ve aquí es lo que se ve jugando.
 */
export class LabScene extends Phaser.Scene {
  private tab: Tab = 'sprites';
  private char: FighterId = 'mayin';
  private content: Phaser.GameObjects.GameObject[] = [];
  private cells: Cell[] = [];
  private elapsed = 0;
  private stageBg = false;
  private backdrop!: Phaser.GameObjects.Image;
  // Animación
  private pose: Pose = 'idle';
  private t = 0;
  private playing = true;
  private speedIndex = 3;
  private flip = false;
  private onion = false;
  private animSprite: Phaser.GameObjects.Sprite | null = null;
  private ghosts: Phaser.GameObjects.Sprite[] = [];
  private overlay: Phaser.GameObjects.Graphics | null = null;
  private info: Phaser.GameObjects.Text | null = null;
  private poseList: Phaser.GameObjects.Text[] = [];
  private header: Phaser.GameObjects.Text[] = [];

  constructor() {
    super(SCENES.Lab);
  }

  init(data: { char?: FighterId; tab?: Tab | 'specials' }) {
    if (data?.char) this.char = data.char;
    if (data?.tab === 'sprites' || data?.tab === 'anim') this.tab = data.tab;
  }

  create() {
    // La escena se reutiliza al volver de la vitrina: olvidar los objetos de la visita anterior.
    this.header = [];
    this.content = [];
    this.cells = [];
    this.cameras.main.setBackgroundColor(0x1b1a21);
    Audio.stopMusic(300);
    this.backdrop = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bar').setAlpha(0.45).setVisible(this.stageBg);
    this.backdrop.setScale(Math.max(GAME_WIDTH / this.backdrop.width, GAME_HEIGHT / this.backdrop.height));
    this.buildHeader();
    this.build();
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.key(e));
  }

  private get def(): FighterDef {
    return FIGHTERS[this.char];
  }

  // ───────────────────────────── Cabecera ─────────────────────────────

  private button(x: number, y: number, label: string, onClick: () => void, size = 26): Phaser.GameObjects.Text {
    const t = text(this, x, y, label, { size, weight: '800', origin: [0, 0.5], spacing: 1 });
    t.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      Audio.blip(this, true);
      onClick();
    });
    return t;
  }

  private buildHeader(): void {
    const g = this.add.graphics().setDepth(50);
    g.fillStyle(COLORS.bg, 0.95).fillRect(0, 0, GAME_WIDTH, 120);
    g.fillStyle(COLORS.lime, 1).fillRect(0, 118, GAME_WIDTH, 3);
    text(this, 30, 42, 'LABORATORIO', { size: 52, italic: true, weight: '900', color: CSS.lime, origin: [0, 0.5] }).setDepth(51);
    const items: [string, () => void][] = [
      ['[1] SPRITES', () => this.setTab('sprites')],
      ['[2] ANIMACIÓN', () => this.setTab('anim')],
      ['[3] ESPECIALES', () => this.toSpecials()],
      ['[4] ENTRENAMIENTO', () => this.toTraining()],
      ['[5] JEFE FINAL', () => this.toBoss()],
      ['[C] PERSONAJE', () => this.toggleChar()],
      ['[B] FONDO', () => this.toggleBg()],
      ['[ESC] SALIR', () => goTo(this, SCENES.Title, { skipPress: true })],
    ];
    let x = 370;
    for (const [label, fn] of items) {
      const b = this.button(x, 42, label, fn).setDepth(51);
      this.header.push(b);
      x += b.width - (b.padding.left ?? 0) * 2 + 44;
    }
    this.header.push(text(this, 30, 92, '', { size: 24, weight: '700', origin: [0, 0.5], spacing: 1 }).setDepth(51));
  }

  private refreshHeader(): void {
    const [sprites, anim] = this.header;
    sprites.setColor(this.tab === 'sprites' ? CSS.lime : CSS.cream);
    anim.setColor(this.tab === 'anim' ? CSS.lime : CSS.cream);
    const own = POSES.filter((p) => poseFrames(this, this.def, p).length).length;
    this.header[this.header.length - 1].setText(
      `${this.def.name}   ·   ARTE PROPIO ${own}/${POSES.length}   ·   SIMULADAS ${POSES.length - own}   ·   altura de guardia ${this.def.art.height}px`,
    ).setColor(this.def.css);
  }

  // ───────────────────────────── Construcción ─────────────────────────────

  private clear(): void {
    for (const o of this.content) o.destroy();
    this.content = [];
    this.cells = [];
    this.animSprite = null;
    this.ghosts = [];
    this.overlay = null;
    this.info = null;
    this.poseList = [];
  }

  private add2<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.content.push(o);
    return o;
  }

  private build(): void {
    this.clear();
    this.refreshHeader();
    if (this.tab === 'sprites') this.buildGrid();
    else this.buildAnim();
  }

  private buildGrid(): void {
    const def = this.def;
    const g = this.add2(this.add.graphics());
    POSES.forEach((pose, i) => {
      const cx = (i % COLS) * CELL_W + CELL_W / 2;
      const top = GRID_TOP + Math.floor(i / COLS) * CELL_H;
      const ground = top + CELL_H - 34;
      const own = poseFrames(this, def, pose);
      const chain = fallbackChain(this, def, pose);
      g.fillStyle(0x000000, 0.25).fillRect(cx - CELL_W / 2 + 6, top + 6, CELL_W - 12, CELL_H - 12);
      g.lineStyle(2, own.length ? 0x4dff88 : COLORS.rust, 0.6).strokeRect(cx - CELL_W / 2 + 6, top + 6, CELL_W - 12, CELL_H - 12);
      // Suelo, altura de guardia y alcance
      g.lineStyle(2, 0x8b897f, 0.8).lineBetween(cx - CELL_W / 2 + 16, ground, cx + CELL_W / 2 - 16, ground);
      const idleTop = ground - def.art.height * CELL_SCALE;
      g.lineStyle(1, COLORS.lime, 0.5);
      for (let x = cx - CELL_W / 2 + 16; x < cx + CELL_W / 2 - 16; x += 12) g.lineBetween(x, idleTop, x + 6, idleTop);
      const move = moveForPose(pose);
      if (move) {
        g.lineStyle(3, 0xff3b4e, 0.85).lineBetween(cx, ground - 8, cx + move.reach * CELL_SCALE, ground - 8);
        g.fillStyle(0xff3b4e, 1).fillCircle(cx + move.reach * CELL_SCALE, ground - 8, 4);
      }
      const sprite = this.add2(this.add.sprite(cx, ground, def.art.texture, `${def.art.prefix}idle`));
      this.cells.push({ pose, sprite, x: cx, y: ground });
      g.lineStyle(2, 0xffffff, 1).lineBetween(cx - 8, ground, cx + 8, ground).lineBetween(cx, ground - 8, cx, ground + 8);

      this.add2(text(this, cx - CELL_W / 2 + 16, top + 26, pose, { size: 24, weight: '800', origin: [0, 0.5] }));
      const badge = own.length ? `ARTE · ${own.length} fr` : `SIMULADA ← ${chain[chain.length - 1] ?? 'idle'}`;
      this.add2(text(this, cx + CELL_W / 2 - 16, top + 26, badge, { size: 18, weight: '700', color: own.length ? '#4dff88' : CSS.rust, origin: [1, 0.5] }));
      const zone = this.add2(this.add.zone(cx, top + CELL_H / 2, CELL_W - 12, CELL_H - 12).setInteractive({ useHandCursor: true }));
      zone.on('pointerdown', () => {
        this.pose = pose;
        this.t = 0;
        this.setTab('anim');
      });
    });
    this.add2(text(this, GAME_WIDTH - 20, GAME_HEIGHT - 12, 'Clic en una pose para abrirla en ANIMACIÓN  ·  línea punteada = altura de la guardia  ·  rojo = alcance del golpe  ·  cruz = ancla (pies)', { size: 18, weight: '600', color: CSS.grey, origin: [1, 1] }));
  }

  private buildAnim(): void {
    const def = this.def;
    // Lista de poses
    POSES.forEach((pose, i) => {
      const own = poseFrames(this, def, pose).length > 0;
      const t = this.add2(this.button(30, 160 + i * 31, pose, () => this.selectPose(pose), 22));
      t.setData('own', own);
      this.poseList.push(t);
    });
    this.overlay = this.add2(this.add.graphics().setDepth(5));
    for (let i = 0; i < 2; i++) {
      this.ghosts.push(this.add2(this.add.sprite(STAGE_X, STAGE_Y, def.art.texture, `${def.art.prefix}idle`).setAlpha(0.22).setTint(0x7fd0ff)));
    }
    this.animSprite = this.add2(this.add.sprite(STAGE_X, STAGE_Y, def.art.texture, `${def.art.prefix}idle`).setDepth(4));
    const pg = this.add2(this.add.graphics());
    pg.fillStyle(COLORS.bg, 0.8).fillRect(1420, 140, 480, 640);
    this.info = this.add2(text(this, 1440, 160, '', { size: 23, weight: '600', font: 'body', origin: [0, 0], wrap: 440 }).setLineSpacing(6));

    const controls: [string, () => void][] = [
      ['[ESPACIO] PLAY/PAUSA', () => { this.playing = !this.playing; }],
      ['[← →] CUADRO', () => this.step(1)],
      ['[− +] VELOCIDAD', () => { this.speedIndex = (this.speedIndex + 1) % SPEEDS.length; }],
      ['[F] VOLTEAR', () => { this.flip = !this.flip; }],
      ['[O] FANTASMA', () => { this.onion = !this.onion; }],
      ['[S] VER ULTIMATE', () => this.previewSuper()],
    ];
    let x = 330;
    for (const [label, fn] of controls) {
      const b = this.add2(this.button(x, GAME_HEIGHT - 46, label, fn, 24));
      x += b.width - (b.padding.left ?? 0) * 2 + 34;
    }
    this.refreshPoseList();
  }

  private refreshPoseList(): void {
    for (const t of this.poseList) {
      const sel = t.text === this.pose;
      t.setColor(sel ? CSS.lime : t.getData('own') ? CSS.cream : CSS.rust);
      t.setFontSize(sel ? 26 : 22);
    }
  }

  // ───────────────────────────── Acciones ─────────────────────────────

  private setTab(tab: Tab): void {
    this.tab = tab;
    this.build();
  }

  private toggleChar(): void {
    this.char = ROSTER[(ROSTER.indexOf(this.char) + 1) % ROSTER.length];
    this.build();
  }

  private toggleBg(): void {
    this.stageBg = !this.stageBg;
    this.backdrop.setVisible(this.stageBg);
  }

  /** Vitrina de especiales: el luchador contra un muñeco, con botones para cada poder. */
  private toSpecials(): void {
    goTo(this, SCENES.Fight, { p1: this.char, p2: defaultOpponent(this.char), showcase: true, stage: 'metro' });
  }

  /** Atajo de prueba: historia con todos los amigos liberados → revelación → pelea contra El Acople. */
  private toBoss(): void {
    StoryRun.start(this.char, ''); // sin nombre: no sube al ranking
    const s = StoryRun.state!;
    s.freed = StoryRun.opponents.filter((id) => id !== BOSS);
    s.index = s.freed.length;
    StoryRun.save();
    goTo(this, SCENES.Story, { mode: 'reveal' });
  }

  private toTraining(): void {
    goTo(this, SCENES.Fight, { p1: this.char, p2: defaultOpponent(this.char), training: true });
  }

  private selectPose(pose: Pose): void {
    this.pose = pose;
    this.t = 0;
    this.refreshPoseList();
  }

  private step(dir: number): void {
    this.playing = false;
    const frameMs = 1000 / FPS;
    this.t = Math.max(0, Math.floor(this.t / frameMs + dir) * frameMs);
  }

  private previewSuper(): void {
    if (this.scene.isActive(SCENES.SuperCutIn)) return;
    this.scene.launch(SCENES.SuperCutIn, { def: this.def, side: this.flip ? 1 : 0, onDone: () => {} });
    this.scene.bringToTop(SCENES.SuperCutIn);
  }

  private key(e: KeyboardEvent): void {
    switch (e.code) {
      case 'Digit1': return this.setTab('sprites');
      case 'Digit2': return this.setTab('anim');
      case 'Digit3': return this.toSpecials();
      case 'Digit4': return this.toTraining();
      case 'Digit5': return this.toBoss();
      case 'KeyC': return this.toggleChar();
      case 'KeyB': return this.toggleBg();
      case 'Escape': return goTo(this, SCENES.Title, { skipPress: true });
    }
    if (this.tab !== 'anim') return;
    const i = POSES.indexOf(this.pose);
    switch (e.code) {
      case 'Space': this.playing = !this.playing; break;
      case 'ArrowRight': this.step(1); break;
      case 'ArrowLeft': this.step(-1); break;
      case 'ArrowDown': this.selectPose(POSES[(i + 1) % POSES.length]); break;
      case 'ArrowUp': this.selectPose(POSES[(i - 1 + POSES.length) % POSES.length]); break;
      case 'Equal': case 'NumpadAdd': this.speedIndex = Math.min(SPEEDS.length - 1, this.speedIndex + 1); break;
      case 'Minus': case 'NumpadSubtract': this.speedIndex = Math.max(0, this.speedIndex - 1); break;
      case 'KeyF': this.flip = !this.flip; break;
      case 'KeyO': this.onion = !this.onion; break;
      case 'KeyS': this.previewSuper(); break;
    }
  }

  // ───────────────────────────── Dibujo ─────────────────────────────

  /** Aplica una pose al sprite igual que en la pelea (frame, escala, ángulo y desplazamiento). */
  private apply(sprite: Phaser.GameObjects.Sprite, pose: Pose, t: number, x: number, y: number, scale: number, flip = false): void {
    const def = this.def;
    const r = resolvePose(this, def, pose, t);
    if (sprite.frame.name !== r.frame) sprite.setFrame(r.frame);
    const base = artScale(this, def) * scale;
    const facing = flip ? -1 : 1;
    sprite.setTint(tintOf(def)).setScale(base * r.sx, base * r.sy).setAngle(r.angle * facing).setFlipX(flip).setPosition(x, y + r.dy * scale);
  }

  update(_time: number, delta: number) {
    this.elapsed += delta;
    if (this.tab === 'sprites') {
      for (const c of this.cells) this.apply(c.sprite, c.pose, this.elapsed, c.x, c.y, CELL_SCALE);
      return;
    }
    if (!this.animSprite || !this.overlay || !this.info) return;
    const def = this.def;
    if (this.playing) this.t += delta * SPEEDS[this.speedIndex];
    const frames = poseFrames(this, def, this.pose);
    const frameMs = 1000 / FPS;
    this.apply(this.animSprite, this.pose, this.t, STAGE_X, STAGE_Y, 1, this.flip);
    this.ghosts.forEach((ghost, k) => {
      const show = this.onion && frames.length > 1;
      ghost.setVisible(show);
      if (show) this.apply(ghost, this.pose, Math.max(0, this.t - (k + 1) * frameMs + frames.length * frameMs * 10), STAGE_X, STAGE_Y, 1, this.flip);
    });

    // Suelo, ancla, altura de guardia, cuerpo y alcance.
    const g = this.overlay;
    const facing = this.flip ? -1 : 1;
    g.clear();
    g.lineStyle(3, 0x8b897f, 1).lineBetween(STAGE_X - 600, STAGE_Y, STAGE_X + 600, STAGE_Y);
    g.lineStyle(1, COLORS.lime, 0.6);
    for (let x = STAGE_X - 600; x < STAGE_X + 600; x += 16) g.lineBetween(x, STAGE_Y - def.art.height, x + 8, STAGE_Y - def.art.height);
    g.lineStyle(2, 0x4dff88, 0.7).strokeRect(STAGE_X - 65, STAGE_Y - def.art.height * 0.95, 130, def.art.height * 0.95);
    const move = moveForPose(this.pose);
    if (move) {
      g.lineStyle(4, 0xff3b4e, 0.9).lineBetween(STAGE_X, STAGE_Y - 20, STAGE_X + facing * move.reach, STAGE_Y - 20);
      g.fillStyle(0xff3b4e, 1).fillCircle(STAGE_X + facing * move.reach, STAGE_Y - 20, 7);
    }
    g.lineStyle(3, 0xffffff, 1).lineBetween(STAGE_X - 14, STAGE_Y, STAGE_X + 14, STAGE_Y).lineBetween(STAGE_X, STAGE_Y - 14, STAGE_X, STAGE_Y + 14);

    const s = this.animSprite;
    const frame = s.frame;
    const chain = fallbackChain(this, def, this.pose);
    const index = frames.length ? Math.floor((this.t / 1000) * FPS) % frames.length : 0;
    const lines = [
      `POSE  ${this.pose}`,
      frames.length ? `ARTE PROPIO · cuadro ${index + 1}/${frames.length}` : `SIMULADA: ${[this.pose, ...chain].join(' → ')}`,
      `frame  ${frame.name}`,
      `tamaño  ${frame.realWidth}×${frame.realHeight}px`,
      `ancla  ${frame.pivotX.toFixed(2)}, ${frame.pivotY.toFixed(2)}`,
      `escala en pantalla  ${s.scaleX.toFixed(2)} × ${s.scaleY.toFixed(2)}`,
      `ángulo  ${Math.round(s.angle)}°`,
      `alto en pantalla  ${Math.round(frame.realHeight * Math.abs(s.scaleY))}px (guardia ${def.art.height})`,
      '',
      `velocidad ${Math.round(SPEEDS[this.speedIndex] * 100)}%  ·  ${this.playing ? 'PLAY' : 'PAUSA'}`,
      `volteado ${this.flip ? 'SÍ' : 'NO'}  ·  fantasma ${this.onion ? 'SÍ' : 'NO'}`,
    ];
    if (move) {
      const f = (ms: number) => `${Math.round(ms / FRAME_MS)}f`;
      lines.push('', `GOLPE  ${move.id}`, `arranque ${f(move.startup)} · activo ${move.air ? 'hasta caer' : f(move.active)} · recup ${f(move.recovery)}`, `alcance ${move.reach}px · daño ${move.damage} · ${move.level}`);
    }
    this.info.setText(lines.join('\n'));
  }
}
