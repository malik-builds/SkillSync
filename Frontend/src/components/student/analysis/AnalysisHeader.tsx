"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Target } from "lucide-react";

interface AnalysisHeaderProps {
    targetRole: string;
    onChangeGoal: () => void;
    changingGoal?: boolean;
}

export function AnalysisHeader({ targetRole, onChangeGoal, changingGoal = false }: AnalysisHeaderProps) {
    return (
        <GlassCard className="p-6 relative overflow-hidden group bg-white border-blue-100 shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-blue-100/50 transition-colors duration-500" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Target size={16} className="text-blue-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Target Role</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{targetRole}</h1>
                </div>

                <button
                    onClick={onChangeGoal}
                    disabled={changingGoal}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {changingGoal ? "Updating..." : "Change Goal"}
                </button>
            </div>
        </GlassCard>
    );
}
