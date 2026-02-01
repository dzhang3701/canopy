
import { GoogleGenAI, Type } from "@google/genai";
import { ChatNode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface UsageMetadata {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Generates a response from the model based on the node hierarchy.
 */
export async function generateChatResponse(
  history: ChatNode[],
  newPrompt: string
): Promise<{ response: string; summary: string; usage: UsageMetadata }> {
  // Build conversation history with proper roles
  const contents = history.flatMap(node => [
    { role: "user" as const, parts: [{ text: node.userPrompt }] },
    { role: "model" as const, parts: [{ text: node.assistantResponse }] }
  ]);

  // Add the new user message
  contents.push({ role: "user" as const, parts: [{ text: newPrompt }] });

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents,
    config: {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
      systemInstruction: `Always respond with valid JSON in this exact format: {"response": "your full response here", "summary": "3-5 word summary"}. The response field contains your actual reply. The summary field is a brief label for this exchange. Never include anything outside the JSON.`,
    }
  });

  const raw = response.text || "";
  const usage: UsageMetadata = {
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
  };

  try {
    // Try to extract JSON from the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        response: parsed.response || raw,
        summary: parsed.summary || "Untitled Exchange",
        usage,
      };
    }
  } catch {
    // Fall through to default
  }

  return { response: raw, summary: "Untitled Exchange", usage };
}
