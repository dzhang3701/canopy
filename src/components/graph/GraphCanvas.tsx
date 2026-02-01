import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { ConversationNode, LayoutNode } from '../../types';
import { calculateTreeLayout } from '../../lib/tree';
import { getAncestorPath } from '../../lib/tree';
import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';
import { GraphControls } from './GraphControls';

interface GraphCanvasProps {
  nodes: Map<string, ConversationNode>;
  rootId: string | null;
  activeNodeId: string | null;
  showArchived: boolean;
  onNodeSelect: (nodeId: string) => void;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 2;
const ZOOM_STEP = 0.1;
const PADDING = 50;

export function GraphCanvas({
  nodes,
  rootId,
  activeNodeId,
  showArchived,
  onNodeSelect,
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate tree layout
  const { layout, bounds } = useMemo(
    () => calculateTreeLayout(nodes, rootId, { showArchived }),
    [nodes, rootId, showArchived]
  );

  // Get active path for highlighting
  const activePath = useMemo(() => {
    if (!activeNodeId) return new Set<string>();
    const ancestors = getAncestorPath(nodes, activeNodeId);
    const pathIds = new Set(ancestors.map((n) => n.id));
    pathIds.add(activeNodeId);
    return pathIds;
  }, [nodes, activeNodeId]);

  // Collect edges
  const edges = useMemo(() => {
    const result: { from: LayoutNode; to: LayoutNode; isOnActivePath: boolean }[] = [];
    layout.forEach((layoutNode) => {
      if (layoutNode.parentId) {
        const parentLayout = layout.get(layoutNode.parentId);
        if (parentLayout) {
          const isOnActivePath =
            activePath.has(layoutNode.id) && activePath.has(layoutNode.parentId);
          result.push({ from: parentLayout, to: layoutNode, isOnActivePath });
        }
      }
    });
    return result;
  }, [layout, activePath]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setViewport((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setViewport((v) => ({
      ...v,
      scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale + delta)),
    }));
  }, []);

  // Control handlers
  const handleZoomIn = useCallback(() => {
    setViewport((v) => ({
      ...v,
      scale: Math.min(MAX_SCALE, v.scale + ZOOM_STEP),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewport((v) => ({
      ...v,
      scale: Math.max(MIN_SCALE, v.scale - ZOOM_STEP),
    }));
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (!svgRef.current || bounds.width === 0) return;

    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = (rect.width - PADDING * 2) / bounds.width;
    const scaleY = (rect.height - PADDING * 2) / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1);

    const x = (rect.width - bounds.width * scale) / 2 - bounds.minX * scale;
    const y = (rect.height - bounds.height * scale) / 2 - bounds.minY * scale + PADDING;

    setViewport({ x, y, scale });
  }, [bounds]);

  const handleReset = useCallback(() => {
    setViewport({ x: 0, y: 0, scale: 1 });
  }, []);

  // Fit to screen on initial render
  useEffect(() => {
    if (layout.size > 0) {
      handleFitToScreen();
    }
  }, [layout.size]); // eslint-disable-line react-hooks/exhaustive-deps

  if (layout.size === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Start a conversation to see the graph.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-gray-50 overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.scale})`}>
          {/* Edges (render first so nodes appear on top) */}
          {edges.map(({ from, to, isOnActivePath }, index) => (
            <GraphEdge
              key={`edge-${index}`}
              from={from}
              to={to}
              isOnActivePath={isOnActivePath}
            />
          ))}

          {/* Nodes */}
          {Array.from(layout.entries()).map(([nodeId, layoutNode]) => {
            const node = nodes.get(nodeId);
            if (!node) return null;

            return (
              <GraphNode
                key={nodeId}
                node={node}
                layout={layoutNode}
                isActive={nodeId === activeNodeId}
                onClick={() => onNodeSelect(nodeId)}
              />
            );
          })}
        </g>
      </svg>

      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={handleFitToScreen}
        onReset={handleReset}
        scale={viewport.scale}
      />
    </div>
  );
}
