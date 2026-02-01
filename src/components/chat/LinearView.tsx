import { useEffect, useRef } from 'react';
import type { ConversationNode } from '../../types';
import { useConversationStore, useProjectStore } from '../../store';
import { getAncestorPath } from '../../lib/tree';
import { MessageBubble } from './MessageBubble';
import { BranchIndicator } from './BranchIndicator';

interface LinearViewProps {
  streamingContent?: string;
}

export function LinearView({ streamingContent }: LinearViewProps) {
  const nodes = useConversationStore((s) => s.nodes);
  const activeProject = useProjectStore((s) => s.getActiveProject());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeNodeId = activeProject?.activeNodeId;

  // Get the linear path from root to active node
  const path: ConversationNode[] = [];
  if (activeNodeId) {
    const ancestors = getAncestorPath(nodes, activeNodeId);
    const currentNode = nodes.get(activeNodeId);
    if (currentNode) {
      path.push(...ancestors, currentNode);
    }
  }

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [path.length, streamingContent]);

  if (path.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Start a conversation by typing a message below.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {path.map((node, index) => (
          <div key={node.id} className="space-y-2">
            {/* User message with branch indicator */}
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <MessageBubble message={node.userMessage} />
              </div>
              <div className="pt-2">
                <BranchIndicator node={node} />
              </div>
            </div>

            {/* Assistant message */}
            {node.assistantMessage && (
              <MessageBubble message={node.assistantMessage} />
            )}

            {/* Streaming content for the last node */}
            {index === path.length - 1 && streamingContent && !node.assistantMessage && (
              <MessageBubble
                message={{
                  role: 'assistant',
                  content: streamingContent,
                  timestamp: Date.now(),
                }}
                isStreaming
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
