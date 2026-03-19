"use client";

import { useState, useRef, useEffect } from "react";
import {
    Search, Send, Plus, X, ChevronDown, Check, CheckCheck,
    User, Calendar, FileText, ExternalLink,
    Archive, Filter,
} from "lucide-react";
import { RecruiterConversation, RecruiterMessage, RecruiterFilterTab } from "@/types/recruiter";
import { useApi } from "@/lib/hooks/useApi";
import { getRecruiterConversations, sendRecruiterMessage, createConversation as createConversationApi, archiveConversation, searchTalent, markRecruiterConversationRead } from "@/lib/api/recruiter-api";
import { api } from "@/lib/api/client";

// ─── Local type aliases ────────────────────────────────────────────────────────

type FilterTab = RecruiterFilterTab;
type Message = RecruiterMessage;
type Conversation = RecruiterConversation;

// ─── Message templates ─────────────────────────────────────────────────────────

const TEMPLATES = [
    { id: "t1", label: "Application Received", text: "Hi {name}, we've received your application and are reviewing it. We'll be in touch within 3–5 business days." },
    { id: "t2", label: "Interview Invitation", text: "Hi {name}, we'd like to invite you for a technical interview for the {role} position. Are you available next week?" },
    { id: "t3", label: "Interview Confirmation", text: "Hi {name}, confirming your interview on {date}. Please have your GitHub profile ready and expect a coding exercise." },
    { id: "t4", label: "Request More Information", text: "Hi {name}, could you share more details about your experience with {skill}? It would help us assess your fit better." },
    { id: "t5", label: "Interview Rescheduling", text: "Hi {name}, we need to reschedule your interview. Could you suggest a few times that work for you next week?" },
    { id: "t6", label: "Polite Rejection", text: "Hi {name}, thank you for your time. After careful consideration we've decided to move forward with other candidates. We'll keep your profile for future openings." },
    { id: "t7", label: "Keep in Touch", text: "Hi {name}, we don't have an immediate opening but your profile is impressive. We'll reach out when a suitable role comes up." },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function unreadCount(conv: Conversation) {
    return conv.messages.filter((m) => m.sender === "candidate" && !m.read).length;
}

function lastMessage(conv: Conversation) {
    return conv.messages[conv.messages.length - 1];
}

function parseDate(ts: any) {
    if (!ts) return new Date();
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d;
    if (typeof ts === 'string' && /^\d{1,2}:\d{2}$/.test(ts)) {
        const now = new Date();
        const [h, m] = ts.split(':').map(Number);
        now.setHours(h, m, 0, 0);
        return now;
    }
    return new Date();
}

function relativeTime(ms: number | string) {
    const timestamp = typeof ms === 'number' ? ms : parseDate(ms).getTime();
    const diff = Date.now() - timestamp;
    if (diff < 1000 * 60 * 60) return `${Math.max(1, Math.round(diff / 60000))}m ago`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.max(1, Math.round(diff / 3600000))}h ago`;
    return `${Math.max(1, Math.round(diff / 86400000))}d ago`;
}

// ─── Conversation Card ─────────────────────────────────────────────────────────

function ConvCard({
    conv, isActive, onClick,
}: { conv: Conversation; isActive: boolean; onClick: () => void }) {
    const last = lastMessage(conv);
    const unread = unreadCount(conv);

    return (
        <button
            onClick={onClick}
            className={`w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors border-b border-gray-100 last:border-0 ${isActive ? "bg-blue-50 border-l-2 border-l-blue-600" : "hover:bg-gray-50 border-l-2 border-l-transparent"
                }`}
        >
            {/* Avatar */}
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5"
                style={{ background: conv.avatarColor }}
            >
                {conv.initials}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[13px] truncate ${unread > 0 ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                        {conv.candidateName}
                    </span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                        {relativeTime(conv.lastMessageAt)}
                    </span>
                </div>
                <p className="text-[11px] text-blue-600 font-medium truncate mb-0.5">{conv.jobTitle}</p>
                <div className="flex items-center justify-between">
                    <p className="text-[11px] text-gray-500 truncate max-w-[140px]">
                        {last.sender === "recruiter" ? <span className="text-gray-400">You: </span> : null}
                        {last.text}
                    </p>
                    {unread > 0 && (
                        <span className="ml-1 w-4.5 h-4.5 min-w-[18px] bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0 px-1">
                            {unread}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, initials, color }: { msg: Message; initials: string; color: string }) {
    const isMine = msg.sender === "recruiter";

    return (
        <div className={`flex items-end gap-2.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            {!isMine ? (
                <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 mb-0.5"
                    style={{ background: color }}
                >
                    {initials}
                </div>
            ) : (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-[10px] flex-shrink-0 mb-0.5">
                    SJ
                </div>
            )}

            {/* Bubble */}
            <div className={`max-w-[66%] space-y-1 ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                {!msg.read && msg.sender === "candidate" && (
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider px-1">New</span>
                )}
                <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                        }`}
                >
                    {msg.text}
                </div>
                <div className={`flex items-center gap-1 px-1 ${isMine ? "flex-row-reverse" : ""}`}>
                    <span className="text-[10px] text-gray-400">{parseDate(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                    {isMine && (
                        <CheckCheck size={11} className={msg.read ? "text-blue-500" : "text-gray-400"} />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── New Message Modal ─────────────────────────────────────────────────────────

function NewMessageModal({ onClose, onSent, candidates }: { onClose: () => void; onSent: () => void; candidates: { id: string; name: string; initials: string; color: string; jobTitle: string; email: string }[] }) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<{ id: string; email: string; name: string } | null>(null);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);

    const filtered = candidates.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

    const handleSend = async () => {
        if (!selected || !text.trim()) return;
        setSending(true);
        try {
            await createConversationApi({ candidateEmail: selected.email, text: text.trim(), jobTitle: "Direct Message" });
            onSent();
            onClose();
        } catch (e) {
            console.error("Failed to create conversation", e);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900">New Message</h3>
                    <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                        <X size={15} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Candidate search */}
                    <div>
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">To</label>
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search candidates..."
                                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        {search && (
                            <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                {filtered.length === 0 ? (
                                    <p className="px-3 py-2.5 text-xs text-gray-400">No candidates found</p>
                                ) : (
                                    filtered.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => { setSelected({ id: c.id, email: c.email, name: c.name }); setSearch(c.name); }}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors text-sm ${selected?.id === c.id ? "bg-blue-50" : ""}`}
                                        >
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: c.color }}>{c.initials}</div>
                                            <div>
                                                <p className="font-medium text-gray-900">{c.name}</p>
                                                <p className="text-[11px] text-gray-500">{c.jobTitle}</p>
                                            </div>
                                            {selected?.id === c.id && <Check size={13} className="ml-auto text-blue-600" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    <div>
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Message</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={4}
                            placeholder="Type your message..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-2 px-5 pb-5">
                    <button onClick={onClose} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!selected || !text.trim() || sending}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Send size={13} /> {sending ? "Sending..." : "Send Message"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
    const { data: fetchedConversations, loading, error, refetch } = useApi<Conversation[]>(() => getRecruiterConversations(), []);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string>("");
    const [filter, setFilter] = useState<FilterTab>("all");
    const [search, setSearch] = useState("");
    const [draft, setDraft] = useState("");
    const [showTemplates, setShowTemplates] = useState(false);
    const [showNewMessage, setShowNewMessage] = useState(false);
    const threadRef = useRef<HTMLDivElement>(null);
    const templateRef = useRef<HTMLDivElement>(null);

    // Candidate list for new message modal — fetch from talent search
    const [talentList, setTalentList] = useState<{ id: string; name: string; initials: string; color: string; jobTitle: string; email: string }[]>([]);
    useEffect(() => {
        searchTalent({ limit: 50 }).then(res => {
            if (res?.candidates) {
                setTalentList(res.candidates.map((c: { id: string; name: string; major: string; email: string }) => ({
                    id: c.id,
                    name: c.name,
                    initials: c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
                    color: `hsl(${(c.name.charCodeAt(0) * 37) % 360}, 50%, 45%)`,
                    jobTitle: c.major || "Candidate",
                    email: c.email,
                })));
            }
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (fetchedConversations) {
            setConversations(fetchedConversations);
            if (!activeId && fetchedConversations.length > 0) setActiveId(fetchedConversations[0].id);
        }
    }, [fetchedConversations]);

    const active = conversations.find((c) => c.id === activeId);

    // Scroll thread to bottom when conversation changes or new message arrives
    useEffect(() => {
        if (threadRef.current) {
            threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
    }, [activeId, conversations]);

    // Close template dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
                setShowTemplates(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Loading / error guards
    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
    if (error) return <div className="text-center py-12 text-red-500">Failed to load messages. <button onClick={refetch} className="underline">Retry</button></div>;

    // Mark messages as read when conversation opened
    const openConversation = (id: string) => {
        setActiveId(id);
        setConversations((prev) =>
            prev.map((c) =>
                c.id === id
                    ? { ...c, messages: c.messages.map((m) => m.sender === "candidate" ? { ...m, read: true } : m) }
                    : c
            )
        );
        void markRecruiterConversationRead(id);
    };

    // Send a message
    const sendMessage = async () => {
        if (!draft.trim() || !active) return;
        const trimmed = draft.trim();
        setDraft("");
        // Optimistic update
        const newMsg: Message = {
            id: `msg-${Date.now()}`,
            sender: "recruiter",
            text: trimmed,
            timestamp: "Just now",
            timestampMs: Date.now(),
            read: true,
        };
        setConversations((prev) =>
            prev.map((c) =>
                c.id === activeId
                    ? { ...c, messages: [...c.messages, newMsg], lastMessageAt: Date.now() }
                    : c
            )
        );
        try {
            await sendRecruiterMessage(activeId, trimmed);
        } catch (e) {
            console.error("Failed to send message", e);
        }
    };

    // Apply template
    const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
        if (!active) return;
        const text = tpl.text
            .replace("{name}", active.candidateName.split(" ")[0])
            .replace("{role}", active.jobTitle)
            .replace("{skill}", "React")
            .replace("{date}", "Monday at 2 PM");
        setDraft(text);
        setShowTemplates(false);
    };

    // Filtered conversations
    const visibleConvs = conversations.filter((c) => {
        if (filter === "unread") return !c.archived && unreadCount(c) > 0;
        if (filter === "archived") return c.archived;
        return !c.archived;
    }).filter((c) => c.candidateName.toLowerCase().includes(search.toLowerCase()));

    const totalUnread = conversations.filter((c) => !c.archived).reduce((sum, c) => sum + unreadCount(c), 0);


    // Archive handler
    const handleArchive = async (convId: string) => {
        try {
            await archiveConversation(convId);
            setConversations(prev => prev.map(c => c.id === convId ? { ...c, archived: !c.archived } : c));
        } catch (e) {
            console.error("Failed to archive", e);
        }
    };

    return (
        <>
            {/* ── Full-height 2-panel layout ─────────────────────────────────── */}
            <div className="flex flex-col h-[calc(100vh-76px)] -m-6 md:-m-8">

                {/* Page title bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold text-gray-900">Messages</h1>
                        {totalUnread > 0 && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded-full">
                                {totalUnread} unread
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setShowNewMessage(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                    >
                        <Plus size={13} /> New Message
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── LEFT: Conversation list ───────────────────────────────── */}
                    <aside className="w-[300px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">

                        {/* Search */}
                        <div className="px-3 pt-3 pb-2 flex-shrink-0">
                            <div className="relative">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search conversations..."
                                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {/* Filter tabs */}
                        <div className="flex border-b border-gray-100 px-3 flex-shrink-0">
                            {([
                                { key: "all", label: "All" },
                                { key: "unread", label: "Unread", count: totalUnread },
                                { key: "archived", label: "Archived" },
                            ] as const).map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key)}
                                    className={`flex items-center gap-1 text-[11px] font-semibold pb-2 pt-1 mr-4 border-b-2 transition-colors ${filter === tab.key
                                        ? "border-blue-600 text-blue-700"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {tab.label}
                                    {"count" in tab && tab.count! > 0 && (
                                        <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-1 rounded-full">{tab.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Conversation list */}
                        <div className="flex-1 overflow-y-auto">
                            {visibleConvs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                    <Filter size={24} className="text-gray-300 mb-2" />
                                    <p className="text-xs text-gray-400">No conversations found</p>
                                </div>
                            ) : (
                                visibleConvs
                                    .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
                                    .map((conv) => (
                                        <ConvCard
                                            key={conv.id}
                                            conv={conv}
                                            isActive={conv.id === activeId}
                                            onClick={() => openConversation(conv.id)}
                                        />
                                    ))
                            )}
                        </div>
                    </aside>

                    {/* ── RIGHT: Active conversation ─────────────────────────────── */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F7FA]">

                        {active ? (
                            <>
                                {/* Chat header */}
                                <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-200 flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                            style={{ background: active.avatarColor }}
                                        >
                                            {active.initials}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{active.candidateName}</p>
                                            <p className="text-[11px] text-blue-600 font-medium">{active.jobTitle} · Applied</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-blue-700 border border-gray-200 rounded px-2 py-1 bg-white hover:border-blue-300 transition-colors">
                                            <FileText size={11} /> Application
                                        </button>
                                        <button className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-blue-700 border border-gray-200 rounded px-2 py-1 bg-white hover:border-blue-300 transition-colors">
                                            <User size={11} /> Profile <ExternalLink size={9} />
                                        </button>
                                    </div>
                                </div>

                                {/* Message thread */}
                                <div
                                    ref={threadRef}
                                    className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
                                >
                                    {active.messages.map((msg) => (
                                        <MessageBubble
                                            key={msg.id}
                                            msg={msg}
                                            initials={active.initials}
                                            color={active.avatarColor}
                                        />
                                    ))}
                                </div>

                                {/* Composer */}
                                <div className="border-t border-gray-200 bg-white px-5 pt-3.5 pb-4 flex-shrink-0">
                                    <textarea
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendMessage();
                                        }}
                                        placeholder={`Message ${active.candidateName.split(" ")[0]}...`}
                                        rows={3}
                                        className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none outline-none bg-transparent leading-relaxed"
                                    />
                                    <div className="flex items-center justify-between mt-2 pt-2.5 border-t border-gray-100">
                                        {/* Template picker */}
                                        <div className="relative" ref={templateRef}>
                                            <button
                                                onClick={() => setShowTemplates((v) => !v)}
                                                className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-blue-700 border border-gray-200 rounded px-2.5 py-1.5 bg-white hover:border-blue-300 transition-colors font-medium"
                                            >
                                                <FileText size={11} /> Use Template <ChevronDown size={10} className={`transition-transform ${showTemplates ? "rotate-180" : ""}`} />
                                            </button>

                                            {showTemplates && (
                                                <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-xl shadow-xl z-20 w-64 overflow-hidden">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1.5">Select a template</p>
                                                    {TEMPLATES.map((tpl) => (
                                                        <button
                                                            key={tpl.id}
                                                            onClick={() => applyTemplate(tpl)}
                                                            className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-t border-gray-50 first:border-0"
                                                        >
                                                            {tpl.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Send */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400 hidden sm:block">Ctrl+Enter to send</span>
                                            <button
                                                onClick={sendMessage}
                                                disabled={!draft.trim()}
                                                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <Send size={12} /> Send
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="border-t border-gray-200 bg-white px-5 py-3 flex items-center gap-2 flex-shrink-0">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Quick:</span>
                                    <button className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-blue-700 border border-gray-200 rounded px-2.5 py-1 hover:border-blue-300 bg-white transition-colors">
                                        <FileText size={11} /> View Application
                                    </button>
                                    <button className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-blue-700 border border-gray-200 rounded px-2.5 py-1 hover:border-blue-300 bg-white transition-colors">
                                        <User size={11} /> Full Profile
                                    </button>
                                    <button className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-blue-700 border border-gray-200 rounded px-2.5 py-1 hover:border-blue-300 bg-white transition-colors">
                                        <Calendar size={11} /> Schedule Interview
                                    </button>
                                    <button className="ml-auto flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2.5 py-1 hover:border-gray-300 bg-white transition-colors">
                                        <Archive size={11} /> Archive
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-sm text-gray-400">Select a conversation to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── New Message Modal ── */}
            {showNewMessage && (
                <NewMessageModal
                    onClose={() => setShowNewMessage(false)}
                    onSent={refetch}
                    candidates={talentList}
                />
            )}
        </>
    );
}
