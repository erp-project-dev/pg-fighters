import Phaser from 'phaser';
import type { SoloDef, SoloDrum, SoloTone } from '../data/solos';

const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

const distortion = (ctx: AudioContext, amount: number) => {
  const shaper = ctx.createWaveShaper();
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  shaper.curve = curve;
  shaper.oversample = '4x';
  return shaper;
};

const contextOf = (scene: Phaser.Scene): AudioContext | null => {
  const ctx = (scene.sound as Phaser.Sound.WebAudioSoundManager).context;
  return ctx && !scene.sound.mute && ctx.state === 'running' ? ctx : null;
};

/** Timbres: saturación, filtro y volumen de salida. */
const TONES: Record<SoloTone, { drive: number; lowpass: number; gain: number }> = {
  heavy: { drive: 120, lowpass: 3400, gain: 0.09 },
  chug: { drive: 200, lowpass: 2400, gain: 0.09 },
  smooth: { drive: 50, lowpass: 2600, gain: 0.1 },
  warm: { drive: 30, lowpass: 1900, gain: 0.12 },
  clean: { drive: 4, lowpass: 3200, gain: 0.1 },
  sub: { drive: 90, lowpass: 650, gain: 0.24 },
  synth: { drive: 0, lowpass: 3800, gain: 0.06 },
};

/** Cadena de "amplificador": distorsión (opcional) + filtro + volumen. */
const amp = (ctx: AudioContext, tone: SoloTone) => {
  const preset = TONES[tone];
  const input = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = preset.lowpass;
  const out = ctx.createGain();
  out.gain.value = preset.gain;
  if (preset.drive > 0) input.connect(distortion(ctx, preset.drive)).connect(filter);
  else input.connect(filter);
  filter.connect(out).connect(ctx.destination);
  return input;
};

/** Una voz: nota con ataque rápido, slide/bend opcionales y vibrato. */
const voice = (ctx: AudioContext, dest: AudioNode, wave: OscillatorType, f: number, t: number, len: number, opts: { slide?: boolean; bend?: boolean; vibrato?: number; level?: number }) => {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = wave;
  if (opts.slide) {
    o.frequency.setValueAtTime(f * 2 ** (-2 / 12), t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.07);
  } else o.frequency.setValueAtTime(f, t);
  if (opts.bend) o.frequency.exponentialRampToValueAtTime(f * 2 ** (2 / 12), t + len * 0.6);
  const vib = opts.vibrato ?? (len > 0.3 ? 0.012 : 0);
  if (vib) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = opts.vibrato ? 5.5 : 6;
    depth.gain.value = f * vib;
    lfo.connect(depth).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + len);
  }
  const level = opts.level ?? 1;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(level, t + 0.008);
  g.gain.exponentialRampToValueAtTime(level * 0.25, t + Math.min(len, 0.12));
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + len + 0.02);
};

let noise: AudioBuffer | null = null;

/** Bombo, redoblante y clave sintetizados (van directo a la salida, sin distorsión). */
const drum = (ctx: AudioContext, kind: SoloDrum['kind'], t: number) => {
  const g = ctx.createGain();
  g.connect(ctx.destination);
  if (kind === 'kick') {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.18);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.26);
  } else if (kind === 'snare') {
    if (!noise) {
      noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1500;
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    src.connect(hp).connect(g);
    src.start(t);
    src.stop(t + 0.15);
  } else {
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = 2500;
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.05);
  }
};

/** Toca el solo del súper sintetizado (sincronizado con los tiempos de SOLOS). */
export const playSolo = (scene: Phaser.Scene, solo: SoloDef): void => {
  const ctx = contextOf(scene);
  if (!ctx) return;
  const input = amp(ctx, solo.tone);
  const t0 = ctx.currentTime + 0.02;
  for (const n of solo.notes) {
    const t = t0 + n.t / 1000;
    const len = n.len / 1000;
    const pitches = [n.midi, ...(n.chord ?? []).map((i) => n.midi + i)];
    // En acordes cada voz baja un poco para no saturar.
    const level = 1 / Math.sqrt(pitches.length);
    for (const m of pitches) voice(ctx, input, solo.wave, freq(m), t, len, { slide: n.slide, bend: n.bend, vibrato: solo.vibrato, level });
  }
  for (const d of solo.drums ?? []) drum(ctx, d.kind, t0 + d.t / 1000);
};

/** Acorde rasgueado para la entrada del retrato (power chord en eléctricas, acorde abierto en las de caja). */
export const strumChord = (scene: Phaser.Scene, solo: SoloDef): void => {
  const ctx = contextOf(scene);
  if (!ctx) return;
  const input = amp(ctx, solo.tone);
  const chord = solo.guitar === 'pointy' ? [40, 47, 52, 55, 59, 64] : [45, 52, 57, 61, 64];
  const t0 = ctx.currentTime + 0.01;
  chord.forEach((m, i) => voice(ctx, input, solo.wave, freq(m), t0 + i * 0.018, 1.4, { level: 0.6 }));
};
