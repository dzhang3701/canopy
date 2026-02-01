
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatNode, Project, ViewMode, ApiUsageStats } from './types';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import GraphView from './components/GraphView';
import ApiStatsPanel, { calculateCost } from './components/ApiStatsPanel';
import { generateChatResponse } from './services/geminiService';
import { getAncestorPath } from './utils/treeUtils';
import { Send, GitGraph, MessageSquare, Loader2, Sparkles } from 'lucide-react';

const STARTER_PROJECTS: Project[] = [
  { id: 'p1', name: 'Exploration', icon: '🚀', createdAt: Date.now() },
  { id: 'p2', name: 'Problem Solving', icon: '🧩', createdAt: Date.now() },
  { id: 'p3', name: 'Class Notes', icon: '📝', createdAt: Date.now() },
];

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('arbor_projects');
    return saved ? JSON.parse(saved) : STARTER_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem('arbor_active_project') || (STARTER_PROJECTS[0]?.id || null);
  });

  const [nodes, setNodes] = useState<ChatNode[]>(() => {
    const saved = localStorage.getItem('arbor_nodes');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeNodeId, setActiveNodeId] = useState<string | null>(() => {
    return localStorage.getItem('arbor_active_node') || null;
  });

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LINEAR);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiStats, setApiStats] = useState<ApiUsageStats>(() => {
    const saved = localStorage.getItem('arbor_api_stats');
    return saved ? JSON.parse(saved) : { totalCalls: 0, inputTokens: 0, outputTokens: 0, estimatedCost: 0 };
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('arbor_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('arbor_nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem('arbor_active_project', activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    if (activeNodeId) localStorage.setItem('arbor_active_node', activeNodeId);
  }, [activeNodeId]);

  useEffect(() => {
    localStorage.setItem('arbor_api_stats', JSON.stringify(apiStats));
  }, [apiStats]);

  const activePath = useMemo(() => {
    if (!activeNodeId) return [];
    return getAncestorPath(nodes, activeNodeId);
  }, [nodes, activeNodeId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !activeProjectId || isLoading) return;

    const promptText = input;
    setInput('');
    setIsLoading(true);

    try {
      const history = activePath;
      const { response, summary, usage } = await generateChatResponse(history, promptText);

      // Update API stats
      setApiStats(prev => {
        const newInputTokens = prev.inputTokens + usage.inputTokens;
        const newOutputTokens = prev.outputTokens + usage.outputTokens;
        return {
          totalCalls: prev.totalCalls + 1,
          inputTokens: newInputTokens,
          outputTokens: newOutputTokens,
          estimatedCost: calculateCost(newInputTokens, newOutputTokens),
        };
      });

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
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
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
    }
  };

  const handleDeleteProject = (id: string) => {
    if (confirm("Delete project and all its nodes?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      setNodes(prev => prev.filter(n => n.projectId !== id));
      if (activeProjectId === id) {
        setActiveProjectId(projects.find(p => p.id !== id)?.id || null);
        setActiveNodeId(null);
      }
    }
  };

  const handleBranch = (parentId: string) => {
    setActiveNodeId(parentId);
    setViewMode(ViewMode.LINEAR);
  };

  const handleResetStats = () => {
    setApiStats({ totalCalls: 0, inputTokens: 0, outputTokens: 0, estimatedCost: 0 });
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden font-sans">
      <Sidebar 
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          // Find the deepest leaf node in that project to set as active
          const projectNodes = nodes.filter(n => n.projectId === id);
          if (projectNodes.length > 0) {
            // Sort by timestamp desc
            const latest = [...projectNodes].sort((a, b) => b.timestamp - a.timestamp)[0];
            setActiveNodeId(latest.id);
          } else {
            setActiveNodeId(null);
          }
        }}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <span className="text-xl">{projects.find(p => p.id === activeProjectId)?.icon || '📁'}</span>
            <h2 className="font-bold text-slate-200">
              {projects.find(p => p.id === activeProjectId)?.name || 'Select Project'}
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode(ViewMode.LINEAR)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === ViewMode.LINEAR ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => setViewMode(ViewMode.GRAPH)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === ViewMode.GRAPH ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitGraph className="w-4 h-4" />
              Graph
            </button>
          </div>
        </header>

        {/* View Area */}
        <main className="flex-1 overflow-hidden flex flex-col bg-slate-950">
          {viewMode === ViewMode.LINEAR ? (
            <ChatView 
              activePath={activePath} 
              allNodes={nodes}
              onNodeClick={setActiveNodeId}
              onBranch={handleBranch}
            />
          ) : (
            <GraphView 
              nodes={nodes} 
              activeProjectId={activeProjectId || ''} 
              activeNodeId={activeNodeId}
              onNodeClick={(id) => {
                setActiveNodeId(id);
                setViewMode(ViewMode.LINEAR);
              }}
            />
          )}
        </main>

        {/* Input Area (Sticky) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/50">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative group"
          >
            <div className="absolute -top-10 left-0 flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-mono pointer-events-none">
              <Sparkles className="w-3 h-3 text-blue-400" />
              Context: {activePath.length} turns active
            </div>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeProjectId ? "Type a message or press 'Branch' on a previous message..." : "Select a project to start..."}
              disabled={!activeProjectId || isLoading}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 pl-6 pr-14 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !activeProjectId}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
          <div className="max-w-4xl mx-auto mt-2 flex justify-center">
            <p className="text-[10px] text-slate-600 font-mono">
              Branching is intentional. Arbor tracks your divergent thoughts.
            </p>
          </div>
        </div>

        {/* API Stats Panel */}
        <ApiStatsPanel stats={apiStats} onReset={handleResetStats} />
      </div>
    </div>
  );
};

export default App;
