import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutGridIcon, 
  StarIcon, 
  HashIcon, 
  SettingsIcon, 
  PlusIcon,
  MoreHorizontalIcon,
  SparklesIcon
} from 'lucide-react';
import { useFolderStore } from '../../stores/folder.store';
import { usePromptStore } from '../../stores/prompt.store';
import { FolderModal } from '../folder/FolderModal';
import type { Folder } from '../../types';

type PageType = 'home' | 'settings';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, count, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-200
        ${active
          ? 'bg-primary text-white shadow-md'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
        }
      `}
    >
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          active ? 'bg-white/20 text-white' : 'bg-sidebar-accent text-sidebar-foreground/60'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

interface FolderItemProps {
  folder: Folder;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

function FolderItem({ folder, isActive, onSelect, onEdit }: FolderItemProps) {
  return (
    <div className="group flex items-center">
      <button
        onClick={onSelect}
        className={`
          flex-1 flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium
          transition-all duration-200
          ${isActive
            ? 'bg-primary text-white shadow-md'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
          }
        `}
      >
        <span className="text-base">{folder.icon || '📁'}</span>
        <span className="flex-1 text-left truncate">{folder.name}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent transition-all"
      >
        <MoreHorizontalIcon className="w-4 h-4 text-sidebar-foreground/50" />
      </button>
    </div>
  );
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { t } = useTranslation();
  const folders = useFolderStore((state) => state.folders);
  const selectedFolderId = useFolderStore((state) => state.selectedFolderId);
  const selectFolder = useFolderStore((state) => state.selectFolder);
  const prompts = usePromptStore((state) => state.prompts);
  const filterTags = usePromptStore((state) => state.filterTags);
  const toggleFilterTag = usePromptStore((state) => state.toggleFilterTag);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const favoriteCount = prompts.filter((p) => p.isFavorite).length;
  const allTags = prompts.flatMap((p) => p.tags);
  const uniqueTags = [...new Set(allTags)];

  return (
    <aside className="w-52 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base text-sidebar-foreground">PromptHub</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Main navigation */}
        <div className="space-y-1">
          <NavItem
            icon={<LayoutGridIcon className="w-5 h-5" />}
            label={t('nav.allPrompts')}
            count={prompts.length}
            active={selectedFolderId === null && currentPage === 'home'}
            onClick={() => {
              selectFolder(null);
              if (currentPage !== 'home') onNavigate('home');
            }}
          />
          <NavItem
            icon={<StarIcon className="w-5 h-5" />}
            label={t('nav.favorites')}
            count={favoriteCount}
            active={selectedFolderId === 'favorites' && currentPage === 'home'}
            onClick={() => {
              selectFolder('favorites');
              if (currentPage !== 'home') onNavigate('home');
            }}
          />
        </div>

        {/* Folders */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              {t('nav.folders')}
            </span>
            <button 
              onClick={() => {
                setEditingFolder(null);
                setIsFolderModalOpen(true);
              }}
              className="p-1 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-primary transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-1">
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                isActive={selectedFolderId === folder.id && currentPage === 'home'}
                onSelect={() => {
                  selectFolder(folder.id);
                  if (currentPage !== 'home') onNavigate('home');
                }}
                onEdit={() => {
                  setEditingFolder(folder);
                  setIsFolderModalOpen(true);
                }}
              />
            ))}
            {folders.length === 0 && (
              <p className="px-3 py-3 text-xs text-sidebar-foreground/50 text-center">
                {t('folder.empty')}
              </p>
            )}
          </div>
        </div>

        {/* Tags */}
        {uniqueTags.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center px-3 mb-2">
              <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                {t('nav.tags')}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 px-3">
              {uniqueTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    toggleFilterTag(tag);
                    if (currentPage !== 'home') onNavigate('home');
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    filterTags.includes(tag) && currentPage === 'home'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-sidebar-accent text-sidebar-foreground/70 hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  <HashIcon className="w-3 h-3" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            currentPage === 'settings'
              ? 'bg-primary text-white shadow-md'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span>{t('header.settings')}</span>
        </button>
      </div>

      {/* Folder Modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        folder={editingFolder}
      />
    </aside>
  );
}
