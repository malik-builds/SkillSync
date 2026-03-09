"use client";

import { AlertTriangle } from "lucide-react";

export function DangerZone() {
    return (
        <div className="mt-8 border border-red-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="bg-red-50 px-4 py-3 border-b border-red-100">
                <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
                    <AlertTriangle size={16} /> Danger Zone
                </h3>
            </div>
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-medium text-gray-900">Delete Account</h4>
                        <p className="text-xs text-gray-500">Once you delete your account, there is no going back.</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-red-50 text-red-600 font-bold text-xs hover:bg-red-600 hover:text-white transition-colors border border-red-200 hover:border-red-600">
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}
