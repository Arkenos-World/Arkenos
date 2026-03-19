import { redirect, notFound } from "next/navigation";
import { CustomAgentEditor } from "@/components/custom-agents/custom-agent-editor";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getApiUrl } from "@/lib/api";
import { getServerAuthHeaders } from "@/lib/server-auth";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CustomAgentCodePage({ params }: PageProps) {
    const { headers: reqHeaders, userId, user } = await getServerAuthHeaders();
    const resolvedParams = await params;

    if (!userId) {
        redirect("/");
    }

    let agent = null;
    try {
        const apiUrl = getApiUrl();
        const response = await fetch(
            `${apiUrl}/agents/${resolvedParams.id}`,
            {
                headers: reqHeaders,
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
                userEmail={user?.email || undefined}
                userName={user?.name || undefined}
                collapsed
            />
            <div className="flex-1 min-w-0">
                <CustomAgentEditor agent={agent} userId={userId} />
            </div>
        </div>
    );
}
