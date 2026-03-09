import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import CostsClient from "@/components/costs/costs-client";

export default async function CostsPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId) redirect("/");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    return (
        <DashboardLayout>
            <CostsClient userId={userId} apiUrl={apiUrl} />
        </DashboardLayout>
    );
}
