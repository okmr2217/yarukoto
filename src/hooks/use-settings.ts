"use client";

import { useState, useEffect, useCallback } from "react";

interface Settings {
  autoCollapseCompleted: boolean;
  autoCollapseSkipped: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  autoCollapseCompleted: true,
  autoCollapseSkipped: true,
};

const STORAGE_KEY = "yarukoto-settings";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Settings>;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // Use default settings if localStorage is unavailable
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch {
        // Ignore localStorage errors
      }
      return newSettings;
    });
  }, []);

  const toggleAutoCollapseCompleted = useCallback(() => {
    updateSettings({ autoCollapseCompleted: !settings.autoCollapseCompleted });
  }, [settings.autoCollapseCompleted, updateSettings]);

  const toggleAutoCollapseSkipped = useCallback(() => {
    updateSettings({ autoCollapseSkipped: !settings.autoCollapseSkipped });
  }, [settings.autoCollapseSkipped, updateSettings]);

  return {
    settings,
    isLoaded,
    updateSettings,
    toggleAutoCollapseCompleted,
    toggleAutoCollapseSkipped,
  };
}
