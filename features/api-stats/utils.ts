/**
 * API Stats Feature - Utility Functions
 *
 * This module contains utility functions for API cost calculation
 * and stats management.
 */

import { ApiUsageStats, UsageMetadata } from './types';

/**
 * Gemini 2.0 Flash pricing (per 1M tokens)
 */
export const PRICING = {
  INPUT_PER_MILLION: 0.075,
  OUTPUT_PER_MILLION: 0.30,
} as const;

/**
 * Calculates the estimated cost based on token usage.
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens used
 * @returns Estimated cost in USD
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICING.INPUT_PER_MILLION +
    (outputTokens / 1_000_000) * PRICING.OUTPUT_PER_MILLION
  );
}

/**
 * Updates API stats with new usage data from an API call.
 * @param currentStats - Current API usage stats
 * @param usage - Usage metadata from the latest API call
 * @returns Updated API usage stats
 */
export function updateApiStats(
  currentStats: ApiUsageStats,
  usage: UsageMetadata
): ApiUsageStats {
  const newInputTokens = currentStats.inputTokens + usage.inputTokens;
  const newOutputTokens = currentStats.outputTokens + usage.outputTokens;

  return {
    totalCalls: currentStats.totalCalls + 1,
    inputTokens: newInputTokens,
    outputTokens: newOutputTokens,
    estimatedCost: calculateCost(newInputTokens, newOutputTokens),
  };
}

/**
 * Resets API stats to initial state.
 * @returns Fresh API stats object with all values at zero
 */
export function resetApiStats(): ApiUsageStats {
  return {
    totalCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCost: 0,
  };
}

/**
 * Formats the estimated cost for display.
 * @param cost - The cost value to format
 * @returns Formatted cost string (e.g., "$0.0012")
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

/**
 * Formats token count for display with locale-aware separators.
 * @param tokens - Number of tokens
 * @returns Formatted token string (e.g., "1,234,567")
 */
export function formatTokens(tokens: number): string {
  return tokens.toLocaleString();
}
