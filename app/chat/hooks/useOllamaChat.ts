"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "lernova_chat_messages";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export type Provider = "ollama" | "groq";

export interface ChatConfig {
  provider: Provider;
  model: string;
  // Ollama
  ollamaUrl: string;
  // Groq
  groqApiKey: string;
}

// Helper function to remove thinking context from AI responses
const removeThinkingContext = (text: string): string => {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gim, "");
  cleaned = cleaned.replace(/<\/?think>/gim, "");
  return cleaned.trim();
};

// Check if text contains incomplete thinking tags
const hasIncompleteThinkTag = (text: string): boolean => {
  const openCount = (text.match(/<think>/gi) || []).length;
  const closeCount = (text.match(/<\/think>/gi) || []).length;
  return openCount > closeCount;
};

/**
 * Streams a chat response from the local Ollama instance.
 * Ollama uses its own JSON-lines format: each line is a JSON object with { message: { content } }.
 */
async function streamOllama(
  config: ChatConfig,
  conversationMessages: Message[],
  onToken: (fullText: string) => void
): Promise<void> {
  const res = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      stream: true,
      messages: conversationMessages,
      options: { num_ctx: 4096 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.statusText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body from Ollama");

  const decoder = new TextDecoder("utf-8");
  let fullText = "";

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
          onToken(fullText);
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
  }
}

/**
 * Streams a chat response from the Groq cloud API.
 * Groq uses OpenAI-compatible SSE format: `data: { choices: [{ delta: { content } }] }`
 */
async function streamGroq(
  config: ChatConfig,
  conversationMessages: Message[],
  onToken: (fullText: string) => void
): Promise<void> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.groqApiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: conversationMessages,
      stream: true,
      temperature: 0.7,
      max_completion_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    if (res.status === 401) {
      throw new Error("Invalid Groq API key. Please check your key in settings.");
    }
    if (res.status === 429) {
      throw new Error("Groq rate limit exceeded. Please wait a moment and try again.");
    }
    throw new Error(`Groq API error (${res.status}): ${errorBody}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body from Groq");

  const decoder = new TextDecoder("utf-8");
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // Keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6); // Remove "data: " prefix
      if (data === "[DONE]") break;

      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onToken(fullText);
        }
      } catch {
        // Skip invalid JSON
      }
    }
  }
}

export const useChat = (config: ChatConfig, systemPrompt: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Ignore corrupt localStorage data
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (userMsg: string) => {
      if (config.provider === "ollama" && !config.ollamaUrl) {
        setError("Please set the Ollama endpoint URL in settings.");
        return;
      }
      if (config.provider === "groq" && !config.groqApiKey) {
        setError("Please set your Groq API key in settings.");
        return;
      }
      if (!userMsg.trim()) return;

      setError(null);
      setIsLoading(true);

      const newMsg: Message = { role: "user", content: userMsg };
      setMessages((prev) => [...prev, newMsg]);

      try {
        const conversationMessages: Message[] = [
          { role: "system", content: systemPrompt },
          ...messages,
          newMsg,
        ];

        let assistantMessageAdded = false;

        const handleToken = (fullText: string) => {
          // Don't display anything while inside thinking tags
          if (hasIncompleteThinkTag(fullText)) return;

          const cleanedText = removeThinkingContext(fullText);
          if (!cleanedText) return;

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
        };

        if (config.provider === "ollama") {
          await streamOllama(config, conversationMessages, handleToken);
        } else {
          await streamGroq(config, conversationMessages, handleToken);
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
            content: `Error: ${errorMessage}`,
          },
        ]);
      }
    },
    [config, systemPrompt, messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { messages, sendMessage, isLoading, error, clearMessages };
};
