/**
 * API Stats Feature - Stats Panel Component
 *
 * Displays API usage statistics in a collapsible panel.
 * Shows total calls, token counts, and estimated cost.
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
        className="fixed bottom-24 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all shadow-lg z-50"
        title="Show API Stats"
      >
        <Activity className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50 min-w-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="text-xs font-medium text-slate-300">API Usage</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Calls</span>
            <span className="text-slate-200 font-mono">{stats.totalCalls}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Input tokens</span>
            <span className="text-slate-200 font-mono">{formatTokens(stats.inputTokens)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Output tokens</span>
            <span className="text-slate-200 font-mono">{formatTokens(stats.outputTokens)}</span>
          </div>
          <div className="border-t border-slate-700 pt-2 flex justify-between text-xs">
            <span className="text-slate-400">Est. cost</span>
            <span className="text-green-400 font-mono font-medium">
              {formatCost(stats.estimatedCost)}
            </span>
          </div>
          <button
            onClick={onReset}
            className="w-full mt-2 flex items-center justify-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
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
