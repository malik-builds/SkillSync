"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, MapPin, Briefcase, GraduationCap, Github, Target, Bookmark } from "lucide-react";
import { Candidate } from "@/types/recruiter";
import { getCandidateDetail } from "@/lib/api/recruiter-api";

interface CandidateProfileModalProps {
    candidateId: string;
    onClose: () => void;
}

export function CandidateProfileModal({ candidateId, onClose }: CandidateProfileModalProps) {
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;
        const fetchCandidate = async () => {
            setLoading(true);
            try {
                const data = await getCandidateDetail(candidateId);
                if (mounted) setCandidate(data);
            } catch (err) {
                console.error("Failed to load candidate:", err);
                if (mounted) setError(true);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchCandidate();
        return () => { mounted = false; };
    }, [candidateId]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-2xl min-h-[400px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
            </div>
        );
    }

    if (error || !candidate) {
        return (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
                    <p className="text-red-500 mb-4">Failed to load profile details.</p>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200">Close</button>
                </div>
            </div>
        );
    }

    const { name, email, location, degree, major, university, experience, github, skills, overallScore, matchScore, availabilityStatus } = candidate;
    const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                            {initials}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><MapPin size={14} />{location || "Unknown"}</span>
                                <span className="flex items-center gap-1"><Briefcase size={14} />{experience === "Fresh" ? "Fresh Graduate" : experience + " exp"}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 text-gray-700">
                    
                    {/* Top Stats */}
                    <div className="flex flex-wrap gap-4 mb-8">
                        {matchScore > 0 && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex-1 min-w-[140px]">
                                <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Match Score</p>
                                <p className="text-2xl font-extrabold text-blue-700">{matchScore}%</p>
                            </div>
                        )}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex-1 min-w-[140px]">
                            <p className="text-xs font-semibold text-emerald-600 mb-1 uppercase tracking-wide">Skill Score</p>
                            <p className="text-2xl font-extrabold text-emerald-700">{overallScore}%</p>
                        </div>
                        {github && github.active && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-1 min-w-[140px]">
                                <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">GitHub Activity</p>
                                <p className="text-2xl font-extrabold text-gray-800">{github.commits6mo} <span className="text-sm font-medium text-gray-500">commits</span></p>
                            </div>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><GraduationCap size={16} className="text-blue-600" /> Education</h3>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="font-semibold text-gray-800">{degree} in {major}</p>
                                    <p className="text-sm text-gray-500 mt-1">{university}</p>
                                    <p className="text-xs text-gray-400 mt-1">Class of {candidate.graduatingYear}</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Target size={16} className="text-blue-600" /> Key Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map(s => (
                                        <div key={s.name} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm flex items-center gap-2 shadow-sm">
                                            <span className="font-semibold text-gray-700">{s.name}</span>
                                            <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">{Math.round((s.score / 5) * 10) / 2}/5</span>
                                        </div>
                                    ))}
                                    {skills.length === 0 && <span className="text-sm text-gray-400">No skills listed.</span>}
                                </div>
                            </section>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><ExternalLink size={16} className="text-blue-600" /> Additional Details</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex border-b border-gray-100 pb-2">
                                        <span className="text-gray-500 w-32 font-medium">Email</span>
                                        <span className="font-medium text-gray-900">{email}</span>
                                    </div>
                                    <div className="flex border-b border-gray-100 pb-2">
                                        <span className="text-gray-500 w-32 font-medium">Availability</span>
                                        <span className="font-medium text-gray-900">{availabilityStatus}</span>
                                    </div>
                                    <div className="flex border-b border-gray-100 pb-2">
                                        <span className="text-gray-500 w-32 font-medium">Expected Salary</span>
                                        <span className="font-medium text-gray-900">
                                            {candidate.salaryMin > 0 && candidate.salaryMax > 0 
                                                ? `${candidate.salaryMin}k - ${candidate.salaryMax}k LKR/mo`
                                                : "Not specified"}
                                        </span>
                                    </div>
                                    {candidate.githubUrl && (
                                        <div className="flex pb-2">
                                            <span className="text-gray-500 w-32 font-medium">GitHub</span>
                                            <a href={candidate.githubUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1">
                                                View Profile <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
