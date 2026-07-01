'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, Loader2, Send, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
  messageCount: number;
}

const SUGGESTIONS = [
  'Summarize campaign performance for the last 30 days',
  'Which channels have the best ROAS?',
  'Detect any spend anomalies this week',
  'Give me an executive summary',
];

export function AthenaChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/athena/conversations');
    if (res.ok) {
      const data = (await res.json()) as { conversations: Conversation[] };
      setConversations(data.conversations);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/athena/conversations/${id}`);
    if (res.ok) {
      const data = (await res.json()) as {
        messages: Array<{ id: string; role: string; content: string }>;
      };
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          role: m.role === 'USER' ? 'user' : 'assistant',
          content: m.content,
        })),
      );
      setActiveId(id);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', isStreaming: true },
    ]);

    try {
      const res = await fetch('/api/athena/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeId,
          message: text.trim(),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Failed to connect to Athena');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let newConversationId = activeId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const event = JSON.parse(line.slice(6)) as {
            type: string;
            content?: string;
            conversationId?: string;
            toolName?: string;
          };

          if (event.type === 'conversation' && event.conversationId) {
            newConversationId = event.conversationId;
            setActiveId(event.conversationId);
          }

          if (event.type === 'text' && event.content) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + event.content }
                  : m,
              ),
            );
          }

          if (event.type === 'tool_call' && event.toolName) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content:
                        m.content +
                        `\n\n*${event.content ?? `Using ${event.toolName}`}*\n`,
                    }
                  : m,
              ),
            );
          }

          if (event.type === 'error') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + `\n\n**Error:** ${event.content}` }
                  : m,
              ),
            );
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m,
        ),
      );

      if (newConversationId) {
        await loadConversations();
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  error instanceof Error
                    ? error.message
                    : 'Something went wrong',
                isStreaming: false,
              }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function startNewChat() {
    setActiveId(null);
    setMessages([]);
  }

  async function deleteChat(id: string) {
    await fetch(`/api/athena/conversations?id=${id}`, { method: 'DELETE' });
    if (activeId === id) await startNewChat();
    await loadConversations();
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <aside className="hidden w-64 shrink-0 flex-col rounded-2xl border bg-card lg:flex">
        <div className="flex items-center justify-between border-b p-4">
          <span className="text-sm font-semibold">History</span>
          <Button variant="ghost" size="sm" onClick={startNewChat}>
            New
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                'group mb-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent',
                activeId === c.id && 'bg-accent',
              )}
            >
              <button
                type="button"
                className="flex-1 truncate text-left"
                onClick={() => loadConversation(c.id)}
              >
                {c.title ?? 'Untitled'}
              </button>
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100"
                onClick={() => deleteChat(c.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </ScrollArea>
      </aside>

      <div className="flex flex-1 flex-col rounded-2xl border bg-card">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">Athena AI</h2>
            <p className="text-xs text-muted-foreground">
              Powered by Gemini · MCP tools enabled
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <Sparkles className="mb-4 h-10 w-10 text-primary" />
              <h3 className="text-lg font-semibold">How can I help?</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Ask about campaign performance, budget optimization, anomalies,
                or request an executive summary.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="rounded-xl border bg-background px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
                    onClick={() => sendMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'flex',
                    m.role === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted prose prose-sm dark:prose-invert max-w-none',
                    )}
                  >
                    {m.role === 'assistant' ? (
                      <ReactMarkdown>{m.content || (m.isStreaming ? '...' : '')}</ReactMarkdown>
                    ) : (
                      m.content
                    )}
                    {m.isStreaming && (
                      <Loader2 className="mt-2 h-4 w-4 animate-spin" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Athena anything about your marketing data..."
              className="flex-1 rounded-xl border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="h-12 w-12 shrink-0" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
