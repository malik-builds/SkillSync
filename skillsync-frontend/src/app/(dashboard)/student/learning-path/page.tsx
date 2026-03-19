"use client";

import { useEffect, useMemo, useState } from "react";
import { CareerVelocityHeader } from "@/components/student/learning-path/CareerVelocityHeader";
import { TimelineNode } from "@/components/student/learning-path/TimelineNode";
import { CourseCard } from "@/components/student/learning-path/CourseCard";
import { CapstoneCard } from "@/components/student/learning-path/CapstoneCard";
import { ExternalLink, BookOpen, MonitorPlay } from "lucide-react";
import { useApi } from "@/lib/hooks/useApi";
import { getLearningPaths, updateNodeProgress } from "@/lib/api/student-api";

export default function LearningPathPage() {
    const { data: paths, loading, error, refetch } = useApi(() => getLearningPaths(), []);
    const [activePathId, setActivePathId] = useState<string>("");
    const [updatingNodeId, setUpdatingNodeId] = useState<string | null>(null);

    useEffect(() => {
        if (!activePathId && paths && paths.length > 0) {
            setActivePathId(paths[0].id);
        }
    }, [paths, activePathId]);

    const path = useMemo(() => {
        if (!paths || paths.length === 0) return undefined;
        if (!activePathId) return paths[0];
        return paths.find((p) => p.id === activePathId) || paths[0];
    }, [paths, activePathId]);

    const nodes = path?.nodes ?? [];

    const handleMarkDone = async (pathId: string, nodeId: string) => {
        try {
            setUpdatingNodeId(nodeId);
            await updateNodeProgress(pathId, nodeId, 100, true);
            refetch();
        } finally {
            setUpdatingNodeId(null);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading learning path...</div>;
    if (error || !path) return <div className="flex items-center justify-center h-64 text-red-500">Failed to load learning path.</div>;

    return (
        <div className="min-h-screen pb-20 bg-[#F5F7FA]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Action Plan</h1>
                    <p className="text-gray-500">Your personalized roadmap to become a {path.jobGoal || "professional"}. Complete each task to progress.</p>
                </div>

                {(paths?.length || 0) > 1 && (
                    <div className="mb-5 flex flex-wrap gap-2">
                        {paths?.map((p) => {
                            const active = p.id === path?.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setActivePathId(p.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${active
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-700"
                                        }`}
                                >
                                    {p.title || p.jobGoal || "Learning Path"}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Progress</span>
                            <span className="text-sm font-medium text-gray-700">{path.completedCourses} / {path.totalCourses} Tasks</span>
                        </div>
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-500"
                                style={{ width: `${path.progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {nodes.map((node, index) => {
                            const isCompleted = node.status === 'completed';
                            const isActive = node.status === 'in-progress';

                            return (
                                <div
                                    key={node.id}
                                    className={`p-5 flex items-start gap-4 transition-colors ${isActive ? 'bg-blue-50/30' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <button
                                        className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : isActive
                                                ? 'border-blue-500 bg-white'
                                                : 'border-gray-300 bg-gray-50'
                                            }`}
                                    >
                                        {isCompleted && (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>

                                    <div className="flex-1">
                                        <h3 className={`text-base font-bold mb-1 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                                            }`}>
                                            {node.title}
                                        </h3>
                                        <p className={`text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {node.description || "Complete this required task to advance your skillset."}
                                        </p>
                                    </div>

                                    {isActive && (
                                        <button
                                            onClick={() => handleMarkDone(path.id, node.id)}
                                            disabled={updatingNodeId === node.id}
                                            className="shrink-0 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                                        >
                                            {updatingNodeId === node.id ? "Saving..." : "Mark as done"}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
