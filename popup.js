// Popup interface controller
class PopupController {
  constructor() {
    this.currentTab = null;
    this.currentSettings = null;
    this.storageManager = new StorageManager();
    
    this.initializeElements();
    this.setupEventListeners();
    this.loadCurrentTab();
  }

  initializeElements() {
    // Volume controls
    this.volumeSlider = document.getElementById('volume-slider');
    this.volumeValue = document.getElementById('volume-value');

    // Compression controls
    this.thresholdSlider = document.getElementById('threshold-slider');
    this.thresholdValue = document.getElementById('threshold-value');
    this.ratioSlider = document.getElementById('ratio-slider');
    this.ratioValue = document.getElementById('ratio-value');

    // Equalizer controls
    this.bassSlider = document.getElementById('bass-slider');
    this.bassValue = document.getElementById('bass-value');
    this.midSlider = document.getElementById('mid-slider');
    this.midValue = document.getElementById('mid-value');
    this.trebleSlider = document.getElementById('treble-slider');
    this.trebleValue = document.getElementById('treble-value');

    // Settings controls
    this.matchTypeRadios = document.querySelectorAll('input[name="match-type"]');
    this.resetButton = document.getElementById('reset-button');

    // Status elements
    this.currentUrlElement = document.getElementById('current-url');
    this.statusElement = document.getElementById('status');
  }

  setupEventListeners() {
    // Volume control
    this.volumeSlider.addEventListener('input', () => {
      this.updateVolumeDisplay();
      this.saveSettings();
    });

    // Compression controls
    this.thresholdSlider.addEventListener('input', () => {
      this.updateThresholdDisplay();
      this.saveSettings();
    });

    this.ratioSlider.addEventListener('input', () => {
      this.updateRatioDisplay();
      this.saveSettings();
    });

    // Equalizer controls
    this.bassSlider.addEventListener('input', () => {
      this.updateBassDisplay();
      this.saveSettings();
    });

    this.midSlider.addEventListener('input', () => {
      this.updateMidDisplay();
      this.saveSettings();
    });

    this.trebleSlider.addEventListener('input', () => {
      this.updateTrebleDisplay();
      this.saveSettings();
    });

    // Match type selection
    this.matchTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.saveSettings();
      });
    });

    // Reset button
    this.resetButton.addEventListener('click', () => {
      this.resetToDefaults();
    });
  }

  async loadCurrentTab() {
    try {
      this.setStatus('Loading...');
      
      const response = await chrome.runtime.sendMessage({
        action: 'getActiveTabInfo'
      });

      if (response.success) {
        this.currentTab = response.tab;
        this.currentSettings = response.settings;
        
        this.updateURLDisplay();
        this.updateAllControls();
        this.setStatus('Ready');
      } else {
        this.setStatus('Error: ' + response.error);
      }
    } catch (error) {
      console.error('Failed to load current tab:', error);
      this.setStatus('Error loading tab');
    }
  }

  updateURLDisplay() {
    if (this.currentTab && this.currentTab.url) {
      try {
        const url = new URL(this.currentTab.url);
        const displayUrl = url.hostname + (url.pathname !== '/' ? url.pathname : '');
        this.currentUrlElement.textContent = displayUrl;
      } catch (error) {
        this.currentUrlElement.textContent = 'Invalid URL';
      }
    } else {
      this.currentUrlElement.textContent = 'No active tab';
    }
  }

  updateAllControls() {
    if (!this.currentSettings) return;

    // Update volume
    this.volumeSlider.value = this.currentSettings.volume;
    this.updateVolumeDisplay();

    // Update compression
    this.thresholdSlider.value = this.currentSettings.compression.threshold;
    this.ratioSlider.value = this.currentSettings.compression.ratio;
    this.updateThresholdDisplay();
    this.updateRatioDisplay();

    // Update equalizer
    this.bassSlider.value = this.currentSettings.equalizer.bass;
    this.midSlider.value = this.currentSettings.equalizer.mid;
    this.trebleSlider.value = this.currentSettings.equalizer.treble;
    this.updateBassDisplay();
    this.updateMidDisplay();
    this.updateTrebleDisplay();

    // Update match type
    const matchType = this.currentSettings.matchType || 'exact';
    const matchRadio = document.querySelector(`input[name="match-type"][value="${matchType}"]`);
    if (matchRadio) {
      matchRadio.checked = true;
    }
  }

  updateVolumeDisplay() {
    const value = Math.round(parseFloat(this.volumeSlider.value) * 100);
    this.volumeValue.textContent = `${value}%`;
  }

  updateThresholdDisplay() {
    const value = parseInt(this.thresholdSlider.value);
    this.thresholdValue.textContent = `${value} dB`;
  }

  updateRatioDisplay() {
    const value = parseFloat(this.ratioSlider.value);
    this.ratioValue.textContent = `${value}:1`;
  }

  updateBassDisplay() {
    const value = parseFloat(this.bassSlider.value);
    this.bassValue.textContent = `${value > 0 ? '+' : ''}${value} dB`;
  }

  updateMidDisplay() {
    const value = parseFloat(this.midSlider.value);
    this.midValue.textContent = `${value > 0 ? '+' : ''}${value} dB`;
  }

  updateTrebleDisplay() {
    const value = parseFloat(this.trebleSlider.value);
    this.trebleValue.textContent = `${value > 0 ? '+' : ''}${value} dB`;
  }

  getSelectedMatchType() {
    const selected = document.querySelector('input[name="match-type"]:checked');
    return selected ? selected.value : 'exact';
  }

  getCurrentSettings() {
    return {
      volume: parseFloat(this.volumeSlider.value),
      compression: {
        threshold: parseInt(this.thresholdSlider.value),
        ratio: parseFloat(this.ratioSlider.value),
        attack: 0.003, // Fixed values for now
        release: 0.25
      },
      equalizer: {
        bass: parseFloat(this.bassSlider.value),
        mid: parseFloat(this.midSlider.value),
        treble: parseFloat(this.trebleSlider.value)
      },
      matchType: this.getSelectedMatchType(),
      enabled: true
    };
  }

  async saveSettings() {
    if (!this.currentTab) return;

    try {
      this.currentSettings = this.getCurrentSettings();
      
      const response = await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: this.currentSettings,
        url: this.currentTab.url
      });

      if (response.success) {
        this.setStatus('Settings saved');
        setTimeout(() => this.setStatus('Ready'), 1000);
      } else {
        this.setStatus('Error saving');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.setStatus('Error saving');
    }
  }

  async resetToDefaults() {
    const defaultSettings = {
      volume: 1.0,
      compression: {
        threshold: -24,
        ratio: 3,
        attack: 0.003,
        release: 0.25
      },
      equalizer: {
        bass: 0,
        mid: 0,
        treble: 0
      },
      matchType: 'exact',
      enabled: true
    };

    this.currentSettings = defaultSettings;
    this.updateAllControls();
    await this.saveSettings();
    
    this.setStatus('Reset to defaults');
    setTimeout(() => this.setStatus('Ready'), 1000);
  }

  setStatus(message) {
    this.statusElement.textContent = message;
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
