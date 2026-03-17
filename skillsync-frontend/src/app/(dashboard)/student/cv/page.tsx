"use client";

import { useState } from "react";
import { CVUploader } from "@/components/student/cv/CVUploader";
import { CVAnalysisDashboard } from "@/components/student/cv/CVAnalysisDashboard";
import { CVBuilder } from "@/components/student/cv/CVBuilder";
import { FileText, PenTool } from "lucide-react";

export default function CVPage() {
    const [mode, setMode] = useState<"auditor" | "architect">("auditor");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    // Initial State: User hasn't uploaded anything or chosen to build
    // If they upload -> Auditor Mode
    // If they click "Create New" -> Architect Mode

    const handleUpload = (file: File) => {
        setUploadedFile(file);
        setMode("auditor");
    };

    const handleReset = () => {
        setUploadedFile(null);
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8 pb-24">
            {/* Mode Toggle Header */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Career Optimization Station</h1>
                    <p className="text-gray-500">Analyze your existing CV or build a perfect one from scratch.</p>
                </div>

                <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setMode("auditor")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all font-medium ${mode === "auditor" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
                    >
                        <FileText size={16} /> Auditor
                    </button>
                    <button
                        onClick={() => setMode("architect")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all font-medium ${mode === "architect" ? "bg-purple-600 text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
                    >
                        <PenTool size={16} /> Architect
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {mode === "auditor" ? (
                    uploadedFile ? (
                        <CVAnalysisDashboard file={uploadedFile} onReset={handleReset} />
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                            <CVUploader onUpload={handleUpload} />
                            <div className="flex items-center gap-4 w-full max-w-md">
                                <div className="h-px bg-gray-200 flex-1" />
                                <span className="text-gray-400 text-sm font-medium">OR</span>
                                <div className="h-px bg-gray-200 flex-1" />
                            </div>
                            <button
                                onClick={() => setMode("architect")}
                                className="px-8 py-4 rounded-2xl bg-white border border-gray-200 text-gray-900 font-bold shadow-sm hover:shadow-md hover:border-blue-300 transition-all transform hover:scale-[1.01]"
                            >
                                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Create CV from Scratch</span>
                            </button>
                        </div>
                    )
                ) : (
                    <CVBuilder />
                )}
            </div>
        </div>
    );
}
