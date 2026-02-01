import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ContextMessage } from '../context';

export async function sendMessage(
  apiKey: string,
  messages: ContextMessage[],
  model = 'gemini-1.5-flash',
  onChunk?: (chunk: string) => void
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);

  // Separate system prompt from conversation
  const systemPrompt = messages.find((m) => m.role === 'system')?.content;
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  // Build chat history (all messages except the last one)
  const history = conversationMessages.slice(0, -1).map((m) => ({
    role: m.role === 'user' ? 'user' : ('model' as const),
    parts: [{ text: m.content }],
  }));

  // Get the last message to send
  const lastMessage = conversationMessages.at(-1);
  if (!lastMessage) {
    throw new Error('No messages to send');
  }

  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
  });

  const chat = generativeModel.startChat({ history });

  // Use streaming if callback provided
  if (onChunk) {
    const result = await chat.sendMessageStream(lastMessage.content);
    let fullText = '';

    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullText += text;
      onChunk(text);
    }

    return fullText;
  }

  // Non-streaming
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

export const AVAILABLE_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and efficient' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'More capable, slower' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest fast model' },
] as const;
