/**
 * API Stats Feature - Stats Panel Component
 *
 * Displays API usage statistics in a collapsible panel.
 * Shows total calls, token counts, and estimated cost.
 * Styled to match the green Canopy theme.
 */

import React, { useState } from 'react';
import { Activity, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { ApiUsageStats } from '../types';
import { formatCost, formatTokens } from '../utils';

interface ApiStatsPanelProps {
  stats: ApiUsageStats;
  onReset: () => void;
}

const ApiStatsPanel: React.FC<ApiStatsPanelProps> = ({ stats, onReset }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-white border border-green-200 rounded-full text-green-500 hover:text-green-700 hover:bg-green-50 transition-all shadow-lg z-50"
        title="Show API Stats"
      >
        <Activity className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-green-200 z-50 min-w-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-green-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-500" />
          <span className="text-xs font-medium text-green-700">API Usage</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-green-400 hover:text-green-600 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-green-400 hover:text-green-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-green-500">Calls</span>
            <span className="text-green-800 font-mono">{stats.totalCalls}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-green-500">Input tokens</span>
            <span className="text-green-800 font-mono">{formatTokens(stats.inputTokens)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-green-500">Output tokens</span>
            <span className="text-green-800 font-mono">{formatTokens(stats.outputTokens)}</span>
          </div>
          <div className="border-t border-green-100 pt-2 flex justify-between text-xs">
            <span className="text-green-500">Est. cost</span>
            <span className="text-green-600 font-mono font-medium">
              {formatCost(stats.estimatedCost)}
            </span>
          </div>
          <button
            onClick={onReset}
            className="w-full mt-2 flex items-center justify-center gap-1 px-2 py-1 text-xs text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default ApiStatsPanel;
