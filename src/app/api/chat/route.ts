// import { streamText, UIMessage, convertToModelMessages } from "ai";
// import { openai } from "@ai-sdk/openai";

// export async function POST(req: Request) {
//   try {
//     const { messages }: { messages: UIMessage[] } = await req.json();
//     const modelMessages = await convertToModelMessages(messages);

//     const result = streamText({
//       model: openai("gpt-4.1-mini"),
//       messages: modelMessages,
//     });
//     return result.toUIMessageStreamResponse();
//   } catch (error) {
//     console.error("Error streaming chat completion:", error);
//     return new Response("Failed to stream chat completion", { status: 500 });
//   }
// }

import {
  streamText,
  UIMessage,
  convertToModelMessages,
} from "ai";

import { createOpenAI } from "@ai-sdk/openai";

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } =
      await req.json();

    const modelMessages =
      await convertToModelMessages(messages);

    const result = streamText({
      model: openrouter("openai/gpt-oss-120b:free"),
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error(
      "Error streaming chat completion:",
      error
    );

    return new Response(
      "Failed to stream chat completion",
      { status: 500 }
    );
  }
}
