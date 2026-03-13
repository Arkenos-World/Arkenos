import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import CostsClient from "@/components/costs/costs-client";
import { getApiUrl } from "@/lib/api";

export default async function CostsPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId) redirect("/");
    const apiUrl = getApiUrl();
    return (
        <DashboardLayout>
            <CostsClient userId={userId} apiUrl={apiUrl} />
        </DashboardLayout>
    );
}
