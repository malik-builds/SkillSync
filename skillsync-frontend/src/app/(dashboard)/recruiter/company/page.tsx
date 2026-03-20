"use client";

import { useState, useEffect } from "react";
import {
    Globe, Mail, MapPin, Users, Pencil, Check, X,
    Plus, Building2, Calendar, Phone, Award,
} from "lucide-react";
import { CompanyProfile } from "@/types/recruiter";
import { useApi } from "@/lib/hooks/useApi";
import { getCompanyProfile, updateCompanyProfile, uploadCompanyLogo, uploadCompanyBanner } from "@/lib/api/recruiter-api";

// ─── Inline editable field ─────────────────────────────────────────────────────

function EditableText({
    value, type = "text", multiline = false, className = "", editing, onChange, placeholder = ""
}: {
    value: string; type?: string; multiline?: boolean; className?: string; editing: boolean; onChange: (v: string) => void; placeholder?: string;
}) {
    if (!editing) return <span className={className}>{value || ""}</span>;
    if (multiline) {
        return (
            <textarea
                value={value || ""}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                rows={6}
                className={`${className} w-full border border-blue-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-blue-50/40 text-sm`}
            />
        );
    }
    return (
        <input
            type={type}
            value={value || ""}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={`${className} flex-1 min-w-0 border border-blue-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/40`}
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

    const [isSaving, setIsSaving] = useState(false);

    const saveEdits = async () => {
        if (!draft) return;
        setIsSaving(true);
        try {
            const updated = await updateCompanyProfile(draft);
            const newData = { ...draft, ...updated };
            setData(newData);
            setDraft(newData);
            setEditing(false);
        } catch (err) {
            console.error("Failed to save profile:", err);
            alert("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };
    const cancelEdits = () => {
        setDraft(data);
        setEditing(false);
    };

    if (loading || !data || !draft) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
    if (error) return <div className="text-center py-12 text-red-500">Failed to load company profile. <button onClick={refetch} className="underline">Retry</button></div>;

    const d = editing ? draft : data;
    const update = (key: string, value: any) => setDraft((prev) => prev ? { ...prev, [key]: value } as any : prev);

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
                            <button onClick={saveEdits} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold transition-colors shadow-sm disabled:opacity-50">
                                <Check size={12} /> {isSaving ? "Saving..." : "Save Changes"}
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
                <div
                    onClick={() => { if (editing) document.getElementById('banner-upload')?.click(); }}
                    className={`h-28 relative overflow-hidden ${editing ? "cursor-pointer ring-2 ring-inset ring-blue-400" : ""}`}
                >
                    {d.bannerUrl ? (
                        <img src={d.bannerUrl} alt="Company Banner" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600">
                            <div className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                                    backgroundSize: "24px 24px",
                                }}
                            />
                        </div>
                    )}
                    {editing && (
                        <>
                            <div className="absolute opacity-0 hover:opacity-100 inset-0 bg-black/10 hover:bg-black/20 flex items-center justify-center transition-all duration-200">
                                <span className="text-white font-semibold text-sm drop-shadow-md bg-black/40 px-3 py-1.5 rounded-md backdrop-blur-sm">Click to upload banner</span>
                            </div>
                            <input
                                type="file"
                                id="banner-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        update("bannerUrl", URL.createObjectURL(file));
                                        try {
                                            const res = await uploadCompanyBanner(file);
                                            update("bannerUrl", res.bannerUrl);
                                        } catch (err) {
                                            console.error("Failed to upload banner:", err);
                                        }
                                    }
                                }}
                            />
                        </>
                    )}
                </div>

                <div className="px-6 pb-6">
                    {/* Logo + basic info row */}
                    <div className="flex items-end gap-5 -mt-10 mb-5 relative z-10">
                        {/* Company logo */}
                        <div
                            onClick={() => { if (editing) document.getElementById('logo-upload')?.click(); }}
                            className={`w-20 h-20 rounded-xl bg-white border-4 border-white shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative ${editing ? "ring-2 ring-blue-400 cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
                        >
                            {(d as any).logo ? (
                                <img src={(d as any).logo} alt="Company Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-blue-700 flex items-center justify-center">
                                    <span className="text-white font-black text-xl tracking-tight">{d.name ? d.name.substring(0, 2).toUpperCase() : "CO"}</span>
                                </div>
                            )}
                            {editing && (
                                <input
                                    type="file"
                                    id="logo-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            update("logo", URL.createObjectURL(file));
                                            try {
                                                const res = await uploadCompanyLogo(file);
                                                update("logo", res.logoUrl);
                                            } catch (err) {
                                                console.error("Failed to upload logo:", err);
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                        {editing && (
                            <span className="text-[10px] text-blue-600 font-semibold -mt-2 mb-1">Click logo to upload</span>
                        )}
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="space-y-1">
                            <EditableText value={d.name} editing={editing} onChange={(v) => update("name", v)} className="text-2xl font-bold text-gray-900 block mb-1" placeholder="Company Name" />
                            {/* Tagline */}
                            <EditableText value={d.tagline || ""} editing={editing} onChange={(v) => update("tagline", v)} className="text-sm text-gray-500 block mb-3 w-full" placeholder="Company Tagline" />
                            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2">
                                {[
                                    { icon: Globe, val: d.website, field: "website", placeholder: "Website URL" },
                                    { icon: Mail, val: d.careersEmail, field: "careersEmail", placeholder: "Careers Email" },
                                    { icon: MapPin, val: d.location, field: "location", placeholder: "Location" },
                                    { icon: Users, val: d.size, field: "size", placeholder: "Company Size" },
                                ].map(({ icon: Icon, val, field, placeholder }) => (
                                    <span key={field} className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <Icon size={12} className="text-gray-400" /> 
                                        {editing ? (
                                            <EditableText value={val} editing={editing} onChange={(v) => update(field, v)} className="text-xs text-gray-600 min-w-[120px] bg-white/50" placeholder={placeholder} />
                                        ) : (
                                            val ? field === "website" ? <a href={val.startsWith("http") ? val : `https://${val}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">{val}</a> : val : null
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="grid grid-cols-4 gap-4 lg:ml-auto flex-shrink-0">
                            {(data.stats || []).map((s) => (
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
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors relative group">
                                    <span className="text-xl flex-shrink-0">
                                        <EditableText value={b.icon} editing={editing} onChange={(v) => {
                                            const nb = [...d.benefits]; nb[i] = { ...nb[i], icon: v }; update("benefits", nb);
                                        }} className="w-8 text-center" />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <EditableText value={b.label} editing={editing} onChange={(v) => {
                                            const nb = [...d.benefits]; nb[i] = { ...nb[i], label: v }; update("benefits", nb);
                                        }} className="text-[13px] font-bold text-gray-900 w-full mb-1" />
                                        <EditableText value={b.note} editing={editing} onChange={(v) => {
                                            const nb = [...d.benefits]; nb[i] = { ...nb[i], note: v }; update("benefits", nb);
                                        }} className="text-[11px] text-gray-500 mt-0.5 w-full" />
                                    </div>
                                    {editing && (
                                        <button onClick={() => update("benefits", d.benefits.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {editing && (
                            <button 
                                onClick={() => update("benefits", [...d.benefits, { icon: "✨", label: "New Benefit", note: "Details" }])}
                                className="mt-3 flex items-center gap-1 text-xs text-blue-700 hover:underline font-semibold">
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
                                { icon: Building2, label: "Industry", val: d.industry, field: "industry" },
                                { icon: Users, label: "Company Size", val: d.size, field: "size" },
                                { icon: Calendar, label: "Founded", val: d.founded, field: "founded", type: "date" },
                            ].map(({ icon: Icon, label, val, field, type }) => (
                                <div key={label}>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                                    <span className="flex items-center gap-1.5 text-sm text-gray-800 font-medium">
                                        <Icon size={13} className="text-gray-400" />
                                        <EditableText type={type || "text"} value={val} editing={editing} onChange={(v) => update(field, v)} className="text-sm text-gray-800 font-medium w-full" />
                                    </span>
                                </div>
                            ))}

                            {/* Specialties */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Specialties</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {d.specialties.map((s, idx) => (
                                        <span key={idx} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                            {editing ? (
                                                <EditableText value={s} editing={editing} onChange={(v) => {
                                                    const newSpecs = [...d.specialties];
                                                    newSpecs[idx] = v;
                                                    update("specialties", newSpecs);
                                                }} className="w-20" />
                                            ) : (
                                                s
                                            )}
                                            {editing && <X size={9} className="cursor-pointer" onClick={() => update("specialties", d.specialties.filter((_, i) => i !== idx))} />}
                                        </span>
                                    ))}
                                    {editing && (
                                        <button 
                                            onClick={() => update("specialties", [...d.specialties, "New"])}
                                            className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-dashed border-blue-300 text-blue-500 hover:bg-blue-50 transition-colors flex items-center gap-1">
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
                                    { icon: Mail, val: d.contact.email, field: "email" },
                                    { icon: Phone, val: d.contact.phone, field: "phone" },
                                ].map(({ icon: Icon, val, field }) => (
                                    <div key={field} className="flex items-center gap-2 text-xs text-gray-700">
                                        <Icon size={12} className="text-gray-400 flex-shrink-0" />
                                        <EditableText 
                                            value={val} 
                                            editing={editing} 
                                            onChange={(v) => setDraft(prev => prev ? { ...prev, contact: { ...prev.contact, [field]: v } } : prev)} 
                                            className="text-xs text-gray-700 w-full" 
                                        />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Office Address</p>
                                <EditableText 
                                    value={d.contact.address} 
                                    multiline
                                    editing={editing} 
                                    onChange={(v) => setDraft(prev => prev ? { ...prev, contact: { ...prev.contact, address: v } } : prev)} 
                                    className="text-xs text-gray-700 whitespace-pre-line leading-relaxed" 
                                />
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
