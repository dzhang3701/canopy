
import React, { useEffect, useRef } from 'react';
import { ChatNode } from '../types';
import { GitBranch, User, Bot, CornerDownRight } from 'lucide-react';

interface ChatViewProps {
  activePath: ChatNode[];
  allNodes: ChatNode[];
  onNodeClick: (id: string) => void;
  onBranch: (parentId: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ activePath, allNodes, onNodeClick, onBranch }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activePath]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8 space-y-8 max-w-4xl mx-auto w-full">
      {activePath.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
          <Bot className="w-12 h-12 opacity-20" />
          <p className="text-lg">Start a conversation to see it here.</p>
        </div>
      ) : (
        activePath.map((node, index) => {
          const siblingCount = allNodes.filter(n => n.parentId === node.parentId && n.id !== node.id).length;
          
          return (
            <div key={node.id} className="space-y-6 group">
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
              <div className="flex gap-4 bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 relative">
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
                  
                  {/* Branching UI */}
                  <div className="pt-4 flex items-center gap-4 border-t border-slate-700/50 mt-4">
                    <button 
                      onClick={() => onBranch(node.id)}
                      className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-400 transition-colors py-1 px-2 rounded hover:bg-blue-400/10"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      Branch from here
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChatView;
