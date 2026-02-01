import type { Message } from '../../types';
import { cn } from '../../utils/cn';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        )}
      >
        <div className="whitespace-pre-wrap break-words text-sm">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
