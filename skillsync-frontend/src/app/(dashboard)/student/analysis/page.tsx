"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { AnalysisHeader } from "@/components/student/analysis/AnalysisHeader";
import { SkillRadar } from "@/components/student/analysis/SkillRadar";
import { AnalysisTabs } from "@/components/student/analysis/AnalysisTabs";
import { useApi } from "@/lib/hooks/useApi";
import { getAnalysisOverview } from "@/lib/api/student-api";
import { useAuth } from "@/lib/auth/AuthContext";
import { setTargetRole } from "@/lib/api/auth-api";

export default function AnalysisPage() {
    const { user, refreshUser } = useAuth();
    const { data, loading, error, refetch } = useApi(() => getAnalysisOverview(), []);
    const [updatingGoal, setUpdatingGoal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [goalInput, setGoalInput] = useState("");
    const [goalError, setGoalError] = useState("");
    const [goalSaved, setGoalSaved] = useState(false);

    if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading analysis...</div>;
    if (error) return <div className="flex items-center justify-center h-64 text-red-500">Failed to load analysis.</div>;

    const radarData = data?.radarData ?? [];
    const targetRole = data?.targetRole || user?.targetRole || "Software Engineer";

    const openGoalModal = () => {
        setGoalInput(targetRole);
        setGoalError("");
        setGoalSaved(false);
        setShowGoalModal(true);
    };

    const submitGoalChange = async () => {
        const nextRole = goalInput.trim();
        if (!nextRole) {
            setGoalError("Please enter a target role.");
            return;
        }
        if (nextRole === targetRole) {
            setShowGoalModal(false);
            return;
        }
        try {
            setUpdatingGoal(true);
            setGoalError("");
            await setTargetRole(nextRole);
            await Promise.all([refreshUser(), refetch()]);
            setGoalSaved(true);
            setTimeout(() => {
                setShowGoalModal(false);
                setGoalSaved(false);
            }, 900);
        } catch {
            setGoalError("Failed to update target role. Please try again.");
        } finally {
            setUpdatingGoal(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <AnalysisHeader
                    targetRole={targetRole}
                    onChangeGoal={openGoalModal}
                    changingGoal={updatingGoal}
                />

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left: Visualization */}
                    <div className="lg:col-span-5 space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">Visual Gap Analysis</h2>
                            <SkillRadar data={radarData} />
                        </div>

                        <div className="p-5 rounded-xl bg-blue-50 border border-blue-100">
                            <h4 className="font-bold text-blue-600 text-sm mb-2 flex items-center gap-2">
                                <span className="text-lg">💡</span> Key Insight
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Your overall market suitability for your target role is <span className="text-blue-700 font-bold text-lg">{data?.score || 0}%</span> based on real-time scraped job requirements.
                                Focus on your <span className="text-gray-900 font-bold">High Priority</span> gaps to secure more interviews.
                            </p>
                        </div>
                    </div>

                    {/* Right: Action & Strategy */}
                    <div className="lg:col-span-7">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">Strategic Action Plan</h2>
                        <AnalysisTabs />
                    </div>
                </div>
            </div>

            {showGoalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <button
                        type="button"
                        aria-label="Close goal modal"
                        onClick={() => !updatingGoal && setShowGoalModal(false)}
                        className="absolute inset-0 bg-black/40"
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-xl p-5">
                        <h3 className="text-lg font-bold text-gray-900">Change Target Goal</h3>
                        <p className="text-sm text-gray-500 mt-1">Update your role to refresh your skill analysis and recommendations.</p>

                        <div className="mt-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Target Role</label>
                            <input
                                value={goalInput}
                                onChange={(e) => setGoalInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        void submitGoalChange();
                                    }
                                }}
                                autoFocus
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="e.g. Software Engineer"
                            />
                            {goalError && <p className="text-xs text-red-600 mt-2">{goalError}</p>}
                            {goalSaved && (
                                <p className="text-xs text-green-600 mt-2 flex items-center gap-1.5 font-semibold">
                                    <CheckCircle size={16} className="text-green-500" /> Goal updated
                                </p>
                            )}
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setShowGoalModal(false)}
                                disabled={updatingGoal}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void submitGoalChange()}
                                disabled={updatingGoal || goalSaved}
                                className={`px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-1.5 ${goalSaved ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"}`}
                            >
                                {goalSaved ? <><CheckCircle size={16} className="text-white" /> Done</> : updatingGoal ? "Updating..." : "Save Goal"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
