import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, MessageSquare, Plus, RefreshCw, User, Terminal, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetConversations, useCreateConversation, useGetConversationMessages, useSendMessage,
  getGetConversationsQueryKey, getGetConversationMessagesQueryKey,
} from "@workspace/api-client-react";

const examplePrompts = [
  "Analyze all campaigns",
  "Find wasted spend",
  "Compare Meta and Google ROAS",
  "Predict next month performance",
  "Why are conversions dropping?",
];

export function AthenaChat() {
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [inputPrompt, setInputPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useGetConversations({
    query: {
      onSuccess: (data: any[]) => {
        if (data?.length > 0 && !activeConvoId) {
          setActiveConvoId(data[0].id);
        }
      },
    },
  } as any);

  const { data: messages = [], isLoading: messagesLoading } = useGetConversationMessages(
    activeConvoId || "",
    { query: { enabled: !!activeConvoId, queryKey: getGetConversationMessagesQueryKey(activeConvoId || "") } }
  );

  const createConvoMutation = useCreateConversation({
    mutation: {
      onSuccess: (data: any) => {
        queryClient.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
        setActiveConvoId(data.id);
      },
    },
  });

  const sendMutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetConversationMessagesQueryKey(activeConvoId || "") });
      },
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = () => {
    createConvoMutation.mutate({ data: { title: "New Conversation" } });
  };

  const handleSend = async (prompt?: string) => {
    const content = prompt || inputPrompt.trim();
    if (!content || !activeConvoId) return;
    setInputPrompt("");

    if (!activeConvoId) {
      createConvoMutation.mutate({ data: { title: content.slice(0, 30) } }, {
        onSuccess: (data: any) => {
          sendMutation.mutate({ id: data.id, data: { content } });
        },
      });
    } else {
      sendMutation.mutate({ id: activeConvoId, data: { content } });
    }
  };

  const typedMessages = messages as Array<{ id: string; role: string; content: string; createdAt: string }>;
  const typedConversations = conversations as Array<{ id: string; title: string; createdAt: string }>;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 glass-card rounded-[20px] border border-white/5 bg-white/[0.01] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-white/[0.04]">
          <button onClick={handleNewChat} disabled={createConvoMutation.isPending} className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] text-xs text-neutral-300 hover:text-white transition cursor-pointer">
            <Plus className="w-3.5 h-3.5" />New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {typedConversations.map((c) => (
            <button key={c.id} onClick={() => setActiveConvoId(c.id)} className={`w-full text-left px-3 py-2 rounded-[10px] text-xs transition cursor-pointer truncate ${activeConvoId === c.id ? "bg-white/[0.06] text-white" : "text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200"}`}>
              <MessageSquare className="w-3 h-3 inline mr-1.5 flex-shrink-0" />{c.title}
            </button>
          ))}
          {typedConversations.length === 0 && <p className="text-[10px] text-neutral-600 text-center py-4">No conversations yet</p>}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 glass-card rounded-[20px] border border-white/5 bg-white/[0.01] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.04] flex items-center gap-2">
          <div className="h-8 w-8 rounded-[10px] bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Athena AI</h3>
            <p className="text-[10px] text-neutral-500">Marketing intelligence assistant</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeConvoId && (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-white">Ask Athena anything</h3>
                <p className="text-xs text-neutral-500 mt-1">Powered by your real campaign data</p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                {examplePrompts.map((p) => (
                  <button key={p} onClick={() => { handleNewChat(); setTimeout(() => handleSend(p), 500); }} className="text-left px-4 py-2.5 rounded-[12px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] text-xs text-neutral-300 hover:text-white transition cursor-pointer">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeConvoId && (
            <>
              {messagesLoading && <div className="flex items-center gap-2 text-neutral-500 text-xs"><RefreshCw className="w-3 h-3 animate-spin" />Loading...</div>}
              {typedMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`h-7 w-7 rounded-[8px] flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-blue-950/40 border border-blue-500/20 text-blue-400" : "bg-purple-950/40 border border-purple-500/20 text-purple-400"}`}>
                    {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`max-w-[80%] px-4 py-3 rounded-[16px] text-xs leading-relaxed ${msg.role === "user" ? "bg-blue-950/20 border border-blue-500/10 text-neutral-200" : "bg-white/[0.03] border border-white/5 text-neutral-200"}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {sendMutation.isPending && (
                <div className="flex gap-3">
                  <div className="h-7 w-7 rounded-[8px] bg-purple-950/40 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="px-4 py-3 rounded-[16px] bg-white/[0.03] border border-white/5 text-xs text-neutral-400">
                    <RefreshCw className="w-3 h-3 animate-spin inline mr-1.5" />Athena is thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/[0.04]">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask about your campaigns, ROAS, spend..."
              className="flex-1 px-4 py-2.5 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 text-xs text-white placeholder:text-neutral-600 outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputPrompt.trim() || sendMutation.isPending}
              className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-[10px] bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AthenaChat;
