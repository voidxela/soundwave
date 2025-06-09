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
      // Create audio context (may be suspended due to autoplay policy)
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Created audio context, state:', this.audioContext.state);
      }

      // Don't try to resume immediately - wait for user interaction
      this.setupAudioNodes();
      this.updateSettings(settings);
      
      // Set up user interaction handler to resume context
      this.setupUserInteractionHandler();
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      throw error;
    }
  }

  setupUserInteractionHandler() {
    const resumeContext = async () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
          console.log('Audio context resumed after user interaction');
        } catch (error) {
          console.error('Failed to resume audio context:', error);
        }
      }
    };

    // Listen for user interactions that can resume audio context
    const interactionEvents = ['click', 'keydown', 'touchstart'];
    interactionEvents.forEach(event => {
      document.addEventListener(event, resumeContext, { once: true, passive: true });
    });
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
    if (!this.audioContext || !settings) {
      console.warn('Cannot update settings: missing audio context or settings');
      return;
    }

    try {
      const currentTime = this.audioContext.currentTime;
      console.log('Applying audio settings:', {
        volume: settings.volume,
        compression: settings.compression,
        equalizer: settings.equalizer,
        connectedElements: this.connectedElements.size
      });

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

      // Create visual feedback on the page to show processing is active
      this.showProcessingIndicator(settings);
    } catch (error) {
      console.error('Failed to update audio settings:', error);
    }
  }

  showProcessingIndicator(settings) {
    // Remove any existing indicator
    const existing = document.getElementById('audio-control-indicator');
    if (existing) {
      existing.remove();
    }

    // Create new indicator
    const indicator = document.createElement('div');
    indicator.id = 'audio-control-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(52, 152, 219, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 10000;
      pointer-events: none;
    `;
    indicator.innerHTML = `
      🎵 Audio Control Active<br>
      Volume: ${Math.round(settings.volume * 100)}%<br>
      Connected: ${this.connectedElements.size} elements
    `;

    document.body.appendChild(indicator);

    // Remove after 3 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.remove();
      }
    }, 3000);
  }

  connectMediaElement(element) {
    if (this.connectedElements.has(element) || !this.audioContext) {
      return;
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Create media element source
      const source = this.audioContext.createMediaElementSource(element);
      
      // Connect through our processing chain
      source.connect(this.bassNode);
      
      this.connectedElements.add(element);
      console.log('Connected media element:', element.tagName, element.src || element.currentSrc);
      
      // Add event listener to handle play events
      element.addEventListener('play', () => {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
      });
      
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
