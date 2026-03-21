"use client";

import { Application } from "@/types/applications";
import { GlassCard } from "@/components/ui/GlassCard";
import { PipelineStepper } from "./PipelineStepper";
import { MoreHorizontal, MessageSquare, Video, FileText, AlertCircle, Eye, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { InterviewPrepModal } from "./InterviewPrepModal";

interface ApplicationCardProps {
    app: Application;
}

export function ApplicationCard({ app }: ApplicationCardProps) {
    const [isPrepOpen, setIsPrepOpen] = useState(false);

    const normalizedStatus = app.status.toLowerCase();
    const isInterview = normalizedStatus === 'interview';
    const isRejected = normalizedStatus === 'rejected';
    const isApplied = normalizedStatus === 'applied';
    const isHired = normalizedStatus === 'hired';
    const isOffer = normalizedStatus === 'offer';

    return (
        <>
            <GlassCard className="p-6 relative group border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-700">
                            {app.logo ? <img src={app.logo} alt={app.company} className="w-full h-full object-cover rounded-xl" /> : app.company.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">{app.jobTitle}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{app.company}</span>
                                <span>•</span>
                                <span>Applied: {app.appliedDate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                </div>

                {/* Stepper */}
                <div className="mb-8 pl-2 pr-4">
                    {!isRejected && !isHired && <PipelineStepper steps={app.steps} />}
                    {isRejected && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3">
                            <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-red-600 mb-1">Application Status: Not Selected</h4>
                                <p className="text-sm text-gray-600">
                                    {app.feedback?.gap ?
                                        `Feedback: The role requires stronger ${app.feedback.gap} skills.` :
                                        "Thank you for your interest. We decided to move forward with other candidates."}
                                </p>
                            </div>
                        </div>
                    )}
                    {isHired && (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                            <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-emerald-700 mb-1">Application Status: Hired</h4>
                                <p className="text-sm text-gray-700">
                                    Congratulations. You have been marked as hired for this role.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Context Aware Action Area */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    {isInterview && (
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                    <Video size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-0.5">Interview Scheduled</h4>
                                    <p className="text-xs text-gray-500">
                                        {app.nextAction?.date ? `Date: ${app.nextAction.date}` : "Interview details will appear here when shared."}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => setIsPrepOpen(true)}
                                    className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <FileText size={16} /> Prep
                                </button>
                                {app.nextAction?.link ? (
                                    <a
                                        href={app.nextAction.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        Join Meeting
                                    </a>
                                ) : (
                                    <button
                                        disabled
                                        className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-gray-300 text-sm font-bold text-white cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        Meeting Link Pending
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {isApplied && (
                        <div className="flex items-center gap-3">
                            <Eye size={16} className="text-blue-500" />
                            <span className="text-sm text-gray-600">
                                <span className="font-bold text-gray-900">Status:</span> Your application has been submitted and is awaiting review.
                            </span>
                        </div>
                    )}

                    {isRejected && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">AI Recommendation: Explore Junior roles matching your profile.</span>
                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Find Similar Jobs</button>
                        </div>
                    )}

                    {isOffer && (
                        <div className="flex items-center gap-3">
                            <Eye size={16} className="text-green-600" />
                            <span className="text-sm text-gray-600">
                                <span className="font-bold text-gray-900">Offer:</span> Recruiter moved your application to offer stage.
                            </span>
                        </div>
                    )}

                    {isHired && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Great news: this role is confirmed as hired. Keep this for your records.</span>
                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View Job Details</button>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
                    <button
                        disabled={isApplied || isRejected || isHired}
                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${isApplied || isRejected || isHired ? "text-gray-400 cursor-not-allowed" : "text-gray-500 hover:text-gray-900"
                            }`}
                    >
                        <MessageSquare size={16} /> Message Recruiter
                    </button>
                    <div className="h-4 w-[1px] bg-gray-200" />
                    <button className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                        View Job Details
                    </button>
                </div>
            </GlassCard>

            <InterviewPrepModal
                isOpen={isPrepOpen}
                onClose={() => setIsPrepOpen(false)}
                jobTitle={app.jobTitle}
                company={app.company}
                tags={app.tags || []}
            />
        </>
    );
}
