import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import { CallLogsClient } from "./client";

export default async function CallLogsPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    if (!userId) {
        redirect("/");
    }

    return (
        <DashboardLayout>
            <CallLogsClient userId={userId} />
        </DashboardLayout>
    );
}
