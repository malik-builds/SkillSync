"use client";

import { JobContext } from "@/types/messages";
import { ExternalLink, Briefcase } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

interface JobContextBarProps {
    context: JobContext;
    onViewDetails: () => void;
}

export function JobContextBar({ context, onViewDetails }: JobContextBarProps) {
    return (
        <div className="sticky top-0 z-30 mb-4 px-4 pt-4">
            <GlassCard className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-xl p-4 flex justify-between items-center shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Briefcase size={14} className="text-gray-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Application Context</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {context.title} <span className="text-gray-500">at</span> {context.company}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${context.status === 'Interview Scheduled' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            context.status === 'Applied' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                            {context.status}
                        </span>
                    </div>
                </div>

                <button
                    onClick={onViewDetails}
                    className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
                >
                    <ExternalLink size={14} /> View Job Details
                </button>
            </GlassCard>
        </div>
    );
}
