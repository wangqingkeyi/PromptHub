import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutGridIcon, 
  StarIcon, 
  HashIcon, 
  SettingsIcon, 
  PlusIcon,
  MoreHorizontalIcon
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
        w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs
        transition-all duration-150
        ${active
          ? 'bg-sidebar-accent text-sidebar-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
        }
      `}
    >
      <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
      <span className="flex-1 text-left truncate">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] px-1 py-0.5 rounded bg-sidebar-accent text-sidebar-foreground/60">
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
          flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-xs
          transition-all duration-150
          ${isActive
            ? 'bg-sidebar-accent text-sidebar-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          }
        `}
      >
        <span className="text-sm">{folder.icon || '📁'}</span>
        <span className="flex-1 text-left truncate">{folder.name}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent transition-all"
      >
        <MoreHorizontalIcon className="w-3 h-3 text-sidebar-foreground/50" />
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
    <aside className="w-36 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {/* Main navigation */}
        <div className="space-y-0.5">
          <NavItem
            icon={<LayoutGridIcon className="w-4 h-4" />}
            label={t('nav.allPrompts')}
            count={prompts.length}
            active={selectedFolderId === null && currentPage === 'home'}
            onClick={() => {
              selectFolder(null);
              if (currentPage !== 'home') onNavigate('home');
            }}
          />
          <NavItem
            icon={<StarIcon className="w-4 h-4" />}
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
        <div className="pt-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              {t('nav.folders')}
            </span>
            <button 
              onClick={() => {
                setEditingFolder(null);
                setIsFolderModalOpen(true);
              }}
              className="p-0.5 rounded hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-primary transition-colors"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-0.5">
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
              <p className="px-2 py-2 text-[10px] text-sidebar-foreground/50 text-center">
                {t('folder.empty')}
              </p>
            )}
          </div>
        </div>

        {/* Tags */}
        {uniqueTags.length > 0 && (
          <div className="pt-3">
            <div className="flex items-center px-2 mb-1">
              <span className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                {t('nav.tags')}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 px-2">
              {uniqueTags.slice(0, 6).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    toggleFilterTag(tag);
                    if (currentPage !== 'home') onNavigate('home');
                  }}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors duration-200 ${
                    filterTags.includes(tag) && currentPage === 'home'
                      ? 'bg-primary text-white'
                      : 'bg-sidebar-accent text-sidebar-foreground/70 hover:bg-primary hover:text-white'
                  }`}
                >
                  <HashIcon className="w-2 h-2" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
            currentPage === 'settings'
              ? 'bg-sidebar-accent text-sidebar-foreground'
              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          }`}
        >
          <SettingsIcon className="w-3 h-3" />
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
