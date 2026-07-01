import React, { useState } from "react";
import { Bot, Key, Eye, EyeOff, Plus, Trash2, Check, ChevronDown } from "lucide-react";
import { useLLMKeys, LLMProvider } from "@/store/llmKeys";
import { motion, AnimatePresence } from "framer-motion";

const PROVIDERS: { id: LLMProvider; name: string; logo: string; models: string[]; color: string }[] = [
  {
    id: "openai",
    name: "OpenAI",
    logo: "⚡",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    color: "text-emerald-400",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    logo: "◆",
    models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
    color: "text-orange-400",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    logo: "✦",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"],
    color: "text-blue-400",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    logo: "⬡",
    models: ["openai/gpt-4o", "anthropic/claude-3-5-sonnet", "google/gemini-pro-1.5", "meta-llama/llama-3.1-70b-instruct"],
    color: "text-purple-400",
  },
];

function ProviderCard({ provider, onSave }: { provider: typeof PROVIDERS[0]; onSave: (key: string, model: string) => void }) {
  const { keys, removeKey, toggleEnabled, setActive, activeProvider } = useLLMKeys();
  const existing = keys.find((k) => k.provider === provider.id);
  const [editing, setEditing] = useState(!existing);
  const [apiKey, setApiKey] = useState(existing?.apiKey ?? "");
  const [model, setModel] = useState(existing?.model ?? provider.models[0]);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    onSave(apiKey.trim(), model);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 1500);
  };

  const isActive = activeProvider === provider.id;

  return (
    <div className={`rounded-[16px] border p-4 space-y-3 transition ${isActive ? "border-purple-500/30 bg-purple-950/[0.04]" : "border-white/5 bg-white/[0.01]"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`text-base ${provider.color}`}>{provider.logo}</span>
          <div>
            <p className="text-xs font-semibold text-white">{provider.name}</p>
            {existing && <p className="text-[10px] text-neutral-500 font-light">{existing.model}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {existing && (
            <>
              <div className={`h-1.5 w-1.5 rounded-full ${existing.enabled ? "bg-emerald-400" : "bg-neutral-600"}`} />
              <button
                onClick={() => setActive(isActive ? null : provider.id)}
                className={`text-[9px] px-2 py-1 rounded-full border font-semibold transition cursor-pointer ${isActive ? "bg-purple-600/20 border-purple-500/30 text-purple-300" : "border-white/5 text-neutral-500 hover:text-white"}`}
              >
                {isActive ? "Active" : "Set Active"}
              </button>
              <button onClick={() => setEditing((e) => !e)} className="p-1 rounded-[6px] hover:bg-white/[0.06] text-neutral-500 hover:text-white transition cursor-pointer">
                <Key className="w-3 h-3" />
              </button>
              <button onClick={() => removeKey(provider.id)} className="p-1 rounded-[6px] hover:bg-white/[0.06] text-neutral-500 hover:text-red-400 transition cursor-pointer">
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
          {!existing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition cursor-pointer">
              <Plus className="w-3 h-3" /> Connect
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                placeholder={`${provider.name} API key`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 pr-9 rounded-[10px] bg-white/[0.02] border border-white/5 text-xs text-white outline-none placeholder:text-neutral-600 font-mono"
              />
              <button type="button" onClick={() => setShowKey((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer">
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 rounded-[10px] bg-white/[0.02] border border-white/5 text-xs text-neutral-300 outline-none"
            >
              {provider.models.map((m) => <option key={m} value={m} className="bg-neutral-900">{m}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex-1 py-2 rounded-[10px] bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition cursor-pointer flex items-center justify-center gap-1">
                <Check className="w-3 h-3" /> {saved ? "Saved!" : "Save Key"}
              </button>
              {existing && (
                <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-[10px] bg-white/[0.03] border border-white/5 text-xs text-neutral-400 hover:text-white transition cursor-pointer">
                  Cancel
                </button>
              )}
            </div>
            <p className="text-[10px] text-neutral-600 font-light">🔒 Keys are stored locally in your browser only — never sent to our servers.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LLMConnector() {
  const { setKey, activeProvider, keys } = useLLMKeys();

  return (
    <div className="glass-card rounded-[24px] p-6 border border-white/5 bg-white/[0.01] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">AI Model Connections</h3>
        </div>
        {activeProvider && (
          <span className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 px-2 py-1 rounded-full font-medium">
            Active: {PROVIDERS.find((p) => p.id === activeProvider)?.name}
          </span>
        )}
      </div>
      <p className="text-[11px] text-neutral-500 font-light">Connect your own LLM API keys to power Athena AI with your preferred model.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PROVIDERS.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onSave={(key, model) => setKey(provider.id, key, model)}
          />
        ))}
      </div>
    </div>
  );
}
