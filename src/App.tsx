import { useEffect } from 'react';
import { useUIStore } from './store';
import { AppLayout } from './components/layout';
import { ChatContainer } from './components/chat';
import { GraphContainer } from './components/graph';
import { CreateProjectModal } from './components/project';
import { SettingsModal } from './components/common';

function App() {
  const { viewMode, setViewMode } = useUIStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + 1 = Linear view
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        setViewMode('linear');
      }
      // Cmd/Ctrl + 2 = Graph view
      if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        setViewMode('graph');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setViewMode]);

  return (
    <AppLayout>
      {viewMode === 'linear' ? <ChatContainer /> : <GraphContainer />}

      {/* Modals */}
      <CreateProjectModal />
      <SettingsModal />
    </AppLayout>
  );
}

export default App;
