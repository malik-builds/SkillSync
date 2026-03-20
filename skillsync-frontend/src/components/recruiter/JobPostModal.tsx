"use client";

import { useState, useEffect } from "react";
import { X, Briefcase, MapPin, DollarSign, Clock, Layout, AlignLeft, Send, CheckCircle2 } from "lucide-react";
import { createJob, updateJob } from "@/lib/api/recruiter-api";
import { JobStatus, RecruiterJob } from "@/types/recruiter";

interface JobPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (msg: string) => void;
    jobToEdit?: RecruiterJob | null;
}

export function JobPostModal({ isOpen, onClose, onSuccess, jobToEdit }: JobPostModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        department: "Engineering",
        location: "Colombo, Sri Lanka",
        workType: "OnSite" as const,
        type: "Full-time" as const,
        salaryMin: 80,
        salaryMax: 150,
        description: "",
        requirements: [] as string[],
        deadline: "",
    });

    const [skillInput, setSkillInput] = useState("");

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: jobToEdit?.title || "",
                department: jobToEdit?.department || "Engineering",
                location: jobToEdit?.location || "Colombo, Sri Lanka",
                workType: (jobToEdit?.workType as any) || "OnSite",
                type: (jobToEdit?.type as any) || "Full-time",
                salaryMin: jobToEdit?.salaryMin || 80,
                salaryMax: jobToEdit?.salaryMax || 150,
                description: jobToEdit?.description || "",
                requirements: jobToEdit?.skills || [],
                deadline: jobToEdit?.deadline && jobToEdit.deadline !== "Closed" ? jobToEdit.deadline : "",
            });
            setSkillInput("");
        }
    }, [isOpen, jobToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (jobToEdit) {
                await updateJob(jobToEdit.id, {
                    ...formData,
                    skills: formData.requirements,
                } as any);
                onSuccess("Job updated successfully!");
            } else {
                await createJob({
                    ...formData,
                    status: "Active" as JobStatus,
                    skills: formData.requirements,
                } as any);
                onSuccess("Job posted successfully!");
            }
            onClose();
        } catch (error: any) {
            console.error(jobToEdit ? "Failed to update job:" : "Failed to post job:", error);
            const msg = error.error || error.message || "Please try again.";
            alert(`Failed to ${jobToEdit ? "update" : "post"} job: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !formData.requirements.includes(skillInput.trim())) {
            setFormData({ ...formData, requirements: [...formData.requirements, skillInput.trim()] });
            setSkillInput("");
        }
    };

    const removeSkill = (skill: string) => {
        setFormData({ ...formData, requirements: formData.requirements.filter(s => s !== skill) });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <PlusIcon size={18} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{jobToEdit ? "Edit Job" : "Post New Job"}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Job Title</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    required
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Senior Frontend Engineer"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Department</label>
                            <div className="relative">
                                <Layout className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <select
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                >
                                    <option>Engineering</option>
                                    <option>Product</option>
                                    <option>Design</option>
                                    <option>Marketing</option>
                                    <option>Sales</option>
                                    <option>Operations</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Location & Type */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Work Type</label>
                            <select
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.workType}
                                onChange={e => setFormData({ ...formData, workType: e.target.value as any })}
                            >
                                <option value="OnSite">On Site</option>
                                <option value="Remote">Remote</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Job Type</label>
                            <select
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                            >
                                <option>Full-time</option>
                                <option>Contract</option>
                                <option>Internship</option>
                            </select>
                        </div>
                    </div>

                    {/* Salary */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 flex justify-between">
                            Salary Range (LKR k/mo)
                            <span className="text-blue-600">{formData.salaryMin}k - {formData.salaryMax}k</span>
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0"
                                max="500"
                                step="10"
                                value={formData.salaryMin}
                                onChange={e => setFormData({ ...formData, salaryMin: parseInt(e.target.value), salaryMax: Math.max(parseInt(e.target.value), formData.salaryMax) })}
                                className="flex-1 accent-blue-600"
                            />
                            <input
                                type="range"
                                min="0"
                                max="500"
                                step="10"
                                value={formData.salaryMax}
                                onChange={e => setFormData({ ...formData, salaryMax: parseInt(e.target.value), salaryMin: Math.min(parseInt(e.target.value), formData.salaryMin) })}
                                className="flex-1 accent-blue-600"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Description</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 text-gray-400" size={16} />
                            <textarea
                                required
                                rows={4}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="Describe the role and responsibilities..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Required Skills</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Add a skill (e.g. React, Python)"
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                            />
                            <button
                                type="button"
                                onClick={addSkill}
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.requirements.map(skill => (
                                <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                                    {skill}
                                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-blue-900">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Deadline */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Application Deadline (Optional)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.deadline}
                                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (jobToEdit ? "Updating..." : "Posting...") : <><Send size={16} /> {jobToEdit ? "Update Job" : "Post Job"}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PlusIcon({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}
