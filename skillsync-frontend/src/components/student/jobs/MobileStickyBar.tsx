"use client";

import { Send } from "lucide-react";

export function MobileStickyBar() {
    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200 lg:hidden z-50">
            <button className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-colors">
                <Send size={18} /> Easy Apply (Verified)
            </button>
        </div>
    );
}
