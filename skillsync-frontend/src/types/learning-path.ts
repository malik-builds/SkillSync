export type CourseStatus = 'locked' | 'in-progress' | 'completed';

export interface Resource {
    label: string;
    url: string;
    type: 'video' | 'article' | 'documentation';
}

export interface LearningNode {
    id: string;
    title: string;
    provider: string;
    duration: string;
    status: CourseStatus;
    type: 'course' | 'project';
    matchBoost?: number;
    description?: string;
    progress?: number; // 0-100
    resources?: Resource[];
    prerequisites?: string[];
    thumbnail?: string;
    skills?: string[];
}

export interface LearningPath {
    id: string;
    jobGoal: string;
    companyTarget?: string;
    progress: number;
    totalCourses: number;
    completedCourses: number;
    nodes: LearningNode[];
}
