// src/lib/embeddings.ts
import { createOpenAI } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

function createOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  return createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
      "HTTP-Referer": "http://localhost:3000",
      "X-OpenRouter-Title": "AI SDK RAG Chatbot",
    },
  });
}

function getEmbeddingModel() {
  return createOpenRouter().embeddingModel("openai/text-embedding-3-small");
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.replaceAll("\n", " ");

  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value: input,
  });

  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const inputs = texts.map((text) => text.replaceAll("\n", " "));

  const { embeddings } = await embedMany({
    model: getEmbeddingModel(),
    values: inputs,
  });

  return embeddings;
}
