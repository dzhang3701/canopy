import { useUIStore } from '../../store';
import { cn } from '../../utils/cn';
import { ProjectList } from '../project/ProjectList';

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'h-full bg-gray-50 border-r border-gray-200 transition-all duration-300 flex flex-col',
        sidebarCollapsed ? 'w-12' : 'w-64'
      )}
    >
      {/* Sidebar Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-gray-200">
        {!sidebarCollapsed && (
          <span className="text-sm font-semibold text-gray-700">Projects</span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={cn(
              'w-4 h-4 text-gray-600 transition-transform',
              sidebarCollapsed && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Project List */}
      {!sidebarCollapsed && (
        <div className="flex-1 overflow-y-auto">
          <ProjectList />
        </div>
      )}
    </aside>
  );
}
