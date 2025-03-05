"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getOriginalContent } from "./action";

interface VideoTranscriptMap {
  videoUrl: string;
  transcriptUrl: string;
}

interface VideoTranscript {
  id: number;
  start_time: string;
  end_time: string;
  text: string;
}

export default function Page() {
  const { projectId, userId } = useParams() as {
    projectId: string;
    userId: string;
  };

  const [selectedContent, setSelectedContent] =
    useState<VideoTranscriptMap | null>(null);
  const [projectContent, setProjectContent] = useState<VideoTranscriptMap[]>(
    []
  );
  const [videoIndex, setVideoIndex] = useState(0);
  const [selectedVideoTranscript, setSelectedVideoTranscript] =
    useState<string>("");

  useEffect(() => {
    if (!userId || !projectId) return;
    const fetchProjects = async () => {
      try {
        const content = await getOriginalContent({ userId, projectId });
        console.log("Original content:", content);
        if (content.length) {
          setProjectContent(content);
          setSelectedContent(content[0]);
        }
      } catch (error) {
        console.error("Error fetching projects", error);
      }
    };
    fetchProjects();
  }, [userId, projectId]);

  useEffect(() => {
    const fetchTranscript = async () => {
      const response = await fetch(selectedContent!.transcriptUrl);
      const data = (await response.json()) as VideoTranscript[];
      const transcript = transformTranscript({ transcriptArray: data });
      setSelectedVideoTranscript(transcript);
    };

    fetchTranscript();
  }, [selectedContent]);

  return (
    <div className="min-h-screen bg-[#faf8f4] flex flex-col items-center p-6">
      {/* Main Content Area */}
      <div className="flex w-full px-44 space-x-6">
        {/* Left Side (Video + Transcript) */}
        <div className="w-2/3 flex flex-col">
          {/* Video */}
          {selectedContent && (
            <div className="bg-black p-4 rounded-lg shadow-lg">
              <video
                src={selectedContent.videoUrl}
                className="w-full rounded-md"
                controls
              />
            </div>
          )}

          {/* Transcript */}
          <div className="mt-4 p-4 bg-[#eceae0]  text-black rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-3">Transcript</h2>
            {selectedVideoTranscript ? (
              <p className="p-2 rounded-md shadow-sm">
                {selectedVideoTranscript}
              </p>
            ) : (
              <p className="text-gray-500">No transcript available.</p>
            )}
          </div>
        </div>

        {/* Right Side (Empty for Future Content) */}
        <div className="w-1/3 bg-[#f5f3eb] rounded-lg shadow-lg flex items-center justify-center">
          <p className="text-gray-400 italic">Future content will be here</p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex space-x-5 mt-6">
        <button
          className="px-4 py-2 font-bold bg-[#c05e3c] text-white rounded-md disabled:opacity-50"
          disabled={videoIndex === 0}
          onClick={() => {
            setVideoIndex((prev) => prev - 1);
            setSelectedContent(projectContent[videoIndex - 1]);
          }}
        >
          Previous
        </button>

        <button
          className="px-4 py-2 font-bold bg-[#c05e3c] text-white rounded-md disabled:opacity-50"
          disabled={videoIndex >= projectContent.length - 1}
          onClick={() => {
            setVideoIndex((prev) => prev + 1);
            setSelectedContent(projectContent[videoIndex + 1]);
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function transformTranscript({
  transcriptArray,
}: {
  transcriptArray: VideoTranscript[];
}): string {
  try {
    let transformedTranscript = "";
    transcriptArray.forEach((transcript) => {
      transformedTranscript += `${transcript.text}`;
    });

    return transformedTranscript;
  } catch (error) {
    console.error("Error transforming transcript:", error);
    throw new Error("Failed to transform transcript");
  }
}
