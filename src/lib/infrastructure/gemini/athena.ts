import 'server-only';

import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
} from '@google/generative-ai';
import { env } from '@/lib/env';
import {
  executeMcpTool,
  getGeminiFunctionDeclarations,
  type McpToolContext,
} from '@/server/mcp/executor';

const ATHENA_SYSTEM_PROMPT = `You are Athena AI, the intelligent marketing assistant for PerformanceOS AI.

You help marketing teams analyze campaigns, optimize budgets, forecast performance, and generate executive insights.

Rules:
- Use the provided tools to fetch real data. Never invent metrics.
- Be concise, actionable, and data-driven.
- Format responses in clear markdown with headings and bullet points when appropriate.
- When analyzing performance, cite specific numbers from tool results.
- Proactively suggest optimizations based on ROAS, CPA, and channel performance.`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'done' | 'error';
  content?: string;
  toolName?: string;
  data?: unknown;
}

function buildFunctionDeclarations(): FunctionDeclaration[] {
  return getGeminiFunctionDeclarations().map((f) => ({
    name: f.name,
    description: f.description,
    parameters: {
      type: SchemaType.OBJECT,
      properties: Object.fromEntries(
        Object.entries(f.parameters.properties).map(([key, val]) => [
          key,
          {
            type:
              val.type === 'number' ? SchemaType.NUMBER : SchemaType.STRING,
            ...(val.enum ? { format: 'enum' as const, enum: val.enum } : {}),
          },
        ]),
      ),
    },
  }));
}

function getModel() {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: ATHENA_SYSTEM_PROMPT,
    tools: [{ functionDeclarations: buildFunctionDeclarations() }],
  });
}

export async function* streamAthenaResponse(
  messages: ChatMessage[],
  context: McpToolContext,
): AsyncGenerator<StreamChunk> {
  const model = getModel();
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    yield { type: 'error', content: 'No user message provided' };
    return;
  }

  const history: Content[] = messages.slice(0, -1).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  let fullText = '';
  const maxToolRounds = 5;

  for (let round = 0; round < maxToolRounds; round++) {
    const prompt = round === 0 ? lastMessage.content : undefined;
    const result = prompt
      ? await chat.sendMessageStream(prompt)
      : await chat.sendMessageStream('Continue with your analysis based on the tool results.');

    let functionCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullText += text;
        yield { type: 'text', content: text };
      }

      const calls = chunk.functionCalls();
      if (calls?.length) {
        functionCalls = calls.map((c) => ({
          name: c.name,
          args: (c.args ?? {}) as Record<string, unknown>,
        }));
      }
    }

    if (functionCalls.length === 0) break;

    const functionResponses = [];
    for (const call of functionCalls) {
      yield {
        type: 'tool_call',
        toolName: call.name,
        content: `Fetching ${call.name.replace(/_/g, ' ')}...`,
      };

      try {
        const toolResult = await executeMcpTool(
          call.name,
          call.args,
          context,
        );
        yield { type: 'tool_result', toolName: call.name, data: toolResult };
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { result: toolResult },
          },
        });
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Tool execution failed';
        yield { type: 'error', content: msg };
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { error: msg },
          },
        });
      }
    }

    if (functionResponses.length > 0) {
      const followUp = await chat.sendMessageStream(functionResponses);
      let hasMoreText = false;
      for await (const chunk of followUp.stream) {
        const text = chunk.text();
        if (text) {
          hasMoreText = true;
          fullText += text;
          yield { type: 'text', content: text };
        }
        const calls = chunk.functionCalls();
        if (calls?.length) {
          functionCalls = calls.map((c) => ({
            name: c.name,
            args: (c.args ?? {}) as Record<string, unknown>,
          }));
        } else {
          functionCalls = [];
        }
      }
      if (!hasMoreText && functionCalls.length === 0) break;
      if (functionCalls.length === 0) break;
    }
  }

  yield { type: 'done', content: fullText };
}

export async function generateAthenaTitle(
  firstMessage: string,
): Promise<string> {
  if (!env.GEMINI_API_KEY) return 'New conversation';

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
  const result = await model.generateContent(
    `Generate a short title (max 6 words) for a marketing analytics conversation that starts with: "${firstMessage.slice(0, 200)}". Return only the title, no quotes.`,
  );
  return result.response.text().trim().slice(0, 80) || 'New conversation';
}
