"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { CheckCircle2, XCircle } from "lucide-react";

interface ConnectionCardProps {
    provider: 'GitHub' | 'LinkedIn';
    connected: boolean;
    username?: string;
    onAction: () => void;
}

export function ConnectionCard({ provider, connected, username, onAction }: ConnectionCardProps) {
    return (
        <GlassCard className="p-4 flex items-center justify-between bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${provider === 'GitHub' ? "bg-gray-700 text-white" : "bg-blue-600 text-white"
                    }`}>
                    {provider === 'GitHub' ? 'G' : 'in'}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {provider}
                        {connected ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-gray-400" />}
                    </h4>
                    <p className="text-xs text-gray-500">
                        {connected ? `Connected as ${username}` : "Not connected"}
                    </p>
                </div>
            </div>

            <button
                onClick={onAction}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${connected
                    ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
            >
                {connected ? "Disconnect" : "Connect"}
            </button>
        </GlassCard>
    );
}
