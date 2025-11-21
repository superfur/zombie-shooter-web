export class SoundManager {
  private context: AudioContext;
  private masterGain: GainNode;

  constructor() {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.context.destination);
  }

  resume() {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  playShoot() {
    this.resume();
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sawtooth'; 
    osc.frequency.setValueAtTime(150, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.5, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.1);

    this.playNoise(0.05);
  }

  playPistolShoot() {
    this.resume();
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'square'; 
    osc.frequency.setValueAtTime(400, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.4, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.15);
  }

  playKnifeSwing() {
    this.resume();
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    // 咻~ 的声音
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.context.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.context.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.2);
  }

  playReload() {
    this.resume();
    const now = this.context.currentTime;
    this.createClick(now);
    this.createClick(now + 0.4); 
    this.createSlide(now + 0.1);
  }

  private createClick(time: number) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  private createSlide(time: number) {
    const noise = this.context.createBufferSource();
    const bufferSize = this.context.sampleRate * 0.3;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.linearRampToValueAtTime(0, time + 0.3);
    
    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
  }

  playHeadshot() {
    this.resume();
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.context.currentTime);
    gain.gain.setValueAtTime(0.5, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.3);
  }

  private playNoise(duration: number) {
    const bufferSize = this.context.sampleRate * duration;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.context.createGain();
    noiseGain.gain.setValueAtTime(0.2, this.context.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
    
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();
  }

  playEnemyDeath() {
    this.resume();
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(100, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.context.currentTime + 0.3);

    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.3);
  }
  
  playZombieAttack() {
    this.resume();
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    // 嘶吼声
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.context.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.context.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.3);
  }

  playPlayerHurt() {
    this.resume();
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.context.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.context.currentTime + 0.2);

    gain.gain.setValueAtTime(0.5, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.context.currentTime + 0.2);
  }
}
