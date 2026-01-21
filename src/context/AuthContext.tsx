"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { account, ID } from "@/lib/appwrite";
import { Models, OAuthProvider } from "appwrite";
import { ensureWelcomeEmailSent, sendVerificationEmail } from "@/app/actions-emails/emailActions";
import { ensureInitialCreditsAwarded } from "@/app/actions";

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: (redirectPath?: string) => Promise<void>;
    refreshUser: () => Promise<void>;
    resendVerification: (userId: string, email: string, name: string) => Promise<void>;
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

            // Sync Preference and Avatar sequentially to avoid race conditions
            // Each function will return the updated user to pass to the next one
            const updatedUser = await syncUserPreferences(userData);
            await syncGoogleAvatar(updatedUser || userData);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function syncUserPreferences(currentUser: Models.User<Models.Preferences>) {
        try {
            // Re-fetch to get the absolute latest if this is called after some time, 
            // but for initialization we can use currentUser. 
            // To be safe against other background updates (like broadcasts), 
            // we should ideally fetch again if we are about to update.
            const prefs = currentUser.prefs as any;
            const updates: any = {};

            // Initialize essential keys if they don't exist OR are null
            if (prefs.is_influencer_allowed === undefined || prefs.is_influencer_allowed === null) {
                updates.is_influencer_allowed = false;
            }
            if (prefs.creditsTotal === undefined || prefs.creditsTotal === null || prefs.welcomeCreditsAwarded !== true) {
                try {
                    const res = await ensureInitialCreditsAwarded(currentUser.$id);
                    if (res.success) {
                        // Re-fetch the user to get the NEW prefs from the server immediately
                        const latestUser = await account.get();
                        currentUser = latestUser;
                        setUser(latestUser);

                        if ((res as any).awarded) {
                            console.log(`[Auth] 🎁 Welcome credits awarded: ${(res as any).awarded}`);
                        }
                    }
                } catch (e) {
                    console.error("Error awarding initial credits:", e);
                }
            }

            if (prefs.creditsUsed === undefined || prefs.creditsUsed === null) {
                updates.creditsUsed = 0;
            }
            if (prefs.isInfluencer === undefined || prefs.isInfluencer === null) {
                updates.isInfluencer = false;
            }
            if (prefs.influencer_discount_rate === undefined || prefs.influencer_discount_rate === null) {
                updates.influencer_discount_rate = 10;
            }
            if (prefs.influencer_commission_rate === undefined || prefs.influencer_commission_rate === null) {
                updates.influencer_commission_rate = 30;
            }
            if (prefs.isAdmin === undefined || prefs.isAdmin === null) {
                updates.isAdmin = false;
            }
            if (prefs.welcomeEmailSent === undefined || prefs.welcomeEmailSent === null) {
                updates.welcomeEmailSent = false;
            }

            let finalUser = currentUser;

            if (Object.keys(updates).length > 0) {
                // Fetch LATEST just before updating to avoid overwriting other background changes
                const latestUser = await account.get();
                const updatedPrefs = await account.updatePrefs({
                    ...latestUser.prefs,
                    ...updates
                });
                finalUser = { ...latestUser, prefs: updatedPrefs };
                setUser(finalUser);
            }


            // Trigger welcome email if not already sent
            const finalPrefs = finalUser.prefs as any;
            if (finalPrefs.welcomeEmailSent !== true) {
                ensureWelcomeEmailSent(finalUser.$id, finalUser.email, finalUser.name)
                    .then(result => {
                        if (result.success && (result as any).alreadySent !== true) {
                            // Optionally update local state if needed, but the server action 
                            // already updates the DB.
                        }
                    })
                    .catch(err => console.error("Action error triggering welcome email:", err));
            }

            // Trigger verification email if not verified and not already sent
            if (finalUser.emailVerification === false && finalPrefs.verificationEmailSent !== true) {
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://voicelo.app';
                sendVerificationEmail(finalUser.$id, finalUser.email, finalUser.name, baseUrl)
                    .catch((err: any) => console.error("Verification email trigger error:", err));
            }

            return finalUser;
        } catch (e) {
            return currentUser;
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

            if (!userData.emailVerification) {
                // Not verified! Log them out immediately.
                await account.deleteSession("current");
                setUser(null);
                const error = new Error("Your email address is not verified. Please check your inbox.") as any;
                error.type = "email_not_verified";
                error.userId = userData.$id;
                error.userName = userData.name;
                error.email = userData.email;
                throw error;
            }

            setUser(userData);

            // Sync Preference and Avatar sequentially to avoid race conditions
            const updatedUser = await syncUserPreferences(userData);
            await syncGoogleAvatar(updatedUser || userData);
        } catch (error: any) {
            throw new Error(error.message || "Failed to login");
        }
    }

    async function signup(email: string, password: string, name: string) {
        try {
            const newUser = await account.create(ID.unique(), email, password, name);

            // Send verification email immediately using the server action
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://voicelo.app';
            await sendVerificationEmail(newUser.$id, newUser.email, newUser.name, baseUrl);

            // We do NOT call login() here. The user must verify first.
            console.log("Signup success, verification email sent.");
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

    async function resendVerification(userId: string, email: string, name: string) {
        try {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://voicelo.app';
            const result = await sendVerificationEmail(userId, email, name, baseUrl);
            if (!result.success) {
                throw new Error(result.error || "Failed to resend verification");
            }
        } catch (error: any) {
            throw new Error(error.message || "Failed to resend verification");
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            signup,
            logout,
            loginWithGoogle,
            refreshUser: checkUser,
            resendVerification
        }}>
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
