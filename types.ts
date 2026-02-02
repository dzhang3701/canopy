/**
 * Core Type Definitions
 *
 * This file contains the core types used throughout the application.
 * Feature-specific types are defined in their respective feature modules
 * and re-exported here for convenience.
 */

// Re-export feature types for backward compatibility
export type { ApiUsageStats, UsageMetadata } from './features/api-stats';
export type { ArchivableNode } from './features/archive';

export interface ChatNode {
  id: string;
  parentId: string | null;
  projectId: string;
  summary: string;
  userPrompt: string;
  assistantResponse: string;
  timestamp: number;
  isArchived: boolean;  // From archive feature
  isCollapsed: boolean;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

export interface TreeDataNode {
  id: string;
  name: string;
  children?: TreeDataNode[];
  data: ChatNode;
}
