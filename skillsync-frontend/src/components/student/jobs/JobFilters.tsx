"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Search, Filter } from "lucide-react";

interface JobFiltersProps {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    selectedRoles: string[];
    onToggleRole: (role: string) => void;
    selectedModes: string[];
    onToggleMode: (mode: string) => void;
    salaryMin: number;
    onSalaryMinChange: (value: number) => void;
    onClearFilters: () => void;
}

const ROLES = ["Full Stack Developer", "Frontend Engineer", "Backend Engineer", "DevOps"];
const MODES = ["On Site", "Hybrid", "Remote"];

export function JobFilters({
    searchQuery,
    onSearchQueryChange,
    selectedRoles,
    onToggleRole,
    selectedModes,
    onToggleMode,
    salaryMin,
    onSalaryMinChange,
    onClearFilters,
}: JobFiltersProps) {
    return (
        <div className="space-y-6">
            <GlassCard className="p-4 bg-white border border-gray-200 shadow-sm">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        suppressHydrationWarning
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                    <Filter size={18} /> Filters
                </div>
                <button
                    onClick={onClearFilters}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium -mt-2"
                >
                    Clear all
                </button>

                {/* Role */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role</label>
                    <div className="space-y-2">
                        {ROLES.map(role => (
                            <label key={role} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selectedRoles.includes(role)}
                                    onChange={() => onToggleRole(role)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{role}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Mode */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mode</label>
                    <div className="space-y-2">
                        {MODES.map(mode => (
                            <label key={mode} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selectedModes.includes(mode)}
                                    onChange={() => onToggleMode(mode)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{mode}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Salary */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Salary Range</label>
                    <input
                        type="range"
                        min={50}
                        max={500}
                        step={10}
                        value={salaryMin}
                        onChange={(e) => onSalaryMinChange(Number(e.target.value))}
                        className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>{salaryMin}k</span>
                        <span>500k+</span>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
