import type { ConversationNode } from '../../types';
import { useConversationStore, useProjectStore } from '../../store';
import { cn } from '../../utils/cn';

interface BranchIndicatorProps {
  node: ConversationNode;
}

export function BranchIndicator({ node }: BranchIndicatorProps) {
  const siblings = useConversationStore((s) => s.getSiblings(node.id));
  const updateProject = useProjectStore((s) => s.updateProject);
  const activeProject = useProjectStore((s) => s.getActiveProject());

  if (siblings.length === 0) return null;

  const allSiblings = [node, ...siblings].sort(
    (a, b) => a.createdAt - b.createdAt
  );
  const currentIndex = allSiblings.findIndex((s) => s.id === node.id);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!activeProject) return;

    const newIndex =
      direction === 'prev'
        ? Math.max(0, currentIndex - 1)
        : Math.min(allSiblings.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) {
      updateProject(activeProject.id, { activeNodeId: allSiblings[newIndex].id });
    }
  };

  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <button
        onClick={() => handleNavigate('prev')}
        disabled={currentIndex === 0}
        className={cn(
          'p-1 rounded hover:bg-gray-200 transition-colors',
          currentIndex === 0 && 'opacity-30 cursor-not-allowed'
        )}
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <span className="tabular-nums">
        {currentIndex + 1}/{allSiblings.length}
      </span>
      <button
        onClick={() => handleNavigate('next')}
        disabled={currentIndex === allSiblings.length - 1}
        className={cn(
          'p-1 rounded hover:bg-gray-200 transition-colors',
          currentIndex === allSiblings.length - 1 && 'opacity-30 cursor-not-allowed'
        )}
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
