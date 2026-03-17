import { StudentProfile } from "@/types/profile";
import { ProjectCard } from "./ProjectCard";
import { FolderGit2 } from "lucide-react";

interface ProjectsTabProps {
    profile: StudentProfile;
}

export function ProjectsTab({ profile }: ProjectsTabProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-50">
                        <FolderGit2 size={18} className="text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Featured Projects</h3>
                    <span className="text-sm text-gray-500 font-medium">
                        ({(profile.projects || []).length})
                    </span>
                </div>
                <button className="px-4 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 transition-colors shadow-sm">
                    + Add Project
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(profile.projects || []).map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
        </div>
    );
}
