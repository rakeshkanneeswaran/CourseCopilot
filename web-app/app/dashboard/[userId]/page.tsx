"use client";

interface Project {
  userId: string;
  title: string;
  description: string | null;
  id: string;
  status: string;
}

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProjectDetails } from "./action";

const DashboardPage = () => {
  const params = useParams();
  const userId = params.userId;
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!userId || Array.isArray(userId)) {
          return;
        }
        const response = await getProjectDetails({ userId });
        if (!response) {
          return;
        }
        setProjects(response);
      } catch (error) {
        console.error("Error fetching projects", error);
      }
    };
    fetchProjects();
  }, [userId]);

  return (
    <div className="min-h-screen bg-white text-lack p-6">
      <div className="text-2xl font-bold mb-4">Welcome, User {userId}</div>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600 transition"
        onClick={() => router.push(`/createProject/${userId}`)}
      >
        + Create New Project
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition flex justify-between items-start"
          >
            {/* Left Section: Title, Description, Project ID */}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {project.title}
              </h3>
              <p className="text-gray-600 mt-1">
                {project.description || "No description available"}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Project ID: <span className="font-medium">{project.id}</span>
              </p>
            </div>

            {/* Right Section: Status Badge */}
            <div className="self-end">
              <span
                className={`px-4 py-1 text-sm font-semibold rounded-full ${
                  project.status === "COMPLETED"
                    ? "bg-green-500 text-white"
                    : project.status === "IN_PROGRESS"
                    ? "bg-yellow-500 text-black"
                    : project.status === "FAILED"
                    ? "bg-gray-500 text-white"
                    : "bg-blue-500 text-white"
                }`}
              >
                {project.status.replace("_", " ")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
