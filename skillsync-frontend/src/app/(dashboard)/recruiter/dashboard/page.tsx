"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Briefcase, Users, MailOpen, Target, ArrowRight,
    ChevronLeft, ChevronRight, Clock, Video, MapPin, Plus,
    Download, Bell
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from "recharts";
import { useApi } from "@/lib/hooks/useApi";
import { getRecruiterDashboard, RecruiterDashboardData, getSchedule, ScheduleMap, createScheduleEvent } from "@/lib/api/recruiter-api";

const DISMISS_KEY = "recruiter_greeting_dismissed";

// Compute greeting on client only to avoid hydration mismatch
function getGreeting() {
    if (typeof window === 'undefined') return "Welcome";
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
}


// Static constants — safe at module scope
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Pipeline colors — static, safe at module scope

const PIPELINE_COLORS: Record<string, string> = {
    Screening: "#93C5FD",
    Qualified: "#A78BFA",
    Interviews: "#6EE7B7",
    Offer: "#FCA5A5",
    Hired: "#34D399",
    Rejected: "#F87171",
};

function HiringPipelineChart({
    stats,
    pipeline,
}: {
    stats?: Record<string, number>;
    pipeline?: Array<Record<string, string | number>>;
}) {
    const allKeys = Object.keys(PIPELINE_COLORS) as (keyof typeof PIPELINE_COLORS)[];
    const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set(allKeys));
    const [mounted, setMounted] = useState(false);

    // Build chart data only from API values; do not synthesize fake history.
    const pipelineData = useMemo(() => {
        if (!mounted) return [];
        if (pipeline && pipeline.length > 0) {
            return pipeline.map((point) => ({
                date: String(point.date || ""),
                Screening: Number(point.Screening || 0),
                Qualified: Number(point.Qualified || 0),
                Interviews: Number(point.Interviews || 0),
                Offer: Number(point.Offer || 0),
                Hired: Number(point.Hired || 0),
                Rejected: Number(point.Rejected || 0),
            }));
        }

        if (!stats || Object.keys(stats).length === 0) return [];

        return [{
            date: "Today",
            Screening: stats.Screening || 0,
            Qualified: stats.Qualified || stats.Shortlisted || 0,
            Interviews: stats.Interviews || stats.Interview || 0,
            Offer: stats.Offer || 0,
            Hired: stats.Hired || 0,
            Rejected: stats.Rejected || 0
        }];
    }, [mounted, pipeline, stats]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggle = (key: string) => {
        setActiveKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                if (next.size === 1) return prev; // keep at least one
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const totalEvents = pipelineData.reduce((sum: number, d: typeof pipelineData[0]) =>
        allKeys.reduce((s: number, k) => activeKeys.has(k) ? s + (d[k as keyof typeof d] as number) : s, sum), 0
    );

    const activeArr = allKeys.filter(k => activeKeys.has(k));
    const topKey = activeArr[activeArr.length - 1];

    if (!mounted) {
        return (
            <div className="bg-white border border-gray-200 rounded-md shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Hiring Pipeline</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Loading data...</p>
                    </div>
                </div>
                <div className="h-[190px] flex items-center justify-center text-gray-400">
                    <div className="animate-pulse">Loading chart...</div>
                </div>
            </div>
        );
    }

    if (pipelineData.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-md shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Hiring Pipeline</h2>
                        <p className="text-xs text-gray-400 mt-0.5">No pipeline data available yet</p>
                    </div>
                </div>
                <div className="h-[190px] flex items-center justify-center text-gray-400 text-sm">
                    No events to display
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">Hiring Pipeline</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{totalEvents} total events &mdash; last {pipelineData.length} {pipelineData.length === 1 ? "point" : "points"}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end max-w-[66%]">
                    {allKeys.map((label) => {
                        const isActive = activeKeys.has(label);
                        return (
                            <button
                                key={label}
                                onClick={() => toggle(label)}
                                className={`flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full border transition-all font-medium select-none
                                    ${isActive
                                        ? "border-gray-200 text-gray-700 bg-white shadow-sm"
                                        : "border-transparent text-gray-400 bg-gray-100"}`}
                            >
                                <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ background: isActive ? PIPELINE_COLORS[label] : "#D1D5DB" }}
                                />
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="h-[190px] overflow-x-auto">
                <div style={{ minWidth: `${Math.max(320, pipelineData.length * 28)}px`, height: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
                        <BarChart
                            data={pipelineData}
                            barSize={18}
                            barCategoryGap="28%"
                            margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={2} />
                            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: "rgba(99,102,241,0.06)" }}
                                content={({ active, payload, label: lbl }) => {
                                    if (!active || !payload?.length) return null;
                                    return (
                                        <div className="bg-gray-900 text-white rounded-lg px-3 py-2.5 shadow-xl text-[11px] min-w-[140px]">
                                            <p className="font-semibold text-gray-300 mb-1.5">{lbl}</p>
                                            {payload.map((entry) => (
                                                <div key={entry.dataKey as string} className="flex items-center justify-between gap-4 py-0.5">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full" style={{ background: entry.fill as string }} />
                                                        <span className="text-gray-300">{String(entry.dataKey)}:</span>
                                                    </span>
                                                    <span className="font-bold text-white">{entry.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }}
                            />
                            {allKeys.map((key) =>
                                activeKeys.has(key) ? (
                                    <Bar
                                        key={key}
                                        dataKey={key}
                                        stackId="pipeline"
                                        fill={PIPELINE_COLORS[key]}
                                        radius={key === topKey ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                                    />
                                ) : null
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

// Using a function to generate schedule from API data
function getScheduleData(): Record<string, { time: string; title: string; type: "zoom" | "office" | "call"; detail: string }[]> {
    // This will be replaced by real API data in the component
    return {};
}

function GreetingBanner({ onDismiss, name, count }: { onDismiss: () => void; name: string; count: number }) {
    const router = useRouter();
    const handleReview = () => { onDismiss(); router.push("/recruiter/applications"); };

    return (
        <div className="relative w-full rounded-xl overflow-hidden bg-gradient-to-r from-blue-700 to-blue-500 p-7 flex items-center justify-between shadow-md mb-5">
            <div className="absolute right-40 top-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2" />
            <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2" />
            <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-1" suppressHydrationWarning>{getGreeting()}, {name.split(' ')[0]}! 👋</h2>
                <p className="text-blue-100 text-sm leading-relaxed mb-4">
                    You have <span className="font-bold text-white">{count} new application{count !== 1 ? 's' : ''}</span>. It is a lot of work for today! So let&apos;s start.
                </p>
                <button onClick={handleReview} suppressHydrationWarning className="px-5 py-2 bg-white text-blue-700 text-sm font-semibold rounded-md hover:bg-blue-50 transition-colors shadow-sm">
                    Review it
                </button>
            </div>
            <div className="relative z-10 hidden md:flex items-end justify-center w-36 h-28 flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                    <Users size={40} className="text-white/60" />
                </div>
            </div>
        </div>
    );
}

function MiniCalendar({ schedule, onSelectDate }: { schedule: ScheduleMap; onSelectDate: (date: Date | null) => void }) {
    const [offset, setOffset] = useState(0); // offset in 5-day pages
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate 10 days starting from (offset * 5) days relative to today
    const startIndex = offset * 5;
    const days = Array.from({ length: 10 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + startIndex + i);
        return d;
    });

    const rows = [days.slice(0, 5), days.slice(5, 10)];

    const handleClick = (d: Date) => {
        const isAlreadySelected = selectedDate?.toISOString().split("T")[0] === d.toISOString().split("T")[0];
        const next = isAlreadySelected ? null : d;
        setSelectedDate(next);
        onSelectDate(next);
    };

    const monthLabel = (() => {
        const first = days[0];
        const last = days[days.length - 1];
        if (first.getMonth() === last.getMonth()) return `${MONTHS[first.getMonth()]} ${first.getFullYear()}`;
        return `${MONTHS[first.getMonth()]} – ${MONTHS[last.getMonth()]} ${last.getFullYear()}`;
    })();

    return (
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900">{monthLabel}</span>
                <div className="flex gap-1">
                    <button
                        onClick={() => setOffset(o => o - 1)}
                        disabled={offset === 0}
                        suppressHydrationWarning
                        className="p-1 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={15} className="text-gray-600" />
                    </button>
                    <button
                        onClick={() => setOffset(o => o + 1)}
                        suppressHydrationWarning
                        className="p-1 rounded hover:bg-stone-100 transition-colors"
                    >
                        <ChevronRight size={15} className="text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Day grid — 2 rows of 5 */}
            <div className="space-y-1.5">
                {rows.map((row, ri) => (
                    <div key={ri} className="grid grid-cols-5 gap-1">
                        {row.map((d, di) => {
                            const isoKey = d.toISOString().split("T")[0];
                            const isToday = d.getTime() === today.getTime();
                            const isSelected = selectedDate?.toISOString().split("T")[0] === isoKey;
                            const hasEvents = !!schedule[isoKey];

                            return (
                                <button
                                    key={di}
                                    onClick={() => handleClick(d)}
                                    suppressHydrationWarning
                                    className={`flex flex-col items-center py-1.5 px-0.5 rounded-md transition-all text-center cursor-pointer
                                        ${isSelected ? "bg-blue-600 text-white shadow-sm" :
                                            isToday ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                                "hover:bg-stone-100 text-gray-700"}`}
                                >
                                    <span className={`text-[10px] font-medium ${isSelected ? "text-blue-100" : "text-gray-400"}`}>
                                        {DAYS[d.getDay()]}
                                    </span>
                                    <span className="text-sm font-bold mt-0.5">{d.getDate()}</span>
                                    {hasEvents && (
                                        <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? "bg-white" : "bg-blue-500"}`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

function SchedulePanel({ date, schedule, onAddEvent }: { date: Date; schedule: ScheduleMap; onAddEvent: (date: Date) => void }) {
    const isoKey = date.toISOString().split("T")[0];
    const events = schedule[isoKey] || [];
    const displayDate = `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;

    const typeIcon = (type: string) => {
        if (type === "zoom") return <Video size={13} className="text-blue-500" />;
        if (type === "office") return <MapPin size={13} className="text-green-600" />;
        return <Clock size={13} className="text-amber-500" />;
    };

    return (
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-3 bg-stone-50/50 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Schedule</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{displayDate}</p>
                </div>
                <button onClick={() => onAddEvent(date)} className="p-1.5 rounded-full hover:bg-stone-200 text-gray-700 transition-colors" title="Add Event">
                    <Plus size={16} />
                </button>
            </div>
            <div className="p-0">
                {events.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">No events scheduled</div>
                ) : (
                    events.map((ev, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-stone-50 transition-colors">
                            <div className="flex-shrink-0 mt-0.5">{typeIcon(ev.type)}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                                <p className="text-xs text-gray-500 truncate">{ev.detail}</p>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0">{ev.time}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default function RecruiterDashboard() {
    const { data: dashboard } = useApi<RecruiterDashboardData>(() => getRecruiterDashboard());
    const { data: scheduleMap, refetch: refetchSchedule } = useApi<ScheduleMap>(() => getSchedule());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showBanner, setShowBanner] = useState(true);
    const [lastUpdated] = useState("Just now");

    // Add Event Modal State
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [eventDate, setEventDate] = useState<Date | null>(null);
    const [eventForm, setEventForm] = useState({ title: "", time: "09:00", type: "zoom", detail: "" });
    const [isSavingEvent, setIsSavingEvent] = useState(false);

    const handleOpenAddEvent = (date: Date) => {
        setEventDate(date);
        setEventForm({ title: "", time: "09:00", type: "zoom", detail: "" });
        setEventModalOpen(true);
    };

    const handleSaveEvent = async () => {
        if (!eventDate || !eventForm.title || !eventForm.time) return;
        setIsSavingEvent(true);
        try {
            await createScheduleEvent({
                date: eventDate.toISOString().split("T")[0],
                time: eventForm.time,
                title: eventForm.title,
                type: eventForm.type,
                detail: eventForm.detail
            });
            refetchSchedule();
            setEventModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Failed to save event");
        } finally {
            setIsSavingEvent(false);
        }
    };

    useEffect(() => {
        const dismissed = sessionStorage.getItem(DISMISS_KEY);
        if (!dismissed) setShowBanner(true);
    }, []);

    const handleDismiss = () => {
        sessionStorage.setItem(DISMISS_KEY, "true");
        setShowBanner(false);
    };

    return (
        <div className="space-y-5">
            {/* Greeting Banner / Header */}
            {showBanner && dashboard && dashboard.stats?.newApplicants > 0 ? (
                <GreetingBanner
                    onDismiss={handleDismiss}
                    name={dashboard.stats.recruiterName ?? "Recruiter"}
                    count={dashboard.stats.newApplicants}
                />
            ) : (
                <h1 className="text-xl font-bold text-gray-900" suppressHydrationWarning>{getGreeting()}, {dashboard?.stats?.recruiterName?.split(" ")[0] ?? "there"} 👋</h1>
            )}

            {/* Main 2-Column Layout */}
            <div className="flex gap-5 items-start">

                {/* ── LEFT COLUMN ─────────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-5">

                    {/* KPI Row — 4 compact cards */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                        {/* Active Jobs */}
                        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Jobs</p>
                                <Briefcase size={14} className="text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{dashboard?.stats?.activeJobs ?? 0}</p>
                            <span className="text-[11px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">+1 this week</span>
                        </div>

                        {/* Total Candidates */}
                        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Candidates</p>
                                <Users size={14} className="text-indigo-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{dashboard?.stats?.totalCandidates ?? 0}</p>
                            <span className="text-[11px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">+12 this week</span>
                        </div>

                        {/* New Applications */}
                        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">New Applicants</p>
                                <MailOpen size={14} className="text-amber-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{dashboard?.stats?.newApplicants ?? 0}</p>
                            <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Needs review</span>
                        </div>

                        {/* Conversion Rate */}
                        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Conversion</p>
                                <Target size={14} className="text-teal-600" />
                            </div>
                            <div className="space-y-1.5 mt-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Views</span>
                                    <span className="font-semibold text-gray-900">0</span>
                                </div>
                                <div className="w-full h-px bg-gray-100" />
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Applied</span>
                                    <span className="font-semibold text-gray-900">0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hiring Pipeline Chart */}
                    <HiringPipelineChart stats={dashboard?.pipelineStats} pipeline={dashboard?.pipeline as Array<Record<string, string | number>> | undefined} />

                    {/* Active Job Postings Table */}
                    <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                        <div className="border-b border-gray-200 px-5 py-3.5 flex items-center justify-between bg-stone-50/50">
                            <h2 className="text-sm font-semibold text-gray-900">Active Job Postings</h2>
                            <div className="flex items-center gap-3">
                                <Link href="/recruiter/jobs" className="text-xs font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1">
                                    View All <ArrowRight size={13} />
                                </Link>
                                <Link
                                    href="/recruiter/jobs"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                                >
                                    <Plus size={13} /> Post New Job
                                </Link>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-stone-50 text-gray-500 border-b border-gray-200 text-[11px] uppercase tracking-wider">
                                    <tr>
                                        <th className="px-5 py-2.5 font-medium">Role</th>
                                        <th className="px-4 py-2.5 font-medium">Dept.</th>
                                        <th className="px-4 py-2.5 font-medium">Applicants</th>
                                        <th className="px-4 py-2.5 font-medium">Status</th>
                                        <th className="px-4 py-2.5 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {(dashboard?.activeJobRows ?? []).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                                                No active jobs yet. <Link href="/recruiter/jobs" className="text-blue-600 underline">Post your first job →</Link>
                                            </td>
                                        </tr>
                                    ) : (
                                        (dashboard?.activeJobRows ?? []).map((job: { id: string; title: string; department: string; applicants: number; hot: boolean; status: string }) => (
                                            <tr key={job.id} className="hover:bg-stone-50 transition-colors">
                                                <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">
                                                    <span className="flex items-center gap-2">
                                                        <Briefcase size={13} className="text-gray-400" /> {job.title}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{job.department}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="flex items-center gap-1.5">
                                                        {job.applicants}
                                                        {job.hot && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border
                                                        ${job.status === "Active" ? "bg-green-50 text-green-800 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                                                        {job.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <Link href={`/recruiter/applications?jobId=${job.id}`} className="text-blue-700 hover:text-blue-900 text-[11px] font-medium border border-gray-300 rounded px-2 py-1 bg-white hover:bg-stone-50 transition-colors">
                                                        Review
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN ─────────────────────────────── */}
                <div className="w-[240px] flex-shrink-0 space-y-4">

                    {/* Mini Calendar */}
                    <MiniCalendar schedule={scheduleMap || {}} onSelectDate={setSelectedDate} />

                    {/* Schedule or Top Matches */}
                    {selectedDate ? (
                        <SchedulePanel date={selectedDate} schedule={scheduleMap || {}} onAddEvent={handleOpenAddEvent} />
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-md shadow-sm">
                            <div className="border-b border-gray-200 px-4 py-3 bg-stone-50/50 flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-gray-900">Top Matches</h3>
                                <button suppressHydrationWarning className="text-[11px] font-medium text-blue-700 hover:underline">See all</button>
                            </div>
                            <div>
                                {(dashboard?.recentApplications ?? []).length === 0 ? (
                                    <p className="px-4 py-6 text-center text-xs text-gray-400">No applicants yet</p>
                                ) : (
                                    [...(dashboard?.recentApplications ?? [])]
                                        .sort((a: { matchScore: number }, b: { matchScore: number }) => b.matchScore - a.matchScore)
                                        .slice(0, 3)
                                        .map((app: { id: string; candidateName: string; candidateInitials: string; role: string; matchScore: number; avatarColor: string; jobId: string }) => (
                                            <Link key={app.id} href={`/recruiter/applications?jobId=${app.jobId}`} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-stone-50 transition-colors cursor-pointer">
                                                <div className={`w-8 h-8 rounded-full ${app.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                                    {app.candidateInitials}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-medium text-gray-900 truncate">{app.candidateName}</p>
                                                    <p className="text-[11px] text-gray-500 truncate">{app.role}</p>
                                                </div>
                                                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 border ${app.matchScore >= 80 ? "bg-green-50 text-green-700 border-green-200"
                                                    : app.matchScore >= 60 ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                        : "bg-gray-100 text-gray-600 border-gray-200"
                                                    }`}>
                                                    {app.matchScore}%
                                                </span>
                                            </Link>
                                        ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-100 pt-3 mt-4">
                <span>Last updated: {lastUpdated} · <span className="font-bold text-gray-700">{dashboard?.stats?.activeJobs ?? 0} active job listings</span></span>
                <div className="flex items-center gap-4">
                    <button suppressHydrationWarning className="flex items-center gap-1.5 hover:text-gray-700 transition-colors font-medium">
                        <Download size={11} /> Export Stats
                    </button>
                    <button suppressHydrationWarning className="flex items-center gap-1.5 hover:text-gray-700 transition-colors font-medium">
                        <Bell size={11} /> Notifications
                    </button>
                </div>
            </div>
            {/* Event Modal */}
            {eventModalOpen && eventDate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-stone-50">
                            <h3 className="font-bold text-gray-900">Add Event</h3>
                            <button onClick={() => setEventModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                                For {eventDate.toISOString().split("T")[0]}
                            </p>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                                <input type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md outline-none focus:border-blue-500" placeholder="Interview with Jane" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                                    <input type="time" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                    <select value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value})} className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-md outline-none focus:border-blue-500 bg-white">
                                        <option value="zoom">Video Call</option>
                                        <option value="office">In Office</option>
                                        <option value="call">Phone Call</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Details</label>
                                <textarea value={eventForm.detail} onChange={e => setEventForm({...eventForm, detail: e.target.value})} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md outline-none focus:border-blue-500 resize-none" rows={2} placeholder="Zoom link or room #"></textarea>
                            </div>
                        </div>
                        <div className="px-5 py-3 border-t border-gray-100 bg-stone-50 flex justify-end gap-2">
                            <button onClick={() => setEventModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</button>
                            <button onClick={handleSaveEvent} disabled={isSavingEvent || !eventForm.title || !eventForm.time} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                {isSavingEvent ? "Saving..." : "Save Event"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
