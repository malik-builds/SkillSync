"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";

import {
    LayoutDashboard,
    UserCircle,
    FileText,
    BarChart2,
    Briefcase,
    Send,
    BookOpen,
    MessageSquare,
    Settings,
    LogOut

} from "lucide-react";

interface StudentSidebarProps {
    className?: string;
    disabled?: boolean;
}

const NAV_ITEMS = [
    { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { label: "My Profile", href: "/student/profile", icon: UserCircle },
    { label: "My CV", href: "/student/cv", icon: FileText },
    { label: "Skill Analysis", href: "/student/analysis", icon: BarChart2 },
    { label: "Find Jobs", href: "/student/jobs", icon: Briefcase },
    { label: "Applications", href: "/student/applications", icon: Send },
    { label: "Learning Path", href: "/student/learning-path", icon: BookOpen },
    { label: "Messages", href: "/student/messages", icon: MessageSquare },
    { label: "Settings", href: "/student/settings", icon: Settings },
];

export function StudentSidebar({ className, disabled = false }: StudentSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // Derive initials from user name
    const initials = user?.fullName
        ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'SS';

    return (
        <aside className={cn(
            "w-[280px] h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 -translate-x-full md:translate-x-0",
            disabled && "pointer-events-none opacity-50",
            className
        )}>
            {/* Logo Area */}
            <div className="h-24 flex items-center px-8">
                <Link href="/student/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">
                        SS
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        SkillSync
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-6 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group font-medium",
                                isActive
                                    ? "bg-blue-600 text-white shadow-xl shadow-blue-500/25"
                                    : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            )}
                        >
                            <item.icon size={22} className={cn("transition-colors", isActive ? "text-white" : "text-gray-400 group-hover:text-blue-500")} />
                            <span className="text-[15px]">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-gray-100 space-y-4">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all font-medium"
                >
                    <LogOut size={20} />
                    <span className="text-[15px]">Log Out</span>
                </button>

                {/* Mini User Profile */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.fullName || 'Student'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || 'Student Account'}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
