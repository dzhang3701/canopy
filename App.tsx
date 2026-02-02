
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';
import { ChatNode, Project } from './types';
import ChatView from './components/ChatView';
import GraphView from './components/GraphView';
import NodeActionModal, { ActionType } from './components/NodeActionModal';
import { generateChatResponse, streamChatResponse } from './services/geminiService';
import {
  getAncestorPath,
  deleteNodeOnly,
  deleteNodeWithChildren,
  archiveNodeOnly,
  archiveNodeWithChildren,
  unarchiveNodeWithChildren,
  archiveChildrenOnly,
  deleteChildrenOnly
} from './utils/treeUtils';
import { Send, Loader2, Sparkles, Moon, Sun, TreePalm } from 'lucide-react';

// Feature imports - organized by feature module
import {
  ApiUsageStats,
  DEFAULT_API_STATS,
  ApiStatsPanel,
  updateApiStats,
  resetApiStats,
} from './features/api-stats';

const STARTER_PROJECTS: Project[] = [
  { id: 'p1', name: 'Exploration', createdAt: Date.now() },
  { id: 'p2', name: 'Problem Solving', createdAt: Date.now() },
  { id: 'p3', name: 'Class Notes', createdAt: Date.now() },
];

// Modal state interface
interface NodeActionModalState {
  isOpen: boolean;
  actionType: ActionType;
  nodeId: string;
  nodeSummary: string;
  isRootNode: boolean;
  hasChildren: boolean;
}

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('canopy_projects');
    return saved ? JSON.parse(saved) : STARTER_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem('canopy_active_project') || (STARTER_PROJECTS[0]?.id || null);
  });

  const [nodes, setNodes] = useState<ChatNode[]>(() => {
    const saved = localStorage.getItem('canopy_nodes');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeNodeId, setActiveNodeId] = useState<string | null>(() => {
    return localStorage.getItem('canopy_active_node') || null;
  });

  const [contextNodeIds, setContextNodeIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('canopy_context_nodes');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  // API stats state (from api-stats feature)
  const [apiStats, setApiStats] = useState<ApiUsageStats>(() => {
    const saved = localStorage.getItem('canopy_api_stats');
    return saved ? JSON.parse(saved) : DEFAULT_API_STATS;
  });

  // Node action modal state
  const [modalState, setModalState] = useState<NodeActionModalState>({
    isOpen: false,
    actionType: 'delete',
    nodeId: '',
    nodeSummary: '',
    isRootNode: false,
    hasChildren: false,
  });

  // Archive view toggle state
  const [showArchived, setShowArchived] = useState(false);

  // UI State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('canopy_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('canopy_sidebar_expanded');
    return saved ? JSON.parse(saved) : false;
  });

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('canopy_dark_mode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('canopy_sidebar_expanded', JSON.stringify(sidebarExpanded));
  }, [sidebarExpanded]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('canopy_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('canopy_nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem('canopy_active_project', activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    if (activeNodeId) localStorage.setItem('canopy_active_node', activeNodeId);
  }, [activeNodeId]);

  useEffect(() => {
    localStorage.setItem('canopy_context_nodes', JSON.stringify([...contextNodeIds]));
  }, [contextNodeIds]);

  // Persist API stats (from api-stats feature)
  useEffect(() => {
    localStorage.setItem('canopy_api_stats', JSON.stringify(apiStats));
  }, [apiStats]);

  const activePath = useMemo(() => {
    if (!activeNodeId) return [];
    return getAncestorPath(nodes, activeNodeId);
  }, [nodes, activeNodeId]);

  const contextPath = useMemo(() => {
    if (contextNodeIds.size === 0) return activePath;

    const allContextNodes = new Set<string>();
    contextNodeIds.forEach(nodeId => {
      const ancestors = getAncestorPath(nodes, nodeId);
      ancestors.forEach(node => allContextNodes.add(node.id));
    });

    return nodes.filter(n => allContextNodes.has(n.id))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [nodes, contextNodeIds, activePath]);

  const handleToggleContext = useCallback((nodeId: string) => {
    setContextNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !activeProjectId || isLoading) return;

    const promptText = input;
    const newNodeId = uuidv4();
    setInput('');
    setIsLoading(true);
    setStreamingResponse('');

    // Create node immediately with "Generating..." summary
    const newNode: ChatNode = {
      id: newNodeId,
      parentId: activeNodeId,
      projectId: activeProjectId,
      summary: 'Generating...',
      userPrompt: promptText,
      assistantResponse: '',
      timestamp: Date.now(),
      isArchived: false,
      isCollapsed: false
    };

    setNodes(prev => [...prev, newNode]);
    setActiveNodeId(newNode.id);

    try {
      const history = contextPath.length > 0 ? contextPath : activePath;

      // Stream the response (first API call)
      let fullResponse = '';
      const streamUsage = await streamChatResponse(history, promptText, (chunk) => {
        fullResponse += chunk;
        setStreamingResponse(fullResponse);
      });

      // Update API stats for streaming call (from api-stats feature)
      if (streamUsage) {
        setApiStats(prev => updateApiStats(prev, streamUsage));
      }

      // Generate summary after streaming completes (second API call)
      const { summary, usage: summaryUsage } = await generateChatResponse(history, promptText, true);

      // Update API stats for summary call (from api-stats feature)
      if (summaryUsage) {
        setApiStats(prev => updateApiStats(prev, summaryUsage));
      }

      // Update the node with the full response and the real summary
      setNodes(prev => prev.map(n =>
        n.id === newNodeId
          ? { ...n, assistantResponse: fullResponse, summary: summary }
          : n
      ));

      setStreamingResponse('');
      setFocusNodeId(newNodeId);
      // Clear focus after animation completes
      setTimeout(() => setFocusNodeId(null), 600);
    } catch (error) {
      console.error("Failed to generate response:", error);
      setNodes(prev => prev.filter(n => n.id !== newNodeId));
      setActiveNodeId(activeNodeId);
      alert("Error generating response. Please check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = () => {
    const name = prompt("Project name?");
    if (name) {
      const newProject: Project = {
        id: uuidv4(),
        name,
        createdAt: Date.now()
      };
      setProjects(prev => [...prev, newProject]);
      setActiveProjectId(newProject.id);
      setActiveNodeId(null);
      setContextNodeIds(new Set());
    }
  };

  const handleDeleteProject = (id: string) => {
    if (confirm("Delete project and all its nodes?")) {
      const updatedProjects = projects.filter(p => p.id !== id);
      const updatedNodes = nodes.filter(n => n.projectId !== id);
      setProjects(updatedProjects);
      setNodes(updatedNodes);
      if (activeProjectId === id) {
        const nextProject = updatedProjects[0]?.id || null;
        setActiveProjectId(nextProject);
        setActiveNodeId(null);
        setContextNodeIds(new Set());
      }
    }
  };

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    const projectNodes = nodes.filter(n => n.projectId === id && !n.isArchived);
    if (projectNodes.length > 0) {
      const latest = [...projectNodes].sort((a, b) => b.timestamp - a.timestamp)[0];
      setActiveNodeId(latest.id);
    } else {
      setActiveNodeId(null);
    }
    setContextNodeIds(new Set());
  };

  const handleRenameProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    const newName = prompt("Rename project:", project.name);
    if (newName && newName.trim()) {
      setProjects(prev => prev.map(p =>
        p.id === id ? { ...p, name: newName.trim() } : p
      ));
    }
  };

  const handleRenameNode = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    const newSummary = prompt("Rename node:", node.summary);
    if (newSummary && newSummary.trim()) {
      setNodes(prev => prev.map(n =>
        n.id === id ? { ...n, summary: newSummary.trim() } : n
      ));
    }
  };

  const handleBranch = (parentId: string) => {
    setActiveNodeId(parentId);
  };

  const handleNodeClick = (id: string) => {
    setActiveNodeId(id);
  };

  const handleArchiveNode = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    const children = nodes.filter(n => n.parentId === id && !n.isArchived);
    setModalState({
      isOpen: true,
      actionType: 'archive',
      nodeId: id,
      isRootNode: node.parentId === null,
      hasChildren: children.length > 0,
      nodeSummary: node.summary,
    });
  };

  const handleDeleteNode = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    const children = nodes.filter(n => n.parentId === id && !n.isArchived);
    setModalState({
      isOpen: true,
      actionType: 'delete',
      nodeId: id,
      isRootNode: node.parentId === null,
      hasChildren: children.length > 0,
      nodeSummary: node.summary,
    });
  };

  const handleUnarchiveNode = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    setModalState({
      isOpen: true,
      actionType: 'unarchive',
      nodeId: id,
      isRootNode: node.parentId === null,
      hasChildren: false,
      nodeSummary: node.summary,
    });
  };

  const handleModalCancel = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleModalConfirm = (includeChildren: boolean, deleteAll?: boolean) => {
    const { actionType, nodeId } = modalState;

    if (actionType === 'unarchive') {
      const updatedNodes = unarchiveNodeWithChildren(nodes, nodeId);
      setNodes(updatedNodes);
      setShowArchived(false);
      setActiveNodeId(nodeId);
      setFocusNodeId(nodeId);
    } else if (actionType === 'delete') {
      if (deleteAll && modalState.isRootNode) {
        const updatedNodes = nodes.filter(n => n.projectId !== activeProjectId);
        setNodes(updatedNodes);
        setActiveNodeId(null);
        setContextNodeIds(new Set());
      } else if (modalState.isRootNode && !deleteAll) {
        const result = deleteChildrenOnly(nodes, nodeId, activeNodeId);
        setNodes(result.updatedNodes);
        setActiveNodeId(result.newActiveNodeId);
      } else if (includeChildren) {
        const result = deleteNodeWithChildren(nodes, nodeId, activeNodeId);
        setNodes(result.updatedNodes);
        setActiveNodeId(result.newActiveNodeId);
      } else {
        const result = deleteNodeOnly(nodes, nodeId, activeNodeId);
        setNodes(result.updatedNodes);
        setActiveNodeId(result.newActiveNodeId);
      }
    } else if (actionType === 'archive') {
      if (deleteAll && modalState.isRootNode) {
        const updatedNodes = nodes.map(n => n.projectId === activeProjectId ? { ...n, isArchived: true } : n);
        setNodes(updatedNodes);
        setActiveNodeId(null);
        setContextNodeIds(new Set());
      } else if (modalState.isRootNode && !deleteAll) {
        const result = archiveChildrenOnly(nodes, nodeId, activeNodeId);
        setNodes(result.updatedNodes);
        setActiveNodeId(result.newActiveNodeId);
      } else if (includeChildren) {
        const result = archiveNodeWithChildren(nodes, nodeId, activeNodeId);
        setNodes(result.updatedNodes);
        setActiveNodeId(result.newActiveNodeId);
      } else {
        const result = archiveNodeOnly(nodes, nodeId, activeNodeId);
        setNodes(result.updatedNodes);
        setActiveNodeId(result.newActiveNodeId);
      }
    }

    setContextNodeIds(prev => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });

    handleModalCancel();
  };

  const handleResetStats = () => {
    setApiStats(resetApiStats());
  };

  const sidebarRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    const panels = sidebarRef.current;
    if (panels) {
      const targetSize = sidebarExpanded ? 50 : 25;
      requestAnimationFrame(() => {
        panels.resize(targetSize);
      });
    }
  }, [sidebarExpanded]);

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${isDarkMode ? 'dark bg-dark-950 text-dark-100' : 'bg-zinc-100/20 text-dark-800'}`}>
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar Panel */}
        <Panel
          id="sidebar-panel"
          ref={sidebarRef}
          defaultSize={sidebarExpanded ? 50 : 25}
          minSize={20}
          className="transition-all duration-300 ease-in-out"
        >
          <GraphView
            nodes={nodes}
            projects={projects}
            activeProjectId={activeProjectId || ''}
            activeNodeId={activeNodeId}
            contextNodeIds={contextNodeIds}
            activePathIds={new Set(activePath.map(n => n.id))}
            focusNodeId={focusNodeId}
            isDarkMode={isDarkMode}
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={() => setSidebarExpanded(!sidebarExpanded)}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            showArchived={showArchived}
            onToggleShowArchived={() => setShowArchived(!showArchived)}
            onNodeClick={handleNodeClick}
            onToggleContext={handleToggleContext}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            onRenameProject={handleRenameProject}
            onRenameNode={handleRenameNode}
            onArchiveNode={handleArchiveNode}
            onDeleteNode={handleDeleteNode}
            onUnarchiveNode={handleUnarchiveNode}
          />
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className={`w-1 flex items-center justify-center group transition-colors ${isDarkMode ? 'bg-dark-900 hover:bg-canopy-900/50' : 'bg-dark-100 hover:bg-canopy-200'
          }`}>
          <div className={`w-0.5 h-8 rounded-full transition-colors ${isDarkMode ? 'bg-dark-700 group-hover:bg-canopy-500' : 'bg-dark-300 group-hover:bg-canopy-500'
            }`} />
        </PanelResizeHandle>

        {/* Chat Panel */}
        <Panel
          id="chat-panel"
          defaultSize={sidebarExpanded ? 50 : 75}
          minSize={20}
          className="transition-all duration-300 ease-in-out"
        >
          <div className="h-full flex flex-col">
            <ChatView
              activePath={activePath}
              allNodes={nodes}
              contextNodeIds={contextNodeIds}
              onNodeClick={handleNodeClick}
              onBranch={handleBranch}
              onToggleContext={handleToggleContext}
              streamingResponse={streamingResponse}
              isLoading={isLoading}
              isDarkMode={isDarkMode}
            />

            {/* Input Area */}
            <div className={`p-4 sm:p-6 ${isDarkMode ? 'bg-dark-950' : 'bg-canopy-50/30'}`}>
              <div className={`max-w-4xl mx-auto flex flex-col gap-2`}>
                <div className={`flex items-center gap-2 text-[11px] px-1 font-medium tracking-wide uppercase ${isDarkMode ? 'text-dark-400' : 'text-dark-400'}`}>
                  <Sparkles className="w-3 h-3 text-canopy-500" />
                  <span>{activePath.length} NODES ACTIVE</span>
                  {contextNodeIds.size > 0 && (
                    <span className="text-canopy-500">• {contextNodeIds.size} ADDITIONAL IN CONTEXT</span>
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className={`relative group rounded-2xl transition-all duration-300 ${isDarkMode
                    ? 'bg-dark-900 ring-1 ring-dark-700 focus-within:ring-canopy-500/50 focus-within:shadow-glass-dark'
                    : 'bg-white shadow-lg shadow-black/5 ring-1 ring-dark-100 focus-within:ring-canopy-400 focus-within:shadow-glass'
                    }`}
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={activeProjectId ? "Ask anything..." : "Select a project to start..."}
                    disabled={!activeProjectId || isLoading}
                    className={`w-full bg-transparent border-none py-3.5 pl-5 pr-14 text-base focus:outline-none focus:ring-0 disabled:opacity-50 ${isDarkMode
                      ? 'text-dark-100 placeholder:text-dark-500'
                      : 'text-dark-900 placeholder:text-dark-400'
                      }`}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading || !activeProjectId}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-200 ${!input.trim() || isLoading || !activeProjectId
                      ? isDarkMode ? 'bg-dark-800 text-dark-600' : 'bg-dark-100 text-dark-300'
                      : 'bg-canopy-600 text-white hover:bg-canopy-500 shadow-md hover:shadow-lg scale-100 hover:scale-105 active:scale-95'
                      }`}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>

                <div className={`text-[10px] text-center ${isDarkMode ? 'text-dark-600' : 'text-dark-300'}`}>
                  AI can make mistakes. Please verify important information.
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>

      {/* API Stats Overlay */}
      <ApiStatsPanel stats={apiStats} onReset={handleResetStats} />

      {/* Modal Overlay */}
      <NodeActionModal
        isOpen={modalState.isOpen}
        actionType={modalState.actionType}
        isRootNode={modalState.isRootNode}
        hasChildren={modalState.hasChildren}
        nodeSummary={modalState.nodeSummary}
        isDarkMode={isDarkMode}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
};

export default App;
