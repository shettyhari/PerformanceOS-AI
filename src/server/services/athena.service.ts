import 'server-only';

import { AthenaMessageRole } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import {
  generateAthenaTitle,
  streamAthenaResponse,
  type ChatMessage,
} from '@/lib/infrastructure/gemini/athena';
import type { McpToolContext } from '@/server/mcp/executor';

export interface ConversationSummary {
  id: string;
  title: string | null;
  updatedAt: Date;
  messageCount: number;
}

export interface ConversationMessage {
  id: string;
  role: AthenaMessageRole;
  content: string;
  toolCalls: unknown;
  createdAt: Date;
}

export class AthenaService {
  async listConversations(
    organizationId: string,
    userId: string,
  ): Promise<ConversationSummary[]> {
    const conversations = await prisma.athenaConversation.findMany({
      where: { organizationId, userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: { _count: { select: { messages: true } } },
    });

    return conversations.map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt,
      messageCount: c._count.messages,
    }));
  }

  async getConversation(
    conversationId: string,
    organizationId: string,
    userId: string,
  ): Promise<{ id: string; title: string | null; messages: ConversationMessage[] } | null> {
    const conversation = await prisma.athenaConversation.findFirst({
      where: { id: conversationId, organizationId, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) return null;

    return {
      id: conversation.id,
      title: conversation.title,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls,
        createdAt: m.createdAt,
      })),
    };
  }

  async createConversation(
    organizationId: string,
    userId: string,
    firstMessage: string,
  ): Promise<string> {
    const title = await generateAthenaTitle(firstMessage);

    const conversation = await prisma.athenaConversation.create({
      data: {
        organizationId,
        userId,
        title,
      },
    });

    return conversation.id;
  }

  async addMessage(
    conversationId: string,
    role: AthenaMessageRole,
    content: string,
    toolCalls?: unknown,
    toolResults?: unknown,
  ): Promise<void> {
    await prisma.$transaction([
      prisma.athenaMessage.create({
        data: {
          conversationId,
          role,
          content,
          toolCalls: toolCalls as never,
          toolResults: toolResults as never,
        },
      }),
      prisma.athenaConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
  }

  async *streamChat(
    conversationId: string,
    userMessage: string,
    context: McpToolContext,
  ): AsyncGenerator<{ type: string; content?: string; toolName?: string; data?: unknown }> {
    const conversation = await prisma.athenaConversation.findFirst({
      where: {
        id: conversationId,
        organizationId: context.organizationId,
        userId: context.userId,
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 40 },
      },
    });

    if (!conversation) {
      yield { type: 'error', content: 'Conversation not found' };
      return;
    }

    await this.addMessage(conversationId, AthenaMessageRole.USER, userMessage);

    const history: ChatMessage[] = [
      ...conversation.messages
        .filter((m) => m.role === AthenaMessageRole.USER || m.role === AthenaMessageRole.ASSISTANT)
        .map((m) => ({
          role: m.role === AthenaMessageRole.USER ? ('user' as const) : ('assistant' as const),
          content: m.content,
        })),
      { role: 'user', content: userMessage },
    ];

    let assistantContent = '';
    const toolCallsLog: Array<{ name: string; result: unknown }> = [];

    for await (const chunk of streamAthenaResponse(history, context)) {
      if (chunk.type === 'text' && chunk.content) {
        assistantContent += chunk.content;
      }
      if (chunk.type === 'tool_result' && chunk.toolName) {
        toolCallsLog.push({ name: chunk.toolName, result: chunk.data });
      }
      yield chunk;
    }

    if (assistantContent) {
      await this.addMessage(
        conversationId,
        AthenaMessageRole.ASSISTANT,
        assistantContent,
        toolCallsLog.length > 0 ? toolCallsLog : undefined,
      );
    }
  }

  async deleteConversation(
    conversationId: string,
    organizationId: string,
    userId: string,
  ): Promise<void> {
    await prisma.athenaConversation.deleteMany({
      where: { id: conversationId, organizationId, userId },
    });
  }
}

export const athenaService = new AthenaService();
