import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import { APIKeysClient } from "./client";

export default async function APIKeysPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    return (
        <DashboardLayout>
            <APIKeysClient />
        </DashboardLayout>
    );
}
