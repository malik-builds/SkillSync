"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { GitBranch, Github, Trophy, Play } from "lucide-react";

interface CapstoneCardProps {
    title: string;
    description: string;
    technologies: string[];
    status: 'locked' | 'active' | 'completed';
}

export function CapstoneCard({ title, description, technologies, status }: CapstoneCardProps) {
    const isLocked = status === 'locked';
    const isActive = status === 'active';

    return (
        <GlassCard className={`relative p-6 mb-8 w-full border-y border-r border-gray-200 shadow-sm transition-all ${isActive ? "border-l-4 border-l-purple-600 bg-purple-50" :
            isLocked ? "border-l-4 border-l-gray-300 bg-gray-50 opacity-60 grayscale" : "border-l-4 border-l-green-500 bg-white"
            }`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200">
                            Capstone Project
                        </span>
                        {isActive && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                            </span>
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-600 max-w-lg">{description}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                    <Trophy size={24} />
                </div>
            </div>

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-2 mb-6">
                {technologies.map(tech => (
                    <span key={tech} className="px-2 py-1 rounded bg-white border border-gray-200 text-xs text-gray-500 font-medium">
                        {tech}
                    </span>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {isActive ? (
                    <>
                        <button className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-2">
                            <Play size={16} /> Start Project
                        </button>
                        <div className="h-4 w-[1px] bg-gray-300" />
                        <button className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2">
                            <Github size={16} /> View Template
                        </button>
                    </>
                ) : isLocked ? (
                    <button disabled className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400 font-medium border border-gray-200 cursor-not-allowed flex items-center gap-2">
                        <GitBranch size={16} /> Locked
                    </button>
                ) : (
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                        <Trophy size={16} /> Completed
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
