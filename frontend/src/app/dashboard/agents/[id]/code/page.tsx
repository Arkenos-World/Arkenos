import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { CustomAgentEditor } from "@/components/custom-agents/custom-agent-editor";
import { Sidebar } from "@/components/dashboard/sidebar";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CustomAgentCodePage({ params }: PageProps) {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    const resolvedParams = await params;

    if (!userId) {
        redirect("/");
    }

    let agent = null;
    try {
        const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const response = await fetch(
            `${apiUrl}/agents/${resolvedParams.id}`,
            {
                headers: { "x-user-id": userId },
                cache: "no-store",
            }
        );
        if (response.ok) {
            agent = await response.json();
        } else if (response.status === 404) {
            notFound();
        }
    } catch (error) {
        console.error("Failed to fetch agent:", error);
    }

    if (!agent) {
        notFound();
    }

    // If not a custom agent, redirect to normal settings
    if (agent.agent_mode !== "CUSTOM") {
        redirect(`/dashboard/agents/${resolvedParams.id}`);
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar
                userEmail={session?.user?.email || undefined}
                userName={session?.user?.name || undefined}
                collapsed
            />
            <div className="flex-1 min-w-0">
                <CustomAgentEditor agent={agent} userId={userId} />
            </div>
        </div>
    );
}
