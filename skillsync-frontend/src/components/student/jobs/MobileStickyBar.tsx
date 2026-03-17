"use client";

import { Send } from "lucide-react";

export function MobileStickyBar() {
    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0B]/80 backdrop-blur-xl border-t border-white/10 lg:hidden z-50">
            <button className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                <Send size={18} /> Easy Apply (Verified)
            </button>
        </div>
    );
}
