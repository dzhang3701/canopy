/**
 * Tree Utility Functions
 *
 * These functions handle tree traversal and hierarchy building.
 */

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
export function buildHierarchy(allNodes: ChatNode[], projectId: string, showArchived = false): TreeDataNode | null {
  const projectNodes = allNodes.filter(n => n.projectId === projectId && (showArchived || !n.isArchived));
  const rootNodes = projectNodes.filter(n => n.parentId === null);

  if (rootNodes.length === 0) return null;

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

  if (rootNodes.length === 1) {
    return build(rootNodes[0]);
  }

  // Multiple roots - create virtual root
  return {
    id: '__virtual_root__',
    name: 'Conversions',
    children: rootNodes.map(build),
    data: {
      id: '__virtual_root__',
      parentId: null,
      projectId,
      summary: 'Conversations',
      userPrompt: '',
      assistantResponse: '',
      timestamp: 0,
      isArchived: false,
      isCollapsed: false
    }
  };
}

/**
 * Counts children for a node to determine color coding.
 */
export function getChildCount(allNodes: ChatNode[], nodeId: string, showArchived = false): number {
  return allNodes.filter(n => n.parentId === nodeId && (showArchived || !n.isArchived)).length;
}



// --- Ported Archive/Delete Logic ---

export interface NodeDeletionResult {
  updatedNodes: ChatNode[];
  newActiveNodeId: string | null;
}

export function deleteNodeOnly(nodes: ChatNode[], nodeId: string, activeNodeId: string | null): NodeDeletionResult {
  const nodeToDelete = nodes.find(n => n.id === nodeId);
  if (!nodeToDelete) return { updatedNodes: nodes, newActiveNodeId: activeNodeId };

  const updatedNodes = nodes
    .filter(n => n.id !== nodeId)
    .map(node => {
      if (node.parentId === nodeId) {
        return { ...node, parentId: nodeToDelete.parentId };
      }
      return node;
    });

  let newActiveNodeId = activeNodeId;
  if (activeNodeId === nodeId) {
    newActiveNodeId = nodeToDelete.parentId;
  }

  return { updatedNodes, newActiveNodeId };
}

export function deleteNodeWithChildren(nodes: ChatNode[], nodeId: string, activeNodeId: string | null): NodeDeletionResult {
  const nodeToDelete = nodes.find(n => n.id === nodeId);
  if (!nodeToDelete) return { updatedNodes: nodes, newActiveNodeId: activeNodeId };

  const nodesToDelete = new Set<string>([nodeId]);
  const findDescendants = (parentId: string) => {
    nodes.forEach(node => {
      if (node.parentId === parentId && !nodesToDelete.has(node.id)) {
        nodesToDelete.add(node.id);
        findDescendants(node.id);
      }
    });
  };
  findDescendants(nodeId);

  const updatedNodes = nodes.filter(n => !nodesToDelete.has(n.id));

  let newActiveNodeId = activeNodeId;
  if (activeNodeId && nodesToDelete.has(activeNodeId)) {
    newActiveNodeId = nodeToDelete.parentId;
  }

  return { updatedNodes, newActiveNodeId };
}

export function archiveNodeOnly(nodes: ChatNode[], nodeId: string, activeNodeId: string | null): NodeDeletionResult {
  const nodeToArchive = nodes.find(n => n.id === nodeId);
  if (!nodeToArchive) return { updatedNodes: nodes, newActiveNodeId: activeNodeId };

  const updatedNodes = nodes.map(node => {
    if (node.id === nodeId) return { ...node, isArchived: true };
    if (node.parentId === nodeId) return { ...node, parentId: nodeToArchive.parentId };
    return node;
  });

  let newActiveNodeId = activeNodeId;
  if (activeNodeId === nodeId) {
    newActiveNodeId = nodeToArchive.parentId;
  }

  return { updatedNodes, newActiveNodeId };
}

export function archiveNodeWithChildren(nodes: ChatNode[], nodeId: string, activeNodeId: string | null): NodeDeletionResult {
  const nodeToArchive = nodes.find(n => n.id === nodeId);
  if (!nodeToArchive) return { updatedNodes: nodes, newActiveNodeId: activeNodeId };

  const nodesToArchive = new Set<string>([nodeId]);
  const findDescendants = (parentId: string) => {
    nodes.forEach(node => {
      if (node.parentId === parentId && !nodesToArchive.has(node.id)) {
        nodesToArchive.add(node.id);
        findDescendants(node.id);
      }
    });
  };
  findDescendants(nodeId);

  const updatedNodes = nodes.map(node => {
    if (nodesToArchive.has(node.id)) return { ...node, isArchived: true };
    return node;
  });

  let newActiveNodeId = activeNodeId;
  if (activeNodeId && nodesToArchive.has(activeNodeId)) {
    newActiveNodeId = nodeToArchive.parentId;
  }

  return { updatedNodes, newActiveNodeId };
}

export function archiveChildrenOnly(nodes: ChatNode[], nodeId: string, activeNodeId: string | null): NodeDeletionResult {
  const nodesToArchive = new Set<string>();
  const findDescendants = (parentId: string) => {
    nodes.forEach(node => {
      if (node.parentId === parentId && !nodesToArchive.has(node.id)) {
        nodesToArchive.add(node.id);
        findDescendants(node.id);
      }
    });
  };
  findDescendants(nodeId);

  const updatedNodes = nodes.map(node => {
    if (nodesToArchive.has(node.id)) return { ...node, isArchived: true };
    return node;
  });

  let newActiveNodeId = activeNodeId;
  if (activeNodeId && nodesToArchive.has(activeNodeId)) {
    newActiveNodeId = nodeId;
  }

  return { updatedNodes, newActiveNodeId };
}

export function deleteChildrenOnly(nodes: ChatNode[], nodeId: string, activeNodeId: string | null): NodeDeletionResult {
  const nodesToDelete = new Set<string>();
  const findDescendants = (parentId: string) => {
    nodes.forEach(node => {
      if (node.parentId === parentId && !nodesToDelete.has(node.id)) {
        nodesToDelete.add(node.id);
        findDescendants(node.id);
      }
    });
  };
  findDescendants(nodeId);

  const updatedNodes = nodes.filter(n => !nodesToDelete.has(n.id));

  let newActiveNodeId = activeNodeId;
  if (activeNodeId && nodesToDelete.has(activeNodeId)) {
    newActiveNodeId = nodeId;
  }

  return { updatedNodes, newActiveNodeId };
}

export function unarchiveNodeWithChildren(nodes: ChatNode[], nodeId: string): ChatNode[] {
  const nodesToUnarchive = new Set<string>([nodeId]);
  const findDescendants = (parentId: string) => {
    nodes.forEach(node => {
      if (node.parentId === parentId && !nodesToUnarchive.has(node.id)) {
        nodesToUnarchive.add(node.id);
        findDescendants(node.id);
      }
    });
  };
  findDescendants(nodeId);

  return nodes.map(node => {
    if (nodesToUnarchive.has(node.id)) {
      return { ...node, isArchived: false };
    }
    return node;
  });
}
