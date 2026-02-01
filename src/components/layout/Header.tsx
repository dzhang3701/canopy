import { useUIStore, useProjectStore } from '../../store';
import { Button } from '../common';
import { cn } from '../../utils/cn';

export function Header() {
  const { viewMode, setViewMode, setSettingsModalOpen } = useUIStore();
  const activeProject = useProjectStore((s) => s.getActiveProject());

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">
          {activeProject?.name || 'Canopy'}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('linear')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              viewMode === 'linear'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Linear
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              viewMode === 'graph'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Graph
          </button>
        </div>

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSettingsModalOpen(true)}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Button>
      </div>
    </header>
  );
}
