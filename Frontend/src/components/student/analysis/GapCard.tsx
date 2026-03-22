"use client";

import { useEffect, useState } from "react";
import { SkillGap } from "@/types/analysis";
import { ArrowUpRight, Plus, Check } from "lucide-react";

interface GapCardProps {
    gap: SkillGap;
    onAdd?: (gap: SkillGap) => Promise<boolean | void>;
    initiallyAdded?: boolean;
    errorMessage?: string;
}

export function GapCard({ gap, onAdd, initiallyAdded = false, errorMessage }: GapCardProps) {
    const [isAdded, setIsAdded] = useState(initiallyAdded);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        setIsAdded(initiallyAdded);
    }, [initiallyAdded]);

    const handleAddToPath = async () => {
        if (isAdded || isAdding) return;
        try {
            setIsAdding(true);
            const result = await onAdd?.(gap);
            if (result !== false) {
                setIsAdded(true);
            }
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{gap.name}</h3>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{gap.category}</span>
                        <span className={`px-2 py-0.5 rounded font-bold ${gap.priority === "Critical" ? "bg-red-50 text-red-600 border border-red-100" :
                            gap.priority === "High" ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-yellow-50 text-yellow-600 border border-yellow-100"
                            }`}>
                            {gap.priority} Priority
                        </span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-2xl font-bold text-red-500">-{gap.missingPercent}%</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Skill Gap</div>
                </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                <div className="flex items-start gap-2">
                    <ArrowUpRight size={16} className="text-green-600 mt-0.5" />
                    <div>
                        <span className="text-xs font-bold text-green-700 block mb-0.5">Impact Strategy:</span>
                        <p className="text-sm text-gray-600 leading-snug">{gap.impact}</p>
                    </div>
                </div>
            </div>

            <button
                onClick={handleAddToPath}
                disabled={isAdded || isAdding}
                className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${isAdded
                    ? "bg-green-50 text-green-600 border border-green-200"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    }`}
            >
                {isAdded ? (
                    <>
                        <Check size={16} /> Added to Learning Path
                    </>
                ) : (
                    <>
                        <Plus size={16} /> {isAdding ? "Adding..." : "Add to Learning Path"}
                    </>
                )}
            </button>

            {errorMessage && (
                <p className="mt-2 text-xs text-red-600">{errorMessage}</p>
            )}
        </div>
    );
}
