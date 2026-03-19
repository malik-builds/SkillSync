"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { useAuth } from "@/lib/auth/AuthContext";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        // Redirect unauthenticated users to login
        if (!user) {
            router.replace("/login");
            return;
        }
        // Redirect students who haven't completed onboarding
        if (user.role === "student" && !user.onboarding?.completed) {
            router.replace("/onboarding");
        }
    }, [user, isLoading, router]);

    // Show nothing while loading or redirecting
    if (isLoading) return null;
    if (!user) return null;
    if (user.role === "student" && !user.onboarding?.completed) return null;

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-gray-900 selection:bg-blue-500/20">
            <StudentSidebar />
            <main className="md:ml-[280px] pt-14 md:pt-0 min-h-screen relative transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
