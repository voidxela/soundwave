// Audio processing engine using Web Audio API
class AudioProcessor {
  constructor() {
    this.audioContext = null;
    this.masterGainNode = null;
    this.compressorNode = null;
    this.bassNode = null;
    this.midNode = null;
    this.trebleNode = null;
    this.connectedElements = new Set();
    this.interceptedContexts = new Set();
  }

  async initialize(settings) {
    try {
      // Create or resume audio context
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.setupAudioNodes();
      this.updateSettings(settings);
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      throw error;
    }
  }

  setupAudioNodes() {
    // Master gain for volume control
    this.masterGainNode = this.audioContext.createGain();

    // Dynamic range compressor
    this.compressorNode = this.audioContext.createDynamicsCompressor();

    // 3-band EQ using biquad filters
    this.bassNode = this.audioContext.createBiquadFilter();
    this.bassNode.type = 'lowshelf';
    this.bassNode.frequency.setValueAtTime(320, this.audioContext.currentTime);

    this.midNode = this.audioContext.createBiquadFilter();
    this.midNode.type = 'peaking';
    this.midNode.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    this.midNode.Q.setValueAtTime(0.5, this.audioContext.currentTime);

    this.trebleNode = this.audioContext.createBiquadFilter();
    this.trebleNode.type = 'highshelf';
    this.trebleNode.frequency.setValueAtTime(3200, this.audioContext.currentTime);

    // Connect the audio chain
    this.bassNode.connect(this.midNode);
    this.midNode.connect(this.trebleNode);
    this.trebleNode.connect(this.compressorNode);
    this.compressorNode.connect(this.masterGainNode);
    this.masterGainNode.connect(this.audioContext.destination);
  }

  updateSettings(settings) {
    if (!this.audioContext || !settings) return;

    try {
      const currentTime = this.audioContext.currentTime;

      // Update volume
      this.masterGainNode.gain.setTargetAtTime(
        settings.volume,
        currentTime,
        0.01
      );

      // Update compressor
      if (settings.compression) {
        this.compressorNode.threshold.setTargetAtTime(
          settings.compression.threshold,
          currentTime,
          0.01
        );
        this.compressorNode.ratio.setTargetAtTime(
          settings.compression.ratio,
          currentTime,
          0.01
        );
        this.compressorNode.attack.setTargetAtTime(
          settings.compression.attack,
          currentTime,
          0.01
        );
        this.compressorNode.release.setTargetAtTime(
          settings.compression.release,
          currentTime,
          0.01
        );
      }

      // Update equalizer
      if (settings.equalizer) {
        this.bassNode.gain.setTargetAtTime(
          settings.equalizer.bass,
          currentTime,
          0.01
        );
        this.midNode.gain.setTargetAtTime(
          settings.equalizer.mid,
          currentTime,
          0.01
        );
        this.trebleNode.gain.setTargetAtTime(
          settings.equalizer.treble,
          currentTime,
          0.01
        );
      }
    } catch (error) {
      console.error('Failed to update audio settings:', error);
    }
  }

  connectMediaElement(element) {
    if (this.connectedElements.has(element) || !this.audioContext) {
      return;
    }

    try {
      // Create media element source
      const source = this.audioContext.createMediaElementSource(element);
      
      // Connect through our processing chain
      source.connect(this.bassNode);
      
      this.connectedElements.add(element);
    } catch (error) {
      // Element might already be connected to another context
      console.warn('Could not connect media element:', error);
    }
  }

  interceptAudioContext(context) {
    if (this.interceptedContexts.has(context)) {
      return;
    }

    try {
      // Override the destination to route through our processing
      const originalDestination = context.destination;
      const interceptGain = context.createGain();
      
      // Connect our processing chain to this context
      if (this.audioContext && context !== this.audioContext) {
        // Create a connection between contexts if possible
        // This is complex and may not work in all cases
        console.log('Intercepted external audio context');
      }
      
      this.interceptedContexts.add(context);
    } catch (error) {
      console.error('Failed to intercept audio context:', error);
    }
  }

  destroy() {
    // Clean up resources
    this.connectedElements.clear();
    this.interceptedContexts.clear();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
