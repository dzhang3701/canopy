
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { ChatNode, TreeDataNode } from '../types';
import { buildHierarchy, getChildCount } from '../utils/treeUtils';

interface GraphViewProps {
  nodes: ChatNode[];
  activeProjectId: string;
  activeNodeId: string | null;
  onNodeClick: (id: string) => void;
  showArchived: boolean;
}

const GraphView: React.FC<GraphViewProps> = ({ nodes, activeProjectId, activeNodeId, onNodeClick, showArchived }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const treeData = useMemo(() => buildHierarchy(nodes, activeProjectId, showArchived), [nodes, activeProjectId, showArchived]);

  useEffect(() => {
    if (!treeData || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Clear previous
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 2])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Layout
    const treeLayout = d3.tree<TreeDataNode>()
      .nodeSize([240, 140])
      .separation((a, b) => a.parent === b.parent ? 1.2 : 1.5);

    const root = d3.hierarchy(treeData);
    const tree = treeLayout(root);

    // Links
    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#334155")
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
      .on("click", (event, d) => onNodeClick(d.data.id));

    // Node Cards
    node.append("rect")
      .attr("x", -100)
      .attr("y", -30)
      .attr("width", 200)
      .attr("height", 60)
      .attr("rx", 8)
      .attr("fill", d => d.data.data.isArchived ? "#451a03" : "#1e293b")
      .attr("stroke", d => {
        if (d.data.data.isArchived) return "#f59e0b"; // Amber for archived
        if (d.data.id === activeNodeId) return "#3b82f6";
        const children = getChildCount(nodes, d.data.id);
        if (children > 1) return "#10b981"; // Green for branch
        if (children === 1) return "#3b82f6"; // Blue for linear
        return "#475569"; // Gray for leaf
      })
      .attr("stroke-width", d => d.data.id === activeNodeId ? 3 : 2)
      .attr("opacity", d => d.data.data.isArchived ? 0.7 : 1)
      .attr("class", d => d.data.id === activeNodeId ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "");

    // Node Labels
    node.append("text")
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#f1f5f9")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .text(d => {
        const text = d.data.name;
        return text.length > 25 ? text.substring(0, 22) + "..." : text;
      });

    // Sub-text (Timestamp)
    node.append("text")
      .attr("dy", "1.8em")
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .style("font-size", "10px")
      .text(d => new Date(d.data.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    // Center the graph
    const initialScale = 0.8;
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, 80)
      .scale(initialScale);
    
    svg.call(zoom.transform, initialTransform);

  }, [treeData, nodes, activeNodeId, onNodeClick]);

  return (
    <div ref={containerRef} className="flex-1 bg-slate-950 relative overflow-hidden">
      {!treeData && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-600">
          Empty project.
        </div>
      )}
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default GraphView;
