"use client";

import { Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { applyToJob } from "@/lib/api/student-api";

interface MobileStickyBarProps {
    jobId: string;
}

export function MobileStickyBar({ jobId }: MobileStickyBarProps) {
    const [isApplying, setIsApplying] = useState(false);
    const [applySuccess, setApplySuccess] = useState(false);

    const handleEasyApply = async () => {
        setIsApplying(true);
        try {
            const response = await applyToJob(jobId);
            if (response.success) {
                setApplySuccess(true);
                setTimeout(() => setApplySuccess(false), 3000);
            } else {
                console.error("Application failed:", response);
            }
        } catch (error: any) {
            console.error("Failed to apply to job:", error);
            if (error?.code === 404) {
                console.error("Job not found (404). JobId:", jobId);
            } else if (error?.code === 500) {
                console.error("Server error (500):", error?.error || "Internal error");
            }
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200 lg:hidden z-50">
            <button 
                onClick={handleEasyApply}
                disabled={isApplying || applySuccess}
                className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg flex items-center justify-center gap-2 transition-colors ${
                    applySuccess 
                        ? "bg-green-600 shadow-green-500/20" 
                        : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                } ${isApplying || applySuccess ? "opacity-90" : ""}`}
            >
                {isApplying ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Applying...
                    </>
                ) : applySuccess ? (
                    <>
                        <CheckCircle2 size={18} />
                        Applied!
                    </>
                ) : (
                    <>
                        <Send size={18} /> Easy Apply (Verified)
                    </>
                )}
            </button>
        </div>
    );
}
