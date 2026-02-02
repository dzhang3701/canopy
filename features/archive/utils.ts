/**
 * Archive Feature - Utility Functions
 *
 * This module contains utility functions for archive-related operations.
 * These functions handle filtering and managing archived nodes.
 */

import { ChatNode } from '../../types';

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
 * Archives a node by ID within an array of nodes.
 * @param nodes - Array of all nodes
 * @param nodeId - ID of the node to archive
 * @returns New array with the specified node archived
 */
export function archiveNode(nodes: ChatNode[], nodeId: string): ChatNode[] {
  return nodes.map(node =>
    node.id === nodeId ? { ...node, isArchived: true } : node
  );
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
 * Gets all archived nodes for a specific project.
 * @param nodes - Array of all nodes
 * @param projectId - The project ID to filter by
 * @returns Array of archived nodes in the project
 */
export function getArchivedNodes(nodes: ChatNode[], projectId: string): ChatNode[] {
  return nodes.filter(node => node.projectId === projectId && node.isArchived);
}
