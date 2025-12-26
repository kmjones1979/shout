"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const AGENT_EMOJIS = [
    "🤖", "🧠", "💡", "🎯", "🚀", "⚡", "🔮", "🎨",
    "📚", "💼", "🔬", "🎭", "🌟", "🦾", "🤓", "🧙",
];

const PERSONALITY_SUGGESTIONS = [
    "Friendly and helpful, explains things simply",
    "Professional and concise, focused on efficiency",
    "Creative and imaginative, thinks outside the box",
    "Patient teacher who breaks down complex topics",
    "Energetic motivator who encourages growth",
    "Analytical thinker who provides detailed insights",
];

interface CreateAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, personality: string, emoji: string, visibility: "private" | "friends" | "public") => Promise<void>;
}

export function CreateAgentModal({ isOpen, onClose, onCreate }: CreateAgentModalProps) {
    const [name, setName] = useState("");
    const [personality, setPersonality] = useState("");
    const [emoji, setEmoji] = useState("🤖");
    const [visibility, setVisibility] = useState<"private" | "friends" | "public">("private");
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!name.trim()) {
            setError("Please give your agent a name");
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            await onCreate(name.trim(), personality.trim(), emoji, visibility);
            // Reset form
            setName("");
            setPersonality("");
            setEmoji("🤖");
            setVisibility("private");
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create agent");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-zinc-900 rounded-2xl p-6 max-w-lg w-full border border-zinc-800 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                                {emoji}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Create AI Agent</h2>
                                <p className="text-sm text-zinc-400">Build your custom AI assistant</p>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <div className="space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Agent Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Research Assistant, Code Helper..."
                                    maxLength={50}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                                <p className="text-xs text-zinc-500 mt-1">{name.length}/50 characters</p>
                            </div>

                            {/* Emoji Picker */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Avatar
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {AGENT_EMOJIS.map((e) => (
                                        <button
                                            key={e}
                                            onClick={() => setEmoji(e)}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                                                emoji === e
                                                    ? "bg-purple-500/30 border-2 border-purple-500 scale-110"
                                                    : "bg-zinc-800 border border-zinc-700 hover:border-zinc-600"
                                            }`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Personality */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Personality
                                </label>
                                <textarea
                                    value={personality}
                                    onChange={(e) => setPersonality(e.target.value)}
                                    placeholder="Describe how your agent should behave..."
                                    maxLength={1000}
                                    rows={3}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                />
                                <p className="text-xs text-zinc-500 mt-1">{personality.length}/1000 characters</p>
                                
                                {/* Suggestions */}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {PERSONALITY_SUGGESTIONS.slice(0, 3).map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setPersonality(suggestion)}
                                            className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-300 transition-colors"
                                        >
                                            {suggestion.slice(0, 30)}...
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Visibility */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Visibility
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setVisibility("private")}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                            visibility === "private"
                                                ? "bg-purple-500/20 border-2 border-purple-500 text-purple-400"
                                                : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                        }`}
                                    >
                                        🔒 Private
                                    </button>
                                    <button
                                        onClick={() => setVisibility("friends")}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                            visibility === "friends"
                                                ? "bg-purple-500/20 border-2 border-purple-500 text-purple-400"
                                                : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                        }`}
                                    >
                                        👥 Friends
                                    </button>
                                    <button
                                        onClick={() => setVisibility("public")}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                            visibility === "public"
                                                ? "bg-purple-500/20 border-2 border-purple-500 text-purple-400"
                                                : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                        }`}
                                    >
                                        🌍 Public
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">
                                    {visibility === "private" && "Only you can use this agent"}
                                    {visibility === "friends" && "Your friends can also use this agent"}
                                    {visibility === "public" && "Anyone can discover and use this agent"}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isCreating || !name.trim()}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
                            >
                                {isCreating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Creating...
                                    </span>
                                ) : (
                                    "Create Agent"
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default CreateAgentModal;

