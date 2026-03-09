"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Upload, Github, Linkedin, Target, ArrowRight, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/lib/auth/AuthContext";
import Link from "next/link";
import { useState } from "react";

export function ProfileCompletenessBanner() {
    const { user } = useAuth();
    const [isDismissed, setIsDismissed] = useState(false);

    // Don't render for non-students, fully complete profiles, or when dismissed
    if (!user || user.role !== "student") return null;
    if (user.profileCompletion >= 100) return null;
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
            href: "/student/profile",
        },
        {
            id: "linkedin",
            label: "LinkedIn",
            description: "Import experience",
            icon: <Linkedin size={20} />,
            completed: !!user?.linkedinId,
            href: "/student/profile",
        },
        {
            id: "role",
            label: "Target Role",
            description: "Set your career goal",
            icon: <Target size={20} />,
            completed: !!user.onboarding?.targetRoleSet,
            href: "/student/profile",
        },
    ];

    const completedCount = steps.filter((s) => s.completed).length;
    const progressPercent = user.profileCompletion;

    return (
        <GlassCard className="p-8 mb-8 border border-blue-100 bg-white/80 backdrop-blur-sm shadow-sm relative overflow-hidden">
            {/* Dismiss button */}
            <button
                onClick={() => setIsDismissed(true)}
                className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors"
                title="Dismiss"
            >
                <X size={18} />
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Profile Completeness</h2>
                    <p className="text-sm text-gray-500 font-medium">
                        Complete your profile to get better job matches and recruiter visibility.
                    </p>
                </div>
                <div
                    className={`px-4 py-1.5 rounded-full font-bold text-sm border shadow-sm ${progressPercent >= 80
                            ? "bg-green-50 text-green-600 border-green-100"
                            : "bg-blue-50 text-blue-600 border-blue-100"
                        }`}
                >
                    {Math.round(progressPercent)}% Complete
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-100 rounded-full mb-8 overflow-hidden relative border border-gray-200">
                <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {steps.map((step) => (
                    <Link key={step.id} href={step.href}>
                        <div
                            className={`
                                group flex items-center justify-between p-5 rounded-xl border transition-all text-left relative overflow-hidden
                                ${step.completed
                                    ? "bg-green-50/50 border-green-100 text-green-700 shadow-sm"
                                    : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md text-gray-700 hover:bg-blue-50/30 cursor-pointer"
                                }
                            `}
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <div
                                    className={`
                                        w-10 h-10 rounded-lg flex items-center justify-center transition-colors border
                                        ${step.completed
                                            ? "bg-white border-green-100 text-green-600 shadow-sm"
                                            : "bg-gray-50 border-gray-100 text-gray-500 group-hover:text-blue-600 group-hover:bg-white group-hover:border-blue-100 shadow-sm"
                                        }
                                    `}
                                >
                                    {step.icon}
                                </div>
                                <div>
                                    <span className="font-bold text-sm block mb-0.5">{step.label}</span>
                                    <span className="text-xs text-gray-400 font-medium">{step.description}</span>
                                </div>
                            </div>
                            <div className="relative z-10 pl-2">
                                {step.completed ? (
                                    <CheckCircle2 size={24} className="text-green-500" />
                                ) : (
                                    <ArrowRight size={20} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </GlassCard>
    );
}