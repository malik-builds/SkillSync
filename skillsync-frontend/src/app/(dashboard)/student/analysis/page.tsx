"use client";

import { AnalysisHeader } from "@/components/student/analysis/AnalysisHeader";
import { SkillRadar } from "@/components/student/analysis/SkillRadar";
import { AnalysisTabs } from "@/components/student/analysis/AnalysisTabs";
import { useApi } from "@/lib/hooks/useApi";
import { getAnalysisOverview } from "@/lib/api/student-api";

export default function AnalysisPage() {
    const { data, loading, error } = useApi(() => getAnalysisOverview(), []);

    if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading analysis...</div>;
    if (error) return <div className="flex items-center justify-center h-64 text-red-500">Failed to load analysis.</div>;

    const radarData = data?.radarData ?? [];

    return (
        <div className="min-h-screen bg-[#F5F7FA] pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <AnalysisHeader />

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left: Visualization */}
                    <div className="lg:col-span-5 space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">Visual Gap Analysis</h2>
                            <SkillRadar data={radarData} />
                        </div>

                        <div className="p-5 rounded-xl bg-blue-50 border border-blue-100">
                            <h4 className="font-bold text-blue-600 text-sm mb-2 flex items-center gap-2">
                                <span className="text-lg">💡</span> Key Insight
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Your overall market suitability for your target role is <span className="text-blue-700 font-bold text-lg">{data?.score || 0}%</span> based on real-time scraped job requirements.
                                Focus on your <span className="text-gray-900 font-bold">High Priority</span> gaps to secure more interviews.
                            </p>
                        </div>
                    </div>

                    {/* Right: Action & Strategy */}
                    <div className="lg:col-span-7">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">Strategic Action Plan</h2>
                        <AnalysisTabs />
                    </div>
                </div>
            </div>
        </div>
    );
}
