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

/**
 * Builds hierarchy showing only archived nodes.
 * Used when viewing the archive.
 */
export function buildArchivedHierarchy(allNodes: ChatNode[], projectId: string): TreeDataNode | null {
  // Get only archived nodes for this project
  const archivedNodes = allNodes.filter(n => n.projectId === projectId && n.isArchived);

  if (archivedNodes.length === 0) return null;

  // Find root archived nodes (nodes whose parent is null or parent is not archived)
  const rootArchivedNodes = archivedNodes.filter(n => {
    if (n.parentId === null) return true;
    const parent = allNodes.find(p => p.id === n.parentId);
    return !parent || !parent.isArchived;
  });

  if (rootArchivedNodes.length === 0) return null;

  // Build tree for each root, then combine under a virtual root
  const build = (node: ChatNode): TreeDataNode => {
    const children = archivedNodes
      .filter(n => n.parentId === node.id)
      .map(build);

    return {
      id: node.id,
      name: node.summary,
      children: children.length > 0 ? children : undefined,
      data: node
    };
  };

  // If single root, return it directly
  if (rootArchivedNodes.length === 1) {
    return build(rootArchivedNodes[0]);
  }

  // Multiple roots - create virtual container
  const virtualRoot: TreeDataNode = {
    id: '__archived_root__',
    name: 'Archived Items',
    children: rootArchivedNodes.map(build),
    data: {
      id: '__archived_root__',
      parentId: null,
      projectId,
      summary: 'Archived Items',
      userPrompt: '',
      assistantResponse: '',
      timestamp: 0,
      isArchived: true,
      isCollapsed: false
    }
  };

  return virtualRoot;
}
