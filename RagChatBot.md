# RAG Chatbot — Codebase Overview

This is a **RAG (Retrieval-Augmented Generation) chatbot** built with Next.js 16 (App Router), and it's actually a pretty clean example of the pattern. Here's how it fits together.

## The core idea

Two independent pipelines:

1. **Ingestion** (`/upload`): PDF → text → chunks → embeddings → stored in Postgres (with `pgvector`)
2. **Retrieval + chat** (`/chat`): user question → LLM decides whether to search → vector similarity search → LLM answers using retrieved chunks

## Tech stack

| Layer | Tool |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Chat UI | Vercel AI SDK (`ai`, `@ai-sdk/react`) + "ai-elements" component kit |
| LLM/embeddings | OpenRouter (OpenAI-compatible), models `openai/gpt-oss-120b` and `openai/text-embedding-3-small` |
| DB | Neon Postgres + `pgvector`, via Drizzle ORM |
| Chunking | LangChain's `RecursiveCharacterTextSplitter` |
| PDF parsing | `pdf-parse` |
| Auth | Clerk |
| Styling | Tailwind + shadcn/radix components |

## Data flow: uploading a PDF

`src/app/upload/page.tsx` → `actionsNEW.ts` (a server action):

1. Validates it's a PDF, reads bytes with `PDFParse`
2. Splits text into ~150-char chunks with 20-char overlap (`src/lib/chunking.ts`)
3. Generates an embedding vector (1536-dim) for each chunk via OpenRouter (`src/lib/embeddings.ts`)
4. Inserts `{content, embedding}` rows into the `documents` table (`src/lib/db-schema.ts`)

The table has an **HNSW index** on the embedding column using cosine distance — that's what makes similarity search fast.

## Data flow: chatting

`src/app/chat/page.tsx` uses `useChat()` from `@ai-sdk/react`, which posts messages to `src/app/api/chat/route.ts`. That route:

1. Converts UI messages to model messages
2. Calls `streamText()` with a **tool** called `searchKnowledgeBase`
3. The model decides *itself* whether to call the tool (agentic RAG, not naive "always retrieve")
4. When called, `searchDocuments()` (`src/lib/search.ts`) embeds the query, computes `1 - cosineDistance` against stored vectors via Drizzle, filters by similarity threshold (0.5), returns top 3
5. `stopWhen: stepCountIs(2)` caps it to one tool-call round-trip before final answer
6. Response streams back to the UI as a `UIMessageStreamResponse`

The system prompt explicitly tells the model to search before answering and keep answers concise — a nice touch to prevent it from dumping raw chunks on the user.

## The `ai-elements` folder

This is just Vercel's prebuilt chat-UI component library (`npx ai-elements@latest`) — conversation panes, message bubbles, prompt input with attachments, tool-call displays, code blocks, reasoning/thinking displays, etc. Only a handful are actually used in this app (`conversation`, `message`, `prompt-input`, `response`, `loader`) — the rest are unused scaffolding that came with the install.

## Things worth flagging

- **`src/proxy.ts` isn't active middleware.** Next.js only picks up middleware from a file literally named `middleware.ts` at the root (or `src/middleware.ts`). This file has Clerk route-protection logic (blocking `/upload` unless `sessionClaims.metadata.role === "admin"`) but as `proxy.ts` it's dead code — needs renaming to take effect. The README even notes this.
- **API key handling**: both `route.ts` and `embeddings.ts` throw if `OPENROUTER_API_KEY` is missing, with a friendly 500 response — reasonable, but note it's duplicated in two places (`createOpenRouter()` defined twice).
- **`AGENTS.md`** flags something important: it claims "this is NOT the Next.js you know" and tells agents to check `node_modules/next/dist/docs/` before writing code — implying the Next.js version here has non-standard/bleeding-edge APIs (makes sense given `next: 16.2.6`, `react: 19.2.4`, and `reactCompiler: true` in the config).
- **Chunk size is small** (150 chars, 20 overlap) — fairly aggressive splitting; fine for short factual snippets, but multi-sentence context could get fragmented.
