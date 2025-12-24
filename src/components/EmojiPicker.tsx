"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

// Categorized emoji data
const EMOJI_CATEGORIES = {
    recent: { icon: "🕐", name: "Recent", emojis: [] as string[] },
    smileys: {
        icon: "😀",
        name: "Smileys",
        emojis: [
            "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂",
            "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛",
            "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
            "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "😌",
            "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🥵",
            "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐",
        ],
    },
    gestures: {
        icon: "👋",
        name: "Gestures",
        emojis: [
            "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
            "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍",
            "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝",
            "🙏", "✍️", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃",
        ],
    },
    hearts: {
        icon: "❤️",
        name: "Hearts",
        emojis: [
            "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
            "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️",
        ],
    },
    animals: {
        icon: "🐶",
        name: "Animals",
        emojis: [
            "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨",
            "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤",
            "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱",
            "🐛", "🦋", "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗",
        ],
    },
    food: {
        icon: "🍕",
        name: "Food",
        emojis: [
            "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈",
            "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦",
            "🌶️", "🫑", "🥒", "🥬", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐",
            "🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🍳", "🧇", "🥞",
        ],
    },
    activities: {
        icon: "⚽",
        name: "Activities",
        emojis: [
            "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱",
            "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳",
            "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷",
            "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤸", "🤺", "⛹️",
        ],
    },
    objects: {
        icon: "💡",
        name: "Objects",
        emojis: [
            "⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️",
            "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️",
            "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭",
            "⏱️", "⏲️", "⏰", "🕰️", "💡", "🔦", "🕯️", "🪔", "💎", "💰",
        ],
    },
    symbols: {
        icon: "💯",
        name: "Symbols",
        emojis: [
            "💯", "🔥", "⭐", "🌟", "✨", "⚡", "💥", "💫", "💦", "💨",
            "🎯", "💢", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤", "✅", "❌",
            "❓", "❗", "‼️", "⁉️", "💲", "♻️", "⚜️", "🔱", "📛", "🔰",
            "⭕", "✔️", "☑️", "✖️", "➕", "➖", "➗", "➰", "➿", "〽️",
        ],
    },
    flags: {
        icon: "🏁",
        name: "Flags",
        emojis: [
            "🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🇺🇸", "🇬🇧",
            "🇨🇦", "🇦🇺", "🇩🇪", "🇫🇷", "🇪🇸", "🇮🇹", "🇯🇵", "🇰🇷", "🇨🇳", "🇮🇳",
            "🇧🇷", "🇲🇽", "🇷🇺", "🇿🇦", "🇳🇬", "🇪🇬", "🇦🇪", "🇸🇬", "🇭🇰", "🇹🇼",
        ],
    },
};

type EmojiPickerProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (emoji: string) => void;
    position?: "top" | "bottom";
};

const RECENT_EMOJIS_KEY = "spritz_recent_emojis";

export function EmojiPicker({
    isOpen,
    onClose,
    onSelect,
    position = "top",
}: EmojiPickerProps) {
    const [activeCategory, setActiveCategory] = useState("smileys");
    const [searchQuery, setSearchQuery] = useState("");
    const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load recent emojis from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
        if (stored) {
            try {
                setRecentEmojis(JSON.parse(stored));
            } catch {
                // Invalid data
            }
        }
    }, []);

    // Handle emoji selection
    const handleSelect = (emoji: string) => {
        // Add to recent
        const newRecent = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(
            0,
            20
        );
        setRecentEmojis(newRecent);
        localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(newRecent));

        onSelect(emoji);
        onClose();
    };

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    // Get emojis to display
    const getEmojis = () => {
        if (searchQuery) {
            // Search across all categories
            const all: string[] = [];
            Object.values(EMOJI_CATEGORIES).forEach((cat) => {
                all.push(...cat.emojis);
            });
            return all; // In a real app, you'd filter by emoji name/keywords
        }

        if (activeCategory === "recent") {
            return recentEmojis;
        }

        return (
            EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]
                ?.emojis || []
        );
    };

    const categories = Object.entries(EMOJI_CATEGORIES).map(([key, value]) => ({
        id: key,
        icon: value.icon,
        name: value.name,
    }));

    // Update recent category with actual recent emojis
    if (recentEmojis.length > 0) {
        EMOJI_CATEGORIES.recent.emojis = recentEmojis;
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={containerRef}
                    initial={{ opacity: 0, scale: 0.95, y: position === "top" ? 10 : -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: position === "top" ? 10 : -10 }}
                    className={`absolute ${
                        position === "top" ? "bottom-full mb-2" : "top-full mt-2"
                    } right-0 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden`}
                >
                    {/* Search */}
                    <div className="p-2 border-b border-zinc-800">
                        <input
                            type="text"
                            placeholder="Search emojis..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50"
                        />
                    </div>

                    {/* Category tabs */}
                    <div className="flex gap-1 p-2 border-b border-zinc-800 overflow-x-auto">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setActiveCategory(cat.id);
                                    setSearchQuery("");
                                }}
                                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors ${
                                    activeCategory === cat.id
                                        ? "bg-[#FF5500]/20 text-[#FF5500]"
                                        : "hover:bg-zinc-800 text-zinc-400"
                                }`}
                                title={cat.name}
                            >
                                {cat.icon}
                            </button>
                        ))}
                    </div>

                    {/* Emoji grid */}
                    <div className="h-64 overflow-y-auto p-2">
                        <div className="grid grid-cols-8 gap-1">
                            {getEmojis().map((emoji, idx) => (
                                <button
                                    key={`${emoji}-${idx}`}
                                    onClick={() => handleSelect(emoji)}
                                    className="w-8 h-8 flex items-center justify-center text-xl hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>

                        {getEmojis().length === 0 && (
                            <div className="text-center text-zinc-500 py-8">
                                {activeCategory === "recent"
                                    ? "No recent emojis yet"
                                    : "No emojis found"}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Quick reaction picker (for message reactions)
type QuickReactionPickerProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (emoji: string) => void;
    emojis?: string[];
};

export function QuickReactionPicker({
    isOpen,
    onClose,
    onSelect,
    emojis = ["👍", "❤️", "😂", "😮", "😢", "🔥"],
}: QuickReactionPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={containerRef}
                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-full px-2 py-1 shadow-xl flex gap-1 z-50"
                >
                    {emojis.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => {
                                onSelect(emoji);
                                onClose();
                            }}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-zinc-800 rounded-full transition-all hover:scale-125"
                        >
                            {emoji}
                        </button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

