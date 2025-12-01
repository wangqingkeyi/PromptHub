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
        w-full text-left px-2 py-2 rounded-md cursor-pointer
        transition-colors duration-150
        ${isSelected
          ? 'bg-primary text-white'
          : 'bg-card hover:bg-accent'
        }
      `}
    >
      <div className="flex items-center justify-between gap-1">
        <h3 className="font-medium truncate text-xs">{prompt.title}</h3>
        {prompt.isFavorite && (
          <StarIcon className={`w-3 h-3 flex-shrink-0 ${
            isSelected ? 'fill-white text-white' : 'fill-yellow-400 text-yellow-400'
          }`} />
        )}
      </div>
      {prompt.description && (
        <p className={`text-[10px] truncate mt-0.5 ${
          isSelected ? 'text-white/70' : 'text-muted-foreground'
        }`}>
          {prompt.description}
        </p>
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
      <div className="w-44 border-r border-border overflow-y-auto bg-card/50">
        {filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <SparklesIcon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-medium text-foreground mb-0.5">{t('prompt.noPrompts')}</p>
            <p className="text-[10px] text-muted-foreground">{t('prompt.addFirst')}</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
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
          <div className="p-4">
            {/* Title area */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h2 className="text-base font-bold text-foreground mb-1">{selectedPrompt.title}</h2>
                {selectedPrompt.description && (
                  <p className="text-xs text-muted-foreground">{selectedPrompt.description}</p>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => toggleFavorite(selectedPrompt.id)}
                  className={`
                    p-1.5 rounded-md transition-all duration-200
                    ${selectedPrompt.isFavorite
                      ? 'text-yellow-500 bg-yellow-500/10'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }
                    active:scale-95
                  `}
                >
                  <StarIcon className={`w-4 h-4 ${selectedPrompt.isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 active:scale-95"
                >
                  <EditIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {new Date(selectedPrompt.updatedAt).toLocaleDateString()}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                v{selectedPrompt.version}
              </span>
            </div>

            {/* Tags */}
            {selectedPrompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {selectedPrompt.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent text-accent-foreground"
                  >
                    <HashIcon className="w-2 h-2" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* System Prompt */}
            {selectedPrompt.systemPrompt && (
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    System Prompt
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-20 overflow-y-auto">
                  {selectedPrompt.systemPrompt}
                </div>
              </div>
            )}

            {/* User Prompt */}
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  User Prompt
                </span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                {selectedPrompt.userPrompt}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
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
                className="flex items-center gap-1 h-7 px-3 rounded-md bg-primary text-white text-[11px] font-medium hover:bg-primary/90 transition-colors"
              >
                {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
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
                className="flex items-center gap-1 h-7 px-3 rounded-md bg-primary/90 text-white text-[11px] font-medium hover:bg-primary disabled:opacity-50 transition-colors"
              >
                {isTestingAI ? <LoaderIcon className="w-3 h-3 animate-spin" /> : <PlayIcon className="w-3 h-3" />}
                <span>{isTestingAI ? t('prompt.testing') : t('prompt.aiTest')}</span>
              </button>
              <button 
                onClick={() => setIsVersionModalOpen(true)}
                className="flex items-center gap-1 h-7 px-3 rounded-md bg-card border border-border text-[11px] font-medium hover:bg-accent transition-colors"
              >
                <HistoryIcon className="w-3 h-3" />
                <span>{t('prompt.history')}</span>
              </button>
              <button 
                onClick={async () => {
                  if (confirm(t('prompt.confirmDeletePrompt'))) {
                    await deletePrompt(selectedPrompt.id);
                    showToast(t('prompt.promptDeleted'), 'success');
                  }
                }}
                className="flex items-center gap-1 h-7 px-3 rounded-md bg-card border border-destructive/30 text-destructive text-[11px] font-medium hover:bg-destructive/10 transition-colors"
              >
                <TrashIcon className="w-3 h-3" />
                <span>{t('prompt.delete')}</span>
              </button>
            </div>

            {/* AI Response Panel */}
            {showAiPanel && (
              <div className="mt-3 p-2 rounded-lg bg-card border border-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <SparklesIcon className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] font-medium">{t('prompt.aiResponse')}</span>
                    <span className="text-[9px] text-muted-foreground">({aiModel})</span>
                  </div>
                  <button
                    onClick={() => setShowAiPanel(false)}
                    className="p-0.5 rounded hover:bg-muted transition-colors"
                  >
                    <XIcon className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
                <div className="p-2 rounded bg-muted/50 font-mono text-[10px] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {isTestingAI ? (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <LoaderIcon className="w-3 h-3 animate-spin" />
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
                    className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CopyIcon className="w-2 h-2" />
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
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <SparklesIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{t('prompt.selectPrompt')}</h3>
            <p className="text-[10px] text-muted-foreground max-w-[200px]">
              {t('prompt.selectPromptDesc')}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
