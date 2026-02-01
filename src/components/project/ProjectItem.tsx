import type { Project } from '../../types';
import { useProjectStore, useConversationStore } from '../../store';
import { cn } from '../../utils/cn';

interface ProjectItemProps {
  project: Project;
  isActive: boolean;
}

export function ProjectItem({ project, isActive }: ProjectItemProps) {
  const { setActiveProject, deleteProject } = useProjectStore();
  const nodeCount = useConversationStore(
    (s) => s.getProjectNodes(project.id).length
  );

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      deleteProject(project.id);
    }
  };

  return (
    <div
      onClick={() => setActiveProject(project.id)}
      className={cn(
        'group px-3 py-2 cursor-pointer transition-colors border-l-2',
        isActive
          ? 'bg-blue-50 border-blue-500'
          : 'border-transparent hover:bg-gray-100'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium truncate',
              isActive ? 'text-blue-900' : 'text-gray-900'
            )}
          >
            {project.name}
          </p>
          <p className="text-xs text-gray-500">
            {nodeCount} {nodeCount === 1 ? 'message' : 'messages'}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
          title="Delete project"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
