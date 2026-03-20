"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
    Briefcase, Plus, Search, MapPin, DollarSign, Clock,
    Eye, Edit2, Copy, XCircle, Calendar, CheckCircle,
    Archive, Trash2, MoreHorizontal, ChevronDown,
    Users, Star, TrendingUp, Target, Filter,
} from "lucide-react";
import { RecruiterJob, JobStatus } from "@/types/recruiter";
import { useApi } from "@/lib/hooks/useApi";
import { getRecruiterJobs } from "@/lib/api/recruiter-api";
import { JobPostModal } from "@/components/recruiter/JobPostModal";

type Job = RecruiterJob;

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: JobStatus }) {
    const styles: Record<JobStatus, string> = {
        Active: "bg-white text-green-700 border-green-300",
        Draft: "bg-white text-amber-700 border-amber-300",
        Closed: "bg-white text-gray-500 border-gray-300",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${styles[status]}`}>
            {status}
        </span>
    );
}

function WorkTypeBadge({ type }: { type: Job["workType"] }) {
    const label = type === "OnSite" ? "On Site" : type;

    return (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">{label}</span>
    );
}

function MatchBar({ score }: { score: number }) {
    const color = score >= 80 ? "bg-green-500" : score >= 65 ? "bg-amber-500" : "bg-red-400";
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
            </div>
            <span className="text-[11px] font-semibold text-gray-700 w-8 text-right">{score}%</span>
        </div>
    );
}

function MoreMenu({ job, onAction }: { job: Job; onAction: (action: string, id: string) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const actions = [
        { icon: Copy, label: "Duplicate Job", key: "duplicate", color: "text-gray-600" },
        { icon: XCircle, label: "Close Applications", key: "close", color: "text-gray-600" },
        { icon: Calendar, label: "Extend Deadline", key: "extend", color: "text-gray-600" },
        { icon: CheckCircle, label: "Mark as Filled", key: "filled", color: "text-green-600" },
        { icon: Archive, label: "Archive Job", key: "archive", color: "text-amber-600" },
        { icon: Trash2, label: "Delete Job", key: "delete", color: "text-red-600" },
    ];

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
                <MoreHorizontal size={16} />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
                    {actions.map(({ icon: Icon, label, key, color }) => (
                        <button
                            key={key}
                            onClick={() => { onAction(key, job.id); setOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-gray-50 transition-colors ${color}`}
                        >
                            <Icon size={14} className="flex-shrink-0" />
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function JobRow({ job, onAction, onEdit }: { job: Job; onAction: (action: string, id: string) => void; onEdit: (job: Job) => void }) {
    const [expanded, setExpanded] = useState(false);
    const isGhosted = job.status === "Closed";

    return (
        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-opacity ${isGhosted ? "opacity-70" : ""}`}>
            {/* Main row */}
            <div
                className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpanded(e => !e)}
            >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Briefcase size={18} className="text-gray-600" />
                </div>

                {/* Left: Title + meta */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[15px] font-semibold text-gray-900">{job.title}</h3>
                        <StatusBadge status={job.status} />
                        <WorkTypeBadge type={job.workType} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[12px] text-gray-500">
                        <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                        <span className="flex items-center gap-1"><DollarSign size={11} /> LKR {job.salaryMin}k–{job.salaryMax}k</span>
                        <span className="flex items-center gap-1"><Clock size={11} />
                            {job.postedDaysAgo === 1 ? "1 day ago" : `${job.postedDaysAgo} days ago`}
                        </span>
                        {job.deadline !== "Closed" && (
                            <span className="text-gray-400">· Deadline: {job.deadline}</span>
                        )}
                    </div>
                    {/* Skill tags */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {job.skills.slice(0, 5).map(s => (
                            <span key={s} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">{s}</span>
                        ))}
                    </div>
                </div>

                {/* Right: Stats + actions */}
                <div className="flex items-center gap-6 flex-shrink-0 ml-2">
                    {/* Stats columns */}
                    <div className="hidden md:flex items-center gap-5 text-center">
                        <div>
                            <p className="text-lg font-bold text-gray-900">{job.stats.total}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Applicants</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-700">{job.stats.views}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Views</p>
                        </div>
                        <div>
                            <p className={`text-lg font-bold ${job.stats.avgMatch >= 80 ? "text-green-600" : job.stats.avgMatch >= 65 ? "text-amber-600" : "text-gray-400"}`}>
                                {job.stats.avgMatch > 0 ? `${job.stats.avgMatch}%` : "—"}
                            </p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Avg Match</p>
                        </div>
                    </div>

                    {/* Action icons */}
                    <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                        <Link
                            href={`/recruiter/applications?job=${job.id}`}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                            title="View Applications"
                        >
                            <Eye size={16} />
                        </Link>
                        <button
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                            title="Edit Job"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(job);
                            }}
                        >
                            <Edit2 size={15} />
                        </button>
                        <MoreMenu job={job} onAction={onAction} />
                    </div>

                    {/* Expand chevron */}
                    <ChevronDown
                        size={15}
                        className={`text-gray-400 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
                    />
                </div>
            </div>

            {/* Expanded panel */}
            {expanded && (
                <div className="border-t border-gray-100 bg-gray-50/40 px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Application stage breakdown */}
                    <div>
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Application Breakdown</p>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {[
                                { label: "New", val: job.stats.new },
                                { label: "Shortlisted", val: job.stats.shortlisted },
                                { label: "Interview", val: job.stats.interview },
                                { label: "Total", val: job.stats.total },
                            ].map(({ label, val }) => (
                                <div key={label} className="rounded-md px-2 py-2 text-center bg-white border border-gray-200">
                                    <p className="text-lg font-bold text-gray-900">{val}</p>
                                    <p className="text-[10px] font-medium text-gray-500">{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Match score bar */}
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Avg. Match Score</p>
                        {job.stats.avgMatch > 0
                            ? <MatchBar score={job.stats.avgMatch} />
                            : <p className="text-xs text-gray-400 italic">No applications yet</p>}
                    </div>

                    {/* Top candidate + actions */}
                    <div>
                        {job.topCandidate && (
                            <div className="mb-4">
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Candidate</p>
                                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-sm flex-shrink-0">
                                        {job.topCandidate.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{job.topCandidate.name}</p>
                                        <p className="text-[11px] text-gray-500">Top match candidate</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-green-700 font-bold text-sm flex-shrink-0">
                                        <Star size={12} className="fill-green-500 text-green-500" />
                                        {job.topCandidate.match}%
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={`/recruiter/applications?job=${job.id}`}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
                                onClick={e => e.stopPropagation()}
                            >
                                <Users size={13} /> View Applications ({job.stats.total})
                            </Link>
                            <button
                                className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-md transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(job);
                                }}
                            >
                                <Edit2 size={13} /> Edit Job
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MyJobsPage() {
    const { data: jobsData, loading, error, refetch } = useApi(() => getRecruiterJobs(), []);
    const allJobs: Job[] = jobsData?.jobs ?? [];

    const [activeTab, setActiveTab] = useState<"All" | JobStatus>("All");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"recent" | "applications" | "deadline">("recent");
    const [toast, setToast] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [jobToEdit, setJobToEdit] = useState<Job | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleAction = (action: string, id: string) => {
        const job = allJobs.find(j => j.id === id);
        const messages: Record<string, string> = {
            duplicate: `"${job?.title}" duplicated successfully.`,
            close: `Applications closed for "${job?.title}".`,
            extend: `Deadline extended for "${job?.title}".`,
            filled: `"${job?.title}" marked as filled.`,
            archive: `"${job?.title}" archived.`,
            delete: `"${job?.title}" deleted.`,
        };
        showToast(messages[action] ?? "Action completed.");
    };

    // Compute summary stats
    const jobsWithMatch = allJobs.filter(j => j.stats.avgMatch > 0);
    const summary = {
        active: allJobs.filter(j => j.status === "Active").length,
        draft: allJobs.filter(j => j.status === "Draft").length,
        closed: allJobs.filter(j => j.status === "Closed").length,
        totalApps: allJobs.reduce((s, j) => s + j.stats.total, 0),
        avgMatch: jobsWithMatch.length > 0
            ? Math.round(jobsWithMatch.reduce((s, j) => s + j.stats.avgMatch, 0) / jobsWithMatch.length)
            : 0,
        totalViews: allJobs.reduce((s, j) => s + j.stats.views, 0),
    };

    // Filter + search + sort
    const filtered = allJobs
        .filter(j => activeTab === "All" || j.status === activeTab)
        .filter(j => j.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === "applications") return b.stats.total - a.stats.total;
            if (sortBy === "deadline") return (a.deadline || "").localeCompare(b.deadline || "");
            return a.postedDaysAgo - b.postedDaysAgo; // most recent first
        });

    const TABS: ("All" | JobStatus)[] = ["All", "Active", "Draft", "Closed"];

    return (
        <div className="space-y-5">
            {/* Modal */}
            <JobPostModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setJobToEdit(null);
                }}
                onSuccess={(msg: string) => {
                    showToast(msg);
                    refetch();
                }}
                jobToEdit={jobToEdit}
            />

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">My Jobs</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage your job postings and track applications</p>
                </div>
                <button
                    onClick={() => {
                        setJobToEdit(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-md shadow-sm transition-colors"
                >
                    <Plus size={15} /> Post New Job
                </button>
            </div>

            {/* ── Summary Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Active Jobs", value: summary.active, icon: Briefcase },
                    { label: "Total Applicants", value: summary.totalApps, icon: Users },
                    { label: "Avg Match Score", value: `${summary.avgMatch}%`, icon: Target },
                    { label: "Total Views", value: summary.totalViews.toLocaleString(), icon: TrendingUp },
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon size={16} className="text-gray-400" />
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                ))}
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Status tabs */}
                <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === tab
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab}
                            {tab !== "All" && (
                                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-gray-200 text-gray-700" : "bg-gray-200 text-gray-500"
                                    }`}>
                                    {tab === "Active" ? summary.active : tab === "Draft" ? summary.draft : summary.closed}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex-1 flex items-center gap-2 sm:justify-end">
                    {/* Sort */}
                    <div className="relative flex items-center gap-1.5 border border-gray-200 bg-white rounded-md px-3 py-2 text-xs text-gray-600 cursor-pointer hover:border-gray-300 transition-colors">
                        <Filter size={12} className="text-gray-400" />
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as typeof sortBy)}
                            className="appearance-none bg-transparent text-xs text-gray-600 cursor-pointer outline-none pr-4"
                        >
                            <option value="recent">Most Recent</option>
                            <option value="applications">Most Applications</option>
                            <option value="deadline">Deadline</option>
                        </select>
                        <ChevronDown size={12} className="text-gray-400 absolute right-2" />
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-md bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all w-44"
                        />
                    </div>
                </div>
            </div>

            {/* ── Job List ── */}
            {filtered.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                    <Briefcase size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">No jobs found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or post a new job.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(job => (
                        <JobRow 
                            key={job.id} 
                            job={job} 
                            onAction={handleAction}
                            onEdit={(job) => {
                                setJobToEdit(job);
                                setIsModalOpen(true);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* ── Toast ── */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-4">
                    <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
                    {toast}
                </div>
            )}
        </div>
    );
}
