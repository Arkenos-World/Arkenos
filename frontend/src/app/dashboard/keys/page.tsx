import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import { KeyIcon, PlusIcon, CopyIcon } from "@/components/icons";

// Mock API keys - replace with actual data
const mockKeys = [
    {
        id: "1",
        name: "Production Key",
        prefix: "vox_prod_****",
        created: "Dec 15, 2024",
    },
];

export default async function APIKeysPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">API Keys</h1>
                        <p className="text-muted-foreground">Manage your API keys for programmatic access</p>
                    </div>
                    <Button className="gap-2">
                        <PlusIcon className="h-4 w-4" />
                        Create Key
                    </Button>
                </div>

                {/* Keys List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your API Keys</CardTitle>
                        <CardDescription>
                            Use these keys to authenticate API requests
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {mockKeys.length === 0 ? (
                            <div className="py-8 text-center">
                                <KeyIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">No API keys created yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {mockKeys.map((key) => (
                                    <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                <KeyIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{key.name}</p>
                                                <p className="text-sm text-muted-foreground font-mono">{key.prefix}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-muted-foreground">Created {key.created}</p>
                                            <Button variant="ghost" size="sm">
                                                <CopyIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
