import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import { AgentList } from "@/components/agents/agent-list";
import { SWRFallback } from "@/components/swr-fallback";
import { getApiUrl } from "@/lib/api";
import { getServerAuthHeaders } from "@/lib/server-auth";

export default async function AgentsPage() {
    const { headers: reqHeaders, userId } = await getServerAuthHeaders();

    if (!userId) {
        redirect("/");
    }

    // Fetch agents from backend API
    let agents: any[] = [];
    try {
        const apiUrl = getApiUrl();
        const response = await fetch(
            `${apiUrl}/agents/`,
            {
                headers: reqHeaders,
                cache: 'no-store',
            }
        );
        if (response.ok) {
            agents = await response.json();
        }
    } catch (error) {
        console.error("Failed to fetch agents:", error);
    }

    // Provide server-fetched agents as SWR fallback so useAgents() won't re-fetch
    const orgId = reqHeaders["x-org-id"];
    const swrKey = JSON.stringify(["/agents/", orgId]);

    return (
        <DashboardLayout>
            <SWRFallback fallback={{ [swrKey]: agents }}>
                <AgentList initialAgents={agents} userId={userId} />
            </SWRFallback>
        </DashboardLayout>
    );
}
