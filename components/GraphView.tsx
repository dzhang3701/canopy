
import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ChatNode, TreeDataNode, Project } from '../types';
import { buildHierarchy, buildArchivedHierarchy, getAncestorPath } from '../utils/treeUtils';
import { TreePalm, Moon, Sun, List, Network, Archive, Trash2, RotateCcw } from 'lucide-react';

interface GraphViewProps {
  nodes: ChatNode[];
  projects: Project[];
  activeProjectId: string;
  activeNodeId: string | null;
  contextNodeIds: Set<string>;
  activePathIds: Set<string>;
  focusNodeId: string | null;
  isDarkMode: boolean;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  onToggleDarkMode: () => void;
  showArchived: boolean;
  onToggleShowArchived: () => void;
  onNodeClick: (id: string) => void;
  onToggleContext: (id: string) => void;
  onArchiveNode: (id: string) => void;
  onDeleteNode: (id: string) => void;
  onUnarchiveNode: (id: string) => void;
}

const GraphView: React.FC<GraphViewProps> = ({
  nodes,
  activeProjectId,
  activeNodeId,
  contextNodeIds,
  activePathIds,
  focusNodeId,
  isDarkMode,
  sidebarExpanded,
  onToggleSidebar,
  onToggleDarkMode,
  showArchived,
  onToggleShowArchived,
  onNodeClick,
  onToggleContext,
  onArchiveNode,
  onDeleteNode,
  onUnarchiveNode
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const hasInitializedRef = useRef<boolean>(false);
  const prevProjectIdRef = useRef<string>(activeProjectId);
  const currentTransformRef = useRef<d3.ZoomTransform | null>(null);

  const treeData = useMemo(() => {
    if (showArchived) {
      return buildArchivedHierarchy(nodes, activeProjectId);
    }
    return buildHierarchy(nodes, activeProjectId, showArchived);
  }, [nodes, activeProjectId, showArchived]);

  const archivedCount = useMemo(() => {
    return nodes.filter(n => n.projectId === activeProjectId && n.isArchived).length;
  }, [nodes, activeProjectId]);

  // Handle resize with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const focusOnNode = useCallback((nodeId: string) => {
    if (!svgRef.current || !zoomRef.current || !containerSize.width || !containerSize.height) return;

    const pos = nodePositionsRef.current.get(nodeId);
    if (!pos) return;

    const svg = d3.select(svgRef.current);
    const scale = 1.0;

    const targetX = containerSize.width / 2 - pos.x * scale;
    const targetY = containerSize.height / 2 - pos.y * scale;

    const transform = d3.zoomIdentity
      .translate(targetX, targetY)
      .scale(scale);

    currentTransformRef.current = transform;
    svg.transition().duration(750).ease(d3.easeCubicInOut).call(zoomRef.current.transform, transform);
  }, [containerSize]);

  useEffect(() => {
    if (focusNodeId && sidebarExpanded) {
      const timer = setTimeout(() => {
        focusOnNode(focusNodeId);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [focusNodeId, focusOnNode, sidebarExpanded]);

  // Get path from root to active node for thin sidebar
  const pathToActive = useMemo(() => {
    if (!activeNodeId) return [];
    return getAncestorPath(nodes, activeNodeId);
  }, [nodes, activeNodeId]);

  // Get linear tail from active node until ambiguity
  const linearTail = useMemo(() => {
    if (!activeNodeId || sidebarExpanded) return [];

    const tail: ChatNode[] = [];
    let currentId = activeNodeId;

    while (true) {
      const children = nodes.filter(n => n.parentId === currentId && (showArchived || !n.isArchived));
      if (children.length === 1) {
        tail.push(children[0]);
        currentId = children[0].id;
      } else {
        break;
      }
    }
    return tail;
  }, [nodes, activeNodeId, sidebarExpanded, showArchived]);

  const lastNodeInLinearPath = linearTail.length > 0
    ? linearTail[linearTail.length - 1]
    : nodes.find(n => n.id === activeNodeId);

  // D3 Graph rendering for expanded mode
  useEffect(() => {
    if (!sidebarExpanded || !treeData || !svgRef.current || containerSize.width === 0) return;

    const width = containerSize.width;
    const height = containerSize.height;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        currentTransformRef.current = event.transform;
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    const treeLayout = d3.tree<TreeDataNode>()
      .nodeSize([180, 100])
      .separation((a, b) => a.parent === b.parent ? 1.2 : 1.4);

    const root = d3.hierarchy(treeData);
    const tree = treeLayout(root);

    // Store node positions
    nodePositionsRef.current.clear();
    tree.descendants().forEach(d => {
      nodePositionsRef.current.set(d.data.id, { x: d.x, y: d.y });
    });

    const linkColor = isDarkMode ? '#27272a' : '#e4e4e7';
    const activeLinkColor = isDarkMode ? '#22c55e' : '#16a34a';
    const textColor = isDarkMode ? '#a1a1aa' : '#52525b';
    const activeTextColor = isDarkMode ? '#4ade80' : '#15803d';
    const hoverGlow = isDarkMode ? 'rgba(74, 222, 128, 0.2)' : 'rgba(34, 197, 94, 0.15)';

    const linkGenerator = d3.linkVertical<any, any>()
      .x(d => d.x)
      .y(d => d.y);

    g.append("g")
      .attr("fill", "none")
      .attr("stroke-width", 2)
      .selectAll("path")
      .data(tree.links())
      .join("path")
      .attr("stroke", d => activePathIds.has(d.target.data.id) ? activeLinkColor : linkColor)
      .attr("opacity", d => activePathIds.has(d.target.data.id) ? 1 : 0.6)
      .attr("d", linkGenerator);

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
      });

    node.each(function (d) {
      const el = d3.select(this);
      const isActive = d.data.id === activeNodeId;
      const isInPath = activePathIds.has(d.data.id);
      const isInContext = contextNodeIds.has(d.data.id);

      const text = d.data.name || 'New';
      const maxCharWidth = 160;
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";

      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length * 7.5 > maxCharWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) lines.push(currentLine);

      const displayLines = lines.slice(0, 3);
      if (lines.length > 3) displayLines[2] = displayLines[2].substring(0, displayLines[2].length - 3) + "...";

      const lineHeight = 18;
      const rectPaddingX = 28;
      const rectPaddingY = 14;
      const rectHeight = Math.max(32, (displayLines.length * lineHeight) + rectPaddingY);
      const textWidth = Math.max(...displayLines.map(l => l.length * 7.5)) + rectPaddingX;

      const rect = el.append("rect")
        .attr("x", -textWidth / 2)
        .attr("y", -rectHeight / 2)
        .attr("width", textWidth)
        .attr("height", rectHeight)
        .attr("rx", 12)
        .attr("ry", 12)
        .attr("fill", isDarkMode ? '#18181b' : '#ffffff')
        .attr("stroke", isActive ? activeTextColor : isInPath ? activeLinkColor : linkColor)
        .attr("stroke-width", isActive ? 2 : 1.5)
        .attr("class", "node-pill")
        .style("filter", isActive ? `drop-shadow(0 0 8px ${hoverGlow})` : "none");

      const textEl = el.append("text")
        .attr("text-anchor", "middle")
        .attr("fill", isActive ? activeTextColor : isInPath ? activeLinkColor : textColor)
        .style("font-size", "13px")
        .style("font-weight", isActive ? "600" : "500")
        .style("pointer-events", "none");

      displayLines.forEach((line, i) => {
        textEl.append("tspan")
          .attr("x", 0)
          .attr("dy", i === 0
            ? -(displayLines.length - 1) * lineHeight / 2 + 4
            : lineHeight
          )
          .text(line);
      });

      if (isInContext) {
        el.append("circle")
          .attr("cx", textWidth / 2)
          .attr("cy", -rectHeight / 2)
          .attr("r", 5)
          .attr("fill", activeTextColor)
          .attr("stroke", isDarkMode ? '#09090b' : '#ffffff')
          .attr("stroke-width", 2);
      }

      el.on("mouseenter", function () {
        rect.transition().duration(200)
          .attr("stroke", activeTextColor)
          .attr("stroke-width", 2.5);
        if (isDarkMode) rect.style("fill", "#27272a");
      }).on("mouseleave", function () {
        rect.transition().duration(200)
          .attr("stroke", isActive ? activeTextColor : isInPath ? activeLinkColor : linkColor)
          .attr("stroke-width", isActive ? 2 : 1.5);
        if (isDarkMode) rect.style("fill", "#18181b");
      });
    });

    // Handle view initialization or project change
    if (!hasInitializedRef.current || activeProjectId !== prevProjectIdRef.current) {
      // Initial auto-centering on active node
      const activeNodeSelection = node.filter(d => d.data.id === activeNodeId);
      if (!activeNodeSelection.empty()) {
        const d = activeNodeSelection.datum();
        const scale = 1.0;
        const transform = d3.zoomIdentity
          .translate(width / 2 - d.x * scale, height / 2 - d.y * scale)
          .scale(scale);
        svg.transition().duration(750).ease(d3.easeCubicInOut).call(zoom.transform, transform);
        currentTransformRef.current = transform;
      } else {
        const initialScale = 0.8;
        const initialTransform = d3.zoomIdentity
          .translate(width / 2, 80)
          .scale(initialScale);
        svg.call(zoom.transform, initialTransform);
        currentTransformRef.current = initialTransform;
      }
      hasInitializedRef.current = true;
      prevProjectIdRef.current = activeProjectId;
    } else if (currentTransformRef.current) {
      svg.call(zoom.transform, currentTransformRef.current);
    }

  }, [treeData, nodes, activeNodeId, contextNodeIds, activePathIds, onNodeClick, onToggleContext, isDarkMode, sidebarExpanded, containerSize, activeProjectId]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (!activeNodeId) return;

      const projectNodes = nodes.filter(n => n.projectId === activeProjectId);
      const currentNode = projectNodes.find(n => n.id === activeNodeId);
      if (!currentNode) return;

      let nextNodeId: string | null = null;

      switch (e.key) {
        case 'ArrowUp':
          if (currentNode.parentId) {
            nextNodeId = currentNode.parentId;
          }
          break;
        case 'ArrowDown':
          const children = projectNodes.filter(n => n.parentId === activeNodeId && (showArchived || !n.isArchived))
            .sort((a, b) => a.timestamp - b.timestamp);
          if (children.length > 0) {
            nextNodeId = children[0].id;
          }
          break;
        case 'ArrowLeft':
          if (currentNode.parentId) {
            const siblings = projectNodes.filter(n => n.parentId === currentNode.parentId && (showArchived || !n.isArchived))
              .sort((a, b) => a.timestamp - b.timestamp);
            const index = siblings.findIndex(n => n.id === activeNodeId);
            if (index > 0) {
              nextNodeId = siblings[index - 1].id;
            }
          }
          break;
        case 'ArrowRight':
          if (currentNode.parentId) {
            const siblings = projectNodes.filter(n => n.parentId === currentNode.parentId && (showArchived || !n.isArchived))
              .sort((a, b) => a.timestamp - b.timestamp);
            const index = siblings.findIndex(n => n.id === activeNodeId);
            if (index !== -1 && index < siblings.length - 1) {
              nextNodeId = siblings[index + 1].id;
            }
          }
          break;
      }

      if (nextNodeId) {
        e.preventDefault();
        onNodeClick(nextNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNodeId, nodes, onNodeClick, activeProjectId, showArchived]);

  const renderListItem = (node: ChatNode) => {
    const isActive = node.id === activeNodeId;
    const isInContext = contextNodeIds.has(node.id);
    const children = nodes.filter(n => n.parentId === node.id && (showArchived || !n.isArchived));
    const childCount = children.length;

    return (
      <div key={node.id}>
        <button
          onClick={(e) => {
            if (e.shiftKey) {
              onToggleContext(node.id);
            } else {
              onNodeClick(node.id);
            }
          }}
          className={`sidebar-item group w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between gap-3 transition-all ${isActive
            ? isDarkMode
              ? 'bg-dark-800 text-canopy-400 border-l-2 border-canopy-500'
              : 'bg-canopy-50 text-canopy-700 border-l-2 border-canopy-500'
            : isDarkMode
              ? 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-300'
              : 'text-dark-500 hover:bg-white/50 hover:text-dark-700'
            }`}
        >
          <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
            <span className={`truncate font-medium ${node.isArchived ? 'opacity-50 italic' : ''}`}>
              {node.summary || 'New conversation'}
            </span>
            {childCount > 1 && (
              <span className={`text-[9px] px-1 rounded-sm flex-shrink-0 ${isDarkMode
                ? 'bg-dark-700 text-dark-300'
                : 'bg-white text-dark-400 border border-canopy-100'
                }`}>
                {childCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-[10px] tabular-nums ${isDarkMode ? 'text-dark-600' : 'text-zinc-400'}`}>
              {new Date(node.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()}
            </span>
            {isInContext && (
              <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-canopy-400' : 'bg-canopy-500'}`} />
            )}

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
              {node.isArchived ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onUnarchiveNode(node.id); }}
                  className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-dark-700 text-dark-400' : 'hover:bg-canopy-100 text-dark-500'}`}
                  title="Unarchive"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onArchiveNode(node.id); }}
                  className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-dark-700 text-dark-400' : 'hover:bg-canopy-100 text-dark-500'}`}
                  title="Archive"
                >
                  <Archive className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
                className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-red-900/30 text-red-500' : 'hover:bg-red-50 text-red-500'}`}
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </button>
      </div>
    );
  };

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-dark-950' : 'bg-white'}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isDarkMode ? 'border-dark-800 bg-dark-950' : 'border-canopy-100 bg-white'}`}>
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-md ${isDarkMode ? 'bg-canopy-500/10' : 'bg-canopy-50'}`}>
            <TreePalm className={`w-4 h-4 ${isDarkMode ? 'text-canopy-400' : 'text-canopy-600'}`} />
          </div>
          <span className={`font-bold text-sm tracking-tight ${isDarkMode ? 'text-dark-100' : 'text-dark-900'}`}>Canopy</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleDarkMode}
            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-dark-800 text-dark-400 hover:text-dark-200' : 'hover:bg-canopy-50 text-dark-400 hover:text-dark-600'}`}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-dark-800 text-dark-400 hover:text-dark-200' : 'hover:bg-canopy-50 text-dark-400 hover:text-dark-600'}`}
            title={sidebarExpanded ? 'Switch to List' : 'Switch to Graph'}
          >
            {sidebarExpanded ? <List className="w-4 h-4" /> : <Network className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggleShowArchived}
            className={`p-1.5 rounded-lg transition-all relative ${showArchived
              ? (isDarkMode ? 'bg-amber-500/20 text-amber-500' : 'bg-amber-100 text-amber-600')
              : (isDarkMode ? 'hover:bg-dark-800 text-dark-400' : 'hover:bg-canopy-50 text-dark-400')}`}
            title={showArchived ? 'Hide Archived' : 'Show Archived'}
          >
            <Archive className="w-4 h-4" />
            {archivedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center border-2 border-white dark:border-dark-950">
                {archivedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {!treeData && (
          <div className={`absolute inset-0 flex items-center justify-center text-sm ${isDarkMode ? 'text-dark-500' : 'text-dark-400'}`}>
            Start a conversation
          </div>
        )}

        {!sidebarExpanded && treeData && (
          <div className={`h-full overflow-y-auto py-2 px-2 custom-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]`}>
            {pathToActive.length === 0 ? (
              <div className={`text-xs text-center ${isDarkMode ? 'text-dark-400' : 'text-zinc-400'}`}>
                No active conversation
              </div>
            ) : (
              <div className="space-y-0.5">
                {pathToActive.map(renderListItem)}
                {linearTail.map(renderListItem)}
                {(() => {
                  if (!lastNodeInLinearPath) return null;
                  const allChildren = nodes.filter(n => n.parentId === lastNodeInLinearPath.id);
                  const displayChildren = allChildren
                    .filter(n => showArchived || !n.isArchived)
                    .sort((a, b) => a.timestamp - b.timestamp);

                  if (displayChildren.length > 0) {
                    return (
                      <div className={`mt-2 ml-4 pl-2 border-l ${isDarkMode ? 'border-dark-800' : 'border-canopy-100'}`}>
                        <div className={`text-[10px] uppercase tracking-wider mb-1 pl-2 ${isDarkMode ? 'text-dark-500' : 'text-zinc-400'}`}>
                          Responses
                        </div>
                        {displayChildren.map(renderListItem)}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        )}

        {sidebarExpanded && (
          <svg ref={svgRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
};

export default GraphView;
