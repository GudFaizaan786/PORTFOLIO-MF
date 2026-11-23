// Procedural Web Audio API soft ambient tune (~64 BPM):
// warm slow pad + pentatonic plucks + gentle sub-bass + feedback delay + low-pass filter

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private padOscA: OscillatorNode | null = null;
  private padOscB: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private delayNode: DelayNode | null = null;
  private pluckTimer: number | null = null;

  private isPlaying = false;
  private volume = 0.45;
  private stepIdx = 0;

  // Calm D-minor / F-major pentatonic frequencies (gentle, contemplative)
  private readonly scale = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33];

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && this.isPlaying) {
      this.masterGain.gain.setTargetAtTime(
        this.volume * 0.14,
        this.ctx.currentTime,
        0.15
      );
    }
  }

  public start() {
    if (typeof window === "undefined") return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0001;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.value = 720;
      this.filterNode.Q.value = 0.7;

      // Light stereo-style echo / delay for space
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.46; // ~65 BPM dotted/quarter feel
      const delayFeedback = this.ctx.createGain();
      delayFeedback.gain.value = 0.28;
      const delayWet = this.ctx.createGain();
      delayWet.gain.value = 0.3;

      this.delayNode.connect(delayFeedback);
      delayFeedback.connect(this.delayNode);
      this.delayNode.connect(delayWet);
      delayWet.connect(this.filterNode);

      // Warm slow pad pair
      this.padOscA = this.ctx.createOscillator();
      this.padOscA.type = "sine";
      this.padOscA.frequency.value = 146.83; // D3

      this.padOscB = this.ctx.createOscillator();
      this.padOscB.type = "triangle";
      this.padOscB.frequency.value = 220.0; // A3

      const padGainA = this.ctx.createGain();
      padGainA.gain.value = 0.22;
      const padGainB = this.ctx.createGain();
      padGainB.gain.value = 0.09;

      // Soft sub-bass
      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = "sine";
      this.subOsc.frequency.value = 73.42; // D2
      const subGain = this.ctx.createGain();
      subGain.gain.value = 0.24;

      this.padOscA.connect(padGainA);
      this.padOscB.connect(padGainB);
      this.subOsc.connect(subGain);

      padGainA.connect(this.filterNode);
      padGainB.connect(this.filterNode);
      subGain.connect(this.filterNode);

      this.filterNode.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.padOscA.start();
      this.padOscB.start();
      this.subOsc.start();
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(
        this.volume * 0.14,
        this.ctx.currentTime,
        0.5
      );
    }

    this.isPlaying = true;
    this.startPluckLoop();
  }

  public stop() {
    this.isPlaying = false;
    if (this.pluckTimer !== null) {
      window.clearInterval(this.pluckTimer);
      this.pluckTimer = null;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) this.stop();
    else this.start();
    return this.isPlaying;
  }

  public setDucking(duck: boolean, scrollVelocity = 0) {
    if (!this.ctx || !this.filterNode || !this.masterGain || !this.isPlaying) {
      return;
    }
    const baseFreq = duck ? 360 : 720 + Math.min(480, Math.abs(scrollVelocity) * 260);
    this.filterNode.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.25);
    const targetGain = this.volume * (duck ? 0.08 : 0.14);
    this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.25);
  }

  public playInteractionTone(freq = 440) {
    if (!this.isPlaying || !this.ctx || !this.filterNode || !this.delayNode) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.06, now + 0.03);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
    osc.connect(env);
    env.connect(this.filterNode);
    env.connect(this.delayNode);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  private startPluckLoop() {
    if (this.pluckTimer !== null) window.clearInterval(this.pluckTimer);
    // ~65 BPM quarter/half-note gentle pluck cadence (920ms)
    this.pluckTimer = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.filterNode || !this.delayNode) {
        return;
      }
      const pattern = [0, 2, 4, 3, 1, 5, 2, 0];
      const noteFreq = this.scale[pattern[this.stepIdx % pattern.length]];
      this.stepIdx++;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(noteFreq, now);
      env.gain.setValueAtTime(0.0005, now);
      env.gain.exponentialRampToValueAtTime(0.055, now + 0.04);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(env);
      env.connect(this.filterNode);
      env.connect(this.delayNode);

      osc.start(now);
      osc.stop(now + 1.5);
    }, 920);
  }
}

export const ambientAudio = new AmbientSoundEngine();
