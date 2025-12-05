"use client";

import { useState, useCallback, useRef } from "react";
import { createPublicClient, http, isAddress, type Address } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

// Use BuidlGuidl's public RPC
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http("https://mainnet.rpc.buidlguidl.com", {
    timeout: 15000,
    retryCount: 2,
  }),
});

export type ENSResolution = {
  address: Address | null;
  ensName: string | null;
  avatar: string | null;
};

export function useENS() {
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveAddressOrENS = useCallback(
    async (input: string): Promise<ENSResolution | null> => {
      setIsResolving(true);
      setError(null);

      try {
        // Check if input is already an address
        if (isAddress(input)) {
          // Try to get ENS name for this address (optional - don't fail if this doesn't work)
          let ensName: string | null = null;
          let avatar: string | null = null;
          
          try {
            ensName = await publicClient.getEnsName({
              address: input,
            });
            
            if (ensName) {
              try {
                avatar = await publicClient.getEnsAvatar({
                  name: normalize(ensName),
                });
              } catch {
                // Avatar fetch failed, continue without it
              }
            }
          } catch (err) {
            console.warn("[ENS] Reverse lookup failed for address:", input, err);
            // Continue without ENS name - address is still valid
          }

          return {
            address: input,
            ensName,
            avatar,
          };
        }

        // Input looks like an ENS name
        const normalizedName = input.endsWith(".eth") ? input : `${input}.eth`;

        try {
          const address = await publicClient.getEnsAddress({
            name: normalize(normalizedName),
          });

          if (!address) {
            setError("ENS name not found");
            return null;
          }

          let avatar: string | null = null;
          try {
            avatar = await publicClient.getEnsAvatar({
              name: normalize(normalizedName),
            });
          } catch {
            // Avatar fetch failed, continue without it
          }

          return {
            address,
            ensName: normalizedName,
            avatar,
          };
        } catch (err) {
          console.warn("[ENS] Forward lookup failed:", normalizedName, err);
          setError("Could not resolve ENS name");
          return null;
        }
      } catch (err) {
        console.error("[ENS] Resolution error:", err);
        // Handle mobile-specific errors
        const message = err instanceof Error ? err.message : "Resolution failed";
        if (message.includes("Load Failed") || message.includes("Failed to fetch") || message.includes("NetworkError")) {
          setError("Network error. Please check your connection.");
        } else {
          setError(message);
        }
        return null;
      } finally {
        setIsResolving(false);
      }
    },
    []
  );

  return {
    resolveAddressOrENS,
    isResolving,
    error,
    clearError: () => setError(null),
  };
}




