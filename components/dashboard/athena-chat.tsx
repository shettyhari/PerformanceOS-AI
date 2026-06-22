"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Send, MessageSquare, Plus, RefreshCw, 
  HelpCircle, ArrowRight, User, Terminal, AlertTriangle 
} from "lucide-react";
import { 
  fetchConversations, createNewConversation, 
  fetchConversationMessages, sendAthenaQuery 
} from "../../server/actions/athena";

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
}

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

export function AthenaChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const examplePrompts = [
    "Analyze all campaigns",
    "Find wasted spend",
    "Compare Meta and Google ROAS",
    "Predict next month performance",
    "Why are conversions dropping?"
  ];

  // Fetch conversations list on mount
  useEffect(() => {
    loadChatList();
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConvoId) {
      loadMessages(activeConvoId);
    }
  }, [activeConvoId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadChatList = async () => {
    try {
      const res = await fetchConversations();
      if (res.success && res.conversations) {
        setConversations(res.conversations as any);
        if (res.conversations.length > 0 && !activeConvoId) {
          setActiveConvoId(res.conversations[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (convoId: string) => {
    setHistoryLoading(true);
    setError(null);
    try {
      const res = await fetchConversationMessages(convoId);
      if (res.success && res.messages) {
        setMessages(res.messages as any);
      } else {
        setError(res.error || "Failed to load messages");
      }
    } catch (err) {
      setError("Error loading messages history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateNewChat = async () => {
    setError(null);
    try {
      const title = `Analysis ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
      const res = await createNewConversation(title);
      if (res.success && res.conversation) {
        setConversations((prev) => [res.conversation as any, ...prev]);
        setActiveConvoId(res.conversation.id);
        setMessages([]);
      } else {
        setError(res.error || "Failed to initialize new thread");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  const handleSendMessage = async (promptToSend = inputPrompt) => {
    if (!promptToSend.trim() || !activeConvoId || loading) return;
    setLoading(true);
    setError(null);
    setInputPrompt("");

    // Optimistically update UI with user message
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: promptToSend,
      createdAt: new Date()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await sendAthenaQuery(activeConvoId, promptToSend);
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message as any]);
      } else {
        setError(res.error || "AI Response failed");
      }
    } catch (err) {
      setError("Connection to Generative AI engine timed out.");
    } finally {
      setLoading(false);
    }
  };

  const handleExamplePromptClick = (p: string) => {
    handleSendMessage(p);
  };

  // Basic Markdown Renderer for Tables & Blocks (custom lightweight parser)
  const renderMarkdown = (text: string) => {
    // 1. Identify and split tables
    const lines = text.split("\n");
    const parsedElements: React.ReactNode[] = [];
    let currentTableRows: string[][] = [];
    let inTable = false;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Table identifier: starts with |
      if (trimmed.startsWith("|")) {
        inTable = true;
        const cols = trimmed.split("|").map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
        
        // Skip separator line |---|---|
        if (cols.every(c => c.match(/^:?-+:?$/))) return;

        currentTableRows.push(cols);
        return;
      }

      // If we were in a table and hit a non-table line, render the table
      if (inTable && !trimmed.startsWith("|")) {
        inTable = false;
        if (currentTableRows.length > 0) {
          const headers = currentTableRows[0];
          const rows = currentTableRows.slice(1);
          parsedElements.push(
            <div key={`table-${index}`} className="my-4 overflow-x-auto rounded-[14px] border border-white/5 bg-black/30">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} className="py-2.5 px-4 font-medium text-white">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02] text-neutral-300">
                  {rows.map((r, rIdx) => (
                    <tr key={rIdx} className="hover:bg-white/[0.01]">
                      {r.map((cell, cIdx) => (
                        <td key={cIdx} className="py-2.5 px-4 font-mono">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          currentTableRows = [];
        }
      }

      // Blockquote / Alerts
      if (trimmed.startsWith(">")) {
        parsedElements.push(
          <blockquote key={index} className="pl-4 border-l-2 border-purple-500 text-neutral-400 italic my-2 font-light text-xs">
            {trimmed.substring(1).trim()}
          </blockquote>
        );
        return;
      }

      // Headers
      if (trimmed.startsWith("###")) {
        parsedElements.push(
          <h4 key={index} className="text-sm font-semibold text-white mt-4 mb-2">{trimmed.substring(3).trim()}</h4>
        );
        return;
      }
      if (trimmed.startsWith("##")) {
        parsedElements.push(
          <h3 key={index} className="text-base font-semibold text-purple-400 mt-5 mb-2">{trimmed.substring(2).trim()}</h3>
        );
        return;
      }

      // Bullet points
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        parsedElements.push(
          <li key={index} className="list-disc ml-5 text-xs text-neutral-300 font-light my-1 leading-relaxed">
            {trimmed.substring(1).trim()}
          </li>
        );
        return;
      }

      // Plain paragraphs
      if (trimmed.length > 0) {
        parsedElements.push(
          <p key={index} className="text-xs text-neutral-300 leading-relaxed font-light my-2">
            {trimmed}
          </p>
        );
      }
    });

    // Remainder Table fallback
    if (inTable && currentTableRows.length > 0) {
      const headers = currentTableRows[0];
      const rows = currentTableRows.slice(1);
      parsedElements.push(
        <div key="table-end" className="my-4 overflow-x-auto rounded-[14px] border border-white/5 bg-black/30">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="py-2.5 px-4 font-medium text-white">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02] text-neutral-300">
              {rows.map((r, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.01]">
                  {r.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-4 font-mono">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return parsedElements;
  };

  return (
    <div className="flex h-[82vh] rounded-[24px] border border-white/5 bg-white/[0.01] overflow-hidden">
      {/* 1. Left Chat History sidebar */}
      <div className="w-64 border-r border-white/[0.04] bg-[#020203]/25 flex flex-col flex-shrink-0 hidden md:flex">
        <div className="p-4 border-b border-white/[0.04]">
          <button
            onClick={handleCreateNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-[12px] bg-white text-black font-medium hover:bg-neutral-200 active:scale-95 transition text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Analysis
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => setActiveConvoId(convo.id)}
              className={`w-full text-left px-3 py-2.5 rounded-[12px] text-xs transition duration-150 flex items-center gap-2 truncate cursor-pointer outline-none ${
                activeConvoId === convo.id
                  ? "bg-white/[0.04] text-white font-medium"
                  : "text-neutral-400 hover:bg-white/[0.01] hover:text-neutral-200"
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0 text-neutral-500" />
              <span className="truncate">{convo.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Chat panel */}
      <div className="flex-1 flex flex-col h-full bg-[#050508]/10 overflow-hidden relative">
        {/* Decorative glows */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-purple-900/5 blur-[80px] pointer-events-none" />

        {/* Chat Header */}
        <div className="h-14 border-b border-white/[0.04] px-6 flex items-center justify-between z-10 bg-[#050508]/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Athena AI Marketing Analyst</h3>
          </div>
          <button 
            onClick={() => activeConvoId && loadMessages(activeConvoId)}
            className="p-1 rounded-[6px] text-neutral-500 hover:text-neutral-300 transition duration-200 cursor-pointer"
            title="Refresh active thread"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Chat message display area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {historyLoading ? (
            <div className="h-full flex items-center justify-center text-neutral-500 text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              Loading conversation logs...
            </div>
          ) : messages.length === 0 ? (
            /* Onboarding / Empty state */
            <div className="h-full flex flex-col justify-center items-center max-w-md mx-auto text-center space-y-6">
              <div className="h-10 w-10 rounded-[12px] bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Ask Athena AI</h4>
                <p className="text-xs text-neutral-400 mt-2 font-light leading-relaxed">
                  Athena AI is connected directly to your campaign datasets. Ask natural language questions about ROAS shifts, budget allocations, or trend predictions.
                </p>
              </div>

              {/* Example Prompts list */}
              <div className="w-full space-y-2">
                {examplePrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleExamplePromptClick(p)}
                    className="w-full text-left px-4 py-2.5 rounded-[12px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 text-neutral-300 hover:text-white transition duration-200 text-xs flex items-center justify-between group cursor-pointer outline-none"
                  >
                    <span>{p}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-purple-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    {/* Role Avatar */}
                    <div className={`h-8 w-8 rounded-full border flex items-center justify-center flex-shrink-0 text-[10px] ${
                      msg.role === "user" 
                        ? "bg-blue-950/30 border-blue-500/25 text-blue-400" 
                        : "bg-purple-950/30 border-purple-500/25 text-purple-400"
                    }`}>
                      {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    </div>

                    {/* Content Box */}
                    <div className={`rounded-[20px] p-4 text-xs font-light leading-relaxed border ${
                      msg.role === "user"
                        ? "bg-white/[0.03] border-white/5 text-white"
                        : "bg-white/[0.01] border-white/[0.02] text-neutral-200"
                    }`}>
                      {msg.role === "user" ? msg.content : renderMarkdown(msg.content)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loader during API response */}
              {loading && (
                <div className="flex gap-3 max-w-[80%] mr-auto items-center text-neutral-500 text-[11px] font-light">
                  <div className="h-8 w-8 rounded-full bg-purple-950/30 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <span>Athena is querying platforms...</span>
                </div>
              )}

              {error && (
                <div className="flex gap-2 p-3 rounded-[12px] bg-red-950/20 border border-red-500/20 text-red-200 text-xs max-w-[80%] mr-auto">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 border-t border-white/[0.04] bg-[#020203]/25 z-10">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Ask Athena about campaign performance, budget scaling candidate..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={loading || !activeConvoId}
              className="flex-1 px-4 py-2.5 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 text-xs text-white placeholder:text-neutral-600 outline-none disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputPrompt.trim() || !activeConvoId}
              className="p-2.5 rounded-[12px] bg-white text-black hover:bg-neutral-200 disabled:opacity-50 transition cursor-pointer outline-none"
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
