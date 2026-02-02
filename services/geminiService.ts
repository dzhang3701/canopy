
import { GoogleGenAI } from "@google/genai";
import { ChatNode } from "../types";

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
 */
export async function streamChatResponse(
  history: ChatNode[],
  newPrompt: string,
  onChunk: (chunk: string) => void
): Promise<void> {
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

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      onChunk(text);
    }
  }
}

export async function generateChatResponse(
  history: ChatNode[],
  newPrompt: string,
  summaryOnly: boolean = false
): Promise<{ response: string; summary: string }> {
  if (summaryOnly) {
    // Just generate the summary
    const summaryResponse = await getClient().models.generateContent({
      model: 'gemini-2.5-flash',
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
    return { response: '', summary };
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
          text: `Summarize the following interaction in exactly one concise phrase (max 8 words):
          User: ${newPrompt}
          Assistant: ${assistantText}`
        }]
      }
    ]
  });

  const summary = summaryResponse.text?.trim().replace(/^["']|["']$/g, '') || "Untitled Exchange";

  return { response: assistantText, summary };
}