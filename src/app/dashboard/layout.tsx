"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Loader2 } from "lucide-react";
import { ProjectProvider } from "@/context/ProjectContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
    }, [user, loading, router]);

    // Close sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                        <Loader2 className="w-6 h-6 text-primary-foreground animate-spin" />
                    </div>
                    <p className="text-muted-foreground font-medium">Loading Studio...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <ProjectProvider>
            <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">

                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <div className="lg:pl-64 flex flex-col min-h-screen relative z-10">
                    <Header onMenuClick={() => setIsSidebarOpen(true)} />
                    <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-hidden h-auto lg:h-[calc(100vh-80px)]">
                        {children}
                    </main>
                </div>
            </div>
        </ProjectProvider>
    );
}
