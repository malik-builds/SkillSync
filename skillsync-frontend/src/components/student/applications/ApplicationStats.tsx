"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Send, MessageSquare, Trophy } from "lucide-react";

export function ApplicationStats() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <GlassCard className="p-4 flex flex-col items-center justify-center text-center bg-white border border-gray-200 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                    <Send size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">3</div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</div>
            </GlassCard>

            <GlassCard className="p-4 flex flex-col items-center justify-center text-center border-blue-200 bg-blue-50 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2 animate-pulse">
                    <MessageSquare size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">1</div>
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">Interview</div>
            </GlassCard>

            <GlassCard className="p-4 col-span-2 md:col-span-1 flex flex-col items-center justify-center text-center bg-white border border-gray-200 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-2">
                    <Trophy size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Offers</div>
            </GlassCard>
        </div>
    );
}
