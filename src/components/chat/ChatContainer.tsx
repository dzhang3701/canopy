import { useState, useCallback } from 'react';
import { useProjectStore, useConversationStore, useUIStore } from '../../store';
import { buildContextForNewMessage } from '../../lib/context';
import { sendMessage } from '../../lib/api/gemini';
import { LinearView } from './LinearView';
import { ChatInput } from './ChatInput';

export function ChatContainer() {
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeProject = useProjectStore((s) => s.getActiveProject());
  const nodes = useConversationStore((s) => s.nodes);
  const createNode = useConversationStore((s) => s.createNode);
  const setAssistantMessage = useConversationStore((s) => s.setAssistantMessage);
  const { apiKey, selectedModel } = useUIStore();

  const handleSend = useCallback(
    async (content: string) => {
      if (!activeProject) return;
      setError(null);

      const parentId = activeProject.activeNodeId;

      // Create the user message node
      const nodeId = createNode(activeProject.id, {
        role: 'user',
        content,
        timestamp: Date.now(),
      }, parentId);

      // If no API key, don't try to send to LLM
      if (!apiKey) {
        setError('Please set your API key in settings to get responses.');
        return;
      }

      setIsLoading(true);
      setStreamingContent('');

      try {
        // Build context for the LLM
        const context = buildContextForNewMessage(
          nodes,
          parentId,
          content,
          activeProject.systemPrompt
        );

        // Send to Gemini
        const response = await sendMessage(
          apiKey,
          context,
          selectedModel,
          (chunk) => {
            setStreamingContent((prev) => prev + chunk);
          }
        );

        // Save the assistant response
        setAssistantMessage(nodeId, {
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Error sending message:', err);
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setIsLoading(false);
        setStreamingContent('');
      }
    },
    [activeProject, nodes, createNode, setAssistantMessage, apiKey, selectedModel]
  );

  if (!activeProject) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Project Selected
          </h2>
          <p className="text-gray-500">
            Create or select a project from the sidebar to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <LinearView streamingContent={streamingContent} />

      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        disabled={isLoading}
        placeholder={
          !apiKey
            ? 'Set API key in settings to chat...'
            : isLoading
            ? 'Waiting for response...'
            : 'Type a message...'
        }
      />
    </div>
  );
}
