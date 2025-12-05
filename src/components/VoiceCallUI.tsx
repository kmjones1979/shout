"use client";

import { motion } from "motion/react";
import { type Friend } from "@/hooks/useFriends";
import { type CallState } from "@/hooks/useVoiceCall";

type VoiceCallUIProps = {
  friend: Friend | null;
  callState: CallState;
  isMuted: boolean;
  duration: number;
  formatDuration: (seconds: number) => string;
  onToggleMute: () => void;
  onEndCall: () => void;
};

export function VoiceCallUI({
  friend,
  callState,
  isMuted,
  duration,
  formatDuration,
  onToggleMute,
  onEndCall,
}: VoiceCallUIProps) {
  if (!friend || callState === "idle") return null;

  const getDisplayName = (friend: Friend) => {
    return friend.nickname || friend.ensName || `${friend.address.slice(0, 6)}...${friend.address.slice(-4)}`;
  };

  const getStatusText = () => {
    switch (callState) {
      case "joining":
        return "Connecting...";
      case "connected":
        return formatDuration(duration);
      case "leaving":
        return "Ending call...";
      case "error":
        return "Connection error";
      default:
        return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-zinc-900 to-black flex flex-col items-center justify-center"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-violet-500/20 blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="relative mb-8"
        >
          {friend.avatar ? (
            <img
              src={friend.avatar}
              alt={getDisplayName(friend)}
              className="w-32 h-32 rounded-full object-cover ring-4 ring-violet-500/30"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center ring-4 ring-violet-500/30">
              <span className="text-white font-bold text-5xl">
                {getDisplayName(friend)[0].toUpperCase()}
              </span>
            </div>
          )}

          {/* Audio Indicator */}
          {callState === "connected" && (
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1"
            >
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animation-delay-100" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animation-delay-200" />
            </motion.div>
          )}
        </motion.div>

        {/* Name */}
        <h2 className="text-2xl font-bold text-white mb-2">
          {getDisplayName(friend)}
        </h2>

        {/* Status */}
        <p className="text-zinc-400 text-lg mb-12">{getStatusText()}</p>

        {/* Controls */}
        <div className="flex items-center gap-6">
          {/* Mute Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleMute}
            disabled={callState !== "connected"}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              isMuted
                ? "bg-red-500/20 text-red-400"
                : "bg-zinc-800 text-white hover:bg-zinc-700"
            } disabled:opacity-50`}
          >
            {isMuted ? (
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            ) : (
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </motion.button>

          {/* End Call Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEndCall}
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg shadow-red-500/30"
          >
            <svg
              className="w-8 h-8 rotate-135"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </motion.button>

          {/* Speaker Button (placeholder) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}


