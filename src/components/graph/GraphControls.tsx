import { Button } from '../common';

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onReset: () => void;
  scale: number;
}

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onReset,
  scale,
}: GraphControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white rounded-lg shadow-md border border-gray-200 p-1">
      <Button variant="ghost" size="sm" onClick={onZoomOut} title="Zoom out">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </Button>

      <span className="text-xs text-gray-600 min-w-[3rem] text-center tabular-nums">
        {Math.round(scale * 100)}%
      </span>

      <Button variant="ghost" size="sm" onClick={onZoomIn} title="Zoom in">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </Button>

      <div className="w-px h-5 bg-gray-200" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onFitToScreen}
        title="Fit to screen"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
      </Button>

      <Button variant="ghost" size="sm" onClick={onReset} title="Reset view">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </Button>
    </div>
  );
}
