import { useProjectStore, useConversationStore, useUIStore } from '../../store';
import { GraphCanvas } from './GraphCanvas';

export function GraphContainer() {
  const activeProject = useProjectStore((s) => s.getActiveProject());
  const updateProject = useProjectStore((s) => s.updateProject);
  const nodes = useConversationStore((s) => s.nodes);
  const { showArchived } = useUIStore();

  const handleNodeSelect = (nodeId: string) => {
    if (activeProject) {
      updateProject(activeProject.id, { activeNodeId: nodeId });
    }
  };

  if (!activeProject) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Project Selected
          </h2>
          <p className="text-gray-500">
            Create or select a project from the sidebar to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <GraphCanvas
      nodes={nodes}
      rootId={activeProject.rootNodeId}
      activeNodeId={activeProject.activeNodeId}
      showArchived={showArchived}
      onNodeSelect={handleNodeSelect}
    />
  );
}
