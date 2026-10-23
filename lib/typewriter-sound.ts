"use client";

/**
 * Web Audio API Duck Quack Sound Synthesizer.
 * Synthesizes an authentic, comedic duck quack ("kwek / quack") keystroke audio
 * using harmonic syrinx sawtooth synthesis, pitch-glide envelopes,
 * beak formant filtering (F1: ~680Hz, F2: ~1550Hz), and throat rasp modulation.
 * Zero external audio assets, zero latency, 100% offline.
 */
class TypewriterSoundEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = false;
  private duckAudioBuffer: AudioBuffer | null = null;
  private isLoadingBuffer: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("typewriter_sound_enabled");
      if (stored === "true") {
        this.isEnabled = true;
      }
      // Preload the duck sound MP3
      this.loadDuckAudio();
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  private async loadDuckAudio() {
    if (this.duckAudioBuffer || this.isLoadingBuffer) return;
    this.initContext();
    if (!this.ctx) return;

    this.isLoadingBuffer = true;
    try {
      // Attempt to load provided Duck_Sound_Typewriter.mp3
      const res = await fetch("/sounds/Duck_Sound_Typewriter.mp3");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      this.duckAudioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.warn("Could not load /sounds/Duck_Sound_Typewriter.mp3, falling back to synth quack:", err);
    } finally {
      this.isLoadingBuffer = false;
    }
  }

  public setEnabled(enabled: boolean): boolean {
    this.isEnabled = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("typewriter_sound_enabled", enabled ? "true" : "false");
    }
    if (enabled) {
      this.initContext();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      if (!this.duckAudioBuffer && !this.isLoadingBuffer) {
        this.loadDuckAudio();
      }
      // Play a greeting quack when enabled
      this.playKeyClick();
    }
    return this.isEnabled;
  }

  public toggle(): boolean {
    return this.setEnabled(!this.isEnabled);
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Internal Duck Quack Audio Synthesizer (Fallback):
   * Recreates the distinct nasal "kwek!" acoustic signature of a duck.
   */
  private triggerQuack(startTime: number, pitchMultiplier = 1.0, duration = 0.14, volume = 0.32) {
    if (!this.ctx) return;
    const now = startTime;

    // 1. Reedy Duck Syrinx (Harmonically rich Sawtooth Oscillator)
    const duckOsc = this.ctx.createOscillator();
    duckOsc.type = "sawtooth";

    const baseFreq = (290 + Math.random() * 25) * pitchMultiplier;
    duckOsc.frequency.setValueAtTime(baseFreq * 0.9, now);
    duckOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.55, now + 0.024);
    duckOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.72, now + duration);

    // 2. Duck Throat Gravel / Rasp (LFO modulation ~44Hz)
    const raspOsc = this.ctx.createOscillator();
    raspOsc.type = "sawtooth";
    raspOsc.frequency.setValueAtTime(44, now);

    const raspGain = this.ctx.createGain();
    raspGain.gain.setValueAtTime(baseFreq * 0.18, now);
    raspGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    raspOsc.connect(duckOsc.frequency);
    raspOsc.start(now);
    raspOsc.stop(now + duration);

    // 3. Nasal Formants (Duck Beak / Bill acoustic filter)
    const formant1 = this.ctx.createBiquadFilter();
    formant1.type = "bandpass";
    formant1.frequency.setValueAtTime(680 * pitchMultiplier, now);
    formant1.frequency.linearRampToValueAtTime(840 * pitchMultiplier, now + 0.03);
    formant1.frequency.linearRampToValueAtTime(520 * pitchMultiplier, now + duration);
    formant1.Q.setValueAtTime(5.5, now);

    const formant2 = this.ctx.createBiquadFilter();
    formant2.type = "bandpass";
    formant2.frequency.setValueAtTime(1550 * pitchMultiplier, now);
    formant2.frequency.linearRampToValueAtTime(1750 * pitchMultiplier, now + 0.03);
    formant2.frequency.linearRampToValueAtTime(1300 * pitchMultiplier, now + duration);
    formant2.Q.setValueAtTime(6.0, now);

    const f1Gain = this.ctx.createGain();
    f1Gain.gain.setValueAtTime(0.75, now);

    const f2Gain = this.ctx.createGain();
    f2Gain.gain.setValueAtTime(0.45, now);

    // 4. Amplitude Envelope
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    masterGain.gain.exponentialRampToValueAtTime(volume * 0.7, now + 0.045);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    duckOsc.connect(formant1);
    duckOsc.connect(formant2);

    formant1.connect(f1Gain);
    formant2.connect(f2Gain);

    f1Gain.connect(masterGain);
    f2Gain.connect(masterGain);

    masterGain.connect(this.ctx.destination);

    duckOsc.start(now);
    duckOsc.stop(now + duration);
  }

  /**
   * Plays the duck quack sound on keystroke:
   * Uses the user's provided Duck_Sound_Typewriter.mp3 buffer when available,
   * with natural subtle pitch variation, or the synth fallback.
   */
  public playKeyClick() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime;

      if (this.duckAudioBuffer) {
        const source = this.ctx.createBufferSource();
        source.buffer = this.duckAudioBuffer;

        // Subtle randomized pitch variation (0.96 to 1.05) so typing feels alive
        const rate = 0.96 + Math.random() * 0.08;
        source.playbackRate.setValueAtTime(rate, now);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.85, now);

        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        source.start(now);
        return;
      }

      // If buffer not loaded yet, initiate load and use synth
      if (!this.isLoadingBuffer) {
        this.loadDuckAudio();
      }
      const pitch = 0.94 + Math.random() * 0.14;
      this.triggerQuack(now, pitch, 0.13, 0.32);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Plays an enthusiastic quack on Enter / Shift+Enter / paragraph break
   */
  public playCarriageReturn() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime;

      if (this.duckAudioBuffer) {
        // Double quack with MP3 buffer:
        const source1 = this.ctx.createBufferSource();
        source1.buffer = this.duckAudioBuffer;
        source1.playbackRate.setValueAtTime(1.05, now);
        const gain1 = this.ctx.createGain();
        gain1.gain.setValueAtTime(0.85, now);
        source1.connect(gain1);
        gain1.connect(this.ctx.destination);
        source1.start(now);

        const source2 = this.ctx.createBufferSource();
        source2.buffer = this.duckAudioBuffer;
        source2.playbackRate.setValueAtTime(0.95, now + 0.12);
        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0.85, now + 0.12);
        source2.connect(gain2);
        gain2.connect(this.ctx.destination);
        source2.start(now + 0.12);
        return;
      }

      this.triggerQuack(now, 1.06, 0.12, 0.34);
      this.triggerQuack(now + 0.09, 0.92, 0.15, 0.36);
    } catch {}
  }
}

export const typewriterAudio = new TypewriterSoundEngine();
