"use client";

import { LucideIcon, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { UseFormRegisterReturn, FieldError } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

interface AuthInputProps {
    label: string;
    type?: string;
    placeholder?: string;
    register: UseFormRegisterReturn;
    error?: FieldError;
    icon?: LucideIcon;
    className?: string;
    inputClassName?: string;
    labelClassName?: string;
    active?: boolean;
}

export function AuthInput({
    label,
    type = "text",
    placeholder,
    register,
    error,
    icon: Icon,
    className = "",
    inputClassName = "",
    labelClassName = "",
    active = false,
}: AuthInputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className={`space-y-2 group ${className}`}>
            <label className={`block text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors ${labelClassName}`}>
                {label}
            </label>
            <div className="relative">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                        <Icon size={20} />
                    </div>
                )}

                <input
                    type={inputType}
                    placeholder={placeholder}
                    {...register}
                    suppressHydrationWarning
                    className={`
                        w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 
                        text-gray-900 placeholder-gray-400 outline-none
                        focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10
                        transition-all duration-300
                        ${Icon ? "pl-12" : ""}
                        ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : ""}
                        ${inputClassName}
                    `}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors p-1"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
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
