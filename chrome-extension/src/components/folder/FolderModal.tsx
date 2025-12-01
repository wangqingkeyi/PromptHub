import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon, TrashIcon } from 'lucide-react';
import { useFolderStore } from '../../stores/folder.store';
import { useToast } from '../ui/Toast';
import type { Folder } from '../../types';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder?: Folder | null;
}

const EMOJI_OPTIONS = ['📁', '💼', '📚', '💡', '🔧', '📝', '🎨', '🚀', '⭐', '❤️', '🔥', '💎'];

export function FolderModal({ isOpen, onClose, folder }: FolderModalProps) {
  const { t } = useTranslation();
  const createFolder = useFolderStore((state) => state.createFolder);
  const updateFolder = useFolderStore((state) => state.updateFolder);
  const deleteFolder = useFolderStore((state) => state.deleteFolder);
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');

  const isEditing = !!folder;

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setIcon(folder.icon || '📁');
    } else {
      setName('');
      setIcon('📁');
    }
  }, [folder, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast(t('settings.fillComplete'), 'error');
      return;
    }

    try {
      if (isEditing) {
        await updateFolder(folder.id, { name: name.trim(), icon });
        showToast(t('toast.saved'), 'success');
      } else {
        await createFolder({ name: name.trim(), icon });
        showToast(t('toast.saved'), 'success');
      }
      onClose();
    } catch (error) {
      showToast(t('common.error'), 'error');
    }
  };

  const handleDelete = async () => {
    if (folder && confirm(t('settings.confirmDelete'))) {
      await deleteFolder(folder.id);
      showToast(t('toast.deleted'), 'success');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-xs mx-4 bg-card rounded-xl shadow-lg animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            {isEditing ? t('folder.edit') : t('folder.new')}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <XIcon className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Icon */}
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground mb-1">
              {t('folder.icon')}
            </label>
            <div className="flex flex-wrap gap-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`
                    w-8 h-8 rounded-md flex items-center justify-center text-base
                    transition-colors
                    ${icon === emoji
                      ? 'bg-primary text-white'
                      : 'bg-muted hover:bg-accent'
                    }
                  `}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground mb-1">
              {t('folder.name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('folder.name')}
              className="w-full h-8 px-2 rounded-md bg-muted border-0 text-xs placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div>
            {isEditing && (
              <button
                onClick={handleDelete}
                className="h-7 px-2 rounded-md text-destructive text-[11px] font-medium flex items-center gap-1 hover:bg-destructive/10 transition-colors"
              >
                <TrashIcon className="w-3 h-3" />
                {t('folder.delete')}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-7 px-3 rounded-md text-[11px] font-medium hover:bg-muted transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="h-7 px-3 rounded-md bg-primary text-white text-[11px] font-medium hover:bg-primary/90 transition-colors"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
