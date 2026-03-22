"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DangerZoneProps {
    onDelete: () => void;
    deleting?: boolean;
}

export function DangerZone({ onDelete, deleting = false }: DangerZoneProps) {
    const [showModal, setShowModal] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const isReady = confirmText === "DELETE";

    const handleConfirm = () => {
        onDelete();
    };

    return (
        <div className="mt-8 border border-red-200 rounded-xl overflow-hidden bg-white shadow-sm relative">
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
                    <button
                        onClick={() => setShowModal(true)}
                        disabled={deleting}
                        className="px-4 py-2 rounded-lg bg-red-50 text-red-600 font-bold text-xs hover:bg-red-600 hover:text-white transition-colors border border-red-200 hover:border-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {deleting ? "Deleting..." : "Delete Account"}
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
                                <Trash2 size={16} /> Delete Account
                            </h3>
                            <button onClick={() => setShowModal(false)} disabled={deleting} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-50"><X size={14} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-sm text-gray-700">
                                Are you sure you want to permanently delete your account and <strong>ALL</strong> associated profile data?
                            </p>
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                <p className="text-[11px] text-red-700 font-semibold mb-2">
                                    Warning: This action cannot be undone. All your applications, conversations, and resumes will be deleted immediately.
                                </p>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Type <span className="text-red-600 font-bold select-all">DELETE</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    disabled={deleting}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 px-5 pb-5">
                            <button onClick={() => setShowModal(false)} disabled={deleting} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50">Cancel</button>
                            <button onClick={handleConfirm} disabled={!isReady || deleting} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                                <Trash2 size={14} /> {deleting ? "Deleting..." : "Delete Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
