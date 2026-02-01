import { useMemo } from 'react';
import type { ConversationNode } from '../types';
import { buildContext, type ContextMessage } from '../lib/context';

export function useAncestorContext(
  nodes: Map<string, ConversationNode>,
  nodeId: string | null,
  systemPrompt?: string
): ContextMessage[] {
  return useMemo(() => {
    if (!nodeId) return [];
    return buildContext(nodes, nodeId, systemPrompt);
  }, [nodes, nodeId, systemPrompt]);
}
