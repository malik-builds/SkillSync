"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    BookOpen,
    TrendingUp,
    Users,
    Handshake,
    Settings,
    LogOut,
    GraduationCap,
} from "lucide-react";

interface UniversitySidebarProps {
    className?: string;
}

const NAV_ITEMS = [
    { label: "Dashboard", href: "/university/dashboard", icon: LayoutDashboard },
    { label: "Curriculum Analysis", href: "/university/curriculum", icon: BookOpen },
    { label: "Student Analytics", href: "/university/students", icon: Users },
    { label: "Placements", href: "/university/placements", icon: TrendingUp },
    { label: "Partner Companies", href: "/university/partners", icon: Handshake },
    { label: "Settings", href: "/university/settings", icon: Settings },
];

export function UniversitySidebar({ className }: UniversitySidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

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

            {/* Bottom: Institution Card + Sign Out */}
            <div className="p-4 border-t border-gray-100 space-y-3">
                {/* Institution Card */}
                <div className="flex items-center gap-3 p-3 rounded-md bg-stone-100 border border-gray-100">
                    <div className="w-9 h-9 rounded bg-blue-700 flex items-center justify-center text-white flex-shrink-0">
                        <GraduationCap size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">Dr. Amal Perera</p>
                        <p className="text-[11px] text-gray-500 truncate">University of Colombo</p>
                    </div>
                </div>

                <button
                    onClick={() => router.push("/login")}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
                >
                    <LogOut size={17} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
