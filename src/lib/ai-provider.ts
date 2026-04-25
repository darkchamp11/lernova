/**
 * AI Provider — Groq (primary) → Ollama (fallback)
 *
 * A single entry-point for all server-side AI generation.
 * Tries the Groq cloud API first (fast, free-tier available).
 * If Groq is unavailable or not configured, falls back to local Ollama.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';

export interface AIRequestOptions {
  /** If true, instruct the model to respond in JSON */
  json?: boolean;
  /** Temperature (0–1). Default 0.7 */
  temperature?: number;
  /** Max tokens to generate */
  maxTokens?: number;
  /** System prompt prepended to the conversation */
  systemPrompt?: string;
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ─── Groq ────────────────────────────────────────────────────────────────────

async function callGroq(prompt: string, opts: AIRequestOptions): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const messages: GroqMessage[] = [];
  if (opts.systemPrompt) {
    messages.push({ role: 'system', content: opts.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const body: Record<string, unknown> = {
    model: GROQ_MODEL,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_completion_tokens: opts.maxTokens ?? 2048,
  };

  if (opts.json) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq returned an empty response');
  }
  return content.trim();
}

// ─── Ollama ──────────────────────────────────────────────────────────────────

async function callOllama(prompt: string, opts: AIRequestOptions): Promise<string> {
  const body: Record<string, unknown> = {
    model: OLLAMA_MODEL,
    prompt: opts.systemPrompt ? `${opts.systemPrompt}\n\n${prompt}` : prompt,
    stream: false,
    options: {
      temperature: opts.temperature ?? 0.7,
      num_predict: opts.maxTokens ?? 2048,
    },
  };

  if (opts.json) {
    body.format = 'json';
  }

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ollama API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const content: string = data.response;
  if (!content) {
    throw new Error('Ollama returned an empty response');
  }

  // Strip <think>…</think> blocks that some models emit
  return content.replace(/<think>[\s\S]*?<\/think>/gim, '').trim();
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate an AI response using Groq (primary) with Ollama as fallback.
 * Returns the raw text from the model.
 */
export async function generateAIResponse(
  prompt: string,
  options: AIRequestOptions = {},
): Promise<{ text: string; provider: 'groq' | 'ollama' }> {
  // Try Groq first
  if (GROQ_API_KEY) {
    try {
      const text = await callGroq(prompt, options);
      return { text, provider: 'groq' };
    } catch (err) {
      console.warn('⚠️  Groq failed, falling back to Ollama:', (err as Error).message);
    }
  }

  // Fallback to Ollama
  try {
    const text = await callOllama(prompt, options);
    return { text, provider: 'ollama' };
  } catch (err) {
    throw new Error(
      `Both AI providers failed. Groq: ${GROQ_API_KEY ? 'key set but errored' : 'no key'}. Ollama: ${(err as Error).message}`,
    );
  }
}

/**
 * Convenience wrapper: generate and parse a JSON response.
 * Throws if the model returns invalid JSON.
 */
export async function generateAIJSON<T = unknown>(
  prompt: string,
  options: Omit<AIRequestOptions, 'json'> = {},
): Promise<{ data: T; provider: 'groq' | 'ollama' }> {
  const { text, provider } = await generateAIResponse(prompt, { ...options, json: true });

  // Some models wrap JSON in markdown code fences — strip them
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    const data = JSON.parse(cleaned) as T;
    return { data, provider };
  } catch {
    console.error('AI returned non-JSON:', text.slice(0, 300));
    throw new Error('AI model returned invalid JSON. Please try again.');
  }
}
