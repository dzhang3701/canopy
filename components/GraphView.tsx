
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { ChatNode, TreeDataNode } from '../types';
import { buildHierarchy, getChildCount } from '../utils/treeUtils';

interface GraphViewProps {
  nodes: ChatNode[];
  activeProjectId: string;
  activeNodeId: string | null;
  contextNodeIds: Set<string>;
  onNodeClick: (id: string) => void;
  onToggleContext: (id: string) => void;
}

interface TooltipData {
  x: number;
  y: number;
  node: ChatNode;
}

const GraphView: React.FC<GraphViewProps> = ({
  nodes,
  activeProjectId,
  activeNodeId,
  contextNodeIds,
  onNodeClick,
  onToggleContext
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const treeData = useMemo(() => buildHierarchy(nodes, activeProjectId), [nodes, activeProjectId]);

  useEffect(() => {
    if (!treeData || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 2])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const treeLayout = d3.tree<TreeDataNode>()
      .nodeSize([180, 120])
      .separation((a, b) => a.parent === b.parent ? 1.2 : 1.5);

    const root = d3.hierarchy(treeData);
    const tree = treeLayout(root);

    // Links
    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#86efac")
      .attr("stroke-width", 2)
      .selectAll("path")
      .data(tree.links())
      .join("path")
      .attr("d", d3.linkVertical<any, any>()
        .x(d => d.x)
        .y(d => d.y));

    // Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(tree.descendants())
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        if (event.shiftKey) {
          onToggleContext(d.data.id);
        } else {
          onNodeClick(d.data.id);
        }
      })
      .on("mouseenter", function(event, d) {
        const isInContext = contextNodeIds.has(d.data.id);
        if (!isInContext) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltip({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              node: d.data.data
            });
          }
        }
      })
      .on("mouseleave", function() {
        setTooltip(null);
      });

    // Determine node appearance based on context
    node.each(function(d) {
      const el = d3.select(this);
      const isInContext = contextNodeIds.has(d.data.id);
      const isActive = d.data.id === activeNodeId;
      const children = getChildCount(nodes, d.data.id);

      if (isInContext) {
        // Full card for context nodes
        el.append("rect")
          .attr("x", -80)
          .attr("y", -25)
          .attr("width", 160)
          .attr("height", 50)
          .attr("rx", 8)
          .attr("fill", "#dcfce7")
          .attr("stroke", isActive ? "#16a34a" : "#4ade80")
          .attr("stroke-width", isActive ? 3 : 2);

        // Context indicator
        el.append("circle")
          .attr("cx", 70)
          .attr("cy", -15)
          .attr("r", 6)
          .attr("fill", "#22c55e");

        // Node label
        el.append("text")
          .attr("dy", "0em")
          .attr("text-anchor", "middle")
          .attr("fill", "#166534")
          .style("font-size", "11px")
          .style("font-weight", "500")
          .text(() => {
            const text = d.data.name;
            return text.length > 20 ? text.substring(0, 17) + "..." : text;
          });

        // Timestamp
        el.append("text")
          .attr("dy", "1.4em")
          .attr("text-anchor", "middle")
          .attr("fill", "#4ade80")
          .style("font-size", "9px")
          .text(() => new Date(d.data.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      } else {
        // Condensed dot for non-context nodes
        el.append("circle")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", isActive ? 12 : 8)
          .attr("fill", () => {
            if (isActive) return "#4ade80";
            if (children > 1) return "#22c55e";
            if (children === 1) return "#86efac";
            return "#bbf7d0";
          })
          .attr("stroke", isActive ? "#16a34a" : "#dcfce7")
          .attr("stroke-width", isActive ? 2 : 1);

        // Small label for active condensed node
        if (isActive) {
          el.append("text")
            .attr("dy", 24)
            .attr("text-anchor", "middle")
            .attr("fill", "#166534")
            .style("font-size", "9px")
            .style("font-weight", "500")
            .text(() => {
              const text = d.data.name;
              return text.length > 15 ? text.substring(0, 12) + "..." : text;
            });
        }
      }
    });

    // Center the graph
    const initialScale = 0.9;
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, 60)
      .scale(initialScale);

    svg.call(zoom.transform, initialTransform);

  }, [treeData, nodes, activeNodeId, contextNodeIds, onNodeClick, onToggleContext]);

  return (
    <div ref={containerRef} className="h-full bg-green-50 relative overflow-hidden">
      {!treeData && (
        <div className="absolute inset-0 flex items-center justify-center text-green-400">
          Empty project. Start a conversation.
        </div>
      )}
      <svg ref={svgRef} className="w-full h-full" />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 bg-white border border-green-200 rounded-lg shadow-lg p-3 max-w-xs pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            transform: tooltip.x > (containerRef.current?.clientWidth || 0) / 2 ? 'translateX(-100%)' : undefined
          }}
        >
          <div className="text-xs font-semibold text-green-700 mb-1 truncate">
            {tooltip.node.summary}
          </div>
          <div className="text-[10px] text-green-600 mb-2">
            <span className="font-medium">Q:</span> {tooltip.node.userPrompt.slice(0, 80)}...
          </div>
          <div className="text-[10px] text-green-500">
            <span className="font-medium">A:</span> {tooltip.node.assistantResponse.slice(0, 100)}...
          </div>
          <div className="text-[9px] text-green-400 mt-2 border-t border-green-100 pt-1">
            Click to select • Shift+click to add to context
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 border border-green-200 rounded-lg px-3 py-2 text-[10px] text-green-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>In Context</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-300"></div>
            <span>Condensed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphView;
