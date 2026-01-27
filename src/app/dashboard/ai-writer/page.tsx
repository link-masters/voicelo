"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import AiWriterTool from "@/components/dashboard/AiWriterTool";
import { Loader2 } from "lucide-react";

export default function AiWriterPage() {
    const { project, projects, loadingProjects, refreshProjects, setProject } = useProject();
    const { user } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const fetchAttempted = useRef(false);

    useEffect(() => {
        // If projects are not loaded yet and we have a user, trigger a refresh
        if (user && projects.length === 0 && !loadingProjects && !fetchAttempted.current) {
            refreshProjects(user.$id);
            fetchAttempted.current = true;
        }
    }, [user, projects.length, loadingProjects, refreshProjects]);

    useEffect(() => {
        // Resolve initialization once loading finishes (or if user is not present)
        if (!loadingProjects) {
            setIsChecking(false);
        }
    }, [loadingProjects]);

    useEffect(() => {
        // Redirection logic:
        // 1. If we have an active project, redirect to its specific AI Writer page
        if (!loadingProjects && project) {
            router.replace(`/dashboard/ai-writer/projects/${project.$id}`);
        }
        // 2. If no active project but we have projects available, pick the latest one and redirect
        else if (!loadingProjects && projects.length > 0 && !project) {
            const latestProject = projects[0];
            setProject(latestProject);
            router.replace(`/dashboard/ai-writer/projects/${latestProject.$id}`);
        }
    }, [project, projects, loadingProjects, router, setProject]);

    // Show loading state while determining the target project
    if (loadingProjects || isChecking || (user && projects.length > 0 && !project)) {
        return (
            <div className="w-full h-full flex items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-sm font-medium text-zinc-500 animate-pulse uppercase tracking-widest">
                        Initializing Studio Context...
                    </p>
                </div>
            </div>
        );
    }

    return <AiWriterTool />;
}
