"use client";

import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText } from "lucide-react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CVUploaderProps {
    onUpload: (file: File) => void;
}

export function CVUploader({ onUpload }: CVUploaderProps) {
    const [file, setFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.length > 0) {
            const selectedFile = acceptedFiles[0];
            setFile(selectedFile);
            // Simulate/Trigger upload after a short delay for UX
            setTimeout(() => onUpload(selectedFile), 1500);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        maxFiles: 1,
    });

    return (
        <div className="w-full max-w-xl mx-auto">
            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={getRootProps().onClick}
                        onDrop={getRootProps().onDrop}
                        onDragEnter={getRootProps().onDragEnter}
                        onDragOver={getRootProps().onDragOver}
                        onDragLeave={getRootProps().onDragLeave}
                        className={`
              border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300
              flex flex-col items-center justify-center gap-4 group bg-white
              ${isDragActive
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                            }
            `}
                    >
                        <input {...getInputProps()} />
                        <div className={`p-4 rounded-full bg-gray-100 group-hover:bg-blue-50 transition-colors duration-300 ${isDragActive ? "bg-blue-100" : ""}`}>
                            <UploadCloud size={32} className={`text-gray-400 group-hover:text-blue-500 transition-colors duration-300 ${isDragActive ? "text-blue-500" : ""}`} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {isDragActive ? "Drop your CV here" : "Upload your existing CV"}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Drag & drop or click to browse (PDF only)
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="uploading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-between shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-red-50 text-red-500">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>

                        {/* Fake progress loader */}
                        <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                    className="h-full bg-blue-500 rounded-full"
                                />
                            </div>
                            <span className="text-xs text-blue-600 font-medium whitespace-nowrap">Analyzing...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
