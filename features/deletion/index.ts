/**
 * Deletion Feature
 *
 * This feature handles the deletion of projects and nodes.
 * Includes cascade deletion support and proper state management
 * for active project/node updates after deletion.
 *
 * Exports:
 * - Types: ProjectDeletionResult, NodeDeletionResult
 * - Utils: deleteProject, deleteNode, getNodesAffectedByDeletion, etc.
 */

export * from './types';
export * from './utils';
