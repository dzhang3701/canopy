
import React from 'react';
import { Project } from '../types';
import { Plus, Trash2, TreePine } from 'lucide-react';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject
}) => {
  return (
    <div className="w-64 bg-white border-r border-green-200 flex flex-col h-full">
      <div className="p-4 border-b border-green-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TreePine className="w-5 h-5 text-green-600" />
          <h1 className="font-bold text-lg tracking-tight text-green-800">Canopy</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-xs font-semibold text-green-500 uppercase tracking-wider px-2 mb-2">
          Projects
        </div>

        {projects.map(project => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
              activeProjectId === project.id
                ? 'bg-green-100 text-green-700'
                : 'hover:bg-green-50 text-green-600'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-xl">{project.icon}</span>
              <span className="truncate font-medium">{project.name}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteProject(project.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-green-200">
        <button
          onClick={onCreateProject}
          className="w-full flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg transition-colors font-medium border border-green-200"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
