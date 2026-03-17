"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkillData } from "@/types/analysis";

interface SkillRadarProps {
    data: SkillData[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value?: number }[]; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-xl">
                <p className="font-bold text-gray-900 mb-1">{label}</p>
                <p className="text-xs text-blue-600">You: {payload[0].value}</p>
                <p className="text-xs text-gray-500">Market: {payload[1].value}</p>
            </div>
        );
    }
    return null;
};

export function SkillRadar({ data }: SkillRadarProps) {
    return (
        <GlassCard className="h-[400px] flex flex-col items-center justify-center relative p-4 bg-white border border-gray-200 shadow-sm">
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs font-medium text-gray-700">You</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-xs font-medium text-gray-500">Market Standard</span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="rgba(0,0,0,0.1)" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

                    <Radar
                        name="You"
                        dataKey="A"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="#3b82f6"
                        fillOpacity={0.5}
                    />
                    <Radar
                        name="Market"
                        dataKey="B"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        fill="#9ca3af"
                        fillOpacity={0.2}
                    />
                    <Tooltip content={<CustomTooltip />} />
                </RadarChart>
            </ResponsiveContainer>
        </GlassCard>
    );
}
