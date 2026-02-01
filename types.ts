
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

export interface TreeDataNode {
  id: string;
  name: string;
  children?: TreeDataNode[];
  data: ChatNode;
}
