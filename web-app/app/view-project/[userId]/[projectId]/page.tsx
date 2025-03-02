"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProjectDetailsFromS3, deleteProject } from "./action";
import { PlayCircle, PauseCircle } from "lucide-react";

interface ProjectDetailsUrl {
  name: string;
  url: string;
}

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId;
  const userId = params.userId;
  const [projectDetailsUrl, setProjectDetailsUrl] = useState<
    ProjectDetailsUrl[]
  >([]);
  const [playing, setPlaying] = useState<{ [key: string]: boolean }>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (
          !userId ||
          !projectId ||
          Array.isArray(userId) ||
          Array.isArray(projectId)
        ) {
          return;
        }
        const response = await getProjectDetailsFromS3({ userId, projectId });
        if (!response) {
          return;
        }
        setProjectDetailsUrl(response);
      } catch (error) {
        console.error("Error fetching projects", error);
      }
    };
    fetchProjects();
  }, [userId, projectId]);

  const handlePlayPause = (videoId: string) => {
    const videoElement = document.getElementById(videoId) as HTMLVideoElement;
    if (videoElement) {
      if (videoElement.paused) {
        videoElement.play();
        setPlaying((prev) => ({ ...prev, [videoId]: true }));
      } else {
        videoElement.pause();
        setPlaying((prev) => ({ ...prev, [videoId]: false }));
      }
    }
  };

  const handleDelete = async () => {
    if (
      !userId ||
      !projectId ||
      Array.isArray(userId) ||
      Array.isArray(projectId)
    ) {
      return;
    }
    await deleteProject({ userId, projectId });
    setIsConfirmModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center p-6">
      {/* Delete Button */}
      <button
        onClick={() => setIsConfirmModalOpen(true)}
        className="bg-red-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-600 transition"
      >
        Delete Project
      </button>

      <h1 className="text-3xl font-bold text-black mb-6">🎥 Project Videos</h1>
      <div className="w-full max-w-2xl space-y-6">
        {projectDetailsUrl.map((eachFile) => (
          <div
            key={eachFile.name}
            className="bg-black p-4 rounded-lg shadow-lg"
          >
            <div className="relative">
              <video
                id={eachFile.name}
                src={eachFile.url}
                className="w-full rounded-md"
              />
              <button
                onClick={() => handlePlayPause(eachFile.name)}
                className="absolute bottom-2 right-2 bg-green-600 text-white p-2 rounded-full shadow-md"
              >
                {playing[eachFile.name] ? (
                  <PauseCircle size={24} />
                ) : (
                  <PlayCircle size={24} />
                )}
              </button>
            </div>
            <p className="text-lg font-semibold text-white mb-2">
              {eachFile.name}
            </p>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold">Are you sure?</h2>
            <p className="text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold text-green-600">
              Project Deleted
            </h2>
            <p className="text-gray-600 mb-4">
              The project has been successfully deleted.
            </p>
            <button
              onClick={() => router.push(`/dashboard/${userId}`)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
