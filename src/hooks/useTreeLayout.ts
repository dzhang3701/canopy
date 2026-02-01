import { useMemo } from 'react';
import type { ConversationNode, LayoutNode, TreeBounds } from '../types';
import { calculateTreeLayout } from '../lib/tree';

interface UseTreeLayoutOptions {
  showArchived?: boolean;
}

interface UseTreeLayoutResult {
  layout: Map<string, LayoutNode>;
  bounds: TreeBounds;
}

export function useTreeLayout(
  nodes: Map<string, ConversationNode>,
  rootId: string | null,
  options: UseTreeLayoutOptions = {}
): UseTreeLayoutResult {
  const { showArchived } = options;
  return useMemo(
    () => calculateTreeLayout(nodes, rootId, { showArchived }),
    [nodes, rootId, showArchived]
  );
}
