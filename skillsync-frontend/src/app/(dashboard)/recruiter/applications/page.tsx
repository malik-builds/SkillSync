"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
    Search, ChevronDown, MapPin,
    Github, CheckCircle, XCircle,
    MessageSquare, Eye, MoreHorizontal, Users, Sparkles,
    ChevronRight, ArrowUpDown, Tag, X,
} from "lucide-react";
import { RecruiterStage, AppTag, RecruiterApplication } from "@/types/recruiter";
import { useApi } from "@/lib/hooks/useApi";
import { getRecruiterApplications, RecruiterApplicationsResponse, createConversation } from "@/lib/api/recruiter-api";
import { useAuth } from "@/lib/auth/AuthContext";
import { Send } from "lucide-react";
import { useSearchParams } from "next/navigation";

// ─── Local type aliases ────────────────────────────────────────────────────────

type Stage = RecruiterStage;
type Application = RecruiterApplication;

// ─── Constants ──────────────────────────────────────────────────────────────────



const STAGES: Stage[] = ["New", "Screening", "Shortlisted", "Interview", "Offer", "Hired", "Rejected"];

const STAGE_CFG: Record<Stage, { text: string; bg: string; border: string; dot: string }> = {
    New: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
    Screening: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
    Shortlisted: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
    Interview: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
    Offer: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
    Hired: { text: "text-green-700", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
    Rejected: { text: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400" },
};

const TAG_CFG: Record<AppTag, string> = {
    "Top Tier": "bg-blue-50 text-blue-700 border-blue-200",
    "On Hold": "bg-gray-100 text-gray-600 border-gray-200",
    "Referral": "bg-blue-50 text-blue-700 border-blue-200",
    "Needs Review": "bg-blue-50 text-blue-700 border-blue-200",
    "Culture Fit": "bg-blue-50 text-blue-700 border-blue-200",
};

const ALL_TAGS: AppTag[] = ["Top Tier", "On Hold", "Referral", "Needs Review", "Culture Fit"];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function scoreColor(n: number) {
    if (n >= 80) return "text-blue-700";
    if (n >= 70) return "text-blue-600";
    return "text-gray-500";
}

// ─── Filter Pill ────────────────────────────────────────────────────────────────

function FilterPill({
    label, active, children, onClear,
}: {
    label: string; active?: boolean; children?: React.ReactNode; onClear?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${active
                    ? "bg-blue-700 border-blue-700 text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
            >
                {label}
                {active && onClear && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={e => { e.stopPropagation(); onClear(); }}
                        onKeyDown={e => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                onClear();
                            }
                        }}
                        className="ml-0.5 hover:opacity-70 cursor-pointer"
                        aria-label={`Clear ${label} filter`}
                    ><X size={11} /></span>
                )}
                {!active && <ChevronDown size={11} />}
            </button>
            {open && children && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 min-w-[160px]">
                    {children}
                </div>
            )}
        </div>
    );
}

// ─── Stage Badge ───────────────────────────────────────────────────────────────

function StageBadge({ stage }: { stage: Stage }) {
    const cfg = STAGE_CFG[stage];
    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {stage}
        </span>
    );
}

// ─── Inline Stage Dropdown ──────────────────────────────────────────────────────

function StageDropdown({ current, onChange }: { current: Stage; onChange: (s: Stage) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    return (
        <div className="relative" ref={ref} onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1 hover:opacity-75">
                <StageBadge stage={current} />
                <ChevronDown size={10} className="text-gray-400" />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 py-1.5 min-w-[150px]">
                    {STAGES.map(s => (
                        <button
                            key={s}
                            onClick={() => { onChange(s); setOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors ${s === current ? "font-semibold" : ""}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STAGE_CFG[s].dot}`} />
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}



// ─── Inline Tag Editor ──────────────────────────────────────────────────────────

function TagEditor({ tags, onChange }: { tags: AppTag[]; onChange: (t: AppTag[]) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const toggleTag = (t: AppTag) => onChange(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t]);

    return (
        <div className="relative" ref={ref} onClick={e => e.stopPropagation()}>
            <div className="flex flex-wrap items-center gap-1">
                {tags.map(t => (
                    <span key={t} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${TAG_CFG[t]}`}>{t}</span>
                ))}
                <button
                    onClick={() => setOpen(o => !o)}
                    className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Add tag"
                >
                    <Tag size={11} />
                </button>
            </div>
            {open && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 py-1.5 min-w-[160px]">
                    {ALL_TAGS.map(t => (
                        <button
                            key={t}
                            onClick={() => toggleTag(t)}
                            className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${TAG_CFG[t]}`}>{t}</span>
                            {tags.includes(t) && <CheckCircle size={11} className="ml-auto text-blue-600" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Application Row ───────────────────────────────────────────────────────────

function AppRow({
    app, selected, onSelect, onStageChange, onTagChange, onMessage, onView,
}: {
    app: Application;
    selected: boolean;
    onSelect: () => void;
    onStageChange: (id: string, s: Stage) => void;
    onTagChange: (id: string, tags: AppTag[]) => void;
    onMessage: (app: Application) => void;
    onView: (id: string) => void;
}) {
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const sourceBadge = {
        Direct: "bg-gray-100 text-gray-600",
        Referral: "bg-blue-50 text-blue-700",
        LinkedIn: "bg-blue-50 text-blue-700",
    }[app.source];

    return (
        <tr className={`group border-b border-gray-100 transition-colors ${selected ? "bg-blue-50/40" : "hover:bg-gray-50/50"}`}>

            {/* Checkbox */}
            <td className="pl-5 pr-3 py-3.5">
                <input type="checkbox" checked={selected} onChange={onSelect}
                    className="accent-blue-600 w-3.5 h-3.5 cursor-pointer" />
            </td>

            {/* Candidate — name + degree + university + source */}
            <td className="px-3 py-3.5 min-w-[220px]">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${app.avatarColor} text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ring-2 ring-white`}>
                        {app.candidateInitials}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">{app.candidateName}</p>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${sourceBadge} flex-shrink-0`}>{app.source}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{app.degree} {app.major} · {app.university}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400">
                            <MapPin size={9} /> {app.location}
                            {app.github && <><span className="mx-1">·</span><Github size={9} /> {app.github.commits6mo} commits</>}
                        </div>
                    </div>
                </div>
            </td>

            {/* Applied for — job + dept */}
            <td className="px-3 py-3.5 min-w-[170px]">
                <p className="text-[12px] font-medium text-gray-800 truncate">{app.jobTitle}</p>
                <span className="text-[10px] text-gray-400 font-medium">{app.department}</span>
            </td>

            {/* Status — inline dropdown */}
            <td className="px-3 py-3.5 w-40">
                <StageDropdown
                    current={app.stage}
                    onChange={s => onStageChange(app.id, s)}
                />
            </td>

            {/* Tags — inline editor */}
            <td className="px-3 py-3.5 min-w-[140px]">
                <TagEditor
                    tags={app.tags}
                    onChange={tags => onTagChange(app.id, tags)}
                />
            </td>

            {/* Applied on — date */}
            <td className="px-3 py-3.5 w-28 text-center">
                <p className="text-[12px] text-gray-700 font-medium">{fmtDate(app.appliedOn)}</p>
                <p className="text-[10px] text-gray-400">
                    {app.appliedDaysAgo === 0 ? "Today"
                        : app.appliedDaysAgo === 1 ? "Yesterday"
                            : `${app.appliedDaysAgo}d ago`}
                </p>
            </td>

            {/* Score — AI match % */}
            <td className="px-3 py-3.5 w-32 text-center">
                <div className="flex items-center justify-center gap-1">
                    <span className={`text-[15px] font-bold ${scoreColor(app.matchScore)}`}>{app.matchScore}%</span>
                    {app.matchScore >= 90 && <Sparkles size={11} className="text-blue-600" />}
                </div>
            </td>

            {/* Actions */}
            <td className="px-3 pr-5 py-3.5 w-32">
                <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onView(app.id)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-700 transition-colors border border-gray-200 hover:border-blue-300" title="View Profile">
                        <Eye size={14} />
                    </button>
                    <button onClick={() => onMessage(app)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-700 transition-colors border border-gray-200 hover:border-blue-300" title="Send Message">
                        <MessageSquare size={14} />
                    </button>
                    <div className="relative" ref={moreRef}>
                        <button onClick={e => { e.stopPropagation(); setMoreOpen(o => !o); }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-700 transition-colors border border-gray-200 hover:border-blue-300">
                            <MoreHorizontal size={14} />
                        </button>
                        {moreOpen && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 py-1.5 w-44">
                                {[
                                    { label: "Shortlist", action: () => onStageChange(app.id, "Shortlisted") },
                                    { label: "Schedule Interview", action: () => onStageChange(app.id, "Interview") },
                                    { label: "Send Offer", action: () => onStageChange(app.id, "Offer") },
                                    { label: "Send Message", action: () => { onMessage(app); } },
                                    { label: "Reject", action: () => onStageChange(app.id, "Rejected") },
                                ].map(({ label, action }) => (
                                    <button key={label} onClick={() => { action(); setMoreOpen(false); }}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
}

// ─── Message Modal ──────────────────────────────────────────────────────────────

function MessageModal({ app, onClose, onSuccess }: { app: Application; onClose: () => void; onSuccess: (m: string) => void }) {
    const { user } = useAuth();
    const [msg, setMsg] = useState(
        `Hi ${app.candidateName.split(" ")[0]},\n\nThank you for applying for the ${app.jobTitle} position. We'd love to move forward with you.\n\nBest regards,\n${user?.fullName || "Recruiter"}`
    );
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        setSending(true);
        try {
            await createConversation({
                candidateEmail: app.studentEmail,
                text: msg,
            });
            onSuccess(`Message sent to ${app.candidateName}!`);
            onClose();
        } catch (error) {
            console.error("Failed to send message:", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${app.avatarColor} text-white text-sm font-bold flex items-center justify-center ring-2 ring-white shadow-sm`}>
                            {app.candidateInitials}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Message {app.candidateName}</h3>
                            <p className="text-[11px] text-gray-500 font-medium">Re: {app.jobTitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={16} /></button>
                </div>
                <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Message Content</label>
                    <textarea
                        value={msg}
                        onChange={e => setMsg(e.target.value)}
                        rows={6}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 resize-none transition-all"
                        placeholder="Write your message here..."
                    />
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button
                        onClick={handleSend}
                        disabled={sending || !msg.trim()}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {sending ? "Sending..." : <><Send size={14} /> Send Message</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RecruiterApplicationsPage() {
    const searchParams = useSearchParams();
    const urlJobId = searchParams.get("job") || searchParams.get("jobId");

    const { data: fetchedData, loading, error, refetch } = useApi<RecruiterApplicationsResponse>(
        () => getRecruiterApplications(urlJobId ? { jobId: urlJobId } : undefined),
        [urlJobId]
    );
    const [apps, setApps] = useState<Application[]>([]);

    useEffect(() => {
        if (fetchedData) setApps(fetchedData.applications);
    }, [fetchedData]);

    const JOBS = useMemo(() => {
        const map = new Map<string, { id: string; title: string; department: string }>();
        apps.forEach(a => { if (!map.has(a.jobId)) map.set(a.jobId, { id: a.jobId, title: a.jobTitle, department: a.department }); });
        return Array.from(map.values());
    }, [apps]);
    const [search, setSearch] = useState("");
    const [filterJob, setFilterJob] = useState(urlJobId || "all");
    const [filterStage, setFilterStage] = useState<Stage | "all">("all");
    const [filterTag, setFilterTag] = useState<AppTag | "all">("all");
    const [filterMinRating, setFilterMinRating] = useState(0);
    const [selectedStageStrip, setSelectedStageStrip] = useState<Stage | "all">("all");
    const [sortBy, setSortBy] = useState<"date" | "match" | "name">("date");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [msgTarget, setMsgTarget] = useState<Application | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        setFilterJob(urlJobId || "all");
    }, [urlJobId]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const updateStage = (id: string, stage: Stage) => { setApps(p => p.map(a => a.id === id ? { ...a, stage } : a)); showToast(`Moved to ${stage}`); };
    const updateTags = (id: string, tags: AppTag[]) => setApps(p => p.map(a => a.id === id ? { ...a, tags } : a));

    const toggleSelect = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const clearFilters = () => { setFilterJob("all"); setFilterStage("all"); setFilterTag("all"); setFilterMinRating(0); };

    const activeFilterCount = [filterJob !== "all", filterStage !== "all", filterTag !== "all", filterMinRating > 0].filter(Boolean).length;

    // Stage strip counts (respect job filter)
    const stageCounts = useMemo(() =>
        STAGES.reduce((acc, s) => {
            acc[s] = apps.filter(a => (filterJob === "all" || a.jobId === filterJob) && a.stage === s).length;
            return acc;
        }, {} as Record<Stage, number>),
        [apps, filterJob]
    );

    const combined = useMemo(() => {
        const stage = filterStage !== "all" ? filterStage : selectedStageStrip !== "all" ? selectedStageStrip : null;
        let list = apps.filter(a => {
            if (filterJob !== "all" && a.jobId !== filterJob) return false;
            if (stage && a.stage !== stage) return false;
            if (filterTag !== "all" && !a.tags.includes(filterTag)) return false;
            if (filterMinRating > 0 && a.recruiterRating < filterMinRating) return false;
            if (search && !a.candidateName.toLowerCase().includes(search.toLowerCase()) &&
                !a.jobTitle.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
        list = [...list].sort((a, b) => {
            const diff = sortBy === "match" ? b.matchScore - a.matchScore
                : sortBy === "name" ? a.candidateName.localeCompare(b.candidateName)
                    : a.appliedDaysAgo - b.appliedDaysAgo;
            return sortDir === "asc" ? -diff : diff;
        });
        return list;
    }, [apps, search, filterJob, filterStage, filterTag, filterMinRating, selectedStageStrip, sortBy, sortDir]);

    const allSelected = combined.length > 0 && combined.every(a => selected.has(a.id));
    const selectAll = (v: boolean) => setSelected(v ? new Set(combined.map(a => a.id)) : new Set());
    const bulkMove = (stage: Stage) => { setApps(p => p.map(a => selected.has(a.id) ? { ...a, stage } : a)); showToast(`${selected.size} moved to ${stage}`); setSelected(new Set()); };
    const toggleSort = (col: typeof sortBy) => { if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortBy(col); setSortDir("desc"); } };

    const totalVisible = apps.filter(a => filterJob === "all" || a.jobId === filterJob).length;

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
    if (error) return <div className="text-center py-12 text-red-500">Failed to load applications. <button onClick={refetch} className="underline">Retry</button></div>;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Applications</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Review and manage all incoming candidate applications</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users size={14} className="text-blue-600" />
                    <span><span className="font-bold text-gray-900">{totalVisible}</span> applications</span>
                </div>
            </div>

            {/* Pipeline Strip */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    {/* All */}
                    <button
                        onClick={() => setSelectedStageStrip("all")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${selectedStageStrip === "all" && filterStage === "all"
                            ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        All <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/30 text-current font-bold">{totalVisible}</span>
                    </button>
                    <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
                    {(["New", "Screening", "Shortlisted", "Interview", "Offer", "Hired"] as Stage[]).map((s, i, arr) => {
                        const cfg = STAGE_CFG[s];
                        const isActive = (selectedStageStrip === s || filterStage === s);
                        return (
                            <div key={s} className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                    onClick={() => {
                                        setSelectedStageStrip(isActive ? "all" : s);
                                        setFilterStage("all");
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${isActive ? `${cfg.bg} ${cfg.text} ring-1 ring-inset ${cfg.border}` : "bg-gray-100 text-gray-600 hover:bg-blue-50"
                                        }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? cfg.dot : "bg-gray-400"}`} />
                                    {s}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-white/70 text-gray-800" : "bg-white text-gray-500"}`}>
                                        {stageCounts[s]}
                                    </span>
                                </button>
                                {i < arr.length - 1 && <ChevronRight size={11} className="text-gray-200" />}
                            </div>
                        );
                    })}
                    <div className="ml-auto flex-shrink-0">
                        <button
                            onClick={() => setSelectedStageStrip(selectedStageStrip === "Rejected" ? "all" : "Rejected")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedStageStrip === "Rejected"
                                ? `${STAGE_CFG.Rejected.bg} ${STAGE_CFG.Rejected.text} ring-1 ring-inset ${STAGE_CFG.Rejected.border}`
                                : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
                                }`}
                        >
                            <XCircle size={11} /> Rejected
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white text-gray-500 font-bold">{stageCounts.Rejected}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Bar — pill-based (reference image style) */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text" placeholder="Search candidates…" value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 w-48"
                    />
                </div>

                {/* Position */}
                <FilterPill
                    label={filterJob === "all" ? "Position" : JOBS.find(j => j.id === filterJob)?.title ?? "Position"}
                    active={filterJob !== "all"}
                    onClear={() => setFilterJob("all")}
                >
                    {JOBS.map(j => (
                        <button key={j.id} onClick={() => setFilterJob(j.id === filterJob ? "all" : j.id)}
                            className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-blue-50 ${j.id === filterJob ? "font-semibold text-blue-700" : "text-gray-700"}`}>
                            {j.id === filterJob && <CheckCircle size={11} className="text-blue-700" />}
                            {j.title}
                        </button>
                    ))}
                </FilterPill>

                {/* Stage */}
                <FilterPill
                    label={filterStage === "all" ? "Stage" : filterStage}
                    active={filterStage !== "all"}
                    onClear={() => setFilterStage("all")}
                >
                    {STAGES.map(s => (
                        <button key={s} onClick={() => setFilterStage(s === filterStage ? "all" : s)}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-blue-50 ${s === filterStage ? "font-semibold text-blue-700" : "text-gray-700"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STAGE_CFG[s].dot}`} />{s}
                        </button>
                    ))}
                </FilterPill>

                {/* Tags */}
                <FilterPill
                    label={filterTag === "all" ? "Tags" : filterTag}
                    active={filterTag !== "all"}
                    onClear={() => setFilterTag("all")}
                >
                    {ALL_TAGS.map(t => (
                        <button key={t} onClick={() => setFilterTag(t === filterTag ? "all" : t)}
                            className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-blue-50 ${t === filterTag ? "font-semibold text-blue-700" : "text-gray-700"}`}>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${TAG_CFG[t]}`}>{t}</span>
                        </button>
                    ))}
                </FilterPill>

                {/* Score Filter */}
                <FilterPill
                    label={filterMinRating === 0 ? "Score" : `${filterMinRating}%+`}
                    active={filterMinRating > 0}
                    onClear={() => setFilterMinRating(0)}
                >
                    {[70, 80, 90].map(r => (
                        <button key={r} onClick={() => setFilterMinRating(r === filterMinRating ? 0 : r)}
                            className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-blue-50 ${r === filterMinRating ? "font-semibold text-blue-700" : "text-gray-700"}`}>
                            {r}% & above
                        </button>
                    ))}
                </FilterPill>

                {/* Sort */}
                <div className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-2">
                    <ArrowUpDown size={12} className="text-gray-400" />
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                        className="text-xs text-gray-700 outline-none bg-transparent cursor-pointer">
                        <option value="date">Applied on</option>
                        <option value="match">Match score</option>
                        <option value="name">Name</option>
                    </select>
                </div>

                {/* Clear + result count */}
                {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2">
                        Clear all
                    </button>
                )}
                <span className="ml-auto text-xs text-gray-500">
                    <span className="font-semibold text-gray-800">{combined.length}</span> results
                </span>
            </div>

            {/* Bulk bar */}
            {selected.size > 0 && (
                <div className="flex items-center gap-3 bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-medium">
                    <CheckCircle size={14} />
                    <span>{selected.size} selected —</span>
                    <div className="flex gap-2">
                        {(["Shortlisted", "Interview", "Offer", "Rejected"] as Stage[]).map(s => (
                            <button key={s} onClick={() => bulkMove(s)}
                                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-xs font-semibold">
                                → {s}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setSelected(new Set())} className="ml-auto text-blue-200 hover:text-white text-xs">Clear</button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {combined.length === 0 ? (
                    <div className="py-16 text-center">
                        <Users size={28} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-500">No applications found</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
                        <button onClick={clearFilters} className="mt-3 text-xs text-blue-600 underline underline-offset-2">Clear all filters</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/70">
                                    <th className="pl-5 pr-3 py-3 w-8">
                                        <input type="checkbox" checked={allSelected} onChange={e => selectAll(e.target.checked)}
                                            className="accent-blue-600 w-3.5 h-3.5 cursor-pointer" />
                                    </th>
                                    <th className="px-3 py-3 text-left">
                                        <button onClick={() => toggleSort("name")} className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider hover:text-blue-700">
                                            Name <ArrowUpDown size={10} />
                                        </button>
                                    </th>
                                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Applied for</th>
                                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-40">Status</th>
                                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tags</th>
                                    <th className="px-3 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                                        <button onClick={() => toggleSort("date")} className="flex items-center gap-1 mx-auto hover:text-blue-700">
                                            Applied on <ArrowUpDown size={10} />
                                        </button>
                                    </th>
                                    <th className="px-3 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">
                                        <button onClick={() => toggleSort("match")} className="flex items-center gap-1 mx-auto hover:text-blue-700">
                                            Score <ArrowUpDown size={10} />
                                        </button>
                                    </th>
                                    <th className="px-3 pr-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {combined.map(app => (
                                    <AppRow
                                        key={app.id} app={app}
                                        selected={selected.has(app.id)}
                                        onSelect={() => toggleSelect(app.id)}
                                        onStageChange={updateStage}
                                        onTagChange={updateTags}
                                        onMessage={setMsgTarget}
                                        onView={id => showToast(`Opening ${apps.find(a => a.id === id)?.candidateName}'s profile…`)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {msgTarget && (
                <MessageModal
                    app={msgTarget}
                    onClose={() => setMsgTarget(null)}
                    onSuccess={(m) => showToast(m)}
                />
            )}

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-xl flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" /> {toast}
                </div>
            )}
        </div>
    );
}
