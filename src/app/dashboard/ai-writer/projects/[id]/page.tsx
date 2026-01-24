"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AiWriterTool from "@/components/dashboard/AiWriterTool";
import { databases } from "@/lib/appwrite";
import { useProject } from "@/context/ProjectContext";
import { Loader2 } from "lucide-react";

export default function AiWriterProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const { setProject } = useProject();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const doc = await databases.getDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    'projects',
                    projectId
                );
                setProject(doc as any);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load project", error);
                router.push("/dashboard/ai-writer");
            }
        };

        if (projectId) {
            fetchProject();
        }

        return () => {
            setProject(null); // Cleanup on unmount
        };
    }, [projectId, router, setProject]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center min-h-[500px]">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return <AiWriterTool projectId={projectId} />;
}
