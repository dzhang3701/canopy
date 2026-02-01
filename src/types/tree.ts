export interface TreePosition {
  x: number;
  y: number;
}

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  parentId: string | null;
  childIds: string[];
}

export interface TreeBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}
