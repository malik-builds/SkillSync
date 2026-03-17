"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface AvailabilityToggleProps {
    initialStatus: "looking" | "open" | "not_looking";
    onToggle?: (status: "looking" | "open" | "not_looking") => void;
}

export function AvailabilityToggle({ initialStatus, onToggle }: AvailabilityToggleProps) {
    const [status, setStatus] = useState(initialStatus);

    const isLooking = status === "looking";

    const handleToggle = () => {
        const newStatus = isLooking ? "not_looking" : "looking";
        setStatus(newStatus);
        onToggle?.(newStatus);
    };

    return (
        <div className="flex items-center gap-4">
            <div className="flex flex-col">
                <span className={`text-sm font-bold ${isLooking ? "text-green-400" : "text-gray-400"}`}>
                    {isLooking ? "🟢 Open to Work (Immediate)" : "🔴 Not Looking"}
                </span>
                {isLooking && (
                    <span className="text-[10px] text-green-400/60 uppercase tracking-wider font-medium">
                        Recruiter Visibility: High
                    </span>
                )}
            </div>

            <button
                onClick={handleToggle}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isLooking ? "bg-green-500/20 border border-green-500/50" : "bg-gray-700/50 border border-gray-600"
                    }`}
            >
                <motion.div
                    initial={false}
                    animate={{ x: isLooking ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm ${isLooking ? "bg-green-400" : "bg-gray-400"
                        }`}
                />
            </button>
        </div>
    );
}
