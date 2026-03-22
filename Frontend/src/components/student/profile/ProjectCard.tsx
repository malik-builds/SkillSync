import { Project } from "@/types/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { Github, ExternalLink, Code2 } from "lucide-react";
import Link from "next/link";

interface ProjectCardProps {
    project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
    return (
        <GlassCard className="p-0 overflow-hidden border border-gray-100 hover:border-blue-500/30 transition-all duration-300 group shadow-sm bg-white">
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {project.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 max-w-sm leading-relaxed">
                            {project.description || "No description available."}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {project.repoUrl && (
                            <Link
                                href={project.repoUrl}
                                target="_blank"
                                className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <Github size={18} />
                            </Link>
                        )}
                        {project.demoUrl && (
                            <Link
                                href={project.demoUrl}
                                target="_blank"
                                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                <ExternalLink size={18} />
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    {(project.techStack || []).map((tech, i) => (
                        <span
                            key={`${tech}-${i}`}
                            className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600"
                        >
                            {tech}
                        </span>
                    ))}
                    {(!project.techStack || project.techStack.length === 0) && (
                        <span className="text-xs text-gray-400 italic">No tech stack listed</span>
                    )}
                </div>

                {/* Project DNA — only show if data exists */}
                {project.dna && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <Code2 size={14} className="text-purple-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                                Project DNA (AI Analysis)
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                                    Complexity
                                </span>
                                <span
                                    className={`text-sm font-semibold ${project.dna.complexity === "High"
                                        ? "text-red-600"
                                        : project.dna.complexity === "Medium"
                                            ? "text-yellow-600"
                                            : "text-green-600"
                                        }`}
                                >
                                    {project.dna.complexity}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                                    Code Quality
                                </span>
                                <span className="text-sm font-semibold text-green-600">
                                    Grade {project.dna.quality}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                                    Top Lang
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-semibold text-blue-600">
                                        {project.dna.topLanguage}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {project.dna.topLanguagePercentage}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
