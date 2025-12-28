"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuthImplementation, type UserAuthState } from "@/hooks/useAuth";

// Context for auth state
type AuthContextType = UserAuthState & {
    signIn: () => Promise<boolean>;
    signOut: () => void;
    refresh: () => Promise<void>;
    getAuthHeaders: () => Record<string, string> | null;
    isReady: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const auth = useAuthImplementation();
    
    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
}

