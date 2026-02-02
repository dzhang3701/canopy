/**
 * Archive Feature - Utility Functions
 *
 * This module contains utility functions for archive-related operations.
 * These functions handle filtering and managing archived nodes.
 */

import { ChatNode } from '../../types';

/**
 * Result of an archive operation.
 */
export interface ArchiveResult {
  updatedNodes: ChatNode[];
  newActiveNodeId: string | null;
}

/**
 * Filters out archived nodes from an array of nodes.
 * @param nodes - Array of chat nodes to filter
 * @returns Array of non-archived nodes
 */
export function filterArchivedNodes(nodes: ChatNode[]): ChatNode[] {
  return nodes.filter(node => !node.isArchived);
}

/**
 * Checks if a node is archived.
 * @param node - The node to check
 * @returns true if the node is archived
 */
export function isNodeArchived(node: ChatNode): boolean {
  return node.isArchived;
}

/**
 * Creates the default archive state for a new node.
 * @returns The default isArchived value (false)
 */
export function getDefaultArchiveState(): boolean {
  return false;
}

/**
 * Archives a single node and promotes its children to its parent.
 * @param nodes - Array of all nodes
 * @param nodeId - ID of the node to archive
 * @param activeNodeId - Currently active node ID
 * @returns Updated nodes array and new active node ID
 */
export function archiveNodeOnly(
  nodes: ChatNode[],
  nodeId: string,
  activeNodeId: string | null
): ArchiveResult {
  const nodeToArchive = nodes.find(n => n.id === nodeId);
  if (!nodeToArchive) {
    return { updatedNodes: nodes, newActiveNodeId: activeNodeId };
  }

  // Archive the node and promote children to its parent
  const updatedNodes = nodes.map(node => {
    if (node.id === nodeId) {
      return { ...node, isArchived: true };
    }
    if (node.parentId === nodeId) {
      return { ...node, parentId: nodeToArchive.parentId };
    }
    return node;
  });

  // Determine new active node
  let newActiveNodeId = activeNodeId;
  if (activeNodeId === nodeId) {
    newActiveNodeId = nodeToArchive.parentId;
  }

  return {
    updatedNodes,
    newActiveNodeId,
  };
}

/**
 * Archives a node and all its descendants.
 * @param nodes - Array of all nodes
 * @param nodeId - ID of the node to archive
 * @param activeNodeId - Currently active node ID
 * @returns Updated nodes array and new active node ID
 */
export function archiveNodeWithChildren(
  nodes: ChatNode[],
  nodeId: string,
  activeNodeId: string | null
): ArchiveResult {
  const nodeToArchive = nodes.find(n => n.id === nodeId);
  if (!nodeToArchive) {
    return { updatedNodes: nodes, newActiveNodeId: activeNodeId };
  }

  // Collect all nodes to archive (node + all descendants)
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
    if (nodesToArchive.has(node.id)) {
      return { ...node, isArchived: true };
    }
    return node;
  });

  // Determine new active node
  let newActiveNodeId = activeNodeId;
  if (activeNodeId && nodesToArchive.has(activeNodeId)) {
    newActiveNodeId = nodeToArchive.parentId;
  }

  return {
    updatedNodes,
    newActiveNodeId,
  };
}

/**
 * Archives all children of a node but keeps the node itself.
 * @param nodes - Array of all nodes
 * @param nodeId - ID of the node whose children should be archived
 * @param activeNodeId - Currently active node ID
 * @returns Updated nodes array and new active node ID
 */
export function archiveChildrenOnly(
  nodes: ChatNode[],
  nodeId: string,
  activeNodeId: string | null
): ArchiveResult {
  // Collect all descendants (not the node itself)
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
    if (nodesToArchive.has(node.id)) {
      return { ...node, isArchived: true };
    }
    return node;
  });

  // Determine new active node
  let newActiveNodeId = activeNodeId;
  if (activeNodeId && nodesToArchive.has(activeNodeId)) {
    newActiveNodeId = nodeId; // Set to the parent node we kept
  }

  return {
    updatedNodes,
    newActiveNodeId,
  };
}

/**
 * Unarchives a node by ID within an array of nodes.
 * @param nodes - Array of all nodes
 * @param nodeId - ID of the node to unarchive
 * @returns New array with the specified node unarchived
 */
export function unarchiveNode(nodes: ChatNode[], nodeId: string): ChatNode[] {
  return nodes.map(node =>
    node.id === nodeId ? { ...node, isArchived: false } : node
  );
}

/**
 * Unarchives a node and all its descendants.
 * @param nodes - Array of all nodes
 * @param nodeId - ID of the node to unarchive
 * @returns New array with the node and descendants unarchived
 */
export function unarchiveNodeWithChildren(nodes: ChatNode[], nodeId: string): ChatNode[] {
  // Collect all nodes to unarchive (node + all descendants)
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

/**
 * Gets all archived nodes for a specific project.
 * @param nodes - Array of all nodes
 * @param projectId - The project ID to filter by
 * @returns Array of archived nodes in the project
 */
export function getArchivedNodes(nodes: ChatNode[], projectId: string): ChatNode[] {
  return nodes.filter(node => node.projectId === projectId && node.isArchived);
}

/**
 * Checks if a node has any non-archived children.
 * @param nodes - Array of all nodes
 * @param nodeId - ID of the node to check
 * @returns true if the node has non-archived children
 */
export function hasActiveChildren(nodes: ChatNode[], nodeId: string): boolean {
  return nodes.some(n => n.parentId === nodeId && !n.isArchived);
}

/**
 * Checks if a node is the root node of its project.
 * @param nodes - Array of all nodes
 * @param nodeId - ID of the node to check
 * @returns true if the node is a root node
 */
export function isRootNode(nodes: ChatNode[], nodeId: string): boolean {
  const node = nodes.find(n => n.id === nodeId);
  return node ? node.parentId === null : false;
}
