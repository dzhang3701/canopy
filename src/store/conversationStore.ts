import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConversationNode, Message } from '../types';
import { generateId } from '../utils/id';
import { useProjectStore } from './projectStore';

interface ConversationState {
  nodes: Map<string, ConversationNode>;

  // Actions
  createNode: (
    projectId: string,
    userMessage: Message,
    parentId?: string | null
  ) => string;
  updateNode: (id: string, updates: Partial<ConversationNode>) => void;
  setAssistantMessage: (nodeId: string, message: Message) => void;
  deleteNode: (id: string) => void;
  archiveNode: (id: string) => void;
  unarchiveNode: (id: string) => void;
  toggleCollapse: (id: string) => void;
  getNode: (id: string) => ConversationNode | undefined;
  getProjectNodes: (projectId: string) => ConversationNode[];
  getRootNode: (projectId: string) => ConversationNode | undefined;
  getAncestors: (nodeId: string) => ConversationNode[];
  getDescendants: (nodeId: string) => ConversationNode[];
  getSiblings: (nodeId: string) => ConversationNode[];
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      nodes: new Map(),

      createNode: (
        projectId: string,
        userMessage: Message,
        parentId: string | null = null
      ) => {
        const id = generateId();
        const node: ConversationNode = {
          id,
          projectId,
          userMessage,
          assistantMessage: null,
          parentId,
          childIds: [],
          summary: userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : ''),
          isArchived: false,
          isCollapsed: false,
          createdAt: Date.now(),
        };

        set((state) => {
          const newNodes = new Map(state.nodes);
          newNodes.set(id, node);

          // Update parent's childIds
          if (parentId) {
            const parent = newNodes.get(parentId);
            if (parent) {
              newNodes.set(parentId, {
                ...parent,
                childIds: [...parent.childIds, id],
              });
            }
          }

          return { nodes: newNodes };
        });

        // Update project's rootNodeId if this is the first node
        const projectStore = useProjectStore.getState();
        const project = projectStore.getProject(projectId);
        if (project && !project.rootNodeId && !parentId) {
          projectStore.updateProject(projectId, { rootNodeId: id, activeNodeId: id });
        } else if (project) {
          projectStore.updateProject(projectId, { activeNodeId: id });
        }

        return id;
      },

      updateNode: (id: string, updates: Partial<ConversationNode>) => {
        set((state) => {
          const node = state.nodes.get(id);
          if (!node) return state;
          const newNodes = new Map(state.nodes);
          newNodes.set(id, { ...node, ...updates });
          return { nodes: newNodes };
        });
      },

      setAssistantMessage: (nodeId: string, message: Message) => {
        set((state) => {
          const node = state.nodes.get(nodeId);
          if (!node) return state;
          const newNodes = new Map(state.nodes);
          newNodes.set(nodeId, { ...node, assistantMessage: message });
          return { nodes: newNodes };
        });
      },

      deleteNode: (id: string) => {
        const state = get();
        const node = state.nodes.get(id);
        if (!node) return;

        // Get all descendants to delete
        const toDelete = new Set<string>([id]);
        const queue = [...node.childIds];
        while (queue.length > 0) {
          const childId = queue.shift()!;
          toDelete.add(childId);
          const child = state.nodes.get(childId);
          if (child) {
            queue.push(...child.childIds);
          }
        }

        set((state) => {
          const newNodes = new Map(state.nodes);

          // Remove from parent's childIds
          if (node.parentId) {
            const parent = newNodes.get(node.parentId);
            if (parent) {
              newNodes.set(node.parentId, {
                ...parent,
                childIds: parent.childIds.filter((cid) => cid !== id),
              });
            }
          }

          // Delete all descendants
          toDelete.forEach((nodeId) => newNodes.delete(nodeId));

          return { nodes: newNodes };
        });
      },

      archiveNode: (id: string) => {
        const state = get();
        const node = state.nodes.get(id);
        if (!node) return;

        // Archive node and all descendants
        const toArchive = new Set<string>([id]);
        const queue = [...node.childIds];
        while (queue.length > 0) {
          const childId = queue.shift()!;
          toArchive.add(childId);
          const child = state.nodes.get(childId);
          if (child) {
            queue.push(...child.childIds);
          }
        }

        set((state) => {
          const newNodes = new Map(state.nodes);
          toArchive.forEach((nodeId) => {
            const n = newNodes.get(nodeId);
            if (n) {
              newNodes.set(nodeId, { ...n, isArchived: true });
            }
          });
          return { nodes: newNodes };
        });
      },

      unarchiveNode: (id: string) => {
        get().updateNode(id, { isArchived: false });
      },

      toggleCollapse: (id: string) => {
        const node = get().nodes.get(id);
        if (node) {
          get().updateNode(id, { isCollapsed: !node.isCollapsed });
        }
      },

      getNode: (id: string) => {
        return get().nodes.get(id);
      },

      getProjectNodes: (projectId: string) => {
        const nodes = get().nodes;
        return Array.from(nodes.values()).filter((n) => n.projectId === projectId);
      },

      getRootNode: (projectId: string) => {
        const projectStore = useProjectStore.getState();
        const project = projectStore.getProject(projectId);
        if (!project?.rootNodeId) return undefined;
        return get().nodes.get(project.rootNodeId);
      },

      getAncestors: (nodeId: string) => {
        const nodes = get().nodes;
        const ancestors: ConversationNode[] = [];
        let current = nodes.get(nodeId);

        while (current?.parentId) {
          const parent = nodes.get(current.parentId);
          if (parent) {
            ancestors.unshift(parent);
            current = parent;
          } else {
            break;
          }
        }

        return ancestors;
      },

      getDescendants: (nodeId: string) => {
        const nodes = get().nodes;
        const descendants: ConversationNode[] = [];
        const node = nodes.get(nodeId);
        if (!node) return descendants;

        const queue = [...node.childIds];
        while (queue.length > 0) {
          const childId = queue.shift()!;
          const child = nodes.get(childId);
          if (child) {
            descendants.push(child);
            queue.push(...child.childIds);
          }
        }

        return descendants;
      },

      getSiblings: (nodeId: string) => {
        const nodes = get().nodes;
        const node = nodes.get(nodeId);
        if (!node?.parentId) return [];

        const parent = nodes.get(node.parentId);
        if (!parent) return [];

        return parent.childIds
          .filter((id) => id !== nodeId)
          .map((id) => nodes.get(id))
          .filter((n): n is ConversationNode => n !== undefined);
      },
    }),
    {
      name: 'canopy-conversations',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              nodes: new Map(parsed.state.nodes),
            },
          };
        },
        setItem: (name, value) => {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              nodes: Array.from(value.state.nodes.entries()),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
