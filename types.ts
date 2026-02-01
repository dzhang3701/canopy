
export interface ChatNode {
  id: string;
  parentId: string | null;
  projectId: string;
  summary: string;
  userPrompt: string;
  assistantResponse: string;
  timestamp: number;
  isArchived: boolean;
  isCollapsed: boolean;
}

export interface Project {
  id: string;
  name: string;
  icon: string;
  createdAt: number;
}

export enum ViewMode {
  LINEAR = 'LINEAR',
  GRAPH = 'GRAPH'
}

export interface TreeDataNode {
  id: string;
  name: string;
  children?: TreeDataNode[];
  data: ChatNode;
}

export interface ApiUsageStats {
  totalCalls: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}
