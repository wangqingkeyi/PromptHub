import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon, CopyIcon, PlayIcon, LoaderIcon } from 'lucide-react';

interface VariableInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: string;
  systemPrompt?: string;
  userPrompt: string;
  mode: 'copy' | 'aiTest';
  onCopy?: () => void;
  onAiTest?: (systemPrompt: string | undefined, userPrompt: string) => void;
  isAiTesting?: boolean;
}

export function VariableInputModal({
  isOpen,
  onClose,
  promptId,
  systemPrompt,
  userPrompt,
  mode,
  onCopy,
  onAiTest,
  isAiTesting,
}: VariableInputModalProps) {
  const { t } = useTranslation();
  const [variables, setVariables] = useState<Record<string, string>>({});

  // Extract variables from prompt
  const extractVariables = (text: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    return [...new Set(matches)];
  };

  const allVariables = [
    ...extractVariables(userPrompt),
    ...(systemPrompt ? extractVariables(systemPrompt) : []),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  // Load saved variables from localStorage
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(`prompthub-variables-${promptId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setVariables(parsed);
        } catch {
          setVariables({});
        }
      } else {
        setVariables({});
      }
    }
  }, [isOpen, promptId]);

  // Save variables to localStorage
  const saveVariables = (vars: Record<string, string>) => {
    localStorage.setItem(`prompthub-variables-${promptId}`, JSON.stringify(vars));
  };

  const handleVariableChange = (name: string, value: string) => {
    const updated = { ...variables, [name]: value };
    setVariables(updated);
    saveVariables(updated);
  };

  const replaceVariables = (text: string): string => {
    let result = text;
    for (const [name, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), value || `{{${name}}}`);
    }
    return result;
  };

  const handleAction = () => {
    const filledSystemPrompt = systemPrompt ? replaceVariables(systemPrompt) : undefined;
    const filledUserPrompt = replaceVariables(userPrompt);

    if (mode === 'copy') {
      navigator.clipboard.writeText(filledUserPrompt);
      onCopy?.();
    } else {
      onAiTest?.(filledSystemPrompt, filledUserPrompt);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-card rounded-xl shadow-lg animate-scaleIn max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{t('prompt.variableInput')}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <XIcon className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          <p className="text-[10px] text-muted-foreground">{t('prompt.fillVariables')}</p>
          
          {allVariables.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {t('prompt.noVariables')}
            </p>
          ) : (
            allVariables.map((name) => (
              <div key={name}>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                  {name}
                </label>
                <textarea
                  value={variables[name] || ''}
                  onChange={(e) => handleVariableChange(name, e.target.value)}
                  placeholder={t('prompt.inputVariable', { name })}
                  rows={2}
                  className="w-full px-2 py-1.5 rounded-md bg-muted border-0 text-xs placeholder:text-muted-foreground focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            ))
          )}
        </div>
        
        {/* Preview */}
        {allVariables.length > 0 && (
          <div className="px-4 pb-3">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              {t('prompt.previewResult')}
            </div>
            <div className="p-2 rounded-lg bg-muted font-mono text-[10px] leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto">
              {replaceVariables(userPrompt)}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="h-7 px-3 rounded-md text-[11px] font-medium hover:bg-muted transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleAction}
            disabled={isAiTesting}
            className="h-7 px-3 rounded-md bg-primary text-white text-[11px] font-medium flex items-center gap-1 hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {mode === 'copy' ? (
              <>
                <CopyIcon className="w-3 h-3" />
                {t('prompt.copyResult')}
              </>
            ) : isAiTesting ? (
              <>
                <LoaderIcon className="w-3 h-3 animate-spin" />
                {t('prompt.testing')}
              </>
            ) : (
              <>
                <PlayIcon className="w-3 h-3" />
                {t('prompt.aiTest')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
