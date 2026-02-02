/**
 * API Stats Feature - Type Definitions
 *
 * This module contains all type definitions related to API usage tracking
 * and cost estimation.
 */

/**
 * Tracks cumulative API usage statistics.
 */
export interface ApiUsageStats {
  totalCalls: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

/**
 * Usage metadata returned from a single API call.
 */
export interface UsageMetadata {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Default/initial state for API usage stats.
 */
export const DEFAULT_API_STATS: ApiUsageStats = {
  totalCalls: 0,
  inputTokens: 0,
  outputTokens: 0,
  estimatedCost: 0,
};
