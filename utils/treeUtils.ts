/**
 * Tree Utility Functions
 *
 * These functions handle tree traversal and hierarchy building.
 * Archive-aware filtering is handled via the archive feature module.
 */

import { ChatNode, TreeDataNode } from '../types';
import { filterArchivedNodes } from '../features/archive';

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
 * Uses archive feature to filter out archived nodes.
 */
export function buildHierarchy(allNodes: ChatNode[], projectId: string): TreeDataNode | null {
  // Filter to project nodes and exclude archived (using archive feature)
  const projectNodes = filterArchivedNodes(
    allNodes.filter(n => n.projectId === projectId)
  );
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
 * Counts non-archived children for a node to determine color coding.
 * Uses archive feature filtering.
 */
export function getChildCount(allNodes: ChatNode[], nodeId: string): number {
  const children = allNodes.filter(n => n.parentId === nodeId);
  return filterArchivedNodes(children).length;
}
