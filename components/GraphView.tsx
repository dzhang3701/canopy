
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { ChatNode, TreeDataNode, Project } from '../types';
import { buildHierarchy, getChildCount } from '../utils/treeUtils';
import { Plus, X, TreePine } from 'lucide-react';

interface GraphViewProps {
  nodes: ChatNode[];
  projects: Project[];
  activeProjectId: string;
  activeNodeId: string | null;
  contextNodeIds: Set<string>;
  onNodeClick: (id: string) => void;
  onToggleContext: (id: string) => void;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
}

interface TooltipData {
  x: number;
  y: number;
  node: ChatNode;
}

const GraphView: React.FC<GraphViewProps> = ({
  nodes,
  projects,
  activeProjectId,
  activeNodeId,
  contextNodeIds,
  onNodeClick,
  onToggleContext,
  onSelectProject,
  onCreateProject,
  onDeleteProject
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
      .nodeSize([220, 160])
      .separation((a, b) => a.parent === b.parent ? 1.3 : 1.6);

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
        // Large card for context nodes (Nodini style)
        el.append("rect")
          .attr("x", -90)
          .attr("y", -45)
          .attr("width", 180)
          .attr("height", 90)
          .attr("rx", 12)
          .attr("fill", "white")
          .attr("stroke", isActive ? "#16a34a" : "#4ade80")
          .attr("stroke-width", isActive ? 3 : 2)
          .style("filter", "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))");

        // Context indicator dot
        el.append("circle")
          .attr("cx", 75)
          .attr("cy", -35)
          .attr("r", 8)
          .attr("fill", "#22c55e");

        // Summary label
        el.append("text")
          .attr("y", -15)
          .attr("text-anchor", "middle")
          .attr("fill", "#166534")
          .style("font-size", "12px")
          .style("font-weight", "600")
          .text(() => {
            const text = d.data.name;
            return text.length > 18 ? text.substring(0, 15) + "..." : text;
          });

        // User prompt preview
        el.append("text")
          .attr("y", 5)
          .attr("text-anchor", "middle")
          .attr("fill", "#4ade80")
          .style("font-size", "10px")
          .text(() => {
            const text = d.data.data.userPrompt;
            return text.length > 25 ? text.substring(0, 22) + "..." : text;
          });

        // Timestamp
        el.append("text")
          .attr("y", 25)
          .attr("text-anchor", "middle")
          .attr("fill", "#86efac")
          .style("font-size", "9px")
          .text(() => new Date(d.data.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      } else {
        // Small faded dot for non-context nodes
        el.append("circle")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", isActive ? 10 : 6)
          .attr("fill", () => {
            if (isActive) return "#4ade80";
            if (children > 1) return "#86efac";
            return "#bbf7d0";
          })
          .attr("stroke", isActive ? "#16a34a" : "transparent")
          .attr("stroke-width", isActive ? 2 : 0)
          .attr("opacity", isActive ? 1 : 0.6);

        // Small label only for active node
        if (isActive) {
          el.append("text")
            .attr("dy", 20)
            .attr("text-anchor", "middle")
            .attr("fill", "#166534")
            .style("font-size", "9px")
            .style("font-weight", "500")
            .text(() => {
              const text = d.data.name;
              return text.length > 12 ? text.substring(0, 9) + "..." : text;
            });
        }
      }
    });

    // Center the graph
    const initialScale = 0.85;
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, 80)
      .scale(initialScale);

    svg.call(zoom.transform, initialTransform);

  }, [treeData, nodes, activeNodeId, contextNodeIds, onNodeClick, onToggleContext]);

  return (
    <div className="h-full flex flex-col bg-green-50">
      {/* Header with Logo */}
      <div className="px-4 py-3 border-b border-green-200 bg-white flex items-center gap-2">
        <TreePine className="w-5 h-5 text-green-600" />
        <span className="font-bold text-green-800">Canopy</span>
      </div>

      {/* Project Tabs */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-green-200 bg-white overflow-x-auto">
        {projects.map(project => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeProjectId === project.id
                ? 'bg-green-100 text-green-700'
                : 'text-green-500 hover:bg-green-50 hover:text-green-600'
            }`}
          >
            <span>{project.icon}</span>
            <span>{project.name}</span>
            {projects.length > 1 && (
              <X
                className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProject(project.id);
                }}
              />
            )}
          </button>
        ))}
        <button
          onClick={onCreateProject}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-green-400 hover:text-green-600 hover:bg-green-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Graph Area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
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
              <div className="w-3 h-3 rounded bg-white border-2 border-green-400"></div>
              <span>In Context</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-300 opacity-60"></div>
              <span>Condensed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphView;
