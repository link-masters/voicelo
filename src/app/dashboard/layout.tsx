"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                    <p className="text-muted-foreground font-medium">Loading Studio...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Or a minimal "Redirecting..." UI
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30">
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />

            <Sidebar />

            <div className="lg:pl-64 flex flex-col min-h-screen relative z-10">
                <Header />
                <main className="flex-1 p-6 md:p-8 overflow-hidden h-[calc(100vh-80px)]">
                    {children}
                </main>
            </div>
        </div>
    );
}
