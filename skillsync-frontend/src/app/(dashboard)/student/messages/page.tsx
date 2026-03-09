"use client";

import { useState } from "react";
import { ChatList } from "@/components/student/messages/ChatList";
import { JobContextBar } from "@/components/student/messages/JobContextBar";
import { MessageBubble } from "@/components/student/messages/MessageBubble";
import { SmartReply } from "@/components/student/messages/SmartReply";
import { SafetyWarning } from "@/components/student/messages/SafetyWarning";
import { Message } from "@/types/messages";
import { Send, Paperclip, Smile } from "lucide-react";
import { useApi } from "@/lib/hooks/useApi";
import { getConversations, sendMessage as sendMessageApi } from "@/lib/api/student-api";

export default function MessagesPage() {
    const { data: conversations, loading, error } = useApi(() => getConversations(), []);
    const [activeId, setActiveId] = useState<string>("");
    const [inputText, setInputText] = useState("");

    const convoList = conversations ?? [];
    const effectiveActiveId = activeId || convoList[0]?.id || "";
    const activeConversation = convoList.find(c => c.id === effectiveActiveId) || convoList[0];

    const handleSend = async () => {
        if (!inputText.trim() || !activeConversation) return;
        try {
            await sendMessageApi(activeConversation.id, inputText.trim());
            setInputText("");
        } catch {
            // Handle error silently for now
        }
    };

    if (loading) return <div className="flex items-center justify-center h-[calc(100vh-80px)] text-gray-500">Loading messages...</div>;
    if (error) return <div className="flex items-center justify-center h-[calc(100vh-80px)] text-red-500">Failed to load messages.</div>;
    if (!activeConversation) return <div className="flex items-center justify-center h-[calc(100vh-80px)] text-gray-400">No conversations yet.</div>;

    return (
        <div className="h-[calc(100vh-80px)] overflow-hidden bg-gray-50 flex">
            {/* Sidebar - Chat List */}
            <div className="w-full md:w-[320px] lg:w-[380px] h-full shrink-0 border-r border-gray-200 hidden md:block bg-white">
                <ChatList
                    conversations={convoList}
                    activeId={effectiveActiveId}
                    onSelect={setActiveId}
                />
            </div>

            {/* Main Chat Window */}
            <div className="flex-1 flex flex-col h-full relative bg-gray-50">
                {/* Context Bar */}
                <JobContextBar
                    context={activeConversation?.jobContext}
                    onViewDetails={() => console.log("View Details")}
                />

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
                    <SafetyWarning />

                    {activeConversation?.messages?.map(msg => (
                        <MessageBubble key={msg.id} message={msg as Message} />
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-gray-200">
                    <SmartReply onSelect={(text) => setInputText(text)} />

                    <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-2xl p-2 focus-within:border-blue-500 transition-colors shadow-sm">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                            <Paperclip size={20} />
                        </button>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none py-2 max-h-[120px] scrollbar-hide"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                            <Smile size={20} />
                        </button>
                        <button
                            onClick={handleSend}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            <Send size={18} fill="white" className="translate-x-0.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
