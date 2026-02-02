/**
 * Archive Feature - Type Definitions
 *
 * This module contains all type definitions related to the archive functionality.
 * Archive allows users to hide nodes from view without deleting them.
 */

/**
 * Properties that make a node archivable.
 * This is mixed into the ChatNode interface.
 */
export interface ArchivableNode {
  isArchived: boolean;
}
