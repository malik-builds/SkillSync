"use client";

import { ShieldAlert } from "lucide-react";

export function SafetyWarning() {
    return (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4 flex gap-3 items-start">
            <ShieldAlert className="text-yellow-500 shrink-0 mt-0.5" size={16} />
            <div className="text-xs text-gray-300">
                <span className="font-bold text-yellow-500 block mb-0.5">Safety Check</span>
                For your protection, keep communication within SkillSync until an interview is scheduled. Never share bank details or passwords.
            </div>
        </div>
    );
}
