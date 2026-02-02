/**
 * API Stats Feature - React Hook
 *
 * This hook manages API usage statistics state, including
 * persistence to localStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import { ApiUsageStats, UsageMetadata, DEFAULT_API_STATS } from '../types';
import { updateApiStats, resetApiStats } from '../utils';

const STORAGE_KEY = 'arbor_api_stats';

/**
 * Hook for managing API usage statistics.
 * Handles state, persistence, and update operations.
 */
export function useApiStats() {
  const [stats, setStats] = useState<ApiUsageStats>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_API_STATS;
  });

  // Persist to localStorage whenever stats change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  /**
   * Records usage from an API call and updates stats.
   */
  const recordUsage = useCallback((usage: UsageMetadata) => {
    setStats(prev => updateApiStats(prev, usage));
  }, []);

  /**
   * Resets all stats to zero.
   */
  const reset = useCallback(() => {
    setStats(resetApiStats());
  }, []);

  return {
    stats,
    recordUsage,
    reset,
  };
}
