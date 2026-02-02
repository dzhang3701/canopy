
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { ChatNode, Project } from './types';
import ChatView from './components/ChatView';
import GraphView from './components/GraphView';
import { generateChatResponse, streamChatResponse } from './services/geminiService';
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
  const [streamingResponse, setStreamingResponse] = useState('');

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

    try {
      const history = contextPath.length > 0 ? contextPath : activePath;

      let fullResponse = '';
      await streamChatResponse(history, promptText, (chunk) => {
        fullResponse += chunk;
        setStreamingResponse(fullResponse);
      });

      // Generate summary after streaming completes
      const { summary } = await generateChatResponse(history, promptText, true);

      // Create node immediately with empty response
      const newNode: ChatNode = {
        id: newNodeId,
        parentId: activeNodeId,
        projectId: activeProjectId,
        summary: 'Generating...',
        userPrompt: promptText,
        assistantResponse: fullResponse,
        timestamp: Date.now(),
        isArchived: false,
        isCollapsed: false
      };

      setNodes(prev => [...prev, newNode]);
      setActiveNodeId(newNode.id);
      setStreamingResponse('');
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

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    const projectNodes = nodes.filter(n => n.projectId === id);
    if (projectNodes.length > 0) {
      const latest = [...projectNodes].sort((a, b) => b.timestamp - a.timestamp)[0];
      setActiveNodeId(latest.id);
    } else {
      setActiveNodeId(null);
    }
    setContextNodeIds(new Set());
  };

  const handleBranch = (parentId: string) => {
    setActiveNodeId(parentId);
  };

  const handleNodeClick = (id: string) => {
    setActiveNodeId(id);
  };

  return (
    <div className="flex h-screen w-full bg-green-50 overflow-hidden font-sans">
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Graph Panel with Project Tabs */}
        <Panel defaultSize={50} minSize={30}>
          <GraphView
            nodes={nodes}
            projects={projects}
            activeProjectId={activeProjectId || ''}
            activeNodeId={activeNodeId}
            contextNodeIds={contextNodeIds}
            activePathIds={new Set(activePath.map(n => n.id))}
            onNodeClick={handleNodeClick}
            onToggleContext={handleToggleContext}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
          />
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-2 bg-green-100 hover:bg-green-200 transition-colors flex items-center justify-center group">
          <GripVertical className="w-3 h-3 text-green-400 group-hover:text-green-600" />
        </PanelResizeHandle>

        {/* Chat Panel */}
        <Panel defaultSize={50} minSize={30}>
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
            />

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-green-200">
              <form
                onSubmit={handleSendMessage}
                className="relative"
              >
                <div className="flex items-center gap-2 text-[10px] text-green-500 mb-2 font-mono">
                  <Sparkles className="w-3 h-3" />
                  {contextNodeIds.size > 0
                    ? `${contextNodeIds.size} nodes in context`
                    : `${activePath.length} turns active`
                  }
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={activeProjectId ? "Type a message..." : "Select a project to start..."}
                  disabled={!activeProjectId || isLoading}
                  className="w-full bg-green-50 border border-green-300 rounded-xl py-3 pl-4 pr-12 text-green-800 placeholder:text-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || !activeProjectId}
                  className="absolute right-2 top-[calc(50%+10px)] -translate-y-1/2 p-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors disabled:opacity-50 disabled:hover:bg-green-600"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default App;
