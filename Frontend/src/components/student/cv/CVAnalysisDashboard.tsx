"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScoreGauge } from "./ScoreGauge";
import { AlertTriangle, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { addSkillToLearningPath } from "@/lib/api/student-api";
import type { AnalysisResponse } from "@/types/user";

interface CVAnalysisDashboardProps {
    result: AnalysisResponse;
    file: File;
    targetRole: string;
    onReset: () => void;
}

export function CVAnalysisDashboard({ result, file, targetRole, onReset }: CVAnalysisDashboardProps) {
    const router = useRouter();
    const [isFixing, setIsFixing] = useState(false);
    const [fixError, setFixError] = useState<string | null>(null);

    const score = result.gap_report?.score ?? 0;
    const missingCritical = result.gap_report?.missing_critical ?? [];
    const missingNiceToHave = (result.gap_report as any)?.missing_nice_to_have ?? [];
    const extractedSkills = result.extracted_data?.skills ?? [];
    const mustHave = result.market_requirements?.must_have ?? [];

    // Skills the candidate HAS that are relevant to the target role
    const foundKeywords = extractedSkills.filter((s) =>
        mustHave.some((r) => r.toLowerCase() === s.toLowerCase())
    ).slice(0, 12);

    // Critical missing skills
    const missingKeywords = missingCritical.slice(0, 8);
    const allListedMissingSkills = Array.from(
        new Set(
            [...missingCritical, ...missingNiceToHave]
                .map((skill) => String(skill || "").trim())
                .filter(Boolean)
        )
    );

    const handleAutoFix = async () => {
        setFixError(null);
        setIsFixing(true);
        try {
            if (allListedMissingSkills.length > 0) {
                await Promise.all(allListedMissingSkills.map((skill) => addSkillToLearningPath(skill)));
            }
            router.push("/student/learning-path");
        } catch (e: any) {
            setFixError(e?.error || e?.detail || e?.message || "Failed to build learning path.");
        } finally {
            setIsFixing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
            {/* Left Column: Extracted Skills & Summary */}
            <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{file.name}</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {extractedSkills.length} skills extracted
                                {result.extracted_data?.name ? ` · ${result.extracted_data.name}` : ""}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onReset}
                                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold border border-red-200 transition-colors"
                            >
                                Re-upload
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* All Extracted Skills */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">All Extracted Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {extractedSkills.map((skill, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium rounded-lg"
                                >
                                    {skill}
                                </span>
                            ))}
                            {extractedSkills.length === 0 && (
                                <p className="text-sm text-gray-400">No skills extracted.</p>
                            )}
                        </div>
                    </div>

                    {/* Education */}
                    {(result.extracted_data?.education_history ?? []).length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Education</h3>
                            <div className="space-y-2">
                                {result.extracted_data.education_history!.map((edu: any, i: number) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{edu.degree || edu.institution}</p>
                                            {edu.institution && edu.degree && (
                                                <p className="text-xs text-gray-500 truncate">{edu.institution}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    {(result.gap_report?.recommendations ?? []).length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Recommendations</h3>
                            <ul className="space-y-2">
                                {result.gap_report.recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <span className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-500 shrink-0" />
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Analysis */}
            <div className="lg:col-span-5 space-y-6 overflow-y-auto pr-2">
                {/* Score Card */}
                <GlassCard className="p-6 flex items-center justify-between bg-white border border-gray-200 shadow-sm">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Skill Match Score</h3>
                        <p className="text-sm text-gray-500">vs. {targetRole}</p>
                    </div>
                    <ScoreGauge score={score} />
                </GlassCard>

                {/* Critical Gaps */}
                {missingKeywords.length > 0 && (
                    <GlassCard className="p-6 border-l-4 border-l-red-500 bg-white border-y border-r border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="text-red-500" size={20} />
                            <h3 className="font-bold text-gray-900">Critical Skill Gaps</h3>
                        </div>
                        <ul className="space-y-3">
                            {missingKeywords.map((skill, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-red-500 shrink-0" />
                                    {skill}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={handleAutoFix}
                            disabled={isFixing}
                            className="w-full mt-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {isFixing ? "Adding skills and redirecting..." : <><Sparkles size={16} /> Get Learning Plan</>}
                        </button>
                        {fixError && <p className="mt-3 text-xs text-red-600">{fixError}</p>}
                    </GlassCard>
                )}

                {/* Keyword Match */}
                <GlassCard className="p-6 bg-white border border-gray-200 shadow-sm">
                    <div className="mb-4">
                        <h3 className="font-bold text-gray-900 mb-1">Target Role Keyword Match</h3>
                        <p className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md inline-block">
                            Role: {targetRole}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 size={16} className="text-green-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-green-600">Matched Skills</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {foundKeywords.length > 0 ? foundKeywords.map((k) => (
                                    <span key={k} className="px-2 py-1 rounded bg-green-50 border border-green-100 text-xs text-green-700 font-medium">
                                        {k}
                                    </span>
                                )) : (
                                    <span className="text-xs text-gray-400">No direct matches found</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <XCircle size={16} className="text-red-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-red-600">Missing Skills</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[...missingCritical, ...missingNiceToHave].slice(0, 10).map((k) => (
                                    <span key={k} className="px-2 py-1 rounded bg-red-50 border border-red-100 text-xs text-red-700 font-medium">
                                        {k}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
