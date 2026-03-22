"use client";

import { UniversitySidebar } from "@/components/layout/UniversitySidebar";
import { GraduationCap } from "lucide-react";
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

                <div className="flex-1" />
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
