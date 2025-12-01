import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon, ClockIcon, RotateCcwIcon } from 'lucide-react';
import { getPromptVersions } from '../../services/database';
import type { Prompt, PromptVersion } from '../../types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt;
  onRestore: (version: PromptVersion) => void;
}

export function VersionHistoryModal({ isOpen, onClose, prompt, onRestore }: VersionHistoryModalProps) {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);

  useEffect(() => {
    if (isOpen && prompt) {
      loadVersions();
    }
  }, [isOpen, prompt]);

  const loadVersions = async () => {
    try {
      const data = await getPromptVersions(prompt.id);
      // Add current version to the list
      const currentVersion: PromptVersion = {
        id: 'current',
        promptId: prompt.id,
        version: prompt.version,
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        variables: prompt.variables,
        createdAt: prompt.updatedAt,
      };
      setVersions([currentVersion, ...data]);
      setSelectedVersion(currentVersion);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const handleRestore = () => {
    if (selectedVersion && selectedVersion.id !== 'current') {
      if (confirm(t('toast.restored'))) {
        onRestore(selectedVersion);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-card rounded-xl shadow-lg animate-scaleIn max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{t('prompt.history')}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <XIcon className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Version list */}
          <div className="w-32 border-r border-border overflow-y-auto">
            {versions.map((version) => (
              <button
                key={version.id}
                onClick={() => setSelectedVersion(version)}
                className={`
                  w-full text-left px-3 py-2 border-b border-border
                  transition-colors
                  ${selectedVersion?.id === version.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                  }
                `}
              >
                <div className="text-[10px] font-medium">
                  {version.id === 'current' ? `v${version.version} (${t('prompt.updatedAt')})` : `v${version.version}`}
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                  <ClockIcon className="w-2.5 h-2.5" />
                  {new Date(version.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
          
          {/* Version content */}
          <div className="flex-1 p-3 overflow-y-auto">
            {selectedVersion && (
              <div className="space-y-3">
                {selectedVersion.systemPrompt && (
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      System Prompt
                    </div>
                    <div className="p-2 rounded-lg bg-muted font-mono text-[10px] leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {selectedVersion.systemPrompt}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    User Prompt
                  </div>
                  <div className="p-2 rounded-lg bg-muted font-mono text-[10px] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {selectedVersion.userPrompt}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="h-7 px-3 rounded-md text-[11px] font-medium hover:bg-muted transition-colors"
          >
            {t('common.close')}
          </button>
          {selectedVersion && selectedVersion.id !== 'current' && (
            <button
              onClick={handleRestore}
              className="h-7 px-3 rounded-md bg-primary text-white text-[11px] font-medium flex items-center gap-1 hover:bg-primary/90 transition-colors"
            >
              <RotateCcwIcon className="w-3 h-3" />
              {t('toast.restored')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
