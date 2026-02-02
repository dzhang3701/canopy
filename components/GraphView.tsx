import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ChatNode, TreeDataNode, Project } from '../types';
import { buildHierarchy, buildArchivedHierarchy, getChildCount, getAncestorPath } from '../utils/treeUtils';
import { Plus, X, Leaf, Archive, ArchiveRestore, Trash2, Eye } from 'lucide-react';

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
  focusNodeId: string | null; // When set, auto-focus on this node with ancestors
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
  isContextNode: boolean; // If true, show only summary
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
  focusNodeId,
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
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const prevProjectIdRef = useRef<string>(activeProjectId);
  const currentTransformRef = useRef<d3.ZoomTransform | null>(null);
  const hasInitializedRef = useRef<boolean>(false);
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

  // Reset view when project changes
  useEffect(() => {
    if (activeProjectId !== prevProjectIdRef.current) {
      prevProjectIdRef.current = activeProjectId;
      // Force recenter on project change
      if (svgRef.current && zoomRef.current && containerSize.width > 0) {
        const svg = d3.select(svgRef.current);
        const initialScale = 0.85;
        const initialTransform = d3.zoomIdentity
          .translate(containerSize.width / 2, 80)
          .scale(initialScale);
        svg.transition().duration(300).call(zoomRef.current.transform, initialTransform);
      }
    }
  }, [activeProjectId, containerSize.width]);

  // Focus on specific node when focusNodeId changes
  const focusOnNode = useCallback((nodeId: string) => {
    if (!svgRef.current || !zoomRef.current || !containerSize.width || !containerSize.height) return;

    const pos = nodePositionsRef.current.get(nodeId);
    if (!pos) return;

    // Get ancestors to show context (up to 3 ancestors above the current node)
    const ancestors = getAncestorPath(nodes, nodeId);
    // ancestors includes the current node, so ancestors.length - 1 gives us parent count
    const ancestorCount = Math.min(ancestors.length - 1, 3);

    // Calculate transform to center the node with its ancestors visible above
    const svg = d3.select(svgRef.current);
    const scale = 0.85;
    
    // Each level in the tree is ~220px apart (from nodeSize in treeLayout)
    // We want to shift the view DOWN so that ancestors appear ABOVE the focused node
    // The focused node should be in the lower-middle area of the screen
    const verticalSpacing = 220; // matches nodeSize[1] in treeLayout
    const ancestorVisibleSpace = ancestorCount * verticalSpacing * scale;
    
    // Position the focused node in the lower portion of the view
    // This leaves room above for ancestor nodes to be visible
    const targetX = containerSize.width / 2 - pos.x * scale;
    const targetY = containerSize.height * 0.65 - pos.y * scale;

    const transform = d3.zoomIdentity
      .translate(targetX, targetY)
      .scale(scale);

    // Update currentTransformRef immediately so re-renders preserve this position
    currentTransformRef.current = transform;

    svg.transition().duration(500).call(zoomRef.current.transform, transform);
  }, [nodes, containerSize]);

  useEffect(() => {
    if (focusNodeId) {
      // Small delay to ensure positions are calculated
      const timer = setTimeout(() => {
        focusOnNode(focusNodeId);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [focusNodeId, focusOnNode]);

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeNodeId || !activeProjectId) return;
      
      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const projectNodes = nodes.filter(n => n.projectId === activeProjectId);
      const currentNode = projectNodes.find(n => n.id === activeNodeId);
      if (!currentNode) return;

      let targetNodeId: string | null = null;

      if (e.key === 'ArrowUp') {
        // Go to parent
        if (currentNode.parentId) {
          targetNodeId = currentNode.parentId;
        }
      } else if (e.key === 'ArrowDown') {
        // Go to first child
        const children = projectNodes.filter(n => n.parentId === activeNodeId);
        if (children.length > 0) {
          // Sort by timestamp and pick the first (oldest)
          const firstChild = children.sort((a, b) => a.timestamp - b.timestamp)[0];
          targetNodeId = firstChild.id;
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Go to sibling
        if (currentNode.parentId) {
          const siblings = projectNodes
            .filter(n => n.parentId === currentNode.parentId)
            .sort((a, b) => a.timestamp - b.timestamp);
          
          const currentIndex = siblings.findIndex(n => n.id === activeNodeId);
          if (e.key === 'ArrowLeft' && currentIndex > 0) {
            targetNodeId = siblings[currentIndex - 1].id;
          } else if (e.key === 'ArrowRight' && currentIndex < siblings.length - 1) {
            targetNodeId = siblings[currentIndex + 1].id;
          }
        }
      }

      if (targetNodeId) {
        e.preventDefault();
        onNodeClick(targetNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNodeId, activeProjectId, nodes, onNodeClick]);

  useEffect(() => {
    if (!treeData || !svgRef.current || containerSize.width === 0) return;

    const width = containerSize.width;
    const height = containerSize.height;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 2])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        // Save the current transform so it's preserved across re-renders
        currentTransformRef.current = event.transform;
        // Hide node actions when zooming/panning
        setNodeActions(null);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    const treeLayout = d3.tree<TreeDataNode>()
      .nodeSize([280, 220])
      .separation((a, b) => a.parent === b.parent ? 1.4 : 1.8);

    const root = d3.hierarchy(treeData);
    const tree = treeLayout(root);

    // Store node positions for focus functionality
    nodePositionsRef.current.clear();
    tree.descendants().forEach((d: d3.HierarchyPointNode<TreeDataNode>) => {
      nodePositionsRef.current.set(d.data.id, { x: d.x, y: d.y });
    });

    // Define gradient for branch-like links
    const defs = svg.append("defs");
    const branchGradient = defs.append("linearGradient")
      .attr("id", "branch-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    branchGradient.append("stop").attr("offset", "0%").attr("stop-color", "#6ee7b7");
    branchGradient.append("stop").attr("offset", "50%").attr("stop-color", "#34d399");
    branchGradient.append("stop").attr("offset", "100%").attr("stop-color", "#10b981");

    // Links - Tree branches - amber for archived view, green for normal
    g.append("g")
      .attr("fill", "none")
      .attr("stroke", showArchived ? "#fcd34d" : "url(#branch-gradient)")
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round")
      .selectAll("path")
      .data(tree.links())
      .join("path")
      .attr("d", d3.linkVertical<any, any>()
        .x(d => d.x)
        .y(d => d.y))
      .attr("opacity", 0.8);

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
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            node: d.data.data,
            isContextNode: isInContext
          });
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
        // Large expanded card for context nodes - organic leaf-like shape
        // Large expanded card for context nodes
        const cardWidth = 220;
        const cardHeight = 140;

        // Soft shadow for depth
        el.append("rect")
          .attr("x", -cardWidth / 2 + 4)
          .attr("y", -cardHeight / 2 + 4)
          .attr("width", cardWidth)
          .attr("height", cardHeight)
          .attr("rx", 16)
          .attr("fill", "rgba(16, 185, 129, 0.1)");

        // Main card background - with organic rounded corners - amber for archived, green for normal
        el.append("rect")
          .attr("x", -cardWidth / 2)
          .attr("y", -cardHeight / 2)
          .attr("width", cardWidth)
          .attr("height", cardHeight)
          .attr("rx", 16)
          .attr("fill", showArchived ? "#fffbeb" : "white")
          .attr("stroke", showArchived
            ? (isActive ? "#d97706" : "#fcd34d")
            : (isActive ? "#059669" : "#6ee7b7"))
          .attr("stroke-width", isActive ? 3 : 2)
          .style("filter", "drop-shadow(0 4px 16px rgba(16, 185, 129, 0.15))");

        // Top connector - organic stem
        el.append("path")
          .attr("d", `M0,${-cardHeight / 2 - 20} Q5,${-cardHeight / 2 - 10} 0,${-cardHeight / 2}`)
          .attr("fill", "none")
          .attr("stroke", showArchived ? "#fcd34d" : "#34d399")
          .attr("stroke-width", 3)
          .attr("stroke-linecap", "round");

        // Leaf icon badge
        el.append("circle")
          .attr("cx", -cardWidth / 2 + 22)
          .attr("cy", -cardHeight / 2 + 22)
          .attr("r", 14)
          .attr("fill", "url(#branch-gradient)");

        el.append("text")
          .attr("x", -cardWidth / 2 + 22)
          .attr("y", -cardHeight / 2 + 27)
          .attr("text-anchor", "middle")
          .attr("fill", showArchived ? "#d97706" : "white")
          .style("font-size", "12px")
          .text(showArchived ? "📦" : "🌿");

        // Title text
        el.append("text")
          .attr("x", -cardWidth / 2 + 44)
          .attr("y", -cardHeight / 2 + 27)
          .attr("fill", showArchived ? "#92400e" : "#065f46")
          .style("font-size", "13px")
          .style("font-weight", "600")
          .text(() => {
            const text = d.data.name;
            return text.length > 18 ? text.substring(0, 15) + "..." : text;
          });

        // Active indicator - glowing dot
        if (isActive) {
          el.append("circle")
            .attr("cx", cardWidth / 2 - 16)
            .attr("cy", -cardHeight / 2 + 22)
            .attr("r", 6)
            .attr("fill", "#10b981")
            .style("filter", "drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))");
        }
        // Action buttons group (Archive/Unarchive & Delete)
        // Skip for virtual root node
        if (d.data.id !== '__archived_root__') {
          const actionsGroup = el.append("g")
            .attr("class", "node-actions")
            .attr("transform", `translate(${cardWidth / 2 - 44}, ${-cardHeight / 2 + 12})`);

          if (showArchived) {
            // Unarchive button (when viewing archived nodes) - green
            actionsGroup.append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", 18)
              .attr("height", 18)
              .attr("rx", 4)
              .attr("fill", "#22c55e")
              .attr("class", "unarchive-btn")
              .style("cursor", "pointer")
              .on("click", (event) => {
                event.stopPropagation();
                onUnarchiveNode(d.data.id);
              })
              .on("mouseenter", function() {
                d3.select(this).attr("fill", "#16a34a");
              })
              .on("mouseleave", function() {
                d3.select(this).attr("fill", "#22c55e");
              });

            actionsGroup.append("text")
              .attr("x", 9)
              .attr("y", 14)
              .attr("text-anchor", "middle")
              .attr("fill", "white")
              .style("font-size", "12px")
              .style("font-weight", "bold")
              .style("pointer-events", "none")
              .text("↩");
          } else {
            // Archive button (when viewing active nodes) - yellow
            actionsGroup.append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", 18)
              .attr("height", 18)
              .attr("rx", 4)
              .attr("fill", "#facc15")
              .attr("class", "archive-btn")
              .style("cursor", "pointer")
              .on("click", (event) => {
                event.stopPropagation();
                onArchiveNode(d.data.id);
              })
              .on("mouseenter", function() {
                d3.select(this).attr("fill", "#eab308");
              })
              .on("mouseleave", function() {
                d3.select(this).attr("fill", "#facc15");
              });

            actionsGroup.append("text")
              .attr("x", 9)
              .attr("y", 14)
              .attr("text-anchor", "middle")
              .attr("fill", "#713f12")
              .style("font-size", "12px")
              .style("font-weight", "bold")
              .style("pointer-events", "none")
              .text("A");
          }

          // Delete button (always shown) - red
          actionsGroup.append("rect")
            .attr("x", 22)
            .attr("y", 0)
            .attr("width", 18)
            .attr("height", 18)
            .attr("rx", 4)
            .attr("fill", "#ef4444")
            .attr("class", "delete-btn")
            .style("cursor", "pointer")
            .on("click", (event) => {
              event.stopPropagation();
              onDeleteNode(d.data.id);
            })
            .on("mouseenter", function() {
              d3.select(this).attr("fill", "#dc2626");
            })
            .on("mouseleave", function() {
              d3.select(this).attr("fill", "#ef4444");
            });

          actionsGroup.append("text")
            .attr("x", 31)
            .attr("y", 14)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("pointer-events", "none")
            .text("×");
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
        // Small organic node - seed/leaf style
        const nodeRadius = isActive ? 14 : (children > 1 ? 11 : 9);

        // Glow effect for active
        if (isActive) {
          el.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", nodeRadius + 4)
            .attr("fill", "rgba(16, 185, 129, 0.2)")
            .style("filter", "blur(4px)");
        }

        // Main node circle
        el.append("circle")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", nodeRadius)
          .attr("fill", () => {
            if (showArchived) {
              if (isActive) return "#fbbf24";
              if (children > 1) return "#fcd34d";
              return "#fde68a";
            }
            if (isActive) return "url(#branch-gradient)";
            if (children > 1) return "#6ee7b7";
            return "#a7f3d0";
          })
          .attr("stroke", isActive ? (showArchived ? "#d97706" : "#059669") : "rgba(255,255,255,0.5)")
          .attr("stroke-width", isActive ? 2 : 1)
          .attr("opacity", isActive ? 1 : 0.9)
          .style("filter", isActive ? "drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4))" : "none");

        // Inner highlight for depth
        if (nodeRadius > 6) {
          el.append("circle")
            .attr("cx", -nodeRadius * 0.2)
            .attr("cy", -nodeRadius * 0.2)
            .attr("r", nodeRadius * 0.3)
            .attr("fill", "rgba(255,255,255,0.4)");
        }

        // Small label only for active node
        if (isActive) {
          el.append("text")
            .attr("dy", 24)
            .attr("text-anchor", "middle")
            .attr("fill", showArchived ? "#92400e" : "#065f46")
            .style("font-size", "10px")
            .style("font-weight", "600")
            .text(() => {
              const text = d.data.name;
              return text.length > 12 ? text.substring(0, 9) + "..." : text;
            });
        }
      }
    });

    // Only center the graph on first initialization or project change
    // Otherwise, preserve the current view position
    if (!hasInitializedRef.current || activeProjectId !== prevProjectIdRef.current) {
      const initialScale = 0.85;
      const initialTransform = d3.zoomIdentity
        .translate(width / 2, 80)
        .scale(initialScale);

      svg.call(zoom.transform, initialTransform);
      currentTransformRef.current = initialTransform;
      hasInitializedRef.current = true;
      prevProjectIdRef.current = activeProjectId;
    } else if (currentTransformRef.current) {
      // Restore the previous transform to maintain view position
      svg.call(zoom.transform, currentTransformRef.current);
    }

  }, [treeData, nodes, activeNodeId, contextNodeIds, activePathIds, showArchived, onNodeClick, onToggleContext, containerSize, activeProjectId, onArchiveNode, onDeleteNode, onUnarchiveNode]);

  // Close node actions when clicking elsewhere
  const handleContainerClick = () => {
    setNodeActions(null);
  };

  return (
    <div className={`h-full flex flex-col ${showArchived ? 'bg-amber-50' : 'bg-gradient-to-b from-emerald-50 via-green-50 to-teal-50'}`}>
      {/* Header with Logo - Tree trunk inspired and Archive Toggle */}
      <div className="px-4 py-3 border-b border-emerald-200 bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 flex items-center justify-between">
        <div className="flex items-center gap-3 shadow-md">
          <div className="relative">
          <div className="w-8 h-8 rounded-full bg-emerald-400/30 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-emerald-100" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
        </div>
        <div>
            <span className="font-bold text-white text-lg tracking-wide">Canopy</span>
          <span className="text-emerald-200 text-xs ml-2 font-light">thought tree</span>
        </div>
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

      {/* Project Tabs - Leaf-styled tabs */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-200/50 bg-white/80 backdrop-blur-sm overflow-x-auto">
        {projects.map(project => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`group flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all whitespace-nowrap relative ${
              activeProjectId === project.id
                ? 'bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-800 shadow-sm rounded-t-xl rounded-b-lg border border-emerald-200'
                : 'text-emerald-600 hover:bg-emerald-50/80 hover:text-emerald-700 rounded-lg'
            }`}
          >
            {activeProjectId === project.id && (
              <Leaf className="w-3 h-3 text-emerald-500 absolute -top-1 -left-1 rotate-45" />
            )}
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
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100/50 transition-all border border-dashed border-emerald-300 hover:border-emerald-400"
          title="New branch"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Graph Area - Forest floor background */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onClick={handleContainerClick}
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%" className="absolute inset-0">
            <pattern id="leaf-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 5 Q40 15 35 25 Q30 35 25 25 Q20 15 30 5" fill="currentColor" className="text-emerald-900"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#leaf-pattern)" />
          </svg>
        </div>

        {!treeData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-400 gap-4">
            <div className="relative">
              <Leaf className="w-16 h-16 text-emerald-200 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Plus className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <p className="text-lg font-medium">Plant your first thought</p>
            <p className="text-sm text-emerald-300">Start a conversation to grow your tree</p>
          </div>
        )}
        <svg ref={svgRef} className="w-full h-full" />

        {/* Tooltip - Organic rounded style */}
        {tooltip && (
          <div
            className="absolute z-50 bg-white/95 backdrop-blur-sm border border-emerald-200 rounded-2xl shadow-xl p-3 max-w-xs pointer-events-none"
            style={{
              left: tooltip.x + 10,
              top: tooltip.y + 10,
              transform: tooltip.x > (containerRef.current?.clientWidth || 0) / 2 ? 'translateX(-100%)' : undefined
            }}
          >
            {tooltip.isContextNode ? (
              // Simple one-line summary for context nodes
              <div className="flex items-center gap-2">
                <Leaf className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                <div className="text-xs font-medium text-emerald-700">
                  {tooltip.node.summary}
                </div>
              </div>
            ) : (
              // Full tooltip for condensed nodes
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="w-3 h-3 text-emerald-500" />
                  <div className="text-xs font-semibold text-emerald-700 truncate">
                    {tooltip.node.summary}
                  </div>
                </div>
                <div className="text-[10px] text-emerald-600 mb-2 pl-5">
                  <span className="font-medium text-emerald-500">Q:</span> {tooltip.node.userPrompt.slice(0, 80)}...
                </div>
                <div className="text-[10px] text-emerald-500 pl-5">
                  <span className="font-medium text-emerald-400">A:</span> {tooltip.node.assistantResponse.slice(0, 100)}...
                </div>
                <div className="text-[9px] text-emerald-400 mt-3 border-t border-emerald-100 pt-2 flex items-center gap-2">
                  <span className="bg-emerald-100 px-1.5 py-0.5 rounded">Click</span> select
                  <span className="bg-emerald-100 px-1.5 py-0.5 rounded">Shift+Click</span> context
                </div>
              </>
            )}
          </div>
        )}

        {/* Node Actions Context Menu (for right-click on condensed nodes) */}
        {nodeActions && (
          <div
            className="absolute z-50 bg-white rounded-lg shadow-lg overflow-hidden min-w-[120px]"
            style={{
              left: nodeActions.x,
              top: nodeActions.y,
              transform: nodeActions.x > (containerRef.current?.clientWidth || 0) / 2 ? 'translateX(-100%)' : undefined
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showArchived ? (
              <button
                onClick={() => {
                  onUnarchiveNode(nodeActions.nodeId);
                  setNodeActions(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                <ArchiveRestore className="w-4 h-4" />
                Restore
              </button>
            ) : (
              <button
                onClick={() => {
                  onArchiveNode(nodeActions.nodeId);
                  setNodeActions(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-yellow-400 text-yellow-900 hover:bg-yellow-500 transition-colors"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
            )}
            <button
              onClick={() => {
                onDeleteNode(nodeActions.nodeId);
                setNodeActions(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}

        {/* Legend - Organic style */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm border border-emerald-200 rounded-xl px-4 py-2.5 text-[10px] text-emerald-600 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-400 shadow-inner"></div>
              <span className="font-medium">In Context</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-300 to-green-400 opacity-70"></div>
              <span className="font-medium">Condensed</span>
            </div>
          </div>
        </div>

        {/* Decorative corner leaves */}
        <div className="absolute top-2 right-2 opacity-20 pointer-events-none">
          <Leaf className="w-8 h-8 text-emerald-600 rotate-45" />
        </div>
        <div className="absolute bottom-2 right-2 opacity-10 pointer-events-none">
          <Leaf className="w-12 h-12 text-emerald-600 -rotate-12" />
        </div>
      </div>
    </div>
  );
};

export default GraphView;
