"use client";

import { ApplicationStats } from "@/components/student/applications/ApplicationStats";
import { ApplicationCard } from "@/components/student/applications/ApplicationCard";
import { useState } from "react";
import { useApi } from "@/lib/hooks/useApi";
import { getApplications } from "@/lib/api/student-api";

const TABS = ["All Applications", "Active", "Interview", "Archived"];

export default function ApplicationsPage() {
    const [activeTab, setActiveTab] = useState("All Applications");
    const { data, loading, error } = useApi(() => getApplications(), []);

    const applications = data?.applications ?? [];

    const filteredApps = applications.filter(app => {
        if (activeTab === "All Applications") return true;
        if (activeTab === "Active") return ["Applied", "Screening", "Interview"].includes(app.status);
        if (activeTab === "Interview") return app.status === "Interview";
        if (activeTab === "Archived") return ["Rejected", "Offer"].includes(app.status);
        return true;
    });

    return (
        <div className="min-h-screen pb-20 bg-[#F5F7FA]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
                    <p className="text-gray-500">Track and manage your job applications in one place.</p>
                </div>

                {/* Stats */}
                <ApplicationStats />

                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-gray-200">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === tab ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />
                            )}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-6">
                    {loading && <div className="text-center py-12 text-gray-500">Loading applications...</div>}
                    {error && <div className="text-center py-12 text-red-500">Failed to load applications.</div>}
                    {filteredApps.map(app => (
                        <ApplicationCard key={app.id} app={app} />
                    ))}
                </div>
            </div>
        </div>
    );
}
