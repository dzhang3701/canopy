
import { ChatNode, TreeDataNode } from '../types';

/**
 * Gets the path from the root to the specified node.
 */
export function getAncestorPath(allNodes: ChatNode[], leafNodeId: string): ChatNode[] {
  const path: ChatNode[] = [];
  let currentId: string | null = leafNodeId;

  while (currentId) {
    const node = allNodes.find(n => n.id === currentId);
    if (!node) break;
    path.unshift(node);
    currentId = node.parentId;
  }

  return path;
}

/**
 * Transforms flat nodes into a hierarchical tree structure for D3.
 */
export function buildHierarchy(allNodes: ChatNode[], projectId: string): TreeDataNode | null {
  const projectNodes = allNodes.filter(n => n.projectId === projectId && !n.isArchived);
  const rootNode = projectNodes.find(n => n.parentId === null);
  
  if (!rootNode) return null;

  const build = (node: ChatNode): TreeDataNode => {
    const children = projectNodes
      .filter(n => n.parentId === node.id)
      .map(build);
    
    return {
      id: node.id,
      name: node.summary,
      children: children.length > 0 ? children : undefined,
      data: node
    };
  };

  return build(rootNode);
}

/**
 * Counts children for a node to determine color coding.
 */
export function getChildCount(allNodes: ChatNode[], nodeId: string): number {
  return allNodes.filter(n => n.parentId === nodeId && !n.isArchived).length;
}
