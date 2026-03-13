import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import { AgentList } from "@/components/agents/agent-list";
import { getApiUrl } from "@/lib/api";

export default async function AgentsPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

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
                headers: {
                    'x-user-id': userId,
                },
                cache: 'no-store', // Always fetch fresh data
            }
        );
        if (response.ok) {
            agents = await response.json();
        }
    } catch (error) {
        console.error("Failed to fetch agents:", error);
    }

    return (
        <DashboardLayout>
            <AgentList initialAgents={agents} userId={userId} />
        </DashboardLayout>
    );
}
