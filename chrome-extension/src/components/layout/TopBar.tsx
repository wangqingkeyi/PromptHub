import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { usePromptStore } from '../../stores/prompt.store';
import { EditPromptModal } from '../prompt/EditPromptModal';

export function TopBar() {
  const { t } = useTranslation();
  const searchQuery = usePromptStore((state) => state.searchQuery);
  const setSearchQuery = usePromptStore((state) => state.setSearchQuery);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  return (
    <header className="h-10 bg-card border-b border-border flex items-center px-3 gap-2">
      {/* Search */}
      <div className="flex-1 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('header.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-7 pl-7 pr-2 rounded-md bg-muted border-0 text-xs placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* New button */}
      <button
        onClick={() => setIsNewModalOpen(true)}
        className="h-7 px-3 rounded-md bg-primary text-white text-xs font-medium flex items-center gap-1 hover:bg-primary/90 transition-colors"
      >
        <PlusIcon className="w-3 h-3" />
        {t('header.new')}
      </button>

      {/* New Prompt Modal */}
      <EditPromptModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />
    </header>
  );
}
