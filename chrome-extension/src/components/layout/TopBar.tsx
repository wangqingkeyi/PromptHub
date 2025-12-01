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
    <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-3">
      {/* Search */}
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('header.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-10 pr-4 rounded-xl bg-muted border-0 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      {/* New button */}
      <button
        onClick={() => setIsNewModalOpen(true)}
        className="h-9 px-4 rounded-xl bg-primary text-white text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95"
      >
        <PlusIcon className="w-4 h-4" />
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
