"use client";

import { useState, useEffect } from "react";
import { createProject } from "./action";
import { useRouter } from "next/navigation";
import { getUserId } from "@/app/action";

const ProjectsPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  const [userId, setUserId] = useState("");

  useEffect(() => {
    const fetchUserId = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const userId = await getUserId({ token });
      setUserId(userId);
    };
    fetchUserId();
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Project Submitted:\nTitle: ${title}\nDescription: ${description}`);
    setTitle("");
    setDescription("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <div className="w-full max-w-lg p-8 shadow-lg rounded-2xl border border-green-500">
        <h2 className="text-2xl font-bold text-green-600 mb-6 text-center">
          Create a New Project
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div>
            <label className="block text-green-700 font-medium mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400  text-black focus:outline-none"
              placeholder="Enter project title"
              required
            />
          </div>
          <div>
            <label className="block text-green-700 font-medium mb-1">
              Project Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 text-black focus:outline-none"
              placeholder="Enter project description"
              rows={4}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition duration-300"
            onClick={async () => {
              if (!userId || Array.isArray(userId)) {
                return;
              }
              const projectId = await createProject({
                title,
                description,
                userId,
              });
              router.push(`/build-project/${projectId}`);
            }}
          >
            Create Project
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProjectsPage;
