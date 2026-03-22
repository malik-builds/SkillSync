"use client";

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
}

export function ToggleSwitch({ label, checked, onChange, description }: ToggleSwitchProps) {
    return (
        <div className="flex items-center justify-between py-3">
            <div>
                <div className="text-sm font-medium text-gray-900">{label}</div>
                {description && <div className="text-xs text-gray-500">{description}</div>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-blue-600" : "bg-gray-700"}`}
            >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? "translate-x-5" : ""}`} />
            </button>
        </div>
    );
}
