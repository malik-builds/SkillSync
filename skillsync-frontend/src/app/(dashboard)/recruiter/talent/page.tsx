"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
    Search, X, Plus, Github, MapPin, GraduationCap,
    Briefcase, BookmarkPlus, MessageSquare, ExternalLink,
    SlidersHorizontal, ChevronDown, Users, Filter, RotateCcw,
    Bookmark, CheckCircle,
} from "lucide-react";
import { Candidate } from "@/types/recruiter";
import { useAuth } from "@/lib/auth/AuthContext";
import { searchTalent, createConversation } from "@/lib/api/recruiter-api";
import { Send } from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────────────

const UNIVERSITIES = ["University of Colombo", "University of Moratuwa", "SLIIT", "NSBM", "Informatics Institute of Technology", "Other"];
const ALL_SKILLS = ["Python", "React", "Node.js", "MongoDB", "Docker", "AWS", "Django", "PostgreSQL",
    "TypeScript", "Kubernetes", "Git", "Java", "Go", "Next.js", "Redis", "GraphQL"];
const NICE = ["HTML/CSS", "Figma", "UI/UX", "Tailwind CSS", "Storybook", "Jest", "Cypress", "Linux"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function matchColor(score: number) {
    if (score >= 90) return { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" };
    if (score >= 80) return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
    if (score >= 70) return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
    return { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" };
}


// ─── Candidate Card ─────────────────────────────────────────────────────────────

function CandidateCard({
    candidate, onSave, onMessage, onInvite,
}: {
    candidate: Candidate;
    onSave: (id: string) => void;
    onMessage: (id: string) => void;
    onInvite?: (id: string) => void;
}) {
    const isTopMatch = candidate.matchScore >= 90;
    const matchTextColor = candidate.matchScore >= 85 ? "text-green-600"
        : candidate.matchScore >= 70 ? "text-blue-600" : "text-gray-500";

    // Convert 0-10 score → 0-5 rating
    const toFiveScale = (s: number) => Math.round(s / 2);

    const topSkills = candidate.skills.map(s => s.name).join(", ");

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all px-5 py-4">
            {/* ── Row 1: Avatar + Info + Match Score ── */}
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {candidate.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    {candidate.github?.active && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                </div>

                {/* Name + Meta */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[15px] font-bold text-gray-900">{candidate.name}</h3>
                        {isTopMatch && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                Top Match
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[12px] text-gray-500">
                        <span className="flex items-center gap-1">
                            <GraduationCap size={12} /> {candidate.university}
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin size={12} /> {candidate.location}
                        </span>
                        <span className="flex items-center gap-1">
                            <Briefcase size={12} />
                            {candidate.experience === "Fresh" ? "Fresh Graduate" : candidate.experience + " exp"}
                        </span>
                    </div>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                        {candidate.degree} {candidate.major} · Graduating {candidate.graduatingMonth} {candidate.graduatingYear} · Available: {candidate.availabilityStatus}
                    </p>
                </div>

                {/* Match Score — isolated right */}
                <div className="text-right flex-shrink-0 ml-4">
                    <p className={`text-2xl font-extrabold leading-none ${matchTextColor}`}>
                        {candidate.matchScore}%
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">match score</p>
                </div>
            </div>

            {/* ── Row 2: Skill chips ── */}
            <div className="flex flex-wrap gap-1.5 mt-3">
                {candidate.skills.map(skill => (
                    <span
                        key={skill.name}
                        className="text-[12px] text-gray-700 border border-gray-300 rounded px-2 py-0.5 bg-white hover:border-blue-400 hover:text-blue-700 transition-colors cursor-default"
                    >
                        {skill.name} ({toFiveScale(skill.score)}/5)
                    </span>
                ))}
            </div>

            {/* ── Row 3: GitHub + skill score ── */}
            {candidate.github && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[12px] text-gray-500">
                    <span className="flex items-center gap-1"><Github size={13} /> {candidate.github.repos} repos</span>
                    <span className="flex items-center gap-1">&#x3c;&#47;&#x3e; {candidate.github.commits6mo} commits</span>
                    <span>Skill score: {candidate.overallScore}%</span>
                    <span className="text-gray-400">Top: {topSkills}</span>
                </div>
            )}

            {/* ── Row 4: Actions ── */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                    onClick={() => onSave(candidate.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-medium transition-colors ${candidate.saved
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "border-gray-300 text-gray-600 hover:border-gray-400 bg-white"
                        }`}
                >
                    <Bookmark size={13} className={candidate.saved ? "fill-blue-600" : ""} />
                    {candidate.saved ? "Saved" : "Save"}
                </button>
                <button
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-600 hover:border-gray-400 bg-white transition-colors"
                >
                    <ExternalLink size={13} /> View Profile
                </button>
                <button
                    onClick={() => onMessage(candidate.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-600 hover:border-gray-400 bg-white transition-colors"
                >
                    <MessageSquare size={13} /> Message
                </button>
                <button 
                    onClick={() => onInvite?.(candidate.id)}
                    className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                >
                    <Users size={13} /> Invite to Apply
                </button>
            </div>
        </div>
    );
}

// ─── Filter Sidebar ─────────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="border-b border-gray-100 last:border-0 py-3">
            <button
                className="flex items-center justify-between w-full text-left mb-2"
                onClick={() => setOpen(o => !o)}
            >
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{title}</span>
                <ChevronDown size={13} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && children}
        </div>
    );
}

// ─── Save Search Modal ──────────────────────────────────────────────────────────

function SaveSearchModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string) => void }) {
    const [name, setName] = useState("");
    const [notify, setNotify] = useState(true);
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
                <h3 className="text-base font-bold text-gray-900 mb-1">Save Search</h3>
                <p className="text-xs text-gray-500 mb-4">Name your search to reuse it later.</p>
                <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Senior React Developers"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={notify}
                        onChange={e => setNotify(e.target.checked)}
                        className="accent-blue-600"
                    />
                    Notify me when new candidates match
                </label>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button
                        onClick={() => { if (name.trim()) { onSave(name.trim()); onClose(); } }}
                        className="flex-1 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                        disabled={!name.trim()}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Message Modal ──────────────────────────────────────────────────────────────

function MessageModal({ candidateId, candidateName, candidateEmail, initialMessage, onClose, onSuccess }: {
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    initialMessage?: string;
    onClose: () => void;
    onSuccess: (msg: string) => void;
}) {
    const { user } = useAuth();
    const recruiterName = user?.fullName?.split(" ")[0] || "there";

    const [message, setMessage] = useState(initialMessage || `Hi ${candidateName.split(" ")[0]},\n\nI came across your profile on SkillSync and I think you could be a great fit for an opportunity at our company. Would you be open to a brief chat?\n\nBest regards,\n${user?.fullName || "Recruiter"}`);
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        setSending(true);
        try {
            await createConversation({
                candidateEmail,
                text: message,
            });
            onSuccess(`Message sent to ${candidateName}!`);
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
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <MessageSquare size={16} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Message {candidateName}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Message Content</label>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={7}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 resize-none transition-all"
                        placeholder="Write your message here..."
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || !message.trim()}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {sending ? "Sending..." : <><Send size={15} /> Send Message</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FindTalentPage() {
    const { user } = useAuth();
    
    // ── Filter state ────────────────────────────────────────────────────────
    const [searchInput, setSearchInput] = useState("");
    const [searchSkills, setSearchSkills] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const [niceToHave, setNiceToHave] = useState<string[]>([]);
    const [universities, setUniversities] = useState<string[]>([]);
    const [gradYears, setGradYears] = useState<number[]>([]);
    const [experience, setExperience] = useState<string>("");
    const [githubActive, setGithubActive] = useState(false);
    const [locations, setLocations] = useState<string[]>([]);
    const [salaryMin, setSalaryMin] = useState(0);
    const [salaryMax, setSalaryMax] = useState(150);
    const [availability, setAvailability] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<"match" | "score" | "recent">("match");

    // ── Data state ──────────────────────────────────────────────────────────
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── UI state ────────────────────────────────────────────────────────────
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [messageTarget, setMessageTarget] = useState<{ id: string, initialMessage?: string } | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [savedSearches, setSavedSearches] = useState<string[]>([]);

    // ── Core fetch function ─────────────────────────────────────────────────
    // Called on mount (no filters) and whenever user clicks Apply / Search.
    // Uses the CURRENT state values directly — no stale-closure risk.
    const doSearch = async (opts?: {
        skills?: string[];
        niceToHave?: string[];
        universities?: string[];
        gradYears?: number[];
        experience?: string;
        githubActive?: boolean;
        locations?: string[];
        salaryMin?: number;
        salaryMax?: number;
        availability?: string[];
    }) => {
        setLoading(true);
        setError(null);
        try {
            const params = opts ?? {};
            const data = await searchTalent({
                skills: params.skills ?? [],
                niceToHave: params.niceToHave ?? [],
                universities: params.universities ?? [],
                gradYears: params.gradYears ?? [],
                experience: params.experience ?? "",
                githubActive: params.githubActive ?? false,
                locations: params.locations ?? [],
                salaryMin: params.salaryMin ?? 0,
                salaryMax: params.salaryMax ?? 150,
                availability: (params.availability ?? []).join(","),
            });
            setCandidates(data.candidates);
        } catch (e: unknown) {
            const msg = e && typeof e === "object" && "error" in e
                ? (e as { error: string }).error
                : "Failed to load talent";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch automatically when any filter state changes.
    // We use a 400ms debounce so that sliding the salary or clicking checkboxes rapidly doesn't spam the API.
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            doSearch({
                skills: searchSkills,
                niceToHave,
                universities,
                gradYears,
                experience,
                githubActive,
                locations,
                salaryMin,
                salaryMax,
                availability,
            });
        }, 400);
        return () => clearTimeout(timeoutId);
    }, [searchSkills, niceToHave, universities, gradYears, experience, githubActive, locations, salaryMin, salaryMax, availability]);

    const applyFilters = () => {
        doSearch({
            skills: searchSkills,
            niceToHave,
            universities,
            gradYears,
            experience,
            githubActive,
            locations,
            salaryMin,
            salaryMax,
            availability,
        });
    };

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    // Close suggestions on outside click
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const suggestions = ALL_SKILLS.filter(s =>
        s.toLowerCase().includes(searchInput.toLowerCase()) && !searchSkills.includes(s)
    );

    const addSkill = (skill: string) => {
        if (!searchSkills.includes(skill)) setSearchSkills(prev => [...prev, skill]);
        setSearchInput("");
        setShowSuggestions(false);
    };

    const removeSkill = (skill: string) => setSearchSkills(prev => prev.filter(s => s !== skill));

    const toggleCheckbox = <T,>(arr: T[], val: T, setter: (v: T[]) => void) => {
        setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
    };

    const resetAll = () => {
        setSearchSkills([]);
        setNiceToHave([]);
        setUniversities([]);
        setGradYears([]);
        setExperience("");
        setGithubActive(false);
        setLocations([]);
        setSalaryMin(0);
        setSalaryMax(150);
        setAvailability([]);
        doSearch(); // re-fetch with no filters
    };

    // Client-side filter + sort on top of what the backend returned.
    // Provides an accurate secondary filter since backend data format may vary.
    const filtered = useMemo(() => {
        let list = candidates.filter(c => {
            const skillNames = c.skills.map(s => s.name.toLowerCase());
            if (searchSkills.length &&
                !searchSkills.every(s => skillNames.includes(s.toLowerCase()))) return false;
            if (universities.length) {
                const hasSelectedOther = universities.includes("Other");
                // A candidate matches "Other" if their university is missing OR if it doesn't match any of the known names
                const isOther = !c.university || !UNIVERSITIES.filter(u => u !== "Other").some(u =>
                    c.university.toLowerCase().includes(u.toLowerCase())
                );

                const matchesKnown = universities.filter(u => u !== "Other").some(u =>
                    c.university && c.university.toLowerCase().includes(u.toLowerCase())
                );

                if (!(matchesKnown || (hasSelectedOther && isOther))) return false;
            }
            if (gradYears.length && !gradYears.includes(c.graduatingYear)) return false;
            if (experience && c.experience !== experience) return false;
            if (githubActive && (!c.github || !c.github.active)) return false;
            if (locations.length) {
                const locLower = c.location.toLowerCase();
                const anyMatch = locations.some(l =>
                    l.toLowerCase() === "remote"
                        ? locLower.includes("remote")
                        : locLower.includes(l.toLowerCase())
                );
                if (!anyMatch) return false;
            }
            if ((c.salaryMin > 0 || c.salaryMax > 0) &&
                (c.salaryMin > salaryMax || c.salaryMax < salaryMin)) return false;
            if (availability.length && !availability.includes(c.availabilityStatus)) return false;
            return true;
        });

        // Calculate dynamic match score including nice-to-haves
        const listWithScores = list.map(c => {
            let dynamicScore = c.matchScore;
            
            // Add bonus for nice-to-have skills
            if (niceToHave.length > 0) {
                const skillNames = c.skills.map(s => s.name.toLowerCase());
                const matchCount = niceToHave.filter(nth => skillNames.includes(nth.toLowerCase())).length;
                if (matchCount > 0) {
                    // Up to 15% bonus for nice-to-have skills, proportional to how many they have
                    const bonus = Math.round((matchCount / niceToHave.length) * 15);
                    dynamicScore = Math.min(100, dynamicScore + bonus);
                }
            }
            
            return { ...c, dynamicMatchScore: dynamicScore };
        });

        // Sort using the dynamic score
        let sorted = listWithScores;
        if (sortBy === "match") sorted = [...sorted].sort((a, b) => b.dynamicMatchScore - a.dynamicMatchScore);
        else if (sortBy === "score") sorted = [...sorted].sort((a, b) => b.overallScore - a.overallScore);
        else sorted = [...sorted].sort((a, b) => (b.graduatingYear ?? 0) - (a.graduatingYear ?? 0));

        return sorted;
    }, [candidates, searchSkills, niceToHave, universities, gradYears, experience, githubActive, locations, salaryMin, salaryMax, availability, sortBy]);







    const toggleSave = (id: string) => {
        setCandidates(prev => prev.map(c =>
            c.id === id ? { ...c, saved: !c.saved } : c
        ));
        const c = candidates.find(x => x.id === id);
        showToast(c?.saved ? "Removed from Talent Pool" : `${c?.name} saved to Talent Pool`);
    };

    const messageCandidate = (id: string) => {
        setMessageTarget({ id });
    };

    const inviteCandidate = (id: string) => {
        const c = candidates.find(x => x.id === id);
        const name = c?.name.split(" ")[0] || "there";
        const recruiterName = user?.fullName || "Recruiter";
        setMessageTarget({ 
            id, 
            initialMessage: `Hi ${name},\n\nWe are extremely impressed by your profile and would like to officially invite you to apply for an open role at our company. We believe your skills would be a perfect fit.\n\nPlease let me know if you are interested in learning more about the position!\n\nBest regards,\n${recruiterName}` 
        });
    };

    const LOCS = ["Colombo", "Kandy", "Galle", "Remote"];
    const AVAIL = ["Immediate", "1 month notice", "2+ months notice"];
    const NICE = ["Docker", "AWS", "Kubernetes", "Redis", "GraphQL", "Java", "Go"];
    const GRAD_YEARS = [2024, 2025, 2026, 2027];
    const EXP_OPTIONS = [
        { value: "Fresh", label: "Fresh Graduate" },
        { value: "<2yr", label: "< 2 years" },
        { value: "2-5yr", label: "2–5 years" },
        { value: "5+yr", label: "5+ years" },
    ];

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Initial load spinner (only shown before first data arrives) */}
            {loading && candidates.length === 0 && <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}
            {error && candidates.length === 0 && <div className="text-center py-12 text-red-500">Failed to load talent. <button onClick={() => doSearch()} className="underline">Retry</button></div>}
            {(candidates.length > 0 || (!loading && !error)) && (<>
                {/* ── Page Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Find a Talent</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Proactively search for candidates by skills, university, and more</p>
                    </div>
                    {savedSearches.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <BookmarkPlus size={13} />
                            {savedSearches.length} saved search{savedSearches.length !== 1 ? "es" : ""}
                        </div>
                    )}
                </div>

                {/* ── Skill Search Bar ── */}
                <div className="relative bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3" ref={searchRef}>
                    <div className="flex flex-wrap items-center gap-2">
                        <Search size={16} className="text-gray-400 flex-shrink-0" />
                        {searchSkills.map(s => (
                            <span key={s} className="flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                {s}
                                <button onClick={() => removeSkill(s)} className="hover:bg-blue-500 rounded-full p-0.5">
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                        <input
                            className="flex-1 min-w-[160px] outline-none text-sm text-gray-700 placeholder-gray-400"
                            placeholder={searchSkills.length ? "Add more skills..." : "Search by skills (e.g. Python, React, Node.js)..."}
                            value={searchInput}
                            onChange={e => { setSearchInput(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => setShowSuggestions(true)}
                            onKeyDown={e => {
                                if (e.key === "Enter" && searchInput.trim()) addSkill(searchInput.trim());
                                if (e.key === "Backspace" && !searchInput && searchSkills.length) removeSkill(searchSkills[searchSkills.length - 1]);
                            }}
                        />
                        {(searchSkills.length > 0 || searchInput) && (
                            <button onClick={() => { setSearchSkills([]); setSearchInput(""); }} className="text-gray-400 hover:text-gray-600">
                                <X size={14} />
                            </button>
                        )}
                        <button
                            onClick={applyFilters}
                            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                            <Search size={12} /> Search
                        </button>
                    </div>

                    {/* Autocomplete */}
                    {showSuggestions && searchInput && suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 max-h-48 overflow-y-auto">
                            {suggestions.map(s => (
                                <button
                                    key={s}
                                    onMouseDown={() => addSkill(s)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                >
                                    <Plus size={12} className="text-gray-400" /> {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Main Layout ── */}
                <div className="flex gap-5 items-start">

                    {/* ── LEFT: Filters Sidebar (sticky) ── */}
                    <div className="w-56 flex-shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden sticky top-[92px] max-h-[calc(100vh-120px)] overflow-y-auto">
                        <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                                <SlidersHorizontal size={14} className="text-blue-600" /> Filters
                            </div>
                            <button onClick={resetAll} className="text-[11px] text-blue-600 hover:text-blue-800 font-medium">Reset</button>
                        </div>

                        <div className="px-4 divide-y divide-gray-100">
                            {/* Nice-to-Have Skills */}
                            <FilterSection title="Nice to Have">
                                {NICE.map(s => (
                                    <label key={s} className="flex items-center gap-2 py-1 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={niceToHave.includes(s)}
                                            onChange={() => toggleCheckbox(niceToHave, s, setNiceToHave)}
                                            className="accent-blue-600 w-3.5 h-3.5"
                                        />
                                        <span className="text-xs text-gray-600 group-hover:text-gray-900">{s}</span>
                                    </label>
                                ))}
                            </FilterSection>

                            {/* University */}
                            <FilterSection title="University">
                                {UNIVERSITIES.map(u => (
                                    <label key={u} className="flex items-center gap-2 py-1 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={universities.includes(u)}
                                            onChange={() => toggleCheckbox(universities, u, setUniversities)}
                                            className="accent-blue-600 w-3.5 h-3.5"
                                        />
                                        <span className="text-xs text-gray-600 group-hover:text-gray-900 leading-tight">{u}</span>
                                    </label>
                                ))}
                            </FilterSection>

                            {/* Grad Year */}
                            <FilterSection title="Graduation Year">
                                {GRAD_YEARS.map(y => (
                                    <label key={y} className="flex items-center gap-2 py-1 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={gradYears.includes(y)}
                                            onChange={() => toggleCheckbox(gradYears, y, setGradYears)}
                                            className="accent-blue-600 w-3.5 h-3.5"
                                        />
                                        <span className="text-xs text-gray-600 group-hover:text-gray-900">{y}</span>
                                    </label>
                                ))}
                            </FilterSection>

                            {/* Experience */}
                            <FilterSection title="Experience">
                                {EXP_OPTIONS.map(({ value, label }) => (
                                    <label key={value} className="flex items-center gap-2 py-1 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="experience"
                                            checked={experience === value}
                                            onChange={() => setExperience(experience === value ? "" : value)}
                                            className="accent-blue-600 w-3.5 h-3.5"
                                        />
                                        <span className="text-xs text-gray-600 group-hover:text-gray-900">{label}</span>
                                    </label>
                                ))}
                            </FilterSection>

                            {/* GitHub */}
                            <FilterSection title="GitHub Activity">
                                <label className="flex items-center gap-2 py-1 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={githubActive}
                                        onChange={() => setGithubActive(v => !v)}
                                        className="accent-blue-600 w-3.5 h-3.5"
                                    />
                                    <span className="text-xs text-gray-600 group-hover:text-gray-900">Active in last 6 months</span>
                                </label>
                            </FilterSection>

                            {/* Location */}
                            <FilterSection title="Location">
                                {LOCS.map(l => (
                                    <label key={l} className="flex items-center gap-2 py-1 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={locations.includes(l)}
                                            onChange={() => toggleCheckbox(locations, l, setLocations)}
                                            className="accent-blue-600 w-3.5 h-3.5"
                                        />
                                        <span className="text-xs text-gray-600 group-hover:text-gray-900">{l}</span>
                                    </label>
                                ))}
                            </FilterSection>

                            {/* Salary range */}
                            <FilterSection title="Expected Salary (LKR k)">
                                <div className="space-y-2 pb-1">
                                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                                        <span>{salaryMin}k</span>
                                        <span>{salaryMax}k</span>
                                    </div>
                                    <input
                                        type="range" min={0} max={150} value={salaryMin} step={5}
                                        onChange={e => setSalaryMin(Math.min(Number(e.target.value), salaryMax - 5))}
                                        className="w-full accent-blue-600"
                                    />
                                    <input
                                        type="range" min={0} max={150} value={salaryMax} step={5}
                                        onChange={e => setSalaryMax(Math.max(Number(e.target.value), salaryMin + 5))}
                                        className="w-full accent-blue-600"
                                    />
                                </div>
                            </FilterSection>

                            {/* Availability */}
                            <FilterSection title="Availability">
                                {AVAIL.map(a => (
                                    <label key={a} className="flex items-center gap-2 py-1 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={availability.includes(a)}
                                            onChange={() => toggleCheckbox(availability, a, setAvailability)}
                                            className="accent-blue-600 w-3.5 h-3.5"
                                        />
                                        <span className="text-xs text-gray-600 group-hover:text-gray-900">{a}</span>
                                    </label>
                                ))}
                            </FilterSection>
                        </div>

                        {/* Bottom actions */}
                        <div className="px-4 py-3 space-y-2 border-t border-gray-100">
                            <button
                                onClick={resetAll}
                                className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <RotateCcw size={12} /> Reset All Filters
                            </button>
                            <button
                                onClick={() => setShowSaveModal(true)}
                                className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                                <BookmarkPlus size={12} /> Save Search
                            </button>
                        </div>
                    </div>

                    {/* ── RIGHT: Candidate Results ── */}
                    <div className="flex-1 min-w-0">
                        {/* Results top bar */}
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-gray-700">
                                <span className="text-blue-700">{filtered.length}</span>{" "}
                                {filtered.length === 1 ? "candidate" : "candidates"} found
                            </p>
                            <div className="flex items-center gap-2">
                                <Filter size={13} className="text-gray-400" />
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={e => setSortBy(e.target.value as typeof sortBy)}
                                        className="appearance-none text-xs border border-gray-200 rounded-lg px-3 py-2 pr-7 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option value="match">Best Match</option>
                                        <option value="score">Highest Skill Score</option>
                                        <option value="recent">Most Recent</option>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                                <Users size={32} className="text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-500">No candidates match your filters</p>
                                <p className="text-xs text-gray-400 mt-1">Try removing some filters or broadening your skill search.</p>
                                <button onClick={resetAll} className="mt-4 px-4 py-2 text-xs font-semibold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map(c => (
                                    <CandidateCard key={c.id} candidate={c} onSave={toggleSave} onMessage={messageCandidate} onInvite={inviteCandidate} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Modals */}
                {showSaveModal && (
                    <SaveSearchModal
                        onClose={() => setShowSaveModal(false)}
                        onSave={name => { setSavedSearches(p => [...p, name]); showToast(`Search "${name}" saved!`); }}
                    />
                )}
                {messageTarget && (
                    <MessageModal
                        candidateId={messageTarget.id}
                        candidateName={candidates.find(c => c.id === messageTarget.id)?.name || ""}
                        candidateEmail={candidates.find(c => c.id === messageTarget.id)?.email || ""}
                        initialMessage={messageTarget.initialMessage}
                        onClose={() => setMessageTarget(null)}
                        onSuccess={(msg) => showToast(msg)}
                    />
                )}

                {/* Toast */}
                {toast && (
                    <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-xl flex items-center gap-2">
                        <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
                        {toast}
                    </div>
                )}
            </>)}
        </div>
    );
}
