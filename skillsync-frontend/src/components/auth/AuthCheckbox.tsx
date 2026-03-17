"use client";

import { Check } from "lucide-react";
import { UseFormRegisterReturn, FieldError } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

interface AuthCheckboxProps {
    label: string | React.ReactNode;
    register: UseFormRegisterReturn;
    error?: FieldError;
}

export function AuthCheckbox({ label, register, error }: AuthCheckboxProps) {
    return (
        <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-1">
                    <input type="checkbox" className="peer sr-only" {...register} />
                    <div className="w-5 h-5 rounded border-2 border-gray-300 bg-gray-50 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-200" />
                    <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
                        <Check size={14} strokeWidth={3} />
                    </div>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors select-none">
                    {label}
                </span>
            </label>
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-red-400 pl-8"
                    >
                        {error.message}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
