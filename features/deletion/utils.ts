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
 * Deletes a node and optionally its descendants.
 * @param nodes - Current array of nodes
 * @param nodeId - ID of the node to delete
 * @param activeNodeId - Currently active node ID
 * @param cascadeDelete - Whether to also delete child nodes (default: true)
 * @returns Object containing updated nodes and new active node ID
 */
export function deleteNode(
  nodes: ChatNode[],
  nodeId: string,
  activeNodeId: string | null,
  cascadeDelete: boolean = true
): NodeDeletionResult {
  const nodeToDelete = nodes.find(n => n.id === nodeId);
  if (!nodeToDelete) {
    return { updatedNodes: nodes, newActiveNodeId: activeNodeId };
  }

  // Collect all nodes to delete
  const nodesToDelete = new Set<string>([nodeId]);

  if (cascadeDelete) {
    // Find all descendant nodes
    const findDescendants = (parentId: string) => {
      nodes.forEach(node => {
        if (node.parentId === parentId && !nodesToDelete.has(node.id)) {
          nodesToDelete.add(node.id);
          findDescendants(node.id);
        }
      });
    };
    findDescendants(nodeId);
  }

  const updatedNodes = nodes.filter(n => !nodesToDelete.has(n.id));

  // Determine new active node if deleted node was active
  let newActiveNodeId = activeNodeId;
  if (activeNodeId && nodesToDelete.has(activeNodeId)) {
    // Set to parent of deleted node, or null
    newActiveNodeId = nodeToDelete.parentId;
  }

  return {
    updatedNodes,
    newActiveNodeId,
  };
}

/**
 * Gets all nodes that would be deleted if a specific node is deleted (cascade).
 * Useful for showing a confirmation dialog with deletion impact.
 * @param nodes - Array of all nodes
 * @param nodeId - ID of the node to check
 * @returns Array of nodes that would be deleted
 */
export function getNodesAffectedByDeletion(nodes: ChatNode[], nodeId: string): ChatNode[] {
  const affected: ChatNode[] = [];
  const nodeToDelete = nodes.find(n => n.id === nodeId);

  if (!nodeToDelete) return affected;

  affected.push(nodeToDelete);

  const findDescendants = (parentId: string) => {
    nodes.forEach(node => {
      if (node.parentId === parentId) {
        affected.push(node);
        findDescendants(node.id);
      }
    });
  };
  findDescendants(nodeId);

  return affected;
}

/**
 * Checks if a project can be safely deleted (confirmation helper).
 * @param nodes - Array of all nodes
 * @param projectId - ID of the project to check
 * @returns Number of nodes that would be deleted
 */
export function getProjectNodeCount(nodes: ChatNode[], projectId: string): number {
  return nodes.filter(n => n.projectId === projectId).length;
}
