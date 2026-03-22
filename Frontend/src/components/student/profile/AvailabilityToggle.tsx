"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { updateStudentProfile } from "@/lib/api/student-api";

interface AvailabilityToggleProps {
    initialStatus: "looking" | "open" | "not_looking";
    onToggle?: (status: "looking" | "open" | "not_looking") => void;
}

export function AvailabilityToggle({ initialStatus, onToggle }: AvailabilityToggleProps) {
    const [status, setStatus] = useState(initialStatus);
    const [saving, setSaving] = useState(false);

    const isLooking = status === "looking";
    const labelClass = isLooking ? "text-green-700" : "text-rose-700";
    const dotClass = isLooking ? "bg-green-500" : "bg-rose-500";

    const handleToggle = async () => {
        if (saving) return;
        const newStatus = isLooking ? "not_looking" : "looking";
        const previousStatus = status;
        setStatus(newStatus);
        onToggle?.(newStatus);

        try {
            setSaving(true);
            await updateStudentProfile({ availability: newStatus });
        } catch {
            // Roll back optimistic state if persistence fails.
            setStatus(previousStatus);
            onToggle?.(previousStatus);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <div className="flex flex-col">
                <span className={`text-sm font-bold flex items-center gap-2 ${labelClass}`}>
                    <span className={`w-3 h-3 rounded-full ${dotClass}`} />
                    {isLooking ? "Open to Work (Immediate)" : "Not Looking"}
                </span>
            </div>

            <button
                onClick={() => void handleToggle()}
                disabled={saving}
                aria-label={isLooking ? "Set availability to Not Looking" : "Set availability to Open to Work"}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${isLooking ? "bg-green-100 border border-green-300" : "bg-rose-100 border border-rose-300"
                    }`}
            >
                <motion.div
                    initial={false}
                    animate={{ x: isLooking ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm ${isLooking ? "bg-green-600" : "bg-rose-600"
                        }`}
                />
            </button>
        </div>
    );
}
