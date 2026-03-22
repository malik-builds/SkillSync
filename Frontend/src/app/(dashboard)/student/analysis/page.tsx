"use client";

import { useState } from "react";
import { CheckCircle, Search } from "lucide-react";

const TARGET_ROLES = [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Data Scientist",
    "Machine Learning Engineer",
    "DevOps Engineer",
    "Cloud Architect",
    "Mobile Developer",
    "UI/UX Designer",
    "Product Manager",
    "QA Engineer",
    "Cybersecurity Analyst",
    "Business Analyst",
];
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
    const [roleSearchQuery, setRoleSearchQuery] = useState("");
    const [goalError, setGoalError] = useState("");
    const [goalSaved, setGoalSaved] = useState(false);

    if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading analysis...</div>;
    if (error) return <div className="flex items-center justify-center h-64 text-red-500">Failed to load analysis.</div>;

    const radarData = data?.radarData ?? [];
    const targetRole = data?.targetRole || user?.targetRole || "Software Engineer";

    const openGoalModal = () => {
        setGoalInput(targetRole);
        setRoleSearchQuery("");
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
                        <h3 className="text-lg font-bold text-gray-900">Change Target Role</h3>
                        <p className="text-sm text-gray-500 mt-1">Select a role to refresh your skill gaps, score, and recommendations.</p>

                        {/* Search */}
                        <div className="mt-4 relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                autoFocus
                                value={roleSearchQuery}
                                onChange={(e) => setRoleSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Search roles..."
                            />
                        </div>

                        {/* Role grid */}
                        <div className="mt-3 grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                            {TARGET_ROLES.filter(r =>
                                r.toLowerCase().includes(roleSearchQuery.toLowerCase())
                            ).map(role => {
                                const isSelected = goalInput === role;
                                return (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setGoalInput(role)}
                                        className={`text-left px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                                            isSelected
                                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                                : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/40"
                                        }`}
                                    >
                                        {role}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Selected role preview */}
                        {goalInput && (
                            <p className="mt-3 text-xs text-gray-500">
                                Selected: <span className="font-bold text-blue-600">{goalInput}</span>
                            </p>
                        )}

                        {goalError && <p className="text-xs text-red-600 mt-2">{goalError}</p>}
                        {goalSaved && (
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1.5 font-semibold">
                                <CheckCircle size={14} className="text-green-500" /> Analysis updated!
                            </p>
                        )}

                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setShowGoalModal(false)}
                                disabled={updatingGoal}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void submitGoalChange()}
                                disabled={updatingGoal || goalSaved || !goalInput}
                                className={`px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-1.5 ${goalSaved ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"}`}
                            >
                                {goalSaved
                                    ? <><CheckCircle size={14} /> Done</>
                                    : updatingGoal
                                        ? "Running analysis..."
                                        : "Save & Run Analysis"
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
