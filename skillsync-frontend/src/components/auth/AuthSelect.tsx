"use client";

import { LucideIcon, ChevronDown } from "lucide-react";
import { UseFormRegisterReturn, FieldError } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
    value: string;
    label: string;
}

interface AuthSelectProps {
    label: string;
    options: Option[];
    register: UseFormRegisterReturn;
    error?: FieldError;
    icon?: LucideIcon;
}

export function AuthSelect({
    label,
    options,
    register,
    error,
    icon: Icon,
}: AuthSelectProps) {
    return (
        <div className="space-y-2 group">
            <label className="block text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">
                {label}
            </label>
            <div className="relative">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                        <Icon size={20} />
                    </div>
                )}

                <select
                    {...register}
                    defaultValue=""
                    className={`
                        w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 
                        text-gray-900 outline-none appearance-none
                        focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10
                        transition-all duration-300
                        ${Icon ? "pl-12" : ""}
                        ${error ? "border-red-500 focus:border-red-500" : ""}
                    `}
                >
                    <option value="" disabled className="bg-white text-gray-400">Select an option</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value} className="bg-white text-gray-900">
                            {option.label}
                        </option>
                    ))}
                </select>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    <ChevronDown size={20} />
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-red-400 mt-1 flex items-center gap-2"
                    >
                        <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
                        {error.message}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
