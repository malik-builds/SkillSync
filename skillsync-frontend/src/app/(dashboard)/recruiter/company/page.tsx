"use client";

import { useState, useEffect } from "react";
import {
    Globe, Mail, MapPin, Users, Pencil, Check, X,
    Plus, Building2, Calendar, Phone, Award,
} from "lucide-react";
import { CompanyProfile } from "@/types/recruiter";
import { useApi } from "@/lib/hooks/useApi";
import { getCompanyProfile } from "@/lib/api/recruiter-api";

// ─── Inline editable field ─────────────────────────────────────────────────────

function EditableText({
    value, multiline = false, className = "", editing, onChange,
}: {
    value: string; multiline?: boolean; className?: string; editing: boolean; onChange: (v: string) => void;
}) {
    if (!editing) return <span className={className}>{value}</span>;
    if (multiline) {
        return (
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={6}
                className={`${className} w-full border border-blue-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-blue-50/40 text-sm`}
            />
        );
    }
    return (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${className} border border-blue-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/40`}
        />
    );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/40">
                <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanyProfilePage() {
    const { data: fetchedProfile, loading, error, refetch } = useApi<CompanyProfile>(() => getCompanyProfile(), []);
    const [editing, setEditing] = useState(false);
    const [data, setData] = useState<CompanyProfile | null>(null);
    const [draft, setDraft] = useState<CompanyProfile | null>(null);

    useEffect(() => {
        if (fetchedProfile) {
            setData(fetchedProfile);
            setDraft(fetchedProfile);
        }
    }, [fetchedProfile]);

    const saveEdits = () => {
        if (draft) setData(draft);
        setEditing(false);
    };
    const cancelEdits = () => {
        setDraft(data);
        setEditing(false);
    };

    if (loading || !data || !draft) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
    if (error) return <div className="text-center py-12 text-red-500">Failed to load company profile. <button onClick={refetch} className="underline">Retry</button></div>;

    const d = editing ? draft : data;
    const update = (key: string, value: string | number | string[]) => setDraft((prev) => prev ? { ...prev, [key]: value } : prev);

    return (
        <div className="space-y-5">

            {/* ── Page header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Company Profile</h1>
                    <p className="text-sm text-gray-500 mt-0.5">How your company appears to candidates</p>
                </div>
                <div className="flex items-center gap-2">
                    {editing ? (
                        <>
                            <button onClick={cancelEdits} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                <X size={12} /> Discard
                            </button>
                            <button onClick={saveEdits} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold transition-colors shadow-sm">
                                <Check size={12} /> Save Changes
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                            <Pencil size={12} /> Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {/* ── Hero card ── */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* Cover banner */}
                <div className="h-28 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 relative">
                    <div className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                            backgroundSize: "24px 24px",
                        }}
                    />
                </div>

                <div className="px-6 pb-6">
                    {/* Logo + basic info row */}
                    <div className="flex items-end gap-5 -mt-10 mb-5">
                        {/* Company logo */}
                        <div className={`w-20 h-20 rounded-xl bg-white border-4 border-white shadow-lg flex items-center justify-center flex-shrink-0 ${editing ? "ring-2 ring-blue-400 cursor-pointer" : ""}`}>
                            <div className="w-16 h-16 rounded-lg bg-blue-700 flex items-center justify-center">
                                <span className="text-white font-black text-xl tracking-tight">TI</span>
                            </div>
                        </div>
                        {editing && (
                            <span className="text-[10px] text-blue-600 font-semibold -mt-2 mb-1">Click to upload logo</span>
                        )}
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="space-y-1">
                            <EditableText value={d.name} editing={editing} onChange={(v) => update("name", v)} className="text-2xl font-bold text-gray-900 block mb-1" />
                            <EditableText value={d.tagline} editing={editing} onChange={(v) => update("tagline", v)} className="text-sm text-gray-500 block mb-3" />
                            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2">
                                {[
                                    { icon: Globe, val: d.website },
                                    { icon: Mail, val: d.careersEmail },
                                    { icon: MapPin, val: d.location },
                                    { icon: Users, val: d.size },
                                ].map(({ icon: Icon, val }) => (
                                    <span key={val} className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <Icon size={12} className="text-gray-400" /> {val}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="grid grid-cols-4 gap-4 lg:ml-auto flex-shrink-0">
                            {data.stats.map((s) => (
                                <div key={s.label} className="text-center">
                                    <p className="text-xl font-extrabold text-blue-700">{s.value}</p>
                                    <p className="text-[10px] font-semibold text-gray-500 mt-0.5 leading-tight">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Two-column body ── */}
            <div className="grid lg:grid-cols-3 gap-5">

                {/* Left col (2/3) */}
                <div className="lg:col-span-2 space-y-5">

                    {/* About */}
                    <Section title="About Us">
                        <EditableText
                            value={d.about}
                            editing={editing}
                            multiline
                            onChange={(v) => update("about", v)}
                            className="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
                        />
                    </Section>

                    {/* Benefits */}
                    <Section title="Benefits & Perks">
                        <div className="grid sm:grid-cols-2 gap-3">
                            {d.benefits.map((b, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                                    <span className="text-xl flex-shrink-0">{b.icon}</span>
                                    <div>
                                        <p className="text-[13px] font-bold text-gray-900">{b.label}</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">{b.note}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {editing && (
                            <button className="mt-3 flex items-center gap-1 text-xs text-blue-700 hover:underline font-semibold">
                                <Plus size={12} /> Add benefit
                            </button>
                        )}
                    </Section>
                </div>

                {/* Right col (1/3) */}
                <div className="space-y-5">

                    {/* Company details */}
                    <Section title="Company Details">
                        <div className="space-y-4">
                            {[
                                { icon: Building2, label: "Industry", val: d.industry },
                                { icon: Users, label: "Company Size", val: d.size },
                                { icon: Calendar, label: "Founded", val: d.founded },
                            ].map(({ icon: Icon, label, val }) => (
                                <div key={label}>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                                    <span className="flex items-center gap-1.5 text-sm text-gray-800 font-medium">
                                        <Icon size={13} className="text-gray-400" />
                                        <EditableText value={val} editing={editing} onChange={(v) => update(label.toLowerCase().replace(" ", ""), v)} className="text-sm text-gray-800 font-medium" />
                                    </span>
                                </div>
                            ))}

                            {/* Specialties */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Specialties</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {d.specialties.map((s) => (
                                        <span key={s} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                            {s}
                                            {editing && <X size={9} className="cursor-pointer" />}
                                        </span>
                                    ))}
                                    {editing && (
                                        <button className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-dashed border-blue-300 text-blue-500 hover:bg-blue-50 transition-colors flex items-center gap-1">
                                            <Plus size={10} /> Add
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Contact */}
                    <Section title="Contact Information">
                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Primary Contact</p>
                                <p className="text-sm font-bold text-gray-900">{d.contact.primaryContact}</p>
                                <p className="text-[11px] text-gray-500">{d.contact.role}</p>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { icon: Mail, val: d.contact.email },
                                    { icon: Phone, val: d.contact.phone },
                                ].map(({ icon: Icon, val }) => (
                                    <div key={val} className="flex items-center gap-2 text-xs text-gray-700">
                                        <Icon size={12} className="text-gray-400 flex-shrink-0" />
                                        <EditableText value={val} editing={editing} onChange={() => { }} className="text-xs text-gray-700" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Office Address</p>
                                <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">{d.contact.address}</p>
                            </div>
                        </div>
                    </Section>

                    {/* Profile completeness */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Award size={15} className="text-blue-700" />
                            <p className="text-[13px] font-bold text-blue-900">Profile Strength</p>
                            <span className="ml-auto text-sm font-extrabold text-blue-700">92%</span>
                        </div>
                        <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: "92%" }} />
                        </div>
                        <p className="text-[11px] text-blue-700">Add a company video to reach 100%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
