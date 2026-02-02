
/**
 * API Stats Feature - Stats Panel Component
 *
 * Displays API usage statistics in a collapsible panel.
 * Shows total calls, token counts, and estimated cost.
 * Now draggable and resizable.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Activity, X, ChevronDown, ChevronUp, RotateCcw, GripHorizontal, Maximize2 } from 'lucide-react';
import { ApiUsageStats } from '../types';
import { formatCost, formatTokens } from '../utils';

interface ApiStatsPanelProps {
  stats: ApiUsageStats;
  onReset: () => void;
}

const ApiStatsPanel: React.FC<ApiStatsPanelProps> = ({ stats, onReset }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  // Drag and Resize State
  const [position, setPosition] = useState({ x: 16, y: 16 }); // Distance from bottom-left
  const [size, setSize] = useState({ width: 220, height: 260 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      dragStartPos.current = { x: e.clientX - position.x, y: window.innerHeight - e.clientY - position.y };
      e.preventDefault();
    }
  };

  const handleResizeDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    resizeStartSize.current = { width: size.width, height: size.height };
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStartPos.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 40, window.innerHeight - e.clientY - dragStartPos.current.y));
      setPosition({ x: newX, y: newY });
    }
    if (isResizing) {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = dragStartPos.current.y - e.clientY;
      setSize({
        width: Math.max(200, resizeStartSize.current.width + deltaX),
        height: Math.max(150, resizeStartSize.current.height + deltaY)
      });
    }
  }, [isDragging, isResizing, size.width]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{ left: position.x, bottom: position.y }}
        className="fixed p-2.5 glass shadow-premium rounded-full text-canopy-600 dark:text-canopy-400 hover:scale-110 active:scale-95 transition-all z-50 border border-canopy-100 dark:border-canopy-900/50"
        title="Show API Stats"
      >
        <Activity className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{
        left: position.x,
        bottom: position.y,
        width: size.width,
        height: isExpanded ? size.height : 'auto'
      }}
      className={`fixed glass rounded-xl shadow-premium z-50 border border-canopy-100 dark:border-canopy-900/30 overflow-hidden flex flex-col transition-shadow ${isDragging ? 'shadow-2xl ring-2 ring-canopy-500/20' : ''}`}
    >
      {/* Header / Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="drag-handle flex items-center justify-between px-3 py-2 border-b border-canopy-100 dark:border-canopy-900/30 bg-canopy-50/50 dark:bg-canopy-900/20 cursor-move"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-3.5 h-3.5 text-dark-400" />
          <span className="text-[10px] font-bold tracking-tight text-dark-800 dark:text-dark-100 uppercase pointer-events-none">API Usage</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-dark-400 hover:text-canopy-600 dark:hover:text-canopy-400 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-dark-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats Body */}
      {isExpanded && (
        <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-dark-500 dark:text-dark-400 font-medium whitespace-nowrap">Total Calls</span>
            <span className="text-dark-900 dark:text-dark-100 font-mono font-bold bg-canopy-100/50 dark:bg-canopy-900/30 px-1.5 py-0.5 rounded-sm">{stats.totalCalls}</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] text-dark-400 dark:text-dark-500 uppercase tracking-wider font-bold">
              <span>Tokens</span>
            </div>
            <div className="space-y-2 pl-2 border-l-2 border-canopy-100 dark:border-canopy-900/20">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-dark-500 dark:text-dark-400">Input</span>
                <span className="text-dark-900 dark:text-dark-100 font-mono">{formatTokens(stats.inputTokens)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-dark-500 dark:text-dark-400">Output</span>
                <span className="text-dark-900 dark:text-dark-100 font-mono">{formatTokens(stats.outputTokens)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-canopy-100 dark:border-canopy-900/30 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-canopy-600 dark:text-canopy-400 font-bold text-[10px] uppercase tracking-wider">Est. Cost</span>
              <span className="text-canopy-600 dark:text-canopy-400 font-mono font-bold text-sm">
                {formatCost(stats.estimatedCost)}
              </span>
            </div>
          </div>

          <button
            onClick={onReset}
            className="w-full mt-auto flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-dark-500 hover:text-canopy-600 dark:hover:text-canopy-400 hover:bg-canopy-50 dark:hover:bg-canopy-900/20 rounded-lg transition-all border border-transparent hover:border-canopy-100 dark:hover:border-canopy-900/30"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Session
          </button>
        </div>
      )}

      {/* Resize Handle */}
      {isExpanded && (
        <div
          onMouseDown={handleResizeDown}
          className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize flex items-center justify-center group"
        >
          <div className="w-1.5 h-1.5 border-t-2 border-r-2 border-dark-300 dark:border-dark-600 group-hover:border-canopy-500 transition-colors" />
        </div>
      )}
    </div>
  );
};

export default ApiStatsPanel;
