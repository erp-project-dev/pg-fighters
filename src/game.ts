import Phaser from 'phaser';
import { GAME_CONFIG_BASE } from './config';
import { StoryRun } from './systems/StoryRun';
import { BootScene } from './scenes/BootScene';
import { ControlsScene } from './scenes/ControlsScene';
import { CreditsScene } from './scenes/CreditsScene';
import { DisclaimerScene } from './scenes/DisclaimerScene';
import { LabPickScene } from './scenes/LabPickScene';
import { FightScene } from './scenes/FightScene';
import { HudScene } from './scenes/HudScene';
import { LabScene } from './scenes/LabScene';
import { PauseScene } from './scenes/PauseScene';
import { PreloadScene } from './scenes/PreloadScene';
import { ResultsScene } from './scenes/ResultsScene';
import { SelectScene } from './scenes/SelectScene';
import { StageSelectScene } from './scenes/StageSelectScene';
import { SuperCutInScene } from './scenes/SuperCutInScene';
import { TitleScene } from './scenes/TitleScene';
import { TrainingHudScene } from './scenes/TrainingHudScene';
import { VersusScene } from './scenes/VersusScene';
import { StoryScene } from './scenes/StoryScene';
import { StoryProgressScene } from './scenes/StoryProgressScene';
import { ContinueScene } from './scenes/ContinueScene';
import { LoginScene } from './scenes/LoginScene';
import { NameEntryScene } from './scenes/NameEntryScene';
import { RankingScene } from './scenes/RankingScene';

/** Arranca el juego (main.ts lo carga solo si el equipo se puede usar para jugar). */
export const startGame = (): void => {
  const game = new Phaser.Game({
    ...GAME_CONFIG_BASE,
    parent: 'game',
    scene: [BootScene, PreloadScene, TitleScene, ControlsScene, SelectScene, StageSelectScene, VersusScene, FightScene, HudScene, TrainingHudScene, SuperCutInScene, PauseScene, ResultsScene, StoryScene, StoryProgressScene, ContinueScene, LoginScene, NameEntryScene, RankingScene, CreditsScene, DisclaimerScene, LabScene, LabPickScene],
  });

  // Acceso desde la consola del navegador en desarrollo.
  if (import.meta.env.DEV) Object.assign(window, { game, story: StoryRun });
};
