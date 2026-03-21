"use client";

import React from "react";
import {
    Filter, Download, Share2, TrendingUp, Search, Users, Briefcase, ChevronRight, Check
} from "lucide-react";
import { ProgrammeData, CompanyData, RoleData } from "@/types/university";
import { useApi } from "@/lib/hooks/useApi";
import { getPlacementsByRole, getPlacementsByProgramme, getTopCompanies, getPlacementsByDuration } from "@/lib/api/university-api";
import { DurationBreakdown } from "@/types/university";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusLabel(rate: number) {
    if (rate >= 80) return <span className="px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-gray-600 rounded">High</span>;
    if (rate >= 60) return <span className="px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-gray-600 rounded">Medium</span>;
    return <span className="px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-gray-600 rounded">Low</span>;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function PlacementsTrackingPage() {
    const [shared, setShared] = React.useState(false);
    const { data: programmesData } = useApi<ProgrammeData[]>(() => getPlacementsByProgramme());
    const { data: companiesData } = useApi<CompanyData[]>(() => getTopCompanies());
    const { data: rolesData } = useApi<RoleData[]>(() => getPlacementsByRole());
    const { data: durationsData } = useApi<DurationBreakdown[]>(() => getPlacementsByDuration());

    const PROGRAMMES = programmesData ?? [];
    const COMPANIES = companiesData ?? [];
    const ROLES = rolesData ?? [];
    const DURATIONS = durationsData ?? [];

    const handleShare = async () => {
        const shareData = {
            title: "SkillSync - Placement Tracking Report",
            text: "Check out the latest placement analytics for our institution on SkillSync.",
            url: window.location.href,
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setShared(true);
                setTimeout(() => setShared(false), 2000);
            }
        } catch (err) {
            console.error("Share failed:", err);
            // Fallback to clipboard if share was cancelled or failed
            try {
                await navigator.clipboard.writeText(window.location.href);
                setShared(true);
                setTimeout(() => setShared(false), 2000);
            } catch (clipErr) {
                console.error("Clipboard fallback failed:", clipErr);
            }
        }
    };

    const handleExportCsv = () => {
        const rows: any[][] = [];
        
        // --- Section 1: Overall Stats ---
        rows.push(["PLACEMENT TRACKING SUMMARY - " + new Date().toLocaleDateString()]);
        rows.push(["Metric", "Value"]);
        rows.push(["Total Eligible Students", totalEligible]);
        rows.push(["Actively Seeking", totalSeeking]);
        rows.push(["Secured Internships", totalSecured]);
        rows.push(["Success Rate (%)", successRate]);
        rows.push([]); // Spacer

        // --- Section 2: Programme Success ---
        rows.push(["PROGRAMME SUCCESS"]);
        rows.push(["Programme", "Eligible", "Seeking", "Secured", "Success Rate (%)"]);
        PROGRAMMES.forEach(p => {
            rows.push([p.name, p.eligible, p.seeking, p.secured, p.rate]);
        });
        rows.push([]); // Spacer

        // --- Section 3: Top Hiring Companies ---
        rows.push(["TOP HIRING COMPANIES"]);
        rows.push(["Rank", "Company", "Total Interns"]);
        COMPANIES.forEach(c => {
            rows.push([c.rank, c.name, c.interns]);
        });
        rows.push([]); // Spacer

        // --- Section 4: Role Type Distribution ---
        rows.push(["ROLE TYPE DISTRIBUTION"]);
        rows.push(["Role Name", "Students Count", "Percentage of Total (%)"]);
        ROLES.forEach(r => {
            rows.push([r.name, r.students, r.percent]);
        });

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Placement_Tracking_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const safeNum = (val: any) => {
        const num = Number(val);
        return isNaN(num) ? 0 : num;
    };

    const totalEligible = PROGRAMMES.reduce((a, b: any) => a + safeNum(b.eligible), 0);
    const totalSeeking = PROGRAMMES.reduce((a, b: any) => a + safeNum(b.seeking), 0);
    const totalSecured = PROGRAMMES.reduce((a, b: any) => a + safeNum(b.secured), 0);
    const successRate = totalSeeking > 0 ? Math.round((totalSecured / totalSeeking) * 100) : 0;

    return (
        <div className="space-y-6 pb-20">
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Placement Tracking</h1>
                    <p className="text-sm text-gray-500 mt-1">Academic Year 2024/25 · {PROGRAMMES.length} Active Programmes</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleExportCsv}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                    >
                        <Download size={13} className="text-gray-500" /> Export CSV
                    </button>
                    <button 
                        onClick={handleShare}
                        className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs font-semibold shadow-sm transition-all ${
                            shared ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        {shared ? <Check size={13} /> : <Share2 size={13} className="text-gray-500" />}
                        {shared ? "Copied!" : "Share"}
                    </button>
                </div>
            </div>

            {/* ── Filters ───────────────────────────────────────────────── */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mr-2">
                    <Filter size={16} /> Filters & Scope
                </div>

                <select className="bg-gray-50 border border-gray-200 text-sm text-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gray-400 min-w-[140px]">
                    <option>Academic Year: 2024/25</option>
                    <option>Academic Year: 2023/24</option>
                </select>

                <select className="bg-gray-50 border border-gray-200 text-sm text-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gray-400 min-w-[140px]">
                    <option>All Programmes</option>
                    {PROGRAMMES.map(p => <option key={p.name}>{p.name}</option>)}
                </select>

                <select className="bg-gray-50 border border-gray-200 text-sm text-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gray-400 min-w-[140px]">
                    <option>Status: All</option>
                    <option>Secured</option>
                    <option>Seeking</option>
                    <option>Not Seeking</option>
                </select>
            </div>

            {/* ── Summary Stats ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Users size={14} className="text-gray-400" /> Internship Seekers
                        </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{totalEligible.toLocaleString()}</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Search size={14} className="text-gray-400" /> Actively Seeking
                        </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{totalSeeking.toLocaleString()}</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Briefcase size={14} className="text-gray-400" /> Secured Internships
                        </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{totalSecured.toLocaleString()}</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-gray-400" /> Success Rate
                        </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{successRate}%</p>
                </div>
            </div>

            {/* ── Placement Funnel & Programme Success ───────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Visual Funnel */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                        Internship Placement Funnel <span className="text-gray-400 normal-case font-normal">(Current Semester)</span>
                    </h2>

                    <div className="space-y-6 flex-1">
                        {/* Stage 1 */}
                        <div className="relative">
                            <div className="flex justify-between text-sm font-medium mb-1">
                                <span className="text-gray-700 text-base">Total Eligible Students</span>
                                <span className="text-gray-900 font-bold">{totalEligible} (100%)</span>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-md overflow-hidden">
                                <div className="h-full bg-slate-400 rounded-md" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        {/* Stage 2 */}
                        <div className="relative border-l-2 border-dashed border-gray-200 ml-4 pl-4">
                            <div className="flex justify-between text-sm font-medium mb-1 pt-2">
                                <span className="text-gray-700">Actively Seeking Internships</span>
                                <span className="text-gray-900 font-bold">{totalSeeking} ({totalEligible > 0 ? Math.round((totalSeeking / totalEligible) * 100) : 0}%)</span>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-md overflow-hidden">
                                <div className="h-full bg-slate-500 rounded-md" style={{ width: `${totalEligible > 0 ? (totalSeeking / totalEligible) * 100 : 0}%` }}></div>
                            </div>
                        </div>

                        {/* Stage 3 */}
                        <div className="relative border-l-2 border-dashed border-gray-200 ml-8 pl-4">
                            <div className="flex justify-between text-sm font-medium mb-1 pt-2">
                                <span className="text-gray-700">Secured Internship Offers</span>
                                <span className="text-gray-900 font-bold text-lg">{totalSecured} ({totalSeeking > 0 ? Math.round((totalSecured / totalSeeking) * 100) : 0}%)</span>
                            </div>
                            <div className="h-5 bg-gray-100 overflow-hidden rounded-md shadow-inner border border-gray-200">
                                <div className="h-full bg-slate-700" style={{ width: `${totalSeeking > 0 ? (totalSecured / totalSeeking) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Success By Programme */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
                        Internship Success By Programme
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-100">
                                    <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Programme</th>
                                    <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Eligible</th>
                                    <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Seeking</th>
                                    <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Secured</th>
                                    <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Success%</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {PROGRAMMES.map((prog, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="py-4">
                                            <div className="font-bold text-gray-900 text-sm mb-1.5">{prog.name}</div>
                                            <div className="h-2 bg-gray-100 rounded-full w-48 overflow-hidden">
                                                <div className="h-full bg-slate-600" style={{ width: `${prog.rate}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-gray-500 text-right">{prog.eligible}</td>
                                        <td className="py-4 text-sm text-gray-500 text-right">{prog.seeking}</td>
                                        <td className="py-4 text-sm font-bold text-gray-900 text-right">{prog.secured}</td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="font-bold text-gray-900">{prog.rate}%</span>
                                                {getStatusLabel(prog.rate)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Top Companies & Duration ───────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Top Companies */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm lg:col-span-2 flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                            Top Internship Hiring Companies
                        </h2>
                    </div>

                    <div className="flex-1 p-0 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Rank</th>
                                    <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                                    <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Interns</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {COMPANIES.map(company => (
                                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-6 text-sm font-bold text-gray-400">{company.rank}.</td>
                                        <td className="py-3 px-6">
                                            <div className="font-bold text-gray-900 text-sm">{company.name}</div>
                                            {company.roles.length > 0 && (
                                                <div className="text-[11px] text-gray-500 mt-1 flex gap-2">
                                                    <span className="font-semibold text-gray-400">Roles:</span>
                                                    {(company.roles || []).map((r, i) => (
                                                        <span key={`${r.role}-${i}`}>{r.role}({r.count}){i < company.roles.length - 1 ? ', ' : ''}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-6 text-right font-bold text-gray-900">{company.interns}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Total: {COMPANIES.length} companies hiring</span>
                        <button className="text-xs font-semibold text-gray-600 hover:text-gray-800 flex items-center gap-1">
                            View All {COMPANIES.length} Companies <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                {/* Duration & Insights */}
                <div className="flex flex-col gap-6">
                    {/* Duration Info */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
                            Internship By Duration
                        </h2>

                        <div className="space-y-5">
                            {DURATIONS.slice(0, 4).map((duration, index) => (
                                <div key={`${duration.label}-${index}`}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-gray-700">{duration.label}</span>
                                        <span className="font-bold text-gray-900">{duration.count} ({duration.percentage}%)</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-400" style={{ width: `${duration.percentage}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-3 bg-stone-50 border border-gray-200 rounded-lg">
                            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mb-1">
                                Key Insight
                            </h4>
                            <p className="text-[11px] text-gray-600">
                                {DURATIONS.length > 0 ? (
                                    <>{DURATIONS[0].label} is currently the most common time-to-outcome window for internships.</>
                                ) : (
                                    "No duration data available yet."
                                )}
                            </p>
                        </div>
                    </div>

                    {/* General Insight Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm p-5 flex-1 flex flex-col justify-center">
                        <div className="flex items-start gap-3">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 mb-1">Strategic Insight</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {COMPANIES.length > 0 ? (
                                        <>
                                            <b>{COMPANIES.slice(0, 3).map(c => c.name).join(", ")}</b> are your top recruiters.
                                            Strong partnerships here are worth maintaining or expanding for future graduate employment pipelines.
                                        </>
                                    ) : (
                                        "No recruiter data available. Connect with industry partners to see their hiring activity."
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Role Types Table ───────────────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        Internship By Role Type
                    </h2>
                </div>

                <div className="p-6">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[35%]">Role Type</th>
                                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%] text-right">Students</th>
                                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%] text-right">% of Total</th>
                                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[35%] pl-6">Distribution</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {ROLES.map((role, i) => (
                                <tr key={`${role.name}-${i}`} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 font-bold text-gray-900 text-sm">{role.name}</td>
                                    <td className="py-4 font-semibold text-gray-700 text-right">{role.students}</td>
                                    <td className="py-4 text-sm font-bold text-gray-900 text-right">{role.percent}%</td>
                                    <td className="py-4 pl-6">
                                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden w-full max-w-[200px]">
                                            <div className="h-full bg-slate-700" style={{ width: `${role.percent}%` }}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-6 p-4 bg-stone-50 border border-gray-200 rounded-lg flex items-start gap-3">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-1">Curriculum Alignment Insight</h4>
                            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                                {ROLES.length > 0 ? (
                                    <>
                                        <b>{ROLES[0].name}</b> internships are the most common (<b>{ROLES[0].percent}%</b>).
                                        Curriculum should heavily prepare students for these roles to maintain high placement rates.
                                    </>
                                ) : (
                                    "No role participation data available to generate alignment insights."
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
