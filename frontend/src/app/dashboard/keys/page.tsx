import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import { APIKeysClient } from "./client";

export default async function APIKeysPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    if (!userId) {
        redirect("/");
    }

    return (
        <DashboardLayout>
            <APIKeysClient />
        </DashboardLayout>
    );
}
