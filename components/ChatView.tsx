
import React, { useEffect, useRef } from 'react';
import { ChatNode } from '../types';
import { GitBranch, User, Bot, CornerDownRight, Archive, Trash2, ArchiveRestore } from 'lucide-react';

interface ChatViewProps {
  activePath: ChatNode[];
  allNodes: ChatNode[];
  activeProjectId: string | null;
  onNodeClick: (id: string) => void;
  onBranch: (parentId: string) => void;
  onArchive: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onRestore: (nodeId: string) => void;
  showArchived: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({ activePath, allNodes, activeProjectId, onNodeClick, onBranch, onArchive, onDelete, onRestore, showArchived }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get archived nodes for current project
  const archivedNodes = showArchived
    ? allNodes.filter(n => n.isArchived && n.projectId === activeProjectId)
        .sort((a, b) => a.timestamp - b.timestamp)
    : [];

  // Combine active path with archived nodes (avoiding duplicates)
  const activePathIds = new Set(activePath.map(n => n.id));
  const additionalArchived = archivedNodes.filter(n => !activePathIds.has(n.id));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activePath]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8 space-y-8 max-w-4xl mx-auto w-full">
      {activePath.length === 0 && additionalArchived.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
          <Bot className="w-12 h-12 opacity-20" />
          <p className="text-lg">Start a conversation to see it here.</p>
        </div>
      ) : (
        activePath.map((node, index) => {
          const siblingCount = allNodes.filter(n => n.parentId === node.parentId && n.id !== node.id).length;
          const isArchived = node.isArchived;

          return (
            <div key={node.id} className={`space-y-6 group ${isArchived ? 'opacity-60' : ''}`}>
              {/* Archived Badge */}
              {isArchived && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20 w-fit">
                  <Archive className="w-3 h-3" />
                  Archived
                </div>
              )}

              {/* User Prompt */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-300" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-400">You</span>
                    {siblingCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        <GitBranch className="w-3 h-3" />
                        Branched Path
                      </span>
                    )}
                  </div>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{node.userPrompt}</p>
                </div>
              </div>

              {/* Assistant Response */}
              <div className={`flex gap-4 p-6 rounded-2xl border relative ${
                isArchived
                  ? 'bg-amber-900/10 border-amber-500/20'
                  : 'bg-slate-800/40 border-slate-700/50'
              }`}>
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-blue-400">Arbor AI</span>
                    <button 
                      onClick={() => onNodeClick(node.id)}
                      className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest font-mono"
                    >
                      {new Date(node.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  </div>
                  <div className="text-slate-300 leading-relaxed prose prose-invert max-w-none">
                    {node.assistantResponse}
                  </div>
                  
                  {/* Actions */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-700/50 mt-4">
                    {!isArchived && (
                      <button
                        onClick={() => onBranch(node.id)}
                        className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-400 transition-colors py-1 px-2 rounded hover:bg-blue-400/10"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        Branch from here
                      </button>
                    )}
                    <div className={`flex items-center gap-2 ${isArchived ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity ${isArchived ? 'w-full justify-between' : ''}`}>
                      {isArchived ? (
                        <button
                          onClick={() => onRestore(node.id)}
                          className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors py-1 px-2 rounded hover:bg-amber-400/10"
                          title="Restore this message and its replies"
                        >
                          <ArchiveRestore className="w-3 h-3" />
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => onArchive(node.id)}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-400 transition-colors py-1 px-2 rounded hover:bg-amber-400/10"
                          title="Archive this message and its replies"
                        >
                          <Archive className="w-3 h-3" />
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(node.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors py-1 px-2 rounded hover:bg-red-400/10"
                        title="Permanently delete this message and its replies"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Archived Messages Section */}
      {additionalArchived.length > 0 && (
        <div className="mt-8 pt-8 border-t border-amber-500/20">
          <div className="flex items-center gap-2 text-sm text-amber-400 mb-6">
            <Archive className="w-4 h-4" />
            <span className="font-medium">Archived Messages ({additionalArchived.length})</span>
          </div>
          {additionalArchived.map((node) => (
            <div key={node.id} className="space-y-6 group opacity-60 mb-8">
              {/* Archived Badge */}
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20 w-fit">
                <Archive className="w-3 h-3" />
                Archived
              </div>

              {/* User Prompt */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-300" />
                </div>
                <div className="flex-1 space-y-1">
                  <span className="font-semibold text-sm text-slate-400">You</span>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{node.userPrompt}</p>
                </div>
              </div>

              {/* Assistant Response */}
              <div className="flex gap-4 p-6 rounded-2xl border bg-amber-900/10 border-amber-500/20 relative">
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-blue-400">Arbor AI</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                      {new Date(node.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-300 leading-relaxed prose prose-invert max-w-none">
                    {node.assistantResponse}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-700/50 mt-4">
                    <button
                      onClick={() => onRestore(node.id)}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors py-1 px-2 rounded hover:bg-amber-400/10"
                      title="Restore this message and its replies"
                    >
                      <ArchiveRestore className="w-3 h-3" />
                      Restore
                    </button>
                    <button
                      onClick={() => onDelete(node.id)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors py-1 px-2 rounded hover:bg-red-400/10"
                      title="Permanently delete this message and its replies"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatView;
