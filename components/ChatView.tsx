
import React, { useEffect, useRef } from 'react';
import { ChatNode } from '../types';
import { GitBranch, User, Bot, CornerDownRight, CheckCircle2, Circle } from 'lucide-react';

interface ChatViewProps {
  activePath: ChatNode[];
  allNodes: ChatNode[];
  contextNodeIds: Set<string>;
  onNodeClick: (id: string) => void;
  onBranch: (parentId: string) => void;
  onToggleContext: (id: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({
  activePath,
  allNodes,
  contextNodeIds,
  onNodeClick,
  onBranch,
  onToggleContext
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activePath]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-6 space-y-6 bg-white">
      {activePath.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-green-400 space-y-4">
          <Bot className="w-12 h-12 opacity-20" />
          <p className="text-lg">Start a conversation to see it here.</p>
        </div>
      ) : (
        activePath.map((node, index) => {
          const siblingCount = allNodes.filter(n => n.parentId === node.parentId && n.id !== node.id).length;
          const isInContext = contextNodeIds.has(node.id);

          return (
            <div
              key={node.id}
              className={`space-y-4 group ${isInContext ? 'ring-2 ring-green-400 ring-offset-2 rounded-xl' : ''}`}
            >
              {/* User Prompt */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-green-700">You</span>
                    {siblingCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded border border-green-200">
                        <GitBranch className="w-3 h-3" />
                        Branched
                      </span>
                    )}
                  </div>
                  <p className="text-green-800 leading-relaxed whitespace-pre-wrap">{node.userPrompt}</p>
                </div>
              </div>

              {/* Assistant Response */}
              <div className="flex gap-3 bg-green-50 p-4 rounded-xl border border-green-100 relative">
                <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-green-600">Canopy AI</span>
                    <button
                      onClick={() => onNodeClick(node.id)}
                      className="text-[10px] text-green-400 hover:text-green-600 transition-colors uppercase tracking-widest font-mono"
                    >
                      {new Date(node.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  </div>
                  <div className="text-green-700 leading-relaxed prose prose-green max-w-none text-sm">
                    {node.assistantResponse}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex items-center gap-3 border-t border-green-100 mt-3">
                    <button
                      onClick={() => onBranch(node.id)}
                      className="flex items-center gap-1.5 text-xs text-green-500 hover:text-green-700 transition-colors py-1 px-2 rounded hover:bg-green-100"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      Branch
                    </button>
                    <button
                      onClick={() => onToggleContext(node.id)}
                      className={`flex items-center gap-1.5 text-xs py-1 px-2 rounded transition-colors ${
                        isInContext
                          ? 'text-green-700 bg-green-200 hover:bg-green-300'
                          : 'text-green-500 hover:text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {isInContext ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          In Context
                        </>
                      ) : (
                        <>
                          <Circle className="w-3 h-3" />
                          Add to Context
                        </>
                      )}
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
