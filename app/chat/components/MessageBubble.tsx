"use client";

import { Message } from "../hooks/useOllamaChat";

interface MessageBubbleProps {
  message: Message;
}

// Simple markdown to HTML converter
const formatMarkdown = (text: string): string => {
  let formatted = text;
  
  // Convert **bold** to <strong>
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  
  // Convert *italic* to <em>
  formatted = formatted.replace(/\*(.+?)\*/g, "<em>$1</em>");
  
  // Convert _italic_ to <em>
  formatted = formatted.replace(/_(.+?)_/g, "<em>$1</em>");
  
  // Convert `code` to <code>
  formatted = formatted.replace(/`(.+?)`/g, '<code class="bg-gray-800 dark:bg-gray-600 px-1 py-0.5 rounded text-sm">$1</code>');
  
  // Convert numbered lists
  formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive <li> items in <ol>
  formatted = formatted.replace(/(<li>.*<\/li>\s*)+/g, (match) => `<ol class="list-decimal ml-5 space-y-1">${match}</ol>`);
  
  return formatted;
};

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const formattedContent = isUser ? message.content : formatMarkdown(message.content);

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              AI Tutor
            </span>
          </div>
        )}
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {isUser ? (
            message.content
          ) : (
            <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
          )}
        </div>
      </div>
    </div>
  );
}
