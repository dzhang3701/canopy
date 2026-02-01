import { useMemo } from 'react';
import type { ConversationNode, NodeStatus } from '../types';
import { getNodeStatus } from '../types';

interface NodeColorInfo {
  status: NodeStatus;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

const colorMap: Record<NodeStatus, NodeColorInfo> = {
  root: {
    status: 'root',
    bgColor: 'bg-purple-500',
    borderColor: 'border-purple-600',
    textColor: 'text-purple-600',
  },
  linear: {
    status: 'linear',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-600',
    textColor: 'text-blue-600',
  },
  branch: {
    status: 'branch',
    bgColor: 'bg-green-500',
    borderColor: 'border-green-600',
    textColor: 'text-green-600',
  },
  archived: {
    status: 'archived',
    bgColor: 'bg-gray-400',
    borderColor: 'border-gray-500',
    textColor: 'text-gray-500',
  },
};

export function useNodeColors(node: ConversationNode): NodeColorInfo {
  return useMemo(() => {
    const status = getNodeStatus(node);
    return colorMap[status];
  }, [node]);
}
