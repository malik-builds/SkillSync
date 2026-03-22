"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";

interface SkillGrowthPoint {
    date: string;
    score: number;
    skills: number;
}

interface SkillGrowthChartProps {
    data?: SkillGrowthPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-emerald-100 rounded-xl shadow-lg px-4 py-3 text-sm min-w-[140px]">
            <p className="font-bold text-gray-600 mb-2">{label}</p>
            {payload.map((entry: any) => (
                <p key={entry.dataKey} className="font-semibold" style={{ color: entry.color }}>
                    {entry.dataKey === "score" ? "Match Score" : "Skills"}: {" "}
                    <span className="text-gray-800">
                        {entry.value}{entry.dataKey === "score" ? "%" : ""}
                    </span>
                </p>
            ))}
        </div>
    );
}

export function SkillGrowthChart({ data = [] }: SkillGrowthChartProps) {
    if (data.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center">
                <p className="text-gray-400 text-sm">Upload your CV to see skill growth data.</p>
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="skillsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />

                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        width={32}
                    />

                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4" }}
                    />

                    <ReferenceLine
                        x="Today"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        label={{ value: "Today", position: "insideTopRight", fill: "#10b981", fontSize: 10, fontWeight: 700 }}
                    />

                    <Area
                        type="monotone"
                        dataKey="skills"
                        stroke="#34d399"
                        strokeWidth={2}
                        fill="url(#skillsGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: "#34d399", stroke: "white", strokeWidth: 2 }}
                        name="skills"
                    />

                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#scoreGrad)"
                        dot={(props: any) => {
                            if (props.payload?.date !== "Today") return <g key={props.key} />;
                            return <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill="#10b981" stroke="white" strokeWidth={2} />;
                        }}
                        activeDot={{ r: 5, fill: "#10b981", stroke: "white", strokeWidth: 2 }}
                        name="score"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
