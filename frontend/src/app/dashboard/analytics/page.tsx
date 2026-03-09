import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import AnalyticsClient from "@/components/analytics/analytics-client";

export default async function AnalyticsPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId) redirect("/");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    return (
        <DashboardLayout>
            <AnalyticsClient userId={userId} apiUrl={apiUrl} />
        </DashboardLayout>
    );
}
