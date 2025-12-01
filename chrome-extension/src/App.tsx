import { useEffect, useState } from 'react';
import { Sidebar, TopBar, MainContent } from './components/layout';
import { SettingsPage } from './components/settings';
import { usePromptStore } from './stores/prompt.store';
import { useFolderStore } from './stores/folder.store';
import { useSettingsStore } from './stores/settings.store';
import { initDatabase, seedDatabase } from './services/database';
import { ToastProvider } from './components/ui/Toast';
import i18n from './i18n';

// Page types
type PageType = 'home' | 'settings';

function AppContent() {
  const fetchPrompts = usePromptStore((state) => state.fetchPrompts);
  const fetchFolders = useFolderStore((state) => state.fetchFolders);
  const applyTheme = useSettingsStore((state) => state.applyTheme);
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Apply saved theme settings
    applyTheme();
    
    // Sync language settings
    const currentLang = i18n.language === 'en' ? 'en' : 'zh';
    const storedLang = useSettingsStore.getState().language;
    if (storedLang !== currentLang) {
      useSettingsStore.getState().setLanguage(currentLang as 'zh' | 'en');
    }
    
    // Initialize database and load data
    const init = async () => {
      try {
        await initDatabase();
        await seedDatabase();
        await fetchPrompts();
        await fetchFolders();
        console.log('✅ App initialized');
      } catch (error) {
        console.error('❌ Init failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar - only show on home page */}
        {currentPage === 'home' && <TopBar />}
        
        {/* Page content */}
        {currentPage === 'home' ? (
          <MainContent />
        ) : (
          <SettingsPage onBack={() => setCurrentPage('home')} />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
