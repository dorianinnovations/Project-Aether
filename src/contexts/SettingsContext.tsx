/**
 * Settings Context
 * Provides global access to app settings
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SettingsStorage, { DEFAULT_SETTINGS } from '../services/settingsStorage';

type SettingsContextType = {
  settings: typeof DEFAULT_SETTINGS;
  updateSetting: <K extends keyof typeof DEFAULT_SETTINGS>(
    key: K,
    value: typeof DEFAULT_SETTINGS[K]
  ) => Promise<void>;
  refreshSettings: () => Promise<void>;
};

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const loadSettings = async () => {
    try {
      const loadedSettings = await SettingsStorage.getAllSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = async <K extends keyof typeof DEFAULT_SETTINGS>(
    key: K,
    value: typeof DEFAULT_SETTINGS[K]
  ) => {
    try {
      await SettingsStorage.setSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};