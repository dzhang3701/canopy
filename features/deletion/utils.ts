/**
 * Deletion Feature - Utility Functions
 *
 * This module contains utility functions for deletion operations.
 * Handles both project deletion and node deletion with cascading effects.
 */

import { ChatNode, Project } from '../../types';
import { ProjectDeletionResult, NodeDeletionResult } from './types';

/**
 * Deletes a project and all its associated nodes.
 * @param projects - Current array of projects
 * @param nodes - Current array of nodes
 * @param projectId - ID of the project to delete
 * @param activeProjectId - Currently active project ID
 * @returns Object containing updated projects, nodes, and new active IDs
 */
export function deleteProject(
  projects: Project[],
  nodes: ChatNode[],
  projectId: string,
  activeProjectId: string | null
): ProjectDeletionResult {
  const updatedProjects = projects.filter(p => p.id !== projectId);
  const updatedNodes = nodes.filter(n => n.projectId !== projectId);

  // Determine new active project if the deleted one was active
  let newActiveProjectId = activeProjectId;
  let newActiveNodeId: string | null = null;

  if (activeProjectId === projectId) {
    newActiveProjectId = updatedProjects[0]?.id || null;
  }

  return {
    updatedProjects,
    updatedNodes,
    newActiveProjectId,
    newActiveNodeId,
  };
}

/**
 * Deletes a single node and promotes its children to its parent.
 * @param nodes - Current array of nodes
 * @param nodeId - ID of the node to delete
 * @param activeNodeId - Currently active node ID
 * @returns Object containing updated nodes and new active node ID
 */
export function deleteNodeOnly(
  nodes: ChatNode[],
  nodeId: string,
  activeNodeId: string | null
): NodeDeletionResult {
  const nodeToDelete = nodes.find(n => n.id === nodeId);
  if (!nodeToDelete) {
    return { updatedNodes: nodes, newActiveNodeId: activeNodeId };
  }

  // Promote children to the deleted node's parent
  const updatedNodes = nodes
    .filter(n => n.id !== nodeId)
    .map(node => {
      if (node.parentId === nodeId) {
        return { ...node, parentId: nodeToDelete.parentId };
      }
      return node;
    });

  // Determine new active node
  let newActiveNodeId = activeNodeId;
  if (activeNodeId === nodeId) {
    newActiveNodeId = nodeToDelete.parentId;
  }

  return {
    updatedNodes,
    newActiveNodeId,
  };
}

/**
 * Deletes a node and all its descendants.
 * @param nodes - Current array of nodes
 * @param nodeId - ID of the node to delete
 * @param activeNodeId - Currently active node ID
 * @returns Object containing updated nodes and new active node ID
 */
export function deleteNodeWithChildren(
  nodes: ChatNode[],
  nodeId: string,
  activeNodeId: string | null
): NodeDeletionResult {
  const nodeToDelete = nodes.find(n => n.id === nodeId);
  if (!nodeToDelete) {
    return { updatedNodes: nodes, newActiveNodeId: activeNodeId };
  }

  // Collect all nodes to delete (node + all descendants)
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

  // Determine new active node
  let newActiveNodeId = activeNodeId;
  if (activeNodeId && nodesToDelete.has(activeNodeId)) {
    newActiveNodeId = nodeToDelete.parentId;
  }

  return {
    updatedNodes,
    newActiveNodeId,
  };
}

/**
 * Deletes all children of a node but keeps the node itself.
 * Useful for clearing a subtree while preserving the root.
 * @param nodes - Current array of nodes
 * @param nodeId - ID of the node whose children should be deleted
 * @param activeNodeId - Currently active node ID
 * @returns Object containing updated nodes and new active node ID
 */
export function deleteChildrenOnly(
  nodes: ChatNode[],
  nodeId: string,
  activeNodeId: string | null
): NodeDeletionResult {
  // Collect all descendants (not the node itself)
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

  // Determine new active node
  let newActiveNodeId = activeNodeId;
  if (activeNodeId && nodesToDelete.has(activeNodeId)) {
    newActiveNodeId = nodeId; // Set to the parent node we kept
  }

  return {
    updatedNodes,
    newActiveNodeId,
  };
}

/**
 * Checks if a node has any children.
 * @param nodes - Array of all nodes
 * @param nodeId - ID of the node to check
 * @returns true if the node has children
 */
export function hasChildren(nodes: ChatNode[], nodeId: string): boolean {
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

/**
 * Gets the count of nodes that would be deleted.
 * @param nodes - Array of all nodes
 * @param nodeId - ID of the node to check
 * @param includeChildren - Whether to count children
 * @returns Number of nodes that would be deleted
 */
export function getDeleteCount(
  nodes: ChatNode[],
  nodeId: string,
  includeChildren: boolean
): number {
  if (!includeChildren) return 1;

  let count = 1;
  const countDescendants = (parentId: string) => {
    nodes.forEach(node => {
      if (node.parentId === parentId) {
        count++;
        countDescendants(node.id);
      }
    });
  };
  countDescendants(nodeId);

  return count;
}
