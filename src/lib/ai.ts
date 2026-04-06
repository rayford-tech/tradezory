/**
 * Provider-agnostic AI helpers.
 * Priority: GEMINI_API_KEY (free) → ANTHROPIC_API_KEY (paid)
 * Get a free Gemini key at https://aistudio.google.com/app/apikey
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

type ModelTier = "fast" | "smart";

const GEMINI_MODELS: Record<ModelTier, string> = {
  fast: "gemini-2.0-flash-lite",
  smart: "gemini-2.0-flash",
};

const CLAUDE_MODELS: Record<ModelTier, string> = {
  fast: "claude-haiku-4-5-20251001",
  smart: "claude-sonnet-4-6",
};

function getProvider(): "gemini" | "anthropic" {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  throw new Error(
    "No AI API key configured. Set GEMINI_API_KEY (free, aistudio.google.com) or ANTHROPIC_API_KEY in .env"
  );
}

export async function callAI(opts: {
  system: string;
  user: string;
  tier?: ModelTier;
  maxTokens?: number;
}): Promise<string> {
  const { system, user, tier = "smart", maxTokens = 600 } = opts;
  const provider = getProvider();

  if (provider === "gemini") {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: GEMINI_MODELS[tier],
      contents: user,
      config: { systemInstruction: system, maxOutputTokens: maxTokens },
    });
    return response.text ?? "";
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: CLAUDE_MODELS[tier],
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return (message.content[0] as any).text as string;
}

export async function streamAI(opts: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
}): Promise<ReadableStream> {
  const { system, messages } = opts;
  const provider = getProvider();

  if (provider === "gemini") {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const stream = await ai.models.generateContentStream({
      model: GEMINI_MODELS.smart,
      contents,
      config: { systemInstruction: system, maxOutputTokens: 500 },
    });
    return new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.text) controller.enqueue(new TextEncoder().encode(chunk.text));
        }
        controller.close();
      },
    });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const stream = anthropic.messages.stream({
    model: CLAUDE_MODELS.smart,
    max_tokens: 500,
    system,
    messages,
  });
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });
}
