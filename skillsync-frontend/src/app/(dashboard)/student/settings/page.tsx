"use client";

import { useState } from "react";
import { SettingsSidebar } from "@/components/student/settings/SettingsSidebar";
import { ToggleSwitch } from "@/components/student/settings/ToggleSwitch";
import { ConnectionCard } from "@/components/student/settings/ConnectionCard";
import { DangerZone } from "@/components/student/settings/DangerZone";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldCheck, Download } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

export default function SettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("account");

    const [notifications, setNotifications] = useState({
        emailDigest: true,
        inApp: true,
        appUpdates: true,
        sms: false
    });

    const [privacy, setPrivacy] = useState({
        universityData: true,
        anonymize: false,
        visibility: "open"
    });

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gray-50 pb-20">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

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
                                    <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white border-4 border-white shadow-xl">
                                        {user?.fullName?.charAt(0) ?? "?"}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{user?.fullName ?? "—"}</h2>
                                        <p className="text-sm text-gray-500">{user?.email ?? "—"}</p>
                                        <button className="text-xs text-blue-600 font-medium mt-1 hover:text-blue-700">
                                            Change Profile Photo
                                        </button>
                                    </div>
                                </div>

                                {/* Connected Accounts */}
                                <section>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Connected Accounts</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <ConnectionCard
                                            provider="GitHub"
                                            connected={true}
                                            username="bawantha_dev"
                                            onAction={() => console.log("Disconnect GitHub")}
                                        />
                                    </div>
                                </section>

                                {/* Personal Details Form */}
                                <GlassCard className="p-6 space-y-4 bg-white border border-gray-200 shadow-sm">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name</label>
                                            <input type="text" defaultValue={user?.fullName ?? ""} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email</label>
                                            <input type="email" defaultValue={user?.email ?? ""} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors border border-gray-200">
                                            Update Details
                                        </button>
                                    </div>
                                </GlassCard>

                                <DangerZone />
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
                                            label="Weekly Email Digest"
                                            checked={notifications.emailDigest}
                                            onChange={(v) => setNotifications({ ...notifications, emailDigest: v })}
                                            description="Receive a summary of new recommended jobs every Monday."
                                        />
                                        <ToggleSwitch
                                            label="In-App Notifications"
                                            checked={notifications.inApp}
                                            onChange={(v) => setNotifications({ ...notifications, inApp: v })}
                                            description="Get real-time alerts within SkillSync."
                                        />
                                    </div>
                                    <div className="pt-4">
                                        <h3 className="text-sm font-bold text-purple-600 uppercase mb-4">Application Updates</h3>
                                        <ToggleSwitch
                                            label="Immediate Email Alerts"
                                            checked={notifications.appUpdates}
                                            onChange={(v) => setNotifications({ ...notifications, appUpdates: v })}
                                            description="Get notified immediately when a recruiter views your application."
                                        />
                                        <ToggleSwitch
                                            label="SMS Notifications"
                                            checked={notifications.sms}
                                            onChange={(v) => setNotifications({ ...notifications, sms: v })}
                                            description="Receive text messages for interview requests."
                                        />
                                    </div>
                                </GlassCard>
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
                                        label="Share Academic Data"
                                        checked={privacy.universityData}
                                        onChange={(v) => setPrivacy({ ...privacy, universityData: v })}
                                        description="Allow University of Colombo to view your Skill Gap Score for curriculum analysis."
                                    />
                                    <ToggleSwitch
                                        label="Anonymize My Data"
                                        checked={privacy.anonymize}
                                        onChange={(v) => setPrivacy({ ...privacy, anonymize: v })}
                                        description="Hide your name in University reports."
                                    />
                                </GlassCard>

                                <GlassCard className="p-6 bg-white border border-gray-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4">Profile Visibility</h3>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'public', label: 'Public', desc: 'Visible to all recruiters.' },
                                            { id: 'open', label: 'Open to Work', desc: 'Visible only to recruiters (Hidden from current employer).' },
                                            { id: 'private', label: 'Private', desc: 'Only visible to you.' }
                                        ].map(opt => (
                                            <label key={opt.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${privacy.visibility === opt.id
                                                ? "bg-blue-50 border-blue-500 shadow-sm"
                                                : "border-gray-200 hover:bg-gray-50"
                                                }`}>
                                                <input
                                                    type="radio"
                                                    name="visibility"
                                                    checked={privacy.visibility === opt.id}
                                                    onChange={() => setPrivacy({ ...privacy, visibility: opt.id })}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <div className={`text-sm font-bold ${privacy.visibility === opt.id ? "text-blue-600" : "text-gray-900"}`}>
                                                        {opt.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{opt.desc}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </GlassCard>

                                <div className="flex justify-start">
                                    <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 transition-colors">
                                        <Download size={14} /> Download My Data
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
