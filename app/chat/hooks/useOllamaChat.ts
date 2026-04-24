"use client";

import { useState, useCallback } from "react";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Helper function to remove thinking context from AI responses
const removeThinkingContext = (text: string): string => {
  // Remove <think>...</think> tags and their content (case-insensitive, multiline)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gim, "");
  // Also remove any orphaned opening/closing tags
  cleaned = cleaned.replace(/<\/?think>/gim, "");
  // Clean up extra whitespace
  return cleaned.trim();
};

// Check if text contains incomplete thinking tags
const hasIncompleteThinkTag = (text: string): boolean => {
  const openCount = (text.match(/<think>/gi) || []).length;
  const closeCount = (text.match(/<\/think>/gi) || []).length;
  return openCount > closeCount;
};

export const useOllamaChat = (ollamaUrl: string, systemPrompt: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (userMsg: string) => {
      if (!ollamaUrl) {
        setError("Please set the Ollama endpoint URL first");
        return;
      }

      if (!userMsg.trim()) {
        return;
      }

      setError(null);
      setIsLoading(true);

      const newMsg: Message = { role: "user", content: userMsg };
      setMessages((prev) => [...prev, newMsg]);

      try {
        const conversationMessages = [
          { role: "system", content: systemPrompt },
          ...messages,
          newMsg,
        ];

        const res = await fetch(`${ollamaUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "qwen3:8b",
            stream: true,
            messages: conversationMessages,
            options: {
              // Disable thinking/reasoning mode
              num_ctx: 4096,
            },
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to connect to Ollama: ${res.statusText}`);
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder("utf-8");
        let fullText = "";
        let assistantMessageAdded = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                fullText += json.message.content;

                // Don't display anything if we're still inside thinking tags
                if (hasIncompleteThinkTag(fullText)) {
                  continue;
                }

                // Remove thinking context before displaying
                const cleanedText = removeThinkingContext(fullText);

                // Only display if there's actual content after cleaning
                if (!cleanedText) {
                  continue;
                }

                if (!assistantMessageAdded) {
                  setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: cleanedText },
                  ]);
                  assistantMessageAdded = true;
                } else {
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: cleanedText,
                    };
                    return updated;
                  });
                }
              }
            } catch (e) {
              // Skip invalid JSON lines
              console.warn("Failed to parse JSON line:", line);
            }
          }
        }

        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${errorMessage}. Please check your Ollama endpoint and make sure Ollama is running.`,
          },
        ]);
      }
    },
    [ollamaUrl, systemPrompt, messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, sendMessage, isLoading, error, clearMessages };
};
