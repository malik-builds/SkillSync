"use client";

import { CVTemplate } from "@/types/cv";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface TemplateSelectorProps {
    selectedTemplate: CVTemplate;
    onSelect: (template: CVTemplate) => void;
}

export function TemplateSelector({ selectedTemplate, onSelect }: TemplateSelectorProps) {
    const templates: { id: CVTemplate; name: string; description: string; color: string }[] = [
        {
            id: "minimalist",
            name: "Tech Minimalist",
            description: "Clean, monospaced fonts. Best for Developers.",
            color: "bg-gray-600",
        },
        {
            id: "corporate",
            name: "Corporate",
            description: "Traditional serif fonts. Best for Enterprise/Banks.",
            color: "bg-blue-600",
        },
        {
            id: "creative",
            name: "Creative",
            description: "Modern layout with accent colors. Best for UI/UX.",
            color: "bg-purple-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {templates.map((template) => (
                <motion.button
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(template.id)}
                    className={`relative p-4 rounded-xl text-left transition-all duration-300 border-2 shadow-sm ${selectedTemplate === template.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                        }`}
                >
                    {selectedTemplate === template.id && (
                        <div className="absolute top-2 right-2 text-blue-600">
                            <CheckCircle2 size={18} />
                        </div>
                    )}

                    <div className={`w-full h-24 rounded-lg mb-3 ${template.color} opacity-80`} />

                    <h3 className="font-bold text-gray-900 text-sm">{template.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                </motion.button>
            ))}
        </div>
    );
}
