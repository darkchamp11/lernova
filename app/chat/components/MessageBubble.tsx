"use client";

import type { Message } from "../hooks/useOllamaChat";

interface MessageBubbleProps {
  message: Message;
}

/**
 * Converts markdown text to HTML.
 * Handles: headings, horizontal rules, bold, italic, inline code,
 * code blocks, unordered lists, ordered lists, and line breaks.
 */
const formatMarkdown = (text: string): string => {
  let formatted = text;

  // Escape HTML entities first (prevent XSS)
  formatted = formatted
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (``` ... ```)
  formatted = formatted.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    '<pre class="bg-gray-800 dark:bg-gray-900 text-green-300 rounded-lg p-4 my-3 overflow-x-auto text-sm font-mono whitespace-pre-wrap"><code>$2</code></pre>'
  );

  // Inline code (`code`)
  formatted = formatted.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
  );

  // Horizontal rules (--- or ___ or ***)
  formatted = formatted.replace(
    /^[\s]*([-_*]){3,}[\s]*$/gm,
    '<hr class="border-gray-300 dark:border-gray-600 my-4" />'
  );

  // Headings (### h3, ## h2, # h1)
  formatted = formatted.replace(
    /^### (.+)$/gm,
    '<h3 class="text-base font-bold mt-4 mb-1">$1</h3>'
  );
  formatted = formatted.replace(
    /^## (.+)$/gm,
    '<h2 class="text-lg font-bold mt-4 mb-1">$1</h2>'
  );
  formatted = formatted.replace(
    /^# (.+)$/gm,
    '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>'
  );

  // Bold (**text** or __text__)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic (*text* or _text_) — but not inside words like file_name
  formatted = formatted.replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, "<em>$1</em>");
  formatted = formatted.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, "<em>$1</em>");

  // Unordered list items (- item or * item)
  formatted = formatted.replace(
    /^[\s]*[-*]\s+(.+)$/gm,
    '<li class="ml-4 list-disc">$1</li>'
  );

  // Ordered list items (1. item)
  formatted = formatted.replace(
    /^[\s]*\d+\.\s+(.+)$/gm,
    '<li class="ml-4 list-decimal">$1</li>'
  );

  // Wrap consecutive <li> items in <ul> or <ol>
  formatted = formatted.replace(
    /(<li class="ml-4 list-disc">[\s\S]*?<\/li>)(\s*<li class="ml-4 list-disc">[\s\S]*?<\/li>)*/g,
    (match) => `<ul class="my-2 space-y-1">${match}</ul>`
  );
  formatted = formatted.replace(
    /(<li class="ml-4 list-decimal">[\s\S]*?<\/li>)(\s*<li class="ml-4 list-decimal">[\s\S]*?<\/li>)*/g,
    (match) => `<ol class="my-2 space-y-1">${match}</ol>`
  );

  // Convert remaining newlines to <br> (but not inside <pre> blocks and not double newlines already handled)
  // First, collapse triple+ newlines to double
  formatted = formatted.replace(/\n{3,}/g, "\n\n");
  // Double newlines become paragraph breaks
  formatted = formatted.replace(/\n\n/g, '<div class="my-3"></div>');
  // Single newlines become <br>
  formatted = formatted.replace(/\n/g, "<br />");

  return formatted;
};

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const formattedContent = isUser
    ? message.content
    : formatMarkdown(message.content);

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
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
        <div className="break-words leading-relaxed">
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <div
              className="prose-chat"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
