"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { account, ID } from "@/lib/appwrite";
import { Models, OAuthProvider } from "appwrite";

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: (redirectPath?: string) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const userData = await account.get();
            setUser(userData);

            // Sync Google Avatar in background
            syncGoogleAvatar(userData).catch(err => console.debug("Avatar sync skipped:", err));
            // Sync default preferences in background
            syncUserPreferences(userData).catch(err => console.debug("Prefs sync skipped:", err));
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function syncUserPreferences(currentUser: Models.User<Models.Preferences>) {
        try {
            const prefs = currentUser.prefs as any;
            const updates: any = {};

            // Initialize essential keys if they don't exist
            if (prefs.is_influencer_allowed === undefined) {
                updates.is_influencer_allowed = false;
            }
            if (prefs.creditsTotal === undefined) {
                updates.creditsTotal = 1000; // Default starting credits
            }
            if (prefs.creditsUsed === undefined) {
                updates.creditsUsed = 0; // Initialize creditsUsed
            }
            if (prefs.isInfluencer === undefined) {
                updates.isInfluencer = false;
            }
            if (prefs.influencer_discount_rate === undefined) {
                updates.influencer_discount_rate = 10; // Default 10%
            }
            if (prefs.influencer_commission_rate === undefined) {
                updates.influencer_commission_rate = 30; // Default 30%
            }
            if (prefs.isAdmin === undefined) {
                updates.isAdmin = false; // Default non-admin
            }
            if (prefs.processedBroadcasts === undefined) {
                updates.processedBroadcasts = []; // Track which global broadcasts are cloned
            }

            if (Object.keys(updates).length > 0) {
                const updatedPrefs = await account.updatePrefs({
                    ...prefs,
                    ...updates
                });
                setUser({ ...currentUser, prefs: updatedPrefs });
            }
        } catch (e) {
            // Fail silently
        }
    }

    async function syncGoogleAvatar(currentUser: Models.User<Models.Preferences>) {
        try {
            const session = await account.getSession('current');

            if (session.provider === 'google' && session.providerAccessToken) {
                const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${session.providerAccessToken}`);

                if (!response.ok) return;

                const googleUser = await response.json();

                // Update if avatar is missing OR if it has changed
                const currentAvatar = (currentUser.prefs as any)?.avatar;
                if (googleUser.picture && googleUser.picture !== currentAvatar) {
                    const updatedPrefs = await account.updatePrefs({
                        ...currentUser.prefs,
                        avatar: googleUser.picture
                    });
                    setUser({ ...currentUser, prefs: updatedPrefs });
                }
            }
        } catch (e) {
            // Fail silently
        }
    }

    async function login(email: string, password: string) {
        try {
            // Delete any existing session first
            try {
                await account.deleteSession("current");
            } catch (error) {
                // No active session to delete, continue
            }

            await account.createEmailPasswordSession(email, password);
            const userData = await account.get();
            setUser(userData);
        } catch (error: any) {
            throw new Error(error.message || "Failed to login");
        }
    }

    async function signup(email: string, password: string, name: string) {
        try {
            await account.create(ID.unique(), email, password, name);
            await login(email, password);
        } catch (error: any) {
            throw new Error(error.message || "Failed to create account");
        }
    }

    async function logout() {
        try {
            await account.deleteSession("current");
            setUser(null);
        } catch (error: any) {
            throw new Error(error.message || "Failed to logout");
        }
    }

    async function loginWithGoogle(redirectPath?: string) {
        try {
            const finalRedirect = redirectPath
                ? `${window.location.origin}${redirectPath}`
                : `${window.location.origin}/dashboard`;

            await account.createOAuth2Session(
                OAuthProvider.Google,
                finalRedirect,
                `${window.location.origin}/`
            );
        } catch (error: any) {
            console.error("Google login failed:", error);
            throw new Error(error.message || "Failed to initiate Google login");
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, loginWithGoogle, refreshUser: checkUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
