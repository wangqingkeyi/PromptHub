import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeftIcon, 
  SunIcon, 
  MoonIcon, 
  MonitorIcon, 
  DownloadIcon, 
  UploadIcon,
  TrashIcon,
  GlobeIcon,
  PaletteIcon,
  DatabaseIcon,
  BrainIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
  PlayIcon,
  LoaderIcon
} from 'lucide-react';
import { useSettingsStore, MORANDI_THEMES } from '../../stores/settings.store';
import { downloadBackup, restoreFromFile, clearDatabase } from '../../services/database';
import { usePromptStore } from '../../stores/prompt.store';
import { useFolderStore } from '../../stores/folder.store';
import { useToast } from '../ui/Toast';
import { testAIConnection } from '../../services/ai';
import type { AIModelConfig } from '../../types';

interface SettingsPageProps {
  onBack: () => void;
}

// AI Providers list
const AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', url: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'anthropic', name: 'Anthropic', url: 'https://api.anthropic.com/v1', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-coder'] },
  { id: 'moonshot', name: 'Moonshot', url: 'https://api.moonshot.cn/v1', models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'] },
  { id: 'zhipu', name: 'ZhiPu AI', url: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4', 'glm-4-plus', 'glm-3-turbo'] },
  { id: 'custom', name: 'Custom', url: '', models: [] },
];

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const fetchPrompts = usePromptStore((state) => state.fetchPrompts);
  const fetchFolders = useFolderStore((state) => state.fetchFolders);

  const themeMode = useSettingsStore((state) => state.themeMode);
  const themeColor = useSettingsStore((state) => state.themeColor);
  const language = useSettingsStore((state) => state.language);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const setThemeColor = useSettingsStore((state) => state.setThemeColor);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  
  const aiModels = useSettingsStore((state) => state.aiModels);
  const addAiModel = useSettingsStore((state) => state.addAiModel);
  const updateAiModel = useSettingsStore((state) => state.updateAiModel);
  const deleteAiModel = useSettingsStore((state) => state.deleteAiModel);
  const setDefaultAiModel = useSettingsStore((state) => state.setDefaultAiModel);

  const [isAddingModel, setIsAddingModel] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [modelForm, setModelForm] = useState({
    provider: 'openai',
    apiKey: '',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  });
  const [testingModelId, setTestingModelId] = useState<string | null>(null);

  // Handle export
  const handleExport = async () => {
    try {
      await downloadBackup();
      showToast(t('toast.exportSuccess'), 'success');
    } catch {
      showToast(t('toast.exportFailed'), 'error');
    }
  };

  // Handle import
  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await restoreFromFile(file);
          await fetchPrompts();
          await fetchFolders();
          showToast(t('toast.importSuccess'), 'success');
        } catch {
          showToast(t('toast.importFailed'), 'error');
        }
      }
    };
    input.click();
  };

  // Handle clear
  const handleClear = async () => {
    if (confirm(t('settings.clearDesc'))) {
      try {
        await clearDatabase();
        await fetchPrompts();
        await fetchFolders();
        showToast(t('toast.clearSuccess'), 'success');
      } catch {
        showToast(t('toast.clearFailed'), 'error');
      }
    }
  };

  // Handle provider change
  const handleProviderChange = (providerId: string) => {
    const provider = AI_PROVIDERS.find((p) => p.id === providerId);
    if (provider) {
      setModelForm({
        ...modelForm,
        provider: providerId,
        apiUrl: provider.url,
        model: provider.models[0] || '',
      });
    }
  };

  // Handle save model
  const handleSaveModel = () => {
    if (!modelForm.apiKey || !modelForm.apiUrl || !modelForm.model) {
      showToast(t('settings.fillComplete'), 'error');
      return;
    }

    if (editingModelId) {
      updateAiModel(editingModelId, {
        ...modelForm,
        type: 'chat',
      });
      showToast(t('settings.modelUpdated'), 'success');
    } else {
      addAiModel({
        ...modelForm,
        type: 'chat',
      });
      showToast(t('settings.modelAdded'), 'success');
    }

    setIsAddingModel(false);
    setEditingModelId(null);
    setModelForm({
      provider: 'openai',
      apiKey: '',
      apiUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    });
  };

  // Handle edit model
  const handleEditModel = (model: AIModelConfig) => {
    setModelForm({
      provider: model.provider,
      apiKey: model.apiKey,
      apiUrl: model.apiUrl,
      model: model.model,
    });
    setEditingModelId(model.id);
    setIsAddingModel(true);
  };

  // Handle test model
  const handleTestModel = async (model: AIModelConfig) => {
    setTestingModelId(model.id);
    try {
      const result = await testAIConnection({
        provider: model.provider,
        apiKey: model.apiKey,
        apiUrl: model.apiUrl,
        model: model.model,
      });
      if (result.success) {
        showToast(`${t('toast.connectionSuccess')} (${result.latency}ms)`, 'success');
      } else {
        showToast(`${t('toast.connectionFailed')}: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast(t('toast.connectionFailed'), 'error');
    } finally {
      setTestingModelId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <h2 className="text-base font-semibold">{t('settings.title')}</h2>
        </div>

        <div className="space-y-4">
          {/* Appearance */}
          <section className="bg-card rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <PaletteIcon className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold">{t('settings.appearance')}</h3>
            </div>
            
            {/* Theme Mode */}
            <div className="mb-3">
              <label className="block text-[10px] font-medium text-muted-foreground mb-1.5">
                {t('settings.themeMode')}
              </label>
              <div className="flex gap-1.5">
                {[
                  { id: 'light', icon: SunIcon, label: t('settings.light') },
                  { id: 'dark', icon: MoonIcon, label: t('settings.dark') },
                  { id: 'system', icon: MonitorIcon, label: t('settings.system') },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setThemeMode(id as 'light' | 'dark' | 'system')}
                    className={`
                      flex-1 flex items-center justify-center gap-1 h-7 rounded-md text-[10px] font-medium
                      transition-colors
                      ${themeMode === id
                        ? 'bg-primary text-white'
                        : 'bg-muted hover:bg-accent'
                      }
                    `}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Color */}
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1.5">
                {t('settings.themeColor')}
              </label>
              <div className="flex gap-1.5">
                {MORANDI_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setThemeColor(theme.id)}
                    className={`
                      w-6 h-6 rounded-full transition-all
                      ${themeColor === theme.id ? 'ring-2 ring-offset-2 ring-primary' : ''}
                    `}
                    style={{
                      backgroundColor: `hsl(${theme.hue}, ${theme.saturation}%, 55%)`,
                    }}
                    title={theme.name}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Language */}
          <section className="bg-card rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <GlobeIcon className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold">{t('settings.language')}</h3>
            </div>
            
            <div className="flex gap-1.5">
              {[
                { id: 'zh', label: '中文' },
                { id: 'en', label: 'English' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setLanguage(id as 'zh' | 'en')}
                  className={`
                    flex-1 h-7 rounded-md text-[10px] font-medium
                    transition-colors
                    ${language === id
                      ? 'bg-primary text-white'
                      : 'bg-muted hover:bg-accent'
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Data */}
          <section className="bg-card rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <DatabaseIcon className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold">{t('settings.data')}</h3>
            </div>
            
            <div className="flex gap-1.5">
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-1 h-7 rounded-md bg-muted text-[10px] font-medium hover:bg-accent transition-colors"
              >
                <DownloadIcon className="w-3 h-3" />
                {t('settings.export')}
              </button>
              <button
                onClick={handleImport}
                className="flex-1 flex items-center justify-center gap-1 h-7 rounded-md bg-muted text-[10px] font-medium hover:bg-accent transition-colors"
              >
                <UploadIcon className="w-3 h-3" />
                {t('settings.import')}
              </button>
              <button
                onClick={handleClear}
                className="flex-1 flex items-center justify-center gap-1 h-7 rounded-md bg-destructive/10 text-destructive text-[10px] font-medium hover:bg-destructive/20 transition-colors"
              >
                <TrashIcon className="w-3 h-3" />
                {t('settings.clear')}
              </button>
            </div>
          </section>

          {/* AI Models */}
          <section className="bg-card rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BrainIcon className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold">{t('settings.ai')}</h3>
              </div>
              <button
                onClick={() => {
                  setIsAddingModel(true);
                  setEditingModelId(null);
                  setModelForm({
                    provider: 'openai',
                    apiKey: '',
                    apiUrl: 'https://api.openai.com/v1',
                    model: 'gpt-4o',
                  });
                }}
                className="h-6 px-2 rounded-md bg-primary text-white text-[10px] font-medium flex items-center gap-1 hover:bg-primary/90 transition-colors"
              >
                <PlusIcon className="w-3 h-3" />
                {t('settings.addModel')}
              </button>
            </div>

            {/* Model List */}
            {aiModels.length > 0 ? (
              <div className="space-y-1.5 mb-3">
                {aiModels.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium truncate">{model.model}</span>
                        {model.isDefault && (
                          <span className="px-1 py-0.5 rounded text-[8px] bg-primary/10 text-primary">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-muted-foreground truncate">
                        {model.provider}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTestModel(model)}
                        disabled={testingModelId === model.id}
                        className="h-6 px-1.5 rounded text-[9px] hover:bg-accent transition-colors disabled:opacity-50"
                      >
                        {testingModelId === model.id ? (
                          <LoaderIcon className="w-3 h-3 animate-spin" />
                        ) : (
                          <PlayIcon className="w-3 h-3" />
                        )}
                      </button>
                      {!model.isDefault && (
                        <button
                          onClick={() => setDefaultAiModel(model.id)}
                          className="h-6 px-1.5 rounded text-[9px] hover:bg-accent transition-colors"
                        >
                          <CheckIcon className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditModel(model)}
                        className="h-6 px-1.5 rounded text-[9px] hover:bg-accent transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t('settings.confirmDelete'))) {
                            deleteAiModel(model.id);
                          }
                        }}
                        className="h-6 px-1.5 rounded text-[9px] text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground text-center py-2 mb-3">
                {t('settings.noModelsHint')}
              </p>
            )}

            {/* Add/Edit Model Form */}
            {isAddingModel && (
              <div className="p-2 rounded-md bg-muted/50 border border-border space-y-2">
                <div>
                  <label className="block text-[9px] font-medium text-muted-foreground mb-1">
                    {t('settings.provider')}
                  </label>
                  <select
                    value={modelForm.provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full h-7 px-2 rounded-md bg-background border-0 text-[10px] focus:ring-1 focus:ring-primary"
                  >
                    {AI_PROVIDERS.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-medium text-muted-foreground mb-1">
                    {t('settings.apiKey')}
                  </label>
                  <input
                    type="password"
                    value={modelForm.apiKey}
                    onChange={(e) => setModelForm({ ...modelForm, apiKey: e.target.value })}
                    placeholder={t('settings.apiKeyPlaceholder')}
                    className="w-full h-7 px-2 rounded-md bg-background border-0 text-[10px] placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-medium text-muted-foreground mb-1">
                    {t('settings.apiUrl')}
                  </label>
                  <input
                    type="text"
                    value={modelForm.apiUrl}
                    onChange={(e) => setModelForm({ ...modelForm, apiUrl: e.target.value })}
                    placeholder={t('settings.apiUrlPlaceholder')}
                    className="w-full h-7 px-2 rounded-md bg-background border-0 text-[10px] placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-medium text-muted-foreground mb-1">
                    {t('settings.model')}
                  </label>
                  <input
                    type="text"
                    value={modelForm.model}
                    onChange={(e) => setModelForm({ ...modelForm, model: e.target.value })}
                    placeholder={t('settings.modelNamePlaceholder')}
                    className="w-full h-7 px-2 rounded-md bg-background border-0 text-[10px] placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      setIsAddingModel(false);
                      setEditingModelId(null);
                    }}
                    className="h-6 px-2 rounded-md text-[10px] font-medium hover:bg-accent transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSaveModel}
                    className="h-6 px-2 rounded-md bg-primary text-white text-[10px] font-medium hover:bg-primary/90 transition-colors"
                  >
                    {editingModelId ? t('settings.saveChanges') : t('settings.addModel')}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
