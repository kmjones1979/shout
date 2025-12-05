"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { type Address } from "viem";
import { useFriends, type Friend } from "@/hooks/useFriends";
import { useVoiceCall } from "@/hooks/useVoiceCall";
import { FriendsList } from "./FriendsList";
import { AddFriendModal } from "./AddFriendModal";
import { VoiceCallUI } from "./VoiceCallUI";
import { IncomingCallModal } from "./IncomingCallModal";
import { isAgoraConfigured } from "@/config/agora";

type DashboardProps = {
  userAddress: Address;
  onLogout: () => void;
};

export function Dashboard({ userAddress, onLogout }: DashboardProps) {
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [currentCallFriend, setCurrentCallFriend] = useState<Friend | null>(null);

  const {
    friends,
    isLoading: isFriendsLoading,
    error: friendsError,
    incomingCall,
    addFriend,
    removeFriend,
    initiateCall,
    acceptCall,
    rejectCall,
    clearError: clearFriendsError,
  } = useFriends(userAddress);

  const {
    callState,
    isMuted,
    duration,
    error: callError,
    joinCall,
    leaveCall,
    toggleMute,
    formatDuration,
    isConfigured: isCallConfigured,
  } = useVoiceCall();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleCall = async (friend: Friend) => {
    if (!isCallConfigured) {
      alert("Voice calling not configured. Please set NEXT_PUBLIC_AGORA_APP_ID.");
      return;
    }

    setCurrentCallFriend(friend);
    const channelName = await initiateCall(friend);
    
    if (channelName) {
      await joinCall(channelName);
    }
  };

  const handleEndCall = async () => {
    await leaveCall();
    setCurrentCallFriend(null);
  };

  const handleAcceptIncomingCall = async () => {
    const call = acceptCall();
    if (call) {
      setCurrentCallFriend(call.from);
      await joinCall(call.channelName);
    }
  };

  const handleRejectIncomingCall = () => {
    rejectCall();
  };

  return (
    <>
      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-lg sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-white font-bold">Shout</h1>
                  <p className="text-zinc-500 text-sm">{formatAddress(userAddress)}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Status Banner */}
          {!isAgoraConfigured && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-amber-400 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-amber-200 font-medium">Voice Calling Not Configured</p>
                  <p className="text-amber-200/70 text-sm mt-1">
                    Set <code className="bg-amber-500/20 px-1 rounded">NEXT_PUBLIC_AGORA_APP_ID</code> to enable voice calls.
                    Get a free App ID at{" "}
                    <a
                      href="https://console.agora.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-amber-100"
                    >
                      console.agora.io
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Friends Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Friends</h2>
                  <p className="text-zinc-500 text-sm mt-1">
                    {friends.length} {friends.length === 1 ? "friend" : "friends"}
                  </p>
                </div>
                <button
                  onClick={() => setIsAddFriendOpen(true)}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium transition-all hover:shadow-lg hover:shadow-violet-500/25 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Friend
                </button>
              </div>
            </div>

            <div className="p-6">
              <FriendsList
                friends={friends}
                onCall={handleCall}
                onRemove={removeFriend}
                isCallActive={callState !== "idle"}
              />
            </div>
          </div>

          {/* Call Error */}
          <AnimatePresence>
            {callError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4"
              >
                <p className="text-red-400">{callError}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => {
          setIsAddFriendOpen(false);
          clearFriendsError();
        }}
        onAdd={addFriend}
        isLoading={isFriendsLoading}
        error={friendsError}
      />

      {/* Voice Call UI */}
      <AnimatePresence>
        {callState !== "idle" && (
          <VoiceCallUI
            friend={currentCallFriend}
            callState={callState}
            isMuted={isMuted}
            duration={duration}
            formatDuration={formatDuration}
            onToggleMute={toggleMute}
            onEndCall={handleEndCall}
          />
        )}
      </AnimatePresence>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          caller={incomingCall.from}
          onAccept={handleAcceptIncomingCall}
          onReject={handleRejectIncomingCall}
        />
      )}
    </>
  );
}

