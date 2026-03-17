"use client";

import { useState } from "react";
import { GapCard } from "./GapCard";
import { JobDrawer } from "./JobDrawer";
import { TrustBadge } from "@/components/student/profile/TrustBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkillGap, JobMatch } from "@/types/analysis";
import { ArrowRight, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
import { useApi } from "@/lib/hooks/useApi";
import { getSkillGaps, getJobMatches, getAnalysisOverview } from "@/lib/api/student-api";

const TABS = ["Overview", "Skill Gaps", "Job Matches", "Recommendations"];

export function AnalysisTabs() {
    const [activeTab, setActiveTab] = useState("Overview");
    const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);

    const { data: gapsData } = useApi<SkillGap[]>(() => getSkillGaps());
    const { data: jobsData } = useApi<JobMatch[]>(() => getJobMatches());
    const { data: overview } = useApi(() => getAnalysisOverview());

    const CRITICAL_GAPS = gapsData ?? [];
    const MATCHED_JOBS = jobsData ?? [];
    const verifiedSkills = (overview as any)?.verifiedSkills ?? [];
    const missingCritical = (overview as any)?.missingCritical ?? [];
    const recommendations = (overview as any)?.recommendations ?? [];

    return (
        <div className="mt-8">
            {/* Tab Nav */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                            : "bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === "Overview" && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <GlassCard className="p-6 bg-white border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-green-500" />
                                Verified Skills ({verifiedSkills.length})
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {verifiedSkills.length > 0 ? verifiedSkills.map((skill: string, i: number) => (
                                    <div key={`vs-${i}`} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-100">
                                        <span className="font-medium text-green-700 text-sm">{skill}</span>
                                        <TrustBadge type="github_verified" className="!text-[10px] !py-0.5" />
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-400 italic">Run analysis with GitHub to verify skills</p>
                                )}
                            </div>
                        </GlassCard>
                        <GlassCard className="p-6 bg-white border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <AlertTriangle size={18} className="text-red-500" />
                                Missing Critical ({missingCritical.length})
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {missingCritical.length > 0 ? missingCritical.map((skill: string, i: number) => (
                                    <div key={`mc-${i}`} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                                        <span className="font-medium text-red-600 text-sm">{skill}</span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-400 italic">No critical gaps detected</p>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                )}

                {activeTab === "Skill Gaps" && (
                    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
                        {CRITICAL_GAPS.length > 0 ? CRITICAL_GAPS.map((gap, i) => (
                            <GapCard key={gap.id || `gap-${i}`} gap={gap} />
                        )) : (
                            <div className="md:col-span-2 text-center py-12 text-gray-400">
                                No skill gaps detected. Run an analysis first!
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "Job Matches" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {MATCHED_JOBS.length > 0 ? MATCHED_JOBS.map((job, i) => (
                            <div key={job.id || `job-${i}`} className="p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-xl">
                                        🏢
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{job.title}</h4>
                                        <p className="text-sm text-gray-500">{job.company} • <span className="text-green-600">{job.suitabilityPercentage || job.matchScore}% Suitability</span></p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedJob(job)}
                                    className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-sm font-medium text-blue-600 transition-colors"
                                >
                                    Quick View
                                </button>
                            </div>
                        )) : (
                            <div className="text-center py-12 text-gray-400">
                                No job matches yet. Make sure jobs have been scraped.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "Recommendations" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {recommendations.length > 0 ? recommendations.map((rec: any, i: number) => (
                            <GlassCard key={`rec-${i}`} className="p-5 bg-white border-gray-200 hover:border-blue-300 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                        <Lightbulb size={20} className="text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 mb-1">{rec.title}</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">{rec.reason}</p>
                                        {rec.priority && (
                                            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${rec.priority === "high"
                                                ? "bg-red-50 text-red-600 border border-red-100"
                                                : "bg-yellow-50 text-yellow-600 border border-yellow-100"
                                                }`}>
                                                {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        )) : (
                            <div className="text-center py-12 text-gray-400">
                                No recommendations yet. Run an analysis to get personalized advice.
                            </div>
                        )}

                        <div className="flex justify-center mt-8">
                            <button
                                onClick={() => window.location.href = '/student/learning-path'}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all transform hover:scale-105 flex items-center gap-2"
                            >
                                View Full Learning Roadmap <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <JobDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
        </div>
    );
}
