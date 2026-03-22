"use client";

import { Check, Lock, Play } from "lucide-react";
import { CourseStatus } from "@/types/learning-path";

interface TimelineNodeProps {
    status: CourseStatus;
    isLast?: boolean;
}

export function TimelineNode({ status, isLast }: TimelineNodeProps) {
    return (
        <div className="flex flex-col items-center mr-4 md:mr-8 relative h-full">
            {/* Connection Line */}
            {!isLast && (
                <div className={`absolute top-10 bottom-0 w-0.5 ${status === 'completed' ? "bg-green-500/50" : "bg-gray-200"
                    }`} />
            )}

            {/* Node Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 shrink-0 ${status === 'completed' ? "bg-green-500 border-green-500 text-white" :
                status === 'in-progress' ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110" :
                    "bg-white border-gray-200 text-gray-400"
                }`}>
                {status === 'completed' && <Check size={18} strokeWidth={3} />}
                {status === 'in-progress' && <Play size={16} fill="white" className="ml-0.5" />}
                {status === 'locked' && <Lock size={16} />}
            </div>
        </div>
    );
}
