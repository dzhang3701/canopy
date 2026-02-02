/**
 * Deletion Feature - Type Definitions
 *
 * This module contains all type definitions related to deletion functionality.
 */

import { ChatNode, Project } from '../../types';

/**
 * Result of a project deletion operation.
 */
export interface ProjectDeletionResult {
  updatedProjects: Project[];
  updatedNodes: ChatNode[];
  newActiveProjectId: string | null;
  newActiveNodeId: string | null;
}

/**
 * Result of a node deletion operation.
 */
export interface NodeDeletionResult {
  updatedNodes: ChatNode[];
  newActiveNodeId: string | null;
}
