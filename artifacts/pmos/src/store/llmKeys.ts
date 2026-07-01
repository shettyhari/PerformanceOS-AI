import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LLMProvider = "openai" | "anthropic" | "gemini" | "openrouter";

interface LLMKey {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  enabled: boolean;
}

interface LLMKeysState {
  keys: LLMKey[];
  activeProvider: LLMProvider | null;
  setKey: (provider: LLMProvider, apiKey: string, model: string) => void;
  toggleEnabled: (provider: LLMProvider) => void;
  setActive: (provider: LLMProvider | null) => void;
  removeKey: (provider: LLMProvider) => void;
}

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "gpt-4o",
  anthropic: "claude-3-5-sonnet-20241022",
  gemini: "gemini-1.5-pro",
  openrouter: "openai/gpt-4o",
};

export const useLLMKeys = create<LLMKeysState>()(
  persist(
    (set) => ({
      keys: [],
      activeProvider: null,
      setKey: (provider, apiKey, model) =>
        set((s) => {
          const existing = s.keys.find((k) => k.provider === provider);
          if (existing) {
            return { keys: s.keys.map((k) => k.provider === provider ? { ...k, apiKey, model, enabled: true } : k) };
          }
          return { keys: [...s.keys, { provider, apiKey, model, enabled: true }] };
        }),
      toggleEnabled: (provider) =>
        set((s) => ({ keys: s.keys.map((k) => k.provider === provider ? { ...k, enabled: !k.enabled } : k) })),
      setActive: (activeProvider) => set({ activeProvider }),
      removeKey: (provider) =>
        set((s) => ({ keys: s.keys.filter((k) => k.provider !== provider) })),
    }),
    { name: "pmos-llm-keys" }
  )
);
