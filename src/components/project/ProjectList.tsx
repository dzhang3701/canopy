import { useProjectStore, useUIStore } from '../../store';
import { ProjectItem } from './ProjectItem';
import { Button } from '../common';

export function ProjectList() {
  const { projects, activeProjectId } = useProjectStore();
  const { setCreateProjectModalOpen } = useUIStore();

  const projectList = Array.from(projects.values()).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  return (
    <div className="py-2">
      <div className="px-3 mb-2">
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={() => setCreateProjectModalOpen(true)}
        >
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Project
        </Button>
      </div>

      {projectList.length === 0 ? (
        <p className="px-3 py-4 text-sm text-gray-500 text-center">
          No projects yet. Create one to get started.
        </p>
      ) : (
        <div className="space-y-0.5">
          {projectList.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              isActive={project.id === activeProjectId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
