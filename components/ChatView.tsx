
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ChatNode } from '../types';
import { GitBranch, User, Bot, CornerDownRight, CheckCircle2, Circle, Loader2, Leaf } from 'lucide-react';

interface ChatViewProps {
  activePath: ChatNode[];
  allNodes: ChatNode[];
  contextNodeIds: Set<string>;
  onNodeClick: (id: string) => void;
  onBranch: (parentId: string) => void;
  onToggleContext: (id: string) => void;
  streamingResponse?: string;
  isLoading?: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({
  activePath,
  allNodes,
  contextNodeIds,
  onNodeClick,
  onBranch,
  onToggleContext,
  streamingResponse = '',
  isLoading = false
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activePath, streamingResponse]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-gradient-to-b from-white via-white to-emerald-50/30">
      {activePath.length === 0 && !isLoading ? (
        <div className="h-full flex flex-col items-center justify-center text-emerald-400 space-y-4">
          <div className="relative">
            <Leaf className="w-16 h-16 text-emerald-200" />
            <Bot className="w-8 h-8 text-emerald-400 absolute bottom-0 right-0" />
          </div>
          <p className="text-lg font-medium text-emerald-500">Your conversation will grow here</p>
          <p className="text-sm text-emerald-300">Each message becomes a branch in your thought tree</p>
        </div>
      ) : (
        <>
          {activePath.map((node) => {
            const siblingCount = allNodes.filter(n => n.parentId === node.parentId && n.id !== node.id).length;
            const isInContext = contextNodeIds.has(node.id);

            return (
              <div
                key={node.id}
                className={`space-y-4 group relative ${isInContext ? 'ring-2 ring-emerald-400 ring-offset-2 rounded-2xl' : ''}`}
              >
                {/* Connecting vine line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-200 via-green-200 to-emerald-200 opacity-30 -z-10" />

                {/* User Prompt */}
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center flex-shrink-0 border border-emerald-200 shadow-sm">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-emerald-700">You</span>
                      {siblingCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                          <GitBranch className="w-3 h-3" />
                          Branched
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-800 leading-relaxed whitespace-pre-wrap">{node.userPrompt}</p>
                  </div>
                </div>

                {/* Assistant Response */}
                <div className="flex gap-3 bg-gradient-to-br from-emerald-50/80 to-green-50/80 p-4 rounded-2xl border border-emerald-100/80 relative shadow-sm backdrop-blur-sm">
                  {/* Decorative leaf accent */}
                  <div className="absolute -top-1 -right-1 opacity-20">
                    <Leaf className="w-6 h-6 text-emerald-600 rotate-45" />
                  </div>

                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Leaf className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-emerald-600 flex items-center gap-1.5">
                        Canopy
                        <span className="text-[10px] font-normal text-emerald-400 bg-emerald-100 px-1.5 py-0.5 rounded">AI</span>
                      </span>
                      <button
                        onClick={() => onNodeClick(node.id)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-600 transition-colors font-medium bg-emerald-100/50 px-2 py-0.5 rounded-full"
                      >
                        {new Date(node.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    </div>
                    <div className="prose prose-sm prose-emerald max-w-none text-emerald-700 overflow-hidden">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {node.assistantResponse}
                      </ReactMarkdown>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 flex items-center gap-2 border-t border-emerald-100/50 mt-3">
                      <button
                        onClick={() => onBranch(node.id)}
                        className="flex items-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-700 transition-all py-1.5 px-3 rounded-full hover:bg-emerald-100/80 border border-transparent hover:border-emerald-200"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        Branch
                      </button>
                      <button
                        onClick={() => onToggleContext(node.id)}
                        className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-full transition-all border ${
                          isInContext
                            ? 'text-emerald-700 bg-emerald-200 border-emerald-300 hover:bg-emerald-300'
                            : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100/80 border-transparent hover:border-emerald-200'
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
          })}

          {/* Streaming Response */}
          {isLoading && (
            <div className="space-y-4">
              {/* Show the user's pending message if we're streaming */}
              {streamingResponse && (
                <div className="flex gap-3 bg-gradient-to-br from-emerald-50/80 to-green-50/80 p-4 rounded-2xl border border-emerald-100/80 relative shadow-sm backdrop-blur-sm animate-pulse-subtle">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Leaf className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-emerald-600">Canopy</span>
                      <span className="text-[10px] font-normal text-emerald-400 bg-emerald-100 px-1.5 py-0.5 rounded">AI</span>
                      <Loader2 className="w-3 h-3 text-emerald-500 animate-spin" />
                    </div>
                    <div className="prose prose-sm prose-emerald max-w-none text-emerald-700 overflow-hidden">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {streamingResponse}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
              {!streamingResponse && (
                <div className="flex gap-3 bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md relative">
                    <Leaf className="w-4 h-4 text-white" />
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-emerald-600">Canopy</span>
                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                    <span className="text-sm text-emerald-500">Growing thoughts...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatView;
