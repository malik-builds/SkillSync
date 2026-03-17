"use client";

import { useState } from "react";
import {
    User, Bell, Users, Check, X, Plus,
    Eye, EyeOff, Shield, Trash2,
    Mail, Send, Crown, Database,
    Download, GraduationCap, Building2,
} from "lucide-react";
import { UniTeamMember, UniPendingInvite } from "@/types/university";
import { useApi } from "@/lib/hooks/useApi";
import { getUniversityTeam } from "@/lib/api/university-api";

type Tab = "account" | "team" | "notifications" | "data";
type TeamMember = UniTeamMember;
type PendingInvite = UniPendingInvite;

// ─── Shared UI ─────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${checked ? "bg-blue-600" : "bg-gray-200"}`}
        >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-1"}`} />
        </button>
    );
}

const ROLE_COLORS: Record<string, string> = {
    Owner: "bg-amber-50 text-amber-700 border-amber-200",
    Admin: "bg-blue-50 text-blue-700 border-blue-200",
    "Department Head": "bg-violet-50 text-violet-700 border-violet-200",
    "View Only": "bg-gray-100 text-gray-600 border-gray-200",
};

function RoleBadge({ role }: { role: string }) {
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[role] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {role}
        </span>
    );
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-stone-50/40">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                {desc && <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─── Invite Modal ──────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("View Only");
    const [sent, setSent] = useState(false);

    const handleSend = () => {
        if (!email.trim()) return;
        setSent(true);
        setTimeout(() => { setSent(false); onClose(); }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900">Invite Team Member</h3>
                    <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><X size={14} /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Institutional Email</label>
                        <div className="relative">
                            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@colombo.ac.lk"
                                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                            {["Admin", "Department Head", "View Only"].map((r) => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <p className="text-[11px] text-gray-400">They&apos;ll receive an email invitation to access your university analytics workspace.</p>
                </div>
                <div className="flex gap-2 px-5 pb-5">
                    <button onClick={onClose} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-stone-50 transition-colors">Cancel</button>
                    <button onClick={handleSend} disabled={!email.trim()}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${sent ? "bg-green-600 text-white" : "bg-blue-700 hover:bg-blue-800 text-white"}`}>
                        {sent ? <><Check size={12} /> Sent!</> : <><Send size={12} /> Send Invite</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Tab: Account ──────────────────────────────────────────────────────────────

function AccountTab() {
    const [showPw, setShowPw] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

    return (
        <div className="space-y-4">

            {/* Institution info (read-only) */}
            <Card title="Institution" desc="Your university account details">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-700 flex items-center justify-center flex-shrink-0">
                        <GraduationCap size={22} className="text-white" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 flex-1">
                        {[
                            { label: "University", value: "University of Colombo" },
                            { label: "Account Type", value: "Institutional Admin" },
                            { label: "Faculty", value: "Faculty of Science" },
                            { label: "Accreditation ID", value: "UGC-COL-2024-0841" },
                        ].map((f) => (
                            <div key={f.label}>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{f.label}</p>
                                <p className="text-sm font-medium text-gray-900 mt-0.5">{f.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-gray-100">
                    To update institutional details, contact SkillSync support or your account manager.
                </p>
            </Card>

            {/* Personal info */}
            <Card title="Personal Information" desc="Your details as the account administrator">
                <div className="grid sm:grid-cols-2 gap-4">
                    {[
                        { label: "Full Name", value: "Dr. Amal Perera", placeholder: "Full name" },
                        { label: "Title / Role", value: "Head of Analytics", placeholder: "Your role" },
                        { label: "Department", value: "Department of Computer Science", placeholder: "Department" },
                        { label: "Phone", value: "+94 11 258 9301", placeholder: "+94..." },
                    ].map((f) => (
                        <div key={f.label}>
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                            <input defaultValue={f.value} placeholder={f.placeholder}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" />
                        </div>
                    ))}
                </div>
            </Card>

            {/* Email */}
            <Card title="Email Address" desc="Used for login and institutional notifications">
                <div className="flex items-center gap-3">
                    <input defaultValue="analytics@colombo.ac.lk"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" />
                    <button className="flex-shrink-0 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-stone-50 transition-colors">
                        Verify &amp; Update
                    </button>
                </div>
            </Card>

            {/* Password */}
            <Card title="Password" desc="Choose a strong, unique password">
                <div className="grid sm:grid-cols-2 gap-4">
                    {["Current Password", "New Password", "Confirm New Password"].map((l) => (
                        <div key={l} className={l === "Current Password" ? "sm:col-span-2" : ""}>
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{l}</label>
                            <div className="relative">
                                <input type={showPw ? "text" : "password"} placeholder="••••••••"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                <button onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Danger zone */}
            <Card title="Danger Zone">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-red-700">Deactivate Account</p>
                        <p className="text-xs text-gray-500 mt-0.5">Temporarily suspend this university analytics account. Data will be retained for 90 days.</p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors">
                        <Trash2 size={12} /> Deactivate
                    </button>
                </div>
            </Card>

            <div className="flex justify-end">
                <button onClick={handleSave}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${saved ? "bg-green-600 text-white" : "bg-blue-700 hover:bg-blue-800 text-white shadow-sm"}`}>
                    {saved ? <><Check size={13} /> Saved!</> : "Save Changes"}
                </button>
            </div>
        </div>
    );
}

// ─── Tab: Team ─────────────────────────────────────────────────────────────────

function TeamTab() {
    const { data: teamData } = useApi<{ members: TeamMember[]; invites: PendingInvite[] }>(getUniversityTeam);
    const members = teamData?.members ?? [];
    const invites = teamData?.invites ?? [];
    const [showInvite, setShowInvite] = useState(false);

    return (
        <>
            <div className="space-y-4">
                <Card title={`Active Users (${members.length})`} desc="People who can access the university analytics workspace">
                    <div className="divide-y divide-gray-50">
                        {members.map((m) => (
                            <div key={m.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                    style={{ background: m.avatarColor }}>
                                    {m.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                                        {m.isYou && <span className="text-[10px] font-bold text-gray-400">(You)</span>}
                                        {m.role === "Owner" && <Crown size={11} className="text-amber-500" />}
                                    </div>
                                    <p className="text-[11px] text-gray-500">{m.department} · {m.email} · Joined {m.joinedDate}</p>
                                </div>
                                <RoleBadge role={m.role} />
                                {!m.isYou && (
                                    <div className="flex items-center gap-1 ml-2">
                                        <button className="text-xs text-gray-500 hover:text-blue-700 border border-gray-200 rounded px-2 py-1 transition-colors hover:border-blue-300">Edit</button>
                                        <button className="text-xs text-gray-500 hover:text-red-700 border border-gray-200 rounded px-2 py-1 transition-colors hover:border-red-300">Remove</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="pt-3 border-t border-gray-100 mt-1">
                        <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors">
                            <Plus size={13} /> Invite a team member
                        </button>
                    </div>
                </Card>

                {invites.length > 0 && (
                    <Card title={`Pending Invitations (${invites.length})`} desc="Invitations sent but not yet accepted">
                        <div className="divide-y divide-gray-50">
                            {invites.map((inv) => (
                                <div key={inv.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Mail size={14} className="text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800 font-medium">{inv.email}</p>
                                        <p className="text-[11px] text-gray-400">Sent {inv.sentDate} · {inv.role}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button className="text-xs text-gray-500 hover:text-blue-700 border border-gray-200 rounded px-2 py-1 transition-colors">Resend</button>
                                        <button className="text-xs text-gray-500 hover:text-red-700 border border-gray-200 rounded px-2 py-1 transition-colors">Cancel</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Role permissions */}
                <Card title="Role Permissions" desc="What each role can access in the workspace">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            { role: "Owner", can: ["Full access to everything", "Manage team & roles", "Delete workspace data", "Billing & account settings"], color: "border-amber-200 bg-amber-50/50" },
                            { role: "Admin", can: ["View all dashboards", "Manage curriculum data", "Log interventions", "Invite team members"], color: "border-blue-200 bg-blue-50/50" },
                            { role: "Department Head", can: ["View programme data", "Log interventions", "Export department reports"], color: "border-violet-200 bg-violet-50/50" },
                            { role: "View Only", can: ["View dashboards", "Download reports", "No edit permissions"], color: "border-gray-200 bg-gray-50/50" },
                        ].map((p) => (
                            <div key={p.role} className={`border rounded-lg p-3.5 ${p.color}`}>
                                <div className="mb-2.5"><RoleBadge role={p.role} /></div>
                                <ul className="space-y-1.5">
                                    {p.can.map((c) => (
                                        <li key={c} className="flex items-start gap-1.5 text-[11px] text-gray-700">
                                            <Check size={10} className="text-green-600 flex-shrink-0 mt-0.5" /> {c}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
        </>
    );
}

// ─── Tab: Notifications ────────────────────────────────────────────────────────

function NotificationsTab() {
    const [prefs, setPrefs] = useState({
        weeklySummary: true,
        criticalGaps: true,
        placementDrops: true,
        interventionLogged: true,
        teamActivity: false,
        reportReady: true,
        systemAlerts: true,
        newTrends: false,
    });

    const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));
    const [saved, setSaved] = useState(false);
    const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

    const emailRows = [
        { key: "weeklySummary" as const, label: "Weekly analytics summary", desc: "Recap of key metrics every Monday morning" },
        { key: "criticalGaps" as const, label: "Critical curriculum gaps detected", desc: "When a skill gap exceeds 50% between student coverage and market demand" },
        { key: "placementDrops" as const, label: "Placement rate alerts", desc: "Triggered when any programme's placement rate drops more than 5%" },
        { key: "interventionLogged" as const, label: "New intervention logged by team", desc: "When a team member logs a curriculum change or workshop" },
        { key: "teamActivity" as const, label: "Team activity digest", desc: "Summary of team actions in the workspace (daily)" },
    ];

    const appRows = [
        { key: "reportReady" as const, label: "Report generation complete", desc: "When a scheduled or custom report is ready to download" },
        { key: "systemAlerts" as const, label: "System & data updates", desc: "Platform maintenance, data refresh cycles, new features" },
        { key: "newTrends" as const, label: "Industry trend changes", desc: "When new skills enter the top-20 demand list" },
    ];

    return (
        <div className="space-y-4">
            <Card title="Email Notifications" desc="Delivered to analytics@colombo.ac.lk">
                <div className="divide-y divide-gray-50">
                    {emailRows.map((r) => (
                        <div key={r.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{r.label}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{r.desc}</p>
                            </div>
                            <Toggle checked={prefs[r.key]} onChange={() => toggle(r.key)} />
                        </div>
                    ))}
                </div>
            </Card>

            <Card title="In-App Notifications" desc="Alerts shown within the SkillSync dashboard">
                <div className="divide-y divide-gray-50">
                    {appRows.map((r) => (
                        <div key={r.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{r.label}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{r.desc}</p>
                            </div>
                            <Toggle checked={prefs[r.key]} onChange={() => toggle(r.key)} />
                        </div>
                    ))}
                </div>
            </Card>

            <div className="flex justify-end">
                <button onClick={save}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${saved ? "bg-green-600 text-white" : "bg-blue-700 hover:bg-blue-800 text-white shadow-sm"}`}>
                    {saved ? <><Check size={13} /> Saved!</> : "Save Preferences"}
                </button>
            </div>
        </div>
    );
}

// ─── Tab: Data & Privacy ───────────────────────────────────────────────────────

function DataPrivacyTab() {
    const [anonymize, setAnonymize] = useState(true);
    const [optOut, setOptOut] = useState(true);
    const [saved, setSaved] = useState(false);
    const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

    return (
        <div className="space-y-4">

            {/* Data export */}
            <Card title="Data Export" desc="Download analytics data for reporting or accreditation">
                <div className="grid sm:grid-cols-2 gap-3">
                    {[
                        { label: "Placement Report", desc: "Graduate employment outcomes (PDF)", icon: Download },
                        { label: "Curriculum Gap Data", desc: "Skill coverage vs market demand (CSV)", icon: Download },
                        { label: "Student Analytics Summary", desc: "Aggregate engagement metrics (PDF)", icon: Download },
                        { label: "Accreditation Package", desc: "Combined report for institutional review (PDF)", icon: Download },
                    ].map((item) => (
                        <button key={item.label}
                            className="flex items-center gap-3 p-3.5 border border-gray-200 rounded-lg hover:bg-stone-50 transition-colors text-left group">
                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                                <item.icon size={15} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                                <p className="text-[11px] text-gray-500">{item.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            {/* Student data privacy */}
            <Card title="Student Data Privacy" desc="How student information is handled in analytics">
                <div className="divide-y divide-gray-50">
                    <div className="flex items-center justify-between py-3.5 first:pt-0">
                        <div>
                            <p className="text-sm font-medium text-gray-900">Anonymize all student data</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Individual student names are never shown. All metrics are aggregated across cohorts.</p>
                        </div>
                        <Toggle checked={anonymize} onChange={setAnonymize} />
                    </div>
                    <div className="flex items-center justify-between py-3.5 last:pb-0">
                        <div>
                            <p className="text-sm font-medium text-gray-900">Honor student opt-out requests</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Exclude students who have opted out from aggregate analytics calculations.</p>
                        </div>
                        <Toggle checked={optOut} onChange={setOptOut} />
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                    <Shield size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                        SkillSync complies with Sri Lanka&apos;s Personal Data Protection Act (PDPA). All student data is encrypted at rest and in transit.
                        Individual records are never accessible to university admins — only aggregated, anonymised metrics are displayed.
                    </p>
                </div>
            </Card>

            {/* Data retention */}
            <Card title="Data Retention" desc="How long analytics data is stored">
                <div className="grid sm:grid-cols-3 gap-3">
                    {[
                        { label: "Active Student Data", period: "Duration of enrolment + 2 years", detail: "Automatically purged after retention period" },
                        { label: "Placement Records", period: "5 years post-graduation", detail: "Required for accreditation audit trail" },
                        { label: "Analytics Snapshots", period: "3 years rolling", detail: "Historical dashboards for trend analysis" },
                    ].map((item) => (
                        <div key={item.label} className="border border-gray-200 rounded-lg p-3.5">
                            <p className="text-xs font-bold text-gray-900">{item.label}</p>
                            <p className="text-sm font-semibold text-blue-700 mt-1">{item.period}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{item.detail}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Integrations */}
            <Card title="Integrations" desc="Connected systems and data sources">
                <div className="divide-y divide-gray-50">
                    {[
                        { name: "Student Information System (SIS)", status: "Connected", statusColor: "bg-green-50 text-green-700 border-green-200", detail: "Last sync: 2 hours ago · 1,247 student records" },
                        { name: "Learning Management System (LMS)", status: "Connected", statusColor: "bg-green-50 text-green-700 border-green-200", detail: "Moodle · Last sync: 6 hours ago" },
                        { name: "LinkedIn Tracking", status: "Active", statusColor: "bg-green-50 text-green-700 border-green-200", detail: "Graduate employment verification · 89% response rate" },
                        { name: "Job Portal API", status: "Not Connected", statusColor: "bg-gray-100 text-gray-500 border-gray-200", detail: "Connect to import real-time job market data" },
                    ].map((item) => (
                        <div key={item.name} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <Building2 size={15} className="text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                    <p className="text-[11px] text-gray-500">{item.detail}</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.statusColor}`}>
                                {item.status}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="flex justify-end">
                <button onClick={save}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${saved ? "bg-green-600 text-white" : "bg-blue-700 hover:bg-blue-800 text-white shadow-sm"}`}>
                    {saved ? <><Check size={13} /> Saved!</> : "Save Settings"}
                </button>
            </div>
        </div>
    );
}

// ─── Tabs & Page ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "account", label: "Account", icon: User },
    { id: "team", label: "Team", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data & Privacy", icon: Database },
];

export default function UniversitySettingsPage() {
    const [tab, setTab] = useState<Tab>("account");

    return (
        <div className="space-y-5 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage your account, team and preferences</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-white rounded-t-lg -mb-3">
                <nav className="flex px-1 pt-1">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors -mb-px ${tab === id
                                ? "border-blue-600 text-blue-700"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <Icon size={13} />
                            {label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab body */}
            <div className="pt-2">
                {tab === "account" && <AccountTab />}
                {tab === "team" && <TeamTab />}
                {tab === "notifications" && <NotificationsTab />}
                {tab === "data" && <DataPrivacyTab />}
            </div>
        </div>
    );
}
