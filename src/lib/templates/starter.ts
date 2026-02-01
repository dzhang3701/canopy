import type { ProjectTemplate } from '../../types';

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start with a clean slate',
    systemPrompt: '',
    icon: '📄',
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Explore topics in depth with citations',
    systemPrompt: `You are a research assistant. Help the user explore topics thoroughly.

Guidelines:
- Provide accurate, well-sourced information
- Acknowledge uncertainty when appropriate
- Suggest related topics to explore
- Break down complex topics into understandable parts`,
    icon: '🔬',
  },
  {
    id: 'coding',
    name: 'Coding',
    description: 'Write, debug, and explain code',
    systemPrompt: `You are an expert programming assistant. Help with coding tasks.

Guidelines:
- Write clean, well-documented code
- Explain your reasoning and approach
- Consider edge cases and error handling
- Follow best practices for the language being used
- Suggest improvements when you see opportunities`,
    icon: '💻',
  },
  {
    id: 'writing',
    name: 'Writing',
    description: 'Draft, edit, and improve text',
    systemPrompt: `You are a writing assistant. Help create and refine written content.

Guidelines:
- Adapt tone and style to the context
- Maintain consistent voice throughout
- Offer constructive suggestions for improvement
- Help with structure, flow, and clarity`,
    icon: '✍️',
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    description: 'Generate and develop ideas',
    systemPrompt: `You are a creative brainstorming partner. Help generate and develop ideas.

Guidelines:
- Encourage creative thinking
- Build on ideas without immediate judgment
- Offer diverse perspectives
- Help organize and prioritize ideas
- Ask clarifying questions to deepen exploration`,
    icon: '💡',
  },
];

export function getTemplate(id: string): ProjectTemplate | undefined {
  return projectTemplates.find((t) => t.id === id);
}

export function getDefaultTemplate(): ProjectTemplate {
  return projectTemplates[0];
}
