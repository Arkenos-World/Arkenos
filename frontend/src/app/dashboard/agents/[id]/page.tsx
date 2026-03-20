import { redirect, notFound } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import { AgentSettings } from "@/components/agents/agent-settings";
import { getApiUrl } from "@/lib/api";
import { getServerAuthHeaders } from "@/lib/server-auth";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AgentDetailPage({ params }: PageProps) {
    const { headers: reqHeaders, userId } = await getServerAuthHeaders();
    const resolvedParams = await params;

    if (!userId) {
        redirect("/");
    }

    // Fetch agent from backend API
    let agent = null;
    try {
        const apiUrl = getApiUrl();
        const response = await fetch(
            `${apiUrl}/agents/${resolvedParams.id}`,
            {
                headers: reqHeaders,
                cache: 'no-store',
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

    if (agent.agent_mode === "CUSTOM") {
        redirect(`/dashboard/agents/${resolvedParams.id}/code`);
    }

    return (
        <DashboardLayout>
            <AgentSettings agent={agent} userId={userId} />
        </DashboardLayout>
    );
}
