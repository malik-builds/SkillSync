"use client";

import { ProfileHeader } from "@/components/student/profile/ProfileHeader";
import { ProfileTabs } from "@/components/student/profile/ProfileTabs";
import { useApi } from "@/lib/hooks/useApi";
import { getStudentProfile } from "@/lib/api/student-api";

export default function StudentProfilePage() {
    const { data: profile, loading, error } = useApi(() => getStudentProfile(), []);

    if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading profile...</div>;
    if (error || !profile) return <div className="flex items-center justify-center h-64 text-red-500">Failed to load profile.</div>;

    return (
        <div className="h-full bg-[#F5F7FA] pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ProfileHeader profile={profile} />
                <ProfileTabs profile={profile} />
            </div>
        </div>
    );
}
