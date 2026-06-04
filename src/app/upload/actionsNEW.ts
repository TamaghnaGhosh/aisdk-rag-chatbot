"use server";

import { PDFParse } from "pdf-parse";
import { chunkContent } from "@/lib/chunking";
import { db } from "@/lib/db-config";
import { documents } from "@/lib/db-schema";
import { generateEmbeddings } from "@/lib/embeddings";

export async function processPdfFile(formData: FormData) {
  try {
    const file = formData.get("pdf");

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose a PDF file to upload" };
    }

    if (file.type !== "application/pdf") {
      return { success: false, error: "Only PDF files are supported" };
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return {
        success: false,
        error: "Missing OPENROUTER_API_KEY in .env.local for PDF embeddings",
      };
    }

    // Read File bytes and extract text
    const bytes = await file.arrayBuffer();
    const parser = new PDFParse({ data: new Uint8Array(bytes) });
    const data = await parser.getText().finally(() => parser.destroy());

    if (!data.text || data?.text?.trim()?.length === 0) {
      return { success: false, error: "No text found in PDF file" };
    }

    // Chunk the extracted text
    const chunks = await chunkContent(data.text);
    // Generate embeddings for each chunk
    const embeddings = await generateEmbeddings(chunks);
    // Store records and chunks in the database
    const records = chunks.map((chunk, index) => ({
      content: chunk,
      embedding: embeddings[index],
    }));

    await db.insert(documents).values(records);

    return {
      success: true,
      message: `Created ${records.length} searchable chunks`,
    };
  } catch (error) {
    console.error("PDF processing error", error);
    return { success: false, error: "Failed to process PDF file" };
  }
}
