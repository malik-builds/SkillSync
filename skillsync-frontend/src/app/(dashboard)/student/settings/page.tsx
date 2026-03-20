"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SettingsSidebar } from "@/components/student/settings/SettingsSidebar";
import { ToggleSwitch } from "@/components/student/settings/ToggleSwitch";
import { ConnectionCard } from "@/components/student/settings/ConnectionCard";
import { DangerZone } from "@/components/student/settings/DangerZone";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldCheck, Download } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import {
    changePassword,
    deleteAccount,
    getStudentProfile,
    getStudentSettings,
    removeAvatar,
    StudentSettings,
    updateStudentProfile,
    updateStudentSettings,
    uploadAvatar,
} from "@/lib/api/student-api";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MIN_AVATAR_DIMENSION = 320;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Could not read selected image."));
        };
        img.src = objectUrl;
    });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Failed to compress image."));
                return;
            }
            resolve(blob);
        }, mimeType, quality);
    });
}

async function compressAvatarImage(file: File): Promise<File> {
    if (!file.type.startsWith("image/")) {
        throw new Error("Please choose an image file.");
    }

    if (file.size <= MAX_AVATAR_BYTES) {
        return file;
    }

    const img = await loadImageFromFile(file);
    const mimeType = "image/webp";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "avatar";

    let maxDimension = Math.max(img.width, img.height);
    let quality = 0.9;
    let smallestBlob: Blob | null = null;

    for (let attempt = 0; attempt < 8; attempt++) {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Your browser could not process this image.");
        }
        ctx.drawImage(img, 0, 0, width, height);

        const blob = await canvasToBlob(canvas, mimeType, quality);
        if (!smallestBlob || blob.size < smallestBlob.size) {
            smallestBlob = blob;
        }
        if (blob.size <= MAX_AVATAR_BYTES) {
            return new File([blob], `${baseName}.webp`, { type: mimeType });
        }

        maxDimension = Math.max(MIN_AVATAR_DIMENSION, Math.floor(maxDimension * 0.8));
        quality = Math.max(0.5, quality - 0.07);
    }

    if (smallestBlob) {
        throw new Error("Image is still too large after compression. Please choose a smaller image.");
    }

    throw new Error("Failed to compress image.");
}

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("account");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [notifications, setNotifications] = useState<StudentSettings["notifications"]>({
        jobAlerts: true,
        applicationUpdates: true,
        messages: true,
        weeklyDigest: false,
    });

    const [privacy, setPrivacy] = useState<StudentSettings["privacy"]>({
        profileVisible: true,
        showGitHub: true,
        showEmail: false,
    });

    const [profile, setProfile] = useState({
        name: "",
        email: "",
        course: "",
        githubUrl: "",
        avatarUrl: "",
    });

    const [savingProfile, setSavingProfile] = useState(false);
    const [savingNotifications, setSavingNotifications] = useState(false);
    const [savingPrivacy, setSavingPrivacy] = useState(false);
    const [connectingGithub, setConnectingGithub] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [removingAvatar, setRemovingAvatar] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                setError("");
                const [settings, studentProfile] = await Promise.all([
                    getStudentSettings(),
                    getStudentProfile(),
                ]);

                setNotifications(settings.notifications);
                setPrivacy(settings.privacy);
                setProfile({
                    name: studentProfile.name || user?.fullName || "",
                    email: settings.email || studentProfile.email || user?.email || "",
                    course: studentProfile.course || "",
                    githubUrl: studentProfile.githubUrl || "",
                    avatarUrl: studentProfile.avatarUrl || user?.avatar || "",
                });
            } catch {
                setError("Failed to load settings. Please refresh and try again.");
            } finally {
                setLoading(false);
            }
        };

        void loadSettings();
    }, [user?.avatar, user?.email, user?.fullName]);

    const githubUsername = useMemo(() => {
        const raw = (profile.githubUrl || "").trim();
        if (!raw) return "";
        const cleaned = raw.replace(/\/+$/, "");
        const parts = cleaned.split("/").filter(Boolean);
        return parts[parts.length - 1] || "";
    }, [profile.githubUrl]);

    const saveProfileDetails = async () => {
        try {
            setSavingProfile(true);
            setMessage("");
            await updateStudentProfile({
                name: profile.name,
                course: profile.course,
                githubUrl: profile.githubUrl,
            });
            setMessage("Profile details updated.");
        } catch {
            setError("Failed to update profile details.");
        } finally {
            setSavingProfile(false);
        }
    };

    const saveNotifications = async () => {
        try {
            setSavingNotifications(true);
            setMessage("");
            await updateStudentSettings({ notifications });
            setMessage("Notification settings updated.");
        } catch {
            setError("Failed to save notification settings.");
        } finally {
            setSavingNotifications(false);
        }
    };

    const savePrivacy = async () => {
        try {
            setSavingPrivacy(true);
            setMessage("");
            await updateStudentSettings({ privacy });
            setMessage("Privacy settings updated.");
        } catch {
            setError("Failed to save privacy settings.");
        } finally {
            setSavingPrivacy(false);
        }
    };

    const onGitHubAction = async () => {
        try {
            setConnectingGithub(true);
            setMessage("");

            if (profile.githubUrl) {
                await updateStudentProfile({ githubUrl: "" });
                setProfile((prev) => ({ ...prev, githubUrl: "" }));
                setMessage("GitHub disconnected.");
                return;
            }

            const value = window.prompt("Enter your GitHub profile URL");
            if (!value) return;
            await updateStudentProfile({ githubUrl: value.trim() });
            setProfile((prev) => ({ ...prev, githubUrl: value.trim() }));
            setMessage("GitHub connected.");
        } catch {
            setError("Failed to update GitHub connection.");
        } finally {
            setConnectingGithub(false);
        }
    };

    const onAvatarFileChange = async (file?: File) => {
        if (!file) return;
        try {
            setUploadingAvatar(true);
            setMessage("");
            setError("");
            const compressedFile = await compressAvatarImage(file);
            const result = await uploadAvatar(compressedFile);
            setProfile((prev) => ({ ...prev, avatarUrl: result.avatarUrl || prev.avatarUrl }));
            window.dispatchEvent(new CustomEvent("student-avatar-updated", { detail: { avatarUrl: result.avatarUrl || "" } }));
            setMessage("Profile photo updated.");
        } catch (err: any) {
            const apiMessage = err?.error || err?.message;
            if (apiMessage) {
                setError(apiMessage);
            } else {
                setError("Failed to upload profile photo.");
            }
        } finally {
            setUploadingAvatar(false);
        }
    };

    const onRemoveAvatar = async () => {
        try {
            setRemovingAvatar(true);
            setMessage("");
            setError("");
            await removeAvatar();
            setProfile((prev) => ({ ...prev, avatarUrl: "" }));
            window.dispatchEvent(new CustomEvent("student-avatar-updated", { detail: { avatarUrl: "" } }));
            setMessage("Profile photo removed.");
        } catch (err: any) {
            const apiMessage = err?.error || err?.message;
            if (apiMessage) {
                setError(apiMessage);
            } else {
                setError("Failed to remove profile photo.");
            }
        } finally {
            setRemovingAvatar(false);
        }
    };

    const onDeleteAccount = async () => {
        const confirmDelete = window.prompt("Type DELETE to confirm account deletion.");
        if (confirmDelete !== "DELETE") return;

        try {
            setDeletingAccount(true);
            await deleteAccount();
            logout();
            router.push("/login");
        } catch {
            setError("Failed to delete account.");
        } finally {
            setDeletingAccount(false);
        }
    };

    const onChangePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setError("Please fill all password fields.");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }

        try {
            setChangingPassword(true);
            setMessage("");
            await changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setMessage("Password changed successfully.");
        } catch {
            setError("Failed to change password. Check your current password.");
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return <div className="min-h-[calc(100vh-80px)] flex items-center justify-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gray-50 pb-20">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

                {error && (
                    <div className="mb-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="mb-4 px-4 py-3 rounded-lg border border-green-200 bg-green-50 text-sm text-green-700">
                        {message}
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full md:w-64 shrink-0">
                        <GlassCard className="p-2 bg-white border border-gray-200 shadow-sm">
                            <SettingsSidebar activeTab={activeTab} onSelect={setActiveTab} />
                        </GlassCard>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {activeTab === 'account' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Profile Header */}
                                <div className="flex items-center gap-4 mb-8">
                                    {profile.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={profile.avatarUrl}
                                            alt="Profile"
                                            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-xl"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white border-4 border-white shadow-xl">
                                            {(profile.name || user?.fullName || "?").charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{profile.name || "—"}</h2>
                                        <p className="text-sm text-gray-500">{profile.email || "—"}</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/gif"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                void onAvatarFileChange(file);
                                                e.currentTarget.value = "";
                                            }}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingAvatar || removingAvatar}
                                            className="text-xs text-blue-600 font-medium mt-1 hover:text-blue-700 disabled:opacity-60"
                                        >
                                            {uploadingAvatar ? "Uploading..." : "Change Profile Photo"}
                                        </button>
                                        {profile.avatarUrl && (
                                            <button
                                                onClick={() => void onRemoveAvatar()}
                                                disabled={uploadingAvatar || removingAvatar}
                                                className="ml-3 text-xs text-red-600 font-medium mt-1 hover:text-red-700 disabled:opacity-60"
                                            >
                                                {removingAvatar ? "Removing..." : "Remove Photo"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Connected Accounts */}
                                <section>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Connected Accounts</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <ConnectionCard
                                            provider="GitHub"
                                            connected={!!profile.githubUrl}
                                            username={githubUsername}
                                            onAction={() => void onGitHubAction()}
                                            disabled={connectingGithub}
                                            actionLabel={connectingGithub ? "Please wait..." : undefined}
                                        />
                                    </div>
                                </section>

                                {/* Personal Details Form */}
                                <GlassCard className="p-6 space-y-4 bg-white border border-gray-200 shadow-sm">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name</label>
                                            <input
                                                type="text"
                                                value={profile.name}
                                                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email</label>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                disabled
                                                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Course</label>
                                            <input
                                                type="text"
                                                value={profile.course}
                                                onChange={(e) => setProfile((prev) => ({ ...prev, course: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">GitHub URL</label>
                                            <input
                                                type="url"
                                                value={profile.githubUrl}
                                                onChange={(e) => setProfile((prev) => ({ ...prev, githubUrl: e.target.value }))}
                                                placeholder="https://github.com/username"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => void saveProfileDetails()}
                                            disabled={savingProfile}
                                            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors border border-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {savingProfile ? "Saving..." : "Update Details"}
                                        </button>
                                    </div>
                                </GlassCard>

                                <DangerZone onDelete={() => void onDeleteAccount()} deleting={deletingAccount} />
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
                                <p className="text-gray-500 text-sm mb-6">Manage how you receive updates and alerts.</p>

                                <GlassCard className="p-6 divide-y divide-gray-100 bg-white border border-gray-200 shadow-sm">
                                    <div className="pb-4">
                                        <h3 className="text-sm font-bold text-blue-600 uppercase mb-4">Job Alerts</h3>
                                        <ToggleSwitch
                                            label="Job Alerts"
                                            checked={notifications.jobAlerts}
                                            onChange={(v) => setNotifications({ ...notifications, jobAlerts: v })}
                                            description="Receive a summary of new recommended jobs every Monday."
                                        />
                                        <ToggleSwitch
                                            label="Application Updates"
                                            checked={notifications.applicationUpdates}
                                            onChange={(v) => setNotifications({ ...notifications, applicationUpdates: v })}
                                            description="Get real-time alerts within SkillSync."
                                        />
                                    </div>
                                    <div className="pt-4">
                                        <h3 className="text-sm font-bold text-purple-600 uppercase mb-4">Application Updates</h3>
                                        <ToggleSwitch
                                            label="Messages"
                                            checked={notifications.messages}
                                            onChange={(v) => setNotifications({ ...notifications, messages: v })}
                                            description="Get notified immediately when a recruiter views your application."
                                        />
                                        <ToggleSwitch
                                            label="Weekly Digest"
                                            checked={notifications.weeklyDigest}
                                            onChange={(v) => setNotifications({ ...notifications, weeklyDigest: v })}
                                            description="Receive text messages for interview requests."
                                        />
                                    </div>
                                </GlassCard>
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => void saveNotifications()}
                                        disabled={savingNotifications}
                                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {savingNotifications ? "Saving..." : "Save Notification Preferences"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Privacy & Data</h2>
                                <p className="text-gray-500 text-sm mb-6">Control visibility and data sharing settings.</p>

                                <GlassCard className="p-6 mb-6 bg-white border border-gray-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-green-600 uppercase mb-4 flex items-center gap-2">
                                        <ShieldCheck size={16} /> Data Sharing
                                    </h3>
                                    <ToggleSwitch
                                        label="Show GitHub"
                                        checked={privacy.showGitHub}
                                        onChange={(v) => setPrivacy({ ...privacy, showGitHub: v })}
                                        description="Allow recruiters to see your linked GitHub profile."
                                    />
                                    <ToggleSwitch
                                        label="Show Email"
                                        checked={privacy.showEmail}
                                        onChange={(v) => setPrivacy({ ...privacy, showEmail: v })}
                                        description="Allow recruiters to see your email in profile views."
                                    />
                                </GlassCard>

                                <GlassCard className="p-6 bg-white border border-gray-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4">Profile Visibility</h3>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'public', label: 'Public', desc: 'Visible to recruiters.', enabled: true },
                                            { id: 'private', label: 'Private', desc: 'Only visible to you.', enabled: false },
                                        ].map(opt => (
                                            <label key={opt.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${privacy.profileVisible === opt.enabled
                                                ? "bg-blue-50 border-blue-500 shadow-sm"
                                                : "border-gray-200 hover:bg-gray-50"
                                                }`}>
                                                <input
                                                    type="radio"
                                                    name="visibility"
                                                    checked={privacy.profileVisible === opt.enabled}
                                                    onChange={() => setPrivacy({ ...privacy, profileVisible: opt.enabled })}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <div className={`text-sm font-bold ${privacy.profileVisible === opt.enabled ? "text-blue-600" : "text-gray-900"}`}>
                                                        {opt.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{opt.desc}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </GlassCard>

                                <div className="flex items-center justify-between">
                                    <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 transition-colors">
                                        <Download size={14} /> Download My Data
                                    </button>
                                    <button
                                        onClick={() => void savePrivacy()}
                                        disabled={savingPrivacy}
                                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {savingPrivacy ? "Saving..." : "Save Privacy Settings"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Login & Security</h2>
                                <p className="text-gray-500 text-sm mb-6">Update your password to keep your account secure.</p>

                                <GlassCard className="p-6 space-y-4 bg-white border border-gray-200 shadow-sm">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => void onChangePassword()}
                                            disabled={changingPassword}
                                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {changingPassword ? "Updating..." : "Change Password"}
                                        </button>
                                    </div>
                                </GlassCard>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
