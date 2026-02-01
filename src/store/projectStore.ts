import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project } from '../types';
import { generateId } from '../utils/id';

interface ProjectState {
  projects: Map<string, Project>;
  activeProjectId: string | null;

  // Actions
  createProject: (name: string, systemPrompt?: string) => string;
  deleteProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  setActiveProject: (id: string | null) => void;
  getProject: (id: string) => Project | undefined;
  getActiveProject: () => Project | undefined;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: new Map(),
      activeProjectId: null,

      createProject: (name: string, systemPrompt = '') => {
        const id = generateId();
        const project: Project = {
          id,
          name,
          rootNodeId: null,
          activeNodeId: null,
          systemPrompt,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => {
          const newProjects = new Map(state.projects);
          newProjects.set(id, project);
          return { projects: newProjects, activeProjectId: id };
        });
        return id;
      },

      deleteProject: (id: string) => {
        set((state) => {
          const newProjects = new Map(state.projects);
          newProjects.delete(id);
          return {
            projects: newProjects,
            activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
          };
        });
      },

      updateProject: (id: string, updates: Partial<Project>) => {
        set((state) => {
          const project = state.projects.get(id);
          if (!project) return state;
          const newProjects = new Map(state.projects);
          newProjects.set(id, { ...project, ...updates, updatedAt: Date.now() });
          return { projects: newProjects };
        });
      },

      setActiveProject: (id: string | null) => {
        set({ activeProjectId: id });
      },

      getProject: (id: string) => {
        return get().projects.get(id);
      },

      getActiveProject: () => {
        const { projects, activeProjectId } = get();
        return activeProjectId ? projects.get(activeProjectId) : undefined;
      },
    }),
    {
      name: 'canopy-projects',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              projects: new Map(parsed.state.projects),
            },
          };
        },
        setItem: (name, value) => {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              projects: Array.from(value.state.projects.entries()),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
