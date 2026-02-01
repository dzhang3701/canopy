import type { ConversationNode, LayoutNode } from '../../types';
import { getNodeStatus } from '../../types';
import { cn } from '../../utils/cn';

interface GraphNodeProps {
  node: ConversationNode;
  layout: LayoutNode;
  isActive: boolean;
  onClick: () => void;
}

const statusColors = {
  root: 'bg-purple-500 border-purple-600',
  linear: 'bg-blue-500 border-blue-600',
  branch: 'bg-green-500 border-green-600',
  archived: 'bg-gray-400 border-gray-500',
};

const activeRing = {
  root: 'ring-purple-300',
  linear: 'ring-blue-300',
  branch: 'ring-green-300',
  archived: 'ring-gray-300',
};

export function GraphNode({ node, layout, isActive, onClick }: GraphNodeProps) {
  const status = getNodeStatus(node);

  return (
    <g
      transform={`translate(${layout.x}, ${layout.y})`}
      onClick={onClick}
      className="cursor-pointer"
    >
      {/* Node background */}
      <rect
        width={layout.width}
        height={layout.height}
        rx={8}
        className={cn(
          'fill-white stroke-2 transition-all',
          isActive ? 'stroke-blue-500' : 'stroke-gray-300',
          isActive && 'filter drop-shadow-md'
        )}
      />

      {/* Status indicator */}
      <rect
        x={0}
        y={0}
        width={8}
        height={layout.height}
        rx={4}
        ry={0}
        className={cn(statusColors[status])}
        style={{ clipPath: 'inset(0 0 0 0 round 8px 0 0 8px)' }}
      />

      {/* Active ring */}
      {isActive && (
        <rect
          x={-3}
          y={-3}
          width={layout.width + 6}
          height={layout.height + 6}
          rx={11}
          className={cn('fill-none stroke-2', activeRing[status])}
          strokeDasharray="4 2"
        />
      )}

      {/* Summary text */}
      <foreignObject x={16} y={8} width={layout.width - 24} height={layout.height - 16}>
        <div className="h-full flex flex-col justify-center overflow-hidden">
          <p className="text-xs font-medium text-gray-900 truncate">
            {node.summary}
          </p>
          {node.childIds.length > 1 && (
            <p className="text-xs text-gray-500 mt-0.5">
              {node.childIds.length} branches
            </p>
          )}
        </div>
      </foreignObject>

      {/* Collapse indicator */}
      {node.isCollapsed && node.childIds.length > 0 && (
        <circle
          cx={layout.width - 12}
          cy={layout.height / 2}
          r={8}
          className="fill-gray-200 stroke-gray-400"
        />
      )}
      {node.isCollapsed && node.childIds.length > 0 && (
        <text
          x={layout.width - 12}
          y={layout.height / 2 + 4}
          textAnchor="middle"
          className="text-xs fill-gray-600 select-none pointer-events-none"
        >
          +
        </text>
      )}
    </g>
  );
}
