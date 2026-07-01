import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/rbac';
import { rateLimit } from '@/lib/security/rate-limit';
import { athenaService } from '@/server/services';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.organizationId) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!hasPermission(session.user.role, 'athena:use')) {
    return new Response('Forbidden', { status: 403 });
  }

  const limit = await rateLimit(`athena:${session.user.id}`, 30, 60_000);
  if (!limit.success) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  const body = (await request.json()) as {
    conversationId?: string;
    message: string;
  };

  if (!body.message?.trim()) {
    return new Response('Message required', { status: 400 });
  }

  let conversationId = body.conversationId;

  if (!conversationId) {
    conversationId = await athenaService.createConversation(
      session.user.organizationId,
      session.user.id,
      body.message.trim(),
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      };

      send({ type: 'conversation', conversationId });

      try {
        for await (const chunk of athenaService.streamChat(
          conversationId!,
          body.message.trim(),
          {
            organizationId: session.user.organizationId,
            userId: session.user.id,
          },
        )) {
          send(chunk as Record<string, unknown>);
        }
      } catch (error) {
        send({
          type: 'error',
          content:
            error instanceof Error ? error.message : 'Stream failed',
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
