
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { ChatNode, Project } from './types';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import GraphView from './components/GraphView';
import { generateChatResponse } from './services/geminiService';
import { getAncestorPath } from './utils/treeUtils';
import { Send, Loader2, Sparkles, GripVertical } from 'lucide-react';

const STARTER_PROJECTS: Project[] = [
  { id: 'p1', name: 'Exploration', icon: '🚀', createdAt: Date.now() },
  { id: 'p2', name: 'Problem Solving', icon: '🧩', createdAt: Date.now() },
  { id: 'p3', name: 'Class Notes', icon: '📝', createdAt: Date.now() },
];

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

  const activePath = useMemo(() => {
    if (!activeNodeId) return [];
    return getAncestorPath(nodes, activeNodeId);
  }, [nodes, activeNodeId]);

  // Context path includes all ancestors of context nodes
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
    setInput('');
    setIsLoading(true);

    try {
      const history = contextPath.length > 0 ? contextPath : activePath;
      const { response, summary } = await generateChatResponse(history, promptText);

      const newNode: ChatNode = {
        id: uuidv4(),
        parentId: activeNodeId,
        projectId: activeProjectId,
        summary: summary,
        userPrompt: promptText,
        assistantResponse: response,
        timestamp: Date.now(),
        isArchived: false,
        isCollapsed: false
      };

      setNodes(prev => [...prev, newNode]);
      setActiveNodeId(newNode.id);
    } catch (error) {
      console.error("Failed to generate response:", error);
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
        icon: '📁',
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
      setProjects(prev => prev.filter(p => p.id !== id));
      setNodes(prev => prev.filter(n => n.projectId !== id));
      if (activeProjectId === id) {
        setActiveProjectId(projects.find(p => p.id !== id)?.id || null);
        setActiveNodeId(null);
        setContextNodeIds(new Set());
      }
    }
  };

  const handleBranch = (parentId: string) => {
    setActiveNodeId(parentId);
  };

  const handleNodeClick = (id: string) => {
    setActiveNodeId(id);
  };

  return (
    <div className="flex h-screen w-full bg-green-50 overflow-hidden font-sans">
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          const projectNodes = nodes.filter(n => n.projectId === id);
          if (projectNodes.length > 0) {
            const latest = [...projectNodes].sort((a, b) => b.timestamp - a.timestamp)[0];
            setActiveNodeId(latest.id);
          } else {
            setActiveNodeId(null);
          }
          setContextNodeIds(new Set());
        }}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-14 border-b border-green-200 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <span className="text-xl">{projects.find(p => p.id === activeProjectId)?.icon || '📁'}</span>
            <h2 className="font-bold text-green-800">
              {projects.find(p => p.id === activeProjectId)?.name || 'Select Project'}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-green-600 font-mono">
            <Sparkles className="w-3 h-3 text-green-500" />
            {contextNodeIds.size > 0
              ? `${contextNodeIds.size} nodes in context`
              : `${activePath.length} turns active`
            }
          </div>
        </header>

        {/* Main Content - Resizable Panels */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <PanelGroup direction="horizontal" className="flex-1">
            {/* Graph Panel */}
            <Panel defaultSize={50} minSize={30}>
              <GraphView
                nodes={nodes}
                activeProjectId={activeProjectId || ''}
                activeNodeId={activeNodeId}
                contextNodeIds={contextNodeIds}
                onNodeClick={handleNodeClick}
                onToggleContext={handleToggleContext}
              />
            </Panel>

            {/* Resize Handle */}
            <PanelResizeHandle className="w-2 bg-green-100 hover:bg-green-200 transition-colors flex items-center justify-center group">
              <GripVertical className="w-3 h-3 text-green-400 group-hover:text-green-600" />
            </PanelResizeHandle>

            {/* Chat Panel */}
            <Panel defaultSize={50} minSize={30}>
              <ChatView
                activePath={activePath}
                allNodes={nodes}
                contextNodeIds={contextNodeIds}
                onNodeClick={handleNodeClick}
                onBranch={handleBranch}
                onToggleContext={handleToggleContext}
              />
            </Panel>
          </PanelGroup>
        </main>

        {/* Input Area (Sticky) */}
        <div className="p-4 bg-white border-t border-green-200">
          <form
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative group"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeProjectId ? "Type a message or click 'Branch' on a previous message..." : "Select a project to start..."}
              disabled={!activeProjectId || isLoading}
              className="w-full bg-green-50 border border-green-300 rounded-xl py-4 pl-6 pr-14 text-green-800 placeholder:text-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !activeProjectId}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors disabled:opacity-50 disabled:hover:bg-green-600"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
          <div className="max-w-4xl mx-auto mt-2 flex justify-center">
            <p className="text-[10px] text-green-500 font-mono">
              Canopy tracks your divergent thoughts. Shift+click nodes to add to context.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
