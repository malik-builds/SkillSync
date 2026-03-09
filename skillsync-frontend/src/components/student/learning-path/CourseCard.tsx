"use client";

import { LearningNode } from "@/types/learning-path";
import { GlassCard } from "@/components/ui/GlassCard";
import { Play, Lock, CheckCircle2, ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CourseCardProps {
    node: LearningNode;
}

export function CourseCard({ node }: CourseCardProps) {
    const [showResources, setShowResources] = useState(false);
    const isLocked = node.status === 'locked';
    const isActive = node.status === 'in-progress';
    const isCompleted = node.status === 'completed';

    return (
        <GlassCard className={`relative transition-all duration-300 ${isActive ? "border-l-4 border-l-blue-500 shadow-md translate-x-1 bg-white" :
            isLocked ? "bg-gray-50 border border-gray-200 opacity-60" : "border-l-4 border-l-green-500 bg-white"
            } p-5 mb-8 w-full border-y border-r border-gray-200 shadow-sm`}>

            {/* Locked Overlay */}
            {isLocked && (
                <div className="absolute inset-0 bg-white/40 z-10 pointer-events-none" />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                {/* Left: Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{node.provider}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{node.duration}</span>
                        {isActive && (
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 animate-pulse">
                                Current Focus
                            </span>
                        )}
                    </div>

                    <h3 className={`text-lg font-bold mb-2 ${isCompleted ? "text-gray-400 line-through decoration-green-500/50" : "text-gray-900"}`}>
                        {node.title}
                    </h3>

                    {/* Match Boost Badge */}
                    {node.matchBoost && !isCompleted && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100 text-xs font-medium mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            Completing this boosts match score by +{node.matchBoost}%
                        </div>
                    )}

                    {/* Locked Reason */}
                    {isLocked && node.prerequisites && (
                        <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded border border-yellow-100 mt-2">
                            <Lock size={14} />
                            <span>Complete <strong>{node.prerequisites[0]}</strong> to unlock this module.</span>
                        </div>
                    )}

                    {/* Active Progress */}
                    {isActive && node.progress !== undefined && (
                        <div className="mt-4 max-w-md">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{node.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div style={{ width: `${node.progress}%` }} className="h-full bg-blue-600 rounded-full" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col items-end gap-3 min-w-[140px]">
                    {isActive ? (
                        <button className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                            <Play size={16} fill="white" /> Resume
                        </button>
                    ) : isCompleted ? (
                        <button className="w-full py-2 rounded-lg bg-green-50 text-green-600 font-medium border border-green-200 flex items-center justify-center gap-2 cursor-default">
                            <CheckCircle2 size={16} /> Completed
                        </button>
                    ) : (
                        <button disabled className="w-full py-2 rounded-lg bg-gray-50 text-gray-400 font-medium border border-gray-200 flex items-center justify-center gap-2 cursor-not-allowed">
                            <Lock size={16} /> Locked
                        </button>
                    )}

                    {/* Resources Dropdown */}
                    {!isLocked && (
                        <div className="relative w-full">
                            <button
                                onClick={() => setShowResources(!showResources)}
                                className="w-full py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-xs text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center gap-1 shadow-sm"
                            >
                                Resources <ChevronDown size={14} className={`transition-transform ${showResources ? "rotate-180" : ""}`} />
                            </button>

                            <AnimatePresence>
                                {showResources && node.resources && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-20"
                                    >
                                        {node.resources.map((res, i) => (
                                            <a
                                                key={i}
                                                href={res.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors border-b border-gray-100 last:border-0 flex items-center justify-between group"
                                            >
                                                {res.label}
                                                <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}
