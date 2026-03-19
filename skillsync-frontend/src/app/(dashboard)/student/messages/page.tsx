"use client";

import { useEffect, useRef, useState } from "react";
import { ChatList } from "@/components/student/messages/ChatList";
import { JobContextBar } from "@/components/student/messages/JobContextBar";
import { MessageBubble } from "@/components/student/messages/MessageBubble";
import { SmartReply } from "@/components/student/messages/SmartReply";
import { SafetyWarning } from "@/components/student/messages/SafetyWarning";
import { Conversation, Message } from "@/types/messages";
import { Send, Paperclip, Smile } from "lucide-react";
import { useApi } from "@/lib/hooks/useApi";
import { getConversations, markConversationRead, sendMessage as sendMessageApi } from "@/lib/api/student-api";

export default function MessagesPage() {
    const { data: fetchedConversations, loading, error, refetch } = useApi(() => getConversations(), []);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string>("");
    const [inputText, setInputText] = useState("");
    const threadRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const list = fetchedConversations ?? [];
        setConversations(list as Conversation[]);
        if (!activeId && list.length > 0) {
            setActiveId(list[0].id);
        }
    }, [fetchedConversations, activeId]);

    useEffect(() => {
        if (threadRef.current) {
            threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
    }, [activeId, conversations]);

    const convoList = conversations ?? [];
    const effectiveActiveId = activeId || convoList[0]?.id || "";
    const activeConversation = convoList.find(c => c.id === effectiveActiveId) || convoList[0];

    const syncReadState = async (id: string) => {
        if (!id) return;
        setConversations((prev) =>
            prev.map((c) =>
                c.id === id
                    ? {
                        ...c,
                        unreadCount: 0,
                        messages: c.messages.map((m) =>
                            m.sender === "them" ? { ...m, isRead: true } : m
                        ),
                    }
                    : c
            )
        );
        try {
            await markConversationRead(id);
        } catch {
            // Keep UI responsive even if mark-read call fails.
        }
    };

    const openConversation = (id: string) => {
        setActiveId(id);
        void syncReadState(id);
    };

    // Ensure the first auto-opened conversation is also persisted as read.
    useEffect(() => {
        if (effectiveActiveId) {
            void syncReadState(effectiveActiveId);
        }
    }, [effectiveActiveId]);

    const handleSend = async () => {
        if (!inputText.trim() || !activeConversation) return;

        const trimmed = inputText.trim();
        setInputText("");

        const optimisticMessage: Message = {
            id: `local-${Date.now()}`,
            sender: "me",
            text: trimmed,
            timestamp: new Date().toISOString(),
            type: "text",
            isRead: true,
        };

        setConversations((prev) =>
            prev.map((c) =>
                c.id === activeConversation.id
                    ? {
                        ...c,
                        messages: [...(c.messages || []), optimisticMessage],
                        lastMessageAt: new Date().toISOString(),
                    }
                    : c
            )
        );

        try {
            await sendMessageApi(activeConversation.id, trimmed);
        } catch {
            // Roll back optimistic message if send fails.
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === activeConversation.id
                        ? {
                            ...c,
                            messages: (c.messages || []).filter((m) => m.id !== optimisticMessage.id),
                        }
                        : c
                )
            );
        }
    };

    if (loading) return <div className="flex items-center justify-center h-[calc(100vh-80px)] text-gray-500">Loading messages...</div>;
    if (error) return <div className="flex items-center justify-center h-[calc(100vh-80px)] text-red-500">Failed to load messages. <button onClick={refetch} className="underline ml-2">Retry</button></div>;
    if (!activeConversation) return <div className="flex items-center justify-center h-[calc(100vh-80px)] text-gray-400">No conversations yet.</div>;

    return (
        <div className="h-[calc(100vh-80px)] overflow-hidden bg-gray-50 flex">
            {/* Sidebar - Chat List */}
            <div className="w-full md:w-[320px] lg:w-[380px] h-full shrink-0 border-r border-gray-200 hidden md:block bg-white">
                <ChatList
                    conversations={convoList}
                    activeId={effectiveActiveId}
                    onSelect={openConversation}
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
                <div ref={threadRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
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
                        <div className="hidden sm:block text-[10px] text-gray-400">Enter to send</div>
                        <button
                            onClick={handleSend}
                            disabled={!inputText.trim()}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Send size={12} /> Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
