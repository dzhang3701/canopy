
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
 * Generates a response from the model based on the node hierarchy.
 */
export async function generateChatResponse(
  history: ChatNode[],
  newPrompt: string
): Promise<{ response: string; summary: string }> {
  // Construct the prompt with full context from ancestors
  const contents = history.map(node => [
    { text: node.userPrompt },
    { text: node.assistantResponse }
  ]).flat();

  contents.push({ text: newPrompt });

  const response = await getClient().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents.map(c => ({ parts: [c] })),
    config: {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
    }
  });

  const assistantText = response.text || "I'm sorry, I couldn't generate a response.";

  // Generate a one-line summary
  const summaryResponse = await getClient().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      { 
        parts: [{ 
          text: `Summarize the following interaction in exactly one concise phrase (max 5 words):
          User: ${newPrompt}
          Assistant: ${assistantText}` 
        }] 
      }
    ]
  });

  const summary = summaryResponse.text?.trim().replace(/^["']|["']$/g, '') || "Untitled Exchange";

  return { response: assistantText, summary };
}
