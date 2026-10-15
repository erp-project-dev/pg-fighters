import Phaser from 'phaser';

export const SFX = ['punch', 'kick', 'swing'] as const;
export type SfxId = (typeof SFX)[number];

/** Pistas de música: menús y pelea (El Sótano). */
export const MUSIC = {
  menu: 'music-menu',
  stage: 'music-stage-sotano',
  /** Tienda de instrumentos: "Instrumental Box". */
  tienda: 'music-stage-tienda',
  /** Barrio Bravo: "Midnight Rumble". */
  barrio: 'music-stage-barrio',
  /** El Festival del Cerro. */
  festival: 'music-stage-festival',
  /** Estación del Metro: "Neon Commuter". */
  metro: 'music-stage-metro',
  /** La Azotea del Ensayo: "Instrumental Rock". */
  azotea: 'music-stage-azotea',
  /** La Feria del Tomate: "Fuego y Acero". */
  tomate: 'music-stage-tomate',
  /** La Biblioteca del Rock. */
  biblioteca: 'music-stage-biblioteca',
  /** El Arenal: "Oriental Rock". */
  arenal: 'music-stage-arenal',
  /** El Barrio Chino: "Callejón del Club" (de RockStreet). */
  chino: 'music-stage-chino',
  /** El Mall del Rock: "La Disquería" (de RockStreet). */
  mall: 'music-stage-mall',
  /** Pelea final contra El Acople: "Teeth in the Sink". */
  boss: 'music-boss-acople',
} as const;
export type MusicKey = (typeof MUSIC)[keyof typeof MUSIC];

/** Carga música y efectos (llamar desde preload). */
export const loadAudio = (scene: Phaser.Scene) => {
  scene.load.audio(MUSIC.menu, 'assets/audio/music/menu.mp3');
  scene.load.audio(MUSIC.azotea, 'assets/audio/music/stage-azotea.mp3');
  scene.load.audio(MUSIC.metro, 'assets/audio/music/stage-metro.mp3');
  scene.load.audio(MUSIC.barrio, 'assets/audio/music/stage-barrio.mp3');
  scene.load.audio(MUSIC.festival, 'assets/audio/music/stage-festival.mp3');
  scene.load.audio(MUSIC.stage, 'assets/audio/music/stage-sotano.mp3');
  scene.load.audio(MUSIC.tienda, 'assets/audio/music/stage-tienda.mp3');
  scene.load.audio(MUSIC.tomate, 'assets/audio/music/stage-tomate.mp3');
  scene.load.audio(MUSIC.biblioteca, 'assets/audio/music/stage-biblioteca.mp3');
  scene.load.audio(MUSIC.arenal, 'assets/audio/music/stage-arenal.mp3');
  scene.load.audio(MUSIC.chino, 'assets/audio/music/stage-chino.mp3');
  scene.load.audio(MUSIC.mall, 'assets/audio/music/stage-mall.mp3');
  scene.load.audio(MUSIC.boss, 'assets/audio/music/boss-acople.mp3');
  for (const id of SFX) scene.load.audio(`sfx-${id}`, `assets/${id}.wav`);
};

type Track = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
let current: Track | null = null;
let currentVolume = 0.5;

/** Fundido independiente de las escenas (sus tweens mueren al cambiar de escena). */
const fade = (track: Track, to: number, ms: number, done?: () => void) => {
  const from = track.volume;
  const start = performance.now();
  const id = window.setInterval(() => {
    const t = Math.min(1, (performance.now() - start) / ms);
    track.setVolume(from + (to - from) * t);
    if (t >= 1) {
      window.clearInterval(id);
      done?.();
    }
  }, 30);
};

/** Música global y efectos. El SoundManager es del juego, así que la música sigue entre escenas. */
export const Audio = {
  init(scene: Phaser.Scene): void {
    scene.sound.mute = false;
  },

  /** Cambia de pista con fundido; si ya suena, solo ajusta el volumen. */
  music(scene: Phaser.Scene, key: MusicKey, volume = 0.5): void {
    currentVolume = volume;
    if (current?.key === key && !current.pendingRemove) {
      fade(current, volume, 400);
      return;
    }
    this.stopMusic();
    if (!scene.cache.audio.exists(key)) return;
    const track = scene.sound.add(key, { loop: true, volume: 0 }) as Track;
    current = track;
    track.play(); // si el navegador bloquea el audio, Phaser lo inicia al primer clic o tecla
    fade(track, volume, 600);
  },

  /** Baja la música mientras suena el solo del súper (y la restaura). */
  duck(on: boolean): void {
    if (current) fade(current, on ? currentVolume * 0.2 : currentVolume, on ? 150 : 600);
  },

  stopMusic(ms = 500): void {
    const track = current;
    current = null;
    if (track) fade(track, 0, ms, () => track.destroy());
  },

  sfx(scene: Phaser.Scene, id: SfxId, volume = 0.6, rate = 1): void {
    if (scene.sound.locked) return;
    scene.sound.play(`sfx-${id}`, { volume, rate });
  },

  /** Tono sintetizado corto (impactos, anunciador, menús). */
  tone(scene: Phaser.Scene, freq: number, duration = 0.08, type: OscillatorType = 'square', vol = 0.05): void {
    const ctx = (scene.sound as Phaser.Sound.WebAudioSoundManager).context;
    if (!ctx || scene.sound.mute || ctx.state !== 'running') return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(25, freq / 3), t + duration);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + duration);
  },

  /** "Blip" de menú. */
  blip(scene: Phaser.Scene, high = false): void {
    this.tone(scene, high ? 880 : 520, 0.06, 'square', 0.03);
  },
};
