"use client";

import {
    Briefcase,
    CheckCircle2,
    Target,
    Trophy,
    AlertCircle,
    Upload,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import Link from "next/link";
import { SkillGrowthChart } from "@/components/student/dashboard/SkillGrowthChart";
import { ProfileCompletenessBanner } from "@/components/student/dashboard/ProfileCompletenessBanner";
import { useAuth } from "@/lib/auth/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import { getStudentDashboard } from "@/lib/api/student-api";


export default function StudentDashboard() {
    const { user } = useAuth();
    const { data: dashboard, loading } = useApi(() => getStudentDashboard(), []);

    const hasCv = !!user?.onboarding?.cvUploaded;

    return (
        <div className="relative min-h-screen text-gray-900 overflow-x-hidden bg-[#F5F7FA]">

            <div className="p-8 max-w-[1600px] mx-auto relative z-10 transition-all duration-700">

                {/* Profile Completeness Banner — only shows when profile is incomplete (self-aware) */}
                <ProfileCompletenessBanner />

                {/* Dashboard Content — always accessible */}
                <div>

                    {/* Header: KPIs */}
                    <header className="mb-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                            <div className="max-w-xl">
                                <h1 className="text-4xl font-extrabold text-[#111827] mb-2 tracking-tight">
                                    {user ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'Dashboard Overview'}
                                </h1>
                                <p className="text-gray-500 font-medium leading-relaxed">Track your growth and job applications.</p>
                            </div>
                            <div className="flex gap-4 shrink-0">
                                <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-sm font-bold text-gray-700">Live Status</span>
                                </div>
                                <GlassButton size="sm" className="bg-white hover:bg-gray-50 text-gray-900 border-none shadow-sm">Export Report</GlassButton>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Skill Score - Highlighted */}
                            <GlassCard className="p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border-none shadow-xl bg-blue-600">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-sm border border-white/20">
                                        <Target size={24} />
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/20 text-white border border-white/20">
                                        +12%
                                    </span>
                                </div>
                                <h3 className="text-4xl font-extrabold text-white mb-1 tracking-tight">{dashboard?.kpis?.matchScore ?? "—"}</h3>
                                <p className="text-sm font-bold text-blue-100">Skill Score</p>
                            </GlassCard>

                            {/* Skill Gaps */}
                            <GlassCard className="p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border-none shadow-sm bg-white">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                                        <AlertCircle size={24} />
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-50 text-red-700">
                                        Critical
                                    </span>
                                </div>
                                <h3 className="text-4xl font-bold text-gray-900 mb-1 tracking-tight">{"—"}</h3>
                                <p className="text-sm font-medium text-gray-500">Skills to Improve</p>
                            </GlassCard>

                            {/* Applications */}
                            <GlassCard className="p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border-none shadow-sm bg-white">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                        <Briefcase size={24} />
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">
                                        Pending
                                    </span>
                                </div>
                                <h3 className="text-4xl font-bold text-gray-900 mb-1 tracking-tight">{dashboard?.kpis?.appliedCount ?? "—"}</h3>
                                <p className="text-sm font-medium text-gray-500">Active Applications</p>
                            </GlassCard>

                            {/* Interviews */}
                            <GlassCard className="p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border-none shadow-sm bg-white">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                                        This Week
                                    </span>
                                </div>
                                <h3 className="text-4xl font-bold text-gray-900 mb-1 tracking-tight">{dashboard?.kpis?.interviewCount ?? "—"}</h3>
                                <p className="text-sm font-medium text-gray-500">Upcoming Interviews</p>
                            </GlassCard>
                        </div>
                    </header>

                    {/* Main Content Grid */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Column 1 & 2: Charts and Activity */}
                        <div className="lg:col-span-2 space-y-8">
                            <GlassCard className="p-8 border-none shadow-sm bg-white">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-bold text-gray-900">Skill Growth Analysis</h3>
                                    <select className="bg-gray-50 border-none rounded-lg text-sm font-medium text-gray-600 outline-none cursor-pointer p-2">
                                        <option>Last 6 Months</option>
                                        <option>Last Year</option>
                                    </select>
                                </div>
                                <div className="w-full bg-white rounded-2xl flex items-center justify-center">
                                    <SkillGrowthChart />
                                </div>
                            </GlassCard>

                            <h3 className="text-xl font-bold text-gray-900 px-1">Recommended Jobs</h3>
                            <div className="space-y-4">
                                {(dashboard?.suggestedJobs ?? []).length > 0 ? (
                                    dashboard!.suggestedJobs.map((job) => (
                                        <GlassCard key={job.id} className="p-6 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-blue-100 bg-white shadow-sm">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
                                                    {job.company?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{job.title}</h4>
                                                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                        <span className="flex items-center gap-1"><Briefcase size={14} />{job.company}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                        <span className="font-medium text-gray-700">{job.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-blue-600">{job.matchScore}% match</span>
                                                <GlassButton size="sm" variant="secondary" className="bg-gray-50 hover:bg-blue-600 hover:text-white group-hover:block transition-all text-gray-600">View</GlassButton>
                                            </div>
                                        </GlassCard>
                                    ))
                                ) : (
                                    <GlassCard className="p-8 text-center bg-white shadow-sm">
                                        <p className="text-gray-500 font-medium">No job recommendations yet. Complete your profile analysis to get matched.</p>
                                    </GlassCard>
                                )}
                            </div>
                        </div>

                        {/* Column 3: Sidebar Widgets */}
                        <div className="space-y-8">
                            {/* Profile Strength - Light Theme Version */}
                            <GlassCard className="p-8 relative overflow-hidden bg-white border border-blue-100 shadow-xl shadow-blue-500/10">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Trophy size={100} className="text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Profile Strength</h3>
                                <div className="text-5xl font-extrabold text-blue-600 mb-4 tracking-tight">Top 5%</div>
                                <p className="text-sm text-gray-500 mb-8 max-w-[80%] font-medium">You rank higher than 95% of candidates with similar experience.</p>
                                <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                                    View Insights
                                </button>
                            </GlassCard>

                            {/* Recent Activity */}
                            <GlassCard className="p-6 border-none shadow-sm bg-white">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                                    <Link href="#" className="text-sm font-bold text-blue-600 hover:underline">View All</Link>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { title: "Application Viewed", time: "2h ago", color: "bg-blue-500" },
                                        { title: "New Skill Badge", time: "5h ago", color: "bg-purple-500" },
                                        { title: "Profile Updated", time: "1d ago", color: "bg-green-500" },
                                        { title: "Interview Scheduled", time: "2d ago", color: "bg-orange-500" },
                                    ].map((activity, i) => (
                                        <div key={i} className="flex gap-4 relative group">
                                            {i !== 3 && <div className="absolute top-8 left-[11px] w-[2px] h-[calc(100%+8px)] bg-gray-100" />}
                                            <div className={`w-[24px] h-[24px] rounded-full ${activity.color} bg-opacity-20 flex items-center justify-center shrink-0 mt-0.5`}>
                                                <div className={`w-2.5 h-2.5 rounded-full ${activity.color}`} />
                                            </div>
                                            <div>
                                                <p className="text-[15px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer">{activity.title}</p>
                                                <p className="text-xs font-medium text-gray-500 mt-0.5">{activity.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
