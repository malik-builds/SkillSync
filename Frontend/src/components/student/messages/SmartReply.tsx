"use client";

import { Zap } from "lucide-react";

interface SmartReplyProps {
    onSelect: (reply: string) => void;
}

const SUGGESTIONS = [
    "Yes, I am available.",
    "Could we please reschedule?",
    "Here is my portfolio link.",
    "Thank you for the update!"
];

export function SmartReply({ onSelect }: SmartReplyProps) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-thin scrollbar-thumb-gray-200">
            <div className="flex items-center gap-1 text-yellow-600 shrink-0 px-2">
                <Zap size={14} fill="currentColor" />
                <span className="text-[10px] font-bold uppercase">Quick Reply</span>
            </div>
            {SUGGESTIONS.map((reply, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(reply)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-xs text-gray-600 hover:text-gray-900 transition-colors shadow-sm"
                >
                    {reply}
                </button>
            ))}
        </div>
    );
}
