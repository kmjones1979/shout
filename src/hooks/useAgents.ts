"use client";

import { useState, useEffect, useCallback } from "react";

export type Agent = {
    id: string;
    owner_address: string;
    name: string;
    personality: string | null;
    system_instructions: string | null;
    model: string;
    avatar_emoji: string;
    visibility: "private" | "friends" | "public";
    message_count: number;
    created_at: string;
    updated_at: string;
};

export type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
};

export function useAgents(userAddress: string | null) {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user's agents
    const fetchAgents = useCallback(async () => {
        if (!userAddress) {
            setAgents([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/agents?userAddress=${encodeURIComponent(userAddress)}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch agents");
            }

            setAgents(data.agents || []);
        } catch (err) {
            console.error("[useAgents] Error:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch agents");
        } finally {
            setIsLoading(false);
        }
    }, [userAddress]);

    // Create a new agent
    const createAgent = useCallback(async (
        name: string,
        personality?: string,
        avatarEmoji?: string,
        visibility?: "private" | "friends" | "public"
    ): Promise<Agent | null> => {
        if (!userAddress) return null;

        try {
            const res = await fetch("/api/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userAddress,
                    name,
                    personality,
                    avatarEmoji,
                    visibility,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create agent");
            }

            // Refresh agents list
            await fetchAgents();

            return data.agent;
        } catch (err) {
            console.error("[useAgents] Error creating agent:", err);
            throw err;
        }
    }, [userAddress, fetchAgents]);

    // Update an agent
    const updateAgent = useCallback(async (
        agentId: string,
        updates: {
            name?: string;
            personality?: string;
            avatarEmoji?: string;
            visibility?: "private" | "friends" | "public";
        }
    ): Promise<Agent | null> => {
        if (!userAddress) return null;

        try {
            const res = await fetch(`/api/agents/${agentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userAddress,
                    ...updates,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update agent");
            }

            // Refresh agents list
            await fetchAgents();

            return data.agent;
        } catch (err) {
            console.error("[useAgents] Error updating agent:", err);
            throw err;
        }
    }, [userAddress, fetchAgents]);

    // Delete an agent
    const deleteAgent = useCallback(async (agentId: string): Promise<boolean> => {
        if (!userAddress) return false;

        try {
            const res = await fetch(
                `/api/agents/${agentId}?userAddress=${encodeURIComponent(userAddress)}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete agent");
            }

            // Refresh agents list
            await fetchAgents();

            return true;
        } catch (err) {
            console.error("[useAgents] Error deleting agent:", err);
            throw err;
        }
    }, [userAddress, fetchAgents]);

    // Load agents on mount
    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    return {
        agents,
        isLoading,
        error,
        fetchAgents,
        createAgent,
        updateAgent,
        deleteAgent,
    };
}

// Separate hook for agent chat
export function useAgentChat(userAddress: string | null, agentId: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch chat history
    const fetchHistory = useCallback(async () => {
        if (!userAddress || !agentId) {
            setMessages([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `/api/agents/${agentId}/chat?userAddress=${encodeURIComponent(userAddress)}`
            );
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch chat history");
            }

            setMessages(data.chats || []);
        } catch (err) {
            console.error("[useAgentChat] Error:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch chat history");
        } finally {
            setIsLoading(false);
        }
    }, [userAddress, agentId]);

    // Send a message
    const sendMessage = useCallback(async (message: string): Promise<string | null> => {
        if (!userAddress || !agentId || !message.trim()) return null;

        setIsSending(true);
        setError(null);

        // Optimistically add user message
        const tempUserMessage: ChatMessage = {
            id: `temp-${Date.now()}`,
            role: "user",
            content: message,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMessage]);

        try {
            const res = await fetch(`/api/agents/${agentId}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userAddress, message }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to send message");
            }

            // Add assistant response
            const assistantMessage: ChatMessage = {
                id: `resp-${Date.now()}`,
                role: "assistant",
                content: data.message,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, assistantMessage]);

            return data.message;
        } catch (err) {
            console.error("[useAgentChat] Error:", err);
            setError(err instanceof Error ? err.message : "Failed to send message");
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
            return null;
        } finally {
            setIsSending(false);
        }
    }, [userAddress, agentId]);

    // Clear chat history
    const clearHistory = useCallback(async (): Promise<boolean> => {
        if (!userAddress || !agentId) return false;

        try {
            const res = await fetch(
                `/api/agents/${agentId}/chat?userAddress=${encodeURIComponent(userAddress)}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to clear history");
            }

            setMessages([]);
            return true;
        } catch (err) {
            console.error("[useAgentChat] Error:", err);
            throw err;
        }
    }, [userAddress, agentId]);

    // Load history when agent changes
    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return {
        messages,
        isLoading,
        isSending,
        error,
        sendMessage,
        clearHistory,
        fetchHistory,
    };
}

export default useAgents;

