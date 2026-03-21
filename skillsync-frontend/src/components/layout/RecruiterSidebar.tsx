"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import {
    LayoutDashboard,
    Briefcase,
    Search,
    Send,
    MessageSquare,
    BarChart2,
    Building2,
    Settings,
    LogOut,
} from "lucide-react";

import { useAuth } from "@/lib/auth/AuthContext";

interface RecruiterSidebarProps {
    className?: string;
}

const NAV_ITEMS = [
    { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
    { label: "My Jobs", href: "/recruiter/jobs", icon: Briefcase },
    { label: "Find a Talent", href: "/recruiter/talent", icon: Search },
    { label: "Applications", href: "/recruiter/applications", icon: Send },
    { label: "Analytics", href: "/recruiter/analytics", icon: BarChart2 },
    { label: "Messages", href: "/recruiter/messages", icon: MessageSquare },
    { label: "Company Profile", href: "/recruiter/company", icon: Building2 },
    { label: "Settings", href: "/recruiter/settings", icon: Settings },
];

export function RecruiterSidebar({ className }: RecruiterSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleSignOut = () => {
        logout();
        router.push("/login");
    };

    const displayName = user?.fullName || user?.email || "Recruiter User";
    const subtitle = user ? user.email : "Loading...";
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    return (
        <aside
            className={cn(
                "w-[250px] h-[calc(100vh-76px)] bg-white border-r border-gray-200 flex flex-col fixed left-0 top-[76px] z-40",
                className
            )}
        >
            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-5 px-4 space-y-0.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">
                    Main Menu
                </p>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 group text-sm font-medium",
                                isActive
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-stone-100"
                            )}
                        >
                            <item.icon
                                size={18}
                                className={cn(
                                    "flex-shrink-0 transition-colors",
                                    isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                                )}
                            />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom: Company Card + Sign Out */}
            <div className="p-4 border-t border-gray-100 space-y-3">
                {/* Company Profile Card */}
                <div className="flex items-center gap-3 p-3 rounded-md bg-stone-100 border border-gray-100">
                    <div className="w-9 h-9 rounded bg-blue-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                        <p className="text-[11px] text-gray-500 truncate">{subtitle}</p>
                    </div>
                </div>

                <button
                    onClick={handleSignOut}
                    suppressHydrationWarning
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
                >
                    <LogOut size={17} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
