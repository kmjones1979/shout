"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAccount } from "wagmi";
import { useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { PasskeyAuth } from "@/components/PasskeyAuth";
import { WalletConnect } from "@/components/WalletConnect";
import { Dashboard } from "@/components/Dashboard";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { Globe } from "@/components/Globe";
import { SpritzLogo } from "@/components/SpritzLogo";
import { usePasskeyContext } from "@/context/PasskeyProvider";
import { useWalletType, type WalletType } from "@/hooks/useWalletType";
import { useAuth } from "@/context/AuthProvider";

export default function Home() {
    // EVM wallet via wagmi
    const { isReconnecting } = useAccount();
    // AppKit disconnect (works for both EVM and Solana)
    const { disconnect: walletDisconnect } = useDisconnect();

    // Multi-chain wallet detection (EVM + Solana)
    const {
        walletType,
        address: walletAddress,
        isConnected: isWalletConnected,
    } = useWalletType();

    // AppKit account for disconnect
    const { isConnected: isAppKitConnected } = useAppKitAccount();

    const {
        isAuthenticated: isPasskeyAuthenticated,
        smartAccountAddress,
        logout: passkeyLogout,
        isLoading: isPasskeyLoading,
    } = usePasskeyContext();

    // SIWE Authentication
    const {
        isAuthenticated: isSiweAuthenticated,
        isLoading: isSiweLoading,
        signIn: siweSignIn,
        signOut: siweSignOut,
        isBetaTester,
        user: siweUser,
        error: siweError,
    } = useAuth();

    const [mounted, setMounted] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [signingIn, setSigningIn] = useState(false);

    // Handle hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    // Give wagmi/appkit time to reconnect from storage
    useEffect(() => {
        if (mounted) {
            // Small delay to let wallets reconnect from localStorage
            const timer = setTimeout(() => {
                setInitializing(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [mounted]);

    // Auto sign-in with SIWE when wallet connects (if not already authenticated)
    useEffect(() => {
        if (
            mounted &&
            !initializing &&
            isWalletConnected &&
            walletAddress &&
            !isSiweAuthenticated &&
            !isSiweLoading &&
            !signingIn &&
            walletType === "evm" // Only auto-sign for EVM wallets
        ) {
            // Small delay to prevent race conditions
            const timer = setTimeout(() => {
                setSigningIn(true);
                siweSignIn().finally(() => setSigningIn(false));
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [mounted, initializing, isWalletConnected, walletAddress, isSiweAuthenticated, isSiweLoading, signingIn, siweSignIn, walletType]);

    // Determine the active user address (supports both EVM and Solana)
    const userAddress: string | null = mounted
        ? smartAccountAddress || walletAddress || null
        : null;

    // Determine wallet type for dashboard
    const activeWalletType: WalletType = isPasskeyAuthenticated
        ? "evm" // Passkey users always use EVM (smart accounts)
        : walletType;

    // For EVM wallets, require SIWE authentication
    // For Solana wallets and passkeys, use existing flow
    const isFullyAuthenticated = mounted && (
        isPasskeyAuthenticated || 
        (isWalletConnected && walletType === "solana") ||
        (isWalletConnected && walletType === "evm" && isSiweAuthenticated)
    );

    // Show loading while checking auth state
    const isCheckingAuth =
        !mounted || initializing || isReconnecting || isPasskeyLoading || (isWalletConnected && walletType === "evm" && isSiweLoading);

    const handleLogout = () => {
        // Sign out SIWE
        siweSignOut();
        // Disconnect wallet if connected (works for both EVM and Solana via AppKit)
        if (isAppKitConnected) {
            walletDisconnect();
        }
        // Logout passkey if authenticated
        if (isPasskeyAuthenticated) {
            passkeyLogout();
        }
    };

    // Show loading splash while checking auth
    if (isCheckingAuth) {
        return (
            <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 animate-pulse">
                        <SpritzLogo size="2xl" className="shadow-lg shadow-[#FF5500]/30" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Spritz
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        {signingIn ? "Signing in..." : "Loading..."}
                    </p>
                </div>
            </main>
        );
    }

    // Show SIWE sign-in prompt for EVM wallet users who haven't signed yet
    if (isWalletConnected && walletType === "evm" && !isSiweAuthenticated && !signingIn) {
        return (
            <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <div className="glass-card rounded-3xl p-8 shadow-2xl text-center">
                        <SpritzLogo size="xl" className="mx-auto mb-6 shadow-lg shadow-[#FF5500]/30" />
                        
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Sign In to Spritz
                        </h2>
                        <p className="text-zinc-400 mb-6">
                            Please sign the message in your wallet to verify ownership and continue.
                        </p>

                        {siweError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {siweError}
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setSigningIn(true);
                                siweSignIn().finally(() => setSigningIn(false));
                            }}
                            disabled={signingIn}
                            className="w-full py-3 bg-gradient-to-r from-[#FF5500] to-[#FF7A33] hover:from-[#FF6611] hover:to-[#FF8844] disabled:opacity-50 text-white font-semibold rounded-xl transition-all mb-4"
                        >
                            {signingIn ? "Signing..." : "Sign Message"}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors"
                        >
                            Disconnect Wallet
                        </button>

                        <p className="text-xs text-zinc-500 mt-4">
                            This signature proves you own this wallet. No transaction will be made.
                        </p>
                    </div>
                </motion.div>
            </main>
        );
    }

    // Show dashboard if fully authenticated
    if (isFullyAuthenticated && userAddress) {
        return (
            <>
                <PWAInstallPrompt />
                <Dashboard
                    userAddress={userAddress}
                    onLogout={handleLogout}
                    isPasskeyUser={isPasskeyAuthenticated}
                    walletType={activeWalletType}
                    isBetaTester={isBetaTester}
                    siweUser={siweUser}
                />
            </>
        );
    }

    return (
        <main className="relative min-h-screen gradient-bg overflow-hidden">
            {/* PWA Install Prompt for mobile users */}
            <PWAInstallPrompt />

            {/* Background effects */}
            <div className="absolute inset-0 grid-pattern" />
            <div className="absolute inset-0 noise-overlay" />

            {/* Globe Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.85, scale: 1 }}
                    transition={{ duration: 2, delay: 0.3 }}
                    className="relative"
                >
                    <Globe />
                    {/* Glow effect behind globe */}
                    <div className="absolute inset-0 bg-[#FF5500]/20 rounded-full blur-[80px] -z-10 scale-125" />
                </motion.div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 safe-area-inset">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                delay: 0.2,
                            }}
                        >
                            <SpritzLogo size="xl" className="shadow-lg shadow-[#FF5500]/30" />
                        </motion.div>
                    </div>

                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                    >
                        Spritz
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-zinc-300 text-lg max-w-md mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                    >
                        Voice calls over Ethereum & Solana. Connect your wallet
                        and start talking.
                    </motion.p>
                </motion.div>

                {/* Auth Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-md"
                >
                    <div className="glass-card rounded-3xl p-8 shadow-2xl">
                        {/* Wallet Section */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                                <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">
                                    Connect Wallet
                                </span>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                            </div>

                            <WalletConnect />
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px flex-1 bg-zinc-800" />
                            <span className="text-zinc-600 text-sm">or</span>
                            <div className="h-px flex-1 bg-zinc-800" />
                        </div>

                        {/* Passkey Section */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                                <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">
                                    Passkey Login
                                </span>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                            </div>

                            <PasskeyAuth />
                        </div>
                    </div>

                    {/* Footer text */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-center text-zinc-600 text-sm mt-6"
                    >
                        <a
                            href="https://walletconnect.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FFBBA7] hover:text-[#FFF0E0] transition-colors"
                        >
                            WalletConnect
                        </a>
                    </motion.p>
                </motion.div>
            </div>
        </main>
    );
}
