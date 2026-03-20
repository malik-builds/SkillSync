"use client";

import { useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell,
    PieChart, Pie, Sector, FunnelChart, Funnel, LabelList,
} from "recharts";
import {
    Download, TrendingUp, TrendingDown, Users, Clock,
    CheckCircle, Target, Zap, ChevronDown, AlertTriangle, Minus,
} from "lucide-react";
import { DateRange } from "@/types/recruiter";
import { useApi } from "@/lib/hooks/useApi";
import { getRecruiterAnalytics, getAnalyticsTrends, getSourceBreakdown, getSkillDemand, getFunnel, getJobPerformance } from "@/lib/api/recruiter-api";

const SOURCE_COLORS = ["#2563EB", "#4F46E5", "#7C3AED", "#A855F7", "#D1D5DB"];

// ─── Shared tooltip ────────────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey?: string; name?: string; color?: string; fill?: string; value?: number }[]; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900 text-white rounded-lg px-3 py-2.5 shadow-xl text-[11px] min-w-[130px]">
            {label && <p className="font-semibold text-gray-300 mb-1.5">{label}</p>}
            {payload.map((entry) => (
                <div key={entry.dataKey ?? entry.name} className="flex items-center justify-between gap-4 py-0.5">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color ?? entry.fill }} />
                        <span className="text-gray-300 capitalize">{entry.dataKey ?? entry.name}:</span>
                    </span>
                    <span className="font-bold text-white">{entry.value}{entry.dataKey === "match" ? "%" : ""}</span>
                </div>
            ))}
        </div>
    );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function MetricCard({ label, value, delta, deltaLabel, icon: Icon, positive }: {
    label: string; value: string; delta: string; deltaLabel: string;
    icon: React.ElementType; positive: boolean | null;
}) {
    const trendIcon = positive === null ? <Minus size={10} /> : positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />;
    const chipClass = positive === null
        ? "bg-gray-100 text-gray-500"
        : positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600";
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
                <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Icon size={15} />
                </div>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full w-fit ${chipClass}`}>
                {trendIcon} {delta} {deltaLabel}
            </span>
        </div>
    );
}

// ─── Active Donut shape (hover) ────────────────────────────────────────────────

function ActiveShape(props: { cx?: number; cy?: number; innerRadius?: number; outerRadius?: number; startAngle?: number; endAngle?: number; fill?: string; percent?: number; name?: string; value?: number }) {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, percent, name, value } = props;
    return (
        <g>
            <text x={cx} y={(cy || 0) - 10} textAnchor="middle" fill="#111827" className="text-base font-bold" fontSize={20} fontWeight={700}>{value}</text>
            <text x={cx} y={(cy || 0) + 14} textAnchor="middle" fill="#6B7280" fontSize={11}>{name}</text>
            <text x={cx} y={(cy || 0) + 30} textAnchor="middle" fill="#2563EB" fontSize={13} fontWeight={700}>{((percent || 0) * 100).toFixed(0)}%</text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={(outerRadius || 0) + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} innerRadius={(innerRadius || 0) - 4} outerRadius={(innerRadius || 0) - 1} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        </g>
    );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const [range, setRange] = useState<DateRange>("30d");
    const [activeSourceIndex, setActiveSourceIndex] = useState(0);

    const { data: analytics, loading, error, refetch } = useApi(() => getRecruiterAnalytics(range), [range]);
    const { data: trendDataMap } = useApi(() => getAnalyticsTrends(range), [range]);
    const { data: SOURCE_DATA } = useApi(() => getSourceBreakdown(), []);
    const { data: SKILL_DEMAND } = useApi(() => getSkillDemand(), []);
    const { data: FUNNEL_DATA } = useApi(() => getFunnel(), []);
    const { data: JOB_PERFORMANCE } = useApi(() => getJobPerformance(), []);

    const trendData = (trendDataMap as unknown as any[]) ?? [];
    const funnelData = FUNNEL_DATA ?? [];
    const sourceData = SOURCE_DATA ?? [];
    const skillDemand = SKILL_DEMAND ?? [];
    const jobPerformance = JOB_PERFORMANCE ?? [];

    const overallConversion = funnelData.length > 0
        ? ((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(1)
        : "0";

    const handleExport = () => {
        const rows: any[][] = [];
        
        // 1. Overall Stats
        rows.push(["----- OVERALL STATS -----"]);
        rows.push(["Metric", "Value"]);
        if (analytics?.stats) {
            rows.push(["Total Applications", analytics.stats.totalApplications]);
            rows.push(["Avg Match Score", analytics.stats.avgMatchScore + "%"]);
            rows.push(["Avg Time To Hire", analytics.stats.avgTimeToHire + " days"]);
            rows.push(["Interview Rate", analytics.stats.interviewRate + "%"]);
            rows.push(["Offer Accept Rate", analytics.stats.offerAcceptRate + "%"]);
        }
        rows.push([], []);

        // 2. Conversion Funnel
        rows.push(["----- CONVERSION FUNNEL -----"]);
        rows.push(["Stage", "Candidates", "Drop-off %"]);
        funnelData.forEach((d, i) => {
            const drop = i > 0 ? (((funnelData[i - 1].value - d.value) / funnelData[i - 1].value) * 100).toFixed(1) + "%" : "0%";
            rows.push([d.name, d.value, drop]);
        });
        rows.push([], []);

        // 3. Application Trends
        rows.push([`----- APPLICATION TRENDS (${range}) -----`]);
        rows.push(["Period", "Applications", "Interviews", "Offers", "Hired", "Rejected"]);
        trendData.forEach(d => {
            rows.push([d.label, d.apps, d.interviews, d.offers, d.hired, d.rejected]);
        });
        rows.push([], []);

        // 4. Sources
        rows.push(["----- TOP CANDIDATE SOURCES -----"]);
        rows.push(["Source", "Percentage"]);
        sourceData.forEach(d => {
            rows.push([d.name, d.value + "%"]);
        });
        rows.push([], []);

        // 5. Skill Demand
        rows.push(["----- SKILL DEMAND -----"]);
        rows.push(["Skill", "Open Roles"]);
        skillDemand.forEach(d => {
            rows.push([d.skill, d.jobs]);
        });
        rows.push([], []);

        // 6. Job Performance
        rows.push(["----- JOB PERFORMANCE -----"]);
        rows.push(["Job Title", "Applications", "Avg Match %", "Time to Hire (days)", "Status Warning"]);
        if (jobPerformance && jobPerformance.length > 0) {
            jobPerformance.forEach(job => {
                rows.push([
                    `"${job.title.replace(/"/g, '""')}"`,
                    job.apps,
                    job.match,
                    job.days,
                    job.warn ? "Yes" : "No"
                ]);
            });
        }
        
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Recruiter_Analytics_Comprehensive_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
        { value: "7d", label: "Last 7 Days" },
        { value: "30d", label: "Last 30 Days" },
        { value: "90d", label: "Last 90 Days" },
    ];

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
    if (error) return <div className="text-center py-12 text-red-500">Failed to load analytics. <button onClick={refetch} className="underline">Retry</button></div>;

    return (
        <div className="space-y-5">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Analytics & Insights</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Recruiting performance at a glance</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
                        {RANGE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setRange(opt.value)}
                                className={`px-3 py-1.5 text-xs font-semibold transition-colors border-r border-gray-200 last:border-0 ${range === opt.value ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                        <Download size={13} /> Export CSV
                    </button>
                </div>
            </div>

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
                <MetricCard label="Total Applications" value={analytics?.stats?.totalApplications.toString() || "0"} delta="" deltaLabel="" icon={Users} positive={null} />
                <MetricCard label="Avg Match Score" value={(analytics?.stats?.avgMatchScore || 0) + "%"} delta="" deltaLabel="" icon={Target} positive={null} />
                <MetricCard label="Interview Rate" value={(analytics?.stats?.interviewRate || 0) + "%"} delta="" deltaLabel="" icon={CheckCircle} positive={null} />
                <MetricCard label="Offer Accept Rate" value={(analytics?.stats?.offerAcceptRate || 0) + "%"} delta="" deltaLabel="" icon={Zap} positive={null} />
                <MetricCard label="Time to Hire" value={(analytics?.stats?.avgTimeToHire || 0) + "d"} delta="" deltaLabel="" icon={Clock} positive={null} />
            </div>

            {/* ── Application Trends — Line Chart ────────────────────────────────
                WHY LINE: Multi-series time-comparison. Overlapping area fills
                would create visual mud with 3 series. Lines cleanly separate
                each metric while sharing the same time axis.
            ─────────────────────────────────────────────────────────────────── */}
            <Section title="Application Trends">
                <div className="flex items-center gap-5 mb-4">
                    {[
                        { key: "apps", color: "#2563EB", label: "Applications" },
                        { key: "interviews", color: "#7C3AED", label: "Interviews" },
                        { key: "offers", color: "#F59E0B", label: "Offers" },
                        { key: "hired", color: "#16A34A", label: "Hired" },
                        { key: "rejected", color: "#EF4444", label: "Rejected" },
                    ].map((s) => (
                        <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                            <span className="w-3 h-0.5 inline-block rounded" style={{ background: s.color }} />
                            {s.label}
                        </span>
                    ))}
                </div>
                <ResponsiveContainer width="100%" height={220} minHeight={0} minWidth={0}>
                    <LineChart data={trendData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<DarkTooltip />} />
                        <Line type="monotone" dataKey="apps" stroke="#2563EB" strokeWidth={2} dot={{ fill: "#2563EB", r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="interviews" stroke="#7C3AED" strokeWidth={2} dot={{ fill: "#7C3AED", r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="offers" stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B", r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="hired" stroke="#16A34A" strokeWidth={2} dot={{ fill: "#16A34A", r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2} dot={{ fill: "#EF4444", r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </LineChart>
                </ResponsiveContainer>
            </Section>

            {/* ── Sources + Skill Demand ── */}
            <div className="grid lg:grid-cols-2 gap-5">

                {/* ── Sources — Donut Chart ──────────────────────────────────────
                    WHY DONUT: Data represents proportional share of a whole (%).
                    Donut/Pie is the canonical chart for part-to-whole composition.
                    The hollow centre lets us surface the hovered value cleanly.
                ─────────────────────────────────────────────────────────────── */}
                <Section title="Top Candidate Sources">
                    <div className="flex items-center gap-6">
                        <div className="flex-shrink-0">
                            <PieChart width={180} height={180}>
                                <Pie
                                    data={sourceData}
                                    cx={88}
                                    cy={88}
                                    innerRadius={54}
                                    outerRadius={80}
                                    dataKey="value"
                                    // @ts-expect-error recharts v3 supports activeIndex but types lag
                                    activeIndex={activeSourceIndex}
                                    activeShape={ActiveShape}
                                    onMouseEnter={(_, idx) => setActiveSourceIndex(idx)}
                                    strokeWidth={0}
                                >
                                    {sourceData.map((_, i) => (
                                        <Cell key={i} fill={SOURCE_COLORS[i]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </div>
                        <div className="flex-1 space-y-2.5 min-w-0">
                            {sourceData.map((src, i) => (
                                <button
                                    key={src.name}
                                    className="flex items-center gap-2 w-full text-left group"
                                    onMouseEnter={() => setActiveSourceIndex(i)}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: SOURCE_COLORS[i] }} />
                                    <span className={`text-xs flex-1 truncate transition-colors ${activeSourceIndex === i ? "font-bold text-gray-900" : "text-gray-600 group-hover:text-gray-900"}`}>
                                        {src.name}
                                    </span>
                                    <span className="text-xs font-bold text-gray-900 flex-shrink-0">{src.value}%</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* ── Skill Demand — Horizontal Bar Chart ───────────────────────
                    WHY HORIZONTAL BAR: Ranking discrete categories by quantity.
                    Horizontal layout accommodates label length naturally and
                    bar length maps to value intuitively. Best for top-N lists.
                ─────────────────────────────────────────────────────────────── */}
                <Section title="Skill Demand">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Most Required Skills</p>
                    <ResponsiveContainer width="100%" height={160} minHeight={0} minWidth={0}>
                        <BarChart
                            data={skillDemand}
                            layout="vertical"
                            margin={{ top: 0, right: 36, left: 0, bottom: 0 }}
                            barSize={10}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} width={68} />
                            <Tooltip
                                cursor={{ fill: "rgba(99,102,241,0.05)" }}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    return (
                                        <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-[11px] shadow-xl">
                                            <span className="font-bold">{payload[0].value} open roles</span>
                                        </div>
                                    );
                                }}
                            />
                            <Bar dataKey="jobs" radius={[0, 4, 4, 0]}>
                                {skillDemand.map((_, i) => {
                                    const intensity = 1 - i * 0.15;
                                    return <Cell key={i} fill={`rgba(37,99,235,${intensity})`} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="border-t border-gray-100 mt-4 pt-4">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Hardest Roles to Fill</p>
                        <div className="space-y-2">
                            {[...jobPerformance].sort((a, b) => b.days - a.days).slice(0, 3).map((r) => (
                                <div key={r.title} className="flex items-center justify-between">
                                    <span className="text-xs text-gray-700">{r.title}</span>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${r.days >= 25 ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                        {r.days}d open
                                    </span>
                                </div>
                            ))}
                            {jobPerformance.length === 0 && <span className="text-xs text-gray-400">No active roles</span>}
                        </div>
                    </div>
                </Section>
            </div>

            {/* ── Conversion Funnel — Recharts FunnelChart ──────────────────────
                WHY FUNNEL CHART: Purpose-built for pipeline/drop-off data.
                The tapering shape instantly communicates volume loss at each
                stage — the core story of a recruiting funnel. Custom progress
                bars completely lose this visual metaphor.
            ─────────────────────────────────────────────────────────────────── */}
            <Section
                title="Conversion Funnel"
                action={
                    <span className="text-[11px] text-gray-500">
                        Overall: <span className="font-bold text-green-700">{overallConversion}%</span>
                        <span className="ml-2 text-gray-400">· Industry avg: 2.5%</span>
                        <span className="ml-2 font-semibold text-green-600">↑ Above Average</span>
                    </span>
                }
            >
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Funnel chart */}
                    <div className="flex-shrink-0">
                        <ResponsiveContainer width={300} height={280} minHeight={0} minWidth={0}>
                            <FunnelChart>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const d = payload[0].payload;
                                        const pct = ((d.value / funnelData[0].value) * 100).toFixed(0);
                                        return (
                                            <div className="bg-gray-900 text-white rounded-lg px-3 py-2.5 shadow-xl text-[11px]">
                                                <p className="font-bold text-white">{d.name}</p>
                                                <p className="text-gray-300 mt-0.5">{d.value} candidates · {pct}%</p>
                                            </div>
                                        );
                                    }}
                                />
                                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                                    <LabelList
                                        position="right"
                                        content={(props: unknown) => {
                                            const { value, x, y, width, height } = props as { value?: number; x?: number; y?: number; width?: number; height?: number };
                                            const item = funnelData.find((f) => f.value === value);
                                            if (!item) return null;
                                            const pct = ((item.value / funnelData[0].value) * 100).toFixed(0);
                                            return (
                                                <text
                                                    x={Number(x) + Number(width) + 8}
                                                    y={Number(y) + Number(height) / 2}
                                                    fill="#6B7280"
                                                    fontSize={10}
                                                    dominantBaseline="middle"
                                                >
                                                    {item.value} ({pct}%)
                                                </text>
                                            );
                                        }}
                                    />
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Stage legend + drop-off detail */}
                    <div className="flex-1 space-y-3 min-w-0">
                        {funnelData.map((step, i) => {
                            const dropPct = i > 0
                                ? (((funnelData[i - 1].value - step.value) / funnelData[i - 1].value) * 100).toFixed(0)
                                : null;
                            return (
                                <div key={step.name} className="flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: step.fill }} />
                                    <span className="text-xs text-gray-700 w-28 flex-shrink-0">{step.name}</span>
                                    <span className="text-xs font-bold text-gray-900 w-6">{step.value}</span>
                                    {dropPct && (
                                        <span className="text-[10px] text-red-500 font-medium">↓ {dropPct}% drop</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Section>

            {/* ── Job Performance ── */}
            <Section title="Job Performance Comparison">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-[11px] uppercase text-gray-500 border-b border-gray-100 tracking-wider">
                            <tr>
                                <th className="pb-2.5 font-semibold">Job Title</th>
                                <th className="pb-2.5 font-semibold text-right">Applications</th>
                                <th className="pb-2.5 font-semibold text-right">Avg Match</th>
                                <th className="pb-2.5 font-semibold text-right">Time to Hire</th>
                                <th className="pb-2.5 font-semibold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {jobPerformance.map((job) => (
                                <tr key={job.title} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 font-medium text-gray-900">{job.title}</td>
                                    <td className="py-3 text-right text-gray-700">{job.apps}</td>
                                    <td className="py-3 text-right font-semibold">
                                        <span className={job.match >= 80 ? "text-green-700" : "text-amber-600"}>{job.match}%</span>
                                    </td>
                                    <td className="py-3 text-right font-semibold">
                                        <span className={job.days > 20 ? "text-red-600" : "text-gray-700"}>{job.days}d</span>
                                    </td>
                                    <td className="py-3 text-right">
                                        {job.warn ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                                                <AlertTriangle size={10} /> Slow
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                                <CheckCircle size={10} /> On Track
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

        </div>
    );
}
