export type SenderType = 'user' | 'recruiter' | 'system';
export type MessageType = 'text' | 'system_event';

export interface JobContext {
    id: string;
    title: string;
    company: string;
    status: string; // e.g., 'Interview Scheduled', 'Applied'
    logo?: string;
}

export interface Message {
    id: string;
    text: string;
    sender: SenderType;
    timestamp: string;
    type: MessageType;
    isRead: boolean;
}

export interface Conversation {
    id: string;
    recruiterId: string;
    recruiterName: string;
    recruiterAvatar?: string;
    jobContext: JobContext;
    messages: Message[];
    unreadCount: number;
    lastMessageAt: string;
}
