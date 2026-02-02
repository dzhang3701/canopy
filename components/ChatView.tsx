
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ChatNode } from '../types';
import { Bot, Loader2, Copy } from 'lucide-react';

interface ChatViewProps {
  activePath: ChatNode[];
  allNodes: ChatNode[];
  contextNodeIds: Set<string>;
  onNodeClick: (id: string) => void;
  onBranch: (parentId: string) => void;
  onToggleContext: (id: string) => void;
  streamingResponse?: string;
  isLoading?: boolean;
  isDarkMode?: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({
  activePath,
  allNodes,
  contextNodeIds,
  onNodeClick,
  onBranch,
  onToggleContext,
  streamingResponse = '',
  isLoading = false,
  isDarkMode = false
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activePath, streamingResponse]);

  return (
    <div
      ref={scrollRef}
      className={`flex-1 overflow-y-auto px-4 py-8 custom-scrollbar ${isDarkMode ? 'bg-dark-950' : 'bg-zinc-50/50'}`}
    >
      {activePath.length === 0 && !isLoading ? (
        <div className={`h-full flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-700`}>
          <div className={`p-6 rounded-3xl ${isDarkMode ? 'bg-dark-900 shadow-premium' : 'bg-zinc-100/50 shadow-premium border border-canopy-100'}`}>
            <Bot className={`w-12 h-12 ${isDarkMode ? 'text-canopy-500' : 'text-canopy-600'}`} />
          </div>
          <div className="text-center space-y-2">
            <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-dark-100' : 'text-dark-900'}`}>Canopy</h2>
            <p className={`text-sm ${isDarkMode ? 'text-dark-400' : 'text-dark-500'}`}>Start a new branching conversation</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-10 max-w-3xl mx-auto pb-10">
          {activePath.map((node, index) => {
            const hasResponse = node.assistantResponse && node.assistantResponse.trim().length > 0;

            return (
              <div key={node.id} className="space-y-8 animate-in slide-in-from-bottom-2 duration-400">
                {/* User Prompt */}
                <div className="flex flex-col items-end pl-10 group">
                  <div className={`px-6 py-4 rounded-[1.75rem] rounded-br-md shadow-sm text-[15px] leading-relaxed whitespace-pre-wrap transition-all ${isDarkMode
                    ? 'bg-dark-800 text-dark-50 border border-dark-700 group-hover:border-dark-600'
                    : 'bg-zinc-50/50 text-dark-900 border border-canopy-100 group-hover:border-canopy-200 shadow-sm'
                    }`}>
                    {node.userPrompt}
                  </div>
                  <div className="flex items-center gap-2 mt-2 mr-1 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                    <span className={`text-[11px] font-medium tracking-tight ${isDarkMode ? 'text-dark-500' : 'text-dark-400'}`}>
                      {new Date(node.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Assistant Response */}
                {hasResponse && (
                  <div className="flex flex-col pr-10 group relative pl-4 border-l-2 border-canopy-500/10 dark:border-canopy-500/5">

                    <div className="flex-1 space-y-3">
                      <div className={`prose prose-sm leading-relaxed max-w-none prose-headings:font-bold prose-a:font-medium prose-a:no-underline hover:prose-a:underline ${isDarkMode
                        ? 'prose-invert prose-p:text-dark-300 prose-headings:text-dark-50 prose-strong:text-dark-100 prose-code:text-canopy-300 prose-code:bg-dark-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-dark-900/50 prose-pre:border prose-pre:border-dark-800 prose-a:text-canopy-400'
                        : 'prose-zinc prose-p:text-dark-700 prose-headings:text-dark-900 prose-code:text-canopy-700 prose-code:bg-canopy-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-canopy-50/30 prose-pre:border prose-pre:border-canopy-100 prose-a:text-canopy-600'
                        }`}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {node.assistantResponse}
                        </ReactMarkdown>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-4 select-none">
                        <span className={`text-[11px] font-medium ${isDarkMode ? 'text-dark-500' : 'text-dark-400'}`}>
                          {new Date(node.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()}
                        </span>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigator.clipboard.writeText(node.assistantResponse)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${isDarkMode
                              ? 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
                              : 'text-dark-500 hover:text-canopy-700 hover:bg-canopy-50'
                              }`}
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Streaming Response */}
          {isLoading && (
            <div className="flex flex-col pr-10 animate-in fade-in duration-500 pl-4 border-l-2 border-canopy-500/10 dark:border-canopy-500/5">

              <div className="flex-1">
                {streamingResponse ? (
                  <div className={`prose prose-sm leading-relaxed max-w-none ${isDarkMode
                    ? 'prose-invert prose-p:text-dark-300 prose-a:text-canopy-400'
                    : 'prose-zinc prose-p:text-dark-700 prose-a:text-canopy-600'
                    }`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {streamingResponse}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-2 text-canopy-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium animate-pulse">Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatView;
