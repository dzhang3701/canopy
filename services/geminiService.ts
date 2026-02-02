/**
 * Gemini API Service
 *
 * Handles communication with the Google Gemini API.
 * Usage tracking types are imported from the api-stats feature.
 */

import { GoogleGenAI } from "@google/genai";
import { ChatNode } from "../types";
import { UsageMetadata } from "../features/api-stats";

export type GeminiModelId = 'gemini-3-pro-preview' | 'gemini-3-flash-preview' | 'gemini-2.0-flash' | 'gemini-2.0-pro-exp-02-05' | 'gemini-1.5-pro' | 'gemini-1.5-flash';

export const MODELS = [
  { id: 'gemini-3-pro-preview' as GeminiModelId, name: 'Gemini 3.0 Pro' },
  { id: 'gemini-3-flash-preview' as GeminiModelId, name: 'Gemini 3.0 Flash' },
  { id: 'gemini-2.0-flash' as GeminiModelId, name: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.0-pro-exp-02-05' as GeminiModelId, name: 'Gemini 2.0 Pro' }
] as const;

export const DEFAULT_MODEL = 'gemini-3-pro-preview';

// Vite only exposes VITE_ prefixed variables to the client by default.
const ENV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Lazy initialization/caching by key
const clients = new Map<string, GoogleGenAI>();

function getClient(userApiKey?: string): GoogleGenAI {
  const trimmedUserKey = userApiKey?.trim();
  const key = trimmedUserKey || ENV_API_KEY;

  if (!key) {
    throw new Error("Gemini API Key is not set. Please provide one in Settings or a .env file.");
  }

  // Debug: Log which key source is being used (safely)
  const source = trimmedUserKey ? "User Settings" : "Environment (.env)";
  const obfuscatedKey = `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
  console.log(`[GeminiService] Using API Key from ${source}: ${obfuscatedKey}`);

  if (!clients.has(key)) {
    // Using v1beta as it generally has better support for latest experimental models
    clients.set(key, new GoogleGenAI({
      apiKey: key,
      apiVersion: 'v1beta'
    }));
  }
  return clients.get(key)!;
}

/**
 * Streams a response from the model based on the node hierarchy.
 * Returns usage metadata for API stats tracking.
 */
export async function streamChatResponse(
  history: ChatNode[],
  newPrompt: string,
  onChunk: (chunk: string) => void,
  modelId: GeminiModelId = DEFAULT_MODEL,
  apiKey?: string
): Promise<UsageMetadata | null> {
  const contents = history.map(node => [
    { role: 'user' as const, parts: [{ text: node.userPrompt }] },
    { role: 'model' as const, parts: [{ text: node.assistantResponse }] }
  ]).flat();

  contents.push({ role: 'user' as const, parts: [{ text: newPrompt }] });

  try {
    console.log(`[GeminiService] Starting stream with model: ${modelId} (${contents.length} messages)`);
    const response = await getClient(apiKey).models.generateContentStream({
      model: modelId,
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

    return {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
    };
  } catch (error: any) {
    console.error(`[GeminiService] Stream Error (${modelId}):`, error);
    // Construct a more descriptive error message if possible
    let errorMsg = error.message || "Unknown error";
    if (error.response?.data?.error?.message) {
      errorMsg = error.response.data.error.message;
    }
    const enhancedError = new Error(errorMsg);
    (enhancedError as any).details = error;
    throw enhancedError;
  }
}

/**
 * Generates a response (or just summary) from the model.
 * Returns usage metadata for API stats tracking.
 */
export async function generateChatResponse(
  history: ChatNode[],
  newPrompt: string,
  summaryOnly: boolean = false,
  modelId: GeminiModelId = DEFAULT_MODEL,
  apiKey?: string
): Promise<{ response: string; summary: string; usage: UsageMetadata | null }> {
  try {
    if (summaryOnly) {
      console.log(`[GeminiService] Generating summary only for model: ${modelId}`);
      // Just generate the summary
      const summaryResponse = await getClient(apiKey).models.generateContent({
        model: modelId,
        contents: [
          {
            role: 'user',
            parts: [{
              text: `Summarize the following user question in exactly one concise phrase (max 8 words), capturing the main topic:
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

    console.log(`[GeminiService] Generating full response for model: ${modelId}`);
    // Full response generation (non-streaming fallback)
    const contents = history.map(node => [
      { role: 'user' as const, parts: [{ text: node.userPrompt }] },
      { role: 'model' as const, parts: [{ text: node.assistantResponse }] }
    ]).flat();

    contents.push({ role: 'user' as const, parts: [{ text: newPrompt }] });

    const response = await getClient(apiKey).models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      }
    });

    const assistantText = response.text || "I'm sorry, I couldn't generate a response.";

    // Generate a one-line summary
    const summaryResponse = await getClient(apiKey).models.generateContent({
      model: modelId,
      contents: [
        {
          role: 'user',
          parts: [{
            text: `Summarize the following interaction in exactly one concise phrase (max 8 words):
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
        (summaryResponse.usageMetadata?.promptTokenCount || 0) || 0,
      outputTokens: (response.usageMetadata?.candidatesTokenCount || 0) +
        (summaryResponse.usageMetadata?.candidatesTokenCount || 0) || 0,
    };

    return { response: assistantText, summary, usage };
  } catch (error: any) {
    console.error(`[GeminiService] Generation Error (${modelId}):`, error);
    let errorMsg = error.message || "Unknown error";
    if (error.response?.data?.error?.message) {
      errorMsg = error.response.data.error.message;
    }
    const enhancedError = new Error(errorMsg);
    (enhancedError as any).details = error;
    throw enhancedError;
  }
}
