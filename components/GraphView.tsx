
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { ChatNode, TreeDataNode, Project } from '../types';
import { buildHierarchy, buildArchivedHierarchy, getChildCount } from '../utils/treeUtils';
import { Plus, X, TreePine, Archive, Trash2, ArchiveRestore, Eye, EyeOff } from 'lucide-react';

// Helper function to wrap text into multiple lines
function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (lines.length >= maxLines) break;

    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is longer than maxChars, truncate it
        lines.push(word.substring(0, maxChars - 3) + '...');
        currentLine = '';
      }
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // Add ellipsis to last line if text was truncated
  if (lines.length === maxLines && words.length > lines.join(' ').split(' ').length) {
    const lastLine = lines[maxLines - 1];
    if (lastLine.length > maxChars - 3) {
      lines[maxLines - 1] = lastLine.substring(0, maxChars - 3) + '...';
    } else {
      lines[maxLines - 1] = lastLine + '...';
    }
  }

  return lines;
}

interface GraphViewProps {
  nodes: ChatNode[];
  projects: Project[];
  activeProjectId: string;
  activeNodeId: string | null;
  contextNodeIds: Set<string>;
  activePathIds: Set<string>;
  showArchived: boolean;
  onToggleShowArchived: () => void;
  onNodeClick: (id: string) => void;
  onToggleContext: (id: string) => void;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  onArchiveNode: (id: string) => void;
  onDeleteNode: (id: string) => void;
  onUnarchiveNode: (id: string) => void;
}

interface TooltipData {
  x: number;
  y: number;
  node: ChatNode;
}

interface NodeActionsData {
  x: number;
  y: number;
  nodeId: string;
  nodeSummary: string;
}

const GraphView: React.FC<GraphViewProps> = ({
  nodes,
  projects,
  activeProjectId,
  activeNodeId,
  contextNodeIds,
  activePathIds,
  showArchived,
  onToggleShowArchived,
  onNodeClick,
  onToggleContext,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onArchiveNode,
  onDeleteNode,
  onUnarchiveNode
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [nodeActions, setNodeActions] = useState<NodeActionsData | null>(null);

  const treeData = useMemo(() => {
    if (showArchived) {
      return buildArchivedHierarchy(nodes, activeProjectId);
    }
    return buildHierarchy(nodes, activeProjectId);
  }, [nodes, activeProjectId, showArchived]);

  // Count archived nodes for badge
  const archivedCount = useMemo(() => {
    return nodes.filter(n => n.projectId === activeProjectId && n.isArchived).length;
  }, [nodes, activeProjectId]);

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
        // Hide node actions when zooming/panning
        setNodeActions(null);
      });

    svg.call(zoom);

    const treeLayout = d3.tree<TreeDataNode>()
      .nodeSize([280, 220])
      .separation((a, b) => a.parent === b.parent ? 1.4 : 1.8);

    const root = d3.hierarchy(treeData);
    const tree = treeLayout(root);

    // Links - amber for archived view, green for normal
    g.append("g")
      .attr("fill", "none")
      .attr("stroke", showArchived ? "#fcd34d" : "#86efac")
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
        event.stopPropagation();
        if (event.shiftKey) {
          onToggleContext(d.data.id);
        } else {
          onNodeClick(d.data.id);
        }
      })
      .on("contextmenu", (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setNodeActions({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            nodeId: d.data.id,
            nodeSummary: d.data.name
          });
        }
      })
      .on("mouseenter", function(event, d) {
        const isManualContext = contextNodeIds.has(d.data.id);
        const isInActivePath = activePathIds.has(d.data.id);
        const isInContext = isManualContext || isInActivePath;
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
      const isManualContext = contextNodeIds.has(d.data.id);
      const isInActivePath = activePathIds.has(d.data.id);
      const isInContext = isManualContext || isInActivePath;
      const isActive = d.data.id === activeNodeId;
      const children = getChildCount(nodes, d.data.id);

      if (isInContext) {
        // Large expanded card for context nodes
        const cardWidth = 220;
        const cardHeight = 140;

        // Main card background - amber for archived, green for normal
        el.append("rect")
          .attr("x", -cardWidth / 2)
          .attr("y", -cardHeight / 2)
          .attr("width", cardWidth)
          .attr("height", cardHeight)
          .attr("rx", 12)
          .attr("fill", showArchived ? "#fffbeb" : "white")
          .attr("stroke", showArchived
            ? (isActive ? "#d97706" : "#fcd34d")
            : (isActive ? "#16a34a" : "#86efac"))
          .attr("stroke-width", isActive ? 3 : 1.5)
          .style("filter", "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))");

        // Top connector line (dashed)
        el.append("line")
          .attr("x1", 0)
          .attr("y1", -cardHeight / 2 - 15)
          .attr("x2", 0)
          .attr("y2", -cardHeight / 2)
          .attr("stroke", showArchived ? "#fcd34d" : "#86efac")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,4");

        // Title row with icon
        el.append("rect")
          .attr("x", -cardWidth / 2 + 12)
          .attr("y", -cardHeight / 2 + 12)
          .attr("width", 20)
          .attr("height", 20)
          .attr("rx", 4)
          .attr("fill", showArchived ? "#fef3c7" : "#dcfce7");

        el.append("text")
          .attr("x", -cardWidth / 2 + 22)
          .attr("y", -cardHeight / 2 + 26)
          .attr("text-anchor", "middle")
          .attr("fill", showArchived ? "#d97706" : "#22c55e")
          .style("font-size", "12px")
          .text(showArchived ? "📦" : "💬");

        // Title text
        el.append("text")
          .attr("x", -cardWidth / 2 + 40)
          .attr("y", -cardHeight / 2 + 27)
          .attr("fill", showArchived ? "#92400e" : "#166534")
          .style("font-size", "13px")
          .style("font-weight", "600")
          .text(() => {
            const text = d.data.name;
            return text.length > 16 ? text.substring(0, 13) + "..." : text;
          });

        // Action buttons group (Archive/Unarchive & Delete)
        // Skip for virtual root node
        if (d.data.id !== '__archived_root__') {
          const actionsGroup = el.append("g")
            .attr("class", "node-actions")
            .attr("transform", `translate(${cardWidth / 2 - 44}, ${-cardHeight / 2 + 12})`);

          if (showArchived) {
            // Unarchive button (when viewing archived nodes)
            actionsGroup.append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", 18)
              .attr("height", 18)
              .attr("rx", 4)
              .attr("fill", "#d1fae5")
              .attr("class", "unarchive-btn")
              .style("cursor", "pointer")
              .on("click", (event) => {
                event.stopPropagation();
                onUnarchiveNode(d.data.id);
              })
              .on("mouseenter", function() {
                d3.select(this).attr("fill", "#a7f3d0");
              })
              .on("mouseleave", function() {
                d3.select(this).attr("fill", "#d1fae5");
              });

            actionsGroup.append("text")
              .attr("x", 9)
              .attr("y", 13)
              .attr("text-anchor", "middle")
              .attr("fill", "#059669")
              .style("font-size", "10px")
              .style("pointer-events", "none")
              .text("↩");
          } else {
            // Archive button (when viewing active nodes)
            actionsGroup.append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", 18)
              .attr("height", 18)
              .attr("rx", 4)
              .attr("fill", "#fef3c7")
              .attr("class", "archive-btn")
              .style("cursor", "pointer")
              .on("click", (event) => {
                event.stopPropagation();
                onArchiveNode(d.data.id);
              })
              .on("mouseenter", function() {
                d3.select(this).attr("fill", "#fde68a");
              })
              .on("mouseleave", function() {
                d3.select(this).attr("fill", "#fef3c7");
              });

            actionsGroup.append("text")
              .attr("x", 9)
              .attr("y", 13)
              .attr("text-anchor", "middle")
              .attr("fill", "#d97706")
              .style("font-size", "10px")
              .style("pointer-events", "none")
              .text("📦");
          }

          // Delete button (always shown)
          actionsGroup.append("rect")
            .attr("x", 22)
            .attr("y", 0)
            .attr("width", 18)
            .attr("height", 18)
            .attr("rx", 4)
            .attr("fill", "#fee2e2")
            .attr("class", "delete-btn")
            .style("cursor", "pointer")
            .on("click", (event) => {
              event.stopPropagation();
              onDeleteNode(d.data.id);
            })
            .on("mouseenter", function() {
              d3.select(this).attr("fill", "#fecaca");
            })
            .on("mouseleave", function() {
              d3.select(this).attr("fill", "#fee2e2");
            });

          actionsGroup.append("text")
            .attr("x", 31)
            .attr("y", 13)
            .attr("text-anchor", "middle")
            .attr("fill", "#dc2626")
            .style("font-size", "10px")
            .style("pointer-events", "none")
            .text("🗑");
        }

        // Question section
        el.append("text")
          .attr("x", -cardWidth / 2 + 12)
          .attr("y", -cardHeight / 2 + 50)
          .attr("fill", "#6b7280")
          .style("font-size", "10px")
          .style("font-weight", "500")
          .text("Question");

        // Question content (multi-line)
        const questionText = d.data.data.userPrompt;
        const questionLines = wrapText(questionText, 32, 2);
        questionLines.forEach((line, i) => {
          el.append("text")
            .attr("x", -cardWidth / 2 + 12)
            .attr("y", -cardHeight / 2 + 64 + (i * 12))
            .attr("fill", "#1f2937")
            .style("font-size", "11px")
            .text(line);
        });

        // Divider line
        el.append("line")
          .attr("x1", -cardWidth / 2 + 12)
          .attr("y1", -cardHeight / 2 + 90)
          .attr("x2", cardWidth / 2 - 12)
          .attr("y2", -cardHeight / 2 + 90)
          .attr("stroke", "#e5e7eb")
          .attr("stroke-width", 1);

        // Answer section
        el.append("text")
          .attr("x", -cardWidth / 2 + 12)
          .attr("y", -cardHeight / 2 + 105)
          .attr("fill", "#6b7280")
          .style("font-size", "10px")
          .style("font-weight", "500")
          .text("Answer");

        // Answer content (multi-line)
        const answerText = d.data.data.assistantResponse;
        const answerLines = wrapText(answerText, 32, 2);
        answerLines.forEach((line, i) => {
          el.append("text")
            .attr("x", -cardWidth / 2 + 12)
            .attr("y", -cardHeight / 2 + 119 + (i * 12))
            .attr("fill", "#1f2937")
            .style("font-size", "11px")
            .text(line);
        });

      } else {
        // Small faded dot for non-context nodes - amber for archived, green for normal
        el.append("circle")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", isActive ? 10 : 6)
          .attr("fill", () => {
            if (showArchived) {
              if (isActive) return "#fbbf24";
              if (children > 1) return "#fcd34d";
              return "#fde68a";
            }
            if (isActive) return "#4ade80";
            if (children > 1) return "#86efac";
            return "#bbf7d0";
          })
          .attr("stroke", isActive ? (showArchived ? "#d97706" : "#16a34a") : "transparent")
          .attr("stroke-width", isActive ? 2 : 0)
          .attr("opacity", isActive ? 1 : 0.6);

        // Small label only for active node
        if (isActive) {
          el.append("text")
            .attr("dy", 20)
            .attr("text-anchor", "middle")
            .attr("fill", showArchived ? "#92400e" : "#166534")
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

  }, [treeData, nodes, activeNodeId, contextNodeIds, activePathIds, showArchived, onNodeClick, onToggleContext, onArchiveNode, onDeleteNode, onUnarchiveNode]);

  // Close node actions when clicking elsewhere
  const handleContainerClick = () => {
    setNodeActions(null);
  };

  return (
    <div className={`h-full flex flex-col ${showArchived ? 'bg-amber-50' : 'bg-green-50'}`}>
      {/* Header with Logo and Archive Toggle */}
      <div className="px-4 py-3 border-b border-green-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TreePine className="w-5 h-5 text-green-600" />
          <span className="font-bold text-green-800">Canopy</span>
        </div>
        {/* Archive Toggle */}
        <button
          onClick={onToggleShowArchived}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            showArchived
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
          title={showArchived ? 'Return to active nodes' : 'View archived nodes'}
        >
          {showArchived ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Unarchived</span>
              {archivedCount > 0 && (
                <span className="bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full text-[10px]">
                  {archivedCount}
                </span>
              )}
            </>
          ) : (
            <>
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
              {archivedCount > 0 && (
                <span className="bg-green-200 text-green-700 px-1.5 py-0.5 rounded-full text-[10px]">
                  {archivedCount}
                </span>
              )}
            </>
          )}
        </button>
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
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onClick={handleContainerClick}
      >
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
              Click to select • Shift+click for context • Right-click for actions
            </div>
          </div>
        )}

        {/* Node Actions Context Menu (for right-click on condensed nodes) */}
        {nodeActions && (
          <div
            className="absolute z-50 bg-white border border-green-200 rounded-lg shadow-xl p-1 min-w-[140px]"
            style={{
              left: nodeActions.x,
              top: nodeActions.y,
              transform: nodeActions.x > (containerRef.current?.clientWidth || 0) / 2 ? 'translateX(-100%)' : undefined
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1 text-xs font-medium text-green-700 border-b border-green-100 mb-1 truncate">
              {nodeActions.nodeSummary}
            </div>
            {showArchived ? (
              <button
                onClick={() => {
                  onUnarchiveNode(nodeActions.nodeId);
                  setNodeActions(null);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-green-700 hover:bg-green-50 rounded transition-colors"
              >
                <ArchiveRestore className="w-3 h-3" />
                Unarchive
              </button>
            ) : (
              <button
                onClick={() => {
                  onArchiveNode(nodeActions.nodeId);
                  setNodeActions(null);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-amber-700 hover:bg-amber-50 rounded transition-colors"
              >
                <Archive className="w-3 h-3" />
                Archive
              </button>
            )}
            <button
              onClick={() => {
                onDeleteNode(nodeActions.nodeId);
                setNodeActions(null);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
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
