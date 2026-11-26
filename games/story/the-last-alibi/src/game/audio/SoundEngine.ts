import { AudioSettings, RoomAudioProfile } from '../../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private rainFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

  private intervalId: number | null = null;
  private profile: RoomAudioProfile = {
    baseDroneHz: 55,
    rainIntensity: 0.7,
    thunderChance: 0.3,
    tickingClock: true,
    fireplace: true,
    creaks: true,
    drip: false
  };
  private settings: AudioSettings = {
    masterVolume: 0.75,
    musicVolume: 0.55,
    sfxVolume: 0.8,
    muted: false
  };
  private initialized = false;

  unlock() {
    if (this.initialized) {
      if (this.ctx?.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.ambienceGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.ambienceGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.setupRainNoise();
      this.setupAmbientDrone();
      this.applySettings(this.settings);
      this.applyProfile(this.profile);

      this.intervalId = window.setInterval(() => this.tickAtmosphere(), 1000);
      this.initialized = true;
    } catch {
      // gracefully ignore audio restrictions
    }
  }

  private setupRainNoise() {
    if (!this.ctx || !this.ambienceGain) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.04 * white) / 1.04;
      lastOut = data[i];
      data[i] *= 2.8;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'bandpass';
    this.rainFilter.frequency.value = 950;
    this.rainFilter.Q.value = 0.7;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.14;

    noise.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ambienceGain);
    noise.start();
  }

  private setupAmbientDrone() {
    if (!this.ctx || !this.musicGain) return;
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc2.type = 'triangle';

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 210;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.06;

    this.droneOsc1.connect(lowpass);
    this.droneOsc2.connect(lowpass);
    lowpass.connect(this.droneGain);
    this.droneGain.connect(this.musicGain);

    this.droneOsc1.start();
    this.droneOsc2.start();
  }

  applySettings(settings: AudioSettings) {
    this.settings = settings;
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain || !this.ambienceGain) {
      return;
    }
    const now = this.ctx.currentTime;
    const master = settings.muted ? 0 : settings.masterVolume;
    this.masterGain.gain.setTargetAtTime(master, now, 0.08);
    this.musicGain.gain.setTargetAtTime(settings.musicVolume, now, 0.08);
    this.sfxGain.gain.setTargetAtTime(settings.sfxVolume, now, 0.08);
    this.ambienceGain.gain.setTargetAtTime(settings.sfxVolume * 0.75, now, 0.08);
  }

  applyProfile(profile: RoomAudioProfile) {
    this.profile = profile;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.rainGain && this.rainFilter) {
      this.rainGain.gain.setTargetAtTime(0.03 + profile.rainIntensity * 0.18, now, 0.4);
      this.rainFilter.frequency.setTargetAtTime(650 + profile.rainIntensity * 600, now, 0.4);
    }
    if (this.droneOsc1 && this.droneOsc2) {
      this.droneOsc1.frequency.setTargetAtTime(profile.baseDroneHz, now, 0.6);
      this.droneOsc2.frequency.setTargetAtTime(profile.baseDroneHz * 1.498, now, 0.6);
    }
  }

  private tickAtmosphere() {
    if (!this.ctx || this.settings.muted || this.ctx.state !== 'running') return;

    if (this.profile.tickingClock) {
      this.playClockTick();
    }
    if (this.profile.fireplace && Math.random() < 0.45) {
      this.playCrackle();
    }
    if (this.profile.drip && Math.random() < 0.35) {
      this.playWaterDrip();
    }
    if (this.profile.creaks && Math.random() < 0.08) {
      this.playFloorCreak();
    }
    if (Math.random() < this.profile.thunderChance * 0.08) {
      this.playThunder();
    }
  }

  private playClockTick() {
    if (!this.ctx || !this.ambienceGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.025);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.ambienceGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  private playCrackle() {
    if (!this.ctx || !this.ambienceGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(260 + Math.random() * 500, now);
    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
    osc.connect(gain);
    gain.connect(this.ambienceGain);
    osc.start(now);
    osc.stop(now + 0.025);
  }

  private playWaterDrip() {
    if (!this.ctx || !this.ambienceGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(1150, now + 0.07);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ambienceGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  private playFloorCreak() {
    if (!this.ctx || !this.ambienceGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.linearRampToValueAtTime(84, now + 0.35);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playThunder() {
    if (!this.ctx || !this.ambienceGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 2.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (this.ctx.sampleRate * 0.9));
      last = (last + 0.03 * (Math.random() * 2 - 1)) / 1.03;
      data[i] = last * env * 4;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.32, now);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);
    src.start(now);
  }

  playSfx(kind: 'click' | 'pickup' | 'door' | 'deduction' | 'unlock' | 'error') {
    this.unlock();
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;

    if (kind === 'click') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.045);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.055);
    } else if (kind === 'pickup') {
      [392, 523.25].forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        g.gain.setValueAtTime(0.09, now + i * 0.07);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.25);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.27);
      });
    } else if (kind === 'door') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(62, now + 0.22);
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 300;
      g.gain.setValueAtTime(0.14, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      osc.connect(lp);
      lp.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (kind === 'deduction' || kind === 'unlock') {
      const notes = kind === 'deduction' ? [220, 261.63, 329.63, 440] : [293.66, 369.99, 440];
      notes.forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        g.gain.setValueAtTime(0.1, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.4);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.42);
      });
    } else if (kind === 'error') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(135, now);
      osc.frequency.linearRampToValueAtTime(105, now + 0.16);
      g.gain.setValueAtTime(0.09, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  destroy() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    void this.ctx?.close();
    this.initialized = false;
  }
}

export const soundEngine = new SoundEngine();
