"use client";

import { motion } from "framer-motion";

interface ScoreGaugeProps {
    score: number;
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
    // Determine color based on score
    const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
    const label = score >= 80 ? "Excellent" : score >= 50 ? "Good" : "Needs Work";

    // SVG parameters
    const radius = 50;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    className="transform -rotate-90"
                >
                    <circle
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    <motion.circle
                        stroke={color}
                        strokeWidth={stroke}
                        strokeDasharray={circumference + " " + circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900 tracking-tighter">
                        {score}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1">
                        Current
                    </span>
                </div>
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-900">{label}</p>
        </div>
    );
}
