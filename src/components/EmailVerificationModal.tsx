"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useEmailVerification } from "@/hooks/useEmailVerification";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    walletAddress: string;
    onVerified?: () => void;
};

export function EmailVerificationModal({ isOpen, onClose, walletAddress, onVerified }: Props) {
    const {
        email,
        isVerified,
        isSending,
        isVerifying,
        error,
        codeSent,
        sendCode,
        verifyCode,
        reset,
    } = useEmailVerification(walletAddress);

    const [emailInput, setEmailInput] = useState("");
    const [codeInput, setCodeInput] = useState("");

    const handleSendCode = async () => {
        const success = await sendCode(emailInput);
        if (success) {
            setCodeInput("");
        }
    };

    const handleVerify = async () => {
        const success = await verifyCode(codeInput);
        if (success) {
            onVerified?.();
        }
    };

    const handleClose = () => {
        reset();
        setEmailInput("");
        setCodeInput("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-zinc-800"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">
                            {isVerified ? "Email Verified" : "Verify Email"}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-zinc-500 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {isVerified ? (
                        // Verified state
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-white font-medium mb-2">Your email is verified!</p>
                            <p className="text-zinc-400 text-sm">{email}</p>
                            <p className="text-emerald-400 text-sm mt-4">+100 points earned!</p>
                        </div>
                    ) : codeSent ? (
                        // Code sent - waiting for verification
                        <div>
                            <p className="text-zinc-400 text-sm mb-4">
                                We sent a verification code to your email. Enter it below:
                            </p>
                            
                            <input
                                type="text"
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="000000"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-center text-2xl font-mono tracking-widest placeholder:text-zinc-600 focus:outline-none focus:border-[#FF5500]/50 mb-4"
                                maxLength={6}
                            />

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleVerify}
                                disabled={isVerifying || codeInput.length !== 6}
                                className="w-full py-3 bg-[#FF5500] hover:bg-[#E04D00] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors mb-3"
                            >
                                {isVerifying ? "Verifying..." : "Verify Code"}
                            </button>

                            <button
                                onClick={() => { reset(); setCodeInput(""); }}
                                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors"
                            >
                                Try Different Email
                            </button>
                        </div>
                    ) : (
                        // Initial state - enter email
                        <div>
                            <p className="text-zinc-400 text-sm mb-4">
                                Add your email to earn <span className="text-[#FF5500] font-medium">100 points</span> and receive important notifications.
                            </p>

                            <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF5500]/50 mb-4"
                            />

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleSendCode}
                                disabled={isSending || !emailInput.includes("@")}
                                className="w-full py-3 bg-[#FF5500] hover:bg-[#E04D00] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                            >
                                {isSending ? "Sending..." : "Send Verification Code"}
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

