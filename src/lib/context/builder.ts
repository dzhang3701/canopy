import type { ConversationNode } from '../../types';
import { getAncestorPath } from '../tree/traversal';

export interface ContextMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export function buildContext(
  nodes: Map<string, ConversationNode>,
  nodeId: string,
  systemPrompt?: string
): ContextMessage[] {
  const messages: ContextMessage[] = [];

  // Add system prompt if provided
  if (systemPrompt && systemPrompt.trim()) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  // Get ancestor path including the current node
  const path = getAncestorPath(nodes, nodeId);
  const currentNode = nodes.get(nodeId);
  if (currentNode && !path.find((n) => n.id === nodeId)) {
    path.push(currentNode);
  }

  // Build context from ancestors
  for (const node of path) {
    // Add user message
    messages.push({
      role: 'user',
      content: node.userMessage.content,
    });

    // Add assistant message if it exists
    if (node.assistantMessage) {
      messages.push({
        role: 'model',
        content: node.assistantMessage.content,
      });
    }
  }

  return messages;
}

export function buildContextForNewMessage(
  nodes: Map<string, ConversationNode>,
  parentId: string | null,
  newUserMessage: string,
  systemPrompt?: string
): ContextMessage[] {
  const messages: ContextMessage[] = [];

  // Add system prompt if provided
  if (systemPrompt && systemPrompt.trim()) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  // Get ancestor path
  if (parentId) {
    const path = getAncestorPath(nodes, parentId);
    const parentNode = nodes.get(parentId);
    if (parentNode && !path.find((n) => n.id === parentId)) {
      path.push(parentNode);
    }

    for (const node of path) {
      messages.push({
        role: 'user',
        content: node.userMessage.content,
      });

      if (node.assistantMessage) {
        messages.push({
          role: 'model',
          content: node.assistantMessage.content,
        });
      }
    }
  }

  // Add the new user message
  messages.push({
    role: 'user',
    content: newUserMessage,
  });

  return messages;
}

export function estimateTokenCount(messages: ContextMessage[]): number {
  // Rough estimation: ~4 characters per token
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  return Math.ceil(totalChars / 4);
}
