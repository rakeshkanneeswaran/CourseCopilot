"use client";

import { useState, useEffect } from "react";
import { createProject, uploadProjectThumbnail } from "./action";
import { useRouter } from "next/navigation";
import { getUserId } from "@/app/action";
import Image from "next/image";

const ProjectsPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false); // Loading state
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || Array.isArray(userId)) {
      return;
    }

    setLoading(true); // Start loading

    try {
      const projectId = await createProject({ title, description, userId });

      if (thumbnail) {
        await uploadProjectThumbnail({ userId, projectId, thumbnail });
      }

      router.push(`/build-project/${projectId}`);
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setLoading(false); // Stop loading after completion
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f4]">
      <div className="w-full max-w-lg p-8 shadow-lg rounded-2xl bg-[#faf8f4] border border-[#929088]">
        <h2 className="text-2xl font-bold text-black mb-6 text-center">
          Create a New Play List
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div>
            <label className="block text-black font-medium mb-1">
              Playlist Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#f1f1ec] text-black focus:outline-none"
              placeholder="Enter project title"
              required
              disabled={loading} // Disable input while loading
            />
          </div>
          <div>
            <label className="block text-black font-medium mb-1">
              Playlist Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#f1f1ec] text-black focus:outline-none"
              placeholder="Enter project description"
              rows={4}
              required
              disabled={loading} // Disable input while loading
            />
          </div>
          <div>
            <label className="block text-black font-medium mb-1">
              Playlist Thumbnail
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#f1f1ec] text-black focus:outline-none"
              disabled={loading} // Disable file upload while loading
            />
            {thumbnail && (
              <div className="mt-4">
                <Image
                  src={URL.createObjectURL(thumbnail)}
                  alt="thumbnail"
                  width={300}
                  height={200}
                  className="rounded-lg object-cover"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`w-full font-bold py-2 rounded-lg transition duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#c05e3a] hover:bg-[#914529] text-white"
            }`}
            disabled={loading} // Disable button while loading
          >
            {loading ? "Creating..." : "Create Project"}{" "}
            {/* Show loading text */}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProjectsPage;
