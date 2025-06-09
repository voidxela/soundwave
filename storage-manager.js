// Storage management for settings persistence
class StorageManager {
  constructor() {
    this.storage = chrome.storage.local;
  }

  /**
   * Generate storage key based on URL and match type
   */
  generateStorageKey(url, matchType = 'exact') {
    try {
      const urlObj = new URL(url);
      
      switch (matchType) {
        case 'domain':
          return urlObj.hostname;
        case 'path':
          return urlObj.hostname + urlObj.pathname;
        case 'exact':
        default:
          return url;
      }
    } catch (error) {
      console.error('Invalid URL for storage key:', error);
      return url; // Fallback to original URL
    }
  }

  /**
   * Save settings for a specific URL pattern
   */
  async saveSettings(url, settings) {
    try {
      const key = this.generateStorageKey(url, settings.matchType);
      const data = {
        ...settings,
        lastUpdated: Date.now(),
        originalUrl: url
      };

      await this.storage.set({ [key]: data });
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  /**
   * Load settings for a URL, checking different match patterns
   */
  async loadSettings(url) {
    try {
      const urlObj = new URL(url);
      
      // Try different matching patterns in order of specificity
      const keys = [
        url, // Exact match
        urlObj.hostname + urlObj.pathname, // Path match
        urlObj.hostname // Domain match
      ];

      const result = await this.storage.get(keys);
      
      // Return the most specific match found
      for (const key of keys) {
        if (result[key]) {
          return {
            ...this.getDefaultSettings(),
            ...result[key]
          };
        }
      }

      // No saved settings found, return defaults
      return this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Get default settings
   */
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
      matchType: 'exact',
      enabled: true,
      lastUpdated: Date.now()
    };
  }

  /**
   * Remove settings for a specific URL pattern
   */
  async removeSettings(url, matchType = 'exact') {
    try {
      const key = this.generateStorageKey(url, matchType);
      await this.storage.remove(key);
      return true;
    } catch (error) {
      console.error('Failed to remove settings:', error);
      return false;
    }
  }

  /**
   * Get all saved settings
   */
  async getAllSettings() {
    try {
      const result = await this.storage.get(null);
      return result;
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return {};
    }
  }

  /**
   * Clear all saved settings
   */
  async clearAllSettings() {
    try {
      await this.storage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear all settings:', error);
      return false;
    }
  }

  /**
   * Export settings as JSON
   */
  async exportSettings() {
    try {
      const settings = await this.getAllSettings();
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      console.error('Failed to export settings:', error);
      return null;
    }
  }

  /**
   * Import settings from JSON
   */
  async importSettings(jsonString) {
    try {
      const settings = JSON.parse(jsonString);
      await this.storage.set(settings);
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  /**
   * Get settings statistics
   */
  async getSettingsStats() {
    try {
      const allSettings = await this.getAllSettings();
      const keys = Object.keys(allSettings);
      
      const stats = {
        totalSavedSites: keys.length,
        domainSettings: keys.filter(key => !key.includes('/')).length,
        pathSettings: keys.filter(key => key.includes('/') && !key.startsWith('http')).length,
        exactUrlSettings: keys.filter(key => key.startsWith('http')).length,
        oldestSetting: Math.min(...keys.map(key => allSettings[key].lastUpdated || Date.now())),
        newestSetting: Math.max(...keys.map(key => allSettings[key].lastUpdated || 0))
      };

      return stats;
    } catch (error) {
      console.error('Failed to get settings stats:', error);
      return null;
    }
  }
}
