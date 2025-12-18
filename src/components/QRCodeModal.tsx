"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { type Address } from "viem";

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    address: Address;
    ensName: string | null;
    reachUsername: string | null;
    avatar: string | null;
}

export function QRCodeModal({
    isOpen,
    onClose,
    address,
    ensName,
    reachUsername,
    avatar,
}: QRCodeModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    const displayName =
        reachUsername ||
        ensName ||
        `${address.slice(0, 6)}...${address.slice(-4)}`;

    // The QR code contains the wallet address - simple and reliable
    const qrValue = address;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">
                                My QR Code
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* QR Code */}
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-4 rounded-2xl mb-4">
                                <QRCodeSVG
                                    value={qrValue}
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                />
                            </div>

                            {/* User info */}
                            <div className="flex items-center gap-3 mb-4">
                                {avatar ? (
                                    <img
                                        src={avatar}
                                        alt={displayName}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                                        {displayName.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="text-white font-medium">
                                        {displayName}
                                    </p>
                                    <p className="text-zinc-500 text-xs font-mono">
                                        {address.slice(0, 10)}...
                                        {address.slice(-8)}
                                    </p>
                                </div>
                            </div>

                            <p className="text-zinc-500 text-sm text-center">
                                Have a friend scan this code to add you
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}


