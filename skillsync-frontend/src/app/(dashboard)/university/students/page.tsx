"use client";

import { useState } from "react";
import {
    Users, Target, Github, FileText,
    ArrowRight, Info,
    ChevronDown, Download, BookOpen,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from "recharts";
import Link from "next/link";
import { Programme, MissingSkill, ScoreDistributionBin, StudentStats } from "@/types/university";
import { useApi } from "@/lib/hooks/useApi";
import { getProgrammes, getMissingSkills, getScoreDistribution, getStudentStats } from "@/lib/api/university-api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
    if (score >= 75) return "text-gray-900";
    if (score >= 60) return "text-gray-700";
    return "text-gray-500";
}

function severityColor(s: MissingSkill["severity"]) {
    if (s === "critical") return "bg-gray-100 text-gray-700 border-gray-200";
    if (s === "moderate") return "bg-gray-50 text-gray-600 border-gray-200";
    return "bg-stone-50 text-gray-500 border-gray-200";
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = Math.round((value / max) * 100);
    return (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
            />
        </div>
    );
}

// Custom bar chart tooltip
function DistTooltip({ active, payload, label }: { active?: boolean; payload?: { value?: number }[]; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-xs shadow-xl">
            <p className="font-bold mb-0.5">Score {label}</p>
            <p className="text-gray-300">{payload[0].value} students</p>
        </div>
    );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon }: {
    label: string; value: string; sub: string;
    icon: React.ElementType;
}) {
    return (
        <div className="relative rounded-xl border p-5 flex flex-col gap-2.5 overflow-hidden transition-all hover:shadow-md bg-white border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 bg-gray-100">
                    <Icon size={15} className="text-gray-600" />
                </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-gray-900">{value}</p>
            <p className="text-[11px] leading-snug text-gray-500">{sub}</p>
        </div>
    );
}

// ─── Programme Row ─────────────────────────────────────────────────────────────

function ProgrammeRow({ p, total }: { p: Programme; total: number }) {
    return (
        <tr className="border-b border-gray-50 hover:bg-stone-50/50 transition-colors">
            <td className="py-3.5 px-4 whitespace-nowrap">
                <p className="text-[13px] font-semibold text-gray-900">{p.name}</p>
                <p className="text-[11px] text-gray-400">{p.students} students · {p.atRisk} under threshold</p>
            </td>
            <td className="py-3.5 px-3 text-center">
                <span className={`text-sm font-bold ${scoreColor(p.avgScore)}`}>{p.avgScore}</span>
                <span className="text-[10px] text-gray-400">/100</span>
            </td>
            <td className="py-3.5 px-3 w-40">
                <div className="flex items-center gap-2">
                    <ProgressBar value={p.profileCompletion} max={100} color="#6B7280" />
                    <span className="text-[11px] font-semibold text-gray-600 w-8 text-right">{p.profileCompletion}%</span>
                </div>
            </td>
            <td className="py-3.5 px-3 w-40">
                <div className="flex items-center gap-2">
                    <ProgressBar value={p.githubRate} max={100} color="#9CA3AF" />
                    <span className="text-[11px] font-semibold text-gray-600 w-8 text-right">{p.githubRate}%</span>
                </div>
            </td>
            <td className="py-3.5 px-3 w-40">
                <div className="flex items-center gap-2">
                    <ProgressBar value={p.cvRate} max={100} color="#6B7280" />
                    <span className="text-[11px] font-semibold text-gray-600 w-8 text-right">{p.cvRate}%</span>
                </div>
            </td>
            <td className="py-3.5 px-3 text-right">
                {p.atRisk > 35 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        High
                    </span>
                ) : p.atRisk > 20 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        Medium
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                        Low
                    </span>
                )}
            </td>
        </tr>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentAnalyticsPage() {
    const [selectedProgramme, setSelectedProgramme] = useState("All Programmes");
    const [showAllSkills, setShowAllSkills] = useState(false);

    const { data: stats } = useApi<StudentStats>(() => getStudentStats());
    const { data: programmesData } = useApi<Programme[]>(() => getProgrammes());
    const { data: missingSkillsData } = useApi<MissingSkill[]>(() => getMissingSkills());
    const { data: scoreData } = useApi<ScoreDistributionBin[]>(() => getScoreDistribution());

    const PROGRAMMES = programmesData ?? [];
    const MISSING_SKILLS = missingSkillsData ?? [];
    const SCORE_DISTRIBUTION_ALL = scoreData ?? [];

    const TOTAL_STUDENTS = stats?.totalStudents ?? 0;
    const AVG_SCORE = stats?.avgScore ?? 0;
    const AVG_PROFILE = stats?.avgProfile ?? 0;
    const AVG_GITHUB = stats?.avgGithub ?? 0;
    const AVG_CV = stats?.avgCv ?? 0;

    const chartData = selectedProgramme === "All Programmes"
        ? SCORE_DISTRIBUTION_ALL
        : SCORE_DISTRIBUTION_ALL; // TODO: fetch per-programme distribution via getScoreDistribution(programme)

    const totalInChart = chartData.reduce((a, b) => a + b.count, 0) || 1;
    const atRiskPct = Math.round((((chartData[0]?.count ?? 0) + (chartData[1]?.count ?? 0)) / totalInChart) * 100);
    const avgPct = Math.round((((chartData[2]?.count ?? 0) + (chartData[3]?.count ?? 0)) / totalInChart) * 100);
    const highPct = Math.round(((chartData[4]?.count ?? 0) / totalInChart) * 100);

    const visibleSkills = showAllSkills ? MISSING_SKILLS : MISSING_SKILLS.slice(0, 5);

    return (
        <div className="space-y-6 pb-20">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">Aggregate performance metrics across all programmes · Academic Year 2024/25</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 bg-white shadow-sm transition-colors">
                    <Download size={14} /> Export Report
                </button>
            </div>

            {/* ── KPI Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                <KpiCard
                    label="Total Students"
                    value={TOTAL_STUDENTS.toLocaleString()}
                    sub="Enrolled across 5 programmes"
                    icon={Users}
                />
                <KpiCard
                    label="Avg Skill Score"
                    value={`${AVG_SCORE}/100`}
                    sub="Across all active student profiles"
                    icon={Target}
                />
                <KpiCard
                    label="Profile Completion"
                    value={`${AVG_PROFILE}%`}
                    sub="Students with complete profiles"
                    icon={FileText}
                />
                <KpiCard
                    label="GitHub Connected"
                    value={`${AVG_GITHUB}%`}
                    sub="Verified GitHub accounts linked"
                    icon={Github}
                />
                <KpiCard
                    label="CV Upload Rate"
                    value={`${AVG_CV}%`}
                    sub="AI-analysed CVs submitted"
                    icon={FileText}
                />
            </div>

            {/* ── Skill Score Distribution ──────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 bg-stone-50/50">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Skill Score Distribution</h2>
                        <p className="text-[11px] text-gray-500 mt-0.5">How scores spread across your student cohort</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 font-medium">Programme:</label>
                        <select
                            value={selectedProgramme}
                            onChange={e => setSelectedProgramme(e.target.value)}
                            className="text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        >
                            <option value="All Programmes">All Programmes</option>
                            {PROGRAMMES.map(p => <option key={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="p-5">
                    <ResponsiveContainer width="100%" height={240} minHeight={0} minWidth={0}>
                        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }} barSize={56}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                            <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 500 }} />
                            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                            <Tooltip content={<DistTooltip />} cursor={{ fill: "#F1F5F9" }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Distribution analysis */}
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-stone-50 border border-gray-200">
                            <p className="text-xs font-bold text-gray-800">{atRiskPct}% Needs Support</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Scoring &lt;40 — curriculum support or personal guidance recommended</p>
                        </div>
                        <div className="p-3 rounded-lg bg-stone-50 border border-gray-200">
                            <p className="text-xs font-bold text-gray-800">{avgPct}% Developing</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Scoring 40–80 — average cohort with room for structured improvement</p>
                        </div>
                        <div className="p-3 rounded-lg bg-stone-50 border border-gray-200">
                            <p className="text-xs font-bold text-gray-800">{highPct}% High Performers</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Scoring &gt;80 — placement-ready, strong employer interest expected</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Programme Performance Table ───────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-stone-50/50">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Programme Performance Breakdown</h2>
                        <p className="text-[11px] text-gray-500 mt-0.5">Avg skill score, profile completeness and engagement per programme</p>
                    </div>
                    <Link href="/university/curriculum" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                        Curriculum Gaps <ArrowRight size={11} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 w-56">Programme</th>
                                <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Avg Score</th>
                                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 w-40">
                                    <span className="flex items-center gap-1"><FileText size={9} /> Profile</span>
                                </th>
                                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 w-40">
                                    <span className="flex items-center gap-1"><Github size={9} /> GitHub</span>
                                </th>
                                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 w-40">
                                    <span className="flex items-center gap-1"><FileText size={9} /> CV Upload</span>
                                </th>
                                <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Risk</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PROGRAMMES.map(p => (
                                <ProgrammeRow key={p.name} p={p} total={TOTAL_STUDENTS} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Top Missing Skills ────────────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-stone-50/50">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Top Missing Skills</h2>
                        <p className="text-[11px] text-gray-500 mt-0.5">Most common skill gaps across all students — aggregated from profile assessments</p>
                    </div>
                    <Link href="/university/curriculum" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                        <BookOpen size={11} /> Curriculum Analysis
                    </Link>
                </div>

                <div className="p-5 space-y-4">
                    {visibleSkills.map((sk) => {
                        const pct = TOTAL_STUDENTS > 0 ? Math.round((sk.studentsLacking / TOTAL_STUDENTS) * 100) : 0;
                        return (
                            <div key={sk.skill}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2.5">
                                        <p className="text-[13px] font-semibold text-gray-900">{sk.skill}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor(sk.severity)}`}>
                                            {sk.category}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-right">
                                        <span className="text-[12px] font-bold text-gray-700">{sk.studentsLacking.toLocaleString()} students</span>
                                        <span className="text-[12px] font-extrabold text-gray-700 w-10">{pct}%</span>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gray-400 transition-all duration-700"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={() => setShowAllSkills(v => !v)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            {showAllSkills ? "Show less" : "View All Gaps"}
                            <ChevronDown size={12} className={`transition-transform ${showAllSkills ? "rotate-180" : ""}`} />
                        </button>
                        <span className="text-gray-300">·</span>
                        <Link href="/university/curriculum" className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors">
                            Link to Curriculum Analysis <ArrowRight size={11} />
                        </Link>
                    </div>
                </div>

                {/* Insight banner */}
                <div className="mx-5 mb-5 p-4 bg-stone-50 border border-gray-200 rounded-xl flex gap-3 items-start">
                    <Info size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-gray-800 mb-0.5">Curriculum Intervention Recommended</p>
                        <p className="text-[11px] text-gray-600 leading-relaxed">
                            <b>TypeScript, Docker, and AWS</b> are missing in over 60% of all students — these are the highest-impact curriculum additions.
                            Even a single practical module per skill could significantly close the gap before students enter the job market.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
}
