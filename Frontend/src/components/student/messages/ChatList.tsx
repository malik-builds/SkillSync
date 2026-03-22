"use client";

import { Conversation } from "@/types/messages";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";

interface ChatListProps {
    conversations: Conversation[];
    activeId: string;
    onSelect: (id: string) => void;
}

export function ChatList({ conversations, activeId, onSelect }: ChatListProps) {
    return (
        <div className="h-full flex flex-col border-r border-gray-200 bg-white">
            {/* Search */}
            <div className="p-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4 px-2">Messages</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 p-2 space-y-1.5 list-none">
                {conversations.map(conv => {
                    const isActive = conv.id === activeId;
                    return (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all border group relative ${isActive
                                ? "bg-blue-50 border-blue-200 shadow-sm"
                                : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-100"
                                }`}
                        >
                            <div className="flex gap-3">
                                <div className="relative shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                                        }`}>
                                        {conv.recruiterName.charAt(0)}
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className={`text-sm font-bold truncate ${isActive ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"}`}>
                                            {conv.recruiterName}
                                        </h4>
                                        <span className="text-[10px] text-gray-400 shrink-0">
                                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate mb-1 ${isActive ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                                        {conv.messages[conv.messages.length - 1].text}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 truncate max-w-[120px]">
                                            {conv.jobContext.company}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
