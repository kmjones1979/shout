"use client";

import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, type State } from "wagmi";
import { mainnet, sepolia, baseSepolia, base } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import { wagmiAdapter, projectId } from "@/config/wagmi";

// Setup queryClient
const queryClient = new QueryClient();

// Set up metadata
const metadata = {
  name: "Shout",
  description: "Passkey & Wallet Authentication",
  url: typeof window !== "undefined" ? window.location.origin : "https://localhost:3000",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// Create the modal - only if we have a projectId
if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [mainnet, sepolia, base, baseSepolia],
    metadata,
    features: {
      analytics: true,
    },
    themeMode: "dark",
    themeVariables: {
      "--w3m-accent": "#8b5cf6",
      "--w3m-border-radius-master": "2px",
    },
  });
}

export function Web3Provider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
