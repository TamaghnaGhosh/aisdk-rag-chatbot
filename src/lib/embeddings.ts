// src/lib/embeddings.ts
import { createOpenAI } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const embeddingModel = openrouter.textEmbeddingModel(
  "openai/text-embedding-3-small",
);

export async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.replaceAll("\n", " ");

  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });

  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const inputs = texts.map((text) => text.replaceAll("\n", " "));

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: inputs,
  });

  return embeddings;
}
