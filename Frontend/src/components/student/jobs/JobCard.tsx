"use client";

import { JobPosting, JobMatchAndAnalysis } from "@/types/jobs";
import { MapPin, Briefcase, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface JobCardProps {
    job: JobPosting & {
        matchScore?: number;
        matchedSkills?: string[];
        missingSkills?: string[];
        postedDate?: string;
        department?: string;
        work_type?: string;
    };
    match?: JobMatchAndAnalysis;
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(2);
    return `${day}/${month}/${year}`;
}

export function JobCard({ job, match }: JobCardProps) {
    const matchScore = job.matchScore ?? match?.matchScore ?? 0;
    const matchColor = matchScore >= 80
        ? "bg-green-50 text-green-700 border-green-200"
        : matchScore >= 50
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-red-50 text-red-600 border-red-200";

    const dateStr = job.postedAt || job.postedDate;
    const formattedDate = formatDate(dateStr);
    const jobType = job.type || (job as any).work_type || "Full-Time";

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5">
            <div className="flex items-start justify-between gap-4">
                {/* Left: Logo + Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Company Logo */}
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden border border-gray-100">
                        {job.logo
                            ? <img src={job.logo} alt={job.company} className="w-full h-full object-cover" />
                            : job.company?.charAt(0)?.toUpperCase() || "?"
                        }
                    </div>

                    {/* Title + Company + Department */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 leading-snug">{job.title}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-sm text-green-600 font-semibold">{job.company}</span>
                            <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        </div>
                        {job.department && (
                            <p className="text-xs text-blue-600 mt-1 truncate">{job.department}</p>
                        )}
                    </div>
                </div>

                {/* Right: Match Score + Share + Apply */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${matchColor}`}>
                        {matchScore}% Match
                    </span>
<Link
                        href={`/student/jobs/${job.id}`}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
                    >
                        Apply <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            {/* Bottom: Job type + Location + Date */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <Briefcase size={13} />
                        <span>{jobType}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin size={13} />
                        <span>{job.location || "Sri Lanka"}</span>
                    </div>
                </div>
                {formattedDate && (
                    <span className="text-xs text-gray-400">Posted on {formattedDate}</span>
                )}
            </div>
        </div>
    );
}
