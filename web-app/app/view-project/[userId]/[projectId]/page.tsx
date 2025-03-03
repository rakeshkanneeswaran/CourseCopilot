"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getProjectDetailsFromS3,
  deleteProject,
  getContentForSpecificLanguage,
  getProjectDetails,
} from "./action";

interface ProjectDetailsUrl {
  name: string;
  url: string;
}

interface ProjectDetails {
  userId: string;
  title: string;
  createdAt: Date;
  id: string;
  status: string;
  projectMetaData: {
    projectId: string;
    id: string;
    generate_translate: boolean;
    generate_subtitle: boolean;
    languages: string[];
    generate_transcript: boolean;
    gender: string;
  };
}

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId;
  const userId = params.userId;
  const [projectDetailsUrl, setProjectDetailsUrl] = useState<
    ProjectDetailsUrl[]
  >([]);
  const [selectedVideo, setSelectedVideo] = useState<ProjectDetailsUrl | null>(
    null
  );
  const [projectDetails, setProjectDetails] = useState({} as ProjectDetails);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userId || !projectId) return;
      try {
        if (
          !projectId ||
          !userId ||
          Array.isArray(projectId) ||
          Array.isArray(userId)
        ) {
          return;
        }
        const response = await getProjectDetailsFromS3({ userId, projectId });
        if (response && response.length > 0) {
          setProjectDetailsUrl(response);
          setSelectedVideo(response[0]); // Default to first video
        }
      } catch (error) {
        console.error("Error fetching projects", error);
      }
    };
    fetchProjects();
  }, [userId, projectId]);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!userId || !projectId) return;
      try {
        if (
          !projectId ||
          !userId ||
          Array.isArray(projectId) ||
          Array.isArray(userId)
        ) {
          return;
        }
        const response = await getProjectDetails({ userId, projectId });
        if (response) setProjectDetails(response);
      } catch (error) {
        console.error("Error fetching project details", error);
      }
    };
    fetchProjectDetails();
  }, [userId, projectId]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6">
      <div className="flex w-full max-w-5xl space-x-6">
        {/* Left Side - Selected Video */}
        <div className="w-2/3">
          {selectedVideo && (
            <div className="bg-black p-4 rounded-lg shadow-lg">
              <video
                id="main-video"
                src={selectedVideo.url}
                className="w-full rounded-md"
                controls
              />
              <p className="text-lg font-semibold text-white mt-2">
                {selectedVideo.name}
              </p>
            </div>
          )}
        </div>

        {/* Right Side - Project Details */}
        <div className="w-1/3 bg-white p-4 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold text-black">Project Details</h1>
          <p className="text-gray-600">Title: {projectDetails.title}</p>
          <p className="text-gray-600">Status: {projectDetails.status}</p>
          <p className="text-gray-600">
            Created At: {projectDetails.createdAt?.toString()}
          </p>
          <p className="text-gray-600">
            Languages: {projectDetails.projectMetaData?.languages?.join(", ")}
          </p>

          {/* Language Selection */}
          <div className="mt-4">
            <label className="block text-black font-semibold mb-1">
              Select Language:
            </label>
            <select
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              onChange={async (e) => {
                if (
                  !projectId ||
                  !userId ||
                  Array.isArray(projectId) ||
                  Array.isArray(userId)
                ) {
                  return;
                }
                const newContentData = await getContentForSpecificLanguage({
                  projectId,
                  userId,
                  language: e.target.value,
                });

                setProjectDetailsUrl(newContentData);
              }}
            >
              {projectDetails.projectMetaData?.languages?.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Delete Button (Aligned to Right) */}
          <div className="flex justify-end mt-4">
            <button
              type="button"
              className="text-red-700 hover:text-white border border-red-700 hover:bg-red-800 font-medium rounded-lg text-sm px-5 py-2.5"
              onClick={async () => {
                if (
                  !projectId ||
                  !userId ||
                  Array.isArray(projectId) ||
                  Array.isArray(userId)
                ) {
                  return;
                }
                await deleteProject({ userId, projectId });
                router.push(`/dashboard/${userId}`);
              }}
            >
              Delete Project
            </button>
          </div>
        </div>
      </div>

      {/* Bottom - Video List */}
      <div className="w-full mt-6 overflow-x-auto flex space-x-4 p-4 bg-gray-200 rounded-lg">
        {projectDetailsUrl.map((eachFile) => (
          <div
            key={eachFile.name}
            className="bg-black p-4 rounded-lg shadow-lg cursor-pointer min-w-[200px]"
            onClick={() => setSelectedVideo(eachFile)}
          >
            <video src={eachFile.url} className="w-full rounded-md" />
            <p className="text-lg font-semibold text-white mt-2 text-center">
              {eachFile.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
