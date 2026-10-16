import { preloadRegeneratedArt, registerRegeneratedArt } from '../visuals/roster/RegeneratedArt';
import Phaser from 'phaser';
import { COLORS, CSS, GAME_HEIGHT, GAME_WIDTH, GROUND_Y, SCENES } from '../config';
import { FIGHTERS, ROSTER, tintOf, type FighterDef, type FighterId } from '../data/fighters';
import { STAGE_ORDER, STAGES, type StageId } from '../data/stages';
import { Audio } from '../systems/Audio';
import { POSES, addPortrait, artScale, bustKey, poseFrames, resolvePose, type Pose } from '../systems/FighterArt';
import { buildStage } from '../systems/StageArt';
import { fitText, goTo, text } from '../ui/ui';

/** En el laboratorio también se mide al jefe. */
const CHOICES: FighterId[] = [...ROSTER, 'acople'];
const FPS = 12;
const CHAR_X = GAME_WIDTH / 2;
const RULER_X = 560;
const PORTRAIT = 250;

type Picker = 'char' | 'stage' | null;

/**
 * Laboratorio de sprites (?sprites, ?sprites=<id>): para medir. El personaje elegido, solo, a la escala
 * de la pelea y sobre un escenario, con regla, línea de su altura, alto visible y pies; arriba, su retrato.
 * Usa el mismo resolvePose que la pelea: lo que se ve aquí es lo que se ve jugando.
 */
export class LabScene extends Phaser.Scene {
  private char: FighterId = 'mayin';
  private stage: StageId = 'barrio';
  private pose: Pose = 'idle';
  private t = 0;
  private playing = true;
  private picker: Picker = null;
  private backdrop: Phaser.GameObjects.Container | null = null;
  private sprite!: Phaser.GameObjects.Sprite;
  private marks!: Phaser.GameObjects.Graphics;
  private poseLabel!: Phaser.GameObjects.Text;
  private info!: Phaser.GameObjects.Text;
  private pickerObjs: Phaser.GameObjects.GameObject[] = [];
  /** Lista de poses a la izquierda (clic para elegir). */
  private poseList: Phaser.GameObjects.Text[] = [];

  constructor() {
    super(SCENES.Lab);
  }

  init(data: { char?: FighterId; stage?: StageId; pose?: Pose }) {
    if (data?.char) this.char = data.char;
    if (data?.stage) this.stage = data.stage;
    if (data?.pose) this.pose = data.pose;
    this.picker = null;
  }

  preload() {
    preloadRegeneratedArt(this, [this.char]);
  }

  create() {
    registerRegeneratedArt(this, [this.char]);
    this.pickerObjs = [];
    this.backdrop = null;
    Audio.stopMusic(300);
    this.cameras.main.setBackgroundColor(0x1b1a21);
    this.buildBackdrop();
    this.marks = this.add.graphics().setDepth(5);
    this.sprite = this.add.sprite(CHAR_X, GROUND_Y, this.def.art.texture, `${this.def.art.prefix}idle`).setDepth(10);
    this.rulerLabels = [];

    // Retrato del elegido, arriba a la derecha, con sus medidas debajo.
    this.portrait(this.def, GAME_WIDTH - 30 - PORTRAIT / 2);
    this.info = text(this, GAME_WIDTH - 30, PORTRAIT + 60, '', { size: 24, weight: '700', font: 'body', origin: [1, 0], align: 'right', shadow: true, stroke: '#000000' }).setDepth(20).setLineSpacing(4);

    text(this, GAME_WIDTH / 2, 40, 'LABORATORIO DE SPRITES', { size: 40, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5] }).setDepth(20);
    this.poseLabel = text(this, GAME_WIDTH / 2, 100, '', { size: 34, weight: '800', origin: [0.5, 0.5], spacing: 2 }).setDepth(20);
    this.buildPoseList();
    this.buildBar();
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.key(e));
  }

  private get def(): FighterDef {
    return FIGHTERS[this.char];
  }

  // ───────────────────────────── Construcción ─────────────────────────────

  private buildBackdrop(): void {
    this.backdrop?.destroy();
    this.backdrop = buildStage(this, STAGES[this.stage], false).setDepth(0);
    // Un velo para que se lean las medidas.
    this.backdrop.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.35).setOrigin(0));
  }

  /** Retrato completo (busto); sin busto, el recuadro de la cara. */
  private portrait(def: FighterDef, x: number): void {
    const y = 30 + PORTRAIT / 2;
    const g = this.add.graphics().setDepth(19);
    g.fillStyle(COLORS.bg, 0.85).fillRect(x - PORTRAIT / 2, y - PORTRAIT / 2, PORTRAIT, PORTRAIT);
    g.lineStyle(3, def.color, 1).strokeRect(x - PORTRAIT / 2, y - PORTRAIT / 2, PORTRAIT, PORTRAIT);
    const bust = bustKey(this, def);
    if (bust) {
      const img = this.add.image(x, y, bust, '__BASE').setDepth(20);
      img.setScale((PORTRAIT - 8) / Math.max(img.width, img.height));
    } else addPortrait(this, def, x, y, PORTRAIT - 8).setDepth(20);
  }

  /** Poses a la izquierda: la elegida en lima; en rojo las que no tienen arte propio (simuladas). */
  private buildPoseList(): void {
    const g = this.add.graphics().setDepth(19);
    g.fillStyle(COLORS.bg, 0.85).fillRect(0, 0, 250, GAME_HEIGHT - 70);
    this.poseList = POSES.map((pose, i) => {
      const t = text(this, 30, 40 + i * 35, pose, { size: 22, weight: '800', origin: [0, 0.5] }).setDepth(20);
      t.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        Audio.blip(this);
        this.setPose(pose);
      });
      return t;
    });
    this.refreshPoseList();
  }

  private refreshPoseList(): void {
    this.poseList.forEach((t, i) => {
      const pose = POSES[i];
      const own = poseFrames(this, this.def, pose).length > 0;
      t.setColor(pose === this.pose ? CSS.lime : own ? CSS.cream : CSS.rust).setFontSize(pose === this.pose ? 26 : 22);
    });
  }

  private setPose(pose: Pose): void {
    this.pose = pose;
    this.t = 0;
    this.refreshPoseList();
  }

  private buildBar(): void {
    const items: [string, () => void][] = [
      ['[W S] POSE', () => this.nextPose(1)],
      ['[ESPACIO] PLAY', () => { this.playing = !this.playing; }],
      ['[A D] CUADRO', () => this.step(1)],
      ['[C] PERSONAJE', () => this.openPicker('char')],
      ['[F] FONDO', () => this.openPicker('stage')],
      ['[ESC] SALIR', () => goTo(this, SCENES.Title, { skipPress: true })],
    ];
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(COLORS.bg, 0.9).fillRect(0, GAME_HEIGHT - 70, GAME_WIDTH, 70);
    let x = 40;
    for (const [label, fn] of items) {
      const b = text(this, x, GAME_HEIGHT - 35, label, { size: 24, weight: '800', origin: [0, 0.5], spacing: 1 }).setDepth(21);
      b.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        Audio.blip(this, true);
        fn();
      });
      x += b.width - (b.padding.left ?? 0) * 2 + 46;
    }
  }

  // ───────────────────────────── Selectores ─────────────────────────────

  private openPicker(kind: Exclude<Picker, null>): void {
    this.closePicker();
    this.picker = kind;
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.pickerObjs.push(o);
      return o;
    };
    add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg, 0.92).setOrigin(0).setDepth(50).setInteractive());
    add(text(this, GAME_WIDTH / 2, 90, kind === 'char' ? 'ELIGE PERSONAJE' : 'ELIGE FONDO', { size: 64, italic: true, weight: '900', color: CSS.lime, origin: [0.5, 0.5] }).setDepth(51));
    add(text(this, GAME_WIDTH / 2, GAME_HEIGHT - 50, 'CLIC PARA ELEGIR  ·  ESC CERRAR', { size: 24, weight: '700', color: CSS.grey, origin: [0.5, 0.5], spacing: 2 }).setDepth(51));
    const cell = (i: number, cols: number, w: number, h: number, gap: number, top: number) => ({
      x: GAME_WIDTH / 2 + ((i % cols) - (cols - 1) / 2) * (w + gap),
      y: top + Math.floor(i / cols) * (h + gap) + h / 2,
    });
    if (kind === 'char') {
      CHOICES.forEach((id, i) => {
        const def = FIGHTERS[id];
        const { x, y } = cell(i, 8, 150, 150, 40, 180);
        const g = add(this.add.graphics().setDepth(51));
        g.fillStyle(COLORS.panel, 1).fillRect(x - 75, y - 75, 150, 150);
        g.lineStyle(id === this.char ? 6 : 2, id === this.char ? COLORS.lime : def.color, 1).strokeRect(x - 75, y - 75, 150, 150);
        add(addPortrait(this, def, x, y, 140).setDepth(52));
        add(text(this, x, y + 92, def.name, { size: 18, weight: '800', origin: [0.5, 0.5] }).setDepth(52));
        add(this.add.zone(x, y, 150, 150).setInteractive({ useHandCursor: true }).setDepth(53)).on('pointerdown', () => {
          Audio.blip(this, true);
          this.scene.restart({ char: id, stage: this.stage, pose: this.pose });
        });
      });
    } else {
      STAGE_ORDER.forEach((id, i) => {
        const { x, y } = cell(i, 5, 320, 180, 20, 180);
        add(buildStage(this, STAGES[id], false).setScale(320 / GAME_WIDTH).setPosition(x - 160, y - 90).setDepth(51));
        const g = add(this.add.graphics().setDepth(52));
        g.fillStyle(0x000000, 0.8).fillRect(x - 160, y + 56, 320, 34);
        if (id === this.stage) g.lineStyle(6, COLORS.lime, 1).strokeRect(x - 163, y - 93, 326, 186);
        add(fitText(text(this, x, y + 73, STAGES[id].name, { size: 20, weight: '800', origin: [0.5, 0.5] }).setDepth(53), 300, 12));
        add(this.add.zone(x, y, 320, 180).setInteractive({ useHandCursor: true }).setDepth(54)).on('pointerdown', () => {
          Audio.blip(this, true);
          this.stage = id;
          this.buildBackdrop();
          this.closePicker();
        });
      });
    }
  }

  private closePicker(): void {
    for (const o of this.pickerObjs) o.destroy();
    this.pickerObjs = [];
    this.picker = null;
  }

  // ───────────────────────────── Acciones ─────────────────────────────

  private nextPose(dir: number): void {
    const i = POSES.indexOf(this.pose);
    this.setPose(POSES[(i + dir + POSES.length) % POSES.length]);
  }

  private step(dir: number): void {
    this.playing = false;
    const frameMs = 1000 / FPS;
    this.t = Math.max(0, Math.floor(this.t / frameMs + dir) * frameMs);
  }

  private key(e: KeyboardEvent): void {
    if (this.picker) {
      if (e.code === 'Escape') this.closePicker();
      return;
    }
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': return this.nextPose(-1);
      case 'KeyS': case 'ArrowDown': return this.nextPose(1);
      case 'KeyA': case 'ArrowLeft': return this.step(-1);
      case 'KeyD': case 'ArrowRight': return this.step(1);
      case 'Space': this.playing = !this.playing; return;
      case 'KeyC': return this.openPicker('char');
      case 'KeyF': return this.openPicker('stage');
      case 'Escape': return goTo(this, SCENES.Title, { skipPress: true });
    }
  }

  // ───────────────────────────── Dibujo ─────────────────────────────

  /** Aplica una pose al sprite igual que en la pelea (frame, escala, ángulo y desplazamiento). */
  private apply(sprite: Phaser.GameObjects.Sprite, def: FighterDef, x: number): void {
    const r = resolvePose(this, def, this.pose, this.t);
    if (sprite.texture.key !== def.art.texture || sprite.frame.name !== r.frame) sprite.setTexture(def.art.texture, r.frame);
    const base = artScale(this, def);
    sprite.setTint(tintOf(def)).setScale(base * r.sx, base * r.sy).setAngle(r.angle).setPosition(x, GROUND_Y + r.dy);
  }

  /** Alto visible del dibujo (sin el aire transparente del cuadro): arriba y abajo en pantalla. */
  private visible(sprite: Phaser.GameObjects.Sprite): { top: number; bottom: number } {
    const f = sprite.frame;
    const sy = Math.abs(sprite.scaleY);
    const trimY = f.trimmed ? f.y : 0;
    const top = sprite.y + (trimY - sprite.originY * f.realHeight) * sy;
    return { top, bottom: top + f.cutHeight * sy };
  }

  update(_time: number, delta: number) {
    if (this.playing) this.t += delta;
    const def = this.def;
    this.apply(this.sprite, def, CHAR_X);

    const v = this.visible(this.sprite);
    const g = this.marks.clear();
    // Piso.
    g.lineStyle(3, 0xffffff, 0.8).lineBetween(RULER_X, GROUND_Y, GAME_WIDTH - RULER_X, GROUND_Y);
    // Regla: cada 50 px, número cada 100.
    g.lineStyle(2, 0xffffff, 0.9).lineBetween(RULER_X, GROUND_Y, RULER_X, GROUND_Y - 700);
    for (let h = 0; h <= 700; h += 50) g.lineBetween(RULER_X, GROUND_Y - h, RULER_X + (h % 100 === 0 ? 26 : 14), GROUND_Y - h);
    // Altura visible y altura de guardia (la que fija el juego).
    g.lineStyle(2, def.color, 1);
    for (let x = RULER_X; x < GAME_WIDTH - RULER_X; x += 18) g.lineBetween(x, v.top, x + 10, v.top);
    g.lineStyle(2, COLORS.lime, 0.7).lineBetween(RULER_X, GROUND_Y - def.art.height, RULER_X + 60, GROUND_Y - def.art.height);
    // Pies (ancla).
    g.lineStyle(3, def.color, 1).lineBetween(CHAR_X - 16, GROUND_Y, CHAR_X + 16, GROUND_Y).lineBetween(CHAR_X, GROUND_Y - 16, CHAR_X, GROUND_Y + 16);
    this.drawRulerLabels();

    const n = poseFrames(this, def, this.pose).length;
    this.poseLabel.setText(`POSE  ${this.pose}   ·   ${this.playing ? 'PLAY' : 'PAUSA'}`);
    this.info.setText([
      def.name,
      n ? `cuadro ${(Math.floor((this.t / 1000) * FPS) % n) + 1}/${n}` : 'SIMULADA',
      `alto visible ${Math.round(GROUND_Y - v.top)} px`,
      `guardia ${def.art.height} px`,
      `ancho ${Math.round(this.sprite.frame.cutWidth * Math.abs(this.sprite.scaleX))} px`,
      `pies a ${Math.round(v.bottom - GROUND_Y)} px del piso`,
    ].join('\n')).setColor(def.css);
  }

  private rulerLabels: Phaser.GameObjects.Text[] = [];

  private drawRulerLabels(): void {
    if (this.rulerLabels.length) return;
    for (let h = 100; h <= 700; h += 100) {
      this.rulerLabels.push(text(this, RULER_X - 10, GROUND_Y - h, `${h}`, { size: 18, weight: '700', origin: [1, 0.5] }).setDepth(6));
    }
  }
}
