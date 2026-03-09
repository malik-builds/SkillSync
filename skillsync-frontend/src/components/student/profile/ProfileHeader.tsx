import { StudentProfile } from "@/types/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { TrustBadge } from "./TrustBadge";
import { AvailabilityToggle } from "./AvailabilityToggle";
import { MapPin, Github, Linkedin, Globe } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ProfileHeaderProps {
    profile: StudentProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
    return (
        <GlassCard className="p-6 md:p-8 relative overflow-hidden group border-gray-200 shadow-md bg-white">
            {/* Background Gradient Mesh - Subtler for Light Mode */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-500" />

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start relative z-10">
                {/* Avatar */}
                <div className="relative shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                        {profile.avatarUrl ? (
                            <img
                                src={profile.avatarUrl}
                                alt={profile.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl md:text-3xl font-bold">
                                {profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                    {profile.isVerifiedStudent && (
                        <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full border border-gray-100 shadow-sm">
                            <TrustBadge type="verified_student" className="!bg-blue-50 !text-blue-600 !border-none !px-0 !py-0 !gap-0" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4 w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                                    {profile.name}
                                </h1>
                                {profile.isVerifiedStudent && <TrustBadge type="verified_student" />}
                            </div>
                            <p className="text-lg text-gray-600 mt-1 font-medium">{profile.title || profile.course || 'Student'}</p>
                            {(profile.location || profile.university) && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                    <MapPin size={14} className="text-blue-500" />
                                    {profile.location || profile.university || ''}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/preview" className="px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-medium text-gray-600 transition-colors">
                                👀 Preview Public
                            </Link>
                        </div>
                    </div>

                    {/* Socials & Availability */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
                        <div className="flex gap-3">
                            {(profile.socials?.github || profile.githubUrl) && (
                                <Link
                                    href={profile.socials?.github || profile.githubUrl || '#'}
                                    target="_blank"
                                    className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 hover:text-blue-600 text-gray-600 border border-gray-200 transition-colors"
                                >
                                    <Github size={18} />
                                </Link>
                            )}
                            {profile.socials?.linkedin && (
                                <Link
                                    href={profile.socials.linkedin}
                                    target="_blank"
                                    className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 hover:text-blue-600 text-gray-600 border border-gray-200 transition-colors"
                                >
                                    <Linkedin size={18} />
                                </Link>
                            )}
                            {profile.socials?.website && (
                                <Link
                                    href={profile.socials.website}
                                    target="_blank"
                                    className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 hover:text-blue-600 text-gray-600 border border-gray-200 transition-colors"
                                >
                                    <Globe size={18} />
                                </Link>
                            )}
                        </div>

                        <AvailabilityToggle initialStatus={profile.availability || 'open'} />
                    </div>
                </div>
            </div>

            {/* Profile Strength Nudge */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Profile Strength:</span>
                        <span className={`text-sm font-bold ${(profile.profileStrength ?? 0) > 80 ? 'text-green-600' : (profile.profileStrength ?? 0) > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {(profile.profileStrength ?? 0) > 80 ? 'All-Star' : (profile.profileStrength ?? 0) > 50 ? 'Intermediate' : 'Beginner'} ({profile.profileStrength ?? 0}%)
                        </span>
                    </div>
                    <span className="text-xs text-blue-500 font-medium hidden md:block">
                        Add 2 Projects to reach &apos;All-Star&apos; status
                    </span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${profile.profileStrength ?? 0}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${(profile.profileStrength ?? 0) > 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            (profile.profileStrength ?? 0) > 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                    />
                </div>
                <span className="text-xs text-blue-500 font-medium mt-2 block md:hidden">
                    Add 2 Projects to reach &apos;All-Star&apos; status
                </span>
            </div>
        </GlassCard>
    );
}
