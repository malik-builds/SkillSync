"use client";

import { Message } from "@/types/messages";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";

interface MessageBubbleProps {
    message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isMine = message.sender === 'user';
    const isSystem = message.sender === 'system' || message.type === 'system_event';

    const parseDate = (ts: any) => {
        if (!ts) return new Date();
        const d = new Date(ts);
        if (!isNaN(d.getTime())) return d;

        // Handle HH:mm format specifically
        if (typeof ts === 'string' && /^\d{1,2}:\d{2}$/.test(ts)) {
            const now = new Date();
            const [h, m] = ts.split(':').map(Number);
            now.setHours(h, m, 0, 0);
            return now;
        }
        return new Date();
    };

    if (isSystem) {
        return (
            <div className="flex justify-center my-6">
                <div className="bg-gray-100 border border-gray-200 px-4 py-2 rounded-full text-xs text-gray-500 flex items-center gap-2 shadow-sm">
                    <AlertCircle size={12} className="text-blue-600" />
                    {message.text}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col mb-4 ${isMine ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isMine
                ? 'bg-blue-600 text-white rounded-br-none shadow-blue-500/20'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                }`}>
                {message.text}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">
                {format(parseDate(message.timestamp), 'h:mm a')}
            </span>
        </div>
    );
}
