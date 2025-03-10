"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getOriginalContent,
  getContentForDifferentLanguage,
  getProjectDetails,
} from "./action";

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

  const [selectedLanguage, setSelectedLanguage] = useState<string>("Original");
  const [availableLanguage, setAvailableLanguage] = useState<string[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [messageFromIntellignece, setMessageFromIntellignece] =
    useState<string[]>();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (ws) {
      ws.send(inputValue);
    }
    setInputValue("");
  };

  useEffect(() => {
    const socket = new WebSocket(
      `ws://localhost:3004/ws/${userId}/${projectId}`
    );
    socket.onopen = () => {
      console.log("Connected to server");
    };
    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      setMessageFromIntellignece((prev) => {
        return [...(prev || []), data.text];
      });
    };
    setWs(socket);
    return () => {
      socket.close();
    };
  }, [projectId, userId]);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const projectDetails = await getProjectDetails({ userId, projectId });
        if (projectDetails.projectMetaData.languages.length > 0) {
          setAvailableLanguage([
            ...projectDetails.projectMetaData.languages,
            "Original",
          ]);
        }
      } catch (error) {
        console.error("Error fetching project details", error);
      }
    };

    if (userId && projectId) {
      fetchProjectDetails();
    }
  }, [userId, projectId]);

  useEffect(() => {
    if (!userId || !projectId) return;
    const fetchProjects = async () => {
      try {
        console.log(projectId, userId);
        const content = await getOriginalContent({ userId, projectId });
        console.log("Content fetched");
        console.log(content);
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
    const setContentLanguage = async () => {
      try {
        let content;
        if (selectedLanguage === "Original") {
          content = await getOriginalContent({ userId, projectId });
        } else {
          content = await getContentForDifferentLanguage({
            userId,
            projectId,
            languageName: selectedLanguage,
          });
        }

        if (content.length) {
          setProjectContent(content);
          setSelectedContent(content[0]);
        }
      } catch (error) {
        console.error("Error fetching content for different language", error);
      }
    };

    if (userId && projectId) {
      setContentLanguage();
    }
  }, [selectedLanguage, userId, projectId]);

  useEffect(() => {
    const fetchTranscript = async () => {
      if (!selectedContent || !selectedContent.transcriptUrl) {
        return;
      }
      const response = await fetch(selectedContent!.transcriptUrl);
      const data = (await response.json()) as VideoTranscript[];
      const transcript = transformTranscript({ transcriptArray: data });
      setSelectedVideoTranscript(transcript);
    };

    fetchTranscript();
  }, [selectedContent]);

  return (
    <div className="w-screen h-screen bg-[#faf8f4] flex flex-col items-center p-6  overflow-y-auto">
      {/* Main Content Area */}
      <div className="flex w-full px-20 space-x-6">
        {/* Left Side (Video + Transcript) */}
        <div className="w-2/3 flex flex-col">
          {/* Video */}
          {selectedContent && (
            <div className="bg-black p-1 rounded-lg shadow-lg flex justify-center">
              <video
                src={selectedContent.videoUrl}
                className="w-[900px] h-[450px] rounded-md"
                controls
              />
            </div>
          )}

          {/* Transcript */}
          <div className="mt-4 p-4 bg-[#eceae0] text-black rounded-lg shadow-lg max-h-60 overflow-y-auto">
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

        {/* Right Side (AI chatboth) */}
        <div className="w-1/3 bg-[#f5f3eb] rounded-lg shadow-lg flex flex-col p-4">
          <p className="text-gray-400 italic text-center">Ask your doubt</p>

          {/* Messages appear from the top with spacing */}
          <div className="w-full h-72 p-2 text-black rounded-lg overflow-y-auto flex flex-col space-y-2">
            {messageFromIntellignece?.map((message, index) => (
              <p key={index} className="p-2 bg-[#e7e5db] rounded-md shadow-sm">
                {message}
              </p>
            ))}
          </div>

          {/* Input box at the bottom */}
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col items-center pt-64 gap-2 mt-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="border border-gray-300 text-black rounded px-3 py-2 w-full"
              placeholder="Enter something"
            />
            <button
              type="submit"
              className="bg-[#c05e3c] hover:bg-[#a04d30] text-white px-4 py-2 rounded "
            >
              Submit
            </button>
          </form>
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

        <button
          className="px-4 py-2 font-bold bg-[#c05e3c] text-white rounded-md"
          onClick={() => setShowOptions(true)}
        >
          Select Language
        </button>
      </div>

      {/* Language Selection Modal */}
      {showOptions && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3 text-center">
            <h2 className="text-lg font-semibold mb-4">Select Language</h2>
            {availableLanguage.map((language) => (
              <button
                key={language}
                className="block w-full py-2 px-4 my-2 bg-[#c05e3c] text-white rounded-md hover:bg-[#a04d30]"
                onClick={() => {
                  setSelectedLanguage(language);
                  setShowOptions(false);
                }}
              >
                {language}
              </button>
            ))}
            <button
              className="mt-4 px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
              onClick={() => setShowOptions(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function transformTranscript({
  transcriptArray,
}: {
  transcriptArray: VideoTranscript[];
}): string {
  try {
    return transcriptArray.map((transcript) => transcript.text).join(" ");
  } catch (error) {
    console.error("Error transforming transcript:", error);
    throw new Error("Failed to transform transcript");
  }
}
