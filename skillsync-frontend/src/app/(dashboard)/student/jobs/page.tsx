"use client";

import { JobCard } from "@/components/student/jobs/JobCard";
import { JobFilters } from "@/components/student/jobs/JobFilters";
import { useApi } from "@/lib/hooks/useApi";
import { searchJobs } from "@/lib/api/student-api";

export default function JobsPage() {
    const { data, loading, error } = useApi(() => searchJobs(), []);

    const jobs = data?.jobs ?? [];

    return (
        <div className="min-h-screen pb-20 bg-[#F5F7FA]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Next Role</h1>
                        <p className="text-gray-500">
                            {data ? (
                                <>Based on your profile, we found <span className="text-blue-600 font-bold">{data.total}</span> highly matched jobs.</>
                            ) : (
                                "Finding the best matches for you..."
                            )}
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Sidebar Filters */}
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-24">
                            <JobFilters />
                        </div>
                    </div>

                    {/* Job List */}
                    <div className="lg:col-span-9 space-y-6">
                        {loading && (
                            <div className="text-center py-12 text-gray-500">Loading jobs...</div>
                        )}
                        {error && (
                            <div className="text-center py-12 text-red-500">Failed to load jobs. Please try again.</div>
                        )}
                        <div className="grid md:grid-cols-2 gap-4">
                            {jobs.map(job => (
                                <JobCard key={job.id} job={job} />
                            ))}
                        </div>

                        {jobs.length > 0 && (
                            <button className="w-full py-4 rounded-xl bg-white hover:bg-gray-50 text-gray-600 font-bold border border-gray-200 transition-colors shadow-sm">
                                Load More Jobs
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
