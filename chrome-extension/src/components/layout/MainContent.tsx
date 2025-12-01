import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  StarIcon, 
  CopyIcon, 
  HistoryIcon, 
  HashIcon, 
  SparklesIcon, 
  EditIcon, 
  TrashIcon, 
  CheckIcon,
  PlayIcon,
  LoaderIcon,
  XIcon,
  ClockIcon
} from 'lucide-react';
import { usePromptStore } from '../../stores/prompt.store';
import { useFolderStore } from '../../stores/folder.store';
import { useSettingsStore } from '../../stores/settings.store';
import { EditPromptModal } from '../prompt/EditPromptModal';
import { VersionHistoryModal } from '../prompt/VersionHistoryModal';
import { VariableInputModal } from '../prompt/VariableInputModal';
import { useToast } from '../ui/Toast';
import { chatCompletion, buildMessagesFromPrompt } from '../../services/ai';
import type { Prompt, PromptVersion } from '../../types';

// Prompt Card Component
function PromptCard({ 
  prompt, 
  isSelected, 
  onSelect 
}: { 
  prompt: Prompt; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`
        w-full text-left px-3 py-3 rounded-xl cursor-pointer
        transition-all duration-200
        ${isSelected
          ? 'bg-primary text-white shadow-md'
          : 'bg-card hover:bg-accent/50 border border-transparent hover:border-border'
        }
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold truncate text-sm">{prompt.title}</h3>
        {prompt.isFavorite && (
          <StarIcon className={`w-4 h-4 flex-shrink-0 ${
            isSelected ? 'fill-white text-white' : 'fill-yellow-400 text-yellow-400'
          }`} />
        )}
      </div>
      {prompt.description && (
        <p className={`text-xs truncate mt-1 ${
          isSelected ? 'text-white/80' : 'text-muted-foreground'
        }`}>
          {prompt.description}
        </p>
      )}
      {prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {prompt.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${
                isSelected ? 'bg-white/20 text-white' : 'bg-accent text-accent-foreground'
              }`}
            >
              <HashIcon className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function MainContent() {
  const { t } = useTranslation();
  const prompts = usePromptStore((state) => state.prompts);
  const selectedId = usePromptStore((state) => state.selectedId);
  const selectPrompt = usePromptStore((state) => state.selectPrompt);
  const toggleFavorite = usePromptStore((state) => state.toggleFavorite);
  const deletePrompt = usePromptStore((state) => state.deletePrompt);
  const updatePrompt = usePromptStore((state) => state.updatePrompt);
  const searchQuery = usePromptStore((state) => state.searchQuery);
  const filterTags = usePromptStore((state) => state.filterTags);
  const selectedFolderId = useFolderStore((state) => state.selectedFolderId);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isAiTestVariableModalOpen, setIsAiTestVariableModalOpen] = useState(false);
  const { showToast } = useToast();

  // Reset state when switching prompts
  useEffect(() => {
    setShowAiPanel(false);
    setAiResponse(null);
  }, [selectedId]);
  
  // AI configuration
  const aiProvider = useSettingsStore((state) => state.aiProvider);
  const aiApiKey = useSettingsStore((state) => state.aiApiKey);
  const aiApiUrl = useSettingsStore((state) => state.aiApiUrl);
  const aiModel = useSettingsStore((state) => state.aiModel);

  const handleRestoreVersion = async (version: PromptVersion) => {
    if (selectedPrompt) {
      await updatePrompt(selectedPrompt.id, {
        systemPrompt: version.systemPrompt,
        userPrompt: version.userPrompt,
      });
      showToast(t('toast.restored'), 'success');
    }
  };

  // AI test function
  const runAiTest = async (systemPrompt: string | undefined, userPrompt: string) => {
    setShowAiPanel(true);
    setIsTestingAI(true);
    setAiResponse(null);
    setIsAiTestVariableModalOpen(false);
    try {
      const messages = buildMessagesFromPrompt(systemPrompt, userPrompt);
      const response = await chatCompletion(
        { provider: aiProvider, apiKey: aiApiKey, apiUrl: aiApiUrl, model: aiModel },
        messages
      );
      setAiResponse(response);
    } catch (error) {
      setAiResponse(`${t('common.error')}: ${error instanceof Error ? error.message : t('common.error')}`);
      showToast(t('toast.aiFailed'), 'error');
    } finally {
      setIsTestingAI(false);
    }
  };

  // Filter prompts
  let filteredPrompts = prompts;

  if (selectedFolderId === 'favorites') {
    filteredPrompts = filteredPrompts.filter((p) => p.isFavorite);
  } else if (selectedFolderId) {
    filteredPrompts = filteredPrompts.filter((p) => p.folderId === selectedFolderId);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredPrompts = filteredPrompts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.userPrompt.toLowerCase().includes(query)
    );
  }

  // Tag filter
  if (filterTags.length > 0) {
    filteredPrompts = filteredPrompts.filter((p) => 
      filterTags.every(tag => p.tags.includes(tag))
    );
  }

  const selectedPrompt = prompts.find((p) => p.id === selectedId);

  return (
    <main className="flex-1 flex overflow-hidden bg-background">
      {/* Prompt list */}
      <div className="w-56 border-r border-border overflow-y-auto bg-card/30">
        {filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3">
              <SparklesIcon className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">{t('prompt.noPrompts')}</p>
            <p className="text-xs text-muted-foreground">{t('prompt.addFirst')}</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                isSelected={selectedId === prompt.id}
                onSelect={() => selectPrompt(prompt.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Prompt detail */}
      <div className="flex-1 overflow-y-auto">
        {selectedPrompt ? (
          <div className="p-6">
            {/* Title area */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-1">{selectedPrompt.title}</h2>
                {selectedPrompt.description && (
                  <p className="text-sm text-muted-foreground">{selectedPrompt.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleFavorite(selectedPrompt.id)}
                  className={`
                    p-2 rounded-xl transition-all duration-200
                    ${selectedPrompt.isFavorite
                      ? 'text-yellow-500 bg-yellow-500/10'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }
                    active:scale-95
                  `}
                >
                  <StarIcon className={`w-5 h-5 ${selectedPrompt.isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 active:scale-95"
                >
                  <EditIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4" />
                {new Date(selectedPrompt.updatedAt).toLocaleDateString()}
              </span>
              <span className="px-2 py-1 rounded-lg bg-accent text-accent-foreground font-medium">
                v{selectedPrompt.version}
              </span>
            </div>

            {/* Tags */}
            {selectedPrompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedPrompt.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground"
                  >
                    <HashIcon className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* System Prompt */}
            {selectedPrompt.systemPrompt && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    System Prompt
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-28 overflow-y-auto shadow-sm">
                  {selectedPrompt.systemPrompt}
                </div>
              </div>
            )}

            {/* User Prompt */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  User Prompt
                </span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto shadow-sm">
                {selectedPrompt.userPrompt}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button 
                onClick={() => {
                  const variableRegex = /\{\{([^}]+)\}\}/g;
                  const hasVariables = variableRegex.test(selectedPrompt.userPrompt) || 
                    (selectedPrompt.systemPrompt && variableRegex.test(selectedPrompt.systemPrompt));
                  
                  if (hasVariables) {
                    setIsVariableModalOpen(true);
                  } else {
                    const text = selectedPrompt.userPrompt;
                    navigator.clipboard.writeText(text);
                    setCopied(true);
                    showToast(t('toast.copied'), 'success');
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                <span>{copied ? t('prompt.copied') : t('prompt.copy')}</span>
              </button>
              <button 
                onClick={() => {
                  if (!aiApiKey) {
                    showToast(t('toast.configAI'), 'error');
                    return;
                  }
                  const variableRegex = /\{\{([^}]+)\}\}/g;
                  const hasVariables = variableRegex.test(selectedPrompt.userPrompt) || 
                    (selectedPrompt.systemPrompt && variableRegex.test(selectedPrompt.systemPrompt));
                  
                  if (hasVariables) {
                    setIsAiTestVariableModalOpen(true);
                  } else {
                    runAiTest(selectedPrompt.systemPrompt, selectedPrompt.userPrompt);
                  }
                }}
                disabled={isTestingAI}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                {isTestingAI ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <PlayIcon className="w-4 h-4" />}
                <span>{isTestingAI ? t('prompt.testing') : t('prompt.aiTest')}</span>
              </button>
              <button 
                onClick={() => setIsVersionModalOpen(true)}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-card border border-border text-sm font-medium hover:bg-accent transition-all active:scale-95"
              >
                <HistoryIcon className="w-4 h-4" />
                <span>{t('prompt.history')}</span>
              </button>
              <button 
                onClick={async () => {
                  if (confirm(t('prompt.confirmDeletePrompt'))) {
                    await deletePrompt(selectedPrompt.id);
                    showToast(t('prompt.promptDeleted'), 'success');
                  }
                }}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-card border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-all active:scale-95"
              >
                <TrashIcon className="w-4 h-4" />
                <span>{t('prompt.delete')}</span>
              </button>
            </div>

            {/* AI Response Panel */}
            {showAiPanel && (
              <div className="mt-4 p-4 rounded-xl bg-card border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">{t('prompt.aiResponse')}</span>
                    <span className="text-xs text-muted-foreground">({aiModel})</span>
                  </div>
                  <button
                    onClick={() => setShowAiPanel(false)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <XIcon className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {isTestingAI ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LoaderIcon className="w-4 h-4 animate-spin" />
                      <span>{t('prompt.callingAI')}</span>
                    </div>
                  ) : aiResponse ? (
                    aiResponse
                  ) : (
                    <span className="text-muted-foreground">{t('prompt.waitingResponse')}</span>
                  )}
                </div>
                {aiResponse && !isTestingAI && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiResponse);
                      showToast(t('prompt.responseCopied'), 'success');
                    }}
                    className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CopyIcon className="w-3 h-3" />
                    {t('prompt.copyResponse')}
                  </button>
                )}
              </div>
            )}

            {/* Edit Modal */}
            <EditPromptModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              prompt={selectedPrompt}
            />

            {/* Version History Modal */}
            <VersionHistoryModal
              isOpen={isVersionModalOpen}
              onClose={() => setIsVersionModalOpen(false)}
              prompt={selectedPrompt}
              onRestore={handleRestoreVersion}
            />

            {/* Variable Input Modal - Copy */}
            <VariableInputModal
              isOpen={isVariableModalOpen}
              onClose={() => setIsVariableModalOpen(false)}
              promptId={selectedPrompt.id}
              systemPrompt={selectedPrompt.systemPrompt}
              userPrompt={selectedPrompt.userPrompt}
              mode="copy"
              onCopy={() => {
                setCopied(true);
                showToast(t('toast.copied'), 'success');
                setTimeout(() => setCopied(false), 2000);
                setIsVariableModalOpen(false);
              }}
            />

            {/* Variable Input Modal - AI Test */}
            <VariableInputModal
              isOpen={isAiTestVariableModalOpen}
              onClose={() => setIsAiTestVariableModalOpen(false)}
              promptId={selectedPrompt.id}
              systemPrompt={selectedPrompt.systemPrompt}
              userPrompt={selectedPrompt.userPrompt}
              mode="aiTest"
              onAiTest={(filledSystemPrompt, filledUserPrompt) => {
                runAiTest(filledSystemPrompt, filledUserPrompt);
              }}
              isAiTesting={isTestingAI}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <SparklesIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('prompt.selectPrompt')}</h3>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              {t('prompt.selectPromptDesc')}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
