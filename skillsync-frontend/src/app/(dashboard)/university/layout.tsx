import { UniversitySidebar } from "@/components/layout/UniversitySidebar";
import { Search, Bell, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function UniversityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-stone-50 font-sans">

            {/* ── Full-Width Top Header ─────────────────────────────────── */}
            <header className="fixed top-0 left-0 right-0 h-[76px] bg-white border-b border-gray-200 z-50 flex items-center">
                {/* Logo zone — same width as sidebar */}
                <div className="w-[250px] flex-shrink-0 flex items-center px-6 h-full">
                    <Link href="/university/dashboard" className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-700 flex items-center justify-center font-bold text-white text-xs">
                            <GraduationCap size={16} />
                        </div>
                        <div className="leading-tight">
                            <span className="block text-sm font-bold text-gray-900 tracking-tight">SkillSync</span>
                            <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest">University Portal</span>
                        </div>
                    </Link>
                </div>

                {/* Right zone — search + actions */}
                <div className="flex-1 flex items-center justify-end gap-5 px-6">
                    {/* Search */}
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search programmes, skills..."
                            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 w-72 text-gray-900 bg-stone-50"
                        />
                    </div>

                    {/* Notification Bell */}
                    <button className="relative text-gray-500 hover:text-blue-600 transition-colors">
                        <Bell size={19} />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-600 border-2 border-white" />
                    </button>
                </div>
            </header>

            {/* ── Body: Sidebar + Main ──────────────────────────────────── */}
            <div className="flex pt-[76px] min-h-screen">
                {/* Sidebar — starts below header */}
                <UniversitySidebar />

                {/* Main Content */}
                <main className="flex-1 ml-[250px] p-6 md:p-8 min-h-[calc(100vh-76px)]">
                    {children}
                </main>
            </div>
        </div>
    );
}
