import type { LayoutNode } from '../../types';
import { cn } from '../../utils/cn';

interface GraphEdgeProps {
  from: LayoutNode;
  to: LayoutNode;
  isOnActivePath?: boolean;
}

export function GraphEdge({ from, to, isOnActivePath }: GraphEdgeProps) {
  // Calculate edge path (curved line from bottom of parent to top of child)
  const startX = from.x + from.width / 2;
  const startY = from.y + from.height;
  const endX = to.x + to.width / 2;
  const endY = to.y;

  // Control points for smooth curve
  const midY = (startY + endY) / 2;

  const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

  return (
    <path
      d={path}
      fill="none"
      className={cn(
        'transition-colors',
        isOnActivePath
          ? 'stroke-blue-500 stroke-2'
          : 'stroke-gray-300 stroke-1'
      )}
    />
  );
}
