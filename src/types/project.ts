export interface Project {
  id: string;
  name: string;
  rootNodeId: string | null;
  activeNodeId: string | null;
  systemPrompt: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
}
