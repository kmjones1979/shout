"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAgents, Agent } from "@/hooks/useAgents";
import { CreateAgentModal } from "./CreateAgentModal";
import { AgentChatModal } from "./AgentChatModal";
import { EditAgentModal } from "./EditAgentModal";

interface AgentsSectionProps {
    userAddress: string;
}

export function AgentsSection({ userAddress }: AgentsSectionProps) {
    const { agents, isLoading, error, createAgent, updateAgent, deleteAgent } = useAgents(userAddress);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const handleCreateAgent = async (
        name: string,
        personality: string,
        emoji: string,
        visibility: "private" | "friends" | "public"
    ) => {
        await createAgent(name, personality, emoji, visibility);
    };

    const handleDeleteAgent = async (agent: Agent) => {
        if (confirm(`Delete "${agent.name}"? This cannot be undone.`)) {
            await deleteAgent(agent.id);
        }
    };

    const handleOpenChat = (agent: Agent) => {
        setSelectedAgent(agent);
        setIsChatOpen(true);
    };

    const handleEditAgent = (agent: Agent) => {
        setSelectedAgent(agent);
        setIsEditModalOpen(true);
    };

    const handleSaveAgent = async (agentId: string, updates: {
        name?: string;
        personality?: string;
        avatarEmoji?: string;
        visibility?: "private" | "friends" | "public";
    }) => {
        await updateAgent(agentId, updates);
    };

    return (
        <div>
            {/* Section Header */}
            <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="text-purple-400">✨</span>
                        AI Agents
                        <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                            Beta
                        </span>
                    </h2>
                    <span className="text-xs text-zinc-500">
                        ({agents.length}/5)
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {agents.length < 5 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCreateModalOpen(true);
                            }}
                            className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="Create Agent"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    )}
                    <motion.svg
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        className="w-5 h-5 text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                </div>
            </div>

            {/* Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <svg className="animate-spin w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            </div>
                        ) : error ? (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        ) : agents.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl text-center"
                            >
                                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                    <span className="text-2xl">🤖</span>
                                </div>
                                <h3 className="text-white font-medium mb-1">Create Your First AI Agent</h3>
                                <p className="text-sm text-zinc-400 mb-4">
                                    Build custom AI assistants with unique personalities
                                </p>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-all"
                                >
                                    Create Agent
                                </button>
                            </motion.div>
                        ) : (
                            <div className="space-y-2">
                                {agents.map((agent) => (
                                    <motion.div
                                        key={agent.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-xl transition-all cursor-pointer"
                                        onClick={() => handleOpenChat(agent)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-xl shrink-0">
                                                {agent.avatar_emoji}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-white truncate">{agent.name}</h3>
                                                    {agent.visibility !== "private" && (
                                                        <span className="text-xs px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-400">
                                                            {agent.visibility === "friends" ? "👥" : "🌍"}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-zinc-500 truncate">
                                                    {agent.personality || "AI Assistant"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenChat(agent);
                                                    }}
                                                    className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                                                    title="Chat"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditAgent(agent);
                                                    }}
                                                    className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteAgent(agent);
                                                    }}
                                                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        {/* Stats */}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                                            <span>{agent.message_count} messages</span>
                                            <span>•</span>
                                            <span>Created {new Date(agent.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <CreateAgentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateAgent}
            />
            <AgentChatModal
                isOpen={isChatOpen}
                onClose={() => {
                    setIsChatOpen(false);
                    setSelectedAgent(null);
                }}
                agent={selectedAgent}
                userAddress={userAddress}
            />
            <EditAgentModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedAgent(null);
                }}
                agent={selectedAgent}
                onSave={handleSaveAgent}
            />
        </div>
    );
}

export default AgentsSection;

