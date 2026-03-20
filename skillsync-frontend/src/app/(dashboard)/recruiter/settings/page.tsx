"use client";

import { useState } from "react";
import {
    User, Bell, Users, CreditCard, Check, X, Plus,
    Eye, EyeOff, Trash2,
    Mail, Send, Crown,
} from "lucide-react";
import { RecruiterTeamMember, RecruiterPendingInvite, RecruiterPlan } from "@/types/recruiter";
import { useApi } from "@/lib/hooks/useApi";
import { getTeamMembers, getPlans } from "@/lib/api/recruiter-api";
import { useAuth } from "@/lib/auth/AuthContext";

// ─── Local type aliases ────────────────────────────────────────────────────────

type Tab = "account" | "notifications" | "team" | "billing";
type TeamMember = RecruiterTeamMember;
type PendingInvite = RecruiterPendingInvite;

// ─── Toggle switch ─────────────────────────────────────────────────────────────

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

// ─── Role badge ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
    Admin: "bg-blue-50 text-blue-700 border-blue-200",
    Recruiter: "bg-violet-50 text-violet-700 border-violet-200",
    "HR Manager": "bg-cyan-50 text-cyan-700 border-cyan-200",
    Viewer: "bg-gray-100 text-gray-600 border-gray-200",
};

function RoleBadge({ role }: { role: string }) {
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[role] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {role}
        </span>
    );
}

// ─── Section card ──────────────────────────────────────────────────────────────

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                {desc && <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─── Invite modal ──────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Recruiter");
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900">Invite Team Member</h3>
                    <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><X size={14} /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Email Address</label>
                        <div className="relative">
                            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.lk" className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                            {["Recruiter", "HR Manager", "Viewer"].map((r) => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <p className="text-[11px] text-gray-400">They&apos;ll receive an email invitation to join your recruiter workspace.</p>
                </div>
                <div className="flex gap-2 px-5 pb-5">
                    <button onClick={onClose} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button onClick={onClose} disabled={!email.trim()} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold disabled:opacity-40">
                        <Send size={12} /> Send Invite
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Tab views ─────────────────────────────────────────────────────────────────

function AccountTab() {
    const { user } = useAuth();
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSave = async () => {
        setError("");

        // Only attempt to change password if any password field is filled
        if (currentPassword || newPassword || confirmPassword) {
            if (newPassword !== confirmPassword) {
                setError("New passwords do not match.");
                return;
            }
            if (!currentPassword || !newPassword) {
                setError("Please fill in both current and new password.");
                return;
            }
            if (newPassword.length < 6) {
                setError("New password must be at least 6 characters long.");
                return;
            }

            try {
                setIsSaving(true);
                const { changeRecruiterPassword } = await import('@/lib/api/recruiter-api');
                await changeRecruiterPassword({ currentPassword, newPassword });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            } catch (err: any) {
                setError(err.response?.data?.detail || "Failed to update password. Please check your current password.");
            } finally {
                setIsSaving(false);
            }
        } else {

            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        }
    };

    const nameParts = (user?.fullName || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return (
        <div className="space-y-4">

            {/* Personal info */}
            <Card title="Personal Information">
                <div className="grid sm:grid-cols-2 gap-4">
                    {[
                        { label: "First Name", value: firstName, placeholder: "First name" },
                        { label: "Last Name", value: lastName, placeholder: "Last name" },
                        { label: "Job Title", value: "Recruiter", placeholder: "Your role" },
                        { label: "Phone", value: "+94...", placeholder: "+94..." },
                    ].map((f) => (
                        <div key={f.label}>
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                            <input key={f.value} defaultValue={f.value} placeholder={f.placeholder}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/30 text-gray-800" />
                        </div>
                    ))}
                </div>
            </Card>

            {/* Email */}
            <Card title="Email Address" desc="Used for login and notifications">
                <div className="flex items-center gap-3">
                    <input key={user?.email} defaultValue={user?.email || ""} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50/30" />
                    <button className="flex-shrink-0 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        Verify & Update
                    </button>
                </div>
            </Card>

            {/* Password */}
            <Card title="Password" desc="Choose a strong, unique password">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Current Password</label>
                        <div className="relative">
                            <input type={showCurrentPw ? "text" : "password"} placeholder="••••••••"
                                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                            <button onClick={() => setShowCurrentPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">New Password</label>
                        <div className="relative">
                            <input type={showNewPw ? "text" : "password"} placeholder="••••••••"
                                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                            <button onClick={() => setShowNewPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Confirm New Password</label>
                        <div className="relative">
                            <input type={showConfirmPw ? "text" : "password"} placeholder="••••••••"
                                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                            <button onClick={() => setShowConfirmPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
                {error && <p className="text-sm font-medium text-red-600 mt-3">{error}</p>}
            </Card>

            {/* Danger zone */}
            <Card title="Danger Zone">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-red-700">Delete Account</p>
                        <p className="text-xs text-gray-500 mt-0.5">Permanently remove your account and all company data.</p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors">
                        <Trash2 size={12} /> Delete Account
                    </button>
                </div>
            </Card>

            <div className="flex justify-end">
                <button onClick={handleSave} disabled={isSaving} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${saved ? "bg-green-600 text-white" : "bg-blue-700 hover:bg-blue-800 text-white shadow-sm disabled:opacity-50"}`}>
                    {isSaving ? "Saving..." : saved ? <><Check size={13} /> Saved!</> : "Save Changes"}
                </button>
            </div>
        </div>
    );
}

function NotificationsTab() {
    const [prefs, setPrefs] = useState({
        newApps: true,
        statusChanges: true,
        interviewRem: true,
        dailySummary: false,
        weeklyReport: true,
        realtimeApps: true,
        msgNotifs: true,
        appInterviews: true,
    });

    const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

    const [saved, setSaved] = useState(false);
    const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

    const emailRows = [
        { key: "newApps" as const, label: "New applications received", desc: "Notify when a candidate applies to any of your jobs" },
        { key: "statusChanges" as const, label: "Application status changes", desc: "When a co-worker moves a candidate to a new stage" },
        { key: "interviewRem" as const, label: "Interview reminders (1 hour before)", desc: "Never miss a scheduled interview" },
        { key: "dailySummary" as const, label: "Daily summary digest", desc: "A morning recap of yesterday's hiring activity" },
        { key: "weeklyReport" as const, label: "Weekly analytics report", desc: "Performance summary every Monday at 9 AM" },
    ];

    const appRows = [
        { key: "realtimeApps" as const, label: "Real-time application updates", desc: "Instant in-app pop-up when someone applies" },
        { key: "msgNotifs" as const, label: "Message notifications", desc: "When a candidate replies to your message" },
        { key: "appInterviews" as const, label: "Interview reminders", desc: "Reminder 1 hour before interview starts" },
    ];

    return (
        <div className="space-y-4">
            <Card title="Email Notifications" desc="Choose what you receive in your inbox">
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

            <Card title="In-App Notifications" desc="Alerts shown within SkillSync">
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
                <button onClick={save} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${saved ? "bg-green-600 text-white" : "bg-blue-700 hover:bg-blue-800 text-white shadow-sm"}`}>
                    {saved ? <><Check size={13} /> Saved!</> : "Save Preferences"}
                </button>
            </div>
        </div>
    );
}

function TeamTab() {
    const { data: teamData } = useApi<{ members: TeamMember[]; invites: PendingInvite[] }>(() => getTeamMembers(), []);
    const members = teamData?.members ?? [];
    const invites = teamData?.invites ?? [];
    const [showInvite, setShowInvite] = useState(false);

    return (
        <>
            <div className="space-y-4">
                <Card
                    title={`Team Members (${(members ?? []).length})`}
                    desc="People who can access the recruiter workspace"
                >
                    <div className="divide-y divide-gray-50">
                        {(members ?? []).map((m) => (
                            <div key={m.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: m.avatarColor }}>
                                    {m.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                                        {m.isYou && <span className="text-[10px] font-bold text-gray-400">(You)</span>}
                                        {m.role === "Admin" && <Crown size={11} className="text-amber-500" />}
                                    </div>
                                    <p className="text-[11px] text-gray-500">{m.email} · Joined {m.joinedDate}</p>
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
                    <Card title={`Pending Invitations (${invites.length})`} desc="These emails have been sent but not yet accepted">
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

                {/* Role permissions legend */}
                <Card title="Role Permissions" desc="What each role can do">
                    <div className="grid sm:grid-cols-3 gap-3">
                        {[
                            { role: "Admin", can: ["All permissions", "Manage team & billing", "Delete jobs"], color: "border-blue-200 bg-blue-50/50" },
                            { role: "Recruiter", can: ["Post & edit jobs", "Review applications", "Message candidates"], color: "border-violet-200 bg-violet-50/50" },
                            { role: "HR Manager", can: ["View all jobs", "Manage interviews", "Access analytics"], color: "border-cyan-200 bg-cyan-50/50" },
                        ].map((p) => (
                            <div key={p.role} className={`border rounded-lg p-3.5 ${p.color}`}>
                                <p className="text-xs font-bold text-gray-900 mb-2"><RoleBadge role={p.role} /></p>
                                <ul className="space-y-1 mt-2">
                                    {p.can.map((c) => (
                                        <li key={c} className="flex items-center gap-1.5 text-[11px] text-gray-700">
                                            <Check size={10} className="text-green-600 flex-shrink-0" /> {c}
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

function BillingTab() {
    const [currentPlan] = useState("growth");
    const { data: plans } = useApi<RecruiterPlan[]>(() => getPlans(), []);

    return (
        <div className="space-y-4">
            {/* Current plan */}
            <Card title="Current Plan" desc="Your workspace is on the Growth plan">
                <div className="flex items-center gap-4 p-3 rounded-lg border border-blue-200 bg-blue-50/40 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center flex-shrink-0">
                        <Crown size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Growth Plan</p>
                        <p className="text-[11px] text-gray-500">USD $49/month · Renews March 27, 2026</p>
                    </div>
                    <button className="ml-auto text-xs text-gray-600 hover:text-red-700 border border-gray-200 rounded px-2.5 py-1.5 transition-colors">
                        Cancel Plan
                    </button>
                </div>

                {/* Usage */}
                <div className="grid sm:grid-cols-3 gap-3">
                    {[
                        { label: "Active Jobs", used: 4, max: 10 },
                        { label: "Team Members", used: 3, max: 5 },
                        { label: "Candidates/mo", used: 127, max: 500 },
                    ].map((u) => (
                        <div key={u.label} className="border border-gray-100 rounded-lg p-3">
                            <div className="flex justify-between mb-1.5">
                                <span className="text-[11px] font-semibold text-gray-600">{u.label}</span>
                                <span className="text-[11px] text-gray-400">{u.used}/{u.max}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(u.used / u.max) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Plan comparison */}
            <Card title="Available Plans" desc="Compare plans and upgrade anytime">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(plans ?? []).map((plan) => {
                        const isCurrent = plan.id === currentPlan;
                        return (
                            <div key={plan.id} className={`border rounded-lg p-4 flex flex-col gap-3 ${isCurrent ? "border-blue-400 bg-blue-50/60" : "border-gray-200"}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                                        {plan.price !== null
                                            ? <p className="text-xl font-extrabold text-gray-900 mt-0.5">${plan.price}<span className="text-xs font-normal text-gray-400">/mo</span></p>
                                            : <p className="text-sm font-bold text-gray-700 mt-0.5">Custom</p>
                                        }
                                    </div>
                                    {isCurrent && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-700 text-white rounded-full">Current</span>}
                                </div>
                                <ul className="space-y-1.5 text-[11px] text-gray-600 flex-1">
                                    <li className="flex items-center gap-1.5"><Check size={10} className="text-green-600" /> {plan.jobs === 999 ? "Unlimited" : `${plan.jobs}`} active jobs</li>
                                    <li className="flex items-center gap-1.5"><Check size={10} className="text-green-600" /> {plan.users === 999 ? "Unlimited" : `${plan.users}`} team members</li>
                                    <li className={`flex items-center gap-1.5 ${plan.ats ? "" : "text-gray-300"}`}><Check size={10} className={plan.ats ? "text-green-600" : "text-gray-200"} /> ATS pipeline</li>
                                    <li className={`flex items-center gap-1.5 ${plan.analytics ? "" : "text-gray-300"}`}><Check size={10} className={plan.analytics ? "text-green-600" : "text-gray-200"} /> Analytics dashboard</li>
                                </ul>
                                <button disabled={isCurrent} className={`w-full py-1.5 rounded-md text-xs font-semibold transition-colors ${isCurrent ? "bg-blue-100 text-blue-700 cursor-default" : plan.id === "enterprise" ? "border border-gray-300 hover:bg-gray-50 text-gray-700" : "bg-blue-700 hover:bg-blue-800 text-white shadow-sm"}`}>
                                    {isCurrent ? "Current Plan" : plan.id === "enterprise" ? "Contact Sales" : "Upgrade"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Payment method */}
            <Card title="Payment Method">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-7 rounded border border-gray-200 bg-white flex items-center justify-center">
                            <span className="text-[11px] font-black text-blue-700">VISA</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Visa ending in 4242</p>
                            <p className="text-[11px] text-gray-500">Expires 08 / 27</p>
                        </div>
                    </div>
                    <button className="text-xs text-blue-700 hover:underline font-semibold">Update Card</button>
                </div>
            </Card>

            {/* Invoice history */}
            <Card title="Invoice History">
                <div className="divide-y divide-gray-50">
                    {[
                        { date: "Feb 27, 2026", amount: "$49.00", status: "Paid" },
                        { date: "Jan 27, 2026", amount: "$49.00", status: "Paid" },
                        { date: "Dec 27, 2025", amount: "$49.00", status: "Paid" },
                    ].map((inv) => (
                        <div key={inv.date} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                            <div>
                                <p className="text-sm text-gray-800">{inv.date}</p>
                                <p className="text-[11px] text-gray-400">Growth Plan</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-900">{inv.amount}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Paid</span>
                                <button className="text-[11px] text-blue-700 hover:underline">Download</button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "team", label: "Team", icon: Users },
    { id: "billing", label: "Billing", icon: CreditCard },
];

export default function SettingsPage() {
    const [tab, setTab] = useState<Tab>("account");

    return (
        <div className="space-y-5">
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
                {tab === "notifications" && <NotificationsTab />}
                {tab === "team" && <TeamTab />}
                {tab === "billing" && <BillingTab />}
            </div>
        </div>
    );
}
