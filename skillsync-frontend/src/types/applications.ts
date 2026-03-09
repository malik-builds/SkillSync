export type ApplicationStatus = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected';

export interface ApplicationStep {
    label: string;
    date?: string;
    status: 'completed' | 'current' | 'pending';
}

export interface Application {
    id: string;
    jobId: string;
    jobTitle: string;
    company: string;
    logo?: string;
    location: string;
    appliedDate: string;
    status: ApplicationStatus;
    steps: ApplicationStep[];
    nextAction?: {
        type: 'interview' | 'offer' | 'feedback';
        date?: string;
        link?: string;
    };
    feedback?: {
        reason: string;
        gap: string;
    };
    matchScore: number;
}
