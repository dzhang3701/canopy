import type { ConversationNode, LayoutNode, TreeBounds } from '../../types';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const HORIZONTAL_SPACING = 40;
const VERTICAL_SPACING = 60;

interface TreeLayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
  showArchived?: boolean;
}

interface LayoutState {
  node: ConversationNode;
  x: number;
  y: number;
  mod: number;
  prelim: number;
  shift: number;
  change: number;
  thread: LayoutState | null;
  ancestor: LayoutState;
  number: number;
  children: LayoutState[];
  parent: LayoutState | null;
}

export function calculateTreeLayout(
  nodes: Map<string, ConversationNode>,
  rootId: string | null,
  options: TreeLayoutOptions = {}
): { layout: Map<string, LayoutNode>; bounds: TreeBounds } {
  const {
    nodeWidth = NODE_WIDTH,
    nodeHeight = NODE_HEIGHT,
    horizontalSpacing = HORIZONTAL_SPACING,
    verticalSpacing = VERTICAL_SPACING,
    showArchived = false,
  } = options;

  const layout = new Map<string, LayoutNode>();

  if (!rootId) {
    return {
      layout,
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 },
    };
  }

  const root = nodes.get(rootId);
  if (!root) {
    return {
      layout,
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 },
    };
  }

  // Build tree structure for Reingold-Tilford algorithm
  function buildLayoutState(
    node: ConversationNode,
    parent: LayoutState | null,
    depth: number,
    number: number
  ): LayoutState | null {
    if (!showArchived && node.isArchived) return null;

    const state: LayoutState = {
      node,
      x: 0,
      y: depth * (nodeHeight + verticalSpacing),
      mod: 0,
      prelim: 0,
      shift: 0,
      change: 0,
      thread: null,
      ancestor: null as unknown as LayoutState,
      number,
      children: [],
      parent,
    };
    state.ancestor = state;

    if (!node.isCollapsed) {
      let childNumber = 0;
      for (const childId of node.childIds) {
        const childNode = nodes.get(childId);
        if (childNode) {
          const childState = buildLayoutState(childNode, state, depth + 1, childNumber);
          if (childState) {
            state.children.push(childState);
            childNumber++;
          }
        }
      }
    }

    return state;
  }

  const rootState = buildLayoutState(root, null, 0, 0);
  if (!rootState) {
    return {
      layout,
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 },
    };
  }

  // Reingold-Tilford algorithm
  const unitWidth = nodeWidth + horizontalSpacing;

  function firstWalk(v: LayoutState): void {
    if (v.children.length === 0) {
      if (v.number > 0 && v.parent) {
        const leftSibling = v.parent.children[v.number - 1];
        v.prelim = leftSibling.prelim + unitWidth;
      } else {
        v.prelim = 0;
      }
    } else {
      let defaultAncestor = v.children[0];

      for (const w of v.children) {
        firstWalk(w);
        defaultAncestor = apportion(w, defaultAncestor);
      }

      executeShifts(v);

      const midpoint =
        (v.children[0].prelim + v.children[v.children.length - 1].prelim) / 2;

      if (v.number > 0 && v.parent) {
        const leftSibling = v.parent.children[v.number - 1];
        v.prelim = leftSibling.prelim + unitWidth;
        v.mod = v.prelim - midpoint;
      } else {
        v.prelim = midpoint;
      }
    }
  }

  function apportion(v: LayoutState, defaultAncestor: LayoutState): LayoutState {
    if (v.number > 0 && v.parent) {
      const leftSibling = v.parent.children[v.number - 1];
      let vInnerRight: LayoutState | null = v;
      let vOuterRight: LayoutState | null = v;
      let vInnerLeft: LayoutState | null = leftSibling;
      let vOuterLeft: LayoutState | null = v.parent.children[0];

      let sInnerRight = vInnerRight.mod;
      let sOuterRight = vOuterRight.mod;
      let sInnerLeft = vInnerLeft.mod;
      let sOuterLeft = vOuterLeft.mod;

      while (nextRight(vInnerLeft) && nextLeft(vInnerRight)) {
        vInnerLeft = nextRight(vInnerLeft)!;
        vInnerRight = nextLeft(vInnerRight)!;
        vOuterLeft = nextLeft(vOuterLeft)!;
        vOuterRight = nextRight(vOuterRight)!;

        if (vOuterRight) {
          vOuterRight.ancestor = v;
        }

        const shift =
          vInnerLeft.prelim +
          sInnerLeft -
          (vInnerRight.prelim + sInnerRight) +
          unitWidth;

        if (shift > 0) {
          moveSubtree(ancestor(vInnerLeft, v, defaultAncestor), v, shift);
          sInnerRight += shift;
          sOuterRight += shift;
        }

        sInnerLeft += vInnerLeft.mod;
        sInnerRight += vInnerRight.mod;
        if (vOuterLeft) sOuterLeft += vOuterLeft.mod;
        if (vOuterRight) sOuterRight += vOuterRight.mod;
      }

      if (nextRight(vInnerLeft) && !nextRight(vOuterRight)) {
        if (vOuterRight) {
          vOuterRight.thread = nextRight(vInnerLeft);
          vOuterRight.mod += sInnerLeft - sOuterRight;
        }
      }

      if (nextLeft(vInnerRight) && !nextLeft(vOuterLeft)) {
        if (vOuterLeft) {
          vOuterLeft.thread = nextLeft(vInnerRight);
          vOuterLeft.mod += sInnerRight - sOuterLeft;
        }
        defaultAncestor = v;
      }
    }
    return defaultAncestor;
  }

  function nextLeft(v: LayoutState | null): LayoutState | null {
    if (!v) return null;
    return v.children.length > 0 ? v.children[0] : v.thread;
  }

  function nextRight(v: LayoutState | null): LayoutState | null {
    if (!v) return null;
    return v.children.length > 0 ? v.children[v.children.length - 1] : v.thread;
  }

  function moveSubtree(wl: LayoutState, wr: LayoutState, shift: number): void {
    const subtrees = wr.number - wl.number;
    if (subtrees > 0) {
      wr.change -= shift / subtrees;
      wr.shift += shift;
      wl.change += shift / subtrees;
      wr.prelim += shift;
      wr.mod += shift;
    }
  }

  function executeShifts(v: LayoutState): void {
    let shift = 0;
    let change = 0;
    for (let i = v.children.length - 1; i >= 0; i--) {
      const w = v.children[i];
      w.prelim += shift;
      w.mod += shift;
      change += w.change;
      shift += w.shift + change;
    }
  }

  function ancestor(
    vil: LayoutState,
    v: LayoutState,
    defaultAncestor: LayoutState
  ): LayoutState {
    if (v.parent && v.parent.children.includes(vil.ancestor)) {
      return vil.ancestor;
    }
    return defaultAncestor;
  }

  function secondWalk(v: LayoutState, m: number): void {
    v.x = v.prelim + m;

    for (const w of v.children) {
      secondWalk(w, m + v.mod);
    }
  }

  // Execute the algorithm
  firstWalk(rootState);
  secondWalk(rootState, 0);

  // Calculate bounds and extract layout
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  function extractLayout(state: LayoutState, depth: number): void {
    const layoutNode: LayoutNode = {
      id: state.node.id,
      x: state.x,
      y: state.y,
      width: nodeWidth,
      height: nodeHeight,
      depth,
      parentId: state.node.parentId,
      childIds: state.children.map((c) => c.node.id),
    };

    layout.set(state.node.id, layoutNode);

    minX = Math.min(minX, state.x);
    maxX = Math.max(maxX, state.x + nodeWidth);
    minY = Math.min(minY, state.y);
    maxY = Math.max(maxY, state.y + nodeHeight);

    for (const child of state.children) {
      extractLayout(child, depth + 1);
    }
  }

  extractLayout(rootState, 0);

  // Handle edge case of single node
  if (!isFinite(minX)) {
    minX = 0;
    maxX = nodeWidth;
    minY = 0;
    maxY = nodeHeight;
  }

  const bounds: TreeBounds = {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };

  return { layout, bounds };
}

export function getNodeAtPosition(
  layout: Map<string, LayoutNode>,
  x: number,
  y: number
): LayoutNode | undefined {
  for (const node of layout.values()) {
    if (
      x >= node.x &&
      x <= node.x + node.width &&
      y >= node.y &&
      y <= node.y + node.height
    ) {
      return node;
    }
  }
  return undefined;
}
