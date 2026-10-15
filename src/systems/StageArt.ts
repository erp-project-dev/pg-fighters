import Phaser from 'phaser';
import { FONTS, GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../config';
import type { StageDef } from '../data/stages';
import { addAcopleCaveBreath } from '../visuals/AcopleCave';

const W = GAME_WIDTH;
const H = GAME_HEIGHT;

/** ¿El escenario ya tiene imagen cargada? */
export const hasStageArt = (scene: Phaser.Scene, stage: StageDef) => scene.textures.exists(stage.texture);

/**
 * Fondo de un escenario a pantalla completa (1920×1080) dentro de un contenedor:
 * la imagen si existe, o un fondo provisional dibujado por código.
 * El contenedor se puede escalar para miniaturas.
 */
export const buildStage = (scene: Phaser.Scene, stage: StageDef, animate = true): Phaser.GameObjects.Container => {
  const c = scene.add.container(0, 0);
  if (hasStageArt(scene, stage)) {
    const img = scene.add.image(W / 2, H / 2, stage.texture);
    img.setScale(Math.max(W / img.width, H / img.height));
    c.add(img);
    if (animate && stage.texture === 'stage-ampli') addAcopleCaveBreath(scene, c);
    return c;
  }
  if (stage.id === 'metro') drawMetro(scene, c);
  else if (stage.id === 'bar') drawBar(scene, c, animate);
  else if (stage.id === 'tienda') drawShop(scene, c, animate);
  else if (stage.id === 'festival') drawFestival(scene, c, animate);
  else if (stage.id === 'azotea') drawRooftop(scene, c, animate);
  else if (stage.id === 'tomate') drawTomato(scene, c, animate);
  else if (stage.id === 'biblioteca') drawLibrary(scene, c, animate);
  else if (stage.id === 'chino') drawChinatown(scene, c, animate);
  else if (stage.id === 'mall') drawMall(scene, c, animate);
  else if (stage.id === 'arenal') drawArenal(scene, c, animate);
  else if (stage.id === 'ampli') drawAmpInside(scene, c, animate);
  else c.add(scene.add.rectangle(0, 0, W, H, 0x1b1a21).setOrigin(0));
  return c;
};

const label = (scene: Phaser.Scene, x: number, y: number, str: string, size: number, color: string, o: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}) =>
  scene.add.text(x, y, str, { fontFamily: FONTS.head, fontSize: `${size}px`, fontStyle: 'italic 900', color, ...o }).setOrigin(0.5);

/** Estación de metro: muro de azulejos con grafitis, columnas, foso de vías y andén con línea amarilla. */
function drawMetro(scene: Phaser.Scene, c: Phaser.GameObjects.Container): void {
  const g = scene.add.graphics();
  c.add(g);
  // Muro de azulejos
  g.fillStyle(0x2c3236, 1).fillRect(0, 0, W, 640);
  g.lineStyle(2, 0x1d2124, 1);
  for (let y = 0; y < 640; y += 36) g.lineBetween(0, y, W, y);
  for (let y = 0; y < 640; y += 36) for (let x = (y / 36) % 2 ? 0 : 36; x < W; x += 72) g.lineBetween(x, y, x, y + 36);
  // Franja de nombre de estación
  g.fillStyle(0x0e1113, 1).fillRect(0, 70, W, 70);
  // Grafitis: manchas de color con contorno y "tags"
  const rnd = new Phaser.Math.RandomDataGenerator(['metro']);
  const colors = [0xff3fa4, 0x3dd6ff, 0xffe14d, 0x7cff4d, 0xff7a2b, 0xa36bff];
  for (let i = 0; i < 14; i++) {
    const x = rnd.between(40, W - 40);
    const y = rnd.between(190, 560);
    const col = rnd.pick(colors);
    const w = rnd.between(120, 300);
    const h = rnd.between(50, 120);
    g.fillStyle(0x000000, 0.9).fillEllipse(x + 6, y + 6, w + 14, h + 14);
    g.fillStyle(col, 0.9).fillEllipse(x, y, w, h);
    g.lineStyle(5, 0xffffff, 0.7);
    g.beginPath();
    g.moveTo(x - w * 0.35, y);
    for (let k = 1; k <= 6; k++) g.lineTo(x - w * 0.35 + (k * w * 0.7) / 6, y + (k % 2 ? -h * 0.25 : h * 0.25));
    g.strokePath();
  }
  const tags = ['RIFF', 'L1MA', 'SHRED', 'BLU3S', 'NO PASA NADA', 'PG'];
  tags.forEach((t, i) => {
    const txt = label(scene, 200 + i * 300, rnd.between(230, 540), t, rnd.between(60, 110), Phaser.Display.Color.IntegerToColor(rnd.pick(colors)).rgba, {
      stroke: '#000000', strokeThickness: 10,
    }).setAngle(rnd.between(-12, 12));
    c.add(txt);
  });
  c.add(label(scene, W / 2, 105, 'ESTACIÓN  CENTRAL', 54, '#ffffff', { fontStyle: '800' }));
  // Columnas de acero
  for (let x = 160; x < W; x += 560) {
    g.fillStyle(0x16352b, 1).fillRect(x - 34, 0, 68, 660);
    g.fillStyle(0x225446, 1).fillRect(x - 34, 0, 14, 660);
  }
  // Luces fluorescentes
  for (let x = 420; x < W; x += 560) g.fillStyle(0xe8fbff, 0.9).fillRect(x - 110, 10, 220, 12);
  // Foso de las vías y andén
  g.fillStyle(0x0a0a0a, 1).fillRect(0, 640, W, 60);
  g.fillStyle(0x6b6b6b, 1).fillRect(0, 650, W, 6).fillRect(0, 680, W, 6);
  g.fillStyle(0x4a4a4c, 1).fillRect(0, 700, W, H - 700);
  g.fillStyle(0xffd400, 1).fillRect(0, 700, W, 18);
  g.fillStyle(0x3f3f41, 1);
  for (let x = 0; x < W; x += 160) g.fillRect(x, 718, 4, H - 718);
  g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.45, 0.45).fillRect(0, GROUND_Y - 120, W, H - GROUND_Y + 120);
}

/** Bar de mala muerte: paredes oscuras, neón, banda tocando al fondo y mesas alrededor. */
function drawBar(scene: Phaser.Scene, c: Phaser.GameObjects.Container, animate: boolean): void {
  const g = scene.add.graphics();
  c.add(g);
  g.fillStyle(0x24140f, 1).fillRect(0, 0, W, H);
  // Paneles de madera gastada
  g.lineStyle(3, 0x1a0e0a, 1);
  for (let x = 0; x < W; x += 90) g.lineBetween(x, 0, x, 620);
  // Barra a la izquierda con botellas
  g.fillStyle(0x3a2216, 1).fillRect(0, 430, 560, 200);
  g.fillStyle(0x140b08, 1).fillRect(0, 410, 580, 24);
  for (let i = 0; i < 18; i++) g.fillStyle([0x3a7a2a, 0x8a5a1a, 0x5a2a2a][i % 3], 1).fillRect(30 + i * 28, 300 + (i % 2) * 10, 16, 70 - (i % 2) * 10);
  g.fillStyle(0x140b08, 1).fillRect(0, 370, 560, 10);
  // Escenario al fondo con la banda
  g.fillStyle(0x110a08, 1).fillRect(760, 380, 1160, 260);
  g.fillStyle(0x2d1a12, 1).fillRect(760, 600, 1160, 40);
  for (const [x, col] of [[980, 0xff3fa4], [1340, 0xffe14d], [1680, 0x3dd6ff]] as const) {
    g.fillStyle(col, 0.12).fillTriangle(x, 0, x - 200, 640, x + 200, 640);
  }
  const band = scene.add.graphics();
  const person = (x: number, y: number, s = 1) => {
    band.fillStyle(0x050303, 1).fillCircle(x, y - 150 * s, 26 * s).fillRoundedRect(x - 36 * s, y - 124 * s, 72 * s, 124 * s, 18 * s);
  };
  person(980, 600);
  band.fillStyle(0x050303, 1).fillRect(930, 470, 120, 14); // guitarra
  person(1680, 600);
  band.fillRect(1630, 470, 130, 14); // bajo
  person(1340, 560, 0.85);
  band.fillCircle(1340, 560, 60).fillCircle(1260, 545, 34).fillCircle(1420, 545, 34); // batería
  band.fillRect(1180, 470, 70, 6).fillRect(1430, 470, 70, 6);
  c.add(band);
  if (animate) scene.tweens.add({ targets: band, y: -6, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // Neón
  c.add(label(scene, 1340, 190, 'EL ÚLTIMO TRAGO', 96, '#ff3fa4', { stroke: '#ffffff', strokeThickness: 3 }).setShadow(0, 0, '#ff3fa4', 30, true, true));
  // Piso
  g.fillStyle(0x2a1a12, 1).fillRect(0, 640, W, H - 640);
  g.lineStyle(2, 0x1c110c, 1);
  for (let y = 660; y < H; y += 40) g.lineBetween(0, y, W, y);
  // Mesas alrededor (siluetas con público)
  const tables = scene.add.graphics();
  const table = (x: number, y: number, s: number) => {
    tables.fillStyle(0x0a0605, 1).fillEllipse(x, y, 190 * s, 46 * s).fillRect(x - 8 * s, y, 16 * s, 90 * s);
    tables.fillCircle(x - 120 * s, y - 70 * s, 22 * s).fillRoundedRect(x - 150 * s, y - 50 * s, 60 * s, 110 * s, 14 * s);
    tables.fillCircle(x + 120 * s, y - 70 * s, 22 * s).fillRoundedRect(x + 90 * s, y - 50 * s, 60 * s, 110 * s, 14 * s);
    tables.fillStyle(0xd88a1a, 1).fillRect(x - 30 * s, y - 34 * s, 14 * s, 26 * s).fillRect(x + 20 * s, y - 34 * s, 14 * s, 26 * s);
  };
  table(160, 720, 1);
  table(W - 170, 720, 1);
  table(90, 980, 1.35);
  table(W - 100, 980, 1.35);
  c.add(tables);
  g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.35, 0.35, 0, 0).fillRect(0, 0, W, 300);
}

/** Silueta simple de persona (cabeza + torso), usada en público, bandas y vendedor. */
const silhouette = (g: Phaser.GameObjects.Graphics, x: number, y: number, s = 1, color = 0x050303) => {
  g.fillStyle(color, 1).fillCircle(x, y - 150 * s, 26 * s).fillRoundedRect(x - 36 * s, y - 124 * s, 72 * s, 124 * s, 18 * s);
};

/** Guitarra colgada (cuerpo + mástil hacia arriba). */
const hangingGuitar = (g: Phaser.GameObjects.Graphics, x: number, y: number, color: number) => {
  g.fillStyle(0x2a1a10, 1).fillRect(x - 5, y - 150, 10, 110);
  g.fillStyle(0x140b06, 1).fillRect(x - 9, y - 172, 18, 26);
  g.fillStyle(color, 1).fillEllipse(x, y + 10, 76, 96).fillEllipse(x, y - 34, 58, 62);
  g.fillStyle(0x000000, 0.35).fillCircle(x, y - 14, 10);
  g.lineStyle(2, 0xffffff, 0.25).strokeEllipse(x, y + 10, 76, 96);
};

/** Amplificador apilable con rejilla. */
const amp = (g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) => {
  g.fillStyle(0x151515, 1).fillRect(x, y, w, h);
  g.fillStyle(0x2b2b2b, 1).fillRect(x + 8, y + 22, w - 16, h - 30);
  g.lineStyle(1, 0x3d3d3d, 1);
  for (let i = y + 28; i < y + h - 10; i += 8) g.lineBetween(x + 10, i, x + w - 10, i);
  g.fillStyle(0xd8c48a, 1).fillRect(x + 10, y + 6, w * 0.3, 10);
};

/** Tienda de instrumentos: guitarras colgadas, amplificadores apilados y un vendedor contando plata. */
function drawShop(scene: Phaser.Scene, c: Phaser.GameObjects.Container, animate: boolean): void {
  const g = scene.add.graphics();
  c.add(g);
  g.fillStyle(0x3a2a1f, 1).fillRect(0, 0, W, H);
  // Pared con paneles perforados (slatwall)
  g.fillStyle(0x4a3628, 1).fillRect(0, 0, W, 660);
  g.lineStyle(3, 0x35261b, 1);
  for (let y = 40; y < 660; y += 46) g.lineBetween(0, y, W, y);
  // Guitarras colgadas en dos filas
  const colors = [0xc0392b, 0x2e86de, 0xf1c40f, 0x111111, 0xe67e22, 0x8e44ad, 0x16a085, 0xecf0f1];
  for (let i = 0; i < 12; i++) hangingGuitar(g, 120 + i * 145, i % 2 ? 330 : 300, colors[i % colors.length]);
  // Cartel
  g.fillStyle(0xf4ead5, 1).fillRect(W / 2 - 300, 430, 600, 70);
  g.lineStyle(4, 0xb03030, 1).strokeRect(W / 2 - 300, 430, 600, 70);
  c.add(label(scene, W / 2, 465, 'PROHIBIDO TOCAR STAIRWAY', 40, '#b03030', { fontStyle: '900' }));
  // Amplificadores apilados a los costados
  for (const x of [20, W - 220]) {
    amp(g, x, 520, 200, 140);
    amp(g, x + 10, 400, 180, 120);
    amp(g, x + 30, 310, 140, 90);
  }
  // Mostrador con el vendedor que cuenta billetes
  g.fillStyle(0x2a1c13, 1).fillRect(W / 2 - 260, 560, 520, 110);
  g.fillStyle(0x1b120c, 1).fillRect(W / 2 - 270, 548, 540, 16);
  const seller = scene.add.graphics();
  silhouette(seller, W / 2 + 120, 560, 0.95, 0x0d0907);
  c.add(seller);
  const cash = scene.add.graphics();
  cash.fillStyle(0x6fbf5a, 1).fillRect(W / 2 + 40, 520, 50, 26);
  c.add(cash);
  if (animate) scene.tweens.add({ targets: cash, y: -14, duration: 180, yoyo: true, repeat: -1, repeatDelay: 220 });
  // Piso de madera
  g.fillStyle(0x5b3f2a, 1).fillRect(0, 660, W, H - 660);
  g.lineStyle(2, 0x47301f, 1);
  for (let y = 680; y < H; y += 38) g.lineBetween(0, y, W, y);
  g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.3, 0.3, 0, 0).fillRect(0, 0, W, 200);
}

/** Biblioteca del rock: estanterías de libros y vinilos, escalera, vitral con guitarra, mesa de lectura y lámparas. */
function drawLibrary(scene: Phaser.Scene, c: Phaser.GameObjects.Container, animate: boolean): void {
  const g = scene.add.graphics();
  c.add(g);
  g.fillStyle(0x2a1a14, 1).fillRect(0, 0, W, H);
  // Vitral central con una guitarra
  g.fillStyle(0x1a0f0b, 1).fillRect(W / 2 - 170, 40, 340, 440);
  g.fillStyle(0x3b6ea8, 1).fillRect(W / 2 - 150, 60, 300, 400);
  g.fillStyle(0x8f3b76, 1).fillRect(W / 2 - 150, 60, 300, 130);
  g.fillStyle(0xe0b862, 1).fillEllipse(W / 2, 330, 120, 150).fillEllipse(W / 2, 250, 90, 100).fillRect(W / 2 - 8, 90, 16, 160);
  g.lineStyle(6, 0x1a0f0b, 1).lineBetween(W / 2, 60, W / 2, 460).lineBetween(W / 2 - 150, 260, W / 2 + 150, 260);
  // Estanterías a los costados, del piso al techo
  const rnd = new Phaser.Math.RandomDataGenerator(['biblioteca']);
  const spines = [0x8c2f2f, 0x2f4f8c, 0x2f7a4f, 0xc9a227, 0x5a2f7a, 0x1d1d1d, 0xb8622c, 0xd8d0b8];
  for (const [x0, x1] of [[0, W / 2 - 200], [W / 2 + 200, W]]) {
    g.fillStyle(0x4a2c1c, 1).fillRect(x0, 0, x1 - x0, 680);
    for (let y = 20; y < 660; y += 130) {
      g.fillStyle(0x1f120c, 1).fillRect(x0 + 16, y, x1 - x0 - 32, 110);
      let x = x0 + 22;
      while (x < x1 - 40) {
        if (rnd.frac() < 0.12) {
          // Vinilos de frente
          g.fillStyle(0x0a0a0a, 1).fillCircle(x + 46, y + 60, 44);
          g.fillStyle(rnd.pick(spines), 1).fillCircle(x + 46, y + 60, 14);
          x += 96;
          continue;
        }
        const w = rnd.between(14, 28);
        const h = rnd.between(70, 104);
        g.fillStyle(rnd.pick(spines), 1).fillRect(x, y + 110 - h, w, h);
        g.fillStyle(0xffffff, 0.15).fillRect(x + 3, y + 110 - h + 10, w - 6, 4);
        x += w + 2;
      }
      g.fillStyle(0x6b4128, 1).fillRect(x0 + 10, y + 110, x1 - x0 - 20, 14);
    }
  }
  // Escalera apoyada en la estantería izquierda
  g.lineStyle(10, 0x7a4a2a, 1).lineBetween(560, 120, 500, 680).lineBetween(630, 120, 570, 680);
  for (let i = 0; i < 9; i++) g.lineBetween(560 - i * 6.6, 160 + i * 58, 630 - i * 6.6, 160 + i * 58);
  // Cartel
  g.fillStyle(0xf4ead5, 1).fillRect(W / 2 - 260, 500, 520, 64);
  g.lineStyle(4, 0x6b4128, 1).strokeRect(W / 2 - 260, 500, 520, 64);
  c.add(label(scene, W / 2, 532, 'SILENCIO, SALVO EN LOS SOLOS', 30, '#6b4128', { fontStyle: '900' }));
  // Mesa de lectura con libros abiertos y lámparas verdes
  g.fillStyle(0x3a2216, 1).fillRect(W / 2 - 320, 600, 640, 70);
  g.fillStyle(0xf4ead5, 1).fillRect(W / 2 - 200, 586, 120, 16).fillRect(W / 2 + 80, 586, 120, 16);
  const glow = scene.add.graphics();
  for (const x of [W / 2 - 260, W / 2 + 260]) {
    g.fillStyle(0x0f3d26, 1).fillEllipse(x, 560, 90, 34);
    g.fillStyle(0xc9a227, 1).fillRect(x - 4, 570, 8, 30);
    glow.fillStyle(0xffd27a, 0.14).fillTriangle(x, 560, x - 130, 680, x + 130, 680);
  }
  c.add(glow);
  if (animate) scene.tweens.add({ targets: glow, alpha: 0.6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // Piso de parquet
  g.fillStyle(0x5b3a24, 1).fillRect(0, 680, W, H - 680);
  g.lineStyle(2, 0x45291a, 1);
  for (let y = 700; y < H; y += 40) g.lineBetween(0, y, W, y);
  g.fillStyle(0x6e1f1f, 0.55).fillRect(W / 2 - 520, 760, 1040, 220);
  g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.4, 0.4, 0, 0).fillRect(0, 0, W, 220);
}

/** Barrio Chino de Lima de noche: portada roja, fachadas con letreros de chifa, guirnaldas de faroles. */
function drawChinatown(scene: Phaser.Scene, c: Phaser.GameObjects.Container, animate: boolean): void {
  const g = scene.add.graphics();
  c.add(g);
  g.fillGradientStyle(0x0d0a1f, 0x0d0a1f, 0x2a1030, 0x2a1030, 1).fillRect(0, 0, W, 680);
  // Fachadas con ventanas iluminadas y letreros
  const rnd = new Phaser.Math.RandomDataGenerator(['capon']);
  const fronts = [0x3a1d1d, 0x2b2236, 0x3b2a1a, 0x1f2a2e];
  const signs = ['CHIFA', 'WANTÁN', 'TÉ', 'ARROZ CHAUFA', 'BAZAR', 'KAM LU'];
  for (let i = 0, x = 0; x < W; i++) {
    const w = rnd.between(260, 380);
    const top = rnd.between(120, 240);
    g.fillStyle(fronts[i % fronts.length], 1).fillRect(x, top, w, 680 - top);
    for (let wy = top + 40; wy < 470; wy += 80) for (let wx = x + 30; wx < x + w - 50; wx += 70) g.fillStyle(rnd.frac() < 0.6 ? 0xffc46b : 0x15101a, 0.85).fillRect(wx, wy, 34, 46);
    const sign = signs[i % signs.length];
    const sx = x + w / 2;
    g.fillStyle(0x7a0f14, 1).fillRect(sx - 110, 500, 220, 56);
    g.lineStyle(3, 0xffd166, 1).strokeRect(sx - 110, 500, 220, 56);
    c.add(label(scene, sx, 528, sign, sign.length > 8 ? 24 : 32, '#ffd166', { fontStyle: '900' }));
    x += w + 6;
  }
  // Portada roja al centro
  g.fillStyle(0xb3121c, 1).fillRect(W / 2 - 330, 170, 34, 510).fillRect(W / 2 + 296, 170, 34, 510);
  g.fillStyle(0x1a6b4a, 1).fillRect(W / 2 - 380, 150, 760, 30);
  g.fillStyle(0xb3121c, 1).fillRect(W / 2 - 360, 180, 720, 70);
  g.fillStyle(0x1a6b4a, 1).fillTriangle(W / 2 - 420, 150, W / 2 - 370, 120, W / 2 - 370, 150).fillTriangle(W / 2 + 420, 150, W / 2 + 370, 120, W / 2 + 370, 150);
  g.lineStyle(4, 0xffd166, 1).strokeRect(W / 2 - 360, 180, 720, 70);
  c.add(label(scene, W / 2, 215, 'BARRIO CHINO', 46, '#ffd166', { fontStyle: '900' }));
  // Guirnaldas de faroles cruzando la calle
  const lanterns = scene.add.graphics();
  for (const [y0, sag] of [[300, 60], [380, 50]] as const) {
    g.lineStyle(2, 0x111111, 1);
    for (let x = 0; x < W; x += 20) g.lineBetween(x, y0 + Math.sin((x / W) * Math.PI) * sag, x + 20, y0 + Math.sin(((x + 20) / W) * Math.PI) * sag);
    for (let x = 60; x < W; x += 150) {
      const y = y0 + Math.sin((x / W) * Math.PI) * sag + 26;
      lanterns.fillStyle(0xff3b3b, 0.18).fillCircle(x, y, 46);
      lanterns.fillStyle(0xe0141e, 1).fillEllipse(x, y, 44, 52);
      lanterns.fillStyle(0xffd166, 1).fillRect(x - 14, y - 30, 28, 6).fillRect(x - 14, y + 24, 28, 6);
    }
  }
  c.add(lanterns);
  if (animate) scene.tweens.add({ targets: lanterns, y: 5, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // Vereda y pista
  g.fillStyle(0x2b2a30, 1).fillRect(0, 680, W, H - 680);
  g.fillStyle(0x3a3940, 1).fillRect(0, 680, W, 30);
  g.fillStyle(0xff5a5f, 0.08).fillRect(0, 710, W, 200);
  g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.35, 0.35, 0, 0).fillRect(0, 0, W, 160);
}

/** Mall del rock: claraboya, dos pisos de tiendas con neones de rock, escalera mecánica y una guitarra gigante al centro. */
function drawMall(scene: Phaser.Scene, c: Phaser.GameObjects.Container, animate: boolean): void {
  const g = scene.add.graphics();
  c.add(g);
  g.fillStyle(0x1c1a24, 1).fillRect(0, 0, W, H);
  // Claraboya de vidrio
  g.fillGradientStyle(0x2c3e6b, 0x2c3e6b, 0x141824, 0x141824, 1).fillRect(0, 0, W, 90);
  g.lineStyle(4, 0x0b0b10, 1);
  for (let x = 0; x <= W; x += 160) g.lineBetween(x, 0, x, 90);
  // Dos pisos de tiendas con neones
  const stores: [string, number][] = [
    ['DISTORSIÓN STORE', 0xff3fa4], ['VINILOS 33', 0x3dd6ff], ['PÚAS & CUERDAS', 0xffe14d], ['POLOS DE BANDA', 0x7cff4d],
    ['HEAVY BURGER', 0xff7a2b], ['AMPLIS MIL', 0xc77dff], ['BATERÍAS YA', 0xff4d4d], ['ROCK CAFÉ', 0x8ecae6],
  ];
  const neons = scene.add.graphics();
  const sw = W / 4;
  stores.forEach(([name, col], i) => {
    const x = (i % 4) * sw;
    const y = i < 4 ? 110 : 400;
    g.fillStyle(0x2a2733, 1).fillRect(x + 12, y, sw - 24, 250);
    g.fillStyle(0x0f0e14, 1).fillRect(x + 30, y + 80, sw - 60, 160);
    g.fillStyle(col, 0.12).fillRect(x + 30, y + 80, sw - 60, 160);
    // Escaparate: guitarras, discos o polos según la tienda
    for (let k = 0; k < 3; k++) {
      const ix = x + 90 + k * ((sw - 180) / 2);
      if (i % 3 === 0) g.fillStyle(col, 0.8).fillEllipse(ix, y + 190, 40, 52).fillRect(ix - 3, y + 110, 6, 70);
      else if (i % 3 === 1) g.fillStyle(0x050505, 1).fillCircle(ix, y + 170, 34).fillStyle(col, 1).fillCircle(ix, y + 170, 10);
      else g.fillStyle(col, 0.7).fillRect(ix - 26, y + 140, 52, 60).fillRect(ix - 40, y + 140, 80, 18);
    }
    neons.lineStyle(4, col, 1).strokeRect(x + 40, y + 16, sw - 80, 50);
    c.add(label(scene, x + sw / 2, y + 41, name, 28, '#ffffff', { stroke: `#${col.toString(16).padStart(6, '0')}`, strokeThickness: 3 }));
  });
  c.add(neons);
  if (animate) scene.tweens.add({ targets: neons, alpha: 0.55, duration: 90, yoyo: true, repeat: -1, repeatDelay: 2600 });
  // Baranda del segundo piso
  g.fillStyle(0x9aa3b5, 0.35).fillRect(0, 360, W, 34);
  g.lineStyle(4, 0xc9d1e0, 1).lineBetween(0, 360, W, 360);
  // Escalera mecánica en diagonal
  g.fillStyle(0x3a3a46, 1).fillPoints([{ x: 1300, y: 680 }, { x: 1600, y: 380 }, { x: 1680, y: 380 }, { x: 1380, y: 680 }] as Phaser.Math.Vector2[], true);
  g.lineStyle(3, 0x15151c, 1);
  for (let k = 1; k < 12; k++) g.lineBetween(1300 + k * 25, 680 - k * 25, 1380 + k * 25, 680 - k * 25);
  // Guitarra gigante sobre un pedestal al centro
  g.fillStyle(0x111111, 1).fillRect(W / 2 - 90, 600, 180, 80);
  g.fillStyle(0xd62828, 1).fillEllipse(W / 2, 520, 150, 180).fillEllipse(W / 2, 420, 110, 120);
  g.fillStyle(0x2a1a10, 1).fillRect(W / 2 - 10, 190, 20, 230);
  g.fillStyle(0x111111, 1).fillRect(W / 2 - 18, 160, 36, 40).fillCircle(W / 2, 470, 22);
  // Piso pulido con reflejos
  g.fillStyle(0xd8d2c4, 1).fillRect(0, 680, W, H - 680);
  g.lineStyle(2, 0xbdb6a6, 1);
  for (let x = 0; x < W; x += 160) g.lineBetween(x, 680, x, H);
  for (let y = 760; y < H; y += 80) g.lineBetween(0, y, W, y);
  g.fillStyle(0xffffff, 0.12).fillRect(0, 690, W, 40);
}

/** El Arenal: cerros de arena, casas de ladrillo a medio hacer, cisterna, mototaxi y polvo al viento. */
function drawArenal(scene: Phaser.Scene, c: Phaser.GameObjects.Container, animate: boolean): void {
  const g = scene.add.graphics();
  c.add(g);
  // Cielo blanco de Lima con sol que quema
  g.fillGradientStyle(0xe9e4d8, 0xe9e4d8, 0xf6d9a8, 0xf6d9a8, 1).fillRect(0, 0, W, 640);
  g.fillStyle(0xfff4c9, 0.8).fillCircle(1560, 140, 80);
  // Cerros de arena en capas
  const dune = (base: number, amp: number, color: number, seed: string) => {
    const rnd = new Phaser.Math.RandomDataGenerator([seed]);
    const pts: { x: number; y: number }[] = [{ x: 0, y: 700 }];
    for (let x = 0; x <= W; x += 160) pts.push({ x, y: base - rnd.between(0, amp) });
    pts.push({ x: W, y: 700 });
    g.fillStyle(color, 1).fillPoints(pts as Phaser.Math.Vector2[], true);
  };
  dune(330, 160, 0xd9b27a, 'cerro-lejos');
  dune(440, 110, 0xc99a5e, 'cerro-medio');
  // Casitas en el cerro (puntos de colores)
  const rnd = new Phaser.Math.RandomDataGenerator(['arenal']);
  for (let i = 0; i < 40; i++) g.fillStyle(rnd.pick([0xb5543c, 0x8aa6b8, 0xe0c25a, 0x9c6b4a]), 1).fillRect(rnd.between(0, W), rnd.between(300, 470), 22, 16);
  // Casas de ladrillo a medio construir, con fierros arriba
  for (const [x, w, floors] of [[40, 360, 2], [460, 300, 1], [1180, 320, 2], [1560, 340, 1]] as const) {
    const top = 640 - floors * 120;
    g.fillStyle(0xa8553a, 1).fillRect(x, top, w, 640 - top);
    g.lineStyle(2, 0x7a3a26, 1);
    for (let y = top + 20; y < 640; y += 20) g.lineBetween(x, y, x + w, y);
    g.fillStyle(0x3b2a20, 1).fillRect(x + 40, 640 - 100, 70, 100);
    g.fillStyle(0x6fa3c7, 1).fillRect(x + w - 120, top + 30, 70, 60);
    g.lineStyle(4, 0x4a4a4a, 1);
    for (let k = 20; k < w; k += 60) g.lineBetween(x + k, top, x + k, top - 50);
    g.fillStyle(0x1f1f1f, 1).fillRect(x + w / 2 - 30, top - 70, 60, 50); // tanque de agua
  }
  // Letrero pintado a mano
  g.fillStyle(0xf4ead5, 1).fillRect(820, 470, 300, 60);
  g.lineStyle(3, 0x7a3a26, 1).strokeRect(820, 470, 300, 60);
  c.add(label(scene, 970, 500, 'SE VENDE AGUA', 30, '#b5543c', { fontStyle: '900' }));
  // Cisterna de agua y mototaxi
  g.fillStyle(0x2f6fb2, 1).fillRoundedRect(620, 540, 260, 90, 30);
  g.fillStyle(0xd8d8d8, 1).fillRect(880, 560, 70, 70);
  g.fillStyle(0x111111, 1).fillCircle(680, 640, 26).fillCircle(910, 640, 26);
  g.fillStyle(0xd62828, 1).fillRoundedRect(1010, 560, 120, 70, 14);
  g.fillStyle(0x1b1b1b, 1).fillRect(1000, 548, 140, 14);
  g.fillStyle(0x111111, 1).fillCircle(1030, 640, 18).fillCircle(1110, 640, 18).fillCircle(1150, 640, 16);
  // Arena del suelo
  g.fillStyle(0xd8b47c, 1).fillRect(0, 640, W, H - 640);
  g.fillStyle(0xc9a26a, 1);
  for (let i = 0; i < 60; i++) g.fillEllipse(rnd.between(0, W), rnd.between(700, H), rnd.between(60, 200), rnd.between(6, 14));
  // Polvo que pasa con el viento
  const dust = scene.add.graphics();
  for (let i = 0; i < 18; i++) dust.fillStyle(0xf3dcae, 0.25).fillEllipse(rnd.between(0, W), rnd.between(560, 900), rnd.between(120, 300), rnd.between(20, 50));
  c.add(dust);
  if (animate) scene.tweens.add({ targets: dust, x: 260, duration: 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

/** Festival en el cerro: montañas andinas, escenario con banda, banderines, foquitos y público con vasos. */
function drawFestival(scene: Phaser.Scene, c: Phaser.GameObjects.Container, animate: boolean): void {
  const g = scene.add.graphics();
  c.add(g);
  // Cielo al atardecer y cordillera en capas
  g.fillGradientStyle(0x2b1b4f, 0x2b1b4f, 0xf08a4b, 0xf08a4b, 1).fillRect(0, 0, W, 620);
  const ridge = (base: number, amp: number, color: number, seed: string) => {
    const rnd = new Phaser.Math.RandomDataGenerator([seed]);
    const pts: { x: number; y: number }[] = [{ x: 0, y: 700 }];
    for (let x = 0; x <= W; x += 120) pts.push({ x, y: base - rnd.between(0, amp) });
    pts.push({ x: W, y: 700 });
    g.fillStyle(color, 1).fillPoints(pts as Phaser.Math.Vector2[], true);
  };
  ridge(380, 220, 0x4a3a6b, 'far');
  ridge(470, 140, 0x35294f, 'mid');
  g.fillStyle(0xffffff, 0.9).fillTriangle(560, 190, 610, 250, 510, 250);
  // Escenario con estructura de luces
  g.fillStyle(0x1a1420, 1).fillRect(640, 330, 640, 300);
  g.lineStyle(10, 0x7a7a7a, 1).strokeRect(620, 300, 680, 340);
  g.fillStyle(0x2a1f30, 1).fillRect(640, 600, 640, 40);
  for (const [x, col] of [[760, 0xff3fa4], [960, 0xffe14d], [1160, 0x3dd6ff]] as const) g.fillStyle(col, 0.16).fillTriangle(x, 300, x - 170, 630, x + 170, 630);
  const band = scene.add.graphics();
  silhouette(band, 760, 600);
  band.fillStyle(0x050303, 1).fillRect(715, 470, 110, 12);
  silhouette(band, 960, 590, 0.9);
  band.fillCircle(960, 590, 52);
  silhouette(band, 1160, 600);
  band.fillRect(1110, 470, 120, 12);
  c.add(band);
  if (animate) scene.tweens.add({ targets: band, y: -6, duration: 280, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // Banderines y foquitos de colores
  const flags = [0xe63946, 0xffffff, 0xffd166, 0x06d6a0, 0x118ab2, 0xef476f];
  for (const [y0, sag] of [[120, 60], [190, 50]] as const) {
    for (let i = 0; i < 24; i++) {
      const x = i * 82;
      const y = y0 + Math.sin((i / 23) * Math.PI) * sag;
      g.fillStyle(flags[i % flags.length], 1).fillTriangle(x, y, x + 50, y, x + 25, y + 44);
    }
  }
  for (let i = 0; i < 40; i++) g.fillStyle(flags[i % flags.length], 0.95).fillCircle(i * 50 + 10, 260 + Math.sin(i * 0.6) * 10, 7);
  // Pasto y público con vasos de cerveza
  g.fillStyle(0x2f5d2a, 1).fillRect(0, 640, W, H - 640);
  const crowd = scene.add.graphics();
  for (let i = 0; i < 16; i++) {
    const x = 40 + i * 125;
    const y = i % 2 ? 1060 : 1040;
    silhouette(crowd, x, y, 1.15, 0x0a0a0a);
    crowd.fillStyle(0xf5b82e, 1).fillRect(x + 34, y - 210, 18, 30);
    crowd.fillStyle(0xffffff, 1).fillRect(x + 34, y - 214, 18, 6);
  }
  c.add(crowd);
  if (animate) scene.tweens.add({ targets: crowd, y: -10, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

/** Azotea de Lima de noche: tanques de agua, antenas, cables, amplis en una extensión dudosa y un vecino furioso. */
function drawRooftop(scene: Phaser.Scene, c: Phaser.GameObjects.Container, animate: boolean): void {
  const g = scene.add.graphics();
  c.add(g);
  g.fillGradientStyle(0x060a1f, 0x060a1f, 0x1c2a52, 0x1c2a52, 1).fillRect(0, 0, W, 700);
  // Ciudad con ventanas encendidas
  const rnd = new Phaser.Math.RandomDataGenerator(['lima']);
  for (let x = 0; x < W; x += rnd.between(70, 130)) {
    const h = rnd.between(120, 320);
    const w = rnd.between(60, 120);
    g.fillStyle(0x0c1124, 1).fillRect(x, 640 - h, w, h);
    for (let wy = 640 - h + 14; wy < 630; wy += 26) for (let wx = x + 10; wx < x + w - 12; wx += 22) {
      if (rnd.frac() < 0.35) g.fillStyle(0xffd27a, 0.8).fillRect(wx, wy, 10, 12);
    }
  }
  // Azotea del vecino con su silueta
  g.fillStyle(0x1a1f33, 1).fillRect(1380, 420, 540, 230);
  const neighbor = scene.add.graphics();
  silhouette(neighbor, 1620, 430, 0.75, 0x02030a);
  neighbor.fillStyle(0x02030a, 1).fillRect(1640, 330, 50, 10);
  c.add(neighbor);
  const shout = label(scene, 1640, 250, '¡VOY A LLAMAR A SERENAZGO!', 30, '#ffffff', { stroke: '#000000', strokeThickness: 6 });
  c.add(shout);
  if (animate) scene.tweens.add({ targets: [neighbor, shout], y: '-=8', duration: 160, yoyo: true, repeat: -1, repeatDelay: 600 });
  // Tanques de agua y antenas
  for (const x of [180, 520]) {
    g.fillStyle(0x3b3f4a, 1).fillRect(x - 70, 470, 140, 180);
    g.fillStyle(0x2c2f38, 1).fillEllipse(x, 470, 140, 40);
    g.fillStyle(0x50555f, 1).fillRect(x - 70, 640, 140, 10);
  }
  g.lineStyle(4, 0x9aa0ad, 1).lineBetween(820, 650, 820, 360).lineBetween(780, 400, 860, 400).lineBetween(790, 440, 850, 440);
  // Cables cruzando y la extensión sospechosa con amplis
  g.lineStyle(3, 0x000000, 0.9);
  g.beginPath();
  g.moveTo(0, 300);
  g.lineTo(600, 360);
  g.lineTo(1300, 330);
  g.strokePath();
  amp(g, 980, 520, 190, 130);
  amp(g, 1180, 560, 150, 90);
  g.fillStyle(0xd9d9d9, 1).fillRect(1080, 680, 120, 26);
  for (let i = 0; i < 4; i++) g.fillStyle(0x333333, 1).fillRect(1090 + i * 28, 688, 12, 10);
  g.lineStyle(3, 0x111111, 1).lineBetween(1100, 690, 1060, 650).lineBetween(1130, 690, 1200, 650);
  const spark = scene.add.graphics();
  spark.fillStyle(0xfff36b, 1).fillTriangle(1205, 690, 1225, 676, 1220, 700);
  c.add(spark);
  if (animate) scene.tweens.add({ targets: spark, alpha: 0, duration: 90, yoyo: true, repeat: -1, repeatDelay: 900 });
  // Piso de concreto
  g.fillStyle(0x4a4c55, 1).fillRect(0, 650, W, H - 650);
  g.lineStyle(2, 0x3c3e46, 1);
  for (let x = 0; x < W; x += 240) g.lineBetween(x, 650, x - 120, H);
  g.fillStyle(0x2c2e35, 1).fillRect(0, 650, W, 16);
}

/** Feria del tomate: calle de pueblo español, casas blancas con tejas, banderines y tomates volando. */
function drawTomato(scene: Phaser.Scene, c: Phaser.GameObjects.Container, animate: boolean): void {
  const g = scene.add.graphics();
  c.add(g);
  g.fillGradientStyle(0x6ec6ff, 0x6ec6ff, 0xd8f0ff, 0xd8f0ff, 1).fillRect(0, 0, W, 640);
  g.fillStyle(0xfff3c4, 1).fillCircle(1650, 110, 60);
  // Casas encaladas con techos de teja, ventanas y balcones
  const rnd = new Phaser.Math.RandomDataGenerator(['buñol']);
  const splat = (x: number, y: number, r: number) => {
    g.fillStyle(0xd9261c, 0.9).fillCircle(x, y, r);
    for (let k = 0; k < 6; k++) g.fillCircle(x + rnd.between(-r * 1.6, r * 1.6), y + rnd.between(-r * 1.2, r * 1.2), rnd.between(3, r * 0.5));
  };
  for (let x = -20; x < W; x += 330) {
    const top = rnd.between(170, 260);
    g.fillStyle(0xf7f3ea, 1).fillRect(x, top, 320, 660 - top);
    g.fillStyle(0xc4532d, 1).fillTriangle(x - 20, top, x + 160, top - 80, x + 340, top);
    for (const wx of [x + 50, x + 200]) {
      g.fillStyle(0x3d6b8f, 1).fillRect(wx, top + 70, 70, 90);
      g.fillStyle(0x2f2f2f, 1).fillRect(wx - 10, top + 160, 90, 8);
      g.lineStyle(3, 0x2f2f2f, 1);
      for (let b = wx - 6; b < wx + 80; b += 14) g.lineBetween(b, top + 160, b, top + 128);
    }
    g.fillStyle(0x8a4b2a, 1).fillRect(x + 120, 500, 80, 160);
    for (let k = 0; k < 5; k++) splat(x + rnd.between(20, 300), rnd.between(top + 40, 620), rnd.between(10, 22));
  }
  // Banderines rojos y amarillos cruzando la calle
  for (let i = 0; i < 26; i++) {
    const x = i * 76;
    const y = 120 + Math.sin((i / 25) * Math.PI) * 70;
    g.fillStyle(i % 2 ? 0xffc400 : 0xc60b1e, 1).fillTriangle(x, y, x + 46, y, x + 23, y + 40);
  }
  // Calle empedrada cubierta de tomate
  g.fillStyle(0xb9a58c, 1).fillRect(0, 640, W, H - 640);
  g.lineStyle(2, 0x9c8a73, 1);
  for (let y = 660; y < H; y += 34) for (let x = (y / 34) % 2 ? 0 : 30; x < W; x += 60) g.strokeRoundedRect(x, y, 56, 30, 8);
  for (let k = 0; k < 26; k++) {
    g.fillStyle(0xc81d14, 0.75).fillEllipse(rnd.between(0, W), rnd.between(670, H - 10), rnd.between(60, 180), rnd.between(16, 40));
  }
  // Público tirando tomates (al fondo, a los costados)
  const crowd = scene.add.graphics();
  for (const x of [80, 200, 1720, 1840]) silhouette(crowd, x, 700, 1, 0x3a1a12);
  c.add(crowd);
  // Tomates volando en arco
  for (let i = 0; i < 6; i++) {
    const t = scene.add.graphics();
    t.fillStyle(0xe8231a, 1).fillCircle(0, 0, 14);
    t.fillStyle(0x2e8b2e, 1).fillTriangle(-6, -12, 6, -12, 0, -20);
    const fromLeft = i % 2 === 0;
    t.setPosition(fromLeft ? 150 : 1770, 520);
    c.add(t);
    if (animate) {
      scene.tweens.add({ targets: t, x: fromLeft ? 1500 - i * 90 : 420 + i * 90, duration: 1400 + i * 120, delay: i * 380, repeat: -1, repeatDelay: 600 });
      scene.tweens.add({ targets: t, y: 140 + i * 25, duration: (1400 + i * 120) / 2, delay: i * 380, yoyo: true, ease: 'Sine.easeOut', repeat: -1, repeatDelay: 600 });
    }
  }
}

/** Interior del ampli (jefe): vacío negro, parlantes gigantes y ondas de sonido que laten como un corazón. */
function drawAmpInside(scene: Phaser.Scene, c: Phaser.GameObjects.Container, animate: boolean): void {
  const g = scene.add.graphics();
  c.add(g);
  g.fillGradientStyle(0x02030a, 0x02030a, 0x0b1430, 0x0b1430, 1).fillRect(0, 0, W, H);
  // Parlantes gigantes a los costados y al fondo
  const speaker = (x: number, y: number, r: number) => {
    g.fillStyle(0x0d0f16, 1).fillRect(x - r - 30, y - r - 30, (r + 30) * 2, (r + 30) * 2);
    g.fillStyle(0x161a24, 1).fillCircle(x, y, r);
    g.fillStyle(0x080a10, 1).fillCircle(x, y, r * 0.62);
    g.fillStyle(0x23293a, 1).fillCircle(x, y, r * 0.22);
  };
  speaker(170, 360, 140);
  speaker(W - 170, 360, 140);
  speaker(560, 230, 90);
  speaker(W - 560, 230, 90);
  // Ondas que laten desde el centro
  const waves = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  c.add(waves);
  let t = 0;
  const draw = () => {
    waves.clear();
    for (let k = 0; k < 6; k++) {
      const r = ((t * 0.12 + k * 90) % 540) + 40;
      waves.lineStyle(4, 0x7df9ff, Math.max(0, 0.5 - r / 1100)).strokeEllipse(W / 2, 520, r * 2.4, r * 1.2);
    }
  };
  draw();
  if (animate) scene.time.addEvent({ delay: 33, loop: true, callback: () => { t += 33; if (waves.active) draw(); } });
  // Piso: rejilla del ampli
  g.fillStyle(0x0a0c12, 1).fillRect(0, 700, W, H - 700);
  g.lineStyle(2, 0x1c2233, 1);
  for (let y = 712; y < H; y += 18) g.lineBetween(0, y, W, y);
  g.lineStyle(3, 0x7df9ff, 0.35).lineBetween(0, 700, W, 700);
}
