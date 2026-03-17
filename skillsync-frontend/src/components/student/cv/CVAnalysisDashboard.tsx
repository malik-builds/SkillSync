"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScoreGauge } from "./ScoreGauge";
import { AlertTriangle, CheckCircle2, XCircle, Sparkles, Download } from "lucide-react";
import { CVAnalysis } from "@/types/cv";
import { useApi } from "@/lib/hooks/useApi";
import { getCVAnalysis } from "@/lib/api/student-api";

interface CVAnalysisDashboardProps {
    file: File;
    onReset: () => void;
}

export function CVAnalysisDashboard({ file, onReset }: CVAnalysisDashboardProps) {
    const [isFixing, setIsFixing] = useState(false);
    const { data: analysis } = useApi<CVAnalysis>(() => getCVAnalysis());

    const score = analysis?.score ?? 0;
    const criticalIssues = analysis?.criticalIssues ?? [];
    const foundKeywords = analysis?.foundKeywords ?? [];
    const missingKeywords = analysis?.missingKeywords ?? [];

    const handleAutoFix = () => {
        setIsFixing(true);
        // Simulate fix delay
        setTimeout(() => setIsFixing(false), 2000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
            {/* Left Column: PDF Preview */}
            <div className="lg:col-span-7 flex flex-col h-full bg-gray-100 rounded-3xl border border-gray-200 overflow-hidden relative group shadow-sm">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-gray-500 text-sm">PDF Preview for {file.name}</p>
                </div>
                {/* Overlay Controls */}
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white/95 to-transparent flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button onClick={onReset} className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold border border-red-200 transition-colors">
                        Delete & Re-upload
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold border border-gray-300 transition-colors flex items-center gap-2">
                        <Download size={16} /> Download
                    </button>
                </div>
            </div>

            {/* Right Column: Analysis */}
            <div className="lg:col-span-5 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                {/* Score Card */}
                <GlassCard className="p-6 flex items-center justify-between relative overflow-hidden bg-white border border-gray-200 shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">ATS Compatibility Score</h3>
                        <p className="text-sm text-gray-500">Based on industry standards</p>
                    </div>
                    <ScoreGauge score={score} />
                </GlassCard>

                {/* Critical Issues */}
                <GlassCard className="p-6 border-l-4 border-l-orange-500 bg-white border-y border-r border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="text-orange-500" size={20} />
                        <h3 className="font-bold text-gray-900">Critical Issues Found</h3>
                    </div>
                    <ul className="space-y-3">
                        {criticalIssues.map((issue, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-orange-500 shrink-0" />
                                {issue}
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={handleAutoFix}
                        disabled={isFixing}
                        className="w-full mt-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        {isFixing ? (
                            <>Fixing Issues...</>
                        ) : (
                            <><Sparkles size={16} /> Auto-Fix with AI</>
                        )}
                    </button>
                </GlassCard>

                {/* Keyword Match */}
                <GlassCard className="p-6 bg-white border border-gray-200 shadow-sm">
                    <div className="mb-4">
                        <h3 className="font-bold text-gray-900 mb-1">Target Role Keyword Match</h3>
                        <p className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded-md inline-block">Job: Full-Stack Developer</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 size={16} className="text-green-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-green-600">Found Keywords</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {foundKeywords.map(k => (
                                    <span key={k} className="px-2 py-1 rounded bg-green-50 border border-green-100 text-xs text-green-700 font-medium">
                                        {k}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <XCircle size={16} className="text-red-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-red-600">Missing Keywords</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {missingKeywords.map(k => (
                                    <span key={k} className="px-2 py-1 rounded bg-red-50 border border-red-100 text-xs text-red-700 font-medium">
                                        {k}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-3">
                            You have these missing skills in your profile. Add them to CV?
                        </p>
                        <button className="w-full py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs transition-colors">
                            + Add Missing Keywords
                        </button>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
