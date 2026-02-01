export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ConversationNode {
  id: string;
  projectId: string;
  userMessage: Message;
  assistantMessage: Message | null;
  parentId: string | null;
  childIds: string[];
  summary: string;
  isArchived: boolean;
  isCollapsed: boolean;
  createdAt: number;
}

export type NodeStatus = 'root' | 'linear' | 'branch' | 'archived';

export function getNodeStatus(node: ConversationNode): NodeStatus {
  if (node.isArchived) return 'archived';
  if (node.parentId === null) return 'root';
  if (node.childIds.length >= 2) return 'branch';
  return 'linear';
}
