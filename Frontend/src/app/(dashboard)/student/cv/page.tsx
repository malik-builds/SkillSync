"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText } from "lucide-react";
import { CVUploader } from "@/components/student/cv/CVUploader";
import { CVAnalysisDashboard } from "@/components/student/cv/CVAnalysisDashboard";
import { CVBuilder } from "@/components/student/cv/CVBuilder";
import { useAuth } from "@/lib/auth/AuthContext";
import { analyzeProfile } from "@/lib/api/auth-api";
import { getAnalysisOverview, getCVProfile } from "@/lib/api/student-api";
import type { AnalysisResponse } from "@/types/user";

// Reusable analyzing overlay (same style as onboarding)
function AnalyzingOverlay() {
    const phases = [
        "Reading your CV...",
        "Extracting skills & experience...",
        "Analyzing GitHub profile...",
        "Calculating skill gaps...",
        "Building your career roadmap...",
    ];
    const [phaseIdx, setPhaseIdx] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setPhaseIdx((i) => (i + 1) % phases.length), 2200);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col items-center gap-10">
            <div className="relative flex items-center justify-center">
                <motion.div
                    className="relative w-44 h-44"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                    <div className="absolute inset-0 rounded-full border-[7px] border-blue-600/20" />
                    <div className="absolute inset-0 rounded-full border-[5px] border-blue-500/35" style={{ transform: "rotate(15deg)" }} />
                    <div className="absolute inset-[4px] rounded-full border-[5px] border-blue-600/55" style={{ transform: "rotate(-10deg)" }} />
                    <div className="absolute inset-[8px] rounded-full border-[4px] border-blue-400/25" style={{ transform: "rotate(30deg)" }} />
                    <div className="absolute inset-[2px] rounded-full border-[3px] border-indigo-600/50" style={{ transform: "rotate(5deg)" }} />
                    <div className="absolute inset-[6px] rounded-full border-[3px] border-blue-500/40" style={{ transform: "rotate(-20deg)" }} />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[38%]">
                        <div className="w-5 h-5 bg-white rounded-full shadow-[0_0_18px_8px_rgba(255,255,255,0.8),0_0_40px_16px_rgba(59,130,246,0.4)]" />
                    </div>
                </motion.div>
                <div className="absolute inset-0 rounded-full bg-blue-600/10 blur-2xl" />
                <div className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 w-24 h-3 bg-blue-600/15 rounded-full blur-lg" />
            </div>
            <div className="text-center space-y-2">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={phaseIdx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                        className="text-slate-800 text-lg font-semibold tracking-wide"
                    >
                        {phases[phaseIdx]}
                    </motion.p>
                </AnimatePresence>
                <p className="text-slate-400 text-sm">This may take a moment</p>
            </div>
        </div>
    );
}

export default function CVPage() {
    const { user, refreshUser } = useAuth();
    const [mode, setMode] = useState<"auditor" | "architect">("auditor");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLoadingStoredStats, setIsLoadingStoredStats] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
    const [forceUploader, setForceUploader] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadStoredCvStats = async () => {
            if (
                mode !== "auditor" ||
                !user?.onboarding?.cvUploaded ||
                analysisResult ||
                uploadedFile ||
                forceUploader
            ) {
                return;
            }

            setIsLoadingStoredStats(true);
            try {
                const [overview, profile] = await Promise.all([
                    getAnalysisOverview(),
                    getCVProfile(),
                ]);

                const skillNames = (profile.skills || []).flatMap((group) => group.items || []);
                const missingCritical = (overview as any)?.missingCritical || [];
                const recommendations = ((overview.recommendations || []) as any[])
                    .map((r) => (typeof r?.title === "string" ? r.title : ""))
                    .filter(Boolean);

                setAnalysisResult({
                    extracted_data: {
                        skills: skillNames,
                        experience: [],
                        education_history: (profile.education || []).map((e: any) => ({
                            degree: e?.degree || "",
                            institution: e?.institution || "",
                        })),
                        name: profile.fullName || user.fullName,
                    },
                    market_requirements: {
                        must_have: [],
                        nice_to_have: [],
                    },
                    gap_report: {
                        score: overview.score || 0,
                        status: overview.score >= 80 ? "strong" : overview.score >= 50 ? "good" : "needs_work",
                        missing_critical: missingCritical,
                        recommendations,
                    },
                    status: "completed",
                });

                setUploadedFile(new File([], user.cvFileName || "Uploaded CV.pdf", { type: "application/pdf" }));
            } catch {
                // If preloading fails, keep uploader available as fallback.
            } finally {
                setIsLoadingStoredStats(false);
            }
        };

        loadStoredCvStats();
    }, [mode, user, analysisResult, uploadedFile, forceUploader]);

    const handleUpload = async (file: File) => {
        setForceUploader(false);
        setUploadedFile(file);
        setIsAnalyzing(true);
        setError(null);
        try {
            const githubUrl = user?.githubUsername
                ? `https://github.com/${user.githubUsername}`
                : undefined;
            const result = await analyzeProfile(file, githubUrl, user?.targetRole || undefined);
            setAnalysisResult(result);
            // Refresh auth context so banner updates (cvUploaded becomes true)
            await refreshUser();
        } catch (e: any) {
            setError(e?.error || e?.detail || e?.message || "Analysis failed. Please try again.");
            setUploadedFile(null);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setForceUploader(true);
        setUploadedFile(null);
        setAnalysisResult(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8 pb-24 relative overflow-hidden">
            {/* Analyzing overlay */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 z-50 backdrop-blur-md bg-white/70 flex items-center justify-center"
                    >
                        <AnalyzingOverlay />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Career Optimization Station</h1>
                    <p className="text-gray-500">Analyze your existing CV or build a perfect one from scratch.</p>
                </div>
                <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setMode("auditor")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all font-medium ${mode === "auditor" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
                    >
                        <FileText size={16} /> Auditor
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {mode === "auditor" ? (
                    isLoadingStoredStats ? (
                        <div className="flex flex-col items-center justify-center min-h-[50vh]">
                            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-4 text-sm font-medium text-gray-500">Loading your CV stats...</p>
                        </div>
                    ) :
                    analysisResult && uploadedFile ? (
                        <CVAnalysisDashboard
                            result={analysisResult}
                            file={uploadedFile}
                            targetRole={user?.targetRole || "Software Engineer"}
                            onReset={handleReset}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                            {error && (
                                <div className="w-full max-w-md px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                                    {error}
                                </div>
                            )}
                            <CVUploader onUpload={handleUpload} />
                            <div className="flex items-center gap-4 w-full max-w-md">
                                <div className="h-px bg-gray-200 flex-1" />
                                <span className="text-gray-400 text-sm font-medium">OR</span>
                                <div className="h-px bg-gray-200 flex-1" />
                            </div>
                            <button
                                onClick={() => setMode("architect")}
                                className="px-8 py-4 rounded-2xl bg-white border border-gray-200 text-gray-900 font-bold shadow-sm hover:shadow-md hover:border-blue-300 transition-all transform hover:scale-[1.01]"
                            >
                                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    Create CV from Scratch
                                </span>
                            </button>
                        </div>
                    )
                ) : (
                    <CVBuilder />
                )}
            </div>
        </div>
    );
}
