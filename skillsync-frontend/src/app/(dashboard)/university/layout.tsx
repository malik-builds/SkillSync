"use client";

import { useState } from "react";
import { UniversitySidebar } from "@/components/layout/UniversitySidebar";
import { Search, Bell, GraduationCap, X, Info } from "lucide-react";
import Link from "next/link";
import { useApi } from "@/lib/hooks/useApi";
import { getAlerts } from "@/lib/api/university-api";
import { DashboardAlert } from "@/types/university";

export default function UniversityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [showNotifications, setShowNotifications] = useState(false);
    const { data: alerts } = useApi<DashboardAlert[]>(getAlerts);

    const activeAlerts = alerts ?? [];
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
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative text-gray-500 hover:text-blue-600 transition-colors p-1"
                        >
                            <Bell size={19} />
                            {activeAlerts.length > 0 && (
                                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-600 border-2 border-white" />
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-stone-50/50">
                                    <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {activeAlerts.length > 0 ? (
                                        <div className="divide-y divide-gray-50">
                                            {activeAlerts.map((alert) => (
                                                <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                        alert.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                                                        alert.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        <Info size={14} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-900 font-medium leading-relaxed">{alert.message}</p>
                                                        <p className="text-[10px] text-gray-400 mt-1">{new Date(alert.date || Date.now()).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Bell size={20} className="text-gray-300" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">No new notifications</p>
                                            <p className="text-[11px] text-gray-500 mt-1">We&apos;ll notify you when something important happens.</p>
                                        </div>
                                    )}
                                </div>
                                {activeAlerts.length > 0 && (
                                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                                        <button className="text-[11px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider">
                                            Clear all notifications
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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
