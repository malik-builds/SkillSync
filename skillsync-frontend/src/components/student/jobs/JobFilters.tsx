"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Search, Filter } from "lucide-react";

export function JobFilters() {
    return (
        <div className="space-y-6">
            <GlassCard className="p-4 bg-white border border-gray-200 shadow-sm">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                    <Filter size={18} /> Filters
                </div>

                {/* Role */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role</label>
                    <div className="space-y-2">
                        {['Full Stack Developer', 'Frontend Engineer', 'Backend Engineer', 'DevOps'].map(role => (
                            <label key={role} className="flex items-center gap-3 cursor-pointer group">
                                <div className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center group-hover:border-blue-500 transition-colors bg-white">
                                    {/* Checkbox state logic would go here */}
                                </div>
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{role}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Location */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</label>
                    <div className="space-y-2">
                        {['Colombo (Hybrid)', 'Remote', 'Kandy', 'On-Site'].map(loc => (
                            <label key={loc} className="flex items-center gap-3 cursor-pointer group">
                                <div className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center group-hover:border-blue-500 transition-colors bg-white"></div>
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{loc}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Salary */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Salary Range</label>
                    <input type="range" className="w-full accent-blue-600" />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>50k</span>
                        <span>500k+</span>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
