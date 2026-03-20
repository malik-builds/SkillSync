"use client";

import { useState, useMemo } from "react";
import {
    Search, Handshake, Users, Briefcase, Building2, Mail,
    Star, TrendingUp, Plus, ExternalLink, BadgeCheck
} from "lucide-react";
import { PartnerCompany, PartnerStatus, PartnerStats } from "@/types/university";
import { useApi } from "@/lib/hooks/useApi";
import { getPartners } from "@/lib/api/university-api";

type Company = PartnerCompany;

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PartnerStatus, { bg: string; text: string; dot: string }> = {
    Active: { bg: "bg-green-50 border border-green-200", text: "text-green-700", dot: "bg-green-500" },
    Partner: { bg: "bg-blue-50 border border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
    New: { bg: "bg-purple-50 border border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
    Inactive: { bg: "bg-gray-100 border border-gray-200", text: "text-gray-500", dot: "bg-gray-400" },
};

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    size={12}
                    className={i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}
                />
            ))}
        </div>
    );
}

// ─── Company Card ─────────────────────────────────────────────────────────────

function CompanyCard({ company }: { company: Company }) {
    const statusConf = STATUS_CONFIG[company.status];
    const initial = company.name.charAt(0).toUpperCase();

    return (
        <div className="group bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col overflow-hidden">
            {/* Card Header */}
            <div className="p-5 pb-4 flex-1">
                {/* Logo + Status */}
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${company.logoColor} flex items-center justify-center text-white text-xl font-black shadow-md select-none`}>
                        {initial}
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 ${statusConf.bg} ${statusConf.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`}></span>
                        {company.status}
                    </span>
                </div>

                {/* Company Info */}
                <h3 className="text-base font-bold text-gray-900 leading-tight mb-0.5 group-hover:text-blue-700 transition-colors">{company.name}</h3>
                <p className="text-xs text-gray-500 font-medium mb-3">{company.industry}</p>

                {/* Star Rating */}
                <div className="flex items-center gap-1.5 mb-4">
                    <StarRating rating={company.rating} />
                    <span className="text-[10px] text-gray-400 font-medium">Partner since {company.since}</span>
                </div>

                {/* Stats */}
                <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-xs text-gray-600">
                        <Users size={13} className="text-blue-500 flex-shrink-0" />
                        <span><b className="text-blue-700">{company.studentsHired}</b> students hired</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs text-gray-600">
                        <Briefcase size={13} className="text-gray-400 flex-shrink-0" />
                        <span>{company.activeJobs > 0 ? <><b className="text-gray-900">{company.activeJobs}</b> active jobs</> : <span className="text-gray-400">No active jobs</span>}</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs text-gray-600">
                        <Building2 size={13} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">{company.size} employees</span>
                    </li>
                </ul>

                {/* Top Roles */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {company.topRoles.map(role => (
                        <span key={role} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{role}</span>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Contact Button */}
            <div className="px-5 py-3">
                <button className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors py-2 rounded-lg group-hover:border-blue-100 border border-gray-100">
                    <Mail size={14} /> Contact
                </button>
            </div>
        </div>
    );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function PartnerCompaniesPage() {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<PartnerStatus | "All">("All");
    const [industryFilter, setIndustryFilter] = useState("All");
    const [sizeFilter, setSizeFilter] = useState("All");

    const { data: partnersData } = useApi<{ companies: Company[]; stats: PartnerStats }>(() => getPartners());
    const COMPANIES = partnersData?.companies ?? [];

    const industries = ["All", ...Array.from(new Set(COMPANIES.map(c => c.industry)))];

    const filtered = useMemo(() => COMPANIES.filter(c => {
        const nameMatch = c.name.toLowerCase().includes(query.toLowerCase()) || c.industry.toLowerCase().includes(query.toLowerCase());
        const statusMatch = statusFilter === "All" || c.status === statusFilter;
        const indMatch = industryFilter === "All" || c.industry === industryFilter;
        const sizeMatch = sizeFilter === "All" || c.size === sizeFilter;
        return nameMatch && statusMatch && indMatch && sizeMatch;
    }), [query, statusFilter, industryFilter, sizeFilter]);

    const active = COMPANIES.filter(c => c.status === "Active").length;
    const partners = COMPANIES.filter(c => c.status === "Partner").length;
    const totalHired = COMPANIES.reduce((a, c) => a + c.studentsHired, 0);
    const totalJobs = COMPANIES.reduce((a, c) => a + c.activeJobs, 0);

    return (
        <div className="space-y-6 pb-20">
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Partner Companies</h1>
                    <p className="text-sm text-gray-500 mt-1">Companies actively hiring from your university</p>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                    <Plus size={14} /> Add Company
                </button>
            </div>

            {/* ── Summary Stats ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Partners</p>
                    <p className="text-2xl font-bold text-gray-900">{COMPANIES.length}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Registered companies</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Actively Hiring
                    </p>
                    <p className="text-2xl font-bold text-green-700">{active}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Companies with open roles</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Users size={11} className="text-blue-500" /> Total Hired
                    </p>
                    <p className="text-2xl font-bold text-blue-700">{totalHired}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Students placed this year</p>
                </div>
                <div className="bg-blue-600 p-4 rounded-xl shadow-sm text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-2xl -mr-4 -mt-4"></div>
                    <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1 relative z-10 flex items-center gap-1.5">
                        <Briefcase size={11} /> Active Jobs
                    </p>
                    <p className="text-2xl font-extrabold relative z-10">{totalJobs}</p>
                    <p className="text-[10px] text-blue-200 mt-0.5 relative z-10">Open positions right now</p>
                </div>
            </div>

            {/* ── Search + Filters ──────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Search bar */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search companies or industries..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 shadow-sm"
                    />
                </div>

                {/* Status filter pills */}
                <div className="flex gap-1.5 flex-wrap">
                    {(["All", "Active", "Partner", "New", "Inactive"] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${statusFilter === s
                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Size filter */}
                <select
                    value={sizeFilter}
                    onChange={e => setSizeFilter(e.target.value)}
                    className="bg-white border border-gray-200 text-sm text-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                    <option value="All">All Sizes</option>
                    <option value="10-50">10–50 employees</option>
                    <option value="50-200">50–200 employees</option>
                    <option value="200-500">200–500 employees</option>
                    <option value="500+">500+ employees</option>
                </select>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Showing <b className="text-gray-900">{filtered.length}</b> of <b className="text-gray-900">{COMPANIES.length}</b> partner companies</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <BadgeCheck size={14} className="text-blue-500" />
                    <span>{partners} MoU-signed partners · {active} actively hiring</span>
                </div>
            </div>

            {/* ── Company Grid ──────────────────────────────────────────── */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(company => (
                        <CompanyCard key={company.id} company={company} />
                    ))}
                </div>
            ) : (
                <div className="py-20 flex flex-col items-center text-center text-gray-400">
                    <Handshake size={48} className="mb-4 opacity-30" />
                    <p className="text-base font-semibold">No companies match your filters</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters above.</p>
                </div>
            )}

            {/* ── Insight Footer ────────────────────────────────────────── */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex-shrink-0 flex items-center justify-center">
                    <TrendingUp size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Partnership Development Insight</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        {COMPANIES.length > 0 ? (
                            <>
                                <b>{COMPANIES.sort((a,b) => b.studentsHired - a.studentsHired).slice(0, 3).map(c => c.name).join(", ")}</b> have been your most active hiring partners this year. 
                                Consider further engagement with these institutions for curriculum advisory or guest lectures.
                            </>
                        ) : (
                            "No company data available. Partner with industry leaders to start tracking hiring trends and student placements."
                        )}
                    </p>
                </div>
                <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap transition-colors">
                    Partnership Report <ExternalLink size={12} />
                </button>
            </div>
        </div>
    );
}
