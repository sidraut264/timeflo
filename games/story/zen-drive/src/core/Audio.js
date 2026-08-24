class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.windNode = null;
    this.engineNode = null;
    this.droneNodes = [];
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.08;
      this.masterGain.connect(this.audioCtx.destination);

      this.createEngine();
      this.createWind();
      this.createDrone();
      
      this.initialized = true;
    } catch (e) {
      console.warn("Audio Context not supported");
    }
  }

  createEngine() {
    this.engineNode = this.audioCtx.createOscillator();
    this.engineNode.type = 'sawtooth';
    this.engineNode.frequency.value = 60;
    
    // Low pass filter to muffle the raw sawtooth
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    const gain = this.audioCtx.createGain();
    gain.gain.value = 0.15;

    this.engineNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    this.engineNode.start();
  }

  createWind() {
    const bufSize = this.audioCtx.sampleRate * 2;
    const buf = this.audioCtx.createBuffer(1, bufSize, this.audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.3;

    this.windNode = this.audioCtx.createGain();
    this.windNode.gain.value = 0;

    noise.connect(filter);
    filter.connect(this.windNode);
    this.windNode.connect(this.masterGain);
    noise.start();
  }

  createDrone() {
    const freqs = [55, 82.4, 110, 164.8];
    for (const freq of freqs) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      gain.gain.value = 0.15 + Math.random() * 0.1;

      const lfo = this.audioCtx.createOscillator();
      lfo.frequency.value = 0.1 + Math.random() * 0.15;
      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.value = 0.4;
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start();
      lfo.start();
      this.droneNodes.push({ osc, gain });
    }
  }

  update(speed, maxSpeed) {
    if (!this.initialized) return;
    const speedRatio = Math.max(0, Math.min(1, speed / maxSpeed));
    
    // Engine pitch goes up with speed
    this.engineNode.frequency.setTargetAtTime(60 + speedRatio * 150, this.audioCtx.currentTime, 0.1);
    
    // Wind volume goes up with speed
    this.windNode.gain.setTargetAtTime(speedRatio * 0.25, this.audioCtx.currentTime, 0.3);
  }
}
