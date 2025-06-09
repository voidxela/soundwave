// Content script for injecting audio processing into web pages
class TabAudioController {
  constructor() {
    this.audioProcessor = null;
    this.settings = null;
    this.isInitialized = false;
    
    this.setupMessageListener();
    this.initializeAudioInterception();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'initializeAudio':
          await this.initializeAudio(message.settings, message.url);
          sendResponse({ success: true });
          break;

        case 'updateAudioSettings':
          await this.updateAudioSettings(message.settings);
          sendResponse({ success: true });
          break;

        case 'getCurrentSettings':
          sendResponse({ success: true, settings: this.settings });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Content script message error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async initializeAudio(settings, url) {
    this.settings = settings;
    
    if (!this.audioProcessor) {
      this.audioProcessor = new AudioProcessor();
    }
    
    await this.audioProcessor.initialize(settings);
    this.interceptAudioElements();
    this.isInitialized = true;
  }

  async updateAudioSettings(settings) {
    this.settings = settings;
    
    if (this.audioProcessor) {
      await this.audioProcessor.updateSettings(settings);
    }
  }

  interceptAudioElements() {
    // Intercept existing audio/video elements
    const mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach(element => this.processMediaElement(element));

    // Set up mutation observer for dynamically added elements
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const mediaElements = node.querySelectorAll ? 
              node.querySelectorAll('audio, video') : [];
            
            if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
              this.processMediaElement(node);
            }
            
            mediaElements.forEach(element => this.processMediaElement(element));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  processMediaElement(element) {
    if (element._audioControlProcessed || !this.audioProcessor) {
      return;
    }

    try {
      this.audioProcessor.connectMediaElement(element);
      element._audioControlProcessed = true;
    } catch (error) {
      console.error('Failed to process media element:', error);
    }
  }

  initializeAudioInterception() {
    // Override Web Audio API to intercept audio contexts
    if (window.AudioContext || window.webkitAudioContext) {
      this.interceptWebAudioAPI();
    }
  }

  interceptWebAudioAPI() {
    const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
    const self = this;

    function InterceptedAudioContext(...args) {
      const context = new OriginalAudioContext(...args);
      
      // Wait for our processor to be ready
      if (self.audioProcessor && self.isInitialized) {
        self.audioProcessor.interceptAudioContext(context);
      } else {
        // Queue for later processing
        setTimeout(() => {
          if (self.audioProcessor && self.isInitialized) {
            self.audioProcessor.interceptAudioContext(context);
          }
        }, 100);
      }
      
      return context;
    }

    // Copy static methods and properties
    Object.setPrototypeOf(InterceptedAudioContext, OriginalAudioContext);
    Object.setPrototypeOf(InterceptedAudioContext.prototype, OriginalAudioContext.prototype);

    // Replace the global AudioContext
    window.AudioContext = InterceptedAudioContext;
    if (window.webkitAudioContext) {
      window.webkitAudioContext = InterceptedAudioContext;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TabAudioController();
  });
} else {
  new TabAudioController();
}
