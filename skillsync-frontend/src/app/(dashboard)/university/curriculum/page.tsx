"use client";

import { useState, useMemo } from "react";
import {
    Filter, Download, Share2, RotateCcw, Save,
    AlertCircle, ChevronRight, Target, TrendingUp, Zap
} from "lucide-react";
import React from "react";
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, ZAxis
} from "recharts";
import { CurriculumSkillData, GapSeverity } from "@/types/university";
import { useApi } from "@/lib/hooks/useApi";
import {
    getCurriculumOverview, 
    getSkillDetail,
    CurriculumOverviewData 
} from "@/lib/api/university-api";

type SkillData = CurriculumSkillData;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGap(skill: SkillData): number {
    return Math.max(0, skill.marketDemand - skill.studentCompetency);
}

function getSeverity(gap: number): GapSeverity {
    if (gap >= 50) return "critical";
    if (gap >= 30) return "moderate";
    return "good";
}

function renderCell(val: number, severity: GapSeverity, isTarget: boolean = false) {
    if (isTarget) {
        return (
            <div className="flex items-center gap-3">
                <span className="inline-block text-[13px] font-bold px-3 py-1.5 rounded-md bg-blue-600 text-white w-14 text-center shadow-sm">
                    {val}%
                </span>
                <span className="text-xs font-medium text-blue-600 uppercase tracking-widest hidden sm:inline-block">Demand</span>
            </div>
        );
    }

    let bg = "bg-slate-100", text = "text-slate-700", dot = "○";
    if (severity === "critical") {
        bg = "bg-gray-200"; text = "text-gray-900 font-bold"; dot = "●";
    } else if (severity === "moderate") {
        bg = "bg-gray-100"; text = "text-gray-800 font-semibold"; dot = "◐";
    }

    return (
        <div className="flex items-center gap-3">
            <span className={`inline-block text-[13px] px-3 py-1.5 rounded-md w-14 text-center transition-colors ${bg} ${text}`}>
                {val}%
            </span>
            <span className={`text-[12px] hidden sm:inline-block ${severity === "critical" ? "text-gray-500" : "text-gray-400"}`}>{dot} Student Avg</span>
        </div>
    );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function CurriculumGapAnalysisPage() {
    const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
    const [skillsLimit, setSkillsLimit] = useState(7);
    const [viewMode, setViewMode] = useState<"analysis" | "chart">("analysis");
    
    // Filter states
    const [selectedProgramme, setSelectedProgramme] = useState("All Programmes");
    const [selectedSeverity, setSelectedSeverity] = useState("All Severities");
    const [selectedCategory, setSelectedCategory] = useState("All Categories");

    const { data: curriculumData } = useApi<CurriculumOverviewData>(() => getCurriculumOverview());
    const SKILLS_DATA = curriculumData?.skills ?? [];

    // Filtered data
    const filteredSkills = useMemo(() => {
        return SKILLS_DATA.filter(skill => {
            const gap = getGap(skill);
            const severity = getSeverity(gap);
            
            // Category filter
            if (selectedCategory !== "All Categories" && skill.category !== selectedCategory) {
                return false;
            }
            
            // Severity filter
            if (selectedSeverity === "Critical Gaps" && severity !== "critical") return false;
            if (selectedSeverity === "Moderate Gaps" && severity !== "moderate") return false;
            if (selectedSeverity === "On Track" && severity !== "good") return false;
            
            return true;
        });
    }, [SKILLS_DATA, selectedCategory, selectedSeverity]);

    // Summary calculations (based on filtered data)
    const totalAnalyzed = curriculumData?.stats?.totalAnalyzed ?? SKILLS_DATA.length;
    const critical = filteredSkills.filter(s => getSeverity(getGap(s)) === "critical").length;
    const moderate = filteredSkills.filter(s => getSeverity(getGap(s)) === "moderate").length;
    const good = filteredSkills.filter(s => getSeverity(getGap(s)) === "good").length;

    const toggleRow = (id: string) => {
        setExpandedSkillId(prev => prev === id ? null : id);
    };

    const resetFilters = () => {
        setSelectedProgramme("All Programmes");
        setSelectedSeverity("All Severities");
        setSelectedCategory("All Categories");
    };

    return (
        <div className="space-y-6 pb-20">
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Curriculum Gap Analysis</h1>
                    <p className="text-sm text-gray-500 mt-1">Academic Year 2024/25 · Last Updated: 2 hours ago</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                        <Download size={13} className="text-gray-500" /> Export PDF
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                        <Share2 size={13} className="text-gray-500" /> Share
                    </button>
                </div>
            </div>

            {/* ── Summary Stats (Alignment Score First) ─────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* 1. Alignment Score */}
                <div className="bg-blue-600 p-4 rounded-xl border border-blue-500 shadow-sm flex flex-col justify-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                    <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1 relative z-10">Alignment Score</p>
                    <div className="flex items-end gap-2 relative z-10">
                        <p className="text-3xl font-extrabold tracking-tight">{curriculumData?.stats?.alignmentScore ?? 0}</p>
                        <p className="text-sm text-blue-200 font-medium mb-1">/100</p>
                    </div>
                    <p className="text-[10px] text-blue-100 mt-1 relative z-10">Industry avg: 71/100</p>
                </div>

                {/* 2. Total Tracked */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Tracked</p>
                    <p className="text-2xl font-bold text-gray-900">{totalAnalyzed}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Skills analyzed</p>
                </div>

                {/* 3. Critical Gaps */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-600"></span> Critical Gaps
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{critical}</p>
                    <p className="text-[10px] text-gray-400 mt-1">&gt;50% market mismatch</p>
                </div>

                {/* 4. Moderate Gaps */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span> Moderate Gaps
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{moderate}</p>
                    <p className="text-[10px] text-gray-400 mt-1">30–50% mismatch</p>
                </div>

                {/* 5. Well Aligned */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span> Well Aligned
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{good}</p>
                    <p className="text-[10px] text-gray-400 mt-1">&lt;30% mismatch</p>
                </div>
            </div>

            {/* ── Filters ───────────────────────────────────────────────── */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mr-2">
                    <Filter size={16} /> Filters
                </div>

                <select 
                    value={selectedProgramme}
                    onChange={(e) => setSelectedProgramme(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-sm text-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                >
                    <option>All Programmes</option>
                    <option>Computer Science</option>
                    <option>Information Tech</option>
                    <option>Data Science</option>
                </select>

                <select 
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-sm text-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                >
                    <option>All Severities</option>
                    <option>Critical Gaps</option>
                    <option>Moderate Gaps</option>
                    <option>On Track</option>
                </select>

                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-sm text-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                >
                    <option>All Categories</option>
                    <option>Frontend</option>
                    <option>Backend</option>
                    <option>DevOps</option>
                    <option>Cloud</option>
                    <option>Database</option>
                    <option>Architecture</option>
                </select>

                <div className="flex-1" /> {/* Spacer */}

                <button 
                    onClick={resetFilters}
                    className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors px-2"
                >
                    <RotateCcw size={12} /> Reset
                </button>
                <button className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors px-2">
                    <Save size={12} /> Save View
                </button>
            </div>


            {/* ── Heatmap Table / Chart View ────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-stone-50/50">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Student Competency vs Market Demand</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {viewMode === "analysis" ? "Click any row to see detailed breakdown and AI recommendations." : "Interactive scatterplot showing gaps across all skills."}
                        </p>
                    </div>
                    <div className="flex p-1 bg-gray-100 rounded-lg">
                        <button 
                            onClick={() => setViewMode("analysis")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                viewMode === "analysis" 
                                    ? "bg-white text-gray-900 shadow-sm" 
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            Analysis
                        </button>
                        <button 
                            onClick={() => setViewMode("chart")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                viewMode === "chart" 
                                    ? "bg-white text-gray-900 shadow-sm" 
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            Chart
                        </button>
                    </div>
                </div>

                {viewMode === "analysis" ? (
                    <>
                        {/* Analysis Table View */}
                        {filteredSkills.length === 0 ? (
                            <div className="p-20 text-center">
                                <p className="text-sm text-gray-400 italic">No curriculum data available. Ensure students are registered and have assigned skills.</p>
                            </div>
                        ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-white">
                                <th className="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[25%]">Skill Name</th>
                                <th className="py-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]">Category</th>
                                <th className="py-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[25%] border-l border-gray-100">Student Competency</th>
                                <th className="py-4 px-3 text-xs font-semibold text-blue-600 uppercase tracking-wider w-[20%] bg-blue-50/30 border-l border-gray-100">Market Demand</th>
                                <th className="py-4 px-5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider border-l border-gray-100">Gap Size</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSkills.slice(0, skillsLimit).map(skill => {
                                const gap = getGap(skill);
                                const severity = getSeverity(gap);
                                const isExpanded = expandedSkillId === skill.id;

                                return (
                                    <React.Fragment key={skill.id}>
                                        <tr
                                            onClick={() => toggleRow(skill.id)}
                                            className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50/80'}`}
                                        >
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <ChevronRight size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90 text-blue-600' : 'group-hover:text-gray-600'}`} />
                                                    <span className="text-sm font-bold text-gray-900">{skill.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-3">
                                                <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 uppercase tracking-wide">
                                                    {skill.category}
                                                </span>
                                            </td>
                                            <td className="py-4 px-3 border-l border-gray-100">
                                                <div className="flex items-center gap-3 pr-4">
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                        <div className="h-full bg-gray-400 rounded-full" style={{ width: `${skill.studentCompetency}%` }} />
                                                    </div>
                                                    <span className="text-[13px] font-bold text-gray-900 w-8 text-right">{skill.studentCompetency}%</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-3 bg-blue-50/10 border-l border-gray-100">
                                                <div className="flex items-center gap-3 pr-4">
                                                    <div className="flex-1 h-2 bg-blue-100/50 rounded-full overflow-hidden shadow-inner font-bold">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${skill.marketDemand}%` }} />
                                                    </div>
                                                    <span className="text-[13px] font-bold text-blue-700 w-8 text-right">{skill.marketDemand}%</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 text-right border-l border-gray-100">
                                                <span className={`text-[13px] font-black tracking-tight ${severity === 'critical' ? 'text-red-600' : severity === 'moderate' ? 'text-amber-600' : 'text-green-600'}`}>
                                                    {gap}% {severity === 'critical' ? '!!' : ''}
                                                </span>
                                            </td>
                                        </tr>

                                        {/* EXPANDED ROW DETAIL */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={5} className="p-0 border-b border-gray-100">
                                                    <div className="p-0">
                                                        <SkillDetailPanel skill={skill} gap={gap} severity={severity} />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                    
                    {/* Footer Controls */}
                    <div className="px-5 py-4 border-t border-gray-100 bg-stone-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Legend:</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                            <span className="text-[11px] text-gray-600 font-medium">Critical (&gt;50%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                            <span className="text-[11px] text-gray-600 font-medium">Moderate (30-50%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                            <span className="text-[11px] text-gray-600 font-medium">On Track</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {skillsLimit < filteredSkills.length && (
                            <button
                                onClick={() => setSkillsLimit(prev => Math.min(prev + 5, filteredSkills.length))}
                                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
                            >
                                Show more gaps
                            </button>
                        )}
                        <button 
                            onClick={() => setSkillsLimit(filteredSkills.length)}
                            className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                            Load all {filteredSkills.length} skills
                        </button>
                    </div>
                </div>
                    </>
                ) : (
                    <GapAnalysisChart skills={filteredSkills} />
                )}
            </div>

            {/* Meta Footer */}
            <div className="text-center pt-8">
                <p className="text-[11px] text-gray-400">Analysis based on {totalAnalyzed} students | {SKILLS_DATA.length} tracked skills <br className="sm:hidden" /> <span className="hidden sm:inline">|</span> Market data from real job postings in SkillSync network</p>
            </div>
        </div>
    );
}

// ─── Sub-component: Gap Analysis Chart ───────────────────────────────────────

function GapAnalysisChart({ skills }: { skills: SkillData[] }) {
    // Transform skills data for scatter chart
    const chartData = skills.map(skill => ({
        name: skill.name,
        studentCompetency: skill.studentCompetency,
        marketDemand: skill.marketDemand,
        gap: getGap(skill),
        category: skill.category,
    }));

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload?: { name?: string; studentCompetency?: number; marketDemand?: number; gap?: number; category?: string } }[] }) => {
        if (!active || !payload?.length) return null;
        const data = payload[0].payload;
        if (!data) return null;
        const gap = data?.gap || 0;
        const severity = getSeverity(gap);
        
        return (
            <div className="bg-white border-2 border-gray-200 rounded-lg p-3 shadow-xl">
                <p className="text-sm font-bold text-gray-900 mb-1">{data.name}</p>
                <p className="text-xs text-gray-500 mb-2">{data.category}</p>
                <div className="space-y-1">
                    <p className="text-xs text-gray-700">
                        <span className="font-semibold">Student:</span> {data.studentCompetency}%
                    </p>
                    <p className="text-xs text-blue-700">
                        <span className="font-semibold">Market:</span> {data.marketDemand}%
                    </p>
                    <p className={`text-xs font-bold ${
                        severity === 'critical' ? 'text-gray-900' : 
                        severity === 'moderate' ? 'text-gray-700' : 
                        'text-slate-600'
                    }`}>
                        Gap: {gap}%
                    </p>
                </div>
            </div>
        );
    };

    // Color based on gap severity
    const getColor = (skill: typeof chartData[0]) => {
        const severity = getSeverity(skill.gap);
        if (severity === 'critical') return '#6B7280'; // gray-500
        if (severity === 'moderate') return '#9CA3AF'; // gray-400
        return '#CBD5E1'; // slate-300
    };

    return (
        <div className="p-6">
            <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Competency Gap Visualization</h3>
                <p className="text-xs text-gray-500">
                    Each point represents a skill. Distance from diagonal line indicates gap size.
                </p>
            </div>
            
            <ResponsiveContainer width="100%" height={500} minHeight={0} minWidth={0}>
                <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                        type="number" 
                        dataKey="studentCompetency"
                        name="Student Competency"
                        unit="%"
                        domain={[0, 100]}
                        label={{ 
                            value: 'Student Competency (%)', 
                            position: 'insideBottom', 
                            offset: -10,
                            style: { fontSize: 12, fontWeight: 600, fill: '#6B7280' }
                        }}
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                    />
                    <YAxis 
                        type="number" 
                        dataKey="marketDemand"
                        name="Market Demand"
                        unit="%"
                        domain={[0, 100]}
                        label={{ 
                            value: 'Market Demand (%)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { fontSize: 12, fontWeight: 600, fill: '#2563EB' }
                        }}
                        tick={{ fontSize: 11, fill: '#2563EB' }}
                    />
                    <ZAxis range={[100, 400]} />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    
                    {/* Reference line (diagonal) where student = market */}
                    <line 
                        x1="10%" 
                        y1="10%" 
                        x2="90%" 
                        y2="90%" 
                        stroke="#10B981" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        opacity={0.5}
                    />
                    
                    <Scatter name="Skills" data={chartData} fill="#6B7280">
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getColor(entry)} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className="text-xs text-gray-600 font-medium">Critical Gap (&gt;50%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-xs text-gray-600 font-medium">Moderate Gap (30-50%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                    <span className="text-xs text-gray-600 font-medium">Well Aligned</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <div className="w-8 h-0.5 bg-green-500" style={{ borderTop: '2px dashed #10B981' }}></div>
                    <span className="text-xs text-gray-600 font-medium">Perfect Alignment Line</span>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-component: Detailed Skill Panel ─────────────────────────────────────

function SkillDetailPanel({ skill, gap, severity }: { skill: SkillData, gap: number, severity: GapSeverity }) {
    const { data: detail, loading } = useApi<any>(() => getSkillDetail(skill.name));

    return (
        <div className="flex flex-col xl:flex-row shadow-inner bg-white/50 relative">

            {/* Left Side: Data & Context */}
            <div className="xl:w-1/2 p-6 lg:p-8 border-b xl:border-b-0 xl:border-r border-blue-100/50 flex flex-col">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">{skill.name}</h3>
                        <p className="text-sm font-medium text-gray-500">{skill.category} Development</p>
                    </div>
                    {severity === 'critical' && (
                        <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                            <AlertCircle size={16} className="text-gray-600" />
                            <span className="text-sm font-bold text-gray-900">CRITICAL GAP: {gap}% mismatch</span>
                        </div>
                    )}
                </div>

                <div className="space-y-6 mb-10">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                        <TrendingUp size={14} className="text-gray-400" /> Competency vs Market Need
                    </h4>

                    {/* Coverage vs Demand bars */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Average Student Competency</span>
                                <span className="text-xl font-bold text-gray-900">{skill.studentCompetency}%</span>
                            </div>
                            <div className="h-3.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gray-400 rounded-full" style={{ width: `${skill.studentCompetency}%` }} />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Based on student platform assessments and projects</p>
                        </div>
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-end">
                                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Market Demand Baseline</span>
                                <span className="text-xl font-bold text-blue-700">{skill.marketDemand}%</span>
                            </div>
                            <div className="h-3.5 bg-blue-50/50 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${skill.marketDemand}%` }} />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Required in relevant {skill.category} job postings</p>
                        </div>
                    </div>
                </div>

                {/* Job Market Data */}
                <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm mt-auto">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Target size={14} className="text-blue-500" /> Job Market Context
                    </h4>
                    <ul className="space-y-3">
                        <li className="text-sm text-gray-700 flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                            <span>Required in <b>{skill.marketDemand}%</b> of modern {skill.category} role postings</span>
                        </li>
                        <li className="text-sm text-gray-700 flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                            <span>Gap size: <b className={gap > 30 ? "text-red-600" : "text-green-700"}>{gap}%</b> {gap > 30 ? "(Priority Fix)" : "(Stable)"}</span>
                        </li>
                        <li className="text-sm text-gray-700 flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                            <span>Market Trend: <b className="text-blue-700">{skill.trend === 'up' ? "Rising Demand" : "Stable Demand"}</b></span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Right Side: AI Recommendations */}
            <div className="xl:w-1/2 p-6 lg:p-8 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                            <Zap size={20} className="text-white fill-white/20" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-gray-900">AI Curriculum Recommendations</h4>
                            <p className="text-xs text-gray-500 font-medium">Generated based on gap size and peer institution data</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                        Analyzing gaps and generating recommendations...
                    </div>
                ) : (
                    <div className="space-y-4 flex-1">
                        {(detail?.recommendations || []).map((rec: string, i: number) => (
                            <div key={i} className={`bg-white border rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${i === 0 ? "border-2 border-blue-500/20" : "border-gray-200"}`}>
                                {i === 0 && <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-bl-lg shadow-sm">Primary Action</div>}
                                <h5 className="font-bold text-gray-900 text-sm mb-2">Recommendation {i + 1}</h5>
                                <p className="text-[13px] text-gray-700 leading-relaxed">{rec}</p>
                            </div>
                        ))}
                        {(!detail?.recommendations || detail.recommendations.length === 0) && (
                            <div className="text-center py-10">
                                <p className="text-xs text-gray-400 italic">No recommendations available for this skill gap.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
