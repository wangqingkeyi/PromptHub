import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon, InfoIcon } from 'lucide-react';
import { usePromptStore } from '../../stores/prompt.store';
import { useFolderStore } from '../../stores/folder.store';
import { useToast } from '../ui/Toast';
import type { Prompt } from '../../types';

interface EditPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt?: Prompt;
}

export function EditPromptModal({ isOpen, onClose, prompt }: EditPromptModalProps) {
  const { t } = useTranslation();
  const createPrompt = usePromptStore((state) => state.createPrompt);
  const updatePrompt = usePromptStore((state) => state.updatePrompt);
  const prompts = usePromptStore((state) => state.prompts);
  const folders = useFolderStore((state) => state.folders);
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const isEditing = !!prompt;
  const allTags = [...new Set(prompts.flatMap((p) => p.tags))];

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setDescription(prompt.description || '');
      setSystemPrompt(prompt.systemPrompt || '');
      setUserPrompt(prompt.userPrompt);
      setFolderId(prompt.folderId || '');
      setTags(prompt.tags);
    } else {
      setTitle('');
      setDescription('');
      setSystemPrompt('');
      setUserPrompt('');
      setFolderId('');
      setTags([]);
    }
    setTagInput('');
  }, [prompt, isOpen]);

  const handleSave = async () => {
    if (!title.trim() || !userPrompt.trim()) {
      showToast(t('common.requiredFields'), 'error');
      return;
    }

    try {
      if (isEditing) {
        await updatePrompt(prompt.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          systemPrompt: systemPrompt.trim() || undefined,
          userPrompt: userPrompt.trim(),
          folderId: folderId || undefined,
          tags,
        });
        showToast(t('toast.saved'), 'success');
      } else {
        await createPrompt({
          title: title.trim(),
          description: description.trim() || undefined,
          systemPrompt: systemPrompt.trim() || undefined,
          userPrompt: userPrompt.trim(),
          folderId: folderId || undefined,
          tags,
        });
        showToast(t('toast.saved'), 'success');
      }
      onClose();
    } catch (error) {
      showToast(t('common.error'), 'error');
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-card rounded-xl shadow-lg animate-scaleIn max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            {isEditing ? t('prompt.editPrompt') : t('prompt.createPrompt')}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <XIcon className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground mb-1">
              {t('prompt.titleLabel')} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('prompt.titlePlaceholder')}
              className="w-full h-8 px-2 rounded-md bg-muted border-0 text-xs placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground mb-1">
              {t('prompt.descriptionOptional')}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('prompt.descriptionPlaceholder')}
              className="w-full h-8 px-2 rounded-md bg-muted border-0 text-xs placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Folder */}
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground mb-1">
              {t('prompt.folderOptional')}
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full h-8 px-2 rounded-md bg-muted border-0 text-xs focus:ring-1 focus:ring-primary"
            >
              <option value="">{t('prompt.noFolder')}</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.icon} {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground mb-1">
              {t('prompt.tagsOptional')}
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <XIcon className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            {allTags.filter((t) => !tags.includes(t)).length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] text-muted-foreground mb-1">{t('prompt.selectExistingTags')}</p>
                <div className="flex flex-wrap gap-1">
                  {allTags.filter((t) => !tags.includes(t)).slice(0, 5).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setTags([...tags, tag])}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder={t('prompt.addTagPlaceholder')}
                className="flex-1 h-7 px-2 rounded-md bg-muted border-0 text-xs placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleAddTag}
                className="h-7 px-2 rounded-md bg-primary text-white text-[10px] font-medium hover:bg-primary/90 transition-colors"
              >
                {t('prompt.addTag')}
              </button>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground mb-1">
              {t('prompt.systemPromptOptional')}
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder={t('prompt.systemPromptPlaceholder')}
              rows={2}
              className="w-full px-2 py-1.5 rounded-md bg-muted border-0 text-xs placeholder:text-muted-foreground focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* User Prompt */}
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground mb-1">
              {t('prompt.userPromptLabel')} *
            </label>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder={t('prompt.userPromptPlaceholder')}
              rows={4}
              className="w-full px-2 py-1.5 rounded-md bg-muted border-0 text-xs placeholder:text-muted-foreground focus:ring-1 focus:ring-primary resize-none"
            />
            <div className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground">
              <InfoIcon className="w-3 h-3" />
              <span>{t('prompt.variableTipContent')}</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="h-8 px-3 rounded-md text-xs font-medium hover:bg-muted transition-colors"
          >
            {t('prompt.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="h-8 px-4 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            {isEditing ? t('prompt.save') : t('prompt.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
