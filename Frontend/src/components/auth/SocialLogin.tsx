"use client";

import { useState } from "react";

export function SocialLogin() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Or continue with</span>
                <div className="h-px bg-gray-200 flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm shadow-sm"
                >
                    <img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5" alt="Google" />
                    Google
                </button>
                <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm shadow-sm"
                >
                    <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.54-2.09-.5-3.14 0-.15.08-.3.17-.46.24-1.05.51-2.16.59-3.21-.44C3.89 17.5 3 13.78 6.07 10.95c1.12-1.04 2.57-1.12 3.8-.45.92.51 1.63.49 2.14 0 .97-.93 2.76-1.55 4.74-.29-2.06 1.45-1.6 4.96.48 6.22l-.18.35v.02c-.22.46-.5.91-.82 1.34-.34.46-.72.88-1.18 1.29-.12.11-.24.23-.36.33-.24.22-.43.39-.64.51M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25" />
                    </svg>
                    Apple
                </button>
            </div>
        </div>
    );
}
