// Áudio: efeitos Kenney (CC0) decodificados no primeiro toque + ambiente sintetizado (vento, drone, batida).
import { KENNEY_SFX } from '../assets/kenney.js';

let ctx = null, master = null, sfxBus = null, ambBus = null, ready = false, buffers = {}, enabled = { sfx: true, music: true };
const last = {};
let amb = null;

export function setEnabled(o) { Object.assign(enabled, o); if (sfxBus) sfxBus.gain.value = enabled.sfx ? 1 : 0; if (ambBus) ambBus.gain.value = enabled.music ? 1 : 0; }

export async function init() {
  if (ready) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5; comp.connect(master);
  sfxBus = ctx.createGain(); sfxBus.connect(comp); ambBus = ctx.createGain(); ambBus.gain.value = 0.9; ambBus.connect(master);
  setEnabled({});
  ready = true;
  await Promise.all(Object.entries(KENNEY_SFX).map(async ([k, url]) => {
    try { const r = await fetch(url); buffers[k] = await ctx.decodeAudioData(await r.arrayBuffer()); } catch (e) { /* mp3 não decodificado */ }
  }));
  startAmbient();
}

export function sfx(name, o = {}) {
  if (!ready || !enabled.sfx) return;
  const b = buffers[name]; if (!b) return;
  const now = ctx.currentTime; if (last[name] && now - last[name] < (o.gap ?? 0.04)) return; last[name] = now;
  const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = (o.rate ?? 1) * (1 + (Math.random() - 0.5) * (o.vary ?? 0.14));
  const g = ctx.createGain(); g.gain.value = o.vol ?? 0.6; s.connect(g);
  if (o.pan !== undefined && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan)); g.connect(p); p.connect(sfxBus); } else g.connect(sfxBus);
  s.start(now + (o.delay ?? 0));
}

// sons sintetizados (sem arquivo)
function noiseBuf(len = 1) { const b = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
let nb = null;
export function synth(kind, o = {}) {
  if (!ready || !enabled.sfx) return;
  const t = ctx.currentTime, vol = o.vol ?? 0.4;
  if (!nb) nb = noiseBuf(1.5);
  const env = (g, a, d, peak) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  if (kind === 'whoosh' || kind === 'zap') {
    const s = ctx.createBufferSource(); s.buffer = nb; const f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = kind === 'zap' ? 'highpass' : 'bandpass'; f.Q.value = kind === 'zap' ? 1 : 0.9;
    f.frequency.setValueAtTime(kind === 'zap' ? 2600 : 500, t); f.frequency.exponentialRampToValueAtTime(kind === 'zap' ? 6500 : 2600, t + 0.2);
    env(g, 0.02, kind === 'zap' ? 0.22 : 0.2, vol); s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t, Math.random()); s.stop(t + 0.35);
  } else if (kind === 'chime') {
    [0, 4, 7, 12].forEach((st, i) => {
      const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'triangle'; os.frequency.value = 392 * Math.pow(2, st / 12);
      g.gain.setValueAtTime(0.0001, t + i * 0.07); g.gain.exponentialRampToValueAtTime(vol * 0.55, t + i * 0.07 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.7);
      os.connect(g); g.connect(sfxBus); os.start(t + i * 0.07); os.stop(t + i * 0.07 + 0.75);
    });
  } else if (kind === 'tick') {
    const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sine'; os.frequency.setValueAtTime(o.f ?? 880, t); os.frequency.exponentialRampToValueAtTime((o.f ?? 880) * 1.6, t + 0.06);
    env(g, 0.004, 0.08, vol * 0.5); os.connect(g); g.connect(sfxBus); os.start(t); os.stop(t + 0.12);
  } else if (kind === 'boom') {
    const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sine'; os.frequency.setValueAtTime(120, t); os.frequency.exponentialRampToValueAtTime(28, t + 0.5);
    env(g, 0.005, 0.55, vol * 1.3); os.connect(g); g.connect(sfxBus); os.start(t); os.stop(t + 0.6);
    const s = ctx.createBufferSource(); s.buffer = nb; const f = ctx.createBiquadFilter(), g2 = ctx.createGain(); f.type = 'lowpass'; f.frequency.value = 900; env(g2, 0.005, 0.4, vol); s.connect(f); f.connect(g2); g2.connect(sfxBus); s.start(t, Math.random()); s.stop(t + 0.5);
  } else if (kind === 'hurt') {
    const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sawtooth'; os.frequency.setValueAtTime(190, t); os.frequency.exponentialRampToValueAtTime(70, t + 0.18);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; env(g, 0.004, 0.2, vol * 0.7); os.connect(f); f.connect(g); g.connect(sfxBus); os.start(t); os.stop(t + 0.26);
  }
}

function startAmbient() {
  if (amb || !ctx) return;
  const t = ctx.currentTime, out = ctx.createGain(); out.gain.value = 0; out.gain.linearRampToValueAtTime(1, t + 3); out.connect(ambBus);
  // vento: ruído filtrado com LFO
  const wind = ctx.createBufferSource(); wind.buffer = noiseBuf(4); wind.loop = true;
  const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 0.6; const wg = ctx.createGain(); wg.gain.value = 0.07;
  const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 0.045; lfo.connect(lg); lg.connect(wg.gain); lfo.start();
  const lfo2 = ctx.createOscillator(), lg2 = ctx.createGain(); lfo2.frequency.value = 0.05; lg2.gain.value = 200; lfo2.connect(lg2); lg2.connect(wf.frequency); lfo2.start();
  wind.connect(wf); wf.connect(wg); wg.connect(out); wind.start();
  // drone grave
  [55, 55.4, 82.6].forEach((fr, i) => { const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.frequency.value = fr; f.type = 'lowpass'; f.frequency.value = 180; g.gain.value = i === 2 ? 0.05 : 0.035; o.connect(f); f.connect(g); g.connect(out); o.start(); });
  // pulso
  const pulse = ctx.createGain(); pulse.gain.value = 0; pulse.connect(out);
  amb = { out, pulse, intensity: 0 };
}
// 0..1: aumenta a batida quando a coisa esquenta
export function setIntensity(v) {
  if (!amb) return;
  const t = ctx.currentTime;
  if (Math.abs(v - amb.intensity) < 0.02) return; amb.intensity = v;
  amb.out.gain.setTargetAtTime(0.75 + v * 0.6, t, 0.5);
}
let beatT = 0;
export function beat(dt, bpmFactor) {
  if (!ready || !enabled.music || !amb) return;
  beatT -= dt; if (beatT > 0) return; beatT = 1.1 - 0.5 * bpmFactor;
  const t = ctx.currentTime, os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sine'; os.frequency.setValueAtTime(70, t); os.frequency.exponentialRampToValueAtTime(38, t + 0.22);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1 + bpmFactor * 0.16, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  os.connect(g); g.connect(ambBus); os.start(t); os.stop(t + 0.32);
}
export const isReady = () => ready;
