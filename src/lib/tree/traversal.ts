import type { ConversationNode } from '../../types';

export function getAncestorPath(
  nodes: Map<string, ConversationNode>,
  nodeId: string
): ConversationNode[] {
  const path: ConversationNode[] = [];
  let current = nodes.get(nodeId);

  while (current) {
    path.unshift(current);
    current = current.parentId ? nodes.get(current.parentId) : undefined;
  }

  return path;
}

export function getDescendants(
  nodes: Map<string, ConversationNode>,
  nodeId: string,
  includeCollapsed = false
): ConversationNode[] {
  const descendants: ConversationNode[] = [];
  const node = nodes.get(nodeId);
  if (!node) return descendants;

  const queue = [...node.childIds];
  while (queue.length > 0) {
    const childId = queue.shift()!;
    const child = nodes.get(childId);
    if (child) {
      descendants.push(child);
      if (includeCollapsed || !child.isCollapsed) {
        queue.push(...child.childIds);
      }
    }
  }

  return descendants;
}

export function getDepth(
  nodes: Map<string, ConversationNode>,
  nodeId: string
): number {
  let depth = 0;
  let current = nodes.get(nodeId);

  while (current?.parentId) {
    depth++;
    current = nodes.get(current.parentId);
  }

  return depth;
}

export function getSubtreeSize(
  nodes: Map<string, ConversationNode>,
  nodeId: string
): number {
  const node = nodes.get(nodeId);
  if (!node) return 0;

  let size = 1;
  for (const childId of node.childIds) {
    size += getSubtreeSize(nodes, childId);
  }

  return size;
}

export function findCommonAncestor(
  nodes: Map<string, ConversationNode>,
  nodeId1: string,
  nodeId2: string
): ConversationNode | undefined {
  const ancestors1 = new Set(getAncestorPath(nodes, nodeId1).map((n) => n.id));
  const path2 = getAncestorPath(nodes, nodeId2);

  for (const node of path2) {
    if (ancestors1.has(node.id)) {
      return node;
    }
  }

  return undefined;
}
