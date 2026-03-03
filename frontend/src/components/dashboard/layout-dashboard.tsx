import { currentUser } from "@clerk/nextjs/server";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { DocsIcon } from "@/components/icons";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
    const user = await currentUser();

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar
                userEmail={user?.emailAddresses[0]?.emailAddress}
                userName={user?.firstName || undefined}
            />

            <main className="flex-1 min-w-0">
                {/* Top Bar */}
                <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
                    <div className="flex items-center justify-between h-14 px-6">
                        {/* Spacer for mobile hamburger */}
                        <div className="w-10 lg:w-0" />
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" className="gap-2" asChild>
                                <a href="https://arkenos.mintlify.app" target="_blank">
                                    <DocsIcon className="h-4 w-4" />
                                    Docs
                                </a>
                            </Button>
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
