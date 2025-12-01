import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n, { changeLanguage } from '../i18n';
import type { AIModelConfig } from '../types';

// Theme colors - Morandi palette + Royal Blue
export const MORANDI_THEMES = [
  { id: 'royal-blue', hue: 220, saturation: 70, name: '宝蓝' },
  { id: 'blue', hue: 210, saturation: 35, name: '雾蓝' },
  { id: 'purple', hue: 260, saturation: 30, name: '烟紫' },
  { id: 'green', hue: 150, saturation: 30, name: '豆绿' },
  { id: 'orange', hue: 25, saturation: 40, name: '杏橘' },
  { id: 'teal', hue: 175, saturation: 30, name: '青黛' },
];

export const FONT_SIZES = [
  { id: 'small', value: 14, name: '小' },
  { id: 'medium', value: 16, name: '中' },
  { id: 'large', value: 18, name: '大' },
];

export type ThemeMode = 'light' | 'dark' | 'system';
export type AIModelType = 'chat' | 'image';

interface SettingsState {
  // Display settings
  themeMode: ThemeMode;
  isDarkMode: boolean;
  themeColor: string;
  themeHue: number;
  themeSaturation: number;
  fontSize: string;
  
  // General settings
  autoSave: boolean;
  showLineNumbers: boolean;
  
  // Notification settings
  enableNotifications: boolean;
  showCopyNotification: boolean;
  showSaveNotification: boolean;
  
  // Language settings
  language: 'zh' | 'en';
  
  // AI model configuration
  aiProvider: string;
  aiApiKey: string;
  aiApiUrl: string;
  aiModel: string;
  
  // Multi-model configuration
  aiModels: AIModelConfig[];
  
  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setDarkMode: (isDark: boolean) => void;
  setThemeColor: (colorId: string) => void;
  setFontSize: (size: string) => void;
  setAutoSave: (enabled: boolean) => void;
  setShowLineNumbers: (enabled: boolean) => void;
  setEnableNotifications: (enabled: boolean) => void;
  setShowCopyNotification: (enabled: boolean) => void;
  setShowSaveNotification: (enabled: boolean) => void;
  setLanguage: (lang: 'zh' | 'en') => void;
  setAiProvider: (provider: string) => void;
  setAiApiKey: (key: string) => void;
  setAiApiUrl: (url: string) => void;
  setAiModel: (model: string) => void;
  addAiModel: (config: Omit<AIModelConfig, 'id'>) => void;
  updateAiModel: (id: string, config: Partial<AIModelConfig>) => void;
  deleteAiModel: (id: string) => void;
  setDefaultAiModel: (id: string) => void;
  applyTheme: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Default values
      themeMode: 'system' as ThemeMode,
      isDarkMode: true,
      themeColor: 'royal-blue',
      themeHue: 220,
      themeSaturation: 70,
      fontSize: 'medium',
      autoSave: true,
      showLineNumbers: false,
      enableNotifications: true,
      showCopyNotification: true,
      showSaveNotification: true,
      language: (i18n.language === 'en' ? 'en' : 'zh') as 'zh' | 'en',
      aiProvider: 'openai',
      aiApiKey: '',
      aiApiUrl: '',
      aiModel: 'gpt-4o',
      aiModels: [],
      
      setThemeMode: (mode) => {
        set({ themeMode: mode });
        if (mode === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          set({ isDarkMode: prefersDark });
          document.documentElement.classList.toggle('dark', prefersDark);
        } else {
          const isDark = mode === 'dark';
          set({ isDarkMode: isDark });
          document.documentElement.classList.toggle('dark', isDark);
        }
      },
      
      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark, themeMode: isDark ? 'dark' : 'light' });
        document.documentElement.classList.toggle('dark', isDark);
      },
      
      setThemeColor: (colorId) => {
        const theme = MORANDI_THEMES.find(t => t.id === colorId);
        if (theme) {
          set({ 
            themeColor: colorId, 
            themeHue: theme.hue,
            themeSaturation: theme.saturation 
          });
          document.documentElement.style.setProperty('--theme-hue', String(theme.hue));
          document.documentElement.style.setProperty('--theme-saturation', String(theme.saturation));
        }
      },
      
      setFontSize: (size) => {
        set({ fontSize: size });
        const fontConfig = FONT_SIZES.find(f => f.id === size);
        if (fontConfig) {
          document.documentElement.style.setProperty('--base-font-size', `${fontConfig.value}px`);
        }
      },
      
      setAutoSave: (enabled) => set({ autoSave: enabled }),
      setShowLineNumbers: (enabled) => set({ showLineNumbers: enabled }),
      setEnableNotifications: (enabled) => set({ enableNotifications: enabled }),
      setShowCopyNotification: (enabled) => set({ showCopyNotification: enabled }),
      setShowSaveNotification: (enabled) => set({ showSaveNotification: enabled }),
      setLanguage: (lang) => {
        set({ language: lang });
        changeLanguage(lang);
      },
      setAiProvider: (provider) => set({ aiProvider: provider }),
      setAiApiKey: (key) => set({ aiApiKey: key }),
      setAiApiUrl: (url) => set({ aiApiUrl: url }),
      setAiModel: (model) => set({ aiModel: model }),
      
      // Multi-model management
      addAiModel: (config) => {
        const id = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const models = get().aiModels;
        const isFirst = models.length === 0;
        set({
          aiModels: [...models, { ...config, id, isDefault: isFirst }],
        });
        if (isFirst) {
          set({
            aiProvider: config.provider,
            aiApiKey: config.apiKey,
            aiApiUrl: config.apiUrl,
            aiModel: config.model,
          });
        }
      },
      
      updateAiModel: (id, config) => {
        const models = get().aiModels.map((m) =>
          m.id === id ? { ...m, ...config } : m
        );
        set({ aiModels: models });
        const updated = models.find((m) => m.id === id);
        if (updated?.isDefault) {
          set({
            aiProvider: updated.provider,
            aiApiKey: updated.apiKey,
            aiApiUrl: updated.apiUrl,
            aiModel: updated.model,
          });
        }
      },
      
      deleteAiModel: (id) => {
        const models = get().aiModels;
        const toDelete = models.find((m) => m.id === id);
        const remaining = models.filter((m) => m.id !== id);
        if (toDelete?.isDefault && remaining.length > 0) {
          remaining[0].isDefault = true;
          set({
            aiProvider: remaining[0].provider,
            aiApiKey: remaining[0].apiKey,
            aiApiUrl: remaining[0].apiUrl,
            aiModel: remaining[0].model,
          });
        }
        set({ aiModels: remaining });
      },
      
      setDefaultAiModel: (id) => {
        const models = get().aiModels.map((m) => ({
          ...m,
          isDefault: m.id === id,
        }));
        set({ aiModels: models });
        const defaultModel = models.find((m) => m.id === id);
        if (defaultModel) {
          set({
            aiProvider: defaultModel.provider,
            aiApiKey: defaultModel.apiKey,
            aiApiUrl: defaultModel.apiUrl,
            aiModel: defaultModel.model,
          });
        }
      },
      
      applyTheme: () => {
        const state = get();
        let isDark = state.isDarkMode;
        if (state.themeMode === 'system') {
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        } else {
          isDark = state.themeMode === 'dark';
        }
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.style.setProperty('--theme-hue', String(state.themeHue));
        document.documentElement.style.setProperty('--theme-saturation', String(state.themeSaturation));
        const fontConfig = FONT_SIZES.find(f => f.id === state.fontSize);
        if (fontConfig) {
          document.documentElement.style.setProperty('--base-font-size', `${fontConfig.value}px`);
        }
      },
    }),
    {
      name: 'prompthub-settings',
    }
  )
);
