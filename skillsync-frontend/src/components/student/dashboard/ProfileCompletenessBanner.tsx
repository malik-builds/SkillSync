"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Upload, Github, Target, ArrowRight, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/lib/auth/AuthContext";
import Link from "next/link";
import { useState } from "react";

export function ProfileCompletenessBanner() {
    const { user } = useAuth();
    const [isDismissed, setIsDismissed] = useState(false);

    // Don't render for non-students or when dismissed
    if (!user || user.role !== "student") return null;
    if (isDismissed) return null;

    const steps = [
        {
            id: "cv",
            label: "Upload CV",
            description: "Auto-extract your skills",
            icon: <Upload size={20} />,
            completed: !!user.onboarding?.cvUploaded,
            href: "/student/cv",
        },
        {
            id: "github",
            label: "GitHub",
            description: "Connect your profile",
            icon: <Github size={20} />,
            completed: !!user.onboarding?.githubConnected,
            href: "/student/settings",
        },
        {
            id: "role",
            label: "Target Role",
            description: "Set your career goal",
            icon: <Target size={20} />,
            completed: !!user.onboarding?.targetRoleSet,
            href: "/student/settings",
        },
    ];

    const completedCount = steps.filter((s) => s.completed).length;
    // Use backend-computed value; fall back to counting steps if not yet available
    const progressPercent = user.profileCompletion ?? Math.round((completedCount / steps.length) * 100);

    // Hide when all steps are individually done OR when onboarding was fully completed
    if (completedCount >= steps.length || user.onboarding?.completed) return null;

    return (
        <GlassCard className="p-6 mb-8 border border-blue-100 bg-white/80 backdrop-blur-sm shadow-sm relative overflow-hidden">
            {/* Dismiss button */}
            <button
                onClick={() => setIsDismissed(true)}
                className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors"
                title="Dismiss"
            >
                <X size={18} />
            </button>

            {/* Header — right-padded so title never overlaps the X button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 pr-8">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-0.5">Complete Your Profile</h2>
                    <p className="text-sm text-gray-500 font-medium">
                        {completedCount} of {steps.length} steps done — finish to unlock better job matches.
                    </p>
                </div>
                <div
                    className={`shrink-0 px-3 py-1 rounded-full font-bold text-sm border shadow-sm ${
                        progressPercent >= 67
                            ? "bg-green-50 text-green-600 border-green-100"
                            : "bg-blue-50 text-blue-600 border-blue-100"
                    }`}
                >
                    {Math.round(progressPercent)}% Complete
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full mb-5 overflow-hidden relative">
                <motion.div
                    className={`absolute top-0 left-0 h-full rounded-full ${
                        progressPercent >= 67
                            ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                            : "bg-gradient-to-r from-blue-500 to-indigo-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
            </div>

            {/* Steps Grid — exactly 3 columns matching the 3 steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {steps.map((step) => (
                    <Link key={step.id} href={step.href}>
                        <div
                            className={`
                                group flex items-center justify-between p-4 rounded-xl border transition-all text-left relative overflow-hidden
                                ${step.completed
                                    ? "bg-green-50/60 border-green-100 text-green-700 cursor-default"
                                    : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md text-gray-700 hover:bg-blue-50/30 cursor-pointer"
                                }
                            `}
                        >
                            <div className="flex items-center gap-3 relative z-10">
                                <div
                                    className={`
                                        w-9 h-9 rounded-lg flex items-center justify-center transition-colors border shrink-0
                                        ${step.completed
                                            ? "bg-white border-green-100 text-green-600 shadow-sm"
                                            : "bg-gray-50 border-gray-100 text-gray-400 group-hover:text-blue-600 group-hover:bg-white group-hover:border-blue-100 shadow-sm"
                                        }
                                    `}
                                >
                                    {step.icon}
                                </div>
                                <div className="min-w-0">
                                    <span className="font-bold text-sm block mb-0.5 truncate">{step.label}</span>
                                    <span className="text-xs text-gray-400 font-medium truncate block">{step.description}</span>
                                </div>
                            </div>
                            <div className="relative z-10 pl-2 shrink-0">
                                {step.completed ? (
                                    <CheckCircle2 size={20} className="text-green-500" />
                                ) : (
                                    <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </GlassCard>
    );
}