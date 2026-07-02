import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GoogleAdsMcpState {
  mcpUrl: string;
  customerId: string;
  connected: boolean;
  availableCustomers: { id: string; name: string }[];
  setMcpUrl: (url: string) => void;
  setCustomerId: (id: string) => void;
  setConnected: (v: boolean) => void;
  setAvailableCustomers: (c: { id: string; name: string }[]) => void;
  disconnect: () => void;
}

export const useGoogleAdsMcp = create<GoogleAdsMcpState>()(
  persist(
    (set) => ({
      mcpUrl: "",
      customerId: "",
      connected: false,
      availableCustomers: [],
      setMcpUrl: (mcpUrl) => set({ mcpUrl }),
      setCustomerId: (customerId) => set({ customerId }),
      setConnected: (connected) => set({ connected }),
      setAvailableCustomers: (availableCustomers) => set({ availableCustomers }),
      disconnect: () => set({ mcpUrl: "", customerId: "", connected: false, availableCustomers: [] }),
    }),
    { name: "pmos-google-ads-mcp" }
  )
);
