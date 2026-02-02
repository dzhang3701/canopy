/**
 * Gemini API Service
 *
 * Handles communication with the Google Gemini API.
 * Usage tracking types are imported from the api-stats feature.
 */

import { GoogleGenAI } from "@google/genai";
import { ChatNode } from "../types";
import { UsageMetadata } from "../features/api-stats";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Debug: log if API key is present (not the actual key)
console.log('API Key loaded:', API_KEY ? `Yes (${API_KEY.length} chars)` : 'No');

// Lazy initialization to prevent crash when API key is not set
let ai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Please create a .env file with your API key.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
}

/**
 * Streams a response from the model based on the node hierarchy.
 * Returns usage metadata for API stats tracking.
 */
export async function streamChatResponse(
  history: ChatNode[],
  newPrompt: string,
  onChunk: (chunk: string) => void
): Promise<UsageMetadata | null> {
  const contents = history.map(node => [
    { role: 'user' as const, parts: [{ text: node.userPrompt }] },
    { role: 'model' as const, parts: [{ text: node.assistantResponse }] }
  ]).flat();

  contents.push({ role: 'user' as const, parts: [{ text: newPrompt }] });

  const response = await getClient().models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
    }
  });

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      onChunk(text);
    }
    // Accumulate usage metadata from chunks
    if (chunk.usageMetadata) {
      totalInputTokens = chunk.usageMetadata.promptTokenCount || totalInputTokens;
      totalOutputTokens = chunk.usageMetadata.candidatesTokenCount || totalOutputTokens;
    }
  }

  // Return usage metadata for API stats tracking
  return {
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
  };
}

/**
 * Generates a response (or just summary) from the model.
 * Returns usage metadata for API stats tracking.
 */
export async function generateChatResponse(
  history: ChatNode[],
  newPrompt: string,
  summaryOnly: boolean = false
): Promise<{ response: string; summary: string; usage: UsageMetadata | null }> {
  if (summaryOnly) {
    // Just generate the summary
    const summaryResponse = await getClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{
            text: `Summarize the following user question in exactly one concise phrase (max 5 words), capturing the main topic:
            "${newPrompt}"`
          }]
        }
      ]
    });

    const summary = summaryResponse.text?.trim().replace(/^["']|["']$/g, '') || "Untitled Exchange";
    const usage: UsageMetadata | null = summaryResponse.usageMetadata ? {
      inputTokens: summaryResponse.usageMetadata.promptTokenCount || 0,
      outputTokens: summaryResponse.usageMetadata.candidatesTokenCount || 0,
    } : null;

    return { response: '', summary, usage };
  }

  // Full response generation (non-streaming fallback)
  const contents = history.map(node => [
    { role: 'user' as const, parts: [{ text: node.userPrompt }] },
    { role: 'model' as const, parts: [{ text: node.assistantResponse }] }
  ]).flat();

  contents.push({ role: 'user' as const, parts: [{ text: newPrompt }] });

  const response = await getClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
    }
  });

  const assistantText = response.text || "I'm sorry, I couldn't generate a response.";

  // Generate a one-line summary
  const summaryResponse = await getClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{
          text: `Summarize the following interaction in exactly one concise phrase (max 5 words):
          User: ${newPrompt}
          Assistant: ${assistantText}`
        }]
      }
    ]
  });

  const summary = summaryResponse.text?.trim().replace(/^["']|["']$/g, '') || "Untitled Exchange";

  // Combine usage from both calls
  const usage: UsageMetadata = {
    inputTokens: (response.usageMetadata?.promptTokenCount || 0) +
                 (summaryResponse.usageMetadata?.promptTokenCount || 0),
    outputTokens: (response.usageMetadata?.candidatesTokenCount || 0) +
                  (summaryResponse.usageMetadata?.candidatesTokenCount || 0),
  };

  return { response: assistantText, summary, usage };
}
