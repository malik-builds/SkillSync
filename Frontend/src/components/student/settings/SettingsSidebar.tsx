"use client";

import { UserCircle, Bell, Shield, Key } from "lucide-react";

interface SettingsSidebarProps {
    activeTab: string;
    onSelect: (tab: string) => void;
}

const TABS = [
    { id: 'account', label: 'My Account', icon: UserCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
    { id: 'security', label: 'Login & Security', icon: Key },
];

export function SettingsSidebar({ activeTab, onSelect }: SettingsSidebarProps) {
    return (
        <nav className="space-y-1">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onSelect(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === tab.id
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                >
                    <tab.icon size={18} />
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}
