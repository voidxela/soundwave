// Background script for managing tab audio contexts and settings
class AudioControlBackground {
  constructor() {
    this.tabAudioContexts = new Map();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.initializeTabAudio(tabId, tab.url);
      }
    });

    // Handle tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.cleanupTabAudio(tabId);
    });

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }

  async initializeTabAudio(tabId, url) {
    try {
      // Load settings for this URL
      const settings = await this.loadSettingsForUrl(url);
      
      // Send settings to content script
      chrome.tabs.sendMessage(tabId, {
        action: 'initializeAudio',
        settings: settings,
        url: url
      });
    } catch (error) {
      console.error('Failed to initialize tab audio:', error);
    }
  }

  cleanupTabAudio(tabId) {
    if (this.tabAudioContexts.has(tabId)) {
      this.tabAudioContexts.delete(tabId);
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'getTabSettings':
          const settings = await this.getTabSettings(sender.tab.id);
          sendResponse({ success: true, settings });
          break;

        case 'updateSettings':
          await this.updateTabSettings(sender.tab.id, message.settings, message.url);
          sendResponse({ success: true });
          break;

        case 'getActiveTabInfo':
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          const tabSettings = await this.loadSettingsForUrl(activeTab.url);
          sendResponse({ 
            success: true, 
            tab: activeTab,
            settings: tabSettings
          });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async getTabSettings(tabId) {
    const [tab] = await chrome.tabs.query({ tabId });
    if (!tab) return this.getDefaultSettings();
    
    return await this.loadSettingsForUrl(tab.url);
  }

  async updateTabSettings(tabId, settings, url) {
    // Save settings for this URL
    await this.saveSettingsForUrl(url, settings);
    
    // Update the content script
    chrome.tabs.sendMessage(tabId, {
      action: 'updateAudioSettings',
      settings: settings
    });
  }

  async loadSettingsForUrl(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const fullPath = urlObj.hostname + urlObj.pathname;
      
      // Try exact URL first, then path, then domain
      const keys = [url, fullPath, domain];
      const result = await chrome.storage.local.get(keys);
      
      // Return the most specific match found
      for (const key of keys) {
        if (result[key]) {
          return { ...this.getDefaultSettings(), ...result[key] };
        }
      }
      
      return this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      return this.getDefaultSettings();
    }
  }

  async saveSettingsForUrl(url, settings) {
    try {
      const urlObj = new URL(url);
      const saveKey = settings.matchType === 'domain' ? urlObj.hostname :
                     settings.matchType === 'path' ? urlObj.hostname + urlObj.pathname :
                     url;
      
      await chrome.storage.local.set({ [saveKey]: settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  getDefaultSettings() {
    return {
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
      matchType: 'exact', // exact, path, domain
      enabled: true
    };
  }
}

// Initialize the background service
const audioControlBackground = new AudioControlBackground();
