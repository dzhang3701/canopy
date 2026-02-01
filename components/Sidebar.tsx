
import React from 'react';
import { Project } from '../types';
import { Plus, Folder, Trash2, Layout } from 'lucide-react';

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
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layout className="w-5 h-5 text-blue-400" />
          <h1 className="font-bold text-lg tracking-tight">Arbor</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
          Projects
        </div>
        
        {projects.map(project => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
              activeProjectId === project.id 
                ? 'bg-blue-600/20 text-blue-300' 
                : 'hover:bg-slate-800 text-slate-400'
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
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onCreateProject}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg transition-colors font-medium border border-slate-700"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
