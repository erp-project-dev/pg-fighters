import Phaser from 'phaser';

/** Resolución nativa Full HD; se escala a la ventana manteniendo 16:9. */
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

/** Línea del suelo (pies de los luchadores) y límites del escenario. */
export const GROUND_Y = 940;
export const STAGE_LEFT = 120;
export const STAGE_RIGHT = GAME_WIDTH - 120;

export const FONTS = {
  head: '"Barlow Condensed", Impact, sans-serif',
  body: '"Barlow", Arial, sans-serif',
} as const;

/** Paleta PG Fighters: lima de neón, óxido y crema sobre negro de bar. */
export const COLORS = {
  bg: 0x0b0a0e,
  panel: 0x16151b,
  lime: 0xdfff00,
  rust: 0xec694c,
  cream: 0xe9e5d9,
  red: 0xff2d45,
  blue: 0x3d8bff,
  grey: 0x6f6d66,
  dark: 0x26252b,
  white: 0xffffff,
} as const;

export const CSS = {
  lime: '#dfff00',
  rust: '#ec694c',
  cream: '#e9e5d9',
  red: '#ff2d45',
  blue: '#3d8bff',
  grey: '#8b897f',
  white: '#ffffff',
  dark: '#0b0a0e',
} as const;

export const SCENES = {
  Boot: 'Boot',
  Preload: 'Preload',
  Title: 'Title',
  Controls: 'Controls',
  Select: 'Select',
  StageSelect: 'StageSelect',
  Versus: 'Versus',
  Fight: 'Fight',
  Hud: 'Hud',
  TrainingHud: 'TrainingHud',
  Showcase: 'Showcase',
  Lab: 'Lab',
  Pause: 'Pause',
  SuperCutIn: 'SuperCutIn',
  Results: 'Results',
  Story: 'Story',
  StoryProgress: 'StoryProgress',
  Continue: 'Continue',
  Login: 'Login',
  NameEntry: 'NameEntry',
  Ranking: 'Ranking',
  Credits: 'Credits',
  Disclaimer: 'Disclaimer',
  LabPick: 'LabPick',
} as const;

/** Rondas: al mejor de 3, 60 segundos. */
export const ROUNDS_TO_WIN = 2;
export const ROUND_SECONDS = 60;

export const GAME_CONFIG_BASE: Partial<Phaser.Types.Core.GameConfig> = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.bg,
  antialias: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { mouse: { preventDefaultWheel: false } },
};
