"use client";

import ProjectTable from "@/app/components/projectTable";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProjectDetails } from "./action";
import { getUserId } from "../action";

interface Project {
  userId: string;
  title: string;
  createdAt: Date;
  id: string;
  status: string;
}

const DashboardPage = () => {
  const [userId, setUserId] = useState<string>("");
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchUserId = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login-page");
        return;
      }

      const userId = await getUserId({ token });
      setUserId(userId);
    };
    fetchUserId();
  }, [router]);

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
    <div className="min-h-screen bg-white text-black p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Welcome, User {userId}</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-slate-700"
          onClick={() => router.push(`/create-project/${userId}`)}
        >
          Create New Project
        </button>
      </div>

      {/* Project Table */}
      <div className="w-full overflow-x-auto">
        <ProjectTable projectDetails={projects} />
      </div>
    </div>
  );
};

export default DashboardPage;
